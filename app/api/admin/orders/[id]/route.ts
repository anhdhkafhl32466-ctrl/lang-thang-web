import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { updateOrderStatus } from '@/lib/server/orders';
import { requireAdminSession } from '@/lib/server/session';
import { isOrderStatus, ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

/**
 * PATCH /api/admin/orders/[id] — chuyển trạng thái đơn hàng theo quy trình.
 * Body: { status: OrderStatus, note?: string }
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const session = requireAdminSession(request);
    const body = await readJson<{ status?: string; note?: string }>(request);

    if (!isOrderStatus(body.status)) {
      throw new HttpError('Trạng thái gửi lên không hợp lệ.', 400, 'invalid_status', {
        allowed: Object.keys(ORDER_STATUS_META),
      });
    }

    const result = await updateOrderStatus({
      orderId: params.id,
      status: body.status as OrderStatus,
      note: body.note ?? null,
      actorType: 'admin',
      actorId: session.userEmail,
      source: 'MANUAL_ADMIN:TRANG_QUAN_TRI',
    });

    return NextResponse.json({
      ok: true,
      order: result.order,
      delivery: { emails: result.emails, push: result.push },
      updatedBy: session.userEmail,
    });
  } catch (error) {
    return jsonError(error);
  }
}
