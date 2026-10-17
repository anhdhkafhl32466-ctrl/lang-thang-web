import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { getSession } from '@/lib/server/session';
import { getProduct } from '@/lib/server/catalog';
import {
  listProductReviews,
  listReviewEligibility,
  saveReview,
} from '@/lib/server/reviews';
import { assertRateLimit, callerId, recordRateLimitHit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * GET /api/products/[id]/reviews?rating=5&sort=recent&withImages=1&limit=10&offset=0
 *
 * Công khai: điểm trung bình, phân bố sao và danh sách đánh giá THẬT đang hiển thị.
 * Nếu người xem đã đăng nhập, trả thêm danh sách đơn đã giao đủ điều kiện đánh giá sản phẩm này.
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const productId = context.params.id;
    const params = request.nextUrl.searchParams;
    const session = getSession(request);
    const viewerEmail = session?.userEmail || null;

    const result = await listProductReviews(productId, {
      rating: Number(params.get('rating')) || null,
      withImages: params.get('withImages') === '1',
      sort: (params.get('sort') as 'recent' | 'highest' | 'lowest') || 'recent',
      limit: Number(params.get('limit')) || 10,
      offset: Number(params.get('offset')) || 0,
      viewerEmail,
    });

    const eligibility = viewerEmail ? await listReviewEligibility(viewerEmail, productId) : [];

    return NextResponse.json({
      ok: true,
      productId,
      reviews: result.items,
      summary: result.summary,
      total: result.total,
      offset: result.offset,
      eligibility,
      /** Điều kiện đánh giá do máy chủ quyết định; giao diện chỉ hiển thị theo giá trị này. */
      canReview: eligibility.some((item) => !item.alreadyReviewed),
    });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/products/[id]/reviews — khách đã nhận hàng gửi/sửa đánh giá của mình. */
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    if (!session) {
      throw new HttpError('Bạn cần đăng nhập bằng tài khoản đã đặt đơn để đánh giá.', 401, 'unauthenticated');
    }

    const rlKey = `review:${callerId(request)}:${session.userEmail}`;
    assertRateLimit(rlKey, {
      limit: 10,
      windowMs: 10 * 60 * 1000,
      message: 'Bạn gửi đánh giá quá nhanh. Vui lòng thử lại sau {minutes} phút.',
    });

    const body = await readJson<any>(request);
    if (!body?.orderId) {
      throw new HttpError('Thiếu mã đơn hàng để xác minh đã mua.', 400, 'missing_field', { field: 'orderId' });
    }

    const product = await getProduct(context.params.id);
    if (!product) {
      throw new HttpError('Sản phẩm không tồn tại hoặc đã ngừng bán.', 404, 'product_not_found');
    }

    const result = await saveReview({
      email: session.userEmail,
      name: session.name || session.userEmail.split('@')[0],
      productId: context.params.id,
      orderId: String(body.orderId),
      rating: body.rating,
      comment: body.comment,
      packagingRating: body.packagingRating,
      deliveryRating: body.deliveryRating,
      images: body.images,
    });

    recordRateLimitHit(rlKey, 10 * 60 * 1000);
    return NextResponse.json(
      { ok: true, review: result.review, created: result.created },
      { status: result.created ? 201 : 200 }
    );
  } catch (error) {
    return jsonError(error);
  }
}
