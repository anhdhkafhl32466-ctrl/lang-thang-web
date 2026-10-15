import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { quoteCartShipping, quoteShipping } from '@/lib/server/shipping';
import { getWarehouse } from '@/lib/config/commerce';

export const dynamic = 'force-dynamic';
export const maxDuration = 45;

function readNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Đọc giỏ hàng từ tham số `items`, dạng `productId:quantity,productId:quantity`. */
function readItems(params: URLSearchParams): { productId: string; quantity: number }[] {
  const raw = params.get('items');
  if (!raw) return [];
  return raw
    .split(',')
    .map((chunk) => {
      const [productId, quantity] = chunk.split(':');
      return { productId: (productId || '').trim(), quantity: Math.max(1, Number(quantity) || 1) };
    })
    .filter((item) => item.productId)
    .slice(0, 100);
}

/**
 * GET /api/shipping/quote?items=prod-a:2,prod-b:1&lat=..&lng=..
 *
 * Báo giá vận chuyển dựa trên tuyến đường thật. Khi có `items`, hệ thống tách giỏ hàng theo CỬA HÀNG
 * và tính riêng từng chặng (mỗi cửa hàng xuất hàng từ địa chỉ của mình), rồi trả về cả `legs` để
 * giao diện hiển thị minh bạch. Không truyền `items` thì giữ cách tính cũ từ kho của sàn.
 */
export async function GET(request: NextRequest) {
  try {
    const params = request.nextUrl.searchParams;
    const items = readItems(params);
    const lat = readNumber(params, 'lat');
    const lng = readNumber(params, 'lng');

    if (items.length > 0) {
      const { quote, legs } = await quoteCartShipping({ items, lat, lng });
      return NextResponse.json({
        ok: true,
        quote,
        legs,
        warehouse: getWarehouse(),
        attribution: 'Tuyến đường © OpenStreetMap contributors (ODbL) · định tuyến OSRM',
        note: 'Phí vận chuyển là tổng phí của từng chặng: mỗi cửa hàng xuất hàng từ địa chỉ của mình.',
      });
    }

    const subtotal = Math.max(0, readNumber(params, 'subtotal') ?? 0);
    const quote = await quoteShipping({ subtotal, lat, lng });

    return NextResponse.json({
      ok: true,
      quote,
      legs: [],
      warehouse: getWarehouse(),
      attribution: 'Tuyến đường © OpenStreetMap contributors (ODbL) · định tuyến OSRM',
    });
  } catch (error) {
    return jsonError(error);
  }
}
