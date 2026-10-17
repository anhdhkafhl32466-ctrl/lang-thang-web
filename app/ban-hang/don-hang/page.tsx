'use client';

/**
 * Quản lý đơn hàng của cửa hàng.
 *
 * Mỗi dòng là một ĐƠN CON: chỉ gồm sản phẩm của cửa hàng đang đăng nhập. Bộ lọc dùng chung với menu
 * bên trái (Đơn cần xử lý / Đang chuẩn bị hàng / Đang vận chuyển / Đã hoàn thành / Huỷ - thất bại).
 */

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, CheckCircle2, ClipboardList, Loader2, RefreshCw, Search } from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';
import {
  fetchSellerOrders,
  updateSellerOrderStatus,
  type SellerOrderListResponse,
} from '@/lib/client/sellerApi';
import type { SellerOrderView } from '@/lib/orders/types';

function statusTone(status: OrderStatus): string {
  const tone = ORDER_STATUS_META[status]?.tone;
  if (tone === 'success') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (tone === 'danger') return 'bg-rose-50 text-rose-700 border-rose-200';
  if (tone === 'progress') return 'bg-sky-50 text-sky-700 border-sky-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

function StatusChip({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-bold ${statusTone(status)}`}>
      {ORDER_STATUS_META[status]?.label || status}
    </span>
  );
}

function OrderRow({ order, onChanged }: { order: SellerOrderView; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickConfirm = async () => {
    try {
      setBusy(true);
      setError(null);
      await updateSellerOrderStatus(order.id, {
        status: 'confirmed',
        note: 'Người bán đã xác nhận tiếp nhận đơn.',
      });
      onChanged();
    } catch (err: any) {
      setError(err?.message || 'Không cập nhật được trạng thái đơn.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="paper-panel rounded-3xl border border-terracotta-200 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/ban-hang/don-hang/${order.id}`}
              className="font-mono text-xs font-bold text-lacquer-900 hover:text-terracotta-600"
            >
              {order.code}
            </Link>
            <StatusChip status={order.status} />
            <span className="text-[10px] text-lacquer-800/50">Đơn tổng {order.parentCode}</span>
          </div>
          <span className="block text-[11px] text-lacquer-800/75">
            {order.customerName} · {order.customerPhone}
          </span>
          <span className="block text-[11px] text-lacquer-800/60 line-clamp-1">{order.addressText}</span>
        </div>
        <div className="text-right shrink-0 space-y-1">
          <strong className="block text-sm font-bold text-terracotta-600">{formatCurrencyVND(order.total)}</strong>
          <span className="block text-[10px] text-lacquer-800/60">
            {order.items?.length || 0} mặt hàng · ship {formatCurrencyVND(order.shippingFee)}
          </span>
          <span className="block text-[10px] text-lacquer-800/50">
            {new Date(order.createdAt).toLocaleString('vi-VN')}
          </span>
        </div>
      </div>

      <ul className="text-[11px] text-lacquer-800/80 space-y-0.5">
        {(order.items || []).map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-2">
            <span className="truncate">
              {item.quantity} × {item.name}
            </span>
            <span className="shrink-0">{formatCurrencyVND(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      {error && <p className="text-[11px] text-rose-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/ban-hang/don-hang/${order.id}`}
          className="px-3.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-[11px] font-bold"
        >
          Mở & xử lý đơn
        </Link>
        {order.status === 'pending_confirmation' && (
          <button
            onClick={quickConfirm}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-700 text-[11px] font-bold hover:bg-emerald-50 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            Xác nhận tiếp nhận
          </button>
        )}
        {order.trackingCode && (
          <span className="text-[10px] text-lacquer-800/60">
            Vận đơn: <strong className="font-mono">{order.trackingCode}</strong>
            {order.carrier ? ` · ${order.carrier}` : ''}
          </span>
        )}
      </div>
    </li>
  );
}

function SellerOrdersContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';

  const [data, setData] = useState<SellerOrderListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(await fetchSellerOrders(filter, keyword.trim() || undefined));
    } catch (err: any) {
      setError(err?.message || 'Không tải được danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [filter, keyword]);

  useEffect(() => {
    load();
  }, [load]);

  const activeFilter = data?.filters.find((item) => item.key === filter);

  return (
    <div className="space-y-5">
      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-terracotta-600" />
              Quản lý đơn hàng
            </h1>
            {activeFilter && <p className="text-[11px] text-lacquer-800/60 mt-0.5">{activeFilter.hint}</p>}
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 text-[11px] font-bold text-lacquer-900 hover:bg-dopaper-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(data?.filters || []).map((item) => (
            <Link
              key={item.key}
              href={`/ban-hang/don-hang?filter=${item.key}`}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-colors ${
                filter === item.key
                  ? 'bg-terracotta-50 border-terracotta-300 text-terracotta-700'
                  : 'paper-panel border-terracotta-200 text-lacquer-900 hover:bg-dopaper-50'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
            <input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Tìm theo mã đơn, mã đơn tổng, tên hoặc số điện thoại khách"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-lacquer-900 text-white text-xs font-bold">
            Tìm
          </button>
        </form>

        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div className="p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <span className="block text-lacquer-800/60">Tổng đơn</span>
              <strong className="text-lacquer-900">{data.stats.totalOrders}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <span className="block text-lacquer-800/60">Cần xử lý</span>
              <strong className="text-amber-700">{data.stats.needsAction}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <span className="block text-lacquer-800/60">Đã giao</span>
              <strong className="text-emerald-700">{data.stats.byStatus.delivered || 0}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <span className="block text-lacquer-800/60">Doanh thu ghi nhận</span>
              <strong className="text-terracotta-600">{formatCurrencyVND(data.stats.revenue)}</strong>
            </div>
          </div>
        )}
      </section>

      {error && (
        <p className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </p>
      )}

      {loading ? (
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải đơn hàng...
        </div>
      ) : data && data.orders.length === 0 ? (
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 text-center space-y-2">
          <p className="text-sm text-lacquer-800/70">Không có đơn hàng nào trong mục này.</p>
          <p className="text-[11px] text-lacquer-800/50">
            Đơn mới sẽ xuất hiện ở đây ngay khi khách đặt sản phẩm của cửa hàng bạn.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {(data?.orders || []).map((order) => (
            <OrderRow key={order.id} order={order} onChanged={load} />
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SellerOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải...
        </div>
      }
    >
      <SellerOrdersContent />
    </Suspense>
  );
}
