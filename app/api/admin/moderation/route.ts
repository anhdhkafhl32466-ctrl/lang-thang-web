import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { requireAdminSession } from '@/lib/server/session';
import {
  listModerationActions,
  listReports,
  moderateContent,
  resolveReport,
} from '@/lib/server/reviews';
import type { ReportStatus, ReportTargetType } from '@/lib/reviews/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/moderation?status=open|all
 * Hàng đợi kiểm duyệt: báo cáo vi phạm + nhật ký hành động của quản trị.
 * Chỉ tài khoản quản trị đã xác minh ở máy chủ mới đọc được.
 */
export async function GET(request: NextRequest) {
  try {
    requireAdminSession(request);
    const raw = request.nextUrl.searchParams.get('status');
    const status: ReportStatus | 'all' = raw === 'all' ? 'all' : 'open';

    const [reports, actions] = await Promise.all([listReports(status), listModerationActions(50)]);
    return NextResponse.json({ ok: true, status, reports, actions });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/admin/moderation
 *  - { action: 'hide' | 'restore', targetType, targetId, note }
 *  - { action: 'resolve_report', reportId, status: 'resolved' | 'dismissed', note }
 *
 * Ẩn nội dung KHÔNG xoá dữ liệu của khách; mọi thao tác đều ghi vào moderation_actions để truy vết.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = requireAdminSession(request);
    const body = await readJson<any>(request);
    const action = String(body?.action || '');

    if (action === 'hide' || action === 'restore') {
      const targetType = body?.targetType as ReportTargetType;
      if (!['review', 'question', 'answer'].includes(targetType) || typeof body?.targetId !== 'string') {
        throw new HttpError('Thiếu thông tin nội dung cần xử lý.', 400, 'missing_field');
      }
      const result = await moderateContent({
        targetType,
        targetId: body.targetId,
        action,
        actorEmail: session.userEmail,
        note: body?.note ?? null,
      });
      return NextResponse.json({ ok: true, action, targetId: body.targetId, ...result });
    }

    if (action === 'resolve_report') {
      const status = body?.status === 'dismissed' ? 'dismissed' : 'resolved';
      if (typeof body?.reportId !== 'string') {
        throw new HttpError('Thiếu mã báo cáo.', 400, 'missing_field');
      }
      const resolved = await resolveReport({
        reportId: body.reportId,
        status,
        note: body?.note ?? null,
        actorEmail: session.userEmail,
      });
      if (!resolved) throw new HttpError('Không tìm thấy báo cáo này.', 404, 'report_not_found');
      return NextResponse.json({ ok: true, reportId: body.reportId, status });
    }

    throw new HttpError('Hành động kiểm duyệt không hợp lệ.', 400, 'invalid_action');
  } catch (error) {
    return jsonError(error);
  }
}
