import { NextRequest, NextResponse } from 'next/server';
import { getStoreById, getStoreBySlug } from '@/lib/server/stores';
import { listProductsByStore } from '@/lib/server/catalog';
import { getDefaultWarehouse } from '@/lib/server/warehouses';
import { jsonError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: { slug: string };
}

/**
 * GET /api/stores/[slug] — Lấy thông tin chi tiết một cửa hàng + danh mục sản phẩm của cửa hàng đó.
 */
export async function GET(_req: NextRequest, { params }: RouteContext) {
  try {
    const slug = params.slug?.trim();
    if (!slug) {
      return NextResponse.json({ ok: false, message: 'Thiếu định danh cửa hàng.' }, { status: 400 });
    }

    let store = await getStoreBySlug(slug);
    if (!store) {
      store = await getStoreById(slug);
    }

    if (!store) {
      return NextResponse.json({ ok: false, message: 'Không tìm thấy cửa hàng này.' }, { status: 404 });
    }

    const [products, defaultWh] = await Promise.all([
      listProductsByStore(store.id),
      getDefaultWarehouse(store.id),
    ]);

    return NextResponse.json({
      ok: true,
      store: {
        id: store.id,
        name: store.name,
        slug: store.slug,
        description: store.description,
        contactName: store.contactName,
        phone: store.phone,
        addressText: store.addressText,
        logoUrl: store.logoUrl,
        bannerUrl: store.bannerUrl,
        shippingPolicy: store.shippingPolicy,
        prepTimeDays: store.prepTimeDays,
        categories: store.categories,
        status: store.status,
        createdAt: store.createdAt,
      },
      warehouse: defaultWh
        ? {
            id: defaultWh.id,
            name: defaultWh.name,
            addressText: defaultWh.addressText,
          }
        : null,
      products,
      totalProducts: products.length,
    });
  } catch (error) {
    return jsonError(error);
  }
}
