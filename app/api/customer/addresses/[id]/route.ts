import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizeEmail, readJson } from '@/lib/server/http';
import { getSession } from '@/lib/server/session';
import {
  deleteCustomerAddress,
  getAddressById,
  setDefaultAddress,
  updateCustomerAddress,
  type CreateAddressInput,
} from '@/lib/server/customerAddresses';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/** PATCH /api/customer/addresses/[id] — cập nhật hoặc đặt làm mặc định. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    const body = await readJson<Partial<CreateAddressInput> & { email?: string; makeDefault?: boolean }>(request);
    const email = session?.userEmail || normalizeEmail(body.email);

    if (!email) {
      throw new HttpError('Vui lòng đăng nhập để cập nhật địa chỉ.', 401, 'unauthenticated');
    }

    if (body.makeDefault) {
      const updated = await setDefaultAddress(params.id, email);
      return NextResponse.json({ ok: true, address: updated });
    }

    const updated = await updateCustomerAddress(params.id, email, body);
    return NextResponse.json({ ok: true, address: updated });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/customer/addresses/[id] — xoá địa chỉ. */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    const emailParam = normalizeEmail(request.nextUrl.searchParams.get('email'));
    const email = session?.userEmail || emailParam;

    if (!email) {
      throw new HttpError('Vui lòng đăng nhập để xoá địa chỉ.', 401, 'unauthenticated');
    }

    await deleteCustomerAddress(params.id, email);
    return NextResponse.json({ ok: true, message: 'Đã xoá địa chỉ thành công.' });
  } catch (error) {
    return jsonError(error);
  }
}
