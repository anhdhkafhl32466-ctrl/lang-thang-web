/**
 * Khoá truy cập quản trị (ADMIN_ACCESS_KEY) — CHỈ chạy phía server.
 *
 * Vì sao cần: đường đăng nhập Google yêu cầu NEXT_PUBLIC_GOOGLE_CLIENT_ID do chủ website tự tạo
 * trên Google Cloud. Khi chưa cấu hình, quản trị viên KHÔNG thể thiết lập phiên quản trị và vì
 * vậy không mở được trang quản lý đơn hàng. Khoá này là đường khởi tạo an toàn dành cho chủ
 * website: một chuỗi bí mật dài (>= 24 ký tự) nằm trong .env.local, được so sánh bằng
 * timingSafeEqual ở máy chủ.
 *
 * Nguyên tắc bảo mật:
 *  - Khoá KHÔNG bao giờ được gửi xuống trình duyệt, không lưu localStorage, không ghi log.
 *  - Chỉ cấp quyền admin cho ĐÚNG email quản trị đã cấu hình (ADMIN_EMAIL); người dùng không thể
 *    tự khai báo email để trở thành admin.
 *  - Sai khoá quá nhiều lần trong một khoảng thời gian sẽ bị tạm chặn (giới hạn dò khoá).
 *  - Không có khoá mặc định: nếu chưa cấu hình, endpoint trả lỗi rõ ràng chứ không "đăng nhập giả".
 */

import crypto from 'crypto';
import { HttpError } from './http';

/** Độ dài tối thiểu để một khoá được coi là đủ mạnh. */
const MIN_KEY_LENGTH = 24;

const MAX_ATTEMPTS = 8;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

const attempts = new Map<string, { count: number; resetAt: number }>();

export function getAdminAccessKey(): string | null {
  const key = process.env.ADMIN_ACCESS_KEY?.trim();
  if (!key || key.length < MIN_KEY_LENGTH) return null;
  return key;
}

export function isAdminAccessKeyConfigured(): boolean {
  return getAdminAccessKey() !== null;
}

/** Định danh dùng cho việc giới hạn dò khoá (địa chỉ mạng của người gọi). */
export function callerId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Chặn nếu đã sai quá nhiều lần trong cửa sổ thời gian gần đây. */
export function assertAdminKeyAttemptAllowed(id: string, now = Date.now()): void {
  const record = attempts.get(id);
  if (!record || record.resetAt <= now) {
    attempts.delete(id);
    return;
  }
  if (record.count >= MAX_ATTEMPTS) {
    const minutes = Math.ceil((record.resetAt - now) / 60000);
    throw new HttpError(
      `Quá nhiều lần thử khoá quản trị sai. Vui lòng thử lại sau khoảng ${minutes} phút.`,
      429,
      'too_many_attempts'
    );
  }
}

export function recordAdminKeyFailure(id: string, now = Date.now()): void {
  const record = attempts.get(id);
  if (!record || record.resetAt <= now) {
    attempts.set(id, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  record.count += 1;
}

export function clearAdminKeyAttempts(id: string): void {
  attempts.delete(id);
}

/**
 * So sánh khoá người dùng gửi lên với khoá cấu hình ở máy chủ bằng timingSafeEqual.
 * Trả về false (không ném lỗi) để phía gọi tự quyết định thông báo.
 */
export function verifyAdminAccessKey(candidate: unknown): boolean {
  const expected = getAdminAccessKey();
  if (!expected) return false;
  if (typeof candidate !== 'string') return false;

  const provided = candidate.trim();
  if (provided.length === 0) return false;

  const a = Buffer.from(provided, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}
