'use client';

/**
 * Thống kê bán hàng của cửa hàng.
 *
 * Quy ước số liệu được ghi rõ ngay trên giao diện để người bán không hiểu sai doanh thu:
 *  - "Doanh thu đã ghi nhận" chỉ tính đơn ĐÃ GIAO THÀNH CÔNG.
 *  - "Tiền đang chờ giao" là các đơn chưa giao và chưa huỷ.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Loader2, RefreshCw, Trophy, Wallet } from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';
import { fetchSellerStats } from '@/lib/client/sellerApi';

type StatsResponse = Awaited<ReturnType<typeof fetchSellerStats>>;

export default function SellerStatsPage() {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await fetchSellerStats());
    } catch (err: any) {
      setError(err?.message || 'Không tải được số liệu bán hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tính số liệu bán hàng...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-3xl border border-rose-200 p-8 space-y-3 text-center">
        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
        <p className="text-sm text-lacquer-800/80">{error || 'Không có dữ liệu.'}</p>
        <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold">
          <RefreshCw className="w-3.5 h-3.5" />
          Thử lại
        </button>
      </div>
    );
  }

  const maxRevenue = Math.max(1, ...data.daily.map((point) => point.revenue));

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-terracotta-600" />
            Thống kê bán hàng — {data.store.name}
          </h1>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 text-[11px] font-bold text-lacquer-900 hover:bg-dopaper-50"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Tải lại
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-1">
            <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Doanh thu đã ghi nhận
            </span>
            <strong className="block font-serif text-xl text-emerald-900">{formatCurrencyVND(data.stats.revenue)}</strong>
            <span className="block text-[10px] text-emerald-700/80">Chỉ tính đơn đã giao thành công</span>
          </div>
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 space-y-1">
            <span className="text-[11px] font-semibold text-sky-800">Tiền đang chờ giao</span>
            <strong className="block font-serif text-xl text-sky-900">{formatCurrencyVND(data.stats.pendingRevenue)}</strong>
            <span className="block text-[10px] text-sky-700/80">Đơn chưa giao và chưa huỷ</span>
          </div>
          <div className="p-4 rounded-2xl bg-dopaper-100 border border-terracotta-200 space-y-1">
            <span className="text-[11px] font-semibold text-lacquer-800/70">Tổng đơn của cửa hàng</span>
            <strong className="block font-serif text-xl text-lacquer-900">{data.stats.totalOrders}</strong>
            <span className="block text-[10px] text-lacquer-800/60">{data.stats.needsAction} đơn cần xử lý</span>
          </div>
          <div className="p-4 rounded-2xl bg-dopaper-100 border border-terracotta-200 space-y-1">
            <span className="text-[11px] font-semibold text-lacquer-800/70">Sản phẩm đã bán</span>
            <strong className="block font-serif text-xl text-lacquer-900">{data.stats.unitsSold}</strong>
            <span className="block text-[10px] text-lacquer-800/60">Số lượng trong các đơn đã giao</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-3">
          <h2 className="font-serif text-base font-bold text-lacquer-900">Doanh thu 7 ngày gần nhất</h2>
          <div className="flex items-end justify-between gap-2 h-40">
            {data.daily.map((point) => (
              <div key={point.date} className="flex-1 flex flex-col items-center justify-end gap-1">
                <span className="text-[9px] text-lacquer-800/60">
                  {point.revenue > 0 ? `${Math.round(point.revenue / 1000)}k` : ''}
                </span>
                <div
                  className="w-full rounded-t-lg bg-terracotta-400"
                  style={{ height: `${Math.max(4, (point.revenue / maxRevenue) * 120)}px` }}
                  title={`${point.date}: ${point.orders} đơn · ${formatCurrencyVND(point.revenue)}`}
                />
                <span className="text-[9px] text-lacquer-800/60">{point.date.slice(8)}/{point.date.slice(5, 7)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-lacquer-800/60">
            Cột thể hiện tổng tiền đơn con của cửa hàng theo ngày (không tính đơn đã huỷ).
          </p>
        </section>

        <section className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-3">
          <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-gold-600" />
            Sản phẩm bán chạy
          </h2>
          {data.topProducts.length === 0 ? (
            <p className="text-xs text-lacquer-800/60">
              Chưa có sản phẩm nào được ghi nhận bán thành công. Số liệu sẽ xuất hiện sau khi đơn được giao.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-dopaper-100 border border-terracotta-200 flex items-center justify-center text-[10px] font-bold">
                      {index + 1}
                    </span>
                    <span className="truncate text-lacquer-900">{product.name}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <strong className="block text-lacquer-900">{product.quantity} sản phẩm</strong>
                    <span className="block text-[10px] text-lacquer-800/60">{formatCurrencyVND(product.revenue)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-3">
        <h2 className="font-serif text-base font-bold text-lacquer-900">Đơn theo trạng thái</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {data.byStatusDetail.map((item) => (
            <div key={item.status} className="p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <span className="block text-[10px] text-lacquer-800/60">{item.label}</span>
              <strong className="block text-sm text-lacquer-900">{item.count}</strong>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-lacquer-800/60 leading-relaxed">{data.note}</p>
      </section>
    </div>
  );
}
