/**
 * Người dùng và phiên đăng nhập — lưu trong cơ sở dữ liệu phía máy chủ.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from './db';

export type UserRole = 'member' | 'admin' | 'seller';

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: UserRole;
  provider: string | null;
  created_at: string;
  last_login_at: string | null;
  /** Chỉ có giá trị với tài khoản người bán đăng nhập bằng mật khẩu riêng. */
  password_hash?: string | null;
  phone?: string | null;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()]);
}

/**
 * Tài khoản người bán đã có mật khẩu — dùng cho luồng đăng nhập bằng mật khẩu.
 * Hàm này KHÔNG được trả dữ liệu ra ngoài API (chỉ dùng nội bộ để so sánh mật khẩu).
 */
export async function getUserForPasswordLogin(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()]);
}

/** Ghi mật khẩu đã băm cho tài khoản người bán (không bao giờ lưu mật khẩu thô). */
export async function setUserPassword(email: string, passwordHash: string, phone?: string | null): Promise<void> {
  await execute(`UPDATE users SET password_hash = ?, phone = COALESCE(?, phone), role = 'seller' WHERE email = ?`, [
    passwordHash,
    phone?.trim() || null,
    email.trim().toLowerCase(),
  ]);
}

/** Tạo mới hoặc cập nhật người dùng khi đăng nhập. Vai trò do server quyết định, không nhận từ client. */
export async function upsertUser(params: {
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: UserRole;
  provider: string;
}): Promise<DbUser> {
  const email = params.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const existing = await getUserByEmail(email);

  if (existing) {
    // Không bao giờ HẠ QUYỀN một tài khoản quản trị đã có: một đường đăng nhập yếu hơn (ví dụ email
    // kiểm tra MX) không được phép biến quyền admin thành member và khoá chủ website ra ngoài.
    const role = existing.role === 'admin' ? 'admin' : params.role;
    await execute(`UPDATE users SET name = ?, avatar = ?, role = ?, provider = ?, last_login_at = ? WHERE email = ?`, [
      params.name ?? existing.name,
      params.avatar ?? existing.avatar,
      role,
      params.provider,
      now,
      email,
    ]);
    return { ...existing, name: params.name ?? existing.name, role, last_login_at: now };
  }

  const id = `usr_${crypto.randomUUID()}`;
  await execute(
    `INSERT INTO users (id, email, name, avatar, role, provider, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, email, params.name ?? null, params.avatar ?? null, params.role, params.provider, now, now]
  );

  return {
    id,
    email,
    name: params.name ?? null,
    avatar: params.avatar ?? null,
    role: params.role,
    provider: params.provider,
    created_at: now,
    last_login_at: now,
  };
}

/** Ghi nhận một phiên đăng nhập để có nhật ký kiểm toán phía máy chủ. */
export async function recordSession(params: {
  email: string;
  role: string;
  expiresAt: Date;
  userAgent?: string | null;
}): Promise<void> {
  const now = new Date();
  await execute(
    `INSERT INTO sessions (id, user_email, role, issued_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      `ses_${crypto.randomUUID()}`,
      params.email.trim().toLowerCase(),
      params.role,
      now.toISOString(),
      params.expiresAt.toISOString(),
      params.userAgent || null,
    ]
  );
}

export async function listRecentSessions(email: string, limit = 20): Promise<any[]> {
  return query(`SELECT * FROM sessions WHERE user_email = ? ORDER BY issued_at DESC LIMIT ${Number(limit) || 20}`, [
    email.trim().toLowerCase(),
  ]);
}
