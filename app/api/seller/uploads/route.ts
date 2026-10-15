import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError } from '@/lib/server/http';
import { requireSeller } from '@/lib/server/sellerAuth';
import { describeStorage, MAX_UPLOAD_BYTES, saveImageUpload } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

/**
 * POST /api/seller/uploads — người bán tải ảnh sản phẩm / logo lên hệ thống lưu trữ.
 *
 * Bảo mật:
 *  - Chỉ tài khoản người bán ĐANG HOẠT ĐỘNG mới được tải ảnh (tránh lạm dụng dung lượng máy chủ).
 *  - Định dạng được xác định bằng CHỮ KÝ NHỊ PHÂN của tệp, không tin `Content-Type` hay tên tệp.
 *  - Tên tệp do máy chủ sinh (UUID) nên không thể ghi đè hay ghi ra ngoài thư mục lưu trữ.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    await requireSeller(request);

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');

    if (!file || typeof file === 'string') {
      throw new HttpError('Thiếu tệp ảnh cần tải lên (trường "file").', 400, 'missing_file');
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new HttpError(
        `Ảnh vượt quá ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`,
        413,
        'file_too_large'
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const saved = await saveImageUpload({ data: buffer });

    return NextResponse.json(
      {
        ok: true,
        url: saved.url,
        key: saved.key,
        bytes: saved.bytes,
        contentType: saved.contentType,
        driver: saved.driver,
        note: 'Đường dẫn ảnh đã sẵn sàng để gán vào sản phẩm hoặc logo cửa hàng.',
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof HttpError) return jsonError(error);
    // Lỗi từ tầng lưu trữ (sai định dạng, ổ đĩa...) — trả về thông báo rõ ràng cho người bán.
    return NextResponse.json(
      { ok: false, error: { code: 'upload_failed', message: error?.message || 'Không lưu được ảnh tải lên.' } },
      { status: 400 }
    );
  }
}

/** GET /api/seller/uploads — mô tả cấu hình lưu trữ hiện tại (để giao diện báo rõ cho người bán). */
export async function GET(request: NextRequest) {
  try {
    await requireSeller(request, { requireActive: false });
    return NextResponse.json({ ok: true, storage: describeStorage(), maxBytes: MAX_UPLOAD_BYTES });
  } catch (error) {
    return jsonError(error);
  }
}
