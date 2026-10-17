import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { listStoreQuestions } from '@/lib/server/reviews';

export const dynamic = 'force-dynamic';

/** GET /api/seller/questions?filter=unanswered — câu hỏi thuộc sản phẩm của cửa hàng đang đăng nhập. */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const filter = request.nextUrl.searchParams.get('filter') === 'unanswered' ? 'unanswered' : 'all';
    const result = await listStoreQuestions(store.id, { filter, limit: Number(request.nextUrl.searchParams.get('limit')) || 50 });
    return NextResponse.json({ ok: true, storeId: store.id, filter, ...result });
  } catch (error) {
    return jsonError(error);
  }
}
