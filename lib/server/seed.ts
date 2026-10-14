/**
 * Nạp danh mục sản phẩm từ dữ liệu tĩnh của website vào cơ sở dữ liệu.
 *
 * Mục đích: các trang bán hàng đọc GIÁ và TỒN KHO từ cơ sở dữ liệu (nguồn duy nhất),
 * còn `data/products.ts` chỉ là dữ liệu khởi tạo ban đầu. Sau khi bản ghi đã tồn tại,
 * hàm này KHÔNG ghi đè giá/tồn kho để chỉnh sửa của người vận hành không bị mất.
 */

import { PRODUCTS } from '@/data/products';
import { internal } from './db';

/** Tồn kho khởi tạo cho mỗi sản phẩm khi lần đầu tạo bản ghi (có thể chỉnh sau trong DB). */
const DEFAULT_STOCK = Number(process.env.CATALOG_DEFAULT_STOCK || 20);

export async function seedCatalog(): Promise<void> {
  const now = new Date().toISOString();
  for (const product of PRODUCTS) {
    await internal.rawExecute(
      `INSERT INTO products
        (id, name, village_id, village_name, category, price, stock, image, artisan_name, material, dimensions, active, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
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
        now,
      ]
    );
  }
}
