import { NextRequest, NextResponse } from 'next/server';
import { HttpError, jsonError } from '@/lib/server/http';
import { getOrderById } from '@/lib/server/orders';
import { getSession } from '@/lib/server/session';
import { canGuestAccessOrder } from '@/lib/server/orderAccess';
import { getAdminEmail } from '@/lib/config/commerce';

export const dynamic = 'force-dynamic';

/**
 * GET /api/orders/[id] — chi tiết đơn hàng.
 * Được xem bởi: chủ đơn (theo email trong phiên), quản trị viên, hoặc chính trình duyệt đã đặt đơn
 * và đang giữ cookie truy cập đơn hàng có chữ ký (khách chưa đăng nhập).
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await getOrderById(params.id);
    if (!order) throw new HttpError('Không tìm thấy đơn hàng.', 404, 'order_not_found');

    const session = getSession(request);
    const isAdmin = session?.role === 'admin' && session.userEmail === getAdminEmail();
    const ownsOrder =
      Boolean(session?.userEmail) &&
      Boolean(order.customerEmail) &&
      session!.userEmail === order.customerEmail?.toLowerCase();

    const hasGuestGrant = canGuestAccessOrder(request, order.id);

    if (!isAdmin && !ownsOrder && !hasGuestGrant) {
      throw new HttpError('Bạn không có quyền xem đơn hàng này.', 403, 'forbidden');
    }

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return jsonError(error);
  }
}
