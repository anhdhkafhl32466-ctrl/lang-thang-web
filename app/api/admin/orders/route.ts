import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { getOrderStats, listAllOrders } from '@/lib/server/orders';
import { requireAdminSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/** GET /api/admin/orders — toàn bộ đơn hàng (chỉ quản trị viên). */
export async function GET(request: NextRequest) {
  try {
    requireAdminSession(request);
    const status = request.nextUrl.searchParams.get('status');
    const [orders, stats] = await Promise.all([listAllOrders({ status }), getOrderStats()]);
    return NextResponse.json({ ok: true, orders, stats });
  } catch (error) {
    return jsonError(error);
  }
}
