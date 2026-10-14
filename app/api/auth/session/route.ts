import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizeEmail, readJson } from '@/lib/server/http';
import {
  applySessionCookie,
  clearSessionCookie,
  establishSession,
  getSession,
  isSessionSecretConfigured,
} from '@/lib/server/session';
import { recordSession } from '@/lib/server/users';
import { getAdminEmail } from '@/lib/config/commerce';

export const dynamic = 'force-dynamic';

interface GoogleTokenInfo {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
  exp?: string;
  sub?: string;
}

/**
 * Xác minh ID token của Google ở phía MÁY CHỦ.
 * Gọi endpoint tokeninfo của Google: chữ ký, hạn dùng và (khi có cấu hình) audience đều được kiểm tra
 * bởi chính Google — client không thể tự khai báo email.
 */
async function verifyGoogleCredential(credential: string): Promise<GoogleTokenInfo> {
  const expectedAudience = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  if (!expectedAudience) {
    throw new HttpError(
      'Máy chủ chưa cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID nên chưa thể xác minh danh tính Google một cách an toàn.',
      503,
      'google_client_id_missing',
      { missing: ['NEXT_PUBLIC_GOOGLE_CLIENT_ID'] }
    );
  }

  let response: Response;
  try {
    response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
      cache: 'no-store',
    });
  } catch {
    throw new HttpError('Không kết nối được tới máy chủ xác thực Google.', 502, 'google_unreachable');
  }

  if (!response.ok) {
    throw new HttpError('ID token của Google không hợp lệ hoặc đã hết hạn.', 401, 'invalid_google_token');
  }

  const info = (await response.json()) as GoogleTokenInfo;
  if (info.aud !== expectedAudience) {
    throw new HttpError('ID token không được phát hành cho ứng dụng này.', 401, 'audience_mismatch');
  }
  if (!info.email || !(info.email_verified === true || info.email_verified === 'true')) {
    throw new HttpError('Tài khoản Google này chưa xác minh email.', 401, 'email_not_verified');
  }
  return info;
}

/** GET /api/auth/session — thông tin phiên hiện tại (đọc từ cookie đã ký). */
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    return NextResponse.json({
      ok: true,
      authenticated: Boolean(session),
      user: session
        ? {
            email: session.userEmail,
            name: session.name,
            avatar: session.avatar,
            role: session.role,
            isAdmin: session.role === 'admin' && session.userEmail === getAdminEmail(),
            issuedAt: new Date(session.issuedAt).toISOString(),
            expiresAt: new Date(session.expiresAt).toISOString(),
          }
        : null,
      services: {
        googleClientId: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()),
        sessionSecret: isSessionSecretConfigured(),
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/auth/session — thiết lập phiên máy chủ.
 *  - { credential }               : xác minh Google thật (có thể nhận quyền quản trị).
 *  - { email, name, verifiedByMx }: đường email đã kiểm tra MX/DNS (CHỈ quyền thành viên, không bao giờ admin).
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await readJson<{ credential?: string; email?: string; name?: string; verifiedByMx?: boolean }>(request);

    let email: string;
    let name: string | null = null;
    let avatar: string | null = null;
    let provider: string;
    let verification: string;

    if (body.credential) {
      const info = await verifyGoogleCredential(body.credential);
      email = String(info.email).toLowerCase();
      name = info.name || null;
      avatar = info.picture || null;
      provider = 'google';
      verification = 'Google ID token đã được máy chủ Google xác minh (chữ ký, hạn dùng, audience).';
    } else {
      const candidate = normalizeEmail(body.email);
      if (!candidate) throw new HttpError('Thiếu email để thiết lập phiên.', 400, 'missing_email');
      if (!body.verifiedByMx) {
        throw new HttpError(
          'Phiên email chỉ được thiết lập sau khi tên miền đã được kiểm tra MX/DNS.',
          400,
          'email_not_verified'
        );
      }
      email = candidate;
      name = body.name?.trim() || null;
      provider = 'email-mx';
      verification =
        'Email được xác minh qua bản ghi MX/DNS. Đây KHÔNG phải xác thực danh tính, nên tài khoản chỉ có quyền thành viên.';
    }

    const { token, payload, maxAge } = await establishSession({
      email,
      name,
      avatar,
      provider,
      userAgent: request.headers.get('user-agent'),
    });

    await recordSession({
      email: payload.userEmail,
      role: payload.role,
      expiresAt: new Date(payload.expiresAt),
      userAgent: request.headers.get('user-agent'),
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        email: payload.userEmail,
        name: payload.name,
        avatar: payload.avatar,
        role: payload.role,
        isAdmin: payload.role === 'admin' && payload.userEmail === getAdminEmail(),
      },
      verification,
      adminNote:
        payload.role === 'admin'
          ? 'Email này trùng với ADMIN_EMAIL trong cấu hình nên được cấp quyền quản trị.'
          : 'Tài khoản thành viên: không có quyền truy cập trang quản trị đơn hàng.',
    });
    applySessionCookie(response, token, maxAge);
    return response;
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/auth/session — đăng xuất, xoá cookie phiên. */
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
