import { NextRequest, NextResponse } from 'next/server';
import { geoErrorResponse, readLatLng } from '@/lib/geoApi';
import { reverseGeocode, searchPlaces } from '@/lib/geoServer';
import { GeoServiceError } from '@/lib/geoServer';

export const dynamic = 'force-dynamic';

/**
 * Geocoding qua Nominatim (OpenStreetMap).
 *  - GET /api/geo/geocode?mode=reverse&lat=..&lon=..  -> địa chỉ thật của toạ độ GPS
 *  - GET /api/geo/geocode?mode=search&q=..            -> danh sách địa điểm khớp từ khoá
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = params.get('mode') || 'reverse';

  try {
    if (mode === 'search') {
      const query = params.get('q') || '';
      const limit = Math.min(Math.max(Number(params.get('limit')) || 6, 1), 10);
      const places = await searchPlaces(query, limit);
      return NextResponse.json({ ok: true, mode, places });
    }

    if (mode !== 'reverse') {
      throw new GeoServiceError('Chế độ geocoding không được hỗ trợ.', 'bad-input');
    }

    const point = readLatLng(params, 'lat', 'lon');
    if (!point) {
      throw new GeoServiceError('Toạ độ GPS không hợp lệ hoặc bị thiếu.', 'bad-input');
    }

    const place = await reverseGeocode(point);
    return NextResponse.json({ ok: true, mode, place });
  } catch (error) {
    return geoErrorResponse(error);
  }
}
