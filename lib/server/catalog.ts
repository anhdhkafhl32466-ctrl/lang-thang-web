/**
 * Danh mục sản phẩm đọc từ cơ sở dữ liệu (giá và tồn kho là nguồn duy nhất phía server).
 */

import { query } from './db';
import type { CatalogProduct } from '@/lib/orders/types';

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
}

function toProduct(row: ProductRow): CatalogProduct {
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
  };
}

export async function listProducts(): Promise<CatalogProduct[]> {
  const rows = await query<ProductRow>(
    `SELECT id, name, village_id, village_name, category, price, stock, image, artisan_name, material, dimensions
     FROM products WHERE active = 1 ORDER BY name`
  );
  return rows.map(toProduct);
}

export async function getProduct(id: string): Promise<CatalogProduct | null> {
  const rows = await query<ProductRow>(
    `SELECT id, name, village_id, village_name, category, price, stock, image, artisan_name, material, dimensions
     FROM products WHERE id = ? AND active = 1`,
    [id]
  );
  return rows[0] ? toProduct(rows[0]) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Map<string, CatalogProduct>> {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const map = new Map<string, CatalogProduct>();
  if (unique.length === 0) return map;

  for (const id of unique) {
    const rows = await query<ProductRow>(
      `SELECT id, name, village_id, village_name, category, price, stock, image, artisan_name, material, dimensions
       FROM products WHERE id = ?`,
      [id]
    );
    if (rows[0]) map.set(id, toProduct(rows[0]));
  }
  return map;
}
