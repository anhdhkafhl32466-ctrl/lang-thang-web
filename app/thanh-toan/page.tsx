'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/client/cart';
import { formatCurrencyVND } from '@/lib/utils';
import { formatDistance, formatDuration, LatLng } from '@/lib/geo';
import { getCurrentUser } from '@/lib/authStorage';
import AddressPickerMap, { AddressSelection } from '@/components/orders/AddressPickerMap';
import type { Order, ShippingQuote } from '@/lib/orders/types';

interface ShippingLeg {
  storeId: string;
  storeName: string;
  subtotal: number;
  fee: number;
  freeShipping: boolean;
  distanceM: number | null;
  durationS: number | null;
  provider: string | null;
  status: string;
  originName: string;
  usingWarehouseFallback: boolean;
}
import {
  ShieldCheck, Loader2, AlertTriangle, CheckCircle2, PackageCheck, MapPin, Truck, Mail, BellRing, ArrowRight,
  XCircle, Store,
} from 'lucide-react';

interface WarehouseInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();

  const [warehouse, setWarehouse] = useState<WarehouseInfo | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [address, setAddress] = useState<AddressSelection | null>(null);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  // Mỗi cửa hàng là một chặng giao hàng riêng: phí vận chuyển của đơn = tổng phí các chặng.
  const [legs, setLegs] = useState<ShippingLeg[]>([]);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [routeGeometry, setRouteGeometry] = useState<LatLng[] | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [deliveryReport, setDeliveryReport] = useState<any>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        const data = await res.json();
        if (data?.ok) setWarehouse(data.warehouse);
      } catch {
        /* kho sẽ hiển thị trống */
      }
    })();
  }, []);

  // Khi địa chỉ được xác nhận: tính tuyến đường thật + phí vận chuyển cho TỪNG cửa hàng.
  useEffect(() => {
    if (!address) {
      setQuote(null);
      setLegs([]);
      setRouteGeometry(null);
      return;
    }

    let cancelled = false;
    (async () => {
      setQuoteLoading(true);
      try {
        const items = cart.lines.map((line) => `${line.productId}:${line.quantity}`).join(',');
        const params = new URLSearchParams({
          items,
          subtotal: String(cart.subtotal),
          lat: String(address.lat),
          lng: String(address.lng),
        });
        const quoteRes = await fetch(`/api/shipping/quote?${params.toString()}`, { cache: 'no-store' });
        const quoteData = await quoteRes.json();
        if (cancelled) return;
        if (quoteData?.ok) {
          setQuote(quoteData.quote);
          setLegs(quoteData.legs || []);
        }
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }

      if (warehouse) {
        try {
          const params = new URLSearchParams({
            fromLat: String(warehouse.lat),
            fromLon: String(warehouse.lng),
            toLat: String(address.lat),
            toLon: String(address.lng),
            profile: 'driving',
          });
          const res = await fetch(`/api/geo/directions?${params.toString()}`, { cache: 'no-store' });
          const data = await res.json();
          if (!cancelled && data?.ok) setRouteGeometry(data.route?.geometry || null);
        } catch {
          if (!cancelled) setRouteGeometry(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [address, cart.subtotal, warehouse]);

  const shippingFee = quote?.fee ?? 0;
  const total = cart.subtotal + shippingFee;

  const canSubmit = useMemo(
    () => cart.lines.length > 0 && Boolean(address) && name.trim().length >= 2 && phone.trim().length >= 9 && !submitting,
    [cart.lines.length, address, name, phone, submitting]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSubmitError(null);

      if (!address) {
        setSubmitError('Vui lòng chọn và xác nhận địa chỉ nhận hàng trên bản đồ.');
        return;
      }

      setSubmitting(true);
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: { name: name.trim(), phone: phone.trim(), email: email.trim() || null },
            address: {
              text: address.text,
              note: note.trim() || null,
              lat: address.lat,
              lng: address.lng,
              source: address.source,
              placeId: address.placeId ?? null,
            },
            items: cart.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
            paymentMethod: 'cod',
            // Tuyến đường và phí vận chuyển KHÔNG gửi lên để quyết định số tiền: máy chủ tự tính lại
            // theo từng cửa hàng khi tạo đơn (dùng đúng hàm báo giá ở trên nên số tiền vẫn khớp).
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.ok) {
          setSubmitError(data?.error?.message || 'Không tạo được đơn hàng.');
          return;
        }

        setCreatedOrder(data.order);
        setDeliveryReport(data.delivery);
        cart.clearCart();
        cart.refreshCatalog();
      } catch {
        setSubmitError('Không kết nối được tới máy chủ để đặt hàng.');
      } finally {
        setSubmitting(false);
      }
    },
    [address, cart, email, name, note, phone]
  );

  if (createdOrder) {
    return (
      <div className="min-h-screen py-14 bg-dopaper-50">
        <div className="max-w-2xl mx-auto px-4 space-y-5">
          <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-lacquer-900">Đặt hàng thành công</h1>
            <p className="text-sm text-lacquer-800/75">
              Mã đơn hàng của bạn là <strong className="font-mono text-terracotta-700">{createdOrder.code}</strong>.
            </p>
            <div className="p-4 bg-dopaper-100 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex justify-between"><span className="text-lacquer-800/70">Tạm tính</span><strong>{formatCurrencyVND(createdOrder.subtotal)}</strong></div>
              <div className="flex justify-between"><span className="text-lacquer-800/70">Phí vận chuyển</span><strong>{formatCurrencyVND(createdOrder.shippingFee)}</strong></div>
              <div className="flex justify-between border-t border-terracotta-200 pt-1.5"><span className="text-lacquer-800/70">Tổng cộng</span><strong className="text-terracotta-600">{formatCurrencyVND(createdOrder.total)}</strong></div>
            </div>

            {/* Đơn đã được tách theo cửa hàng: khách nhìn rõ ai đang xử lý phần nào. */}
            {createdOrder.sellerOrders && createdOrder.sellerOrders.length > 0 && (
              <div className="text-left space-y-2">
                <span className="block text-xs font-bold text-lacquer-900">
                  Đơn được tách thành {createdOrder.sellerOrders.length} phần theo cửa hàng
                </span>
                {createdOrder.sellerOrders.map((child) => (
                  <div
                    key={child.id}
                    className="p-3 rounded-2xl border border-terracotta-100 bg-dopaper-50 text-[11px] space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-lacquer-900 flex items-center gap-1.5 min-w-0">
                        <Store className="w-3 h-3 text-terracotta-600 shrink-0" />
                        <span className="truncate">{child.storeName}</span>
                      </span>
                      <span className="font-mono text-[10px] text-lacquer-800/70">{child.code}</span>
                    </div>
                    <ul className="text-[10px] text-lacquer-800/75 space-y-0.5">
                      {(child.items || []).map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span className="truncate">{item.quantity} × {item.name}</span>
                          <span className="shrink-0">{formatCurrencyVND(item.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between text-[10px] border-t border-terracotta-100 pt-1">
                      <span className="text-lacquer-800/70">Phần của cửa hàng (gồm ship)</span>
                      <strong className="text-terracotta-600">{formatCurrencyVND(child.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-left text-[11px] space-y-1.5 p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <span className="block font-bold text-lacquer-900">Tình trạng gửi thông báo (kết quả thật):</span>
              <p className="flex items-center gap-1.5">
                {deliveryReport?.adminEmail?.status === 'sent' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
                <span>Email tới quản trị viên: <strong>{deliveryReport?.adminEmail?.status === 'sent' ? 'đã gửi' : 'chưa gửi'}</strong> {deliveryReport?.adminEmail?.error ? `(${deliveryReport.adminEmail.error})` : ''}</span>
              </p>
              {deliveryReport?.customerEmail && (
                <p className="flex items-center gap-1.5">
                  {deliveryReport.customerEmail.status === 'sent' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
                  <span>Email xác nhận cho khách: <strong>{deliveryReport.customerEmail.status === 'sent' ? 'đã gửi' : 'chưa gửi'}</strong> {deliveryReport.customerEmail.error ? `(${deliveryReport.customerEmail.error})` : ''}</span>
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-terracotta-600" />
                <span>Thông báo trong website: đã tạo cho quản trị viên{createdOrder.customerEmail ? ' và cho bạn' : ''}.</span>
              </p>
              <p className="flex items-center gap-1.5">
                {deliveryReport?.push?.configured ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <XCircle className="w-3.5 h-3.5 text-amber-600" />}
                <span>Thông báo đẩy: {deliveryReport?.push?.configured ? `đã gửi ${deliveryReport.push.sent}/${deliveryReport.push.attempted} thiết bị đã đăng ký` : 'chưa cấu hình VAPID'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => router.push(`/don-hang/${createdOrder.id}`)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-bold shadow"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Theo dõi đơn hàng</span>
              </button>
              <Link href="/san-pham" className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-white border border-terracotta-200 text-lacquer-900 text-sm font-bold">
                <span>Tiếp tục mua sắm</span>
              </Link>
            </div>
            <p className="text-[11px] text-lacquer-800/60">
              Nếu bạn đã đăng nhập, đơn hàng cũng xuất hiện trong mục “Đơn hàng của tôi”.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-dopaper-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">Thanh toán & xác nhận địa chỉ giao hàng</h1>

        {cart.lines.length === 0 ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-4">
            <p className="text-sm text-lacquer-800/70">Giỏ hàng đang trống nên chưa thể đặt hàng.</p>
            <Link href="/san-pham" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 text-white text-sm font-bold">
              <span>Chọn sản phẩm</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4">
                <h2 className="font-serif text-lg font-bold text-lacquer-900">1. Thông tin người nhận</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5 text-xs">
                    <span className="font-bold text-lacquer-900">Họ và tên <span className="text-rose-600">*</span></span>
                    <input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs">
                    <span className="font-bold text-lacquer-900">Số điện thoại <span className="text-rose-600">*</span></span>
                    <input
                      required
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="09xx xxx xxx"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs sm:col-span-2">
                    <span className="font-bold text-lacquer-900">Email nhận xác nhận (tùy chọn)</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="ban@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                    />
                    <span className="text-[11px] text-lacquer-800/60 flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <span>Nếu có email, hệ thống sẽ gửi xác nhận đơn và thông báo mỗi khi trạng thái thay đổi.</span>
                    </span>
                  </label>
                </div>
              </section>

              <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-lg font-bold text-lacquer-900">2. Xác nhận địa chỉ nhận hàng trên bản đồ</h2>
                  <span className="text-[11px] text-lacquer-800/60 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>Bấm hoặc kéo marker để chỉnh</span>
                  </span>
                </div>

                <AddressPickerMap
                  value={address}
                  onChange={setAddress}
                  warehouse={warehouse}
                  routeGeometry={routeGeometry}
                  routeSummary={quote ? { distanceM: quote.distanceM, durationS: quote.durationS } : null}
                />

                <label className="space-y-1.5 text-xs block">
                  <span className="font-bold text-lacquer-900">Ghi chú giao hàng (tùy chọn)</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ví dụ: giao giờ hành chính, gọi trước khi tới..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                </label>
              </section>
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 lg:sticky lg:top-28">
                <h2 className="font-serif text-lg font-bold text-lacquer-900">3. Đơn hàng & vận chuyển</h2>

                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {cart.lines.map((line) => {
                    const product = cart.products[line.productId];
                    if (!product) return null;
                    return (
                      <div key={line.productId} className="flex items-center gap-2 text-[11px]">
                        <img src={product.image} alt={product.name} className="w-9 h-9 rounded-lg object-cover border border-terracotta-100" />
                        <span className="flex-1 min-w-0">
                          <span className="block text-lacquer-900 line-clamp-1">{product.name}</span>
                          <span className="flex items-center gap-1 text-[10px] text-lacquer-800/60">
                            <Store className="w-2.5 h-2.5" />
                            {product.storeName}
                          </span>
                        </span>
                        <span className="text-lacquer-800/70">x{line.quantity}</span>
                        <strong className="text-terracotta-600">{formatCurrencyVND(product.price * line.quantity)}</strong>
                      </div>
                    );
                  })}
                </div>

                {/* Phí vận chuyển tách theo từng cửa hàng: mỗi cửa hàng xuất hàng từ một địa chỉ riêng. */}
                {legs.length > 0 && (
                  <div className="space-y-1.5 text-[11px] p-3 rounded-2xl bg-dopaper-100 border border-terracotta-100">
                    <span className="block font-bold text-lacquer-900">Phí vận chuyển theo cửa hàng</span>
                    {legs.map((leg) => (
                      <div key={leg.storeId} className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block text-lacquer-900 font-semibold truncate">{leg.storeName}</span>
                          <span className="block text-[10px] text-lacquer-800/60">
                            {leg.distanceM != null ? formatDistance(leg.distanceM) : 'chưa tính được tuyến'}
                            {leg.usingWarehouseFallback ? ' · xuất từ kho mặc định của sàn' : ''}
                          </span>
                        </span>
                        <strong className="shrink-0 text-terracotta-600">
                          {leg.freeShipping ? 'Miễn phí' : formatCurrencyVND(leg.fee)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-xs border-t border-terracotta-100 pt-3">
                  <div className="flex justify-between"><span className="text-lacquer-800/70">Tạm tính</span><strong>{formatCurrencyVND(cart.subtotal)}</strong></div>
                  <div className="flex justify-between">
                    <span className="text-lacquer-800/70 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Phí vận chuyển</span>
                    </span>
                    <strong>
                      {quoteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : formatCurrencyVND(shippingFee)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-terracotta-200 pt-2 text-sm">
                    <span className="text-lacquer-800/70">Tổng cộng</span>
                    <strong className="text-terracotta-600">{formatCurrencyVND(total)}</strong>
                  </div>
                </div>

                {quote && (
                  <div className="p-3 rounded-2xl bg-dopaper-100 border border-terracotta-100 text-[11px] space-y-1">
                    <span className="block text-lacquer-800/80">{quote.message}</span>
                    {quote.distanceM != null && (
                      <span className="block font-semibold text-terracotta-700">
                        Tuyến đường thật: {formatDistance(quote.distanceM)}
                        {quote.durationS != null ? ` · ${formatDuration(quote.durationS)}` : ''}
                      </span>
                    )}
                    {quote.provider && <span className="block text-lacquer-800/60">Đơn vị định tuyến: {quote.provider}</span>}
                    {warehouse && (
                      <span className="block text-lacquer-800/60">
                        Xuất phát từ: {warehouse.name} ({warehouse.lat.toFixed(5)}, {warehouse.lng.toFixed(5)})
                      </span>
                    )}
                  </div>
                )}

                {submitError && (
                  <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{submitError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-300 text-white text-sm font-bold shadow"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  <span>{submitting ? 'Đang gửi đơn...' : 'Đặt hàng (thanh toán khi nhận)'}</span>
                </button>

                <p className="text-[10px] leading-relaxed text-lacquer-800/60">
                  Giá, tồn kho và phí vận chuyển được máy chủ kiểm tra lại ngay khi nhận đơn. Đơn hàng được lưu
                  trong cơ sở dữ liệu nên vẫn xem được sau khi tải lại trang hoặc trên thiết bị khác.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
