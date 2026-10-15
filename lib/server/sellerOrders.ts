/**
 * ĐƠN CON THEO CỬA HÀNG — trái tim của mô hình đa người bán.
 *
 * Vì sao phải tách đơn con: một đơn của khách có thể gồm sản phẩm của nhiều cửa hàng. Nếu chỉ có một
 * đơn duy nhất thì hoặc mọi người bán đều nhìn thấy đơn của nhau (rò rỉ dữ liệu), hoặc chỉ một người
 * bán nhận được đơn (sai vận hành). Đơn con giải quyết đúng cả hai:
 *  - Mỗi cửa hàng một đơn con: tiền hàng, phí ship, trạng thái và mã vận đơn RIÊNG.
 *  - Người bán chỉ đọc/ghi được đơn con của cửa hàng mình (ràng buộc ở tầng SQL: `store_id = ?`).
 *  - Trạng thái đơn cha (đơn tổng của khách) được TỔNG HỢP từ các đơn con, không do ai nhập tay.
 *
 * Nguyên tắc an toàn:
 *  - Không tin `storeId` do client gửi: mọi hàm ở đây nhận `storeId` do API tra từ phiên đăng nhập.
 *  - Tiền và tồn kho luôn tính ở máy chủ; đơn con chỉ lưu kết quả đã chốt tại thời điểm đặt.
 *  - Email/thông báo lỗi KHÔNG được làm hỏng đơn hàng: chúng chạy sau giao dịch và được bọc try/catch.
 */

import crypto from 'crypto';
import { execute, executeCount, query, queryOne, transaction } from './db';
import { HttpError } from './http';
import { createNotification } from './notifications';
import { sendPushToEmail } from './push';
import {
  sendSellerNewOrderEmail,
  sendSellerOrderAlertEmail,
  sendStatusChangeEmails,
  type EmailResult,
  type SellerOrderEmailSummary,
} from './email';
import type {
  Order,
  OrderEvent,
  OrderItem,
  SellerOrder,
  SellerOrderView,
  SellerStats,
} from '@/lib/orders/types';

export type { SellerOrderView, SellerStats };
import {
  ALLOWED_TRANSITIONS,
  canTransition,
  isOrderStatus,
  ORDER_STATUSES,
  ORDER_STATUS_META,
  sellerCanTransition,
  type OrderStatus,
} from '@/lib/orders/workflow';

/** Trạng thái còn nằm trong tay người bán (cần xác nhận / chuẩn bị hàng). */
const SELLER_ACTION_STATUSES: OrderStatus[] = ['pending_confirmation', 'confirmed', 'preparing', 'ready_for_pickup'];
const SELLER_PREPARING_STATUSES: OrderStatus[] = ['confirmed', 'preparing', 'ready_for_pickup'];
const SELLER_SHIPPING_STATUSES: OrderStatus[] = ['handed_to_carrier', 'in_transit', 'out_for_delivery'];
const SELLER_FAILED_STATUSES: OrderStatus[] = ['delivery_failed', 'cancelled'];

export type SellerOrderFilter = 'all' | 'needs_action' | 'preparing' | 'shipping' | 'completed' | 'failed';

export const SELLER_ORDER_FILTERS: { key: SellerOrderFilter; label: string; hint: string }[] = [
  { key: 'all', label: 'Tất cả đơn', hint: 'Toàn bộ đơn có sản phẩm của cửa hàng bạn.' },
  { key: 'needs_action', label: 'Đơn cần xử lý', hint: 'Đơn mới, đang chuẩn bị hoặc đã chuẩn bị xong.' },
  { key: 'preparing', label: 'Đang chuẩn bị hàng', hint: 'Đã tiếp nhận và đang đóng gói.' },
  { key: 'shipping', label: 'Đang vận chuyển', hint: 'Đã bàn giao cho đơn vị vận chuyển.' },
  { key: 'completed', label: 'Đã hoàn thành', hint: 'Giao thành công tới khách.' },
  { key: 'failed', label: 'Huỷ / giao thất bại', hint: 'Đơn bị huỷ hoặc giao không thành công.' },
];

interface SellerOrderRow {
  id: string;
  order_id: string;
  store_id: string;
  code: string;
  store_name: string;
  store_address: string | null;
  store_lat: number | null;
  store_lng: number | null;
  warehouse_id?: string | null;
  warehouse_name?: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  status: string;
  carrier: string | null;
  tracking_code: string | null;
  route_distance_m: number | null;
  route_duration_s: number | null;
  route_provider: string | null;
  route_status: string | null;
  created_at: string;
  updated_at: string;
}

