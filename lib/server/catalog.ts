/**
 * Danh mục sản phẩm đọc từ cơ sở dữ liệu (giá và tồn kho là nguồn duy nhất phía server).
 *
 * Mô hình đa người bán: mọi sản phẩm thuộc một cửa hàng (`store_id`). Sản phẩm của cửa hàng KHÔNG ở
 * trạng thái 'active' (chờ duyệt / bị tạm khóa / bị từ chối) sẽ KHÔNG xuất hiện trên sàn, kể cả khi
 * bản ghi sản phẩm vẫn `active = 1`.
 *
 * Vì sao dùng LEFT JOIN: sản phẩm cũ chưa kịp gán cửa hàng (store_id NULL) vẫn phải hiển thị — chúng
 * thuộc cửa hàng của sàn. Việc gán này do lib/server/seed.ts thực hiện khi khởi động.
 *
 * Không tin dữ liệu client: khi tạo/sửa sản phẩm, `store_id` LUÔN lấy từ tham số của phía gọi (đã
 * được API xác định từ phiên đăng nhập), không bao giờ lấy từ body request.
 */

import crypto from 'crypto';
import { execute, executeCount, query, queryOne } from './db';
import type { CatalogProduct, StoreStatus } from '@/lib/orders/types';

interface ProductRow {
  id: string;
  name: string;
  village_id: string;
  village_name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  artisan_name: string;
  material: string | null;
  dimensions: string | null;
  description: string | null;
  weight_g: number | null;
  preparation_days: number | null;
  store_id: string | null;
  store_name: string | null;
  store_slug: string | null;
  store_status: string | null;
  warehouse_id: string | null;
  warehouse_name: string | null;
  active: number;
}

const PRODUCT_SELECT = `
  SELECT p.id, p.name, p.village_id, p.village_name, p.category, p.price, p.stock, p.image,
         p.artisan_name, p.material, p.dimensions, p.description, p.weight_g, p.preparation_days,
         p.store_id, p.warehouse_id, p.active, s.name AS store_name, s.slug AS store_slug, s.status AS store_status,
         w.name AS warehouse_name
  FROM products p
  LEFT JOIN stores s ON s.id = p.store_id
  LEFT JOIN warehouses w ON w.id = p.warehouse_id`;

export function toProduct(row: ProductRow): CatalogProduct {
  return {
    id: row.id,
    name: row.name,
    villageId: row.village_id,
    villageName: row.village_name,
    category: row.category,
    price: Number(row.price),
    stock: Number(row.stock),
    image: row.image,
    artisanName: row.artisan_name,
    material: row.material,
    dimensions: row.dimensions,
    description: row.description,
    weightG: row.weight_g == null ? null : Number(row.weight_g),
    preparationDays: row.preparation_days == null ? null : Number(row.preparation_days),
    // Sản phẩm chưa gán cửa hàng thuộc về sàn (xem ensurePlatformStore).
    storeId: row.store_id || 'platform',
    storeName: row.store_name || 'Lang Thang — Sàn di sản',
    storeSlug: row.store_slug || null,
    storeStatus: ((row.store_status || 'active') as StoreStatus),
    warehouseId: row.warehouse_id || null,
    warehouseName: row.warehouse_name || null,
  };
}

/** Sản phẩm đang bán công khai trên sàn. */
export async function listProducts(): Promise<CatalogProduct[]> {
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.active = 1 AND (p.store_id IS NULL OR s.status = 'active')
     ORDER BY p.name`
  );
  return rows.map(toProduct);
}

/**
 * Một sản phẩm ĐANG BÁN ĐƯỢC (dùng cho luồng đặt hàng).
 * Cửa hàng bị tạm khóa/từ chối coi như sản phẩm không còn bán.
 */
export async function getProduct(id: string): Promise<CatalogProduct | null> {
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.id = ? AND p.active = 1 AND (p.store_id IS NULL OR s.status = 'active')`,
    [id]
  );
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Map<string, CatalogProduct>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<string, CatalogProduct>();
  if (unique.length === 0) return map;

  for (const id of unique) {
    const rows = await query<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = ?`, [id]);
    if (rows[0]) map.set(id, toProduct(rows[0]));
  }
  return map;
}

/** Toàn bộ sản phẩm của một cửa hàng, kể cả đang ẩn (dành cho người bán/quản trị). */
export async function listStoreProducts(storeId: string): Promise<(CatalogProduct & { active: boolean })[]> {
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT} WHERE p.store_id = ? ORDER BY p.updated_at DESC`,
    [storeId]
  );
  return rows.map((row) => ({ ...toProduct(row), active: Number(row.active) === 1 }));
}

export async function countStoreProducts(storeId: string): Promise<{ total: number; active: number }> {
  const row = await queryOne<{ total: number; active: number }>(
    `SELECT COUNT(*) AS total, SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) AS active
     FROM products WHERE store_id = ?`,
    [storeId]
  );
  return { total: Number(row?.total || 0), active: Number(row?.active || 0) };
}

/** Lấy một sản phẩm kèm thông tin chủ sở hữu để kiểm tra quyền (kể cả sản phẩm đang ẩn). */
export async function getProductForOwner(
  productId: string
): Promise<(CatalogProduct & { active: boolean; storeOwnerEmail: string | null }) | null> {
  const row = await queryOne<ProductRow & { store_owner_email: string | null }>(
    `SELECT p.id, p.name, p.village_id, p.village_name, p.category, p.price, p.stock, p.image,
            p.artisan_name, p.material, p.dimensions, p.description, p.weight_g, p.preparation_days,
            p.store_id, p.warehouse_id, p.active, s.name AS store_name, s.slug AS store_slug, s.status AS store_status,
            s.owner_email AS store_owner_email, w.name AS warehouse_name
     FROM products p
     LEFT JOIN stores s ON s.id = p.store_id
     LEFT JOIN warehouses w ON w.id = p.warehouse_id
     WHERE p.id = ?`,
    [productId]
  );
  if (!row) return null;
  return { ...toProduct(row), active: Number(row.active) === 1, storeOwnerEmail: row.store_owner_email };
}

