import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizeEmail, normalizePhone, readJson, requireString } from '@/lib/server/http';
import { assertRateLimit, callerId, recordRateLimitHit } from '@/lib/server/rateLimit';
import { hashPassword, validatePasswordStrength } from '@/lib/server/password';
import { applySessionCookie, establishSellerSession } from '@/lib/server/session';
import { getStoreByOwnerEmail, createStore, isSellerAutoApproveEnabled, STORE_STATUS_META } from '@/lib/server/stores';
import { getUserByEmail } from '@/lib/server/users';
import { createNotification } from '@/lib/server/notifications';
import { sendAdminSellerApplicationEmail, isEmailConfigured } from '@/lib/server/email';
import { getAdminEmail } from '@/lib/config/commerce';
import { describeStorage } from '@/lib/server/storage';
import { execute, transaction } from '@/lib/server/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

interface RegisterBody {
  contactName?: string;
  storeName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  addressText?: string;
  addressNote?: string;
  description?: string;
  categories?: string[] | string;
  logoUrl?: string;
  lat?: number;
  lng?: number;
}

function readCategories(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return raw
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 10);
}

/**
 * POST /api/seller/register — đăng ký tài khoản người bán.
 *
 * Bảo mật:
 *  - Email quản trị viên KHÔNG được dùng để đăng ký người bán (nếu không, bất kỳ ai cũng có thể đặt
 *    mật khẩu cho email quản trị và chiếm quyền điều hành sàn).
 *  - Email đã tồn tại thì từ chối: người dùng cũ phải đăng nhập, không được "nhận lại" tài khoản
 *    bằng cách đặt mật khẩu mới (chưa có dịch vụ xác minh email nên đây là bước bắt buộc).
 *  - Trạng thái mặc định là 'pending' (chờ duyệt); chỉ bật tự động kích hoạt khi cấu hình
 *    SELLER_AUTO_APPROVE=true và mặc định vẫn ghi nhận để quản trị viên biết.
 */
