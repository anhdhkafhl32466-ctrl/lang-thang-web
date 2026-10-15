import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, jsonError, readJson } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { createStoreProduct, listStoreProducts } from '@/lib/server/catalog';
import { parseProductInput } from '@/lib/server/productInput';

export const dynamic = 'force-dynamic';

/** GET /api/seller/products — toàn bộ sản phẩm của CỬA HÀNG ĐANG ĐĂNG NHẬP (kể cả đang ẩn). */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    const products = await listStoreProducts(store.id);
    return NextResponse.json({
      ok: true,
      storeId: store.id,
      storeStatus: store.status,
      products,
      total: products.length,
    });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/seller/products — đăng sản phẩm mới cho cửa hàng của mình.
 *
 * Bắt buộc cửa hàng ĐANG HOẠT ĐỘNG (chờ duyệt hoặc bị tạm khóa thì không được đăng bán công khai).
 * Sản phẩm mới được gắn vào cửa hàng lấy từ phiên đăng nhập, không phải từ dữ liệu client gửi.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { store } = await requireSeller(request);
    const body = await readJson<any>(request);

    const input = parseProductInput(body);
    const product = await createStoreProduct(store.id, {
      name: input.name as string,
      price: input.price as number,
      stock: input.stock as number,
      category: input.category as string,
      image: input.image as string,
      villageId: input.villageId as string,
      villageName: input.villageName as string,
      description: input.description ?? null,
      artisanName: input.artisanName ?? store.contactName ?? null,
      material: input.material ?? null,
      dimensions: input.dimensions ?? null,
      weightG: input.weightG ?? null,
      preparationDays: input.preparationDays ?? null,
      warehouseId: input.warehouseId ?? null,
      active: input.active !== false,
    });

    return NextResponse.json({ ok: true, product, storeId: store.id }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
