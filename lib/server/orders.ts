/**
 * Nghiệp vụ đơn hàng — đọc/ghi trong cơ sở dữ liệu.
 *
 * Điểm quan trọng:
 *  - Giá và tổng tiền được TÍNH LẠI Ở SERVER từ dữ liệu sản phẩm; client chỉ gửi mã sản phẩm + số lượng.
 *  - Trừ tồn kho và tạo đơn nằm trong cùng một giao dịch, có điều kiện `stock >= ?` để chống bán quá tồn.
 *  - Mỗi lần đổi trạng thái đều ghi một sự kiện (thời gian, người thực hiện, nguồn) và tạo thông báo.
 */

import crypto from 'crypto';
import { execute, executeCount, query, queryOne, transaction } from './db';
import { getProduct } from './catalog';
import { HttpError, normalizeEmail, normalizePhone, requireString } from './http';
import { createNotification } from './notifications';
import { getWarehouse } from '@/lib/config/commerce';
import { quoteShipping, getRouteFromWarehouse } from './shipping';
import {
  sendAdminNewOrderEmail,
  sendCustomerConfirmationEmail,
  sendStatusChangeEmails,
  type EmailResult,
} from './email';
import { sendPushToEmail } from './push';
import type { AddressSource, CreateOrderPayload, Order, OrderEvent, OrderItem } from '@/lib/orders/types';
import { canTransition, isOrderStatus, ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';

const MAX_LINES = 50;
const MAX_QUANTITY_PER_LINE = 99;

interface OrderRow {
  id: string;
  code: string;
  user_email: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address_text: string;
  address_note: string | null;
  lat: number | null;
  lng: number | null;
  address_source: string | null;
  place_id: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  payment_method: string;
  route_distance_m: number | null;
  route_duration_s: number | null;
  route_provider: string | null;
  route_status: string | null;
  warehouse_id: string | null;
  warehouse_address: string | null;
  created_at: string;
  updated_at: string;
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    code: row.code,
    userEmail: row.user_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    addressText: row.address_text,
    addressNote: row.address_note,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    addressSource: (row.address_source as AddressSource) || null,
    placeId: row.place_id,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    status: row.status as OrderStatus,
    paymentMethod: row.payment_method,
    routeDistanceM: row.route_distance_m == null ? null : Number(row.route_distance_m),
    routeDurationS: row.route_duration_s == null ? null : Number(row.route_duration_s),
    routeProvider: row.route_provider,
    routeStatus: row.route_status,
    warehouseId: row.warehouse_id,
    warehouseAddress: row.warehouse_address,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function generateOrderCode(): Promise<string> {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;

  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = String(crypto.randomInt(0, 10000)).padStart(4, '0');
    const code = `LT${stamp}-${suffix}`;
    const existing = await queryOne<{ id: string }>(`SELECT id FROM orders WHERE code = ?`, [code]);
    if (!existing) return code;
  }
  return `LT${stamp}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function validateItems(raw: unknown): { productId: string; quantity: number }[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new HttpError('Giỏ hàng đang trống.', 400, 'empty_cart');
  }
  if (raw.length > MAX_LINES) {
    throw new HttpError(`Đơn hàng tối đa ${MAX_LINES} dòng sản phẩm.`, 400, 'too_many_lines');
  }

  const merged = new Map<string, number>();
  for (const line of raw as any[]) {
    const productId = typeof line?.productId === 'string' ? line.productId.trim() : '';
    const quantity = Number(line?.quantity);
    if (!productId) throw new HttpError('Có dòng sản phẩm thiếu mã sản phẩm.', 400, 'invalid_item');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      throw new HttpError(
        `Số lượng phải là số nguyên từ 1 đến ${MAX_QUANTITY_PER_LINE}.`,
        400,
        'invalid_quantity'
      );
    }
    merged.set(productId, (merged.get(productId) || 0) + quantity);
  }

  return Array.from(merged.entries()).map(([productId, quantity]) => ({ productId, quantity }));
}

export interface OrderCreationResult {
  order: Order;
  delivery: {
    adminEmail: EmailResult;
    customerEmail: EmailResult | null;
    push: { sent: number; attempted: number; errors: string[]; configured: boolean };
  };
}

/** Tạo đơn hàng mới. Trả về cả báo cáo gửi email/thông báo thật. */
export async function createOrder(
  payload: CreateOrderPayload,
  context: { sessionEmail: string | null }
): Promise<OrderCreationResult> {
  const customerName = requireString(payload?.customer?.name, 'họ tên người nhận', 120);
  const rawPhone = requireString(payload?.customer?.phone, 'số điện thoại', 30);
  const phone = normalizePhone(rawPhone);
  if (!phone) {
    throw new HttpError('Số điện thoại không hợp lệ.', 400, 'invalid_phone');
  }

  const customerEmail = normalizeEmail(payload?.customer?.email) ?? context.sessionEmail ?? null;
  if (payload?.customer?.email && !customerEmail) {
    throw new HttpError('Email không hợp lệ.', 400, 'invalid_email');
  }

  const addressText = requireString(payload?.address?.text, 'địa chỉ nhận hàng', 400);
  const addressNote = payload?.address?.note ? String(payload.address.note).slice(0, 400) : null;
  const source = (payload?.address?.source || 'manual') as AddressSource;
  let lat = typeof payload?.address?.lat === 'number' && Number.isFinite(payload.address.lat) ? payload.address.lat : null;
  let lng = typeof payload?.address?.lng === 'number' && Number.isFinite(payload.address.lng) ? payload.address.lng : null;

  const items = validateItems(payload?.items);

  // 1. Đọc sản phẩm + kiểm tra tồn kho, tính tiền từ dữ liệu máy chủ.
  const detailed: { productId: string; quantity: number; name: string; villageName: string; image: string; unitPrice: number; lineTotal: number; stock: number }[] = [];
  let subtotal = 0;

  for (const line of items) {
    const product = await getProduct(line.productId);
    if (!product) {
      throw new HttpError(`Sản phẩm "${line.productId}" không còn bán.`, 400, 'product_unavailable', {
        productId: line.productId,
      });
    }
    if (product.stock < line.quantity) {
      throw new HttpError(
        product.stock === 0
          ? `Sản phẩm "${product.name}" đã hết hàng.`
          : `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm.`,
        409,
        'insufficient_stock',
        { productId: product.id, available: product.stock, requested: line.quantity }
      );
    }
    const lineTotal = product.price * line.quantity;
    subtotal += lineTotal;
    detailed.push({
      productId: product.id,
      quantity: line.quantity,
      name: product.name,
      villageName: product.villageName,
      image: product.image,
      unitPrice: product.price,
      lineTotal,
      stock: product.stock,
    });
  }

  // 2. Tuyến đường + phí vận chuyển. Nếu client đã gửi tuyến hợp lệ thì dùng lại, không thì tự tính.
  let route = payload?.route && payload.route.distanceM != null
    ? {
        distanceM: payload.route.distanceM,
        durationS: payload.route.durationS ?? null,
        provider: payload.route.provider ?? null,
        status: payload.route.status || 'Tuyến đường do khách chọn trên bản đồ.',
      }
    : await getRouteFromWarehouse(lat, lng);

  const quote = await quoteShipping({ subtotal, lat, lng });
  const shippingFee = quote.fee;
  const total = subtotal + shippingFee;

  // 3. Giao dịch: trừ tồn kho có điều kiện + tạo đơn + dòng hàng + sự kiện.
  const warehouse = getWarehouse();
  const orderId = `ord_${crypto.randomUUID()}`;
  const code = await generateOrderCode();
  const now = new Date().toISOString();

  await transaction(async () => {
    for (const line of detailed) {
      const updated = await executeCount(
        `UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ? AND active = 1`,
        [line.quantity, now, line.productId, line.quantity]
      );
      if (updated === 0) {
        throw new HttpError(
          `Sản phẩm "${line.name}" vừa hết hàng trong lúc đặt. Vui lòng thử lại.`,
          409,
          'insufficient_stock',
          { productId: line.productId }
        );
      }
    }

    await execute(
      `INSERT INTO orders (id, code, user_email, customer_name, customer_phone, customer_email,
        address_text, address_note, lat, lng, address_source, place_id, subtotal, shipping_fee, total,
        status, payment_method, route_distance_m, route_duration_s, route_provider, route_status,
        warehouse_id, warehouse_address, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId,
        code,
        context.sessionEmail,
        customerName,
        phone,
        customerEmail,
        addressText,
        addressNote,
        lat,
        lng,
        source,
        payload?.address?.placeId ?? null,
        subtotal,
        shippingFee,
        total,
        'pending_confirmation',
        payload?.paymentMethod?.trim() || 'cod',
        route.distanceM,
        route.durationS,
        route.provider,
        route.status,
        warehouse.id,
        warehouse.address,
        now,
        now,
      ]
    );

    for (const line of detailed) {
      await execute(
        `INSERT INTO order_items (id, order_id, product_id, name, village_name, image, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `itm_${crypto.randomUUID()}`,
          orderId,
          line.productId,
          line.name,
          line.villageName,
          line.image,
          line.unitPrice,
          line.quantity,
          line.lineTotal,
        ]
      );
    }

    await execute(
      `INSERT INTO order_events (id, order_id, status, note, actor_type, actor_id, source, created_at)
       VALUES (?, ?, 'pending_confirmation', ?, 'customer', ?, ?, ?)`,
      [
        `evt_${crypto.randomUUID()}`,
        orderId,
        'Đơn được tạo từ trang thanh toán của khách hàng.',
        customerEmail,
        'SYSTEM:ORDER_CREATED',
        now,
      ]
    );
  });

  const order = await getOrderById(orderId);
  if (!order) throw new HttpError('Không đọc lại được đơn hàng vừa tạo.', 500, 'order_readback_failed');

  // 4. Thông báo trong website (không làm hỏng đơn nếu bước này lỗi).
  const notifications: string[] = [];
  try {
    await createNotification({
      audience: 'admin',
      orderId: order.id,
      title: `Đơn mới ${order.code}`,
      body: `${order.customerName} · ${order.total.toLocaleString('vi-VN')} ₫ · ${order.addressText}`,
      link: `/admin/don-hang?order=${order.id}`,
    });
    if (customerEmail) {
      await createNotification({
        audience: 'customer',
        userEmail: customerEmail,
        orderId: order.id,
        title: `Đã nhận đơn ${order.code}`,
        body: 'Đơn hàng của bạn đang chờ xác nhận. Chúng tôi sẽ thông báo khi có cập nhật.',
        link: `/don-hang/${order.id}`,
      });
    }
  } catch (error: any) {
    notifications.push(error?.message || 'Lỗi tạo thông báo trong website.');
  }

  // 5. Email: kết quả thật từ nhà cung cấp.
  const adminEmail = await sendAdminNewOrderEmail(order);
  const customerEmailResult = await sendCustomerConfirmationEmail(order);

  // 6. Web push.
  let push = { sent: 0, attempted: 0, errors: [] as string[], configured: false };
  try {
    push = await sendPushToEmail(customerEmail, {
      title: `Đã nhận đơn ${order.code}`,
      body: `Tổng ${order.total.toLocaleString('vi-VN')} ₫ — đang chờ xác nhận.`,
      url: `/don-hang/${order.id}`,
      tag: order.code,
    });
  } catch (error: any) {
    push.errors.push(error?.message || 'Lỗi gửi thông báo đẩy.');
  }

  return {
    order,
    delivery: { adminEmail, customerEmail: customerEmailResult, push },
  };
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  const rows = await query<any>(`SELECT * FROM order_items WHERE order_id = ? ORDER BY name`, [orderId]);
  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    name: row.name,
    villageName: row.village_name,
    image: row.image,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    lineTotal: Number(row.line_total),
  }));
}

export async function getOrderEvents(orderId: string): Promise<OrderEvent[]> {
  const rows = await query<any>(`SELECT * FROM order_events WHERE order_id = ? ORDER BY created_at ASC, id ASC`, [
    orderId,
  ]);
  return rows.map((row) => ({
    id: row.id,
    status: row.status as OrderStatus,
    note: row.note,
    actorType: row.actor_type,
    actorId: row.actor_id,
    source: row.source,
    createdAt: row.created_at,
  }));
}

export async function getOrderById(id: string, withDetails = true): Promise<Order | null> {
  const row = await queryOne<OrderRow>(`SELECT * FROM orders WHERE id = ? OR code = ?`, [id, id]);
  if (!row) return null;
  const order = toOrder(row);
  if (withDetails) {
    order.items = await getOrderItems(order.id);
    order.events = await getOrderEvents(order.id);
  }
  return order;
}

export async function listOrdersForEmail(email: string, limit = 50): Promise<Order[]> {
  const rows = await query<OrderRow>(
    `SELECT * FROM orders WHERE lower(customer_email) = ? ORDER BY created_at DESC LIMIT ${Math.min(Number(limit) || 50, 200)}`,
    [email.trim().toLowerCase()]
  );
  const orders = rows.map(toOrder);
  for (const order of orders) order.items = await getOrderItems(order.id);
  return orders;
}

export async function listAllOrders(params: { status?: string | null; limit?: number } = {}): Promise<Order[]> {
  const limit = Math.min(Number(params.limit) || 100, 300);
  const rows = isOrderStatus(params.status)
    ? await query<OrderRow>(`SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC LIMIT ${limit}`, [
        params.status,
      ])
    : await query<OrderRow>(`SELECT * FROM orders ORDER BY created_at DESC LIMIT ${limit}`);

  const orders = rows.map(toOrder);
  for (const order of orders) {
    order.items = await getOrderItems(order.id);
    order.events = await getOrderEvents(order.id);
  }
  return orders;
}

export interface StatusUpdateOptions {
  orderId: string;
  status: OrderStatus;
  note?: string | null;
  actorType: 'admin' | 'system' | 'customer';
  actorId?: string | null;
  source: string;
}

export interface StatusUpdateResult {
  order: Order;
  emails: { customer: EmailResult | null; admin: EmailResult };
  push: { sent: number; attempted: number; configured: boolean; errors: string[] };
}

/**
 * Cập nhật trạng thái đơn theo quy trình. Từ chối mọi bước nhảy không hợp lệ.
 * Ghi sự kiện + thông báo + email + push cho khách hàng.
 */
export async function updateOrderStatus(options: StatusUpdateOptions): Promise<StatusUpdateResult> {
  const order = await getOrderById(options.orderId);
  if (!order) throw new HttpError('Không tìm thấy đơn hàng.', 404, 'order_not_found');

  const current = order.status;
  if (!isOrderStatus(options.status)) {
    throw new HttpError('Trạng thái đơn hàng không hợp lệ.', 400, 'invalid_status');
  }
  if (options.status === current) {
    throw new HttpError(`Đơn hàng đang ở trạng thái "${ORDER_STATUS_META[current].label}".`, 400, 'no_change');
  }
  if (!canTransition(current, options.status)) {
    throw new HttpError(
      `Không thể chuyển từ "${ORDER_STATUS_META[current].label}" sang "${ORDER_STATUS_META[options.status].label}".`,
      409,
      'invalid_transition',
      { from: current, to: options.status }
    );
  }

  const now = new Date().toISOString();
  const note = options.note?.trim() || null;

  await transaction(async () => {
    await execute(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`, [options.status, now, order.id]);
    await execute(
      `INSERT INTO order_events (id, order_id, status, note, actor_type, actor_id, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `evt_${crypto.randomUUID()}`,
        order.id,
        options.status,
        note,
        options.actorType,
        options.actorId ?? null,
        options.source,
        now,
      ]
    );
  });

  const updated = await getOrderById(order.id);
  if (!updated) throw new HttpError('Không đọc lại được đơn hàng sau khi cập nhật.', 500, 'order_readback_failed');

  const meta = ORDER_STATUS_META[options.status];

  await createNotification({
    audience: 'admin',
    orderId: updated.id,
    title: `${updated.code}: ${meta.label}`,
    body: note || meta.description,
    link: `/admin/don-hang?order=${updated.id}`,
  });

  if (updated.customerEmail) {
    await createNotification({
      audience: 'customer',
      userEmail: updated.customerEmail,
      orderId: updated.id,
      title: `${updated.code} — ${meta.label}`,
      body: note || meta.description,
      link: `/don-hang/${updated.id}`,
    });
  }

  const emails = await sendStatusChangeEmails(updated, options.status, note);

  let push = { sent: 0, attempted: 0, configured: false, errors: [] as string[] };
  try {
    push = await sendPushToEmail(updated.customerEmail, {
      title: `${updated.code} — ${meta.label}`,
      body: note || meta.description,
      url: `/don-hang/${updated.id}`,
      tag: `${updated.code}-${options.status}`,
    });
  } catch (error: any) {
    push.errors.push(error?.message || 'Lỗi gửi thông báo đẩy.');
  }

  return { order: updated, emails, push };
}

/** Thống kê nhanh cho trang quản trị. */
export async function getOrderStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  revenue: number;
}> {
  const rows = await query<{ status: string; count: number; revenue: number | null }>(
    `SELECT status, COUNT(*) AS count, SUM(total) AS revenue FROM orders GROUP BY status`
  );
  const byStatus: Record<string, number> = {};
  let total = 0;
  let revenue = 0;
  for (const row of rows) {
    byStatus[row.status] = Number(row.count);
    total += Number(row.count);
    if (row.status !== 'cancelled') revenue += Number(row.revenue ?? 0);
  }
  return { total, byStatus, revenue };
}