export async function POST(request: NextRequest) {
  const rateKey = `seller-register:${callerId(request)}`;
  try {
    assertSameOrigin(request);
    assertRateLimit(rateKey, {
      limit: 6,
      windowMs: 60 * 60 * 1000,
      message: 'Bạn đã gửi quá nhiều hồ sơ đăng ký. Vui lòng thử lại sau {minutes} phút.',
    });

    const body = await readJson<RegisterBody>(request);

    const contactName = requireString(body.contactName, 'họ và tên người đại diện', 120);
    const storeName = requireString(body.storeName, 'tên cửa hàng', 120);
    const email = normalizeEmail(body.email);
    if (!email) throw new HttpError('Email không hợp lệ.', 400, 'invalid_email');

    const rawPhone = requireString(body.phone, 'số điện thoại', 30);
    const phone = normalizePhone(rawPhone);
    if (!phone) throw new HttpError('Số điện thoại không hợp lệ.', 400, 'invalid_phone');

    const passwordError = validatePasswordStrength(body.password);
    if (passwordError) throw new HttpError(passwordError, 400, 'weak_password');
    if (body.password !== body.confirmPassword) {
      throw new HttpError('Mật khẩu xác nhận không khớp.', 400, 'password_mismatch');
    }

    const addressText = requireString(body.addressText, 'địa chỉ cửa hàng', 400);
    const addressNote = body.addressNote ? String(body.addressNote).slice(0, 400) : null;
    const description = body.description ? String(body.description).slice(0, 2000) : null;
    const categories = readCategories(body.categories);
    const logoUrl = body.logoUrl?.trim() || null;

    let lat = typeof body.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
    let lng = typeof body.lng === 'number' && Number.isFinite(body.lng) ? body.lng : null;
    // Toạ độ phải đi theo cặp: chỉ có một nửa thì bản đồ/tuyến đường sẽ sai.
    if ((lat === null) !== (lng === null)) {
      lat = null;
      lng = null;
    }

    if (email === getAdminEmail()) {
      throw new HttpError(
        'Không thể đăng ký tài khoản người bán bằng email quản trị viên của sàn.',
        403,
        'admin_email_reserved'
      );
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      throw new HttpError(
        'Email này đã có tài khoản trên sàn. Vui lòng đăng nhập, hoặc dùng email khác để đăng ký bán hàng.',
        409,
        'email_exists'
      );
    }

    const existingStore = await getStoreByOwnerEmail(email);
    if (existingStore) {
      throw new HttpError('Email này đã có cửa hàng trên sàn.', 409, 'store_exists');
    }

    const autoApprove = isSellerAutoApproveEnabled();
    const status = autoApprove ? 'active' : 'pending';

    // 1. Tạo tài khoản (mật khẩu đã băm bằng scrypt) + cửa hàng trong cùng một giao dịch.
    const passwordHash = hashPassword(String(body.password));
    await transaction(async () => {
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO users (id, email, name, avatar, role, provider, phone, password_hash, created_at, last_login_at)
         VALUES (?, ?, ?, NULL, 'seller', 'seller-password', ?, ?, ?, NULL)`,
        [`usr_${crypto.randomUUID()}`, email, contactName, phone, passwordHash, now]
      );
    });

    const store = await createStore({
      ownerEmail: email,
      name: storeName,
      description,
      phone,
      contactName,
      addressText,
      addressNote,
      lat,
      lng,
      logoUrl,
      categories,
      status,
    });

    // 2. Phiên đăng nhập người bán (cookie httpOnly đã ký).
    const { token, payload, maxAge } = await establishSellerSession({
      email,
      name: contactName,
      userAgent: request.headers.get('user-agent'),
    });
    await execute(
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

    // 3. Thông báo vận hành cho quản trị viên sàn (lỗi ở bước này không được làm hỏng hồ sơ đã lưu).
    let adminEmail: { status: string; error?: string } | null = null;
    try {
      await createNotification({
        audience: 'admin',
        title: autoApprove ? `Người bán mới: ${store.name}` : `Hồ sơ người bán cần duyệt: ${store.name}`,
        body: `${contactName} · ${email} · ${phone} · ${addressText}`,
        link: '/admin/cua-hang',
      });
      adminEmail = await sendAdminSellerApplicationEmail({
        storeName: store.name,
        contactName,
        ownerEmail: email,
        phone,
        addressText,
        categories,
        autoApproved: autoApprove,
      });
    } catch (error: any) {
      adminEmail = { status: 'failed', error: error?.message || 'Không gửi được thông báo cho quản trị viên.' };
    }

    const response = NextResponse.json(
      {
        ok: true,
        store,
        autoApproved: autoApprove,
        statusMessage: autoApprove
          ? 'Cửa hàng đã được kích hoạt tự động (SELLER_AUTO_APPROVE=true). Bạn có thể đăng sản phẩm ngay.'
          : `Hồ sơ đã được gửi tới ban quản trị sàn. Trạng thái hiện tại: ${STORE_STATUS_META[store.status].label}. Bạn có thể đăng nhập và theo dõi, nhưng chỉ đăng bán được sau khi được duyệt.`,
        adminNotification: adminEmail,
        emailService: {
          configured: isEmailConfigured(),
          note: isEmailConfigured()
            ? 'Email giao dịch đã được cấu hình.'
            : 'Chưa cấu hình RESEND_API_KEY nên email xác minh/chào mừng chưa được gửi; hồ sơ vẫn được lưu trong cơ sở dữ liệu.',
        },
        storage: describeStorage(),
      },
      { status: 201 }
    );
    applySessionCookie(response, token, maxAge);
    return response;
  } catch (error) {
    if (error instanceof HttpError && error.status !== 429) {
      // Chỉ tính các lần thất bại do dữ liệu (không tính lỗi hệ thống) vào giới hạn tần suất.
      recordRateLimitHit(rateKey, 60 * 60 * 1000);
    }
    return jsonError(error);
  }
}
