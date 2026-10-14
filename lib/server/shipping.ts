/**
 * Tính phí vận chuyển và tuyến đường thực tế từ kho xuất hàng tới địa chỉ nhận hàng.
 *
 * - Tuyến đường lấy từ dịch vụ định tuyến đường bộ thật (OSRM, dữ liệu OpenStreetMap) qua lib/geoServer.
 * - Nếu không lấy được tuyến (thiếu toạ độ / dịch vụ lỗi), hệ thống KHÔNG bịa khoảng cách:
 *   phí chuyển về mức cơ bản và trạng thái được ghi rõ là "không tính được tuyến".
 */

import { getWarehouse, SHIPPING } from '@/lib/config/commerce';
import { getRoute, GeoServiceError } from '@/lib/geoServer';
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

/** Gọi dịch vụ định tuyến thật từ kho tới một toạ độ nhận hàng. */
export async function getRouteFromWarehouse(
  destLat: number | null | undefined,
  destLng: number | null | undefined
): Promise<RouteInfo> {
  const warehouse = getWarehouse();

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
      { lat: warehouse.lat, lng: warehouse.lng },
      { lat: destLat, lng: destLng },
      'driving',
      { originLabel: warehouse.name, destinationLabel: 'địa chỉ nhận hàng' }
    );
    return {
      distanceM: Math.round(route.distance),
      durationS: Math.round(route.duration),
      provider: route.provider,
      status: 'Đã tính bằng dịch vụ định tuyến đường bộ thực tế.',
    };
  } catch (error) {
    const message =
      error instanceof GeoServiceError
        ? error.message
        : 'Không kết nối được tới dịch vụ định tuyến để tính khoảng cách.';
    return { distanceM: null, durationS: null, provider: null, status: message };
  }
}

/** Báo giá vận chuyển cho một địa chỉ nhận hàng (dùng cho trang thanh toán). */
export async function quoteShipping(params: {
  subtotal: number;
  lat?: number | null;
  lng?: number | null;
}): Promise<ShippingQuote> {
  const route = await getRouteFromWarehouse(params.lat, params.lng);
  const fee = computeFee(params.subtotal, route.distanceM);

  let message: string;
  if (params.subtotal >= SHIPPING.freeShippingThreshold) {
    message = 'Đơn hàng đủ điều kiện miễn phí vận chuyển.';
  } else if (route.distanceM != null) {
    message = `Phí tính theo tuyến đường thực tế từ kho (${(route.distanceM / 1000).toFixed(1)} km).`;
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
