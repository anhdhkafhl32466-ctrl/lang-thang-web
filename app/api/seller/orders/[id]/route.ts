import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { getSellerOrderView, updateSellerOrderStatus } from '@/lib/server/sellerOrders';
import { isOrderStatus, ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';

export const dynamic = 'force-dynamic';

/** GET /api/seller/orders/[id] — chi tiết một đơn của cửa hàng mình (nhận cả mã đơn con). */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const order = await getSellerOrderView(store.id, params.id, { withEvents: true });
    if (!order) {
      throw new HttpError('Không tìm thấy đơn hàng thuộc cửa hàng của bạn.', 404, 'seller_order_not_found');
    }
    return NextResponse.json({
      ok: true,
      order,
      statuses: Object.entries(ORDER_STATUS_META).map(([key, meta]) => ({ key, ...meta })),
    });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/seller/orders/[id] — người bán cập nhật trạng thái đơn của cửa hàng mình.
 *
 * Body: { status, note?, carrier?, trackingCode? }
 *
 * Chỉ những bước có trong quy trình mới được chấp nhận (ví dụ: phải "đang giao" mới được "giao thành
 * công"). Người bán có thể nhập mã vận đơn và tên đơn vị vận chuyển khi bàn giao hàng — đây là dữ
 * liệu do người bán xác nhận, KHÔNG phải dữ liệu tracking trực tiếp từ hãng vận chuyển.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const { store, sellerEmail } = await requireSeller(request);
    const body = await readJson<{ status?: string; note?: string; carrier?: string; trackingCode?: string }>(request);

    if (!isOrderStatus(body.status)) {
      throw new HttpError(
        `Trạng thái không hợp lệ. Giá trị cho phép: ${Object.keys(ORDER_STATUS_META).join(', ')}.`,
        400,
        'invalid_status'
      );
    }

    const result = await updateSellerOrderStatus({
      sellerOrderId: params.id,
      storeId: store.id,
      status: body.status as OrderStatus,
      note: body.note ?? null,
      carrier: body.carrier ?? null,
      trackingCode: body.trackingCode ?? null,
      actorType: 'seller',
      actorId: sellerEmail,
      actorSellerEmail: sellerEmail,
      source: `MANUAL_SELLER:${store.slug}`,
    });

    return NextResponse.json({
      ok: true,
      order: result.sellerOrder,
      parentStatus: result.parentStatus,
      notified: {
        customer: result.emails.customer
          ? { status: result.emails.customer.status, error: result.emails.customer.error }
          : null,
        admin: { status: result.emails.admin.status, error: result.emails.admin.error },
        seller: result.emails.seller
          ? { status: result.emails.seller.status, error: result.emails.seller.error }
          : null,
      },
      push: result.push,
    });
  } catch (error) {
    return jsonError(error);
  }
}
