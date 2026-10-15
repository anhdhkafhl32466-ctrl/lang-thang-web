/**
 * Quy trình trạng thái đơn hàng.
 *
 * Quy tắc bắt buộc:
 *  - Chỉ được chuyển sang trạng thái có trong danh sách cho phép của trạng thái hiện tại.
 *  - "Đang giao / Đã giao" CHỈ xuất hiện sau khi có sự kiện tương ứng; không tự suy diễn.
 *  - Mọi lần chuyển trạng thái đều phải ghi lại người/hệ thống thực hiện + thời gian + nguồn.
 */

export const ORDER_STATUSES = [
  'pending_confirmation',
  'confirmed',
  'preparing',
  'ready_for_pickup',
  'handed_to_carrier',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'delivery_failed',
  'cancelled',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderStatusMeta {
  label: string;
  description: string;
  /** Bước trong thanh tiến trình (1..7). 0 = không nằm trên tiến trình (giao thất bại / huỷ). */
  step: number;
  tone: 'pending' | 'progress' | 'success' | 'danger';
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  pending_confirmation: {
    label: 'Chờ xác nhận',
    description: 'Đơn đã được ghi nhận, đang chờ quản trị viên xác nhận xử lý.',
    step: 1,
    tone: 'pending',
  },
  confirmed: {
    label: 'Đã xác nhận',
    description: 'Quản trị viên đã xác nhận và tiếp nhận xử lý đơn hàng.',
    step: 2,
    tone: 'progress',
  },
  preparing: {
    label: 'Đang chuẩn bị hàng',
    description: 'Làng nghề đang đóng gói và hoàn thiện sản phẩm.',
    step: 3,
    tone: 'progress',
  },
  ready_for_pickup: {
    label: 'Đã chuẩn bị xong',
    description: 'Người bán đã đóng gói xong, sẵn sàng bàn giao cho đơn vị vận chuyển.',
    step: 4,
    tone: 'progress',
  },
  handed_to_carrier: {
    label: 'Đã bàn giao vận chuyển',
    description: 'Đơn đã được bàn giao cho đơn vị vận chuyển.',
    step: 5,
    tone: 'progress',
  },
  in_transit: {
    label: 'Đang vận chuyển',
    description: 'Kiện hàng đang trên đường tới khu vực người nhận.',
    step: 6,
    tone: 'progress',
  },
  out_for_delivery: {
    label: 'Đang giao đến khách',
    description: 'Nhân viên giao hàng đang trên đường tới địa chỉ người nhận.',
    step: 7,
    tone: 'progress',
  },
  delivered: {
    label: 'Đã giao thành công',
    description: 'Khách hàng đã nhận được đơn hàng.',
    step: 8,
    tone: 'success',
  },
  delivery_failed: {
    label: 'Giao thất bại',
    description: 'Đơn không giao được (khách không nhận, sai địa chỉ...). Cần xử lý lại.',
    step: 0,
    tone: 'danger',
  },
  cancelled: {
    label: 'Đã hủy',
    description: 'Đơn hàng đã được hủy theo quy trình.',
    step: 0,
    tone: 'danger',
  },
};

/** Các bước hiển thị trên thanh tiến trình dành cho khách hàng. */
export const PROGRESS_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending_confirmation', label: 'Chờ xác nhận' },
  { status: 'confirmed', label: 'Đã xác nhận' },
  { status: 'preparing', label: 'Chuẩn bị hàng' },
  { status: 'ready_for_pickup', label: 'Chuẩn bị xong' },
  { status: 'handed_to_carrier', label: 'Bàn giao vận chuyển' },
  { status: 'in_transit', label: 'Đang vận chuyển' },
  { status: 'out_for_delivery', label: 'Đang giao' },
  { status: 'delivered', label: 'Đã giao' },
];

/**
 * Trạng thái được phép chuyển tới từ mỗi trạng thái.
 * Hủy được phép cho tới trước khi bàn giao vận chuyển; giao thất bại chỉ khi đang giao.
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending_confirmation: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  // Người bán có thể báo "đã chuẩn bị xong" rồi mới bàn giao, hoặc bàn giao thẳng (tương thích cũ).
  preparing: ['ready_for_pickup', 'handed_to_carrier', 'cancelled'],
  ready_for_pickup: ['handed_to_carrier', 'cancelled'],
  handed_to_carrier: ['in_transit', 'delivery_failed'],
  in_transit: ['out_for_delivery', 'delivery_failed'],
  out_for_delivery: ['delivered', 'delivery_failed'],
  delivered: [],
  delivery_failed: ['out_for_delivery', 'cancelled'],
  cancelled: [],
};

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Quyền cập nhật trạng thái của NGƯỜI BÁN cho đơn con của cửa hàng mình.
 *
 * Người bán vận hành đúng quy trình giao hàng nên dùng chung bảng chuyển trạng thái với quản trị:
 * không thể nhảy bước, không thể tự "giao thành công" khi chưa qua bước đang giao, và không thể huỷ
 * sau khi đã bàn giao vận chuyển. Khác biệt duy nhất so với quản trị là PHẠM VI DỮ LIỆU: người bán
 * chỉ chạm được đơn con thuộc cửa hàng mình (được kiểm tra ở tầng API/DB, không do client khai báo).
 */
export function sellerCanTransition(from: OrderStatus, to: OrderStatus): boolean {
  return canTransition(from, to);
}

/** Trạng thái kết thúc quy trình (không đổi được nữa). */
export function isTerminal(status: OrderStatus): boolean {
  return status === 'delivered' || status === 'cancelled';
}
