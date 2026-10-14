/**
 * Web Push (Service Worker + Push API) — CHỈ chạy phía server.
 *
 * Web Push chỉ hoạt động khi:
 *  - Trang chạy trên HTTPS (hoặc localhost),
 *  - Có cặp khoá VAPID (VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY),
 *  - Người dùng đã đồng ý nhận thông báo và trình duyệt đã tạo subscription.
 *
 * Khi thiếu khoá VAPID, hệ thống báo rõ "chưa cấu hình" chứ KHÔNG giả vờ đã gửi thành công.
 */

import crypto from 'crypto';
import { execute, query } from './db';

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_email: string | null;
  failure_count: number;
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY?.trim() || null;
}

function getVapidPrivateKey(): string | null {
  return process.env.VAPID_PRIVATE_KEY?.trim() || null;
}

function getVapidSubject(): string {
  return process.env.VAPID_SUBJECT?.trim() || 'mailto:anhdhkafhl32466@gmail.com';
}

export function isPushConfigured(): boolean {
  return Boolean(getVapidPublicKey() && getVapidPrivateKey());
}

export function describePushConfig(): { configured: boolean; missing: string[] } {
  const missing: string[] = [];
  if (!getVapidPublicKey()) missing.push('VAPID_PUBLIC_KEY');
  if (!getVapidPrivateKey()) missing.push('VAPID_PRIVATE_KEY');
  return { configured: missing.length === 0, missing };
}

export async function saveSubscription(params: {
  endpoint: string;
  p256dh: string;
  auth: string;
  userEmail?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const email = params.userEmail?.trim().toLowerCase() ?? null;
  const existing = await query<{ id: string }>(`SELECT id FROM push_subscriptions WHERE endpoint = ?`, [
    params.endpoint,
  ]);

  if (existing[0]) {
    await execute(`UPDATE push_subscriptions SET p256dh = ?, auth = ?, user_email = ?, user_agent = ? WHERE endpoint = ?`, [
      params.p256dh,
      params.auth,
      email,
      params.userAgent || null,
      params.endpoint,
    ]);
    return;
  }

  await execute(
    `INSERT INTO push_subscriptions (id, endpoint, p256dh, auth, user_email, user_agent, created_at, last_success_at, failure_count)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 0)`,
    [
      `sub_${crypto.randomUUID()}`,
      params.endpoint,
      params.p256dh,
      params.auth,
      email,
      params.userAgent || null,
      new Date().toISOString(),
    ]
  );
}

export async function removeSubscription(endpoint: string): Promise<void> {
  await execute(`DELETE FROM push_subscriptions WHERE endpoint = ?`, [endpoint]);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface PushSendSummary {
  configured: boolean;
  attempted: number;
  sent: number;
  failed: number;
  removed: number;
  errors: string[];
}

/**
 * Gửi thông báo đẩy tới mọi thiết bị đã đăng ký của một email.
 * Subscription hết hạn (410/404) sẽ bị xoá khỏi cơ sở dữ liệu.
 */
export async function sendPushToEmail(email: string | null, payload: PushPayload): Promise<PushSendSummary> {
  const summary: PushSendSummary = {
    configured: isPushConfigured(),
    attempted: 0,
    sent: 0,
    failed: 0,
    removed: 0,
    errors: [],
  };

  if (!isPushConfigured()) {
    summary.errors.push('Chưa cấu hình VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY.');
    return summary;
  }

  const normalized = email?.trim().toLowerCase() ?? null;
  const rows = normalized
    ? await query<SubscriptionRow>(`SELECT * FROM push_subscriptions WHERE user_email = ?`, [normalized])
    : await query<SubscriptionRow>(`SELECT * FROM push_subscriptions WHERE user_email IS NULL`);

  if (rows.length === 0) return summary;

  const webpush = (await import('web-push')).default;
  webpush.setVapidDetails(getVapidSubject(), getVapidPublicKey() as string, getVapidPrivateKey() as string);

  const body = JSON.stringify(payload);

  for (const row of rows) {
    summary.attempted += 1;
    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
        body,
        { TTL: 60 * 60 * 24 }
      );
      summary.sent += 1;
      await execute(`UPDATE push_subscriptions SET last_success_at = ?, failure_count = 0 WHERE id = ?`, [
        new Date().toISOString(),
        row.id,
      ]);
    } catch (error: any) {
      const statusCode = error?.statusCode;
      summary.failed += 1;
      summary.errors.push(`${row.endpoint.slice(0, 40)}…: ${error?.message || 'lỗi không rõ'}`);
      if (statusCode === 404 || statusCode === 410) {
        await removeSubscription(row.endpoint);
        summary.removed += 1;
      } else {
        await execute(`UPDATE push_subscriptions SET failure_count = failure_count + 1 WHERE id = ?`, [row.id]);
      }
    }
  }

  return summary;
}

export async function countSubscriptions(): Promise<number> {
  const row = await query<{ count: number }>(`SELECT COUNT(*) AS count FROM push_subscriptions`);
  return Number(row[0]?.count ?? 0);
}
