/**
 * Quản lý KHO HÀNG / ĐIỂM XUẤT HÀNG (Nhiệm vụ 3 — Marketplace đa người bán).
 *
 * Nguyên tắc:
 *  - Mỗi shop có thể có nhiều kho: Kho chính, xưởng sản xuất, kho phụ, điểm lấy hàng.
 *  - Mỗi shop LUÔN có ít nhất 1 kho mặc định (tự động tạo từ địa chỉ của shop).
 *  - Người bán CHỈ quản lý kho thuộc sở hữu của shop mình (store_id = ?).
 *  - Khi một kho ngừng hoạt động, kiểm tra các sản phẩm đang gắn với kho đó.
 */

import crypto from 'crypto';
import { execute, executeCount, query, queryOne, transaction } from './db';
import { HttpError } from './http';
import type { Store, Warehouse } from '@/lib/orders/types';

interface WarehouseRow {
  id: string;
  store_id: string;
  name: string;
  address_text: string;
  address_note: string | null;
  lat: number | null;
  lng: number | null;
  contact_name: string | null;
  phone: string | null;
  is_default: number;
  active: number;
  created_at: string;
  updated_at: string;
}

export function toWarehouse(row: WarehouseRow): Warehouse {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    addressText: row.address_text,
    addressNote: row.address_note,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    contactName: row.contact_name,
    phone: row.phone,
    isDefault: Boolean(row.is_default),
    active: Boolean(row.active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Lấy tất cả kho của một shop (bao gồm kho đang hoạt động và tạm dừng). */
export async function listWarehousesByStore(storeId: string): Promise<Warehouse[]> {
  const rows = await query<WarehouseRow>(
    `SELECT * FROM warehouses WHERE store_id = ? ORDER BY is_default DESC, created_at ASC`,
    [storeId]
  );
  return rows.map(toWarehouse);
}

/** Lấy kho theo ID, kiểm tra quyền sở hữu storeId nếu được truyền vào. */
export async function getWarehouseById(id: string, storeId?: string): Promise<Warehouse | null> {
  const sql = storeId
    ? `SELECT * FROM warehouses WHERE id = ? AND store_id = ?`
    : `SELECT * FROM warehouses WHERE id = ?`;
  const params = storeId ? [id, storeId] : [id];
  const row = await queryOne<WarehouseRow>(sql, params);
  return row ? toWarehouse(row) : null;
}

/** Lấy kho mặc định của shop. */
export async function getDefaultWarehouse(storeId: string): Promise<Warehouse | null> {
  const row = await queryOne<WarehouseRow>(
    `SELECT * FROM warehouses WHERE store_id = ? AND is_default = 1 AND active = 1 LIMIT 1`,
    [storeId]
  );
  if (row) return toWarehouse(row);

  // Dự phòng: lấy kho hoạt động đầu tiên
  const fallback = await queryOne<WarehouseRow>(
    `SELECT * FROM warehouses WHERE store_id = ? AND active = 1 ORDER BY created_at ASC LIMIT 1`,
    [storeId]
  );
  return fallback ? toWarehouse(fallback) : null;
}

/** Đảm bảo shop có ít nhất 1 kho mặc định (tạo từ hồ sơ shop nếu chưa có). */
export async function ensureDefaultWarehouseForStore(store: Store): Promise<Warehouse> {
  const existing = await getDefaultWarehouse(store.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const id = `wh_${crypto.randomUUID()}`;
  const name = `Kho chính — ${store.name}`;
  const addressText = store.addressText || 'Hà Nội, Việt Nam';

  await execute(
    `INSERT INTO warehouses (id, store_id, name, address_text, address_note, lat, lng, contact_name, phone, is_default, active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?)`,
    [
      id,
      store.id,
      name,
      addressText,
      store.addressNote || null,
      store.lat,
      store.lng,
      store.contactName || null,
      store.phone || null,
      now,
      now,
    ]
  );

  const created = await getWarehouseById(id);
  if (!created) throw new Error('Không tạo được kho mặc định cho cửa hàng.');
  return created;
}

export interface CreateWarehouseInput {
  storeId: string;
  name: string;
  addressText: string;
  addressNote?: string | null;
  lat?: number | null;
  lng?: number | null;
  contactName?: string | null;
  phone?: string | null;
  isDefault?: boolean;
}

/** Thêm kho mới cho shop. */
export async function createWarehouse(input: CreateWarehouseInput): Promise<Warehouse> {
  const id = `wh_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const existingCount = await executeCount(`SELECT COUNT(*) FROM warehouses WHERE store_id = ?`, [input.storeId]);
  const isDefault = input.isDefault || existingCount === 0;

  await transaction(async () => {
    if (isDefault) {
      // Bỏ mặc định các kho cũ của shop này
      await execute(`UPDATE warehouses SET is_default = 0, updated_at = ? WHERE store_id = ?`, [now, input.storeId]);
    }

    await execute(
      `INSERT INTO warehouses (id, store_id, name, address_text, address_note, lat, lng, contact_name, phone, is_default, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        input.storeId,
        input.name.trim(),
        input.addressText.trim(),
        input.addressNote?.trim() || null,
        typeof input.lat === 'number' ? input.lat : null,
        typeof input.lng === 'number' ? input.lng : null,
        input.contactName?.trim() || null,
        input.phone?.trim() || null,
        isDefault ? 1 : 0,
        now,
        now,
      ]
    );
  });

  const created = await getWarehouseById(id);
  if (!created) throw new Error('Không đọc lại được kho vừa tạo.');
  return created;
}