interface ParentRow {
  id: string;
  code: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address_text: string;
  address_note: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}


export function toSellerOrder(row: SellerOrderRow): SellerOrder {
  return {
    id: row.id,
    orderId: row.order_id,
    storeId: row.store_id,
    code: row.code,
    storeName: row.store_name,
    storeAddress: row.store_address,
    storeLat: row.store_lat == null ? null : Number(row.store_lat),
    storeLng: row.store_lng == null ? null : Number(row.store_lng),
    warehouseId: row.warehouse_id || null,
    warehouseName: row.warehouse_name || null,
    subtotal: Number(row.subtotal),
    shippingFee: Number(row.shipping_fee),
    total: Number(row.total),
    status: row.status as OrderStatus,
    carrier: row.carrier,
    trackingCode: row.tracking_code,
    routeDistanceM: row.route_distance_m == null ? null : Number(row.route_distance_m),
    routeDurationS: row.route_duration_s == null ? null : Number(row.route_duration_s),
    routeProvider: row.route_provider,
    routeStatus: row.route_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toView(row: SellerOrderRow, parent: ParentRow): SellerOrderView {
  const order = toSellerOrder(row);
  return {
    ...order,
    parentCode: parent.code,
    parentStatus: parent.status as OrderStatus,
    customerName: parent.customer_name,
    customerPhone: parent.customer_phone,
    customerEmail: parent.customer_email,
    addressText: parent.address_text,
    addressNote: parent.address_note,
    lat: parent.lat == null ? null : Number(parent.lat),
    lng: parent.lng == null ? null : Number(parent.lng),
    allowedTransitions: ORDER_TRANSITIONS_FOR_SELLER[order.status] || [],
    needsAction: SELLER_ACTION_STATUSES.includes(order.status),
  };
}

/**
 * Các bước người bán được phép chuyển tới, tính từ bảng chuyển trạng thái của quy trình.
 * Sinh tự động nên khi quy trình đổi, những gì giao diện cho bấm cũng đổi theo — không lệch nhau.
 */
const ORDER_TRANSITIONS_FOR_SELLER: Record<OrderStatus, OrderStatus[]> = ORDER_STATUSES.reduce(
  (acc, status) => {
    acc[status] = ALLOWED_TRANSITIONS[status].filter((target) => sellerCanTransition(status, target));
    return acc;
  },
  {} as Record<OrderStatus, OrderStatus[]>
);

// ---------------------------------------------------------------------------
// Đọc dữ liệu
// ---------------------------------------------------------------------------

export async function getSellerOrderItems(sellerOrderId: string): Promise<OrderItem[]> {
  const rows = await query<any>(
    `SELECT * FROM order_items WHERE seller_order_id = ? ORDER BY name`,
    [sellerOrderId]
  );
  return rows.map(toItem);
}

function toItem(row: any): OrderItem {
  return {
    id: row.id,
    productId: row.product_id,
    name: row.name,
    villageName: row.village_name,
    image: row.image,
    unitPrice: Number(row.unit_price),
    quantity: Number(row.quantity),
    lineTotal: Number(row.line_total),
    storeId: row.store_id ?? null,
    sellerOrderId: row.seller_order_id ?? null,
  };
}

export async function getSellerOrderEvents(sellerOrderId: string): Promise<OrderEvent[]> {
  const rows = await query<any>(
    `SELECT * FROM order_events WHERE seller_order_id = ? ORDER BY created_at ASC, id ASC`,
    [sellerOrderId]
  );
  return rows.map((row) => ({
    id: row.id,
    status: row.status as OrderStatus,
    fromStatus: isOrderStatus(row.from_status) ? row.from_status : null,
    note: row.note,
    actorType: row.actor_type,
    actorId: row.actor_id,
    source: row.source,
    createdAt: row.created_at,
    sellerOrderId: row.seller_order_id ?? null,
  }));
}

/** Tất cả đơn con của một đơn tổng (dùng cho trang khách hàng và quản trị viên). */
export async function getSellerOrdersByParent(
  orderId: string,
  options: { withEvents?: boolean; withItems?: boolean } = {}
): Promise<SellerOrder[]> {
  const rows = await query<SellerOrderRow>(
    `SELECT * FROM seller_orders WHERE order_id = ? ORDER BY created_at ASC, id ASC`,
    [orderId]
  );
  const result: SellerOrder[] = [];
  for (const row of rows) {
    const child = toSellerOrder(row);
    if (options.withItems !== false) child.items = await getSellerOrderItems(child.id);
    if (options.withEvents) child.events = await getSellerOrderEvents(child.id);
    result.push(child);
  }
  return result;
}

async function getParentRow(orderId: string): Promise<ParentRow | null> {
  return queryOne<ParentRow>(
    `SELECT id, code, customer_name, customer_phone, customer_email, address_text, address_note, lat, lng,
            status, created_at, updated_at
     FROM orders WHERE id = ?`,
    [orderId]
  );
}

/**
 * Một đơn con theo mã HOẶC mã đơn con, LUÔN kèm điều kiện `store_id`.
 * Ràng buộc quyền sở hữu nằm ở câu SQL nên người bán không thể đọc đơn của cửa hàng khác.
 */
export async function getSellerOrderView(
  storeId: string,
  idOrCode: string,
  options: { withEvents?: boolean } = {}
): Promise<SellerOrderView | null> {
  const row = await queryOne<SellerOrderRow>(
    `SELECT * FROM seller_orders WHERE store_id = ? AND (id = ? OR code = ?)`,
    [storeId, idOrCode, idOrCode]
  );
  if (!row) return null;
  const parent = await getParentRow(row.order_id);
  if (!parent) return null;
  const view = toView(row, parent);
  view.items = await getSellerOrderItems(view.id);
  if (options.withEvents) view.events = await getSellerOrderEvents(view.id);
  return view;
}

function filterStatuses(filter: SellerOrderFilter | undefined): OrderStatus[] | null {
  switch (filter) {
    case 'needs_action':
      return SELLER_ACTION_STATUSES;
    case 'preparing':
      return SELLER_PREPARING_STATUSES;
    case 'shipping':
      return SELLER_SHIPPING_STATUSES;
    case 'completed':
      return ['delivered'];
    case 'failed':
      return SELLER_FAILED_STATUSES;
    default:
      return null;
  }
}

/** Danh sách đơn con của MỘT cửa hàng, kèm bộ lọc theo bước xử lý. */
export async function listSellerOrders(params: {
  storeId: string;
  filter?: SellerOrderFilter | null;
  q?: string | null;
  limit?: number;
}): Promise<SellerOrderView[]> {
  const limit = Math.min(Number(params.limit) || 100, 300);
  const statuses = filterStatuses(params.filter || undefined);

  const conditions = [`so.store_id = ?`];
  const args: (string | number)[] = [params.storeId];

  if (statuses) {
    conditions.push(`so.status IN (${statuses.map(() => '?').join(', ')})`);
    args.push(...statuses);
  }

  const keyword = params.q?.trim();
  if (keyword) {
    const like = `%${keyword.toLowerCase()}%`;
    conditions.push(
      `(lower(so.code) LIKE ? OR lower(o.code) LIKE ? OR lower(o.customer_name) LIKE ? OR o.customer_phone LIKE ?)`
    );
    args.push(like, like, like, like);
  }

  const rows = await query<SellerOrderRow & { parent_code: string; customer_name: string; customer_phone: string; customer_email: string | null; address_text: string; address_note: string | null; lat: number | null; lng: number | null; parent_status: string }>(
    `SELECT so.*, o.code AS parent_code, o.customer_name, o.customer_phone, o.customer_email, o.address_text,
            o.address_note, o.lat, o.lng, o.status AS parent_status
     FROM seller_orders so
     JOIN orders o ON o.id = so.order_id
     WHERE ${conditions.join(' AND ')}
     ORDER BY so.created_at DESC
     LIMIT ${limit}`,
    args
  );

  const views: SellerOrderView[] = [];
  for (const row of rows) {
    const view = toView(row as SellerOrderRow, {
      id: row.order_id,
      code: row.parent_code,
      customer_name: row.customer_name,
      customer_phone: row.customer_phone,
      customer_email: row.customer_email,
      address_text: row.address_text,
      address_note: row.address_note,
      lat: row.lat,
      lng: row.lng,
      status: row.parent_status,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });
    view.items = await getSellerOrderItems(view.id);
    views.push(view);
  }
  return views;
}

export async function getSellerStats(storeId: string): Promise<SellerStats> {
  const rows = await query<{ status: string; count: number; revenue: number | null }>(
    `SELECT status, COUNT(*) AS count, SUM(total) AS revenue FROM seller_orders WHERE store_id = ? GROUP BY status`,
    [storeId]
  );

  const byStatus: Record<string, number> = {};
  let totalOrders = 0;
  let revenue = 0;
  let pendingRevenue = 0;
  let needsAction = 0;

  for (const row of rows) {
    const count = Number(row.count);
    const sum = Number(row.revenue ?? 0);
    byStatus[row.status] = count;
    totalOrders += count;
    if (row.status === 'delivered') revenue += sum;
    else if (row.status !== 'cancelled' && row.status !== 'delivery_failed') pendingRevenue += sum;
    if (SELLER_ACTION_STATUSES.includes(row.status as OrderStatus)) needsAction += count;
  }

  const unitsRow = await queryOne<{ units: number | null }>(
    `SELECT SUM(si.quantity) AS units
     FROM order_items si
     JOIN seller_orders so ON so.id = si.seller_order_id
     WHERE so.store_id = ? AND so.status = 'delivered'`,
    [storeId]
  );

  return {
    totalOrders,
    byStatus,
    revenue,
    pendingRevenue,
    unitsSold: Number(unitsRow?.units ?? 0),
    needsAction,
  };
}

// ---------------------------------------------------------------------------
// Tạo đơn con khi khách đặt hàng
// ---------------------------------------------------------------------------

export interface SellerOrderItemInput {
  productId: string;
  name: string;
  villageName: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

/** Nhóm hàng theo cửa hàng — mỗi nhóm sẽ trở thành một đơn con. */
export interface StoreOrderGroup {
  storeId: string;
  storeName: string;
  storeAddress: string | null;
  storeLat: number | null;
  storeLng: number | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  items: SellerOrderItemInput[];
  subtotal: number;
  shippingFee: number;
  total: number;
  route: { distanceM: number | null; durationS: number | null; provider: string | null; status: string };
}

/** Mã đơn con suy ra từ mã đơn tổng, ví dụ LT261014-1234 → LT261014-1234-01. */
export function buildSellerOrderCode(parentCode: string, index: number): string {
  return `${parentCode}-${String(index + 1).padStart(2, '0')}`;
}

/**
 * Ghi một đơn con + các dòng hàng của cửa hàng đó.
 * Hàm được gọi BÊN TRONG giao dịch tạo đơn của orders.ts nên không tự mở giao dịch mới.
 */
export async function insertSellerOrder(params: {
  parentOrderId: string;
  parentCode: string;
  index: number;
  group: StoreOrderGroup;
  now: string;
}): Promise<string> {
  const { group } = params;
  const id = `sor_${crypto.randomUUID()}`;
  const code = buildSellerOrderCode(params.parentCode, params.index);

  await execute(
    `INSERT INTO seller_orders (id, order_id, store_id, code, store_name, store_address, store_lat, store_lng,
       warehouse_id, warehouse_name, subtotal, shipping_fee, total, status, carrier, tracking_code,
       route_distance_m, route_duration_s, route_provider, route_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_confirmation', NULL, NULL, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      params.parentOrderId,
      group.storeId,
      code,
      group.storeName,
      group.storeAddress,
      group.storeLat,
      group.storeLng,
      group.warehouseId || null,
      group.warehouseName || null,
      group.subtotal,
      group.shippingFee,
      group.total,
      group.route.distanceM,
      group.route.durationS,
      group.route.provider,
      group.route.status,
      params.now,
      params.now,
    ]
  );

  for (const item of group.items) {
    await execute(
      `INSERT INTO order_items (id, order_id, seller_order_id, store_id, product_id, name, village_name, image,
         unit_price, quantity, line_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `itm_${crypto.randomUUID()}`,
        params.parentOrderId,
        id,
        group.storeId,
        item.productId,
        item.name,
        item.villageName,
        item.image,
        item.unitPrice,
        item.quantity,
        item.lineTotal,
      ]
    );
  }

  // Sự kiện khởi tạo của đơn con: ghi rõ cửa hàng nào nhận đơn này.
  await execute(
    `INSERT INTO order_events (id, order_id, seller_order_id, status, from_status, note, actor_type, actor_id, source, created_at)
     VALUES (?, ?, ?, 'pending_confirmation', NULL, ?, 'customer', ?, 'SYSTEM:ORDER_CREATED', ?)`,
    [
      `evt_${crypto.randomUUID()}`,
      params.parentOrderId,
      id,
      `Đơn được tạo từ trang thanh toán của khách hàng và chuyển tới cửa hàng ${group.storeName}.`,
      null,
      params.now,
    ]
  );

  return id;
}

// ---------------------------------------------------------------------------
// Tổng hợp trạng thái đơn cha
// ---------------------------------------------------------------------------

/**
 * Trạng thái của đơn tổng được SUY RA từ các đơn con, theo quy tắc tường minh:
 *  1. Mọi đơn con đã huỷ → đơn tổng "Đã hủy".
 *  2. Mọi đơn con còn hiệu lực đã giao thành công → đơn tổng "Đã giao thành công"
 *     (trường hợp khách mua nhiều cửa hàng, một cửa hàng huỷ phần của mình vẫn tính là đã giao hết phần còn lại).
 *  3. Còn lại → lấy đơn con CHẬM NHẤT trên thanh tiến trình, vì đơn tổng chỉ hoàn tất khi cửa hàng
 *     chậm nhất giao xong. Đơn giao thất bại (bước 0) sẽ nổi lên để người vận hành biết cần xử lý.
 */
export function rollupParentStatus(children: { status: OrderStatus }[]): OrderStatus {
  if (children.length === 0) return 'pending_confirmation';

  const active = children.filter((child) => child.status !== 'cancelled');
  if (active.length === 0) return 'cancelled';

  if (active.every((child) => child.status === 'delivered')) return 'delivered';

  const slowest = active.reduce((acc, child) => {
    const accStep = ORDER_STATUS_META[acc.status]?.step ?? 0;
    const childStep = ORDER_STATUS_META[child.status]?.step ?? 0;
    return childStep < accStep ? child : acc;
  }, active[0]);

  return slowest.status;
}

/** Đọc lại các đơn con rồi ghi trạng thái tổng hợp vào đơn cha. Trả về trạng thái sau khi tổng hợp. */
export async function syncParentStatus(parentOrderId: string, now = new Date().toISOString()): Promise<OrderStatus> {
  const rows = await query<{ status: string }>(`SELECT status FROM seller_orders WHERE order_id = ?`, [parentOrderId]);
  const rollup = rollupParentStatus(rows.map((row) => ({ status: row.status as OrderStatus })));
  await execute(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?`, [rollup, now, parentOrderId]);
  return rollup;
}

// ---------------------------------------------------------------------------
// Cập nhật trạng thái đơn con
// ---------------------------------------------------------------------------

export interface SellerStatusUpdateInput {
  sellerOrderId: string;
  /** Cửa hàng đang thao tác. Với quản trị viên sàn, truyền null để bỏ ràng buộc cửa hàng. */
  storeId: string | null;
  status: OrderStatus;
  note?: string | null;
  actorType: 'seller' | 'admin' | 'system';
  actorId?: string | null;
  source: string;
  carrier?: string | null;
  trackingCode?: string | null;
  /** Người bán đang thao tác — dùng để không tự thông báo cho chính mình. */
  actorSellerEmail?: string | null;
}

export interface SellerStatusUpdateResult {
  sellerOrder: SellerOrderView;
  parentStatus: OrderStatus;
  emails: { customer: EmailResult | null; admin: EmailResult; seller: EmailResult | null };
  push: { sent: number; attempted: number; configured: boolean; errors: string[] };
  sellerNotification: boolean;
}

function summaryOf(view: SellerOrderView): SellerOrderEmailSummary {
  return {
    parentCode: view.parentCode,
    sellerCode: view.code,
    customerName: view.customerName,
    customerPhone: view.customerPhone,
    addressText: view.addressText,
    addressNote: view.addressNote,
    subtotal: view.subtotal,
    shippingFee: view.shippingFee,
    total: view.total,
    createdAt: view.createdAt,
    status: view.status,
    items: (view.items || []).map((item) => ({
      name: item.name,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
  };
}

/**
 * Đổi trạng thái MỘT đơn con.
 *
 * Các bước bắt buộc, theo thứ tự:
 *  1. Kiểm tra bước chuyển có hợp lệ với quy trình (chống nhảy bước / tự đánh dấu đã giao).
 *  2. Ghi trạng thái với điều kiện `status = trạng thái cũ` để hai người thao tác cùng lúc không ghi đè nhau.
 *  3. Ghi lịch sử: một sự kiện ở đơn con + một sự kiện ở đơn cha (để khách thấy đủ tiến trình).
 *  4. Tổng hợp lại trạng thái đơn cha.
 *  5. Sau giao dịch mới gửi thông báo/email/push — lỗi gửi KHÔNG làm mất cập nhật trạng thái.
 */
export async function updateSellerOrderStatus(input: SellerStatusUpdateInput): Promise<SellerStatusUpdateResult> {
  if (!isOrderStatus(input.status)) {
    throw new HttpError('Trạng thái đơn hàng không hợp lệ.', 400, 'invalid_status');
  }

  const row = input.storeId
    ? await queryOne<SellerOrderRow>(`SELECT * FROM seller_orders WHERE id = ? AND store_id = ?`, [
        input.sellerOrderId,
        input.storeId,
      ])
    : await queryOne<SellerOrderRow>(`SELECT * FROM seller_orders WHERE id = ?`, [input.sellerOrderId]);

  if (!row) {
    throw new HttpError('Không tìm thấy đơn hàng thuộc cửa hàng của bạn.', 404, 'seller_order_not_found');
  }

  const current = row.status as OrderStatus;
  if (current === input.status) {
    throw new HttpError(`Đơn đang ở trạng thái "${ORDER_STATUS_META[current].label}".`, 400, 'no_change');
  }
  if (!canTransition(current, input.status)) {
    throw new HttpError(
      input.actorType === 'seller'
        ? `Người bán không thể chuyển đơn từ "${ORDER_STATUS_META[current].label}" sang "${ORDER_STATUS_META[input.status].label}".`
        : `Không thể chuyển từ "${ORDER_STATUS_META[current].label}" sang "${ORDER_STATUS_META[input.status].label}".`,
      409,
      'invalid_transition',
      { from: current, to: input.status }
    );
  }

  const now = new Date().toISOString();
  const note = input.note?.trim() || null;
  const carrier = input.carrier?.trim() || row.carrier;
  const trackingCode = input.trackingCode?.trim() || row.tracking_code;

  const parent = await getParentRow(row.order_id);
  if (!parent) throw new HttpError('Không tìm thấy đơn tổng của đơn con này.', 404, 'order_not_found');

  let parentStatus: OrderStatus = parent.status as OrderStatus;

  await transaction(async () => {
    const affected = await executeCount(
      `UPDATE seller_orders SET status = ?, carrier = ?, tracking_code = ?, updated_at = ?
       WHERE id = ? AND status = ?`,
      [input.status, carrier, trackingCode, now, row.id, current]
    );
    if (affected === 0) {
      throw new HttpError(
        'Trạng thái đơn vừa được thay đổi ở nơi khác. Vui lòng tải lại trang và thử lại.',
        409,
        'stale_status'
      );
    }

    await execute(
      `INSERT INTO order_events (id, order_id, seller_order_id, status, from_status, note, actor_type, actor_id, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `evt_${crypto.randomUUID()}`,
        row.order_id,
        row.id,
        input.status,
        current,
        note,
        input.actorType,
        input.actorId ?? null,
        input.source,
        now,
      ]
    );

    // Sự kiện ở đơn cha mang cùng thông tin nhưng gắn nhãn cửa hàng để khách theo dõi được đủ tiến trình.
    await execute(
      `INSERT INTO order_events (id, order_id, seller_order_id, status, from_status, note, actor_type, actor_id, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `evt_${crypto.randomUUID()}`,
        row.order_id,
        row.id,
        input.status,
        current,
        note,
        input.actorType,
        input.actorId ?? null,
        `${input.source} · ${row.store_name}`,
        now,
      ]
    );

    parentStatus = await syncParentStatus(row.order_id, now);
  });

  const view = (await getSellerOrderView(row.store_id, row.id, { withEvents: true })) as SellerOrderView;
  const meta = ORDER_STATUS_META[input.status];

  // Từ đây trở xuống là thông báo — mọi lỗi đều được nuốt để KHÔNG làm hỏng cập nhật đã lưu.
  let sellerNotification = false;
  try {
    await createNotification({
      audience: 'admin',
      orderId: parent.id,
      title: `${parent.code} · ${view.storeName}: ${meta.label}`,
      body: note || meta.description,
      link: `/admin/don-hang?order=${parent.id}`,
    });
  } catch {
    /* không chặn nghiệp vụ */
  }

  if (parent.customer_email) {
    try {
      await createNotification({
        audience: 'customer',
        userEmail: parent.customer_email,
        orderId: parent.id,
        title: `${parent.code} — ${view.storeName}: ${meta.label}`,
        body: note || meta.description,
        link: `/don-hang/${parent.id}`,
      });
    } catch {
      /* không chặn nghiệp vụ */
    }
  }

  // Người bán chỉ được thông báo khi thay đổi KHÔNG do chính họ thực hiện (ví dụ quản trị viên huỷ đơn).
  if (input.actorType !== 'seller') {
    try {
      await createNotification({
        audience: 'seller',
        userEmail: await sellerEmailOf(view.storeId),
        orderId: parent.id,
        title: `Đơn ${view.code}: ${meta.label}`,
        body: note || meta.description,
        link: `/ban-hang/don-hang/${view.id}`,
      });
      sellerNotification = true;
    } catch {
      /* không chặn nghiệp vụ */
    }
  }

  const synthetic: Order = {
    id: parent.id,
    code: parent.code,
    userEmail: null,
    customerName: parent.customer_name,
    customerPhone: parent.customer_phone,
    customerEmail: parent.customer_email,
    addressText: parent.address_text,
    addressNote: parent.address_note,
    lat: parent.lat == null ? null : Number(parent.lat),
    lng: parent.lng == null ? null : Number(parent.lng),
    addressSource: null,
    placeId: null,
    subtotal: view.subtotal,
    shippingFee: view.shippingFee,
    total: view.total,
    status: input.status,
    paymentMethod: 'cod',
    routeDistanceM: view.routeDistanceM,
    routeDurationS: view.routeDurationS,
    routeProvider: view.routeProvider,
    routeStatus: view.routeStatus,
    warehouseId: null,
    warehouseAddress: null,
    createdAt: view.createdAt,
    updatedAt: now,
    items: view.items,
  };

  let emails: SellerStatusUpdateResult['emails'] = { customer: null, admin: { status: 'skipped_no_credentials', to: '', error: 'Chưa gửi.' } as EmailResult, seller: null };
  try {
    const sent = await sendStatusChangeEmails(synthetic, input.status, note);
    emails = { customer: sent.customer, admin: sent.admin, seller: null };
  } catch {
    /* email lỗi: đơn vẫn đã được cập nhật và ghi lịch sử */
  }

  // Cảnh báo cho người bán khi đơn bị huỷ hoặc giao thất bại (cần họ biết để xử lý).
  if (SELLER_FAILED_STATUSES.includes(input.status)) {
    try {
      const sellerEmail = await sellerEmailOf(view.storeId);
      if (sellerEmail) {
        emails.seller = await sendSellerOrderAlertEmail({
          sellerEmail,
          parentOrderId: parent.id,
          summary: { ...summaryOf(view), status: input.status },
          status: input.status,
          note,
        });
      }
    } catch {
      /* không chặn nghiệp vụ */
    }
  }

  let push = { sent: 0, attempted: 0, configured: false, errors: [] as string[] };
  try {
    push = await sendPushToEmail(parent.customer_email, {
      title: `${parent.code} — ${view.storeName}: ${meta.label}`,
      body: note || meta.description,
      url: `/don-hang/${parent.id}`,
      tag: `${view.code}-${input.status}`,
    });
  } catch (error: any) {
    push.errors.push(error?.message || 'Lỗi gửi thông báo đẩy.');
  }

  return { sellerOrder: view, parentStatus, emails, push, sellerNotification };
}

/** Gửi thông báo "có đơn mới" tới đúng cửa hàng có sản phẩm trong đơn (trong website + email + push). */
export async function notifySellerNewOrder(sellerOrderId: string): Promise<{
  email: EmailResult | null;
  push: { sent: number; attempted: number; configured: boolean; errors: string[] };
  notified: boolean;
  skipped?: string;
}> {
  const row = await queryOne<SellerOrderRow>(`SELECT * FROM seller_orders WHERE id = ?`, [sellerOrderId]);
  if (!row) return { email: null, push: { sent: 0, attempted: 0, configured: false, errors: [] }, notified: false, skipped: 'Không tìm thấy đơn con.' };

  const parent = await getParentRow(row.order_id);
  if (!parent) {
    return { email: null, push: { sent: 0, attempted: 0, configured: false, errors: [] }, notified: false, skipped: 'Không tìm thấy đơn tổng.' };
  }

  const view = (await getSellerOrderView(row.store_id, row.id)) as SellerOrderView;
  const sellerEmail = await sellerEmailOf(row.store_id);
  if (!sellerEmail) {
    return {
      email: null,
      push: { sent: 0, attempted: 0, configured: false, errors: [] },
      notified: false,
      skipped: 'Cửa hàng chưa có email chủ sở hữu nên không gửi được thông báo.',
    };
  }

  try {
    await createNotification({
      audience: 'seller',
      userEmail: sellerEmail,
      orderId: parent.id,
      title: `Đơn mới ${view.code}`,
      body: `${view.customerName} · ${view.total.toLocaleString('vi-VN')} ₫ · ${view.items?.length || 0} mặt hàng cần xác nhận`,
      link: `/ban-hang/don-hang/${view.id}`,
    });
  } catch {
    /* thông báo trong website lỗi vẫn phải gửi email */
  }

  let email: EmailResult | null = null;
  try {
    email = await sendSellerNewOrderEmail({
      sellerEmail,
      sellerOrderId: view.id,
      parentOrderId: parent.id,
      summary: { ...summaryOf(view), status: 'pending_confirmation' },
    });
  } catch {
    /* email lỗi không ảnh hưởng đơn đã lưu */
  }

  let push = { sent: 0, attempted: 0, configured: false, errors: [] as string[] };
  try {
    push = await sendPushToEmail(sellerEmail, {
      title: `Đơn mới ${view.code}`,
      body: `Phần của ${view.storeName}: ${view.total.toLocaleString('vi-VN')} ₫ — cần xác nhận.`,
      url: `/ban-hang/don-hang/${view.id}`,
      tag: view.code,
    });
  } catch (error: any) {
    push.errors.push(error?.message || 'Lỗi gửi thông báo đẩy.');
  }

  return { email, push, notified: true };
}

/** Email chủ sở hữu cửa hàng (đọc từ hồ sơ cửa hàng ở máy chủ, không nhận từ client). */
export async function sellerEmailOf(storeId: string): Promise<string | null> {
  const row = await queryOne<{ owner_email: string }>(`SELECT owner_email FROM stores WHERE id = ?`, [storeId]);
  return row?.owner_email ?? null;
}

/** Danh sách đơn con của một đơn tổng mà KHÔNG cần kiểm tra cửa hàng (dùng cho quản trị viên). */
export async function listSellerOrdersOfParent(orderId: string): Promise<SellerOrder[]> {
  return getSellerOrdersByParent(orderId, { withItems: true, withEvents: false });
}

// ---------------------------------------------------------------------------
// Số liệu bán hàng chi tiết
// ---------------------------------------------------------------------------

/** Sản phẩm bán chạy của cửa hàng (tính trên các đơn ĐÃ GIAO THÀNH CÔNG). */
export interface SellerTopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export async function getSellerTopProducts(storeId: string, limit = 5): Promise<SellerTopProduct[]> {
  const rows = await query<{ product_id: string; name: string; quantity: number | null; revenue: number | null }>(
    `SELECT si.product_id, si.name, SUM(si.quantity) AS quantity, SUM(si.line_total) AS revenue
     FROM order_items si
     JOIN seller_orders so ON so.id = si.seller_order_id
     WHERE so.store_id = ? AND so.status = 'delivered'
     GROUP BY si.product_id, si.name
     ORDER BY quantity DESC
     LIMIT ${Math.min(Math.max(Number(limit) || 5, 1), 20)}`,
    [storeId]
  );
  return rows.map((row) => ({
    productId: row.product_id,
    name: row.name,
    quantity: Number(row.quantity ?? 0),
    revenue: Number(row.revenue ?? 0),
  }));
}

/** Số đơn và doanh thu theo từng ngày (N ngày gần nhất) — dùng cho biểu đồ nhỏ trong Trung tâm người bán. */
export interface SellerDailyPoint {
  date: string;
  orders: number;
  revenue: number;
}

export async function getSellerDailyOrders(storeId: string, days = 7): Promise<SellerDailyPoint[]> {
  const span = Math.min(Math.max(Number(days) || 7, 1), 30);
  const rows = await query<{ day: string; orders: number; revenue: number | null }>(
    `SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS orders, SUM(total) AS revenue
     FROM seller_orders
     WHERE store_id = ? AND status <> 'cancelled'
     GROUP BY substr(created_at, 1, 10)
     ORDER BY day DESC
     LIMIT ${span}`,
    [storeId]
  );

  const points: SellerDailyPoint[] = [];
  const byDay = new Map(rows.map((row) => [row.day, row]));

  for (let index = span - 1; index >= 0; index--) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    const row = byDay.get(key);
    points.push({
      date: key,
      orders: Number(row?.orders ?? 0),
      revenue: Number(row?.revenue ?? 0),
    });
  }

  return points;
}
