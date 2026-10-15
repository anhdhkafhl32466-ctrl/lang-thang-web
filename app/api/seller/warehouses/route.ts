import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson, requireString } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import {
  createWarehouse,
  ensureDefaultWarehouseForStore,
  listWarehousesByStore,
  type CreateWarehouseInput,
} from '@/lib/server/warehouses';

export const dynamic = 'force-dynamic';

/** GET /api/seller/warehouses — lấy danh sách các kho hàng của cửa hàng đang đăng nhập. */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    // Đảm bảo luôn có ít nhất 1 kho mặc định
    await ensureDefaultWarehouseForStore(store);
    const warehouses = await listWarehousesByStore(store.id);
    return NextResponse.json({ ok: true, warehouses });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/seller/warehouses — tạo kho hàng / điểm xuất hàng mới. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { store } = await requireSeller(request, { requireActive: false });

    const body = await readJson<{
      name?: string;
      addressText?: string;
      addressNote?: string;
      lat?: number;
      lng?: number;
      contactName?: string;
      phone?: string;
      isDefault?: boolean;
    }>(request);

    const name = requireString(body.name, 'tên kho hàng', 120);
    const addressText = requireString(body.addressText, 'địa chỉ kho hàng', 400);

    let lat = typeof body.lat === 'number' && Number.isFinite(body.lat) ? body.lat : null;
    let lng = typeof body.lng === 'number' && Number.isFinite(body.lng) ? body.lng : null;
    if ((lat === null) !== (lng === null)) {
      lat = null;
      lng = null;
    }

    const warehouse = await createWarehouse({
      storeId: store.id,
      name,
      addressText,
      addressNote: body.addressNote?.trim() || null,
      lat,
      lng,
      contactName: body.contactName?.trim() || null,
      phone: body.phone?.trim() || null,
      isDefault: Boolean(body.isDefault),
    });

    return NextResponse.json({ ok: true, warehouse }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
