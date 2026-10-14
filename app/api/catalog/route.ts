import { NextResponse } from 'next/server';
import { listProducts } from '@/lib/server/catalog';
import { jsonError } from '@/lib/server/http';
import { describeDbBackend } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

/** GET /api/catalog — danh mục sản phẩm kèm giá và tồn kho thật từ cơ sở dữ liệu. */
export async function GET() {
  try {
    const products = await listProducts();
    return NextResponse.json({
      ok: true,
      products,
      database: describeDbBackend().backend,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    return jsonError(error);
  }
}
