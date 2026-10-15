import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { listSellerOrders, SELLER_ORDER_FILTERS, type SellerOrderFilter } from '@/lib/server/sellerOrders';
import { getSellerStats } from '@/lib/server/sellerOrders';

export const dynamic = 'force-dynamic';

const VALID_FILTERS = new Set<string>(SELLER_ORDER_FILTERS.map((item) => item.key));

/**
 * GET /api/seller/orders?filter=needs_action&q=...
 *
 * Trả về ĐƠN CON của cửa hàng đang đăng nhập. Người bán không bao giờ nhận được đơn của cửa hàng khác:
 * điều kiện `store_id` do máy chủ lấy từ phiên đăng nhập, không phải từ tham số truy vấn.
 */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const params = request.nextUrl.searchParams;

    const rawFilter = params.get('filter') || 'all';
    const filter = (VALID_FILTERS.has(rawFilter) ? rawFilter : 'all') as SellerOrderFilter;

    const orders = await listSellerOrders({
      storeId: store.id,
      filter,
      q: params.get('q'),
      limit: Number(params.get('limit')) || 100,
    });

    const stats = await getSellerStats(store.id);

    return NextResponse.json({
      ok: true,
      storeId: store.id,
      storeName: store.name,
      filter,
      filters: SELLER_ORDER_FILTERS,
      orders,
      stats,
    });
  } catch (error) {
    return jsonError(error);
  }
}
