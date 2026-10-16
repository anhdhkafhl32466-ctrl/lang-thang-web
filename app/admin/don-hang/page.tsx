'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_ORDERS_PATH, loginHref } from '@/lib/client/authRedirect';
import { formatCurrencyVND } from '@/lib/utils';
import { formatDistance, formatDuration } from '@/lib/geo';
import { ALLOWED_TRANSITIONS, ORDER_STATUS_META, ORDER_STATUSES, type OrderStatus } from '@/lib/orders/workflow';
import type { Order } from '@/lib/orders/types';
import {
  ShieldCheck, Loader2, RefreshCw, MapPin, Truck, PackageCheck, Lock, AlertTriangle, XCircle,
  CheckCircle2, ArrowRight, History, BellRing, Store,
} from 'lucide-react';

const TONE_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  progress: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  danger: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function AdminOrdersPage() {
  const router = useRouter();
  // Đọc tham số ?order=<id> sau khi mount (không dùng useSearchParams để tránh ràng buộc
  // Suspense khi Next.js kết xuất tĩnh trang này).
  const [highlightOrderId, setHighlightOrderId] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<{ total: number; byStatus: Record<string, number>; revenue: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'unauthenticated' | 'forbidden'>('checking');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const knownIdsRef = useRef<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch('/api/admin/orders', { cache: 'no-store' });
        if (res.status === 401) {
          // Chưa đăng nhập: yêu cầu đăng nhập trước, rồi quay lại ĐÚNG trang quản trị này.
          setAuthState('unauthenticated');
          router.replace(loginHref(ADMIN_ORDERS_PATH));
          return;
        }
        if (res.status === 403) {
          setAuthState('forbidden');
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data?.error?.message || 'Không tải được danh sách đơn hàng.');
          return;
        }

        setAuthState('ok');
        setError(null);
        setOrders(data.orders || []);
        setStats(data.stats || null);

        // Đánh dấu các đơn xuất hiện lần đầu kể từ lần tải trước.
        const incoming: string[] = (data.orders || []).map((order: Order) => order.id);
        if (knownIdsRef.current.size > 0) {
          const fresh = incoming.filter((id) => !knownIdsRef.current.has(id));
          if (fresh.length > 0) setNewIds(new Set(fresh));
        }
        knownIdsRef.current = new Set(incoming);
      } catch {
        setError('Không kết nối được tới máy chủ.');
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    setHighlightOrderId(new URLSearchParams(window.location.search).get('order'));
    load();
    const interval = setInterval(() => load(true), 20_000);
    return () => clearInterval(interval);
  }, [load]);

  const transition = useCallback(
    async (order: Order, status: OrderStatus) => {
      setBusyOrderId(order.id);
      setFeedback(null);
      try {
        const res = await fetch(`/api/admin/orders/${order.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, note: notes[order.id]?.trim() || null }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setFeedback({ tone: 'error', text: data?.error?.message || 'Không cập nhật được trạng thái.' });
          return;
        }
        const emailStatus = data.delivery?.emails?.customer?.status || 'không gửi (khách không có email)';
        const nextStatus = data.order.status as OrderStatus;
        // Đơn đa cửa hàng: máy chủ trả về bước chuyển đã áp cho từng đơn con — hiện đủ để người vận hành
        // biết cửa hàng nào chuyển được, cửa hàng nào bị bỏ qua và vì sao.
        const storeReports: { storeName: string; to: OrderStatus | null; skipped?: string }[] = data.sellerOrders || [];
        const storeSummary = storeReports.length
          ? ` Cửa hàng: ${storeReports
              .map((report) =>
                report.to
                  ? `${report.storeName} → ${ORDER_STATUS_META[report.to].label}`
                  : `${report.storeName} (bỏ qua: ${report.skipped || 'không hợp lệ'})`
              )
              .join('; ')}.`
          : '';
        setFeedback({
          tone: 'ok',
          text: `Đơn ${data.order.code} → ${ORDER_STATUS_META[nextStatus].label}. Email cho khách: ${emailStatus}. Thông báo đẩy: ${
            data.delivery?.push?.configured ? `${data.delivery.push.sent}/${data.delivery.push.attempted} thiết bị` : 'chưa cấu hình VAPID'
          }.${storeSummary}`,
        });
        setNotes((prev) => ({ ...prev, [order.id]: '' }));
        setNewIds((prev) => {
          const next = new Set(prev);
          next.delete(order.id);
          return next;
        });
        load(true);
      } catch {
        setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
      } finally {
        setBusyOrderId(null);
      }
    },
    [load, notes]
  );

  const filtered = useMemo(
    () => (statusFilter === 'all' ? orders : orders.filter((order) => order.status === statusFilter)),
    [orders, statusFilter]
  );

  if (authState !== 'ok') {
    return (
      <div className="min-h-screen texture-paper texture-paper--moon py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-3xl border border-terracotta-200 p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-gold-400/20 text-gold-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-xl font-bold text-lacquer-900">Khu vực quản trị đơn hàng</h1>

            {authState === 'checking' || loading ? (
              <p className="text-xs text-lacquer-800/70 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra quyền truy cập...</span>
              </p>
            ) : authState === 'unauthenticated' ? (
              <p className="text-xs text-lacquer-800/70 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Bạn cần đăng nhập trước. Đang chuyển tới trang đăng nhập...</span>
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-rose-700 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Tài khoản hiện tại không có quyền quản trị.</span>
                </p>
                <p className="text-[11px] text-lacquer-800/70">
                  Quyền quản trị chỉ được cấp khi máy chủ xác minh được danh tính: tài khoản Google trùng
                  email quản trị đã cấu hình (ADMIN_EMAIL), hoặc đăng nhập bằng khoá quản trị ADMIN_ACCESS_KEY.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={loginHref(ADMIN_ORDERS_PATH)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-gold-500 text-white text-sm font-bold shadow"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Đăng nhập bằng tài khoản quản trị</span>
              </Link>
              <Link href="/" className="text-xs font-bold text-terracotta-600">
                Về trang chủ
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen texture-paper texture-paper--moon py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-terracotta-600" />
              <span>Quản trị đơn hàng</span>
            </h1>
            <p className="text-xs text-lacquer-800/70">
              Xác nhận, chuẩn bị hàng, bàn giao vận chuyển và cập nhật tiến trình giao hàng. Tự động làm mới mỗi 20 giây.
            </p>
          </div>
          <button
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 bg-white text-xs font-semibold text-lacquer-800 hover:bg-dopaper-100 self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
              feedback.tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {feedback.tone === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-terracotta-200">
              <span className="text-[11px] text-lacquer-800/60">Tổng đơn</span>
              <strong className="block text-xl font-serif text-lacquer-900">{stats.total}</strong>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-terracotta-200">
              <span className="text-[11px] text-lacquer-800/60">Chờ xác nhận</span>
              <strong className="block text-xl font-serif text-amber-600">{stats.byStatus.pending_confirmation || 0}</strong>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-terracotta-200">
              <span className="text-[11px] text-lacquer-800/60">Đã giao</span>
              <strong className="block text-xl font-serif text-emerald-600">{stats.byStatus.delivered || 0}</strong>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-terracotta-200">
              <span className="text-[11px] text-lacquer-800/60">Giá trị đơn (trừ huỷ)</span>
              <strong className="block text-base font-serif text-terracotta-600">{formatCurrencyVND(stats.revenue)}</strong>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {(['all', ...ORDER_STATUSES] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors ${
                statusFilter === status
                  ? 'bg-terracotta-500 text-white border-terracotta-500'
                  : 'bg-white text-lacquer-800/70 border-terracotta-200 hover:bg-dopaper-100'
              }`}
            >
              {status === 'all' ? `Tất cả (${orders.length})` : `${ORDER_STATUS_META[status as OrderStatus].label} (${stats?.byStatus[status] || 0})`}
            </button>
          ))}
        </div>

        {error && <p className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</p>}

        {filtered.length === 0 ? (
          <p className="p-10 text-center text-xs text-lacquer-800/60 bg-white rounded-3xl border border-terracotta-200">
            Không có đơn hàng nào ở trạng thái này.
          </p>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const meta = ORDER_STATUS_META[order.status];
              const nextStates = ALLOWED_TRANSITIONS[order.status] || [];
              const isNew = newIds.has(order.id);
              const isHighlighted = highlightOrderId === order.id;

              return (
                <div
                  key={order.id}
                  id={order.id}
                  className={`bg-white rounded-3xl border p-5 space-y-4 ${
                    isHighlighted ? 'border-terracotta-500 ring-2 ring-terracotta-200' : 'border-terracotta-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-lacquer-900">{order.code}</span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${TONE_CLASS[meta.tone]}`}>
                          {meta.label}
                        </span>
                        {isNew && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-terracotta-500 text-white flex items-center gap-1">
                            <BellRing className="w-3 h-3" />
                            Đơn mới
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-lacquer-800/60">
                        {new Date(order.createdAt).toLocaleString('vi-VN')} · {order.customerName} · {order.customerPhone}
                        {order.customerEmail ? ` · ${order.customerEmail}` : ' · không có email'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-lg font-serif font-bold text-terracotta-600">{formatCurrencyVND(order.total)}</span>
                      <span className="text-[11px] text-lacquer-800/60">{formatCurrencyVND(order.subtotal)} + ship {formatCurrencyVND(order.shippingFee)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="p-3 rounded-2xl bg-dopaper-100 text-[11px] space-y-1">
                      <span className="font-bold text-lacquer-900 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-terracotta-600" />
                        <span>Địa chỉ giao hàng</span>
                      </span>
                      <p className="text-lacquer-800/80">{order.addressText}</p>
                      {order.addressNote && <p className="text-lacquer-800/60">Ghi chú: {order.addressNote}</p>}
                      {order.lat != null && order.lng != null && (
                        <p className="font-mono text-[10px] text-lacquer-800/70">
                          {order.lat.toFixed(5)}, {order.lng.toFixed(5)} · nguồn {order.addressSource || '?'}
                        </p>
                      )}
                      {order.routeDistanceM != null ? (
                        <p className="text-terracotta-700 font-semibold flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          <span>
                            Tuyến thật: {formatDistance(order.routeDistanceM)}
                            {order.routeDurationS != null ? ` · ${formatDuration(order.routeDurationS)}` : ''}
                          </span>
                        </p>
                      ) : (
                        <p className="text-amber-700">Chưa có tuyến đường (thiếu toạ độ hoặc dịch vụ định tuyến lỗi).</p>
                      )}
                      {order.lat != null && order.lng != null && (
                        <a
                          href={`https://www.openstreetmap.org/?mlat=${order.lat}&mlon=${order.lng}#map=16/${order.lat}/${order.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-terracotta-600"
                        >
                          <span>Mở vị trí trên bản đồ</span>
                          <ArrowRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100 text-[11px] space-y-1.5">
                      <span className="font-bold text-lacquer-900 flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-gold-600" />
                        <span>Lịch sử trạng thái ({(order.events || []).length})</span>
                      </span>
                      <div className="max-h-28 overflow-y-auto space-y-1">
                        {(order.events || []).map((event) => (
                          <div key={event.id} className="text-lacquer-800/75">
                            <strong>
                              {event.fromStatus
                                ? `${ORDER_STATUS_META[event.fromStatus]?.label || event.fromStatus} → ${
                                    ORDER_STATUS_META[event.status]?.label || event.status
                                  }`
                                : `${ORDER_STATUS_META[event.status]?.label || event.status} (khởi tạo đơn)`}
                            </strong>{' '}
                            — {new Date(event.createdAt).toLocaleString('vi-VN')}
                            <span className="text-lacquer-800/50"> · {event.actorType}{event.actorId ? ` (${event.actorId})` : ''} · {event.source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl border border-terracotta-100 space-y-2">
                    <span className="text-[11px] font-bold text-lacquer-900">Sản phẩm ({(order.items || []).length})</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-[11px]">
                          {item.image && <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-terracotta-100" />}
                          <span className="flex-1 text-lacquer-900 line-clamp-1">{item.name}</span>
                          <span className="text-lacquer-800/60">x{item.quantity}</span>
                          <strong className="text-terracotta-600">{formatCurrencyVND(item.lineTotal)}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/*
                    Đơn đa cửa hàng được tách thành các đơn con: người vận hành cần thấy từng cửa hàng
                    đang ở bước nào, phần tiền và mã vận đơn riêng, thay vì chỉ thấy một trạng thái chung.
                  */}
                  {(order.sellerOrders || []).length > 0 && (
                    <div className="p-3 rounded-2xl border border-gold-300/60 bg-gold-50/40 space-y-2">
                      <span className="text-[11px] font-bold text-lacquer-900 flex items-center gap-1.5">
                        <Store className="w-3.5 h-3.5 text-gold-600" />
                        <span>
                          Đơn con theo cửa hàng ({(order.sellerOrders || []).length}) — mỗi cửa hàng giao độc lập
                        </span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(order.sellerOrders || []).map((child) => {
                          const childMeta = ORDER_STATUS_META[child.status];
                          return (
                            <div key={child.id} className="p-2.5 rounded-xl bg-white border border-terracotta-100 text-[11px] space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-lacquer-900 truncate">{child.storeName}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TONE_CLASS[childMeta.tone]}`}>
                                  {childMeta.label}
                                </span>
                              </div>
                              <span className="block font-mono text-[10px] text-lacquer-800/60">{child.code}</span>
                              <span className="block text-lacquer-800/70">
                                {(child.items || []).length} mặt hàng · tiền hàng {formatCurrencyVND(child.subtotal)} · ship{' '}
                                {formatCurrencyVND(child.shippingFee)}
                              </span>
                              <span className="block text-terracotta-700 font-bold">
                                Phần cửa hàng: {formatCurrencyVND(child.total)}
                              </span>
                              {child.storeAddress && (
                                <span className="block text-lacquer-800/60">Xuất hàng: {child.storeAddress}</span>
                              )}
                              {(child.carrier || child.trackingCode) && (
                                <span className="block text-lacquer-800/75">
                                  {child.carrier || 'chưa ghi đơn vị vận chuyển'}
                                  {child.trackingCode ? ` · ${child.trackingCode}` : ''} (do người bán cập nhật)
                                </span>
                              )}
                              {(child.items || []).length > 0 && (
                                <span className="block text-lacquer-800/60 line-clamp-2">
                                  {(child.items || []).map((item) => `${item.quantity}× ${item.name}`).join(', ')}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {nextStates.length > 0 ? (
                    <div className="space-y-2 pt-1 border-t border-terracotta-100">
                      <input
                        value={notes[order.id] || ''}
                        onChange={(event) => setNotes((prev) => ({ ...prev, [order.id]: event.target.value }))}
                        placeholder="Ghi chú cho lần cập nhật này (hiển thị cho khách trong email/thông báo)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                      />
                      <div className="flex flex-wrap gap-2">
                        {nextStates.map((next) => (
                          <button
                            key={next}
                            onClick={() => transition(order, next)}
                            disabled={busyOrderId === order.id}
                            className={`px-3.5 py-2 rounded-xl text-[11px] font-bold shadow disabled:opacity-60 ${
                              next === 'cancelled' || next === 'delivery_failed'
                                ? 'bg-rose-500 hover:bg-rose-600 text-white'
                                : 'bg-terracotta-500 hover:bg-terracotta-600 text-white'
                            }`}
                          >
                            {busyOrderId === order.id ? 'Đang cập nhật...' : `→ ${ORDER_STATUS_META[next].label}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-lacquer-800/60 pt-1 border-t border-terracotta-100">
                      Đơn đã ở trạng thái kết thúc ({meta.label}) nên không thể cập nhật thêm.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
