/**
 * Người dùng và phiên đăng nhập — lưu trong cơ sở dữ liệu phía máy chủ.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from './db';

export interface DbUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  role: 'member' | 'admin';
  provider: string | null;
  created_at: string;
  last_login_at: string | null;
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  return queryOne<DbUser>(`SELECT * FROM users WHERE email = ?`, [email.trim().toLowerCase()]);
}

/** Tạo mới hoặc cập nhật người dùng khi đăng nhập. Vai trò do server quyết định, không nhận từ client. */
export async function upsertUser(params: {
  email: string;
  name?: string | null;
  avatar?: string | null;
  role: 'member' | 'admin';
  provider: string;
}): Promise<DbUser> {
  const email = params.email.trim().toLowerCase();
  const now = new Date().toISOString();
  const existing = await getUserByEmail(email);

  if (existing) {
    await execute(`UPDATE users SET name = ?, avatar = ?, role = ?, provider = ?, last_login_at = ? WHERE email = ?`, [
      params.name ?? existing.name,
      params.avatar ?? existing.avatar,
      params.role,
      params.provider,
      now,
      email,
    ]);
    return { ...existing, name: params.name ?? existing.name, role: params.role, last_login_at: now };
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
