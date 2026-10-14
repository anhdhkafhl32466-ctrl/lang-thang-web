/**
 * Gửi email giao dịch qua Resend — CHỈ chạy phía server.
 *
 * Nguyên tắc:
 *  - Không bao giờ tuyên bố "đã gửi" nếu nhà cung cấp chưa xác nhận. Kết quả trả về phản ánh
 *    đúng phản hồi API (sent / failed) và được ghi vào bảng email_log để tra cứu sau.
 *  - Thiếu RESEND_API_KEY -> trạng thái 'skipped_no_credentials' (KHÔNG phải thành công),
 *    kèm hướng dẫn biến môi trường cần cấu hình.
 *  - Không có API key hay mật khẩu nào bị đẩy ra phía trình duyệt.
 */

import crypto from 'crypto';
import { execute } from './db';
import { getAdminEmail, STORE_INFO } from '@/lib/config/commerce';
import type { Order } from '@/lib/orders/types';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';

export type EmailKind =
  | 'admin_new_order'
  | 'customer_order_confirmation'
  | 'customer_status_update'
  | 'admin_status_update';

export type EmailStatus = 'sent' | 'failed' | 'skipped_no_credentials';

export interface EmailResult {
  status: EmailStatus;
  providerId?: string;
  error?: string;
  to: string;
}

