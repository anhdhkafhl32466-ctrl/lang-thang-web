import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError } from '@/lib/server/http';
import { getSession } from '@/lib/server/session';
import { deleteOwnReview } from '@/lib/server/reviews';

export const dynamic = 'force-dynamic';

/** DELETE /api/reviews/[id] — khách xoá đánh giá CỦA CHÍNH MÌNH (máy chủ kiểm tra quyền sở hữu). */
export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    if (!session) throw new HttpError('Bạn cần đăng nhập để xoá đánh giá.', 401, 'unauthenticated');

    const removed = await deleteOwnReview(context.params.id, session.userEmail);
    if (!removed) throw new HttpError('Không tìm thấy đánh giá này.', 404, 'review_not_found');

    return NextResponse.json({ ok: true, id: context.params.id });
  } catch (error) {
    return jsonError(error);
  }
}
