/**
 * Số liệu tổng hợp cho TRUNG TÂM NGƯỜI BÁN.
 *
 * Mọi truy vấn ở đây đều bắt buộc tham số `storeId` do tầng API tra từ phiên đăng nhập, nên người bán
 * chỉ thấy số liệu của cửa hàng mình. Không có hàm nào nhận `storeId` từ thân yêu cầu của client.
 */

import { countStoreProducts } from './catalog';
import { countUnreadForSeller } from './notifications';
import { getSellerStats, listSellerOrders, type SellerOrderView, type SellerStats } from './sellerOrders';
import { getStoreById, STORE_STATUS_META } from './stores';
import type { Store } from '@/lib/orders/types';

export interface StoreProfileChecklist {
  /** Hạng mục còn thiếu để cửa hàng vận hành tốt — hiển thị cho người bán tự hoàn thiện. */
  key: string;
  label: string;
  done: boolean;
  hint: string;
}

export interface StoreSummary {
  store: Store | null;
  statusLabel: string | null;
  products: { total: number; active: number; hidden: number };
  orders: SellerStats;
  unreadNotifications: number;
  recentOrders: SellerOrderView[];
  checklist: StoreProfileChecklist[];
  /** Cửa hàng đã đủ điều kiện bán hàng chưa (đang hoạt động). */
  canSell: boolean;
}

/** Danh sách việc cần làm để một cửa hàng mới vận hành được ngay. */
export function buildChecklist(store: Store | null, counts: { products: number; active: number }): StoreProfileChecklist[] {
  return [
    {
      key: 'logo',
      label: 'Có logo/ảnh đại diện cửa hàng',
      done: Boolean(store?.logoUrl),
      hint: 'Logo giúp khách nhận ra cửa hàng bạn trong đơn hàng nhiều cửa hàng.',
    },
    {
      key: 'description',
      label: 'Có mô tả cửa hàng',
      done: Boolean(store?.description && store.description.length >= 30),
      hint: 'Nêu rõ nghề truyền thống, xưởng sản xuất và điểm mạnh của sản phẩm.',
    },
    {
      key: 'address',
      label: 'Có địa chỉ xuất hàng kèm toạ độ',
      done: Boolean(store?.addressText && store.lat != null && store.lng != null),
      hint: 'Toạ độ giúp tính phí vận chuyển theo tuyến đường thật từ cửa hàng tới khách.',
    },
    {
      key: 'phone',
      label: 'Có số điện thoại liên hệ',
      done: Boolean(store?.phone),
      hint: 'Khách và đơn vị vận chuyển cần gọi cho người bán khi giao hàng.',
    },
    {
      key: 'products',
      label: 'Đã đăng ít nhất 1 sản phẩm đang bán',
      done: counts.active >= 1,
      hint: 'Sản phẩm chỉ hiển thị trên sàn khi cửa hàng đang hoạt động và sản phẩm ở trạng thái đang bán.',
    },
  ];
}

export async function getStoreStatusSummary(storeId: string): Promise<StoreSummary> {
  const store = await getStoreById(storeId);
  const products = await countStoreProducts(storeId);
  const orders = await getSellerStats(storeId);
  const recentOrders = await listSellerOrders({ storeId, limit: 5 });

  let unreadNotifications = 0;
  if (store?.ownerEmail) {
    unreadNotifications = await countUnreadForSeller(store.ownerEmail);
  }

  return {
    store,
    statusLabel: store ? STORE_STATUS_META[store.status].label : null,
    products: {
      total: products.total,
      active: products.active,
      hidden: Math.max(0, products.total - products.active),
    },
    orders,
    unreadNotifications,
    recentOrders,
    checklist: buildChecklist(store, { products: products.total, active: products.active }),
    canSell: store?.status === 'active',
  };
}
