import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, jsonError, readJson } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { replyToReview } from '@/lib/server/reviews';

export const dynamic = 'force-dynamic';

/**
 * POST /api/seller/reviews/[id]/reply — người bán trả lời đánh giá của khách.
 * Quyền sở hữu được kiểm tra bằng `store_id` của cửa hàng trong phiên; đánh giá của shop khác trả 404.
 */
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const { store, sellerEmail } = await requireSeller(request);
    const body = await readJson<any>(request);

    const review = await replyToReview({
      reviewId: context.params.id,
      storeId: store.id,
      sellerEmail,
      sellerName: store.contactName || store.name,
      body: body?.body,
    });

    return NextResponse.json({ ok: true, review });
  } catch (error) {
    return jsonError(error);
  }
}
