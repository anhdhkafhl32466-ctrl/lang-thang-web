/**
 * Kiểu dữ liệu dùng chung giữa client và server cho luồng đặt hàng.
 * Các kiểu này phản ánh đúng bản ghi trong cơ sở dữ liệu (xem lib/server/schema.ts).
 */

import type { OrderStatus } from './workflow';

export interface CatalogProduct {
  id: string;
  name: string;
  villageId: string;
  villageName: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  artisanName: string;
  material: string | null;
  dimensions: string | null;
  /** Cửa hàng (người bán) sở hữu sản phẩm — bắt buộc trong mô hình đa người bán. */
  storeId: string;
  storeName: string;
  storeSlug?: string | null;
  storeStatus: StoreStatus;
  description?: string | null;
  weightG?: number | null;
  preparationDays?: number | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
}

export type StoreStatus = 'pending' | 'active' | 'suspended' | 'rejected';

export interface Store {
  id: string;
  /** ID tài khoản người dùng chủ sở hữu (users.id) — liên kết chặt chẽ tài khoản với shop */
  ownerId?: string | null;
  ownerEmail: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  contactName: string | null;
  addressText: string | null;
  addressNote: string | null;
  lat: number | null;
  lng: number | null;
  logoUrl: string | null;
  bannerUrl?: string | null;
  shippingPolicy?: string | null;
  prepTimeDays?: number | null;
  /** Nhóm sản phẩm dự định kinh doanh (người bán tự khai khi đăng ký). */
  categories: string[];
  status: StoreStatus;
  approvalStatus?: string | null;
  reviewNote: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Warehouse {
  id: string;
  storeId: string;
  name: string;
  addressText: string;
  addressNote: string | null;
  lat: number | null;
  lng: number | null;
  contactName: string | null;
  phone: string | null;
  isDefault: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressLabel = 'Nhà riêng' | 'Trường học' | 'Ký túc xá' | 'Công ty' | 'Khác';

export interface CustomerAddress {
  id: string;
  userEmail: string;
  recipientName: string;
  phone: string;
  province?: string | null;
  ward?: string | null;
  addressText: string;
  addressNote?: string | null;
  lat?: number | null;
  lng?: number | null;
  label: AddressLabel | string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  villageName: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  /** Cửa hàng bán mặt hàng này (bản chụp khi đặt). */
  storeId: string | null;
  sellerOrderId: string | null;
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  /** Trạng thái NGAY TRƯỚC lần chuyển này. null với sự kiện khởi tạo đơn. */
  fromStatus: OrderStatus | null;
  note: string | null;
  actorType: 'customer' | 'admin' | 'seller' | 'system';
  actorId: string | null;
  source: string;
  createdAt: string;
  /** Sự kiện thuộc đơn con của cửa hàng nào (null với sự kiện ở cấp đơn cha). */
  sellerOrderId?: string | null;
}

/**
 * ĐƠN CON của một cửa hàng trong đơn hàng.
 * Người bán chỉ làm việc với đơn con của cửa hàng mình: tiền hàng, phí ship và trạng thái riêng.
 */
export interface SellerOrder {
  id: string;
  orderId: string;
  storeId: string;
  code: string;
  storeName: string;
  storeAddress: string | null;
  storeLat: number | null;
  storeLng: number | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  carrier: string | null;
  trackingCode: string | null;
  routeDistanceM: number | null;
  routeDurationS: number | null;
  routeProvider: string | null;
  routeStatus: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  events?: OrderEvent[];
}

/**
 * Đơn con kèm thông tin cần để NGƯỜI BÁN giao hàng (tên/điện thoại/địa chỉ người nhận của đơn tổng).
 * Người bán chỉ nhận được bản ghi này cho đơn có sản phẩm của cửa hàng mình.
 */
export interface SellerOrderView extends SellerOrder {
  parentCode: string;
  parentStatus: OrderStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  addressText: string;
  addressNote: string | null;
  lat: number | null;
  lng: number | null;
  /** Các bước người bán được phép chuyển tới — do máy chủ tính từ quy trình đơn hàng. */
  allowedTransitions: OrderStatus[];
  /** Đơn còn nằm trong tay người bán (cần xác nhận / chuẩn bị hàng). */
  needsAction: boolean;
}

/** Số liệu bán hàng của một cửa hàng. */
export interface SellerStats {
  totalOrders: number;
  byStatus: Record<string, number>;
  /** Doanh thu ghi nhận = tổng tiền các đơn đã giao thành công. */
  revenue: number;
  /** Tiền của các đơn chưa giao và chưa huỷ. */
  pendingRevenue: number;
  unitsSold: number;
  needsAction: number;
}

/** Bộ lọc đơn hàng trong Trung tâm người bán. */
export interface SellerOrderFilterInfo {
  key: string;
  label: string;
  hint: string;
}

export type AddressSource = 'gps' | 'search' | 'village' | 'manual';

export interface Order {
  id: string;
  code: string;
  userEmail: string | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  addressText: string;
  addressNote: string | null;
  lat: number | null;
  lng: number | null;
  addressSource: AddressSource | null;
  placeId: string | null;
  subtotal: number;
  shippingFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  routeDistanceM: number | null;
  routeDurationS: number | null;
  routeProvider: string | null;
  routeStatus: string | null;
  warehouseId: string | null;
  warehouseAddress: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  events?: OrderEvent[];
  /** Các đơn con theo cửa hàng (đơn đa cửa hàng được tách ở đây). */
  sellerOrders?: SellerOrder[];
}

export interface SiteNotification {
  id: string;
  audience: 'admin' | 'customer' | 'seller';
  userEmail: string | null;
  orderId: string | null;
  title: string;
  body: string | null;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
    email?: string | null;
  };
  address: {
    text: string;
    note?: string | null;
    lat?: number | null;
    lng?: number | null;
    source: AddressSource;
    placeId?: string | null;
  };
  items: CartLine[];
  paymentMethod?: string;
  route?: {
    distanceM: number | null;
    durationS: number | null;
    provider: string | null;
    status: string;
  } | null;
}

export interface ShippingQuote {
  ok: boolean;
  distanceM: number | null;
  durationS: number | null;
  provider: string | null;
  fee: number;
  freeShipping: boolean;
  chargedKm: number;
  message: string;
}
