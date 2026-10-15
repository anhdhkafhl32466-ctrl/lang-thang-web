/**
 * Điều hướng SAU khi đăng nhập — dùng chung cho mọi nơi mở hộp thoại đăng nhập.
 *
 * Quy tắc nghiệp vụ (yêu cầu của chủ website):
 *  - Tài khoản đã được xác thực là quản trị viên: đi THẲNG vào trang quản lý đơn hàng,
 *    không qua trang chủ và không phải tự tìm menu.
 *  - Tài khoản thường: giữ nguyên hành vi cũ (về trang được yêu cầu, mặc định là tài khoản).
 *
 * Lưu ý: giá trị `isAdmin` LUÔN đến từ phiên máy chủ (/api/auth/session) — tức cookie đã được
 * ký HMAC — chứ không lấy từ localStorage.
 */

export const ADMIN_ORDERS_PATH = '/admin/don-hang';

/** Trang quản trị tổng quan (bảng điều khiển startup). */
export const ADMIN_HOME_PATH = '/admin';

/** Đích đến sau khi đăng nhập thành công. */
export function destinationAfterLogin(isAdmin: boolean, fallback = '/tai-khoan'): string {
  return isAdmin ? ADMIN_ORDERS_PATH : fallback;
}

/**
 * Đường dẫn trang đăng nhập kèm đích quay lại.
 * Dùng để "yêu cầu đăng nhập trước, rồi chuyển tới đúng trang sau khi xác thực".
 */
export function loginHref(next?: string): string {
  if (!next) return '/dang-nhap';
  // Chỉ chấp nhận đường dẫn nội bộ để tránh chuyển hướng ra ngoài.
  if (!next.startsWith('/') || next.startsWith('//')) return '/dang-nhap';
  return `/dang-nhap?next=${encodeURIComponent(next)}`;
}

/** Đọc tham số ?next= một cách an toàn (chỉ cho phép đường dẫn nội bộ). */
export function readSafeNext(search: string): string | null {
  const value = new URLSearchParams(search).get('next');
  if (!value) return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}
