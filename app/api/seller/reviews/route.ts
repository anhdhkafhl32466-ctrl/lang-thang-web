import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { listStoreReviews } from '@/lib/server/reviews';

export const dynamic = 'force-dynamic';

/**
 * GET /api/seller/reviews?filter=unanswered|negative|all
 * Chỉ đánh giá thuộc sản phẩm của CỬA HÀNG ĐANG ĐĂNG NHẬP (store_id lấy từ phiên, không từ query).
 */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const raw = request.nextUrl.searchParams.get('filter');
    const filter = raw === 'unanswered' || raw === 'negative' ? raw : 'all';

    const result = await listStoreReviews(store.id, { filter, limit: Number(request.nextUrl.searchParams.get('limit')) || 50 });
    return NextResponse.json({ ok: true, storeId: store.id, filter, ...result });
  } catch (error) {
    return jsonError(error);
  }
}