function fromAddress(): string {
  return process.env.EMAIL_FROM?.trim() || `Lang Thang <onboarding@resend.dev>`;
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

function formatVnd(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' ₫';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function logEmail(params: {
  orderId: string | null;
  to: string;
  kind: EmailKind;
  status: EmailStatus;
  providerId?: string;
  error?: string;
}): Promise<void> {
  await execute(
    `INSERT INTO email_log (id, order_id, to_email, kind, provider, status, provider_id, error, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `eml_${crypto.randomUUID()}`,
      params.orderId,
      params.to,
      params.kind,
      'resend',
      params.status,
      params.providerId ?? null,
      params.error ?? null,
      new Date().toISOString(),
    ]
  );
}

/** Gửi một email và ghi log. Trả về kết quả thật từ nhà cung cấp. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  kind: EmailKind;
  orderId?: string | null;
  replyTo?: string;
}): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = params.to.trim();

  if (!apiKey) {
    await logEmail({
      orderId: params.orderId ?? null,
      to,
      kind: params.kind,
      status: 'skipped_no_credentials',
      error: 'Thiếu biến môi trường RESEND_API_KEY nên email chưa được gửi.',
    });
    return {
      status: 'skipped_no_credentials',
      error: 'Chưa cấu hình RESEND_API_KEY.',
      to,
    };
  }

  try {
    const { Resend } = await import('resend');
    const resend = new Resend(apiKey);
    const response = await resend.emails.send({
      from: fromAddress(),
      to,
      subject: params.subject,
      html: params.html,
      ...(params.replyTo ? { replyTo: params.replyTo } : {}),
    });

    if (response.error) {
      const message = response.error.message || 'Resend từ chối gửi email.';
      await logEmail({
        orderId: params.orderId ?? null,
        to,
        kind: params.kind,
        status: 'failed',
        error: message,
      });
      return { status: 'failed', error: message, to };
    }

    const providerId = response.data?.id;
    await logEmail({
      orderId: params.orderId ?? null,
      to,
      kind: params.kind,
      status: 'sent',
      providerId,
    });
    return { status: 'sent', providerId, to };
  } catch (error: any) {
    const message = error?.message || 'Không kết nối được tới dịch vụ email.';
    await logEmail({
      orderId: params.orderId ?? null,
      to,
      kind: params.kind,
      status: 'failed',
      error: message,
    });
    return { status: 'failed', error: message, to };
  }
}

// ---------------------------------------------------------------------------
// Mẫu email
// ---------------------------------------------------------------------------

function layout(title: string, inner: string): string {
  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#faf6f0;font-family:Arial,Helvetica,sans-serif;color:#292524;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#ffffff;border:1px solid #e7d9c9;border-radius:16px;overflow:hidden;">
      <div style="background:#7c2d12;color:#fff;padding:18px 22px;">
        <div style="font-size:18px;font-weight:bold;">${escapeHtml(STORE_INFO.name)}</div>
        <div style="font-size:12px;opacity:.85;">Sàn thủ công mỹ nghệ làng nghề Hà Nội</div>
      </div>
      <div style="padding:22px;">
        <h1 style="font-size:18px;margin:0 0 14px;">${escapeHtml(title)}</h1>
        ${inner}
      </div>
      <div style="padding:16px 22px;background:#faf6f0;border-top:1px solid #e7d9c9;font-size:12px;color:#78716c;">
        Email tự động từ ${escapeHtml(STORE_INFO.name)} — vui lòng không trả lời trực tiếp.<br>
        Hỗ trợ: ${escapeHtml(STORE_INFO.supportEmail)}
      </div>
    </div>
  </div>
</body></html>`;
}

function itemsTable(order: Order): string {
  const rows = (order.items || [])
    .map(
      (item) => `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;">${escapeHtml(item.name)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #eee;text-align:right;">${formatVnd(item.lineTotal)}</td>
      </tr>`
    )
    .join('');

  return `<table style="width:100%;border-collapse:collapse;font-size:13px;margin:12px 0;">
    <thead><tr style="background:#f5efe7;">
      <th style="text-align:left;padding:8px 10px;">Sản phẩm</th>
      <th style="padding:8px 10px;">SL</th>
      <th style="text-align:right;padding:8px 10px;">Thành tiền</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table style="width:100%;font-size:13px;">
    <tr><td style="padding:2px 0;">Tạm tính</td><td style="text-align:right;">${formatVnd(order.subtotal)}</td></tr>
    <tr><td style="padding:2px 0;">Phí vận chuyển</td><td style="text-align:right;">${formatVnd(order.shippingFee)}</td></tr>
    <tr><td style="padding:6px 0;font-weight:bold;">Tổng cộng</td><td style="text-align:right;font-weight:bold;color:#b45309;">${formatVnd(order.total)}</td></tr>
  </table>`;
}

function addressBlock(order: Order): string {
  const coords =
    order.lat != null && order.lng != null
      ? `<div style="color:#57534e;font-size:12px;">Toạ độ: ${order.lat.toFixed(5)}, ${order.lng.toFixed(5)} (nguồn: ${escapeHtml(order.addressSource || 'không rõ')})</div>`
      : '';
  const note = order.addressNote ? `<div style="font-size:12px;color:#57534e;">Ghi chú: ${escapeHtml(order.addressNote)}</div>` : '';
  return `<div style="background:#faf6f0;border:1px solid #eee;border-radius:10px;padding:12px;font-size:13px;">
    <div><strong>Người nhận:</strong> ${escapeHtml(order.customerName)}</div>
    <div><strong>Điện thoại:</strong> ${escapeHtml(order.customerPhone)}</div>
    <div><strong>Địa chỉ:</strong> ${escapeHtml(order.addressText)}</div>
    ${note}${coords}
  </div>`;
}

function routeLine(order: Order): string {
  if (order.routeDistanceM == null || order.routeDurationS == null) return '';
  const km = (order.routeDistanceM / 1000).toFixed(1).replace('.', ',');
  const hours = Math.floor(order.routeDurationS / 3600);
  const minutes = Math.round((order.routeDurationS % 3600) / 60);
  const time = hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`;
  return `<p style="font-size:13px;color:#57534e;">Tuyến đường bộ từ kho tới điểm nhận hàng: <strong>${km} km</strong> · khoảng <strong>${time}</strong> (${escapeHtml(order.routeProvider || 'dịch vụ định tuyến')}).</p>`;
}

export function buildAdminNewOrderEmail(order: Order): { subject: string; html: string } {
  const subject = `[Đơn mới] ${order.code} — ${formatVnd(order.total)}`;
  const html = layout(
    'Có đơn hàng mới cần xử lý',
    `<p style="font-size:14px;">Mã đơn: <strong>${escapeHtml(order.code)}</strong></p>
     <p style="font-size:13px;color:#57534e;">Thời gian đặt: ${new Date(order.createdAt).toLocaleString('vi-VN')}</p>
     ${itemsTable(order)}
     ${addressBlock(order)}
     ${routeLine(order)}
     <p style="font-size:13px;">Trạng thái hiện tại: <strong>${escapeHtml(ORDER_STATUS_META[order.status].label)}</strong></p>
     <p style="font-size:13px;"><a href="${STORE_INFO.website}/admin/don-hang" style="color:#b45309;font-weight:bold;">Mở trang quản trị đơn hàng</a></p>`
  );
  return { subject, html };
}

export function buildCustomerConfirmationEmail(order: Order): { subject: string; html: string } {
  const subject = `Xác nhận đơn hàng ${order.code} — ${STORE_INFO.shortName}`;
  const html = layout(
    'Cảm ơn bạn đã ủng hộ làng nghề!',
    `<p style="font-size:14px;">Đơn hàng <strong>${escapeHtml(order.code)}</strong> đã được ghi nhận lúc ${new Date(order.createdAt).toLocaleString('vi-VN')}.</p>
     ${itemsTable(order)}
     ${addressBlock(order)}
     ${routeLine(order)}
     <p style="font-size:13px;">Bạn có thể theo dõi tiến trình giao hàng tại:
       <a href="${STORE_INFO.website}/don-hang/${order.id}" style="color:#b45309;font-weight:bold;">trang theo dõi đơn hàng</a>.</p>`
  );
  return { subject, html };
}

export function buildStatusChangeEmail(
  order: Order,
  status: OrderStatus,
  note: string | null
): { subject: string; html: string } {
  const meta = ORDER_STATUS_META[status];
  const subject = `Đơn ${order.code}: ${meta.label}`;
  const html = layout(
    `Cập nhật trạng thái: ${meta.label}`,
    `<p style="font-size:14px;">Đơn hàng <strong>${escapeHtml(order.code)}</strong> vừa được cập nhật.</p>
     <p style="font-size:14px;">${escapeHtml(meta.description)}</p>
     ${note ? `<p style="font-size:13px;color:#57534e;">Ghi chú: ${escapeHtml(note)}</p>` : ''}
     <p style="font-size:12px;color:#78716c;">Thời điểm cập nhật: ${new Date().toLocaleString('vi-VN')}</p>
     ${itemsTable(order)}
     <p style="font-size:13px;"><a href="${STORE_INFO.website}/don-hang/${order.id}" style="color:#b45309;font-weight:bold;">Xem tiến trình đơn hàng</a></p>`
  );
  return { subject, html };
}

export async function sendAdminNewOrderEmail(order: Order): Promise<EmailResult> {
  const { subject, html } = buildAdminNewOrderEmail(order);
  return sendEmail({
    to: getAdminEmail(),
    subject,
    html,
    kind: 'admin_new_order',
    orderId: order.id,
    replyTo: order.customerEmail || undefined,
  });
}

export async function sendCustomerConfirmationEmail(order: Order): Promise<EmailResult | null> {
  if (!order.customerEmail) return null;
  const { subject, html } = buildCustomerConfirmationEmail(order);
  return sendEmail({
    to: order.customerEmail,
    subject,
    html,
    kind: 'customer_order_confirmation',
    orderId: order.id,
  });
}

export async function sendStatusChangeEmails(
  order: Order,
  status: OrderStatus,
  note: string | null
): Promise<{ customer: EmailResult | null; admin: EmailResult }> {
  const { subject, html } = buildStatusChangeEmail(order, status, note);

  const admin = await sendEmail({
    to: getAdminEmail(),
    subject: `[Cập nhật] ${subject}`,
    html,
    kind: 'admin_status_update',
    orderId: order.id,
  });

  const customer = order.customerEmail
    ? await sendEmail({
        to: order.customerEmail,
        subject,
        html,
        kind: 'customer_status_update',
        orderId: order.id,
      })
    : null;

  return { customer, admin };
}
