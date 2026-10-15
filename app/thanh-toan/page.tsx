'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/client/cart';
import { formatCurrencyVND } from '@/lib/utils';
import { formatDistance, formatDuration, LatLng } from '@/lib/geo';
import { getCurrentUser } from '@/lib/authStorage';
import AddressPickerMap, { AddressSelection } from '@/components/orders/AddressPickerMap';
import type { CustomerAddress, Order, ShippingQuote } from '@/lib/orders/types';
import {
  ShieldCheck,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  PackageCheck,
  MapPin,
  Truck,
  Mail,
  BellRing,
  ArrowRight,
  XCircle,
  Store,
  Bookmark,
  Home,
  School,
  Building,
  PlusCircle,
  Package,
} from 'lucide-react';

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

  // Sổ địa chỉ khách hàng (Nhiệm vụ 3.A)
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveToBook, setSaveToBook] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Nhà riêng');

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

  // Tải cấu hình kho sàn và sổ địa chỉ khách hàng
  useEffect(() => {
    (async () => {
      try {
        const [configRes, sessionRes] = await Promise.all([
          fetch('/api/config', { cache: 'no-store' }),
          fetch('/api/auth/session', { cache: 'no-store' }),
        ]);
        const configData = await configRes.json();
        if (configData?.ok) setWarehouse(configData.warehouse);

        const sessionData = await sessionRes.json();
        const userEmail = sessionData?.user?.email || getCurrentUser()?.email;
        if (userEmail) {
          if (!email) setEmail(userEmail);
          const addrRes = await fetch(`/api/customer/addresses?email=${encodeURIComponent(userEmail)}`, {
            cache: 'no-store',
          });
          const addrData = await addrRes.json();
          if (addrData?.ok && Array.isArray(addrData.addresses) && addrData.addresses.length > 0) {
            setSavedAddresses(addrData.addresses);
            const defaultAddr = addrData.addresses.find((a: CustomerAddress) => a.isDefault) || addrData.addresses[0];
            if (defaultAddr) {
              setSelectedAddressId(defaultAddr.id);
              setName(defaultAddr.recipientName);
              setPhone(defaultAddr.phone);
              if (defaultAddr.addressNote) setNote(defaultAddr.addressNote);
              setAddress({
                text: defaultAddr.addressText,
                lat: defaultAddr.lat || 21.0285,
                lng: defaultAddr.lng || 105.8542,
                source: 'manual',
              });
            }
          }
        }
      } catch {
        /* nếu lỗi sổ địa chỉ, khách vẫn có thể chọn trên bản đồ */
      }
    })();
  }, []);

  const handleSelectSavedAddress = (addr: CustomerAddress) => {
    setSelectedAddressId(addr.id);
    setName(addr.recipientName);
    setPhone(addr.phone);
    if (addr.addressNote) setNote(addr.addressNote);
    setAddress({
      text: addr.addressText,
      lat: addr.lat || 21.0285,
      lng: addr.lng || 105.8542,
      source: 'manual',
    });
  };

  const handleUseCustomAddress = () => {
    setSelectedAddressId(null);
    setAddress(null);
  };

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
  }, [address, cart.lines, cart.subtotal, warehouse]);

  const shippingFee = quote?.fee ?? 0;
  const total = cart.subtotal + shippingFee;

  const canSubmit = useMemo(
    () =>
      cart.lines.length > 0 &&
      Boolean(address) &&
      name.trim().length >= 2 &&
      phone.trim().length >= 9 &&
      !submitting,
    [cart.lines.length, address, name, phone, submitting]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setSubmitError(null);

      if (!address) {
        setSubmitError('Vui lòng chọn hoặc xác nhận địa chỉ nhận hàng trên bản đồ.');
        return;
      }

      setSubmitting(true);
      try {
        // Lưu vào sổ địa chỉ nếu được chọn
        if (saveToBook && email) {
          fetch('/api/customer/addresses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              recipientName: name.trim(),
              phone: phone.trim(),
              addressText: address.text,
              addressNote: note.trim() || null,
              lat: address.lat,
              lng: address.lng,
              label: addressLabel,
            }),
          }).catch(() => {});
        }

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
    [address, addressLabel, cart, email, name, note, phone, saveToBook]
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
              Mã đơn hàng tổng của bạn là{' '}
              <strong className="font-mono text-terracotta-700">{createdOrder.code}</strong>.
            </p>
            <div className="p-4 bg-dopaper-100 rounded-2xl text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-lacquer-800/70">Tạm tính</span>
                <strong>{formatCurrencyVND(createdOrder.subtotal)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-lacquer-800/70">Phí vận chuyển ({createdOrder.sellerOrders?.length || 1} chặng)</span>
                <strong>{formatCurrencyVND(createdOrder.shippingFee)}</strong>
              </div>
              <div className="flex justify-between border-t border-terracotta-200 pt-1.5">
                <span className="text-lacquer-800/70">Tổng cộng thanh toán khi nhận (COD)</span>
                <strong className="text-terracotta-600 text-sm">{formatCurrencyVND(createdOrder.total)}</strong>
              </div>
            </div>

            {/* Đơn đã được tách theo cửa hàng: khách nhìn rõ từng kiện hàng */}
            {createdOrder.sellerOrders && createdOrder.sellerOrders.length > 0 && (
              <div className="text-left space-y-2">
                <span className="block text-xs font-bold text-lacquer-900 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-terracotta-600" />
                  <span>Đơn được tách thành {createdOrder.sellerOrders.length} kiện hàng độc lập:</span>
                </span>
                {createdOrder.sellerOrders.map((child) => (
                  <div
                    key={child.id}
                    className="p-3.5 rounded-2xl border border-terracotta-100 bg-dopaper-50 text-[11px] space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-lacquer-900 flex items-center gap-1.5 min-w-0">
                        <Store className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />
                        <span className="truncate">{child.storeName}</span>
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-white border border-terracotta-200 text-terracotta-700 font-semibold">
                        {child.code}
                      </span>
                    </div>
                    {child.storeAddress && (
                      <p className="text-[10px] text-lacquer-800/60 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-terracotta-500 shrink-0" />
                        <span>Xuất phát: {child.warehouseName ? `${child.warehouseName} · ` : ''}{child.storeAddress}</span>
                      </p>
                    )}
                    <ul className="text-[10px] text-lacquer-800/75 space-y-0.5 pt-1 border-t border-terracotta-100/60">
                      {(child.items || []).map((item) => (
                        <li key={item.id} className="flex justify-between gap-2">
                          <span className="truncate">
                            {item.quantity} × {item.name}
                          </span>
                          <span className="shrink-0 font-medium">{formatCurrencyVND(item.lineTotal)}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between text-[10px] border-t border-terracotta-100 pt-1 font-semibold">
                      <span className="text-lacquer-800/70">Kiện hàng này (tiền hàng + ship):</span>
                      <strong className="text-terracotta-600">{formatCurrencyVND(child.total)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-left text-[11px] space-y-1.5 p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <span className="block font-bold text-lacquer-900">Tình trạng gửi thông báo xác nhận:</span>
              <p className="flex items-center gap-1.5">
                {deliveryReport?.adminEmail?.status === 'sent' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  Email ban quản trị:{' '}
                  <strong>{deliveryReport?.adminEmail?.status === 'sent' ? 'đã gửi' : 'chưa gửi'}</strong>{' '}
                  {deliveryReport?.adminEmail?.error ? `(${deliveryReport.adminEmail.error})` : ''}
                </span>
              </p>
              {deliveryReport?.customerEmail && (
                <p className="flex items-center gap-1.5">
                  {deliveryReport.customerEmail.status === 'sent' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>
                    Email xác nhận khách:{' '}
                    <strong>{deliveryReport.customerEmail.status === 'sent' ? 'đã gửi' : 'chưa gửi'}</strong>{' '}
                    {deliveryReport.customerEmail.error ? `(${deliveryReport.customerEmail.error})` : ''}
                  </span>
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <BellRing className="w-3.5 h-3.5 text-terracotta-600" />
                <span>
                  Thông báo nội bộ: Đã tạo thông báo tới từng chủ xưởng có sản phẩm trong đơn.
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                onClick={() => router.push(`/don-hang/${createdOrder.id}`)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-bold shadow"
              >
                <PackageCheck className="w-4 h-4" />
                <span>Theo dõi tiến trình đơn hàng</span>
              </button>
              <Link
                href="/san-pham"
                className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-white border border-terracotta-200 text-lacquer-900 text-sm font-bold"
              >
                <span>Tiếp tục mua sắm</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-dopaper-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
            Thanh toán & xác nhận địa chỉ giao hàng
          </h1>
          <p className="text-xs text-lacquer-800/70 mt-1">
            Đơn hàng đa shop sẽ tự động tính tuyến đường và cước phí theo từng điểm xuất hàng
          </p>
        </div>

        {cart.lines.length === 0 ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-4">
            <p className="text-sm text-lacquer-800/70">Giỏ hàng đang trống nên chưa thể đặt hàng.</p>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 text-white text-sm font-bold shadow"
            >
              <span>Chọn sản phẩm</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Sổ địa chỉ đã lưu (Nhiệm vụ 3.A) */}
              {savedAddresses.length > 0 && (
                <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-terracotta-600" />
                      <span>Sổ địa chỉ đã lưu</span>
                    </h2>
                    <button
                      type="button"
                      onClick={handleUseCustomAddress}
                      className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Chọn vị trí mới trên bản đồ</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {savedAddresses.map((addr) => {
                      const isSelected = selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => handleSelectSavedAddress(addr)}
                          className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'border-terracotta-500 bg-terracotta-50/50 shadow-sm ring-1 ring-terracotta-400'
                              : 'border-terracotta-200 bg-white hover:border-terracotta-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-bold text-lacquer-900 flex items-center gap-1.5">
                              {addr.label === 'Nhà riêng' ? (
                                <Home className="w-3.5 h-3.5 text-terracotta-600" />
                              ) : addr.label === 'Trường học' ? (
                                <School className="w-3.5 h-3.5 text-amber-600" />
                              ) : (
                                <Building className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              <span>{addr.label}</span>
                            </span>
                            {addr.isDefault && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                Mặc định
                              </span>
                            )}
                          </div>
                          <p className="font-semibold text-lacquer-900">
                            {addr.recipientName} · {addr.phone}
                          </p>
                          <p className="text-lacquer-800/70 text-[11px] line-clamp-2 mt-0.5">
                            {addr.addressText}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Thông tin người nhận */}
              <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 shadow-sm">
                <h2 className="font-serif text-lg font-bold text-lacquer-900">1. Thông tin người nhận</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="space-y-1.5 text-xs">
                    <span className="font-bold text-lacquer-900">
                      Họ và tên <span className="text-rose-600">*</span>
                    </span>
                    <input
                      required
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                    />
                  </label>
                  <label className="space-y-1.5 text-xs">
                    <span className="font-bold text-lacquer-900">
                      Số điện thoại <span className="text-rose-600">*</span>
                    </span>
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
                      <Mail className="w-3 h-3 text-terracotta-600" />
                      <span>Nhận mã vận đơn, tình trạng chuẩn bị hàng và báo cáo giao nhận qua email.</span>
                    </span>
                  </label>
                </div>
              </section>

              {/* Xác nhận địa chỉ nhận hàng trên bản đồ */}
              <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-lg font-bold text-lacquer-900">
                      2. Xác nhận địa chỉ nhận hàng trên bản đồ
                    </h2>
                    <p className="text-[11px] text-lacquer-800/60">
                      Tuyến đường và phí giao hàng được đo lường chính xác từ các kho làng nghề tới vị trí này
                    </p>
                  </div>
                  <span className="text-[11px] text-lacquer-800/60 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-terracotta-600" />
                    <span>Kéo marker để chỉnh vị trí</span>
                  </span>
                </div>

                <AddressPickerMap
                  value={address}
                  onChange={(newAddr) => {
                    setAddress(newAddr);
                    setSelectedAddressId(null);
                  }}
                  warehouse={warehouse}
                  routeGeometry={routeGeometry}
                  routeSummary={quote ? { distanceM: quote.distanceM, durationS: quote.durationS } : null}
                />

                <label className="space-y-1.5 text-xs block">
                  <span className="font-bold text-lacquer-900">Ghi chú giao hàng (số phòng, tầng, toà nhà...)</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Ví dụ: P302 KTX Domino, gọi trước khi đến..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                </label>

                {/* Tùy chọn lưu địa chỉ vào sổ địa chỉ */}
                {email && (
                  <div className="p-3.5 rounded-2xl bg-dopaper-100/70 border border-terracotta-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveToBook}
                        onChange={(e) => setSaveToBook(e.target.checked)}
                        className="rounded text-terracotta-600 focus:ring-terracotta-500 w-4 h-4"
                      />
                      <span className="font-medium text-lacquer-900">
                        Lưu địa chỉ này vào sổ địa chỉ của tôi
                      </span>
                    </label>

                    {saveToBook && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-lacquer-800/70">Nhãn:</span>
                        <select
                          value={addressLabel}
                          onChange={(e) => setAddressLabel(e.target.value)}
                          className="px-2.5 py-1 rounded-lg border border-terracotta-200 bg-white text-xs font-semibold focus:outline-none"
                        >
                          <option value="Nhà riêng">Nhà riêng</option>
                          <option value="Trường học">Trường học</option>
                          <option value="Ký túc xá">Ký túc xá</option>
                          <option value="Công ty">Công ty</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar tóm tắt đơn hàng & phí vận chuyển */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 lg:sticky lg:top-28 shadow-sm">
                <h2 className="font-serif text-lg font-bold text-lacquer-900">3. Đơn hàng & vận chuyển</h2>

                {/* Danh sách sản phẩm theo cửa hàng */}
                <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-terracotta-100/60">
                  {cart.lines.map((line) => {
                    const product = cart.products[line.productId];
                    if (!product) return null;
                    return (
                      <div key={line.productId} className="pt-2 first:pt-0 flex items-center gap-2.5 text-[11px]">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover border border-terracotta-100 shrink-0"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block text-lacquer-900 font-semibold line-clamp-1">{product.name}</span>
                          <span className="flex items-center gap-1 text-[10px] text-lacquer-800/60">
                            <Store className="w-2.5 h-2.5 text-terracotta-500" />
                            <span className="truncate">{product.storeName}</span>
                          </span>
                        </span>
                        <span className="text-lacquer-800/70 font-medium">x{line.quantity}</span>
                        <strong className="text-terracotta-600 shrink-0">
                          {formatCurrencyVND(product.price * line.quantity)}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                {/* Phí vận chuyển tách theo từng cửa hàng: mỗi cửa hàng xuất hàng từ một địa chỉ riêng */}
                {legs.length > 0 && (
                  <div className="space-y-2 text-[11px] p-3.5 rounded-2xl bg-dopaper-100 border border-terracotta-100">
                    <span className="block font-bold text-lacquer-900 flex items-center justify-between">
                      <span>Các kiện hàng & phí vận chuyển</span>
                      <span className="text-[10px] font-normal text-lacquer-800/60">({legs.length} kiện)</span>
                    </span>
                    {legs.map((leg) => (
                      <div key={leg.storeId} className="flex items-start justify-between gap-2 pt-1 border-t border-terracotta-200/50 first:border-0 first:pt-0">
                        <span className="min-w-0">
                          <span className="block text-lacquer-900 font-semibold truncate">{leg.storeName}</span>
                          <span className="block text-[10px] text-lacquer-800/60">
                            {leg.distanceM != null ? formatDistance(leg.distanceM) : 'khoảng cách tiêu chuẩn'}
                            {leg.usingWarehouseFallback ? ' · xuất từ kho mặc định' : ''}
                          </span>
                        </span>
                        <strong className="shrink-0 text-terracotta-600 font-bold">
                          {leg.freeShipping ? 'Miễn phí' : formatCurrencyVND(leg.fee)}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-2 text-xs border-t border-terracotta-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-lacquer-800/70">Tổng tiền hàng</span>
                    <strong className="text-lacquer-900">{formatCurrencyVND(cart.subtotal)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-lacquer-800/70 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-terracotta-600" />
                      <span>Phí giao hàng ({legs.length || 1} chặng)</span>
                    </span>
                    <strong className="text-lacquer-900">
                      {quoteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin inline" /> : formatCurrencyVND(shippingFee)}
                    </strong>
                  </div>
                  <div className="flex justify-between border-t border-terracotta-200 pt-2 text-sm">
                    <span className="font-bold text-lacquer-900">Tổng thanh toán COD</span>
                    <strong className="text-terracotta-600 text-base font-bold">{formatCurrencyVND(total)}</strong>
                  </div>
                </div>

                {submitError && (
                  <p className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{submitError}</span>
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white text-sm font-bold shadow transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang xử lý đơn hàng...</span>
                    </>
                  ) : (
                    <>
                      <PackageCheck className="w-4 h-4" />
                      <span>Xác nhận đặt hàng COD</span>
                    </>
                  )}
                </button>

                <p className="text-[10px] text-lacquer-800/60 text-center leading-relaxed">
                  Nhận hàng & kiểm tra trước khi thanh toán. Hệ thống lưu snapshot địa chỉ kho xuất hàng và địa chỉ nhận hàng tại thời điểm đặt.
                </p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
