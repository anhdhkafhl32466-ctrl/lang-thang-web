import { NextRequest, NextResponse } from 'next/server';
import { HttpError, jsonError } from '@/lib/server/http';
import { blankById } from '@/lib/craftBlanks';
import { listArtisanOptions } from '@/lib/server/bespoke';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bespoke/artisans?blankId=gom — danh sách xưởng có thể nhận phôi này.
 *
 * Xưởng đúng làng nghề của phôi được xếp lên đầu để khách thấy ngay ai làm ra sản phẩm
 * thành thạo nhất, thay vì phải tự đoán.
 */
export async function GET(request: NextRequest) {
  try {
    const blank = blankById(request.nextUrl.searchParams.get('blankId'));
    if (!blank) {
      throw new HttpError('Phôi bạn chọn không tồn tại trong xưởng.', 400, 'unknown_blank', { field: 'blankId' });
    }

    const artisans = await listArtisanOptions(blank);
    return NextResponse.json({
      ok: true,
      blankId: blank.id,
      villageName: blank.villageName,
      artisans,
    });
  } catch (error) {
    return jsonError(error);
  }
}
