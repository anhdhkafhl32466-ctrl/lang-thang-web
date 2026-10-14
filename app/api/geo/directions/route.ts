import { NextRequest, NextResponse } from 'next/server';
import { geoErrorResponse, OPENSTREETMAP_ATTRIBUTION, readLatLng, readProfile } from '@/lib/geoApi';
import { GeoServiceError, getRoute } from '@/lib/geoServer';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Tính lộ trình theo mạng lưới đường bộ thực tế (OSRM).
 * GET /api/geo/directions?fromLat=..&fromLon=..&toLat=..&toLon=..&profile=driving|foot|bike
 *
 * Trả về hình học tuyến đường thật, khoảng cách, thời gian và hướng dẫn từng chặng
 * (tên đường / số hiệu quốc lộ - tỉnh lộ lấy từ OpenStreetMap).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const from = readLatLng(params, 'fromLat', 'fromLon');
    const to = readLatLng(params, 'toLat', 'toLon');

    if (!from || !to) {
      throw new GeoServiceError(
        'Thiếu hoặc sai toạ độ điểm xuất phát / điểm đến (cần fromLat, fromLon, toLat, toLon).',
        'bad-input'
      );
    }

    const profile = readProfile(params);
    const route = await getRoute(from, to, profile, {
      originLabel: params.get('fromLabel') || undefined,
      destinationLabel: params.get('toLabel') || undefined,
    });

    return NextResponse.json({ ok: true, route, attribution: OPENSTREETMAP_ATTRIBUTION });
  } catch (error) {
    return geoErrorResponse(error);
  }
}
