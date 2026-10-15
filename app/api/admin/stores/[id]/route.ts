import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { requireAdminSession } from '@/lib/server/session';
import { reviewStore, STORE_STATUSES, STORE_STATUS_META } from '@/lib/server/stores';
import { createNotification } from '@/lib/server/notifications';
import { sendSellerStoreReviewEmail } from '@/lib/server/email';
import { getStoreById } from '@/lib/server/stores';
import type { StoreStatus } from '@/lib/orders/types';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/stores/[id] — quản trị viên sàn duyệt / từ chối / tạm khóa / kích hoạt lại cửa hàng.
 *
 * Body: { status: 'active' | 'suspended' | 'rejected' | 'pending', note? }
 *
 * Hệ quả nghiệp vụ (được kiểm tra ở tầng dữ liệu, không chỉ ở giao diện):
 *  - Cửa hàng không ở trạng thái 'active': sản phẩm KHÔNG hiển thị trên sàn và KHÔNG đặt được
 *    (xem lib/server/catalog.ts), API người bán cũng chặn đăng bán/xử lý đơn.
 *  - Chủ cửa hàng nhận thông báo trong website + email nếu đã cấu hình dịch vụ email.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const admin = requireAdminSession(request);

    const body = await readJson<{ status?: string; note?: string }>(request);
    if (!STORE_STATUSES.includes(body.status as StoreStatus)) {
      throw new HttpError(
        `Trạng thái cửa hàng không hợp lệ. Giá trị cho phép: ${STORE_STATUSES.join(', ')}.`,
        400,
        'invalid_status'
      );
    }
    const status = body.status as StoreStatus;
    const note = body.note?.trim() || null;

    const before = await getStoreById(params.id);
    if (!before) throw new HttpError('Không tìm thấy cửa hàng.', 404, 'store_not_found');

    const store = await reviewStore({
      storeId: params.id,
      status,
      note,
      actorEmail: admin.userEmail,
    });

    const meta = STORE_STATUS_META[status];

    let notificationCreated = false;
    let email: { status: string; error?: string } | null = null;

    try {
      await createNotification({
        audience: 'seller',
        userEmail: store.ownerEmail,
        title: `Cửa hàng ${store.name}: ${meta.label}`,
        body: note || meta.description,
        link: '/ban-hang/ho-so',
      });
      notificationCreated = true;
    } catch {
      /* thông báo lỗi không làm hỏng việc duyệt */
    }

    try {
      email = await sendSellerStoreReviewEmail({
        ownerEmail: store.ownerEmail,
        storeName: store.name,
        status,
        note,
      });
    } catch (error: any) {
      email = { status: 'failed', error: error?.message || 'Không gửi được email thông báo.' };
    }

    return NextResponse.json({
      ok: true,
      store,
      previousStatus: before.status,
      statusLabel: meta.label,
      notificationCreated,
      email,
      audit:
        `Quản trị viên ${admin.userEmail} đổi trạng thái cửa hàng từ "${STORE_STATUS_META[before.status].label}" ` +
        `sang "${meta.label}" lúc ${new Date().toLocaleString('vi-VN')}.`,
    });
  } catch (error) {
    return jsonError(error);
  }
}
