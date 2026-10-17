/**
 * Thông báo trong website — lưu trong cơ sở dữ liệu để tồn tại giữa các phiên và thiết bị.
 *
 * Mô hình đa người bán có BA nhóm người nhận:
 *  - 'admin'   : bảng điều khiển của sàn (thông báo vận hành toàn sàn).
 *  - 'customer': người mua, nhận theo email của chính tài khoản đã đặt đơn.
 *  - 'seller'  : người bán, nhận theo email chủ cửa hàng. Một người bán CHỈ thấy thông báo gắn với
 *                email của mình, nên không thể đọc được thông báo của cửa hàng khác.
 *
 * Vì vậy hàm đọc phải nhận VAI TRÒ NGƯỜI XEM (viewer) do máy chủ xác định từ phiên đăng nhập, chứ
 * không dùng cờ boolean dễ bị hiểu sai ở phía gọi.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from './db';
import type { SiteNotification } from '@/lib/orders/types';

export type NotificationAudience = 'admin' | 'customer' | 'seller';

interface NotificationRow {
  id: string;
  audience: NotificationAudience;
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
  audience: NotificationAudience;
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

/** Điều kiện lọc theo vai trò người xem — CÙNG một câu điều kiện được dùng cho cả đọc và đánh dấu đã đọc. */
function viewerClause(viewer: 'admin' | 'customer' | 'seller'): { where: string; params: (string | null)[] } {
  if (viewer === 'admin') {
    // Quản trị viên thấy thông báo vận hành toàn sàn và thông báo gửi tới chính email của mình.
    return {
      where: `(audience = 'admin' OR (user_email IS NOT NULL AND user_email = ?))`,
      params: [],
    };
  }
  //
  // Khách và người bán chỉ thấy thông báo gửi ĐÍCH DANH tới email của mình — KHÔNG lọc theo audience:
  // một tài khoản có thể vừa mua hàng vừa bán hàng, nên nếu chỉ hiện đúng một audience thì người dùng
  // sẽ mất thông báo của vai trò còn lại (ví dụ người bán không thấy phản hồi cho đơn mua của chính mình).
  // Thông báo quảng bá của quản trị (audience='admin', user_email NULL) vẫn không bao giờ lọt vào đây.
  return {
    where: `user_email = ? AND audience <> 'admin'`,
    params: [],
  };
}

/**
 * Danh sách thông báo cho một người xem.
 *  - Quản trị viên: thông báo audience='admin' + thông báo gửi tới email của mình.
 *  - Người bán: thông báo audience='seller' gửi tới email chủ cửa hàng.
 *  - Khách: thông báo audience='customer' gửi tới email của mình.
 */
export async function listNotifications(params: {
  email: string | null;
  viewer: 'admin' | 'customer' | 'seller';
  limit?: number;
}): Promise<{ items: SiteNotification[]; unreadCount: number }> {
  const limit = Math.min(Math.max(Number(params.limit) || 20, 1), 100);
  const email = params.email?.trim().toLowerCase() ?? null;
  const clause = viewerClause(params.viewer);

  // Không có email (quán khách chưa đăng nhập) thì chỉ quản trị viên mới có gì để xem.
  if (params.viewer !== 'admin' && !email) {
    return { items: [], unreadCount: 0 };
  }

  const args: (string | null)[] = params.viewer === 'admin' ? [email] : [email, ...clause.params];
  const rows = await query<NotificationRow>(
    `SELECT * FROM notifications WHERE ${clause.where} ORDER BY created_at DESC LIMIT ${limit}`,
    args
  );

  const unreadRow = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM notifications WHERE read_at IS NULL AND ${clause.where}`,
    args
  );

  return { items: rows.map(toNotification), unreadCount: Number(unreadRow?.count ?? 0) };
}

export async function markNotificationRead(
  id: string,
  email: string | null,
  viewer: 'admin' | 'customer' | 'seller'
): Promise<boolean> {
  const existing = await queryOne<NotificationRow>(`SELECT * FROM notifications WHERE id = ?`, [id]);
  if (!existing) return false;

  const normalized = email?.trim().toLowerCase() ?? null;
  const ownsIt =
    (viewer === 'admin' && existing.audience === 'admin') ||
    (normalized !== null && existing.user_email === normalized);
  if (!ownsIt) return false;

  if (!existing.read_at) {
    await execute(`UPDATE notifications SET read_at = ? WHERE id = ?`, [new Date().toISOString(), id]);
  }
  return true;
}

export async function markAllNotificationsRead(
  email: string | null,
  viewer: 'admin' | 'customer' | 'seller'
): Promise<number> {
  const now = new Date().toISOString();
  const normalized = email?.trim().toLowerCase() ?? null;

  if (viewer === 'admin') {
    await execute(
      `UPDATE notifications SET read_at = ? WHERE read_at IS NULL AND (audience = 'admin' OR (user_email IS NOT NULL AND user_email = ?))`,
      [now, normalized]
    );
  } else if (normalized) {
    await execute(
      `UPDATE notifications SET read_at = ? WHERE read_at IS NULL AND user_email = ? AND audience <> 'admin'`,
      [now, normalized]
    );
  }
  return 0;
}

/** Số thông báo CHƯA ĐỌC của người bán — hiển thị trên huy hiệu của Trung tâm người bán. */
export async function countUnreadForSeller(email: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM notifications WHERE read_at IS NULL AND audience = 'seller' AND user_email = ?`,
    [email.trim().toLowerCase()]
  );
  return Number(row?.count ?? 0);
}
