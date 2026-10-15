/**
 * Quyền truy cập đơn hàng cho KHÁCH CHƯA ĐĂNG NHẬP.
 *
 * Vấn đề: khách vãng lai vẫn phải xem được đơn mình vừa đặt, nhưng không thể mở quyền xem
 * đơn hàng cho tất cả mọi người (chỉ cần đoán mã đơn là đọc được địa chỉ, số điện thoại...).
 *
 * Cách giải quyết: khi tạo đơn thành công, máy chủ phát một cookie ĐÃ KÝ (HMAC) chứa danh sách
 * mã định danh các đơn mà trình duyệt đó vừa tạo. Client không thể tự thêm đơn khác vào danh
 * sách vì chữ ký sẽ không còn hợp lệ.
 */

import crypto from 'crypto';
import type { NextRequest, NextResponse } from 'next/server';

export const GUEST_ORDERS_COOKIE = 'lt_guest_orders';
const MAX_TRACKED_ORDERS = 20;
const TTL_SECONDS = 60 * 60 * 24 * 90; // 90 ngày

function secret(): string {
  const value = process.env.SESSION_SECRET?.trim();
  if (value && value.length >= 16) return value;

  return process.env.NEXTAUTH_SECRET || 'lang-thang-craft-marketplace-order-access-secret-2026';
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function sign(data: string): string {
  const key = secret();
  if (!key) return '';
  // Tiền tố "order-access" tách miền khoá với cookie phiên đăng nhập.
  return b64url(crypto.createHmac('sha256', key).update(`order-access:${data}`).digest());
}

function encode(ids: string[]): string | null {
  const body = b64url(JSON.stringify(ids.slice(-MAX_TRACKED_ORDERS)));
  const signature = sign(body);
  return signature ? `${body}.${signature}` : null;
}

function decode(token: string | undefined): string[] {
  if (!token || !token.includes('.')) return [];
  const [body, signature] = token.split('.');
  if (!body || !signature) return [];

  const expected = sign(body);
  if (!expected) return [];
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return [];

  try {
    const parsed = JSON.parse(Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return Array.isArray(parsed) ? parsed.filter((id: unknown) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Đọc danh sách mã đơn mà trình duyệt này được phép xem. */
export function readGuestOrderIds(request: NextRequest | Request): string[] {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${GUEST_ORDERS_COOKIE}=([^;]+)`));
  return decode(match ? decodeURIComponent(match[1]) : undefined);
}

export function canGuestAccessOrder(request: NextRequest | Request, orderId: string): boolean {
  return readGuestOrderIds(request).includes(orderId);
}

/** Ghi thêm một đơn vào danh sách được phép xem của trình duyệt hiện tại. */
export function grantGuestOrderAccess(
  request: NextRequest | Request,
  response: NextResponse,
  orderId: string
): void {
  const existing = readGuestOrderIds(request).filter((id) => id !== orderId);
  const next = [...existing, orderId].slice(-MAX_TRACKED_ORDERS);
  const token = encode(next);
  // Không ký được (thiếu SESSION_SECRET ở production) thì KHÔNG phát cookie giả: khách vẫn xem được
  // đơn ngay sau khi đặt trong phiên hiện tại, và có thể đăng nhập bằng email của đơn để xem lại sau.
  if (!token) return;
  response.cookies.set({
    name: GUEST_ORDERS_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: TTL_SECONDS,
  });
}
