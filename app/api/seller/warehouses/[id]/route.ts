import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { countProductsUsingWarehouse, deleteWarehouse, getWarehouseById, updateWarehouse } from '@/lib/server/warehouses';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { id: string };
}

/** PATCH /api/seller/warehouses/[id] — cập nhật thông tin kho hàng. */
export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const { store } = await requireSeller(request, { requireActive: false });

    const body = await readJson<{
      name?: string;
      addressText?: string;
      addressNote?: string | null;
      lat?: number | null;
      lng?: number | null;
      contactName?: string | null;
      phone?: string | null;
      isDefault?: boolean;
      active?: boolean;
    }>(request);

    let lat = typeof body.lat === 'number' && Number.isFinite(body.lat) ? body.lat : undefined;
    let lng = typeof body.lng === 'number' && Number.isFinite(body.lng) ? body.lng : undefined;

    const warehouse = await updateWarehouse(params.id, store.id, {
      name: body.name,
      addressText: body.addressText,
      addressNote: body.addressNote,
      lat,
      lng,
      contactName: body.contactName,
      phone: body.phone,
      isDefault: body.isDefault,
      active: body.active,
    });

    return NextResponse.json({ ok: true, warehouse });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/seller/warehouses/[id] — xóa kho hàng (kiểm tra ràng buộc sản phẩm). */
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    assertSameOrigin(request);
    const { store } = await requireSeller(request, { requireActive: false });

    const result = await deleteWarehouse(params.id, store.id);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
