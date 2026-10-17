import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { getSession } from '@/lib/server/session';
import { askQuestion, listProductQuestions } from '@/lib/server/reviews';
import { assertRateLimit, callerId, recordRateLimitHit } from '@/lib/server/rateLimit';

export const dynamic = 'force-dynamic';

/** GET /api/products/[id]/questions — hỏi đáp công khai của sản phẩm. */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = getSession(request);
    const questions = await listProductQuestions(context.params.id, { viewerEmail: session?.userEmail });
    return NextResponse.json({ ok: true, productId: context.params.id, questions });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/products/[id]/questions — khách đã đăng nhập gửi câu hỏi cho người bán. */
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    if (!session) throw new HttpError('Bạn cần đăng nhập để gửi câu hỏi.', 401, 'unauthenticated');

    const rlKey = `question:${callerId(request)}:${session.userEmail}`;
    assertRateLimit(rlKey, {
      limit: 8,
      windowMs: 10 * 60 * 1000,
      message: 'Bạn gửi câu hỏi quá nhanh. Vui lòng thử lại sau {minutes} phút.',
    });

    const body = await readJson<any>(request);
    const question = await askQuestion({
      email: session.userEmail,
      name: session.name || session.userEmail.split('@')[0],
      productId: context.params.id,
      body: body?.body,
    });

    recordRateLimitHit(rlKey, 10 * 60 * 1000);
    return NextResponse.json({ ok: true, question }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
