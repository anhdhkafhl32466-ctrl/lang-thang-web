'use client';

/**
 * Gọi API khu vực NGƯỜI BÁN từ trình duyệt.
 *
 * Lưu ý: mọi quyền hạn đều do máy chủ quyết định từ cookie phiên đã ký — các hàm ở đây chỉ gửi yêu cầu,
 * không tự suy diễn quyền. Vì vậy không cần (và không được) gửi kèm mã cửa hàng từ phía trình duyệt.
 */

import type {
  CatalogProduct,
  SellerOrderFilterInfo,
  SellerOrderView,
  SellerStats,
  Store,
} from '@/lib/orders/types';
import { getCurrentUser } from '@/lib/authStorage';

/**
 * Báo cho toàn bộ giao diện biết PHIÊN MÁY CHỦ vừa thay đổi (đăng nhập / đăng xuất người bán).
 *
 * Vì sao bắt buộc: trang đăng nhập người bán và Trung tâm người bán nằm CÙNG một layout, nên sau khi
 * đăng nhập khung kiểm tra phiên không được dựng lại — thiếu sự kiện này, người bán vừa đăng nhập
 * thành công đã bị báo "Tài khoản này không phải tài khoản người bán" cho tới khi tải lại trang.
 * `detail.user` giữ nguyên tài khoản lưu ở trình duyệt để không làm sai hộ chiếu làng nghề.
 */
function announceSessionChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: getCurrentUser() } }));
}

export interface ApiFailure {
  ok: false;
  error: { code: string; message: string; details?: any };
}

export interface SellerAreaState {
  authenticated: boolean;
  isSeller: boolean;
  email: string | null;
  name: string | null;
  store: Store | null;
  blockedReason: string | null;
  canSell: boolean;
  services?: {
    email: boolean;
    push: boolean;
    storage: { driver: string; directory: string | null; durable: boolean; note: string };
    database: string;
  };
}

export interface StoreSummary {
  store: Store | null;
  statusLabel: string | null;
  products: { total: number; active: number; hidden: number };
  orders: SellerStats;
  unreadNotifications: number;
  recentOrders: SellerOrderView[];
  checklist: { key: string; label: string; done: boolean; hint: string }[];
  canSell: boolean;
}

export interface SellerOrderListResponse {
  ok: true;
  storeId: string;
  storeName: string;
  filter: string;
  filters: SellerOrderFilterInfo[];
  orders: SellerOrderView[];
  stats: SellerStats;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    const message = data?.error?.message || `Yêu cầu thất bại (mã ${res.status}).`;
    const error = new Error(message) as Error & { code?: string; details?: any; status?: number };
    error.code = data?.error?.code;
    error.details = data?.error?.details;
    error.status = res.status;
    throw error;
  }
  return data as T;
}

export function fetchSellerState(): Promise<SellerAreaState> {
  return request<SellerAreaState & { ok: true }>('/api/seller/session');
}

export async function loginSeller(email: string, password: string): Promise<{ store: Store | null; statusMessage?: string }> {
  const result = await request<{ store: Store | null; statusMessage?: string }>('/api/seller/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  announceSessionChanged();
  return result;
}

export async function logoutSeller(): Promise<void> {
  try {
    await fetch('/api/seller/session', { method: 'DELETE' });
  } catch {
    /* phiên sẽ tự hết hạn */
  }
  announceSessionChanged();
}

export function fetchSellerOverview(): Promise<StoreSummary & { ok: true }> {
  return request('/api/seller/overview');
}

export function fetchSellerOrders(filter: string, q?: string): Promise<SellerOrderListResponse> {
  const params = new URLSearchParams({ filter: filter || 'all' });
  if (q) params.set('q', q);
  return request(`/api/seller/orders?${params.toString()}`);
}

export function fetchSellerOrder(idOrCode: string): Promise<{ ok: true; order: SellerOrderView }> {
  return request(`/api/seller/orders/${encodeURIComponent(idOrCode)}`);
}

export function updateSellerOrderStatus(
  idOrCode: string,
  payload: { status: string; note?: string | null; carrier?: string | null; trackingCode?: string | null }
): Promise<{ ok: true; order: SellerOrderView; parentStatus: string; notified: any; push: any }> {
  return request(`/api/seller/orders/${encodeURIComponent(idOrCode)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function fetchMyProducts(): Promise<{ ok: true; products: (CatalogProduct & { active: boolean })[] }> {
  return request('/api/seller/products');
}

export function createProduct(payload: Record<string, unknown>): Promise<{ ok: true; product: CatalogProduct }> {
  return request('/api/seller/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function updateProduct(
  productId: string,
  payload: Record<string, unknown>
): Promise<{ ok: true; product: CatalogProduct }> {
  return request(`/api/seller/products/${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function stopSellingProduct(productId: string): Promise<{ ok: true; archived: boolean }> {
  return request(`/api/seller/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}

export function updateStoreProfile(
  payload: Record<string, unknown>
): Promise<{ ok: true; store: Store; note: string }> {
  return request('/api/seller/store', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function uploadSellerImage(file: File): Promise<{ ok: true; url: string; bytes: number }> {
  const form = new FormData();
  form.append('file', file);
  return request('/api/seller/uploads', { method: 'POST', body: form });
}

export function fetchSellerStats(): Promise<{
  ok: true;
  store: { id: string; name: string; status: string };
  stats: SellerStats;
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  daily: { date: string; orders: number; revenue: number }[];
  byStatusDetail: { status: string; count: number; label: string }[];
  note: string;
}> {
  return request('/api/seller/stats');
}
