/**
 * Giới hạn tần suất thao tác nhạy cảm (đăng ký người bán, đăng nhập bằng mật khẩu).
 *
 * Vì sao cần: không có giới hạn thì kẻ tấn công có thể dò mật khẩu người bán hoặc tạo hàng loạt tài
 * khoản giả. Cách làm ở đây là bộ đếm trong bộ nhớ tiến trình — đủ cho một máy chủ, và tự nhiên được
 * đặt lại khi khởi động lại. Khi chạy nhiều máy chủ, hãy thay bằng Redis/Upstash cùng giao diện.
 *
 * Nguyên tắc: chỉ ĐẾM SỐ LẦN THẤT BẠI và trả lỗi 429 nói rõ còn bao lâu — không tiết lộ tài khoản
 * nào tồn tại.
 */

import { HttpError } from './http';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Định danh người gọi: ưu tiên IP do proxy gửi, sau đó tới IP trực tiếp. */
export function callerId(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function assertRateLimit(
  key: string,
  options: { limit: number; windowMs: number; message: string },
  now = Date.now()
): void {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.delete(key);
    return;
  }
  if (bucket.count >= options.limit) {
    const minutes = Math.max(1, Math.ceil((bucket.resetAt - now) / 60000));
    throw new HttpError(options.message.replace('{minutes}', String(minutes)), 429, 'too_many_attempts');
  }
}

/** Ghi nhận một lần thất bại (hoặc một lần sử dụng) vào bộ đếm. */
export function recordRateLimitHit(key: string, windowMs: number, now = Date.now()): void {
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
}

export function clearRateLimit(key: string): void {
  buckets.delete(key);
}
