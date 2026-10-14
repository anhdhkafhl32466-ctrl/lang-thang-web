/**
 * Thông báo trong website — lưu trong cơ sở dữ liệu để tồn tại giữa các phiên và thiết bị.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from './db';
import type { SiteNotification } from '@/lib/orders/types';

interface NotificationRow {
  id: string;
  audience: 'admin' | 'customer';
  user_email: string | null;
  order_id: string | null;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function toNotification(row: NotificationRow): SiteNotification {
  return {
    id: row.id,
    audience: row.audience,
    userEmail: row.user_email,
    orderId: row.order_id,
    title: row.title,
    body: row.body,
    link: row.link,
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export async function createNotification(params: {
  audience: 'admin' | 'customer';
  userEmail?: string | null;
  orderId?: string | null;
  title: string;
  body?: string | null;
  link?: string | null;
}): Promise<SiteNotification> {
  const id = `ntf_${crypto.randomUUID()}`;
  const createdAt = new Date().toISOString();
  await execute(
    `INSERT INTO notifications (id, audience, user_email, order_id, title, body, link, read_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    [
      id,
      params.audience,
      params.userEmail?.trim().toLowerCase() ?? null,
      params.orderId ?? null,
      params.title,
      params.body ?? null,
      params.link ?? null,
      createdAt,
    ]
  );
  return {
    id,
    audience: params.audience,
    userEmail: params.userEmail?.trim().toLowerCase() ?? null,
    orderId: params.orderId ?? null,
    title: params.title,
    body: params.body ?? null,
    link: params.link ?? null,
    readAt: null,
    createdAt,
  };
}

/**
 * Danh sách thông báo cho một người xem.
 *  - Quản trị viên thấy thông báo audience='admin' và các thông báo gửi tới email của mình.
 *  - Khách chỉ thấy thông báo gắn với email của mình.
 */
export async function listNotifications(params: {
  email: string | null;
  isAdmin: boolean;
  limit?: number;
}): Promise<{ items: SiteNotification[]; unreadCount: number }> {
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
  const email = params.email?.trim().toLowerCase() ?? null;

  let rows: NotificationRow[];
  if (params.isAdmin) {
    rows = await query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE audience = 'admin' OR (user_email IS NOT NULL AND user_email = ?)
       ORDER BY created_at DESC LIMIT ${limit}`,
      [email]
    );
  } else if (email) {
    rows = await query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE user_email = ? AND audience = 'customer'
       ORDER BY created_at DESC LIMIT ${limit}`,
      [email]
    );
  } else {
    rows = [];
  }

  const unreadRow = await queryOne<{ count: number }>(
    params.isAdmin
      ? `SELECT COUNT(*) AS count FROM notifications
         WHERE read_at IS NULL AND (audience = 'admin' OR (user_email IS NOT NULL AND user_email = ?))`
      : `SELECT COUNT(*) AS count FROM notifications
         WHERE read_at IS NULL AND user_email = ? AND audience = 'customer'`,
    [email]
  );

  return { items: rows.map(toNotification), unreadCount: Number(unreadRow?.count ?? 0) };
}

export async function markNotificationRead(id: string, email: string | null, isAdmin: boolean): Promise<boolean> {
  const existing = await queryOne<NotificationRow>(`SELECT * FROM notifications WHERE id = ?`, [id]);
  if (!existing) return false;

  const ownsIt =
    (isAdmin && existing.audience === 'admin') ||
    (email && existing.user_email === email.trim().toLowerCase());
  if (!ownsIt) return false;

  if (!existing.read_at) {
    await execute(`UPDATE notifications SET read_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
  }
  return true;
}

export async function markAllNotificationsRead(email: string | null, isAdmin: boolean): Promise<number> {
  const now = new Date().toISOString();
  const normalized = email?.trim().toLowerCase() ?? null;
  if (isAdmin) {
    await execute(
      `UPDATE notifications SET read_at = ? WHERE read_at IS NULL AND (audience = 'admin' OR (user_email IS NOT NULL AND user_email = ?))`,
      [now, normalized]
    );
  } else if (normalized) {
    await execute(
      `UPDATE notifications SET read_at = ? WHERE read_at IS NULL AND user_email = ? AND audience = 'customer'`,
      [now, normalized]
    );
  }
  return 0;
}
