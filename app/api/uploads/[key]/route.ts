import { NextResponse } from 'next/server';
import { readUpload } from '@/lib/server/storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/uploads/<key> — phục vụ ảnh đã tải lên.
 *
 * Khoá tệp phải khớp mẫu `<uuid>.<jpg|png|gif|webp>` (kiểm tra trong lib/server/storage): nhờ vậy
 * không thể dùng đường dẫn để dò tệp khác trên máy chủ (`../`, đường dẫn tuyệt đối...).
 *
 * Ảnh là nội dung công khai (nằm trên trang sản phẩm) nên không cần kiểm tra phiên đăng nhập.
 */
export async function GET(_request: Request, { params }: { params: { key: string } }) {
  const file = await readUpload(params.key);
  if (!file) {
    return NextResponse.json(
      { ok: false, error: { code: 'not_found', message: 'Không tìm thấy ảnh hoặc ảnh đã bị xoá.' } },
      { status: 404 }
    );
  }

  return new NextResponse(new Uint8Array(file.data), {
    status: 200,
    headers: {
      'Content-Type': file.contentType,
      // Tên tệp là UUID nên nội dung của một khoá không bao giờ đổi -> cache dài hạn an toàn.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(file.data.length),
    },
  });
}
