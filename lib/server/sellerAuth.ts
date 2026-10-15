/**
 * Xác thực và phân quyền cho NGƯỜI BÁN.
 *
 * Nguyên tắc bảo mật (không được nới lỏng khi sửa mã):
 *  1. Danh tính lấy từ COOKIE PHIÊN ĐÃ KÝ (httpOnly) — không bao giờ từ tham số client gửi lên.
 *  2. Cửa hàng được TRA TỪ EMAIL TRONG PHIÊN mỗi lần gọi API, không lưu vào cookie: nhờ vậy quản trị
 *     viên tạm khóa cửa hàng là hiệu lực NGAY, người bán không thể giữ quyền bằng phiên cũ.
 *  3. Mọi API nghiệp vụ của người bán phải gọi requireActiveSeller(): cửa hàng chưa được duyệt, bị
 *     tạm khóa hoặc bị từ chối thì KHÔNG được đăng bán hay xử lý đơn.
 *  4. Tài khoản thành viên (khách) không bao giờ có quyền của người bán dù có gọi đúng URL API.
 */

import type { NextRequest } from 'next/server';
import { getAdminEmail } from '@/lib/config/commerce';
import { getStoreByOwnerEmail, STORE_STATUS_META } from './stores';
import { getSession, type SessionPayload } from './session';
import { HttpError, normalizeEmail } from './http';
import type { Store } from '@/lib/orders/types';

export interface SellerContext {
  session: SessionPayload;
  store: Store;
  /** Email chủ cửa hàng — dùng để gửi thông báo cho chính người bán. */
  sellerEmail: string;
}

/**
 * Bắt buộc có phiên người bán. `requireActive = true` (mặc định) còn yêu cầu cửa hàng ĐANG HOẠT ĐỘNG.
 * Dùng `requireActive: false` cho các API mà người bán vẫn cần xem dù chưa được duyệt
 * (ví dụ: xem trạng thái hồ sơ của mình).
 */
export async function requireSeller(
  request: NextRequest | Request,
  options: { requireActive?: boolean } = {}
): Promise<SellerContext> {
  const requireActive = options.requireActive !== false;
  const session = getSession(request);

  if (!session) {
    throw new HttpError(
      'Bạn cần đăng nhập bằng tài khoản người bán để dùng khu vực này.',
      401,
      'unauthenticated'
    );
  }
  if (session.role !== 'seller') {
    throw new HttpError(
      'Tài khoản này không phải tài khoản người bán. Nếu bạn muốn bán hàng trên sàn, hãy đăng ký cửa hàng.',
      403,
      'not_a_seller'
    );
  }
  if (session.userEmail === getAdminEmail()) {
    // Quản trị viên sàn quản lý toàn sàn ở /admin; không dùng khu vực người bán để tránh nhập nhằng quyền.
    throw new HttpError(
      'Email quản trị viên dùng trang quản trị sàn (/admin), không dùng Trung tâm người bán.',
      403,
      'use_admin_area'
    );
  }

  const store = await getStoreByOwnerEmail(session.userEmail);
  if (!store) {
    throw new HttpError(
      'Tài khoản này chưa có hồ sơ cửa hàng. Vui lòng hoàn tất đăng ký người bán.',
      404,
      'store_missing'
    );
  }

  if (requireActive && store.status !== 'active') {
    const meta = STORE_STATUS_META[store.status];
    throw new HttpError(
      `Cửa hàng đang ở trạng thái "${meta.label}". ${meta.description}`,
      403,
      'store_not_active',
      { storeStatus: store.status, reviewNote: store.reviewNote }
    );
  }

  return { session, store, sellerEmail: session.userEmail };
}

/** Thông tin khu vực người bán cho giao diện: cho phép null khi chưa đăng nhập hoặc chưa có cửa hàng. */
export async function getSellerAreaState(request: NextRequest | Request): Promise<{
  authenticated: boolean;
  isSeller: boolean;
  email: string | null;
  name: string | null;
  store: Store | null;
  /** Lý do chưa dùng được khu vực bán hàng (nếu có) — hiển thị rõ cho người dùng. */
  blockedReason: string | null;
  canSell: boolean;
}> {
  const session = getSession(request);
  if (!session) {
    return { authenticated: false, isSeller: false, email: null, name: null, store: null, blockedReason: null, canSell: false };
  }

  const isSeller = session.role === 'seller';
  const store = isSeller ? await getStoreByOwnerEmail(session.userEmail) : null;
  const canSell = Boolean(store && store.status === 'active');

  let blockedReason: string | null = null;
  if (!isSeller) blockedReason = 'Tài khoản này không phải tài khoản người bán.';
  else if (!store) blockedReason = 'Chưa có hồ sơ cửa hàng.';
  else if (!canSell) blockedReason = `${STORE_STATUS_META[store.status].label}: ${STORE_STATUS_META[store.status].description}`;

  return {
    authenticated: true,
    isSeller,
    email: session.userEmail,
    name: session.name,
    store,
    blockedReason,
    canSell,
  };
}

/** Chuẩn hoá email đăng nhập của người bán (dùng chung cho đăng ký và đăng nhập). */
export function sellerEmailFrom(value: unknown): string | null {
  return normalizeEmail(typeof value === 'string' ? value : null);
}
