/**
 * Tính phí vận chuyển và tuyến đường thực tế từ điểm xuất hàng tới địa chỉ nhận hàng.
 *
 * - Tuyến đường lấy từ dịch vụ định tuyến đường bộ thật (OSRM, dữ liệu OpenStreetMap) qua lib/geoServer.
 * - Nếu không lấy được tuyến (thiếu toạ độ / dịch vụ lỗi), hệ thống KHÔNG bịa khoảng cách:
 *   phí chuyển về mức cơ bản và trạng thái được ghi rõ là "không tính được tuyến".
 *
 * MÔ HÌNH ĐA NGƯỜI BÁN: mỗi cửa hàng là một CHẶNG giao hàng riêng (từ địa chỉ xuất hàng của cửa hàng
 * tới khách). Vì vậy phí vận chuyển của đơn tổng là TỔNG phí của từng chặng, và mỗi đơn con giữ phí
 * của chặng mình. Cửa hàng chưa khai toạ độ xuất hàng sẽ dùng kho mặc định của sàn (địa chỉ Đại học
 * FPT Hà Nội) — trạng thái chặng ghi rõ điều này thay vì im lặng coi như nhau.
 */

import { getWarehouse, SHIPPING } from '@/lib/config/commerce';
import { getRoute, GeoServiceError } from '@/lib/geoServer';
import { getProductsByIds } from './catalog';
import { getStoreById } from './stores';
import type { Store } from '@/lib/orders/types';
import type { ShippingQuote } from '@/lib/orders/types';

function computeFee(subtotal: number, distanceM: number | null): number {
  if (subtotal >= SHIPPING.freeShippingThreshold) return 0;
  if (distanceM == null) return SHIPPING.baseFee;

  const km = distanceM / 1000;
  const extraKm = Math.max(0, km - SHIPPING.includedKm);
  const fee = SHIPPING.baseFee + extraKm * SHIPPING.perKmFee;
  return Math.min(Math.round(fee), SHIPPING.maxFee);
}

export interface RouteInfo {
  distanceM: number | null;
  durationS: number | null;
  provider: string | null;
  status: string;
}

/** Điểm xuất hàng (kho của sàn hoặc địa chỉ cửa hàng). */
export interface ShippingOrigin {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  /** true khi phải dùng kho mặc định vì cửa hàng chưa khai toạ độ xuất hàng. */
  fallbackToWarehouse?: boolean;
}

export function warehouseOrigin(): ShippingOrigin {
  const warehouse = getWarehouse();
  return { id: warehouse.id, name: warehouse.name, address: warehouse.address, lat: warehouse.lat, lng: warehouse.lng };
}

/** Gọi dịch vụ định tuyến thật từ một điểm xuất hàng tới một toạ độ nhận hàng. */
export async function getRouteFromOrigin(
  origin: ShippingOrigin,
  destLat: number | null | undefined,
  destLng: number | null | undefined
): Promise<RouteInfo> {
  if (destLat == null || destLng == null) {
    return {
      distanceM: null,
      durationS: null,
      provider: null,
      status: 'Thiếu toạ độ nhận hàng — chưa tính được tuyến đường.',
    };
  }

  try {
    const route = await getRoute(
      { lat: origin.lat, lng: origin.lng },
      { lat: destLat, lng: destLng },
      'driving',
      { originLabel: origin.name, destinationLabel: 'địa chỉ nhận hàng' }
    );
    return {
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
      provider: route.provider,
      status: origin.fallbackToWarehouse
        ? `Đã tính bằng dịch vụ định tuyến thật từ KHO MẶC ĐỊNH của sàn (cửa hàng chưa khai toạ độ xuất hàng).`
        : `Đã tính bằng dịch vụ định tuyến đường bộ thực tế từ địa chỉ xuất hàng của cửa hàng.`,
    };
  } catch (error) {
    const message =
      error instanceof GeoServiceError
        ? error.message
        : 'Không kết nối được tới dịch vụ định tuyến để tính khoảng cách.';
    return { distanceM: null, durationS: null, provider: null, status: message };
  }
}

/** Báo giá vận chuyển cho MỘT chặng (từ một điểm xuất hàng tới địa chỉ nhận). */
export async function quoteShippingFrom(
  origin: ShippingOrigin,
  params: { subtotal: number; lat?: number | null; lng?: number | null }
): Promise<ShippingQuote> {
  const route = await getRouteFromOrigin(origin, params.lat, params.lng);
  const fee = computeFee(params.subtotal, route.distanceM);

  let message: string;
  if (params.subtotal >= SHIPPING.freeShippingThreshold) {
    message = 'Phần hàng này đủ điều kiện miễn phí vận chuyển.';
  } else if (route.distanceM != null) {
    message = `Phí tính theo tuyến đường thực tế từ ${origin.name} (${(route.distanceM / 1000).toFixed(1)} km).`;
  } else {
    message = `Chưa xác định được tuyến đường nên tạm thu phí cơ bản. ${route.status}`;
  }

  return {
    ok: true,
    distanceM: route.distanceM,
    durationS: route.durationS,
    provider: route.provider,
    fee,
    freeShipping: fee === 0,
    chargedKm: route.distanceM != null ? Number((route.distanceM / 1000).toFixed(1)) : 0,
    message,
  };
}

