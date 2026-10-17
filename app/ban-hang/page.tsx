'use client';

/**
 * Tổng quan cửa hàng — trang chủ của Trung tâm người bán.
 * Số liệu lấy từ /api/seller/overview: chỉ tính trên ĐƠN CON của cửa hàng đang đăng nhập.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowRight, BadgeCheck, CheckCircle2, ClipboardList, Loader2, Package, RefreshCw,
  Store as StoreIcon, Truck, Wallet,
} from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';
import { fetchSellerOverview, type StoreSummary } from '@/lib/client/sellerApi';

export default function SellerOverviewPage() {
  const [summary, setSummary] = useState<StoreSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSummary(await fetchSellerOverview());
    } catch (err: any) {
      setError(err?.message || 'Không tải được số liệu cửa hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải số liệu cửa hàng...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="paper-panel rounded-3xl border border-rose-200 p-8 space-y-3 text-center">
        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
        <p className="text-sm text-lacquer-800/80">{error || 'Không có dữ liệu.'}</p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Thử lại
        </button>
      </div>
    );
  }

  const stats = summary.orders;
  const cards = [
    {
      label: 'Đơn cần xử lý',
      value: String(stats.needsAction),
      icon: ClipboardList,
      hint: 'Đơn mới và đơn đang chuẩn bị hàng',
      href: '/ban-hang/don-hang?filter=needs_action',
      tone: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Tổng đơn của cửa hàng',
      value: String(stats.totalOrders),
      icon: Package,
      hint: 'Toàn bộ đơn con thuộc cửa hàng bạn',
      href: '/ban-hang/don-hang',
      tone: 'bg-donpaper-100 text-lacquer-900 border-terracotta-200',
    },
    {
      label: 'Doanh thu đã ghi nhận',
      value: formatCurrencyVND(stats.revenue),
      icon: Wallet,
      hint: `Chỉ tính đơn đã giao thành công · ${stats.unitsSold} sản phẩm`,
      href: '/ban-hang/thong-ke',
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'Tiền đang chờ giao',
      value: formatCurrencyVND(stats.pendingRevenue),
      icon: Truck,
      hint: 'Đơn chưa giao và chưa huỷ',
      href: '/ban-hang/don-hang?filter=shipping',
      tone: 'bg-sky-50 text-sky-700 border-sky-200',
    },
  ];

  const todo = summary.checklist.filter((item) => !item.done);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-2 hover:shadow-md transition-shadow"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.tone}`}>
                <Icon className="w-4 h-4" />
              </div>
              <span className="block text-[11px] font-semibold text-lacquer-800/60">{card.label}</span>
              <strong className="block font-serif text-xl text-lacquer-900">{card.value}</strong>
              <span className="block text-[10px] text-lacquer-800/60 leading-relaxed">{card.hint}</span>
            </Link>
          );
        })}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-base font-bold text-lacquer-900">Đơn mới nhất của cửa hàng</h2>
            <Link href="/ban-hang/don-hang" className="text-[11px] font-bold text-terracotta-600 inline-flex items-center gap-1">
              Xem tất cả
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {summary.recentOrders.length === 0 ? (
            <p className="text-xs text-lacquer-800/60">
              Cửa hàng chưa có đơn nào. Đơn sẽ xuất hiện ngay khi khách đặt sản phẩm của bạn.
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.recentOrders.map((order) => {
                const meta = ORDER_STATUS_META[order.status as OrderStatus];
                return (
                  <li key={order.id}>
                    <Link
                      href={`/ban-hang/don-hang/${order.id}`}
                      className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-terracotta-100 hover:bg-dopaper-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-lacquer-900 font-mono">{order.code}</span>
                        <span className="block text-[11px] text-lacquer-800/70 truncate">
                          {order.customerName} · {order.items?.length || 0} mặt hàng
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="block text-xs font-bold text-terracotta-600">{formatCurrencyVND(order.total)}</span>
                        <span className="block text-[10px] text-lacquer-800/70">{meta?.label || order.status}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-3">
          <h2 className="font-serif text-base font-bold text-lacquer-900">Hoàn thiện hồ sơ cửa hàng</h2>
          <p className="text-[11px] text-lacquer-800/60 leading-relaxed">
            Các mục dưới đây giúp đơn hàng chạy trơn tru và khách tin tưởng cửa hàng hơn. Việc hoàn thiện
            hồ sơ không thay thế bước duyệt của ban quản trị sàn.
          </p>

          {todo.length === 0 ? (
            <p className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
              <BadgeCheck className="w-4 h-4" />
              Hồ sơ cửa hàng đã đầy đủ.
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.checklist.map((item) => (
                <li key={item.key} className="flex items-start gap-2 text-xs">
                  {item.done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className={`block font-semibold ${item.done ? 'text-lacquer-800/60 line-through' : 'text-lacquer-900'}`}>
                      {item.label}
                    </span>
                    {!item.done && <span className="block text-[10px] text-lacquer-800/60">{item.hint}</span>}
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            <Link
              href="/ban-hang/ho-so"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-900"
            >
              <StoreIcon className="w-3.5 h-3.5" />
              Cập nhật hồ sơ
            </Link>
            <Link
              href="/ban-hang/san-pham/moi"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold"
            >
              <Package className="w-3.5 h-3.5" />
              Đăng sản phẩm
            </Link>
          </div>
        </section>
      </div>

      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-2">
        <h2 className="font-serif text-base font-bold text-lacquer-900">Cách đơn hàng đến với cửa hàng bạn</h2>
        <ol className="text-[11px] text-lacquer-800/75 leading-relaxed space-y-1 list-decimal list-inside">
          <li>Khách đặt hàng trên sàn. Nếu giỏ có sản phẩm của nhiều cửa hàng, hệ thống tách thành nhiều đơn con.</li>
          <li>Cửa hàng bạn chỉ nhận ĐƠN CON của mình, kèm tên, điện thoại và địa chỉ giao của khách.</li>
          <li>Bạn xác nhận tiếp nhận, chuẩn bị hàng rồi bàn giao vận chuyển; mỗi bước cập nhật trạng thái đơn của bạn.</li>
          <li>Khách theo dõi tiến trình từng cửa hàng; trạng thái đơn tổng do hệ thống tổng hợp từ các đơn con.</li>
        </ol>
      </section>
    </div>
  );
}
