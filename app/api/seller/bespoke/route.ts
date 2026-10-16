import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { countBespokeNeedingSellerAction, listBespokeForStore } from '@/lib/server/bespoke';

export const dynamic = 'force-dynamic';

/**
 * GET /api/seller/bespoke — yêu cầu đặt làm độc bản gửi tới CỬA HÀNG đang đăng nhập.
 *
 * Cửa hàng lấy từ phiên người bán do máy chủ tra cứu, không nhận từ tham số trên URL — nhờ vậy người bán
 * không thể đọc yêu cầu của cửa hàng khác.
 */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const status = request.nextUrl.searchParams.get('status');

    const [requests, needsAction] = await Promise.all([
      listBespokeForStore(store.id, status),
      countBespokeNeedingSellerAction(store.id),
    ]);

    return NextResponse.json({
      ok: true,
      storeId: store.id,
      storeName: store.name,
      canSell: store.status === 'active',
      needsAction,
      total: requests.length,
      requests,
    });
  } catch (error) {
    return jsonError(error);
  }
}