/** Cập nhật kho hàng. */
export async function updateWarehouse(
  id: string,
  storeId: string,
  patch: {
    name?: string;
    addressText?: string;
    addressNote?: string | null;
    lat?: number | null;
    lng?: number | null;
    contactName?: string | null;
    phone?: string | null;
    isDefault?: boolean;
    active?: boolean;
  }
): Promise<Warehouse> {
  const warehouse = await getWarehouseById(id, storeId);
  if (!warehouse) {
    throw new HttpError('Không tìm thấy kho hàng hoặc bạn không có quyền sửa.', 404, 'warehouse_not_found');
  }

  const now = new Date().toISOString();

  await transaction(async () => {
    if (patch.isDefault === true) {
      await execute(`UPDATE warehouses SET is_default = 0, updated_at = ? WHERE store_id = ?`, [now, storeId]);
    }

    // Nếu tắt active của một kho đang mặc định, cần kiểm tra
    if (patch.active === false && warehouse.isDefault) {
      const activeCount = await executeCount(
        `SELECT COUNT(*) FROM warehouses WHERE store_id = ? AND active = 1 AND id != ?`,
        [storeId, id]
      );
      if (activeCount === 0) {
        throw new HttpError('Cửa hàng phải có ít nhất một kho hoạt động để xuất hàng.', 400, 'cannot_disable_last_warehouse');
      }
    }

    await execute(
      `UPDATE warehouses SET
         name = COALESCE(?, name),
         address_text = COALESCE(?, address_text),
         address_note = CASE WHEN ? THEN ? ELSE address_note END,
         lat = CASE WHEN ? THEN ? ELSE lat END,
         lng = CASE WHEN ? THEN ? ELSE lng END,
         contact_name = CASE WHEN ? THEN ? ELSE contact_name END,
         phone = CASE WHEN ? THEN ? ELSE phone END,
         is_default = CASE WHEN ? THEN ? ELSE is_default END,
         active = CASE WHEN ? THEN ? ELSE active END,
         updated_at = ?
       WHERE id = ? AND store_id = ?`,
      [
        patch.name?.trim() ?? null,
        patch.addressText?.trim() ?? null,
        patch.addressNote !== undefined ? 1 : 0,
        patch.addressNote?.trim() || null,
        patch.lat !== undefined ? 1 : 0,
        patch.lat,
        patch.lng !== undefined ? 1 : 0,
        patch.lng,
        patch.contactName !== undefined ? 1 : 0,
        patch.contactName?.trim() || null,
        patch.phone !== undefined ? 1 : 0,
        patch.phone?.trim() || null,
        patch.isDefault !== undefined ? 1 : 0,
        patch.isDefault ? 1 : 0,
        patch.active !== undefined ? 1 : 0,
        patch.active ? 1 : 0,
        now,
        id,
        storeId,
      ]
    );
  });

  const updated = await getWarehouseById(id, storeId);
  if (!updated) throw new Error('Không đọc lại được kho sau khi cập nhật.');
  return updated;
}

/** Đếm số lượng sản phẩm đang gắn trực tiếp với kho này. */
export async function countProductsUsingWarehouse(warehouseId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM products WHERE warehouse_id = ? AND active = 1`,
    [warehouseId]
  );
  return Number(row?.count || 0);
}

/**
 * Xóa hoặc ngừng hoạt động kho.
 * Nếu có sản phẩm đang dùng kho này -> ném lỗi và yêu cầu chuyển sản phẩm trước.
 */
export async function deleteWarehouse(id: string, storeId: string): Promise<{ ok: boolean; message: string }> {
  const warehouse = await getWarehouseById(id, storeId);
  if (!warehouse) {
    throw new HttpError('Không tìm thấy kho hàng hoặc bạn không có quyền xóa.', 404, 'warehouse_not_found');
  }

  const inUseCount = await countProductsUsingWarehouse(id);
  if (inUseCount > 0) {
    throw new HttpError(
      `Kho này hiện có ${inUseCount} sản phẩm đang sử dụng làm điểm xuất hàng. Vui lòng chuyển các sản phẩm này sang kho khác trước khi xóa.`,
      409,
      'warehouse_in_use',
      { inUseCount }
    );
  }

  if (warehouse.isDefault) {
    throw new HttpError(
      'Không thể xóa kho mặc định của cửa hàng. Hãy đặt một kho khác làm mặc định trước.',
      400,
      'cannot_delete_default_warehouse'
    );
  }

  await execute(`DELETE FROM warehouses WHERE id = ? AND store_id = ?`, [id, storeId]);
  return { ok: true, message: 'Đã xóa kho hàng thành công.' };
}
