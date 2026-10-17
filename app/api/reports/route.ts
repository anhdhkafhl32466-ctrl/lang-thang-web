import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { getSession } from '@/lib/server/session';
import { createReport } from '@/lib/server/reviews';
import { assertRateLimit, callerId, recordRateLimitHit } from '@/lib/server/rateLimit';
import type { ReportTargetType } from '@/lib/reviews/types';

export const dynamic = 'force-dynamic';

const VALID_TARGETS = new Set<ReportTargetType>(['review', 'question', 'answer']);

/** POST /api/reports — người dùng đã đăng nhập báo cáo đánh giá/câu hỏi/câu trả lời vi phạm. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    if (!session) throw new HttpError('Bạn cần đăng nhập để gửi báo cáo.', 401, 'unauthenticated');

    const rlKey = `report:${callerId(request)}:${session.userEmail}`;
    assertRateLimit(rlKey, {
      limit: 10,
      windowMs: 60 * 60 * 1000,
      message: 'Bạn đã gửi quá nhiều báo cáo. Vui lòng thử lại sau {minutes} phút.',
    });

    const body = await readJson<any>(request);
    const targetType = body?.targetType as ReportTargetType;
    if (!VALID_TARGETS.has(targetType) || typeof body?.targetId !== 'string' || !body.targetId) {
      throw new HttpError('Thiếu thông tin nội dung cần báo cáo.', 400, 'missing_field');
    }

    const report = await createReport({
      targetType,
      targetId: body.targetId,
      reporterEmail: session.userEmail,
      reason: body.reason,
      detail: body.detail,
    });

    recordRateLimitHit(rlKey, 60 * 60 * 1000);
    return NextResponse.json({ ok: true, report }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
