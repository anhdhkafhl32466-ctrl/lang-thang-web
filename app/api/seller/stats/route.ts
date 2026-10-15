import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { getSellerDailyOrders, getSellerStats, getSellerTopProducts } from '@/lib/server/sellerOrders';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';

export const dynamic = 'force-dynamic';

/**
 * GET /api/seller/stats — thống kê bán hàng của CỬA HÀNG ĐANG ĐĂNG NHẬP.
 *
 * Quy ước số liệu (rất quan trọng để không hiểu sai doanh thu):
 *  - `revenue` chỉ tính các đơn ĐÃ GIAO THÀNH CÔNG.
 *  - `pendingRevenue` là tiền của các đơn chưa giao và chưa huỷ (tiền chưa chắc về).
 */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });

    const stats = await getSellerStats(store.id);
    const topProducts = await getSellerTopProducts(store.id, 5);
    const daily = await getSellerDailyOrders(store.id, 7);

    return NextResponse.json({
      ok: true,
      store: { id: store.id, name: store.name, status: store.status },
      stats,
      topProducts,
      daily,
      byStatusDetail: Object.entries(stats.byStatus).map(([status, count]) => ({
        status,
        count,
        label: ORDER_STATUS_META[status as OrderStatus]?.label || status,
      })),
      note: 'Doanh thu ghi nhận = tổng tiền các đơn đã giao thành công. Đơn đang xử lý được tính riêng ở mục "doanh thu đang chờ".',
    });
  } catch (error) {
    return jsonError(error);
  }
}
