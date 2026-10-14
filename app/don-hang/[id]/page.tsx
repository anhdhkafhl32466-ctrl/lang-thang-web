'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { formatCurrencyVND } from '@/lib/utils';
import { formatDistance, formatDuration, LatLng } from '@/lib/geo';
import { ORDER_STATUS_META } from '@/lib/orders/workflow';
import type { Order } from '@/lib/orders/types';
import OrderProgress from '@/components/orders/OrderProgress';
import AddressPickerMap from '@/components/orders/AddressPickerMap';
import { ArrowLeft, Loader2, MapPin, Truck, History, AlertTriangle, ShieldCheck, PackageCheck } from 'lucide-react';

interface WarehouseInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseInfo | null>(null);
  const [routeGeometry, setRouteGeometry] = useState<LatLng[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        const data = await res.json();
        if (data?.ok) setWarehouse(data.warehouse);
      } catch {
        /* bỏ qua */
      }
    })();
  }, []);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok || !data.ok) {
          setError(data?.error?.message || 'Không tải được đơn hàng.');
          return;
        }
        setOrder(data.order);
        setError(null);
      } catch {
        if (!cancelled) setError('Không kết nối được tới máy chủ.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  // Vẽ lại tuyến đường thật từ kho tới địa chỉ nhận hàng của đơn.
  useEffect(() => {
    if (!warehouse || !order || order.lat == null || order.lng == null) return;
    let cancelled = false;
    (async () => {
      try {
        const query = new URLSearchParams({
          fromLat: String(warehouse.lat),
          fromLon: String(warehouse.lng),
          toLat: String(order.lat),
          toLon: String(order.lng),
          profile: 'driving',
        });
        const res = await fetch(`/api/geo/directions?${query.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data?.ok) setRouteGeometry(data.route?.geometry || null);
      } catch {
        if (!cancelled) setRouteGeometry(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [warehouse, order]);

  const selection = useMemo(
    () =>
      order && order.lat != null && order.lng != null
        ? {
            text: order.addressText,
            lat: order.lat,
            lng: order.lng,
            source: (order.addressSource === 'gps' || order.addressSource === 'search'
              ? order.addressSource
              : 'manual') as 'gps' | 'search' | 'manual',
            placeId: order.placeId,
          }
        : null,
    [order]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-lacquer-800/60 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Đang tải đơn hàng...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-20 text-center space-y-4">
        <p className="text-sm text-rose-700 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error || 'Không tìm thấy đơn hàng.'}</span>
        </p>
        <Link href="/don-hang" className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-600">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh sách đơn hàng</span>
        </Link>
      </div>
    );
  }

  const meta = ORDER_STATUS_META[order.status];
  const hasCarrierEvent = (order.events || []).some((event) =>
    ['handed_to_carrier', 'in_transit', 'out_for_delivery', 'delivered'].includes(event.status) && event.actorType === 'admin'
  );

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-dopaper-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link href="/don-hang" className="inline-flex items-center gap-1.5 text-xs font-semibold text-lacquer-800/70 hover:text-terracotta-600">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách đơn hàng</span>
        </Link>

        <div className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-lacquer-800/60">Mã đơn hàng</span>
              <h1 className="font-mono text-xl font-bold text-lacquer-900">{order.code}</h1>
              <p className="text-[11px] text-lacquer-800/60">Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border self-start ${meta.tone === 'danger' ? 'bg-rose-100 text-rose-800 border-rose-200' : meta.tone === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
              {meta.label}
            </span>
          </div>

          <OrderProgress status={order.status} hasCarrierEvent={hasCarrierEvent} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-terracotta-600" />
                <span>Sản phẩm trong đơn</span>
              </h2>
              <div className="divide-y divide-terracotta-100">
                {(order.items || []).map((item) => (
                  <div key={item.id} className="py-3 flex items-center gap-3">
                    {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 rounded-xl object-cover border border-terracotta-100" />}
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-lacquer-900 line-clamp-1">{item.name}</span>
                      <span className="block text-[11px] text-lacquer-800/60">
                        {item.villageName} · {formatCurrencyVND(item.unitPrice)} × {item.quantity}
                      </span>
                    </div>
                    <strong className="text-sm text-terracotta-600">{formatCurrencyVND(item.lineTotal)}</strong>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-terracotta-100 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-lacquer-800/70">Tạm tính</span><strong>{formatCurrencyVND(order.subtotal)}</strong></div>
                <div className="flex justify-between"><span className="text-lacquer-800/70">Phí vận chuyển</span><strong>{formatCurrencyVND(order.shippingFee)}</strong></div>
                <div className="flex justify-between text-sm border-t border-terracotta-200 pt-1.5"><span className="text-lacquer-800/70">Tổng cộng</span><strong className="text-terracotta-600">{formatCurrencyVND(order.total)}</strong></div>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-terracotta-600" />
                <span>Địa chỉ nhận hàng & tuyến đường từ kho</span>
              </h2>

              <div className="p-3.5 bg-dopaper-100 rounded-2xl text-xs space-y-1">
                <div><strong>Người nhận:</strong> {order.customerName} · {order.customerPhone}</div>
                <div><strong>Địa chỉ:</strong> {order.addressText}</div>
                {order.addressNote && <div><strong>Ghi chú:</strong> {order.addressNote}</div>}
                {order.lat != null && order.lng != null && (
                  <div className="font-mono text-[11px]">
                    Toạ độ: {order.lat.toFixed(5)}, {order.lng.toFixed(5)} · nguồn: {order.addressSource || 'không rõ'}
                  </div>
                )}
                {order.warehouseAddress && (
                  <div className="text-[11px] text-lacquer-800/70">Kho xuất hàng: {order.warehouseAddress}</div>
                )}
                {order.routeDistanceM != null && (
                  <div className="text-[11px] text-terracotta-700 font-semibold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    <span>
                      Tuyến đường bộ: {formatDistance(order.routeDistanceM)}
                      {order.routeDurationS != null ? ` · ${formatDuration(order.routeDurationS)}` : ''}
                      {order.routeProvider ? ` (${order.routeProvider})` : ''}
                    </span>
                  </div>
                )}
                {order.routeStatus && <div className="text-[11px] text-lacquer-800/60">{order.routeStatus}</div>}
              </div>

              <AddressPickerMap
                readOnly
                value={selection}
                onChange={() => {
                  /* Chế độ xem: không cho sửa địa chỉ từ trang theo dõi */
                }}
                warehouse={warehouse}
                routeGeometry={routeGeometry}
                routeSummary={{ distanceM: order.routeDistanceM, durationS: order.routeDurationS }}
              />
            </section>
          </div>

          <div className="lg:col-span-1">
            <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 lg:sticky lg:top-28">
              <h2 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
                <History className="w-5 h-5 text-gold-600" />
                <span>Lịch sử trạng thái</span>
              </h2>

              {(order.events || []).length === 0 ? (
                <p className="text-xs text-lacquer-800/60">Chưa có sự kiện nào.</p>
              ) : (
                <ol className="space-y-3">
                  {(order.events || [])
                    .slice()
                    .reverse()
                    .map((event) => (
                      <li key={event.id} className="flex gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-terracotta-500 mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="block text-xs font-bold text-lacquer-900">
                            {ORDER_STATUS_META[event.status]?.label || event.status}
                          </span>
                          <span className="block text-[10px] text-lacquer-800/60">
                            {new Date(event.createdAt).toLocaleString('vi-VN')} ·{' '}
                            {event.actorType === 'admin' ? 'quản trị viên' : event.actorType === 'customer' ? 'khách hàng' : 'hệ thống'}
                            {event.actorId ? ` (${event.actorId})` : ''}
                          </span>
                          {event.note && <span className="block text-[11px] text-lacquer-800/75 mt-0.5">{event.note}</span>}
                          <span className="block text-[10px] text-lacquer-800/40 font-mono">nguồn: {event.source}</span>
                        </div>
                      </li>
                    ))}
                </ol>
              )}

              <div className="pt-3 border-t border-terracotta-100 text-[11px] text-lacquer-800/70 space-y-1.5">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Phương thức thanh toán: {order.paymentMethod === 'cod' ? 'thanh toán khi nhận hàng' : order.paymentMethod}</span>
                </span>
                <span className="block">
                  Email nhận thông báo: {order.customerEmail || 'chưa cung cấp (chỉ có thông báo trong website)'}
                </span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
