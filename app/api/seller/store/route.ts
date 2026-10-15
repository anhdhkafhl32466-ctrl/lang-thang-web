import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizePhone, readJson, requireString } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { updateStoreProfile } from '@/lib/server/stores';
import { isAcceptableImageUrl, describeStorage } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

/** GET /api/seller/store — hồ sơ cửa hàng của người bán đang đăng nhập. */
export async function GET(request: NextRequest) {
  try {
    const { store } = await requireSeller(request, { requireActive: false });
    return NextResponse.json({ ok: true, store, storage: describeStorage() });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * PATCH /api/seller/store — người bán cập nhật hồ sơ cửa hàng mình.
 *
 * KHÔNG cho phép đổi trạng thái, chủ sở hữu hay thông tin duyệt qua đường này: quyền quyết định
 * trạng thái thuộc về quản trị viên sàn (xem /api/admin/stores/[id]).
 */
export async function PATCH(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const { store } = await requireSeller(request, { requireActive: false });
    const body = await readJson<any>(request);

    const patch: Parameters<typeof updateStoreProfile>[1] = {};

    if (body.name !== undefined) {
      patch.name = requireString(body.name, 'tên cửa hàng', 120);
    }
    if (body.description !== undefined) {
      patch.description = body.description ? String(body.description).slice(0, 2000) : null;
    }
    if (body.contactName !== undefined) {
      patch.contactName = body.contactName ? String(body.contactName).slice(0, 120) : null;
    }
    if (body.phone !== undefined) {
      if (body.phone === null || String(body.phone).trim() === '') {
        patch.phone = null;
      } else {
        const phone = normalizePhone(String(body.phone));
        if (!phone) throw new HttpError('Số điện thoại không hợp lệ.', 400, 'invalid_phone');
        patch.phone = phone;
      }
    }
    if (body.addressText !== undefined) {
      patch.addressText = body.addressText ? String(body.addressText).slice(0, 400) : null;
    }
    if (body.addressNote !== undefined) {
      patch.addressNote = body.addressNote ? String(body.addressNote).slice(0, 400) : null;
    }
    if (body.logoUrl !== undefined) {
      const logo = body.logoUrl ? String(body.logoUrl).trim() : '';
      if (logo && !isAcceptableImageUrl(logo)) {
        throw new HttpError(
          'Logo phải là ảnh đã tải lên hệ thống hoặc một đường dẫn http(s) hợp lệ.',
          400,
          'invalid_logo'
        );
      }
      patch.logoUrl = logo || null;
    }

    // Toạ độ xuất hàng: bắt buộc đi theo cặp để tuyến đường không bị tính sai.
    const hasLat = body.lat !== undefined && body.lat !== null;
    const hasLng = body.lng !== undefined && body.lng !== null;
    if (hasLat || hasLng) {
      if (!hasLat || !hasLng) {
        throw new HttpError(
          'Cần cung cấp đồng thời cả vĩ độ và kinh độ của địa chỉ xuất hàng.',
          400,
          'incomplete_coordinates'
        );
      }
      const lat = Number(body.lat);
      const lng = Number(body.lng);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
        throw new HttpError('Toạ độ xuất hàng không hợp lệ.', 400, 'invalid_coordinates');
      }
      patch.lat = lat;
      patch.lng = lng;
    }

    if (body.categories !== undefined) {
      const raw = Array.isArray(body.categories) ? body.categories : String(body.categories).split(',');
      patch.categories = raw
        .map((item: unknown) => String(item).trim())
        .filter(Boolean)
        .slice(0, 10);
    }

    const updated = await updateStoreProfile(store.id, patch);
    return NextResponse.json({
      ok: true,
      store: updated,
      note: 'Thay đổi hồ sơ không ảnh hưởng tới các đơn đã đặt: mỗi đơn con đã lưu bản chụp tên và địa chỉ cửa hàng tại thời điểm đặt hàng.',
    });
  } catch (error) {
    return jsonError(error);
  }
}
