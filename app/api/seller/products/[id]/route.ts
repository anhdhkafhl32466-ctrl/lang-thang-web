import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { archiveStoreProduct, getProductForOwner, updateStoreProduct } from '@/lib/server/catalog';
import { parseProductInput } from '@/lib/server/productInput';

export const dynamic = 'force-dynamic';

/**
 * Xác nhận sản phẩm thuộc CỬA HÀNG của người bán đang đăng nhập.
 * Kể cả khi đoán được mã sản phẩm của cửa hàng khác, người bán vẫn bị chặn ở đây (và một lần nữa
 * bằng điều kiện `store_id = ?` trong câu lệnh UPDATE/DELETE).
 */
async function requireOwnedProduct(request: NextRequest, productId: string, storeId: string) {
  const product = await getProductForOwner(productId);
  if (!product) {
    throw new HttpError('Không tìm thấy sản phẩm.', 404, 'product_not_found');
  }
  if (product.storeId !== storeId) {
    throw new HttpError('Sản phẩm này thuộc cửa hàng khác nên bạn không thể xem hay sửa.', 403, 'not_your_product');
  }
  return product;
}

/** GET /api/seller/products/[id] — chi tiết một sản phẩm của cửa hàng mình. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const product = await requireOwnedProduct(request, params.id, store.id);
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return jsonError(error);
  }
}

/** PATCH /api/seller/products/[id] — sửa sản phẩm của cửa hàng mình. */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const { store } = await requireSeller(request);
    await requireOwnedProduct(request, params.id, store.id);

    const body = await readJson<any>(request);
    const patch = parseProductInput(body, { partial: true });

    const updated = await updateStoreProduct(store.id, params.id, patch);
    if (!updated) {
      throw new HttpError('Không tìm thấy sản phẩm thuộc cửa hàng của bạn.', 404, 'product_not_found');
    }

    const product = await getProductForOwner(params.id);
    return NextResponse.json({ ok: true, product });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * DELETE /api/seller/products/[id] — NGỪNG BÁN sản phẩm (ẩn khỏi sàn).
 *
 * Vì sao không xoá hẳn: đơn hàng cũ phải giữ nguyên tên, giá và ảnh của sản phẩm đã bán. Xoá bản ghi
 * sẽ làm hỏng lịch sử đơn hàng, nên thao tác này chỉ đặt `active = 0`.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    assertSameOrigin(request);
    const { store } = await requireSeller(request);
    await requireOwnedProduct(request, params.id, store.id);

    const archived = await archiveStoreProduct(store.id, params.id);
    if (!archived) {
      throw new HttpError('Không tìm thấy sản phẩm thuộc cửa hàng của bạn.', 404, 'product_not_found');
    }
    return NextResponse.json({ ok: true, archived: true, productId: params.id });
  } catch (error) {
    return jsonError(error);
  }
}
