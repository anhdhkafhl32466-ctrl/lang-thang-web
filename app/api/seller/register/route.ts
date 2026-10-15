import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizeEmail, normalizePhone, readJson, requireString } from '@/lib/server/http';
import { assertRateLimit, callerId, recordRateLimitHit } from '@/lib/server/rateLimit';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@/lib/server/password';
import { applySessionCookie, establishSellerSession, getSession } from '@/lib/server/session';
import { getStoreByOwnerEmail, createStore, isSellerAutoApproveEnabled, STORE_STATUS_META } from '@/lib/server/stores';
import { getUserByEmail } from '@/lib/server/users';
import { createNotification } from '@/lib/server/notifications';
import { sendAdminSellerApplicationEmail, isEmailConfigured } from '@/lib/server/email';
import { getAdminEmail } from '@/lib/config/commerce';
import { describeStorage } from '@/lib/server/storage';
import { execute, transaction } from '@/lib/server/db';
import { ensureDefaultWarehouseForStore } from '@/lib/server/warehouses';
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
 * Hỗ trợ đầy đủ 4 trường hợp nghiệp vụ (Nhiệm vụ 1):
 *  1. Email hoàn toàn mới: Tạo tài khoản, lưu mật khẩu băm, tạo hồ sơ cửa hàng & kho mặc định.
 *  2. Email đã có tài khoản khách hàng (chưa có shop): Cho phép nâng cấp thành tài khoản người bán,
 *     xác minh mật khẩu nếu đã có hoặc thiết lập mật khẩu mới, không làm mất đơn hàng khách đã mua.
 *  3. Email đã có shop: Thông báo rõ ràng và trả về đường dẫn tới Trung tâm người bán (/ban-hang).
 *  4. Đồng bộ dữ liệu an toàn, chống rò rỉ dữ liệu hoặc cấp quyền admin sai trái.
 */
export async function POST(request: NextRequest) {
  const rateKey = `seller-register:${callerId(request)}`;
  try {
    assertSameOrigin(request);
    assertRateLimit(rateKey, {
      limit: 10,
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

    // Trường hợp 3: Email đã có cửa hàng trên sàn
    const existingStore = await getStoreByOwnerEmail(email);
    if (existingStore) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'store_exists',
            message: `Tài khoản "${email}" đã có cửa hàng "${existingStore.name}" trên sàn. Bạn có thể truy cập ngay vào Trung tâm người bán để quản lý cửa hàng của mình.`,
            details: {
              store: {
                id: existingStore.id,
                name: existingStore.name,
                slug: existingStore.slug,
                status: existingStore.status,
              },
              redirectUrl: '/ban-hang',
            },
          },
          redirectUrl: '/ban-hang',
          store: {
            id: existingStore.id,
            name: existingStore.name,
            slug: existingStore.slug,
            status: existingStore.status,
          },
        },
        { status: 409 }
      );
    }

    const currentSession = getSession(request);
    const isCurrentSessionUser = Boolean(
      currentSession?.userEmail && currentSession.userEmail.toLowerCase() === email
    );

    const existingUser = await getUserByEmail(email);
    const passwordHash = hashPassword(String(body.password));
    let isUpgrade = false;

    if (existingUser) {
      // Trường hợp 2: Email đã có tài khoản khách hàng trên sàn
      if (existingUser.password_hash) {
        // Tài khoản đã có mật khẩu băm: kiểm tra nếu người dùng không phải đang đăng nhập chính email này
        const passwordMatches = verifyPassword(String(body.password), existingUser.password_hash);
        if (!passwordMatches && !isCurrentSessionUser) {
          throw new HttpError(
            'Email này đã có tài khoản khách hàng trên sàn. Mật khẩu bạn nhập không đúng với tài khoản đã có. Vui lòng nhập đúng mật khẩu hoặc đăng nhập tài khoản trước khi đăng ký mở shop.',
            401,
            'existing_account_password_mismatch'
          );
        }
        // Khớp mật khẩu hoặc đang có phiên hợp lệ: nâng cấp vai trò thành 'seller'
        await execute(
          `UPDATE users SET role = 'seller', name = COALESCE(?, name), phone = COALESCE(?, phone), last_login_at = ? WHERE email = ?`,
          [contactName, phone, new Date().toISOString(), email]
        );
      } else {
        // Tài khoản tạo từ Google OAuth hoặc khi đặt hàng (chưa có password_hash):
        // Thiết lập mật khẩu mới và nâng cấp role
        await execute(
          `UPDATE users SET role = 'seller', password_hash = ?, name = COALESCE(?, name), phone = COALESCE(?, phone), provider = COALESCE(provider, 'seller-password'), last_login_at = ? WHERE email = ?`,
          [passwordHash, contactName, phone, new Date().toISOString(), email]
        );
      }
      isUpgrade = true;
    } else {
      // Trường hợp 1: Email hoàn toàn mới
      const now = new Date().toISOString();
      await execute(
        `INSERT INTO users (id, email, name, avatar, role, provider, phone, password_hash, created_at, last_login_at)
         VALUES (?, ?, ?, NULL, 'seller', 'seller-password', ?, ?, ?, ?)`,
        [`usr_${crypto.randomUUID()}`, email, contactName, phone, passwordHash, now, now]
      );
    }

    const autoApprove = isSellerAutoApproveEnabled();
    const status = autoApprove ? 'active' : 'pending';

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

    // Tự động tạo kho xuất hàng mặc định cho shop (Nhiệm vụ 3)
    await ensureDefaultWarehouseForStore(store);

    // Phiên đăng nhập người bán (cookie httpOnly đã ký)
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
