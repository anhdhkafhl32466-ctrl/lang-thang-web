import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { assertRateLimit, callerId, clearRateLimit, recordRateLimitHit } from '@/lib/server/rateLimit';
import { verifyPassword } from '@/lib/server/password';
import { applySessionCookie, clearSessionCookie, establishSellerSession } from '@/lib/server/session';
import { getSellerAreaState } from '@/lib/server/sellerAuth';
import { getStoreByOwnerEmail, STORE_STATUS_META } from '@/lib/server/stores';
import { getUserByEmail } from '@/lib/server/users';
import { getStoreStatusSummary } from '@/lib/server/sellerOverview';
import { describeStorage } from '@/lib/server/storage';
import { describeDbBackend } from '@/lib/server/db';
import { isPushConfigured } from '@/lib/server/push';
import { isEmailConfigured } from '@/lib/server/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const LOGIN_ATTEMPT_LIMIT = 8;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

/** GET /api/seller/session — trạng thái khu vực người bán của phiên hiện tại. */
export async function GET(request: NextRequest) {
  try {
    const state = await getSellerAreaState(request);
    return NextResponse.json({
      ok: true,
      ...state,
      services: {
        email: isEmailConfigured(),
        push: isPushConfigured(),
        storage: describeStorage(),
        database: describeDbBackend().backend,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/seller/session — đăng nhập bằng email + mật khẩu của tài khoản người bán.
 *
 * Chống dò mật khẩu: giới hạn số lần SAI theo cả IP lẫn email; đăng nhập đúng thì xóa bộ đếm.
 * Thông báo lỗi luôn nói chung chung (không tiết lộ email nào tồn tại trên sàn).
 */
export async function POST(request: NextRequest) {
  const ip = callerId(request);
  try {
    assertSameOrigin(request);
    const body = await readJson<{ email?: string; password?: string }>(request);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!email || !password) {
      throw new HttpError('Vui lòng nhập email và mật khẩu.', 400, 'missing_credentials');
    }

    const ipKey = `seller-login-ip:${ip}`;
    const emailKey = `seller-login-email:${email}`;
    const limitMessage = 'Bạn đã đăng nhập sai quá nhiều lần. Vui lòng thử lại sau {minutes} phút.';
    assertRateLimit(ipKey, { limit: LOGIN_ATTEMPT_LIMIT, windowMs: LOGIN_ATTEMPT_WINDOW_MS, message: limitMessage });
    assertRateLimit(emailKey, { limit: LOGIN_ATTEMPT_LIMIT, windowMs: LOGIN_ATTEMPT_WINDOW_MS, message: limitMessage });

    const user = await getUserByEmail(email);
    const ok = Boolean(user?.password_hash) && verifyPassword(password, user?.password_hash);

    if (!ok) {
      recordRateLimitHit(ipKey, LOGIN_ATTEMPT_WINDOW_MS);
      recordRateLimitHit(emailKey, LOGIN_ATTEMPT_WINDOW_MS);
      throw new HttpError('Email hoặc mật khẩu không đúng.', 401, 'invalid_credentials');
    }

    clearRateLimit(ipKey);
    clearRateLimit(emailKey);

    const { token, payload, maxAge } = await establishSellerSession({
      userId: user?.id,
      email,
      name: user?.name || null,
      userAgent: request.headers.get('user-agent'),
    });

    await (await import('@/lib/server/db')).execute(
      `INSERT INTO sessions (id, user_email, role, issued_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        `ses_${crypto.randomUUID()}`,
        email,
        'seller',
        new Date(payload.issuedAt).toISOString(),
        new Date(payload.expiresAt).toISOString(),
        request.headers.get('user-agent') || null,
      ]
    );

    const { getStoreByOwner } = await import('@/lib/server/stores');
    const store = await getStoreByOwner({ userId: user?.id, email });
    const response = NextResponse.json({
      ok: true,
      user: { id: payload.userId, email: payload.userEmail, name: payload.name, role: payload.role },
      store,
      statusMessage: store
        ? STORE_STATUS_META[store.status].description
        : 'Tài khoản này chưa có hồ sơ cửa hàng.',
      summary: store ? await getStoreStatusSummary(store.id) : null,
    });
    applySessionCookie(response, token, maxAge);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/seller/session — đăng xuất khỏi khu vực người bán. */
export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const response = NextResponse.json({ ok: true, loggedOut: true });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}
