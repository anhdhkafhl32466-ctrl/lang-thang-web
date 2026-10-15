/**
 * Nạp danh mục sản phẩm từ dữ liệu tĩnh của website vào cơ sở dữ liệu.
 *
 * Mục đích: các trang bán hàng đọc GIÁ và TỒN KHO từ cơ sở dữ liệu (nguồn duy nhất), còn
 * `data/products.ts` chỉ là dữ liệu khởi tạo ban đầu. Sau khi bản ghi đã tồn tại, hàm này KHÔNG
 * ghi đè giá/tồn kho để chỉnh sửa của người vận hành không bị mất.
 *
 * Mô hình đa người bán: mọi sản phẩm phải thuộc một cửa hàng. Bước nạp này tạo cửa hàng của SÀN
 * (chủ là ADMIN_EMAIL) và gán toàn bộ sản phẩm gốc vào đó — vì vậy dữ liệu sản phẩm cũ vẫn còn
 * nguyên chủ sở hữu hợp lệ, không phải xoá hay tạo lại bảng.
 *
 * Lưu ý kỹ thuật: hàm này chạy BÊN TRONG bước khởi tạo CSDL nên chỉ dùng `internal.*` (truy vấn thô,
 * không kích hoạt lại ensureDbReady) — nếu dùng lớp `query/execute` thông thường sẽ gây khoá chờ nhau.
 */

import crypto from 'crypto';
import { PRODUCTS } from '@/data/products';
import { getAdminEmail } from '@/lib/config/commerce';
import { internal } from './db';

/** Tồn kho khởi tạo cho mỗi sản phẩm khi lần đầu tạo bản ghi (có thể chỉnh sau trong DB). */
const DEFAULT_STOCK = Number(process.env.CATALOG_DEFAULT_STOCK || 20);

interface RawRow {
  [key: string]: unknown;
}

/** Tạo (hoặc tìm) cửa hàng của sàn — chủ sở hữu là email quản trị đã cấu hình. */
async function ensurePlatformStoreRow(): Promise<string> {
  const adminEmail = getAdminEmail();
  const rows = (await internal.rawQuery(`SELECT id, status FROM stores WHERE lower(owner_email) = ?`, [
    adminEmail,
  ])) as RawRow[];

  if (rows[0]) {
    const storeId = String(rows[0].id);
    // Cửa hàng của sàn luôn phải hoạt động, nếu không toàn bộ danh mục gốc sẽ biến mất khỏi sàn.
    if (rows[0].status !== 'active') {
      await internal.rawExecute(`UPDATE stores SET status = 'active', updated_at = ? WHERE id = ?`, [
        new Date().toISOString(),
        storeId,
      ]);
    }
    return storeId;
  }

  const id = `str_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await internal.rawExecute(
    `INSERT INTO stores (id, owner_email, name, slug, description, phone, contact_name, address_text,
      address_note, lat, lng, logo_url, categories, status, review_note, approved_at, approved_by,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, NULL, ?, 'active', NULL, ?, ?, ?, ?)`,
    [
      id,
      adminEmail,
      'Lang Thang — Sàn di sản',
      'lang-thang-san-di-san',
      'Danh mục sản phẩm tinh hoa do chính sàn Lang Thang tuyển chọn từ các làng nghề Hà Nội.',
      'Ban quản trị sàn Lang Thang',
      'Đặc sản làng nghề, Quà tặng di sản, Thủ công mỹ nghệ',
      now,
      adminEmail,
      now,
      now,
    ]
  );
  return id;
}

export async function seedCatalog(): Promise<void> {
  const now = new Date().toISOString();
  const storeId = await ensurePlatformStoreRow();

  for (const product of PRODUCTS) {
    await internal.rawExecute(
      `INSERT INTO products
        (id, name, village_id, village_name, category, price, stock, image, artisan_name, material, dimensions,
         description, weight_g, preparation_days, store_id, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 1, ?, ?)
       ON CONFLICT (id) DO NOTHING`,
      [
        product.id,
        product.name,
        product.villageId,
        product.villageName,
        product.category,
        product.price,
        Number.isFinite(DEFAULT_STOCK) && DEFAULT_STOCK >= 0 ? DEFAULT_STOCK : 20,
        product.image,
        product.artisanName,
        product.material || null,
        product.dimensions || null,
        product.description || null,
        storeId,
        now,
        now,
      ]
    );
  }

  // Sản phẩm đã tồn tại từ trước khi có mô hình đa người bán: gán về cửa hàng của sàn.
  await internal.rawExecute(`UPDATE products SET store_id = ? WHERE store_id IS NULL`, [storeId]);
}
