'use client';

/**
 * Chi tiết một ĐƠN CON của cửa hàng và nơi người bán cập nhật trạng thái giao hàng.
 *
 * Ghi chú nghiệp vụ quan trọng (hiển thị cả cho người dùng):
 *  - Mã vận đơn và đơn vị vận chuyển do NGƯỜI BÁN nhập, đây không phải dữ liệu tracking trực tiếp
 *    từ hãng vận chuyển (chưa tích hợp API hãng nào).
 *  - Hệ thống không tự đánh dấu "đã giao" thay người bán, và không cho nhảy bước.
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Clock, History, Loader2, MapPin, Package, Phone,
  ShieldCheck, Truck, User as UserIcon,
} from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';
import { formatDistance, formatDuration } from '@/lib/geo';
import { ORDER_STATUS_META, type OrderStatus } from '@/lib/orders/workflow';
import { fetchSellerOrder, updateSellerOrderStatus } from '@/lib/client/sellerApi';
import type { SellerOrderView } from '@/lib/orders/types';

export default function SellerOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const idOrCode = params?.id || '';

  const [order, setOrder] = useState<SellerOrderView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingCode, setTrackingCode] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchSellerOrder(idOrCode);
      setOrder(data.order);
      setCarrier(data.order.carrier || '');
      setTrackingCode(data.order.trackingCode || '');
    } catch (err: any) {
      setError(err?.message || 'Không tải được đơn hàng.');
    } finally {
      setLoading(false);
    }
  }, [idOrCode]);

  useEffect(() => {
    load();
  }, [load]);

  const applyStatus = async (status: OrderStatus) => {
    if (!order) return;
    try {
      setSubmitting(status);
      setActionError(null);
      setActionNotice(null);
      const result = await updateSellerOrderStatus(order.id, {
        status,
        note: note.trim() || null,
        carrier: carrier.trim() || null,
        trackingCode: trackingCode.trim() || null,
      });
      setOrder(result.order);
      setNote('');
      const emailState = result.notified?.customer?.status;
      setActionNotice(
        `Đã chuyển đơn sang "${ORDER_STATUS_META[status].label}". ` +
          `Đơn tổng hiện ở trạng thái "${ORDER_STATUS_META[result.parentStatus as OrderStatus]?.label || result.parentStatus}". ` +
          (emailState === 'sent'
            ? 'Email thông báo cho khách đã được gửi.'
            : emailState
              ? `Email cho khách chưa gửi được (${result.notified?.customer?.error || 'lý do khác'}) — trạng thái vẫn đã được lưu.`
              : 'Khách chưa có email nên chỉ nhận thông báo trong website.')
      );
    } catch (err: any) {
      setActionError(err?.message || 'Không cập nhật được trạng thái.');
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return (
      <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải đơn hàng...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="paper-panel rounded-3xl border border-rose-200 p-8 space-y-3 text-center">
        <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
        <p className="text-sm text-lacquer-800/80">{error || 'Không tìm thấy đơn hàng.'}</p>
        <Link href="/ban-hang/don-hang" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold">
          <ArrowLeft className="w-3.5 h-3.5" />
          Về danh sách đơn
        </Link>
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const transitions = order.allowedTransitions || [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link href="/ban-hang/don-hang" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-terracotta-600">
          <ArrowLeft className="w-3.5 h-3.5" />
          Danh sách đơn hàng
        </Link>
        <span className="text-[11px] text-lacquer-800/60">
          Đơn tổng <span className="font-mono">{order.parentCode}</span> · {ORDER_STATUS_META[order.parentStatus]?.label}
        </span>
      </div>

      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl font-bold text-lacquer-900 font-mono">{order.code}</h1>
            <p className="text-[11px] text-lacquer-800/60 mt-1">
              Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')} · cửa hàng {order.storeName}
            </p>
          </div>
          <div className="text-right">
            <strong className="block text-lg font-bold text-terracotta-600">{formatCurrencyVND(order.total)}</strong>
            <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-1 rounded-full border border-terracotta-200 text-[10px] font-bold text-lacquer-900">
              <Clock className="w-3 h-3" />
              {meta?.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
          <div className="p-3.5 rounded-2xl bg-dopaper-50 border border-terracotta-100 space-y-1.5">
            <span className="font-bold text-lacquer-900 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-terracotta-600" />
              Người nhận
            </span>
            <span className="block text-lacquer-900">{order.customerName}</span>
            <a href={`tel:${order.customerPhone}`} className="flex items-center gap-1.5 text-terracotta-700 font-semibold">
              <Phone className="w-3 h-3" />
              {order.customerPhone}
            </a>
            <span className="block text-lacquer-800/75 leading-relaxed">
              <MapPin className="w-3 h-3 inline mr-1" />
              {order.addressText}
            </span>
            {order.addressNote && <span className="block text-lacquer-800/60 italic">Ghi chú: {order.addressNote}</span>}
          </div>

          <div className="p-3.5 rounded-2xl bg-dopaper-50 border border-terracotta-100 space-y-1.5">
            <span className="font-bold text-lacquer-900 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-terracotta-600" />
              Chặng giao hàng của cửa hàng bạn
            </span>
            <span className="block text-lacquer-800/75">
              Xuất hàng từ: {order.storeAddress || order.storeName}
              {order.storeLat != null && order.storeLng != null
                ? ` (${order.storeLat.toFixed(5)}, ${order.storeLng.toFixed(5)})`
                : ' — chưa khai toạ độ, hệ thống dùng kho mặc định của sàn khi tính phí'}
            </span>
            {order.routeDistanceM != null ? (
              <span className="block font-semibold text-terracotta-700">
                Tuyến đường thật: {formatDistance(order.routeDistanceM)}
                {order.routeDurationS != null ? ` · ${formatDuration(order.routeDurationS)}` : ''}
              </span>
            ) : (
              <span className="block text-amber-700">Chưa tính được tuyến đường: {order.routeStatus}</span>
            )}
            <span className="block text-lacquer-800/60">
              Phí vận chuyển của chặng này: <strong>{formatCurrencyVND(order.shippingFee)}</strong>
            </span>
          </div>
        </div>
      </section>

      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-3">
        <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
          <Package className="w-4 h-4 text-terracotta-600" />
          Sản phẩm của cửa hàng trong đơn
        </h2>
        <ul className="space-y-2">
          {(order.items || []).map((item) => (
            <li key={item.id} className="flex items-center gap-3 text-[11px]">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-10 h-10 rounded-xl object-cover border border-terracotta-100" />
              )}
              <span className="flex-1 text-lacquer-900">
                {item.name}
                <span className="block text-lacquer-800/60">
                  {formatCurrencyVND(item.unitPrice)} × {item.quantity}
                </span>
              </span>
              <strong className="text-terracotta-600">{formatCurrencyVND(item.lineTotal)}</strong>
            </li>
          ))}
        </ul>
        <div className="border-t border-terracotta-100 pt-3 text-[11px] space-y-1">
          <div className="flex justify-between">
            <span className="text-lacquer-800/70">Tiền hàng</span>
            <strong>{formatCurrencyVND(order.subtotal)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-lacquer-800/70">Phí vận chuyển</span>
            <strong>{formatCurrencyVND(order.shippingFee)}</strong>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-lacquer-800/70">Phần của cửa hàng</span>
            <strong className="text-terracotta-600">{formatCurrencyVND(order.total)}</strong>
          </div>
        </div>
      </section>

      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-3">
        <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-terracotta-600" />
          Xử lý & giao hàng
        </h2>

        {transitions.length === 0 ? (
          <p className="text-[11px] text-lacquer-800/70">
            Đơn đã ở bước kết thúc ({meta?.label}) nên không còn bước nào để cập nhật.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="space-y-1 text-[11px]">
                <span className="font-bold text-lacquer-900">Đơn vị vận chuyển (nếu có)</span>
                <input
                  value={carrier}
                  onChange={(event) => setCarrier(event.target.value)}
                  placeholder="Viettel Post, GHN, GHTK..."
                  className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>
              <label className="space-y-1 text-[11px]">
                <span className="font-bold text-lacquer-900">Mã vận đơn</span>
                <input
                  value={trackingCode}
                  onChange={(event) => setTrackingCode(event.target.value)}
                  placeholder="VD: GHN123456789"
                  className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>
              <label className="space-y-1 text-[11px]">
                <span className="font-bold text-lacquer-900">Ghi chú cho khách</span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="VD: đã đóng gói, giao trong ngày"
                  className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>
            </div>

            <p className="text-[10px] text-lacquer-800/60 leading-relaxed">
              Mã vận đơn do bạn nhập và là thông tin bạn tự xác nhận — hệ thống chưa nối API hãng vận chuyển
              nên không hiển thị hành trình tracking trực tiếp. Chỉ những bước dưới đây mới hợp lệ theo quy trình.
            </p>

            <div className="flex flex-wrap gap-2">
              {transitions.map((status) => (
                <button
                  key={status}
                  onClick={() => applyStatus(status)}
                  disabled={Boolean(submitting)}
                  className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 ${
                    status === 'cancelled' || status === 'delivery_failed'
                      ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                      : 'bg-terracotta-500 hover:bg-terracotta-600 text-white'
                  }`}
                >
                  {submitting === status ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {ORDER_STATUS_META[status].label}
                </button>
              ))}
            </div>
          </>
        )}

        {actionError && (
          <p className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            {actionError}
          </p>
        )}
        {actionNotice && (
          <p className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" />
            {actionNotice}
          </p>
        )}
      </section>

      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-3">
        <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
          <History className="w-4 h-4 text-terracotta-600" />
          Lịch sử đơn của cửa hàng
        </h2>
        <ol className="space-y-3">
          {(order.events || []).map((event) => (
            <li key={event.id} className="flex items-start gap-3 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-terracotta-500 mt-1.5 shrink-0" />
              <div>
                <span className="block font-bold text-lacquer-900">{ORDER_STATUS_META[event.status]?.label || event.status}</span>
                {event.fromStatus && (
                  <span className="block text-lacquer-800/60">
                    Từ “{ORDER_STATUS_META[event.fromStatus]?.label || event.fromStatus}”
                  </span>
                )}
                {event.note && <span className="block text-lacquer-800/75">{event.note}</span>}
                <span className="block text-[10px] text-lacquer-800/50">
                  {new Date(event.createdAt).toLocaleString('vi-VN')} · {event.actorType === 'seller' ? 'Người bán' : event.actorType === 'admin' ? 'Quản trị viên' : event.actorType === 'customer' ? 'Khách hàng' : 'Hệ thống'}
                  {event.source ? ` · ${event.source}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
