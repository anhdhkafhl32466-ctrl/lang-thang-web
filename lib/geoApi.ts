import { NextResponse } from 'next/server';
import { isValidLatLng, LatLng, TravelProfile } from './geo';
import { GeoServiceError } from './geoServer';

/**
 * Đọc một số từ query string.
 *
 * Bắt buộc phân biệt “tham số không tồn tại / rỗng” với “số 0”:
 * `Number(null)` và `Number('')` đều bằng 0, nên nếu không kiểm tra riêng thì toạ độ
 * thiếu sẽ im lặng thành (0, 0) — điểm Null Island giữa Đại Tây Dương — và hệ thống
 * sẽ tra dữ liệu cho một nơi không có thật thay vì báo lỗi sai toạ độ.
 */
function readCoordinate(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null) return null;
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

/** Đọc cặp toạ độ từ query string, trả về null nếu thiếu hoặc không hợp lệ. */
export function readLatLng(
  params: URLSearchParams,
  latKey: string,
  lngKey: string
): LatLng | null {
  const lat = readCoordinate(params, latKey);
  const lng = readCoordinate(params, lngKey);
  if (lat === null || lng === null) return null;

  const point = { lat, lng };
  if (!isValidLatLng(point)) return null;

  // (0, 0) chính là “toạ độ mặc định” kinh điển trong mã: không có lý do nào mà cả vĩ độ
  // lẫn kinh độ đều bằng 0 cho một trang web về làng nghề ở Việt Nam — coi là dữ liệu thiếu.
  if (lat === 0 && lng === 0) return null;

  return point;
}

export function readProfile(params: URLSearchParams): TravelProfile {
  const raw = (params.get('profile') || 'driving').toLowerCase();
  if (raw === 'foot' || raw === 'walking') return 'foot';
  if (raw === 'bike' || raw === 'cycling') return 'bike';
  return 'driving';
}

export const OPENSTREETMAP_ATTRIBUTION = 'Dữ liệu bản đồ © OpenStreetMap contributors (ODbL)';

export function geoErrorResponse(error: unknown): NextResponse {
  if (error instanceof GeoServiceError) {
    const status =
      error.kind === 'bad-input'
        ? 400
        : error.kind === 'no-route'
          ? 404
          : error.kind === 'unsupported'
            ? 501
            : 502;
    return NextResponse.json(
      { ok: false, error: { kind: error.kind, message: error.message } },
      { status }
    );
  }

  console.error('[geo] Lỗi không mong đợi:', error);
  return NextResponse.json(
    {
      ok: false,
      error: { kind: 'unknown', message: 'Lỗi không xác định khi gọi dịch vụ bản đồ.' },
    },
    { status: 500 }
  );
}
