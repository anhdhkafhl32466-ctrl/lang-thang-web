import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { getSession } from '@/lib/server/session';
import { getAdminEmail } from '@/lib/config/commerce';
import {
  decideBespoke,
  getBespokeById,
  isBespokeStatus,
  quoteBespoke,
  updateBespokeProgress,
} from '@/lib/server/bespoke';
import { requireSeller } from '@/lib/server/sellerAuth';

export const dynamic = 'force-dynamic';

const MAX_PRICE = 1_000_000_000;
const MAX_DAYS = 730;

interface ActionBody {
  action?: string;
  priceVnd?: number;
  days?: number;
  note?: string;
  status?: string;
}

/**
 * GET /api/bespoke/[id] — xem chi tiết một yêu cầu đặt làm.
 *
 * Chỉ ba nhóm được xem: chính khách đã gửi, cửa hàng nhận yêu cầu, và quản trị viên sàn.
 */
export async function GET(request: NextRequest, context: { params: { id: string } }) {
  try {
    const session = getSession(request);
    const bespoke = await getBespokeById(context.params.id);
    if (!bespoke) return jsonError(new HttpError('Không tìm thấy yêu cầu đặt làm này.', 404, 'bespoke_not_found'));

    const email = session?.userEmail?.trim().toLowerCase() || null;
    const isOwner = Boolean(email) && bespoke.customerEmail?.toLowerCase() === email;
    const isAdmin = email === getAdminEmail().toLowerCase() || session?.role === 'admin';

    let isStoreStaff = false;
    if (email && !isOwner && !isAdmin) {
      try {
        const seller = await requireSeller(request, { requireActive: false });
        isStoreStaff = seller.store.id === bespoke.storeId;
      } catch {
        isStoreStaff = false;
      }
    }

    if (!isOwner && !isAdmin && !isStoreStaff) {
      throw new HttpError('Bạn không có quyền xem yêu cầu đặt làm này.', 403, 'forbidden');
    }

    return NextResponse.json({ ok: true, request: bespoke });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/bespoke/[id] — các bước chuyển trạng thái của vòng đời đặt làm độc bản.
 *
 *  - Nghệ nhân: `quote` (gửi giá) và `advance` (chuyển sang đang chế tác / hoàn thành / từ chối).
 *  - Khách hàng: `accept` hoặc `decline` báo giá.
 *
 * Quyền của mỗi hành động được xác định ở máy chủ: `quote`/`advance` bắt buộc phiên NGƯỜI BÁN có cửa hàng
 * sở hữu yêu cầu; `accept`/`decline` bắt buộc đúng email khách đã gửi yêu cầu.
 */
export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const body = await readJson<ActionBody>(request);
    const action = String(body.action || '').trim();

    if (action === 'quote') {
      const { store } = await requireSeller(request);
      const priceVnd = Number(body.priceVnd);
      if (!Number.isFinite(priceVnd) || priceVnd < 1000 || priceVnd > MAX_PRICE) {
        throw new HttpError('Giá báo phải là số tiền hợp lệ (từ 1.000đ).', 400, 'invalid_price', { field: 'priceVnd' });
      }
      const days = Number(body.days);
      if (!Number.isFinite(days) || days < 1 || days > MAX_DAYS) {
        throw new HttpError('Số ngày chế tác phải từ 1 đến 730 ngày.', 400, 'invalid_days', { field: 'days' });
      }
      const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null;
      const updated = await quoteBespoke({ id: context.params.id, storeId: store.id, priceVnd: Math.round(priceVnd), days: Math.round(days), note });
      return NextResponse.json({ ok: true, request: updated });
    }

    if (action === 'advance') {
      const { store } = await requireSeller(request);
      if (!isBespokeStatus(body.status)) {
        throw new HttpError('Trạng thái không hợp lệ.', 400, 'invalid_status', { field: 'status' });
      }
      const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null;
      const updated = await updateBespokeProgress({ id: context.params.id, storeId: store.id, status: body.status, note });
      return NextResponse.json({ ok: true, request: updated });
    }

    if (action === 'accept' || action === 'decline') {
      const session = getSession(request);
      if (!session?.userEmail) {
        throw new HttpError('Bạn cần đăng nhập để xác nhận báo giá.', 401, 'unauthenticated');
      }
      const updated = await decideBespoke({ id: context.params.id, customerEmail: session.userEmail, accept: action === 'accept' });
      return NextResponse.json({ ok: true, request: updated });
    }

    throw new HttpError('Hành động không được hỗ trợ.', 400, 'unknown_action', { field: 'action' });
  } catch (error) {
    return jsonError(error);
  }
}
