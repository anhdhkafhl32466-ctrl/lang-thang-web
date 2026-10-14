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
}

export interface OrderEvent {
  id: string;
  status: OrderStatus;
  note: string | null;
  actorType: 'customer' | 'admin' | 'system';
  actorId: string | null;
  source: string;
  createdAt: string;
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
}

export interface SiteNotification {
  id: string;
  audience: 'admin' | 'customer';
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
