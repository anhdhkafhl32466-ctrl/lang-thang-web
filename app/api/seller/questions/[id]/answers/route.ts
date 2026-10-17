import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, jsonError, readJson } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { answerQuestion } from '@/lib/server/reviews';

export const dynamic = 'force-dynamic';

/** POST /api/seller/questions/[id]/answers — người bán trả lời câu hỏi thuộc sản phẩm của mình. */
export async function POST(request: NextRequest, context: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const { store, sellerEmail } = await requireSeller(request);
    const body = await readJson<any>(request);

    const answer = await answerQuestion({
      questionId: context.params.id,
      storeId: store.id,
      sellerEmail,
      sellerName: store.contactName || store.name,
      body: body?.body,
    });

    return NextResponse.json({ ok: true, answer }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
