import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/server/notifications';
import { getSession } from '@/lib/server/session';
import { getAdminEmail } from '@/lib/config/commerce';

export const dynamic = 'force-dynamic';

/**
 * Vai trò NGƯỜI XEM thông báo, xác định từ cookie phiên đã ký ở máy chủ:
 * quản trị viên → 'admin', tài khoản người bán → 'seller', còn lại → 'customer'.
 */
function viewerOf(session: { role: string; userEmail: string } | null): 'admin' | 'customer' | 'seller' {
  if (!session) return 'customer';
  if (session.role === 'admin' && session.userEmail === getAdminEmail()) return 'admin';
  if (session.role === 'seller') return 'seller';
  return 'customer';
}

/** GET /api/notifications — danh sách thông báo + số chưa đọc của người đang đăng nhập. */
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    const viewer = viewerOf(session);
    const data = await listNotifications({
      email: session?.userEmail ?? null,
      viewer,
      limit: Number(request.nextUrl.searchParams.get('limit')) || 20,
    });
    return NextResponse.json({ ok: true, ...data, viewer, isAdmin: viewer === 'admin' });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/notifications — đánh dấu đã đọc. Body: { id } hoặc { all: true } */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const session = getSession(request);
    if (!session) throw new HttpError('Bạn cần đăng nhập để xử lý thông báo.', 401, 'unauthenticated');

    const viewer = viewerOf(session);
    const body = await readJson<{ id?: string; all?: boolean }>(request);

    if (body.all) {
      await markAllNotificationsRead(session.userEmail, viewer);
      return NextResponse.json({ ok: true, markedAll: true });
    }

    if (!body.id) throw new HttpError('Thiếu mã thông báo.', 400, 'missing_id');
    const updated = await markNotificationRead(body.id, session.userEmail, viewer);
    if (!updated) throw new HttpError('Không tìm thấy thông báo thuộc tài khoản này.', 404, 'not_found');
    return NextResponse.json({ ok: true, id: body.id });
  } catch (error) {
    return jsonError(error);
  }
}
