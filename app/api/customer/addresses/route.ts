import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizeEmail, readJson } from '@/lib/server/http';
import { getSession } from '@/lib/server/session';
import { createCustomerAddress, listAddressesForUser, type CreateAddressInput } from '@/lib/server/customerAddresses';

export const dynamic = 'force-dynamic';

/** GET /api/customer/addresses — danh sách địa chỉ đã lưu của khách hàng. */
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    const emailParam = normalizeEmail(request.nextUrl.searchParams.get('email'));
    const email = session?.userEmail || emailParam;

    if (!email) {
      return NextResponse.json({ ok: true, addresses: [] });
    }

    if (session && emailParam && emailParam !== session.userEmail) {
      throw new HttpError('Không thể xem sổ địa chỉ của tài khoản khác.', 403, 'forbidden');
    }

    const addresses = await listAddressesForUser(email);
    return NextResponse.json({ ok: true, addresses });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/customer/addresses — thêm địa chỉ mới vào sổ địa chỉ. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    const body = await readJson<CreateAddressInput & { email?: string }>(request);
    const email = session?.userEmail || normalizeEmail(body.email);

    if (!email) {
      throw new HttpError('Vui lòng đăng nhập hoặc cung cấp email để lưu địa chỉ.', 401, 'unauthenticated');
    }

    const address = await createCustomerAddress(email, body);
    return NextResponse.json({ ok: true, address }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
