/**
 * Tiện ích dùng chung cho các Route Handler (API) phía server.
 */

import { NextResponse } from 'next/server';

export class HttpError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(message: string, status = 400, code = 'bad_request', details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, ...(data as object) }, init);
}

export function jsonError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status }
    );
  }
  console.error('[api] Lỗi không mong đợi:', error);
  return NextResponse.json(
    { ok: false, error: { code: 'internal_error', message: 'Máy chủ gặp lỗi không xác định.' } },
    { status: 500 }
  );
}

export async function readJson<T = any>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError('Dữ liệu gửi lên không phải JSON hợp lệ.', 400, 'invalid_json');
  }
}

/**
 * Chống tấn công CSRF cho các thao tác thay đổi dữ liệu: yêu cầu Origin/Referer cùng nguồn.
 * Trình duyệt luôn gửi Origin cho các request POST/PATCH/DELETE cross-site.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  if (!host) return;

  const candidate = origin || referer;
  if (!candidate) {
    // Một số client (curl, kiểm thử nội bộ) không gửi Origin — vẫn cho phép vì không có cookie phiên.
    return;
  }

  let candidateHost: string;
  try {
    candidateHost = new URL(candidate).host;
  } catch {
    throw new HttpError('Nguồn gửi yêu cầu không hợp lệ.', 403, 'bad_origin');
  }

  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0].trim();
  const allowedHosts = new Set([host, forwardedHost].filter(Boolean));

  if (!allowedHosts.has(candidateHost)) {
    throw new HttpError('Yêu cầu bị chặn vì đến từ một nguồn khác.', 403, 'cross_origin_blocked');
  }
}

export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const value = email.trim().toLowerCase();
  return value === '' ? null : value;
}

const PHONE_PATTERN = /^(\+?\d[\d\s.\-()]{7,20})$/;

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const value = phone.trim();
  if (!PHONE_PATTERN.test(value)) return null;
  const digits = value.replace(/[^\d]/g, '');
  if (digits.length < 9 || digits.length > 15) return null;
  return digits;
}

export function requireString(value: unknown, field: string, maxLength = 500): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(`Thiếu thông tin bắt buộc: ${field}.`, 400, 'missing_field', { field });
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(`${field} quá dài (tối đa ${maxLength} ký tự).`, 400, 'field_too_long', { field });
  }
  return trimmed;
}
