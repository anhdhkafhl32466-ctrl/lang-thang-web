import { NextResponse } from 'next/server';
import { listStores } from '@/lib/server/stores';
import { query } from '@/lib/server/db';
import { jsonError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/**
 * GET /api/stores — Danh sách cửa hàng làng nghề đang hoạt động công khai trên sàn.
 */
export async function GET() {
  try {
    const stores = await listStores({ status: 'active', limit: 100 });

    // Đếm số sản phẩm đang mở bán cho mỗi cửa hàng
    const countRows = await query<{ store_id: string; product_count: number }>(
      `SELECT store_id, COUNT(*) AS product_count FROM products WHERE active = 1 GROUP BY store_id`
    );
    const countMap = new Map<string, number>();
    for (const r of countRows) {
      if (r.store_id) countMap.set(r.store_id, Number(r.product_count));
    }

    const items = stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      description: s.description,
      logoUrl: s.logoUrl,
      bannerUrl: s.bannerUrl,
      addressText: s.addressText,
      shippingPolicy: s.shippingPolicy,
      prepTimeDays: s.prepTimeDays,
      categories: s.categories,
      productCount: countMap.get(s.id) || 0,
      createdAt: s.createdAt,
    }));

    return NextResponse.json({
      ok: true,
      stores: items,
      total: items.length,
    });
  } catch (error) {
    return jsonError(error);
  }
}
