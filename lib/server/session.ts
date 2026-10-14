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

export interface SessionPayload {
  userEmail: string;
  role: 'member' | 'admin';
  name: string;
  avatar: string | null;
  issuedAt: number;
  expiresAt: number;
}

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (secret && secret.length >= 16) return secret;
  // Khoá dự phòng cho môi trường phát triển — production bắt buộc cấu hình SESSION_SECRET.
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
  const role: 'member' | 'admin' = email === getAdminEmail() ? 'admin' : 'member';
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
