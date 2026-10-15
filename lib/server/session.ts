/**
 * Phiên đăng nhập phía máy chủ (cookie ký HMAC) và phân quyền quản trị.
 *
 * Vì sao cần: quyền quản trị KHÔNG được quyết định ở trình duyệt (localStorage có thể bị sửa
 * bằng tay). Mọi thao tác quản trị đều phải kiểm tra vai trò từ cookie đã được máy chủ ký.
 *
 * Quy tắc cấp quyền:
 *  - Quyền "admin" CHỈ được cấp khi tài khoản Google đã được xác minh ở server và email
 *    trùng với ADMIN_EMAIL trong cấu hình. Email quản trị chỉ là nơi nhận thông báo, không
 *    tự động tạo quyền.
 *  - Không có mật khẩu mặc định nào được tạo sẵn.
 */

import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';
import { getAdminEmail } from '@/lib/config/commerce';
import { HttpError } from './http';
import { upsertUser } from './users';

export const SESSION_COOKIE = 'lt_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 ngày

/**
 * CHỈ những đường đăng nhập ĐÃ XÁC MINH DANH TÍNH mới được xét quyền quản trị:
 *  - 'google'    : ID token do Google phát hành, máy chủ đã kiểm chữ ký/audience/email_verified.
 *  - 'admin-key' : khoá bí mật ở máy chủ (ADMIN_ACCESS_KEY), so sánh timing-safe.
 *
 * Đường 'email-mx' CHỈ kiểm tra tên miền có bản ghi MX — nó chứng minh "tên miền có máy chủ mail",
 * KHÔNG chứng minh người gửi sở hữu hộp thư. Nếu vẫn cấp quyền admin cho email trùng ADMIN_EMAIL thì
 * bất kỳ ai gõ đúng email đó trong ô nhập đều trở thành quản trị viên.
 */
const TRUSTED_ADMIN_PROVIDERS = new Set(['google', 'admin-key']);

export function canGrantAdminRole(provider: string): boolean {
  return TRUSTED_ADMIN_PROVIDERS.has(provider);
}

export interface SessionPayload {
  userEmail: string;
  /**
   * 'seller' là vai trò RIÊNG của tài khoản người bán, KHÔNG kế thừa quyền quản trị:
   * người bán đăng nhập bằng mật khẩu của chính họ và chỉ chạm được dữ liệu cửa hàng mình.
   */
  role: 'member' | 'admin' | 'seller';
  name: string;
  avatar: string | null;
  issuedAt: number;
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 16) return secret;

  // Trên máy phát triển, dùng khoá dự phòng cho tiện. Nhưng ở production (ví dụ bản deploy Vercel)
  // TUYỆT ĐỐI không được ký phiên bằng khoá ai cũng đọc được trong mã nguồn: làm vậy thì bất kỳ ai
  // cũng có thể tự tạo cookie mang role 'admin' và vào thẳng trang quản trị sàn.
  // Vì vậy production mà thiếu SESSION_SECRET thì TỪ CHỐI cấp phiên, kèm thông báo nói rõ cách sửa.
  if (process.env.NODE_ENV === 'production') {
    throw new HttpError(
      'Máy chủ chưa cấu hình SESSION_SECRET nên không thể tạo phiên đăng nhập an toàn. Hãy đặt SESSION_SECRET (tối thiểu 16 ký tự) trong biến môi trường rồi khởi động lại.',
      503,
      'session_secret_missing',
      { missing: ['SESSION_SECRET'] }
    );
  }

  return 'lang-thang-dev-session-secret-do-not-use-in-production';
}

export function isSessionSecretConfigured(): boolean {
  return Boolean(process.env.SESSION_SECRET?.trim());
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(data: string): string {
  return base64UrlEncode(crypto.createHmac('sha256', sessionSecret()).update(data).digest());
}

export function encodeSession(payload: SessionPayload): string {
  const body = base64UrlEncode(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined | null): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload;
    if (!payload?.userEmail || typeof payload.expiresAt !== 'number') return null;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getSession(request: NextRequest | Request): SessionPayload | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  const token = match ? decodeURIComponent(match[1]) : undefined;
  return decodeSession(token);
}

/** Bắt buộc có phiên quản trị hợp lệ, nếu không ném lỗi 401/403. */
export function requireAdminSession(request: NextRequest | Request): SessionPayload {
  const session = getSession(request);
  if (!session) {
    throw new HttpError('Bạn cần đăng nhập để thực hiện thao tác này.', 401, 'unauthenticated');
  }
  if (session.role !== 'admin' || session.userEmail !== getAdminEmail()) {
    throw new HttpError('Tài khoản này không có quyền quản trị.', 403, 'forbidden');
  }
  return session;
}

/**
 * Tạo phiên đã xác minh (chỉ gọi sau khi đã kiểm chứng danh tính ở server — ví dụ ID token Google).
 * Vai trò admin được cấp tự động cho email quản trị cấu hình, đồng thời ghi nhận vào bảng users.
 */
export async function establishSession(params: {
  email: string;
  name?: string | null;
  avatar?: string | null;
  provider: string;
  userAgent?: string | null;
}): Promise<{ token: string; payload: SessionPayload; maxAge: number }> {
  const email = params.email.trim().toLowerCase();
  const role: 'member' | 'admin' =
    email === getAdminEmail() && canGrantAdminRole(params.provider) ? 'admin' : 'member';
  const name = params.name?.trim() || email.split('@')[0];

  await upsertUser({
    email,
    name,
    avatar: params.avatar || null,
    role,
    provider: params.provider,
  });

  const issuedAt = Date.now();
  const payload: SessionPayload = {
    userEmail: email,
    role,
    name,
    avatar: params.avatar || null,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000,
  };

  return { token: encodeSession(payload), payload, maxAge: SESSION_TTL_SECONDS };
}

/**
 * Phiên dành cho NGƯỜI BÁN đã xác thực bằng mật khẩu riêng (scrypt) của tài khoản họ.
 *
 * Quyền 'seller' KHÔNG bao giờ được nâng thành 'admin' — kể cả khi email trùng ADMIN_EMAIL — vì
 * mật khẩu người bán do người đăng ký tự đặt, không phải bằng chứng sở hữu email quản trị.
 */
export async function establishSellerSession(params: {
  email: string;
  name?: string | null;
  userAgent?: string | null;
}): Promise<{ token: string; payload: SessionPayload; maxAge: number }> {
  const email = params.email.trim().toLowerCase();
  const name = params.name?.trim() || email.split('@')[0];
  const issuedAt = Date.now();

  await upsertUser({
    email,
    name,
    role: 'seller',
    provider: 'seller-password',
  });

  const payload: SessionPayload = {
    userEmail: email,
    role: 'seller',
    name,
    avatar: null,
    issuedAt,
    expiresAt: issuedAt + SESSION_TTL_SECONDS * 1000,
  };

  return { token: encodeSession(payload), payload, maxAge: SESSION_TTL_SECONDS };
}

export function applySessionCookie(response: NextResponse, token: string, maxAge: number): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
