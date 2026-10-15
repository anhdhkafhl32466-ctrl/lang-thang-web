import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { getStoreStatusSummary } from '@/lib/server/sellerOverview';

export const dynamic = 'force-dynamic';

/** GET /api/seller/overview — số liệu tổng quan cho trang chủ của Trung tâm người bán. */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const summary = await getStoreStatusSummary(store.id);
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    return jsonError(error);
  }
}
