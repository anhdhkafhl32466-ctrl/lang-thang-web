import { NextRequest, NextResponse } from 'next/server';
import { jsonError } from '@/lib/server/http';
import { requireAdminSession } from '@/lib/server/session';
import { countStoresByStatus, listStores, normalizeStoreStatus, STORE_STATUSES, STORE_STATUS_META } from '@/lib/server/stores';
import { query } from '@/lib/server/db';

export const dynamic = 'force-dynamic';

interface CountRow {
  store_id: string;
  products: number;
  orders: number;
  delivered: number;
  revenue: number | null;
}

/**
 * GET /api/admin/stores?status=pending
 *
 * Chỉ QUẢN TRỊ VIÊN SÀN đọc được (cookie phiên đã ký + email trùng ADMIN_EMAIL). Trả về mỗi cửa hàng
 * kèm số sản phẩm, số đơn con và doanh thu đã giao — đủ để duyệt/tạm khóa có căn cứ.
 */
export async function GET(request: NextRequest) {
  try {
    requireAdminSession(request);

    const statusParam = request.nextUrl.searchParams.get('status');
    const status = statusParam ? normalizeStoreStatus(statusParam) : null;

    const stores = await listStores({ status });
    const byStore = new Map<string, CountRow>();

    try {
      const productRows = await query<CountRow>(
        `SELECT store_id, COUNT(*) AS products, 0 AS orders, 0 AS delivered, 0 AS revenue
         FROM products WHERE store_id IS NOT NULL GROUP BY store_id`
      );
      const orderRows = await query<CountRow>(
        `SELECT store_id, 0 AS products, COUNT(*) AS orders,
                SUM(CASE WHEN lower(status) = 'delivered' THEN 1 ELSE 0 END) AS delivered,
                SUM(CASE WHEN lower(status) = 'delivered' THEN total ELSE 0 END) AS revenue
         FROM seller_orders GROUP BY store_id`
      );

      for (const row of [...productRows, ...orderRows]) {
        const current = byStore.get(row.store_id) || {
          store_id: row.store_id,
          products: 0,
          orders: 0,
          delivered: 0,
          revenue: 0,
        };
        current.products += Number(row.products || 0);
        current.orders += Number(row.orders || 0);
        current.delivered += Number(row.delivered || 0);
        current.revenue = Number(current.revenue || 0) + Number(row.revenue || 0);
        byStore.set(row.store_id, current);
      }
    } catch (countErr) {
      console.warn('[admin/stores] Không thể lấy tổng hợp sản phẩm/đơn hàng, vẫn trả về danh sách cửa hàng:', countErr);
    }

    const enriched = stores.map((store) => {
      const counts = byStore.get(store.id);
      return {
        ...store,
        counts: {
          products: Number(counts?.products || 0),
          orders: Number(counts?.orders || 0),
          delivered: Number(counts?.delivered || 0),
          revenue: Number(counts?.revenue || 0),
        },
      };
    });

    const isVercelEphemeral = process.env.VERCEL === '1' && !process.env.DATABASE_URL?.trim();

    return NextResponse.json({
      ok: true,
      stores: enriched,
      totals: await countStoresByStatus(),
      statuses: Object.entries(STORE_STATUS_META).map(([key, meta]) => ({ key, ...meta })),
      storage: {
        backend: process.env.DATABASE_URL?.trim() ? 'postgres' : 'sqlite',
        isEphemeral: isVercelEphemeral,
        warning: isVercelEphemeral
          ? 'Hệ thống đang chạy SQLite tạm thời trong /tmp trên Vercel do chưa cấu hình DATABASE_URL. Để dữ liệu hồ sơ và cửa hàng lưu vĩnh viễn qua các lần deploy, vui lòng thêm DATABASE_URL (PostgreSQL / Neon / Supabase) vào Vercel Environment Variables.'
          : null,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
