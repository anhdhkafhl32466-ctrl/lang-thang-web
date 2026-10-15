/**
 * Băm và kiểm tra mật khẩu người bán — CHỈ chạy phía server.
 *
 * Vì sao không lưu mật khẩu thô: mật khẩu phải được băm bằng hàm dành riêng cho mật khẩu (ở đây dùng
 * scrypt của Node — có sẵn, không cần thêm thư viện), kèm salt ngẫu nhiên cho từng tài khoản. So sánh
 * bằng timingSafeEqual để không rò rỉ thông tin qua thời gian phản hồi.
 *
 * Định dạng lưu trong `users.password_hash`:
 *   scrypt$N$r$p$<salt base64url>$<hash base64url>
 *
 * Không bao giờ trả về giá trị này cho trình duyệt và không ghi log mật khẩu.
 */

import crypto from 'crypto';

const SCRYPT_N = 16384; // 2^14 — chi phí hợp lý cho CPU thông thường
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_BYTES = 16;

/** Độ dài tối thiểu của mật khẩu người bán. */
export const MIN_PASSWORD_LENGTH = 8;

function b64url(buffer: Buffer): string {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

/**
 * Kiểm tra độ mạnh tối thiểu, trả về thông báo lỗi cụ thể (null = hợp lệ).
 * Không ép mật khẩu phải có ký tự đặc biệt — yêu cầu độ dài là biện pháp hiệu quả hơn.
 */
export function validatePasswordStrength(password: unknown): string | null {
  if (typeof password !== 'string' || password.length === 0) {
    return 'Vui lòng nhập mật khẩu.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  }
  if (password.length > 200) {
    return 'Mật khẩu quá dài (tối đa 200 ký tự).';
  }
  return null;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${b64url(salt)}$${b64url(derived)}`;
}

/** Kiểm tra mật khẩu. Sai định dạng hoặc sai mật khẩu đều trả về false (không ném lỗi). */
export function verifyPassword(password: unknown, stored: string | null | undefined): boolean {
  if (typeof password !== 'string' || !stored) return false;

  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  try {
    const salt = fromB64url(parts[4]);
    const expected = fromB64url(parts[5]);
    const derived = crypto.scryptSync(password, salt, expected.length, { N, r, p });
    if (derived.length !== expected.length) return false;
    return crypto.timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}