/** Tương thích cũ: báo giá tính từ kho của sàn. */
export async function getRouteFromWarehouse(
  destLat: number | null | undefined,
  destLng: number | null | undefined
): Promise<RouteInfo> {
  return getRouteFromOrigin(warehouseOrigin(), destLat, destLng);
}

/** Tương thích cũ: báo giá cho một đơn với một điểm xuất hàng duy nhất (kho của sàn). */
export async function quoteShipping(params: {
  subtotal: number;
  lat?: number | null;
  lng?: number | null;
}): Promise<ShippingQuote> {
  return quoteShippingFrom(warehouseOrigin(), params);
}

// ---------------------------------------------------------------------------
// Báo giá theo giỏ hàng nhiều cửa hàng
// ---------------------------------------------------------------------------

/** Một chặng giao hàng của một cửa hàng. */
export interface ShippingLeg {
  storeId: string;
  storeName: string;
  subtotal: number;
  fee: number;
  freeShipping: boolean;
  distanceM: number | null;
  durationS: number | null;
  provider: string | null;
  status: string;
  originName: string;
  usingWarehouseFallback: boolean;
}

export interface CartShippingQuote {
  quote: ShippingQuote;
  legs: ShippingLeg[];
}

/**
 * Điểm xuất hàng của một cửa hàng: dùng toạ độ cửa hàng, thiếu thì mượn kho mặc định của sàn.
 * Khi phải mượn kho, tên điểm xuất hàng ghi rõ điều đó để không ai hiểu nhầm là đã lấy hàng tại cửa hàng.
 */
export function originForStoreRecord(store: Store | null): ShippingOrigin {
  const hasCoords =
    store && store.lat != null && store.lng != null && Number.isFinite(store.lat) && Number.isFinite(store.lng);

  if (store && hasCoords) {
    return {
      id: store.id,
      name: store.name,
      address: store.addressText || store.name,
      lat: Number(store.lat),
      lng: Number(store.lng),
      fallbackToWarehouse: false,
    };
  }

  const warehouse = warehouseOrigin();
  return {
    ...warehouse,
    name: store ? `${store.name} (chưa khai toạ độ — dùng ${warehouse.name})` : warehouse.name,
    fallbackToWarehouse: true,
  };
}

export async function originForStore(storeId: string): Promise<ShippingOrigin> {
  return originForStoreRecord(await getStoreById(storeId));
}

/**
 * Báo giá vận chuyển cho một giỏ hàng có thể gồm nhiều cửa hàng.
 *
 * Vì sao tính theo TỪNG cửa hàng: hai cửa hàng ở hai đầu thành phố không thể dùng chung một chặng.
 * Tổng phí = tổng phí các chặng; nhờ vậy số tiền hiển thị trước khi bấm "Đặt hàng" khớp đúng với
 * số tiền máy chủ tính khi tạo đơn (hai bên dùng chung đúng hàm này).
 */
export async function quoteCartShipping(params: {
  items: { productId: string; quantity: number }[];
  lat?: number | null;
  lng?: number | null;
}): Promise<CartShippingQuote> {
  const products = await getProductsByIds(params.items.map((item) => item.productId));

  const groups = new Map<string, { storeId: string; subtotal: number }>();
  for (const item of params.items) {
    const product = products.get(item.productId);
    if (!product) continue;
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const current = groups.get(product.storeId) || { storeId: product.storeId, subtotal: 0 };
    current.subtotal += product.price * quantity;
    groups.set(product.storeId, current);
  }

  const legs: ShippingLeg[] = [];
  for (const group of Array.from(groups.values())) {
    const origin = await originForStore(group.storeId);
    const quote = await quoteShippingFrom(origin, { subtotal: group.subtotal, lat: params.lat, lng: params.lng });
    legs.push({
      storeId: group.storeId,
      storeName: origin.name,
      subtotal: group.subtotal,
      fee: quote.fee,
      freeShipping: quote.freeShipping,
      distanceM: quote.distanceM,
      durationS: quote.durationS,
      provider: quote.provider,
      status: quote.message,
      originName: origin.name,
      usingWarehouseFallback: Boolean(origin.fallbackToWarehouse),
    });
  }

  const subtotal = legs.reduce((sum, leg) => sum + leg.subtotal, 0);
  const fee = legs.reduce((sum, leg) => sum + leg.fee, 0);
  const legsWithRoute = legs.filter((leg) => leg.distanceM != null);
  const distanceM = legsWithRoute.length > 0 ? legsWithRoute.reduce((sum, leg) => sum + (leg.distanceM as number), 0) : null;
  const durationS = legsWithRoute.length > 0 ? legsWithRoute.reduce((sum, leg) => sum + (leg.durationS || 0), 0) : null;
  const providers = Array.from(new Set(legsWithRoute.map((leg) => leg.provider).filter(Boolean))) as string[];

  const freeShipping = fee === 0 && legs.length > 0;
  const message =
    legs.length === 0
      ? 'Giỏ hàng đang trống.'
      : legs.length === 1
        ? legs[0].status
        : `Đơn gồm ${legs.length} chặng giao hàng từ ${legs.length} cửa hàng; phí vận chuyển là tổng phí của từng chặng.`;

  return {
    quote: {
      ok: true,
      distanceM,
      durationS,
      provider: providers.length === 0 ? null : providers.length === 1 ? providers[0] : `${providers.length} nguồn định tuyến`,
      fee,
      freeShipping,
      chargedKm: distanceM == null ? 0 : Number((distanceM / 1000).toFixed(1)),
      message,
    },
    legs,
  };
}
