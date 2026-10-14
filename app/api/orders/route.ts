import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizeEmail, readJson } from '@/lib/server/http';
import { createOrder, listOrdersForEmail } from '@/lib/server/orders';
import { getSession } from '@/lib/server/session';
import { grantGuestOrderAccess } from '@/lib/server/orderAccess';
import type { CreateOrderPayload } from '@/lib/orders/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

/** GET /api/orders — lịch sử đơn hàng của tài khoản đang đăng nhập. */
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    const emailFromQuery = normalizeEmail(request.nextUrl.searchParams.get('email'));

    // Chỉ cho phép xem đơn của chính mình (theo phiên đăng nhập).
    const email = session?.userEmail ?? emailFromQuery;
    if (!email) {
      throw new HttpError('Bạn cần đăng nhập để xem lịch sử đơn hàng.', 401, 'unauthenticated');
    }
    if (session && emailFromQuery && emailFromQuery !== session.userEmail) {
      throw new HttpError('Không thể xem đơn hàng của tài khoản khác.', 403, 'forbidden');
    }

    const orders = await listOrdersForEmail(email);
    return NextResponse.json({ ok: true, orders, email });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/orders — tạo đơn hàng. Giá và tồn kho do server quyết định. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    const payload = await readJson<CreateOrderPayload>(request);

    const result = await createOrder(payload, { sessionEmail: session?.userEmail ?? null });

    const response = NextResponse.json(
      {
        ok: true,
        order: result.order,
        delivery: {
          adminEmail: result.delivery.adminEmail,
          customerEmail: result.delivery.customerEmail,
          push: result.delivery.push,
        },
      },
      { status: 201 }
    );

    // Cho phép chính trình duyệt vừa đặt đơn xem lại đơn hàng dù chưa đăng nhập.
    grantGuestOrderAccess(request, response, result.order.id);

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
