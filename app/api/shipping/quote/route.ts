import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { quoteShipping } from '@/lib/server/shipping';
import { getWarehouse } from '@/lib/config/commerce';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function readNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/**
 * GET /api/shipping/quote?subtotal=..&lat=..&lng=..
 * Báo giá vận chuyển dựa trên tuyến đường thật từ kho tới địa chỉ nhận hàng.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const subtotal = Math.max(0, readNumber(params, 'subtotal') ?? 0);
    const quote = await quoteShipping({
      subtotal,
      lat: readNumber(params, 'lat'),
      lng: readNumber(params, 'lng'),
    });

    return NextResponse.json({
      ok: true,
      quote,
      warehouse: getWarehouse(),
      attribution: 'Tuyến đường © OpenStreetMap contributors (ODbL) · định tuyến OSRM',
    });
  } catch (error) {
    return jsonError(error);
  }
}
