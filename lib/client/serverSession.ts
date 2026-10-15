'use client';

/**
 * Đồng bộ phiên đăng nhập lên MÁY CHỦ.
 *
 * Trang trước đây chỉ lưu người dùng trong localStorage — thứ có thể bị sửa bằng tay nên không
 * thể dùng để cấp quyền quản trị. Sau khi đăng nhập, client gọi /api/auth/session để máy chủ
 * xác minh và phát cookie phiên (httpOnly). Quyền quản trị chỉ dựa trên cookie đó.
 */

export interface ServerSessionUser {
  email: string;
  name: string;
  avatar: string | null;
  role: 'member' | 'admin';
  isAdmin: boolean;
}

export interface ServerSessionState {
  authenticated: boolean;
  user: ServerSessionUser | null;
  services: { googleClientId: boolean; sessionSecret: boolean; adminAccessKey: boolean };
}

export async function fetchServerSession(): Promise<ServerSessionState | null> {
  try {
    const res = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as ServerSessionState;
  } catch {
    return null;
  }
}

/** Xác minh ID token Google ở server và mở phiên (có thể nhận quyền quản trị nếu trùng ADMIN_EMAIL). */
export async function establishGoogleSession(credential: string): Promise<{ ok: boolean; message: string; isAdmin?: boolean }> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, message: data?.error?.message || 'Không thiết lập được phiên máy chủ.' };
    }
    return { ok: true, message: data.verification || 'Đã thiết lập phiên máy chủ.', isAdmin: data.user?.isAdmin };
  } catch {
    return { ok: false, message: 'Không kết nối được tới máy chủ để thiết lập phiên.' };
  }
}

/** Đường email đã kiểm tra MX/DNS — chỉ nhận quyền thành viên, không bao giờ là quản trị. */
export async function establishEmailSession(
  email: string,
  name?: string
): Promise<{ ok: boolean; message: string; isAdmin?: boolean }> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, verifiedByMx: true }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, message: data?.error?.message || 'Không thiết lập được phiên máy chủ.' };
    }
    return { ok: true, message: data.verification || 'Đã thiết lập phiên máy chủ.', isAdmin: data.user?.isAdmin };
  } catch {
    return { ok: false, message: 'Không kết nối được tới máy chủ để thiết lập phiên.' };
  }
}

/**
 * Đăng nhập quản trị bằng KHOÁ MÁY CHỦ (ADMIN_ACCESS_KEY).
 * Khoá được gửi thẳng tới /api/auth/session để máy chủ so sánh bằng timingSafeEqual; khoá không
 * bao giờ được lưu vào localStorage. Chỉ dùng khi chưa cấu hình được Google Client ID.
 */
export async function establishAdminKeySession(
  adminKey: string
): Promise<{ ok: boolean; message: string; isAdmin?: boolean; email?: string; name?: string }> {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminKey }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      return { ok: false, message: data?.error?.message || 'Không thiết lập được phiên quản trị.' };
    }
    return {
      ok: true,
      message: data.verification || 'Đã thiết lập phiên quản trị.',
      isAdmin: data.user?.isAdmin,
      // Chỉ dùng để hiển thị (avatar/tên trên thanh điều hướng). Quyền vẫn do cookie máy chủ quyết định.
      email: data.user?.email,
      name: data.user?.name,
    };
  } catch {
    return { ok: false, message: 'Không kết nối được tới máy chủ để thiết lập phiên quản trị.' };
  }
}

export async function endServerSession(): Promise<void> {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch {
    /* phiên sẽ tự hết hạn */
  }
}