import { getDefaultWarehouse, getWarehouseById } from './warehouses';

/** Danh sách sản phẩm của một cửa hàng công khai (theo ID hoặc Slug). */
export async function listProductsByStore(storeIdOrSlug: string): Promise<CatalogProduct[]> {
  const rows = await query<ProductRow>(
    `${PRODUCT_SELECT}
     WHERE p.active = 1 AND (p.store_id = ? OR s.slug = ?) AND (s.status = 'active' OR s.status IS NULL)
     ORDER BY p.name`,
    [storeIdOrSlug, storeIdOrSlug]
  );
  return rows.map(toProduct);
}

export interface ProductWriteInput {
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  category: string;
  image: string;
  villageId: string;
  villageName: string;
  artisanName?: string | null;
  material?: string | null;
  dimensions?: string | null;
  weightG?: number | null;
  preparationDays?: number | null;
  warehouseId?: string | null;
  active?: boolean;
}

/** Tạo sản phẩm cho một cửa hàng. `storeId` do phía gọi xác định từ phiên đăng nhập. */
export async function createStoreProduct(
  storeId: string,
  input: ProductWriteInput
): Promise<CatalogProduct & { active: boolean }> {
  const id = `prd_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  let warehouseId: string | null = null;
  if (input.warehouseId) {
    const wh = await getWarehouseById(input.warehouseId, storeId);
    if (!wh) {
      throw new Error('Kho hàng xuất hàng không thuộc cửa hàng của bạn.');
    }
    warehouseId = wh.id;
  }
  if (!warehouseId) {
    const defaultWh = await getDefaultWarehouse(storeId);
    warehouseId = defaultWh?.id || null;
  }

  await execute(
    `INSERT INTO products (id, name, village_id, village_name, category, price, stock, image, artisan_name,
       material, dimensions, description, weight_g, preparation_days, store_id, warehouse_id, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      input.name,
      input.villageId,
      input.villageName,
      input.category,
      input.price,
      input.stock,
      input.image,
      input.artisanName || input.name,
      input.material || null,
      input.dimensions || null,
      input.description || null,
      input.weightG ?? null,
      input.preparationDays ?? null,
      storeId,
      warehouseId,
      input.active === false ? 0 : 1,
      now,
      now,
    ]
  );

  const created = await getProductForOwner(id);
  if (!created) throw new Error('Không đọc lại được sản phẩm vừa tạo.');
  return created;
}

/**
 * Cập nhật sản phẩm của cửa hàng. `WHERE id = ? AND store_id = ?` buộc quyền sở hữu ở tầng dữ liệu:
 * kể cả khi tầng trên có sai sót, người bán cũng không thể sửa sản phẩm của cửa hàng khác.
 */
export async function updateStoreProduct(
  storeId: string,
  productId: string,
  patch: Partial<ProductWriteInput>
): Promise<boolean> {
  const current = await queryOne<ProductRow>(`${PRODUCT_SELECT} WHERE p.id = ? AND p.store_id = ?`, [
    productId,
    storeId,
  ]);
  if (!current) return false;

  let warehouseId = current.warehouse_id;
  if (patch.warehouseId !== undefined) {
    if (patch.warehouseId) {
      const wh = await getWarehouseById(patch.warehouseId, storeId);
      if (!wh) {
        throw new Error('Kho hàng xuất hàng không thuộc cửa hàng của bạn.');
      }
      warehouseId = wh.id;
    } else {
      const defaultWh = await getDefaultWarehouse(storeId);
      warehouseId = defaultWh?.id || null;
    }
  }

  const now = new Date().toISOString();
  const affected = await executeCount(
    `UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, image = ?,
       village_id = ?, village_name = ?, material = ?, dimensions = ?, weight_g = ?, preparation_days = ?,
       warehouse_id = ?, active = ?, updated_at = ?
     WHERE id = ? AND store_id = ?`,
    [
      patch.name ?? current.name,
      patch.description === undefined ? current.description : patch.description || null,
      patch.price ?? Number(current.price),
      patch.stock ?? Number(current.stock),
      patch.category ?? current.category,
      patch.image ?? current.image,
      patch.villageId ?? current.village_id,
      patch.villageName ?? current.village_name,
      patch.material === undefined ? current.material : patch.material || null,
      patch.dimensions === undefined ? current.dimensions : patch.dimensions || null,
      patch.weightG === undefined ? current.weight_g : patch.weightG,
      patch.preparationDays === undefined ? current.preparation_days : patch.preparationDays,
      warehouseId,
      patch.active === undefined ? Number(current.active) : patch.active ? 1 : 0,
      now,
      productId,
      storeId,
    ]
  );
  return affected > 0;
}

/**
 * Ngừng bán sản phẩm (ẩn khỏi sàn) — KHÔNG xoá bản ghi để giữ nguyên lịch sử đơn hàng đã bán.
 */
export async function archiveStoreProduct(storeId: string, productId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const affected = await executeCount(
    `UPDATE products SET active = 0, updated_at = ? WHERE id = ? AND store_id = ?`,
    [now, productId, storeId]
  );
  return affected > 0;
}
