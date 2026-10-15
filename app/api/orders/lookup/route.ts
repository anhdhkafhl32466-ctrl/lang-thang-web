import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizePhone, readJson } from '@/lib/server/http';
import { findOrderByCodeAndPhone } from '@/lib/server/orders';
import { grantGuestOrderAccess } from '@/lib/server/orderAccess';

export const dynamic = 'force-dynamic';

/**
 * POST /api/orders/lookup — khách CHƯA ĐĂNG NHẬP tra cứu đơn hàng của mình.
 *
 * Body: { code: 'LT261014-1234', phone: '0912345678' }
 *
 * Yêu cầu CẢ HAI thông tin: mã đơn hàng và số điện thoại đã dùng khi đặt. Không cho phép tra cứu
 * chỉ bằng mã đơn vì mã đơn dễ đoán và sẽ làm lộ địa chỉ/số điện thoại của người khác.
 * Tra cứu thành công sẽ cấp cookie truy cập đơn hàng có chữ ký cho chính trình duyệt này.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await readJson<{ code?: string; phone?: string }>(request);

    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!code) {
      throw new HttpError('Vui lòng nhập mã đơn hàng.', 400, 'missing_code');
    }

    const phone = normalizePhone(body.phone);
    if (!phone) {
      throw new HttpError('Số điện thoại không hợp lệ (cần 9-15 chữ số).', 400, 'invalid_phone');
    }

    const order = await findOrderByCodeAndPhone(code, phone);
    if (!order) {
      throw new HttpError(
        'Không tìm thấy đơn hàng khớp mã đơn và số điện thoại này. Vui lòng kiểm tra lại thông tin đã dùng khi đặt hàng.',
        404,
        'order_not_found'
      );
    }

    const response = NextResponse.json({ ok: true, order });
    // Cấp quyền xem đơn cho chính trình duyệt vừa tra cứu đúng (cookie đã ký).
    grantGuestOrderAccess(request, response, order.id);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
