'use client';

/**
 * Đăng ký tài khoản NGƯỜI BÁN.
 *
 * Luồng: điền hồ sơ → máy chủ kiểm tra dữ liệu → tạo tài khoản (mật khẩu băm scrypt) + hồ sơ cửa hàng →
 * cửa hàng ở trạng thái CHỜ DUYỆT (trừ khi chủ sàn bật chế độ tự động kích hoạt) → người bán đăng nhập
 * được ngay để theo dõi, nhưng chỉ đăng bán/xử lý đơn sau khi được duyệt.
 *
 * Địa chỉ cửa hàng có thể chọn trên bản đồ để lấy toạ độ xuất hàng; toạ độ giúp tính phí vận chuyển
 * theo tuyến đường thật từ cửa hàng tới khách.
 */

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, ArrowRight, BadgeCheck, Building2, CheckCircle2, Loader2, MapPin, Store as StoreIcon,
} from 'lucide-react';
import AddressPickerMap, { type AddressSelection } from '@/components/orders/AddressPickerMap';
import { CRAFT_VILLAGES } from '@/data/craftVillages';
import { STORE_STATUS_META } from '@/lib/orders/storeMeta';
import type { Store } from '@/lib/orders/types';

interface WarehouseInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const CATEGORY_OPTIONS = Array.from(new Set(CRAFT_VILLAGES.map((village) => village.category)));

export default function SellerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    contactName: '',
    storeName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    addressText: '',
    description: '',
    logoUrl: '',
    addressNote: '',
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [address, setAddress] = useState<AddressSelection | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseInfo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingStoreError, setExistingStoreError] = useState<{
    message: string;
    storeName?: string;
    redirectUrl: string;
  } | null>(null);
  const [loggedInCustomer, setLoggedInCustomer] = useState<{ email: string; name: string } | null>(null);
  const [created, setCreated] = useState<{ store: Store; autoApproved: boolean; statusMessage: string; note?: string } | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const [configRes, sessionRes] = await Promise.all([
          fetch('/api/config', { cache: 'no-store' }),
          fetch('/api/auth/session', { cache: 'no-store' }),
        ]);
        const configData = await configRes.json();
        if (configData?.ok) setWarehouse(configData.warehouse);

        const sessionData = await sessionRes.json();
        if (sessionData?.authenticated && sessionData.user) {
          setLoggedInCustomer({ email: sessionData.user.email, name: sessionData.user.name || '' });
          setForm((prev) => ({
            ...prev,
            email: prev.email || sessionData.user.email,
            contactName: prev.contactName || sessionData.user.name || '',
          }));
        }
      } catch {
        /* bản đồ vẫn dùng được */
      }
    })();
  }, []);

  const passwordIssue = useMemo(() => {
    if (!form.password) return null;
    if (form.password.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
    if (form.confirmPassword && form.password !== form.confirmPassword) return 'Mật khẩu xác nhận không khớp.';
    return null;
  }, [form.password, form.confirmPassword]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setExistingStoreError(null);

    if (passwordIssue) {
      setError(passwordIssue);
      return;
    }
    const finalAddress = (form.addressText || address?.text || '').trim();
    if (!finalAddress) {
      setError('Vui lòng nhập địa chỉ cụ thể của cửa hàng / xưởng sản xuất.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/seller/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: form.contactName.trim(),
          storeName: form.storeName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          confirmPassword: form.confirmPassword,
          addressText: finalAddress,
          addressNote: form.addressNote.trim() || null,
          description: form.description.trim() || null,
          logoUrl: form.logoUrl.trim() || null,
          categories,
          lat: address?.lat || undefined,
          lng: address?.lng || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data?.error?.code === 'store_exists') {
          setExistingStoreError({
            message: data.error.message,
            storeName: data.error.details?.store?.name,
            redirectUrl: data.error.details?.redirectUrl || '/ban-hang',
          });
        }
        setError(data?.error?.message || 'Không gửi được hồ sơ đăng ký.');
        return;
      }
      setCreated({
        store: data.store,
        autoApproved: Boolean(data.autoApproved),
        statusMessage: data.statusMessage,
        note: data.adminNotification?.error,
      });
    } catch {
      setError('Không kết nối được tới máy chủ để gửi hồ sơ.');
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
        <div className="max-w-2xl w-full bg-white rounded-3xl border border-emerald-200 p-8 space-y-4 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-lacquer-900">Đã gửi hồ sơ đăng ký bán hàng</h1>
          <p className="text-sm text-lacquer-800/75">
            Cửa hàng <strong>{created.store.name}</strong> đang ở trạng thái{' '}
            <strong className={created.autoApproved ? 'text-emerald-700' : 'text-amber-700'}>
              {STORE_STATUS_META[created.store.status].label}
            </strong>
            .
          </p>
          <p className="text-xs text-lacquer-800/70 leading-relaxed">{created.statusMessage}</p>
          {created.note && (
            <p className="text-[11px] text-amber-700 p-3 rounded-2xl bg-amber-50 border border-amber-200">
              Lưu ý: {created.note}
            </p>
          )}
          <div className="text-left text-[11px] p-4 rounded-2xl bg-dopaper-50 border border-terracotta-100 space-y-1.5">
            <span className="font-bold text-lacquer-900 block">Việc tiếp theo</span>
            <p>1. Ban quản trị sàn xem hồ sơ và bật trạng thái “Đang hoạt động” cho cửa hàng.</p>
            <p>2. Trong lúc chờ, bạn có thể đăng nhập để cập nhật hồ sơ, xem trạng thái và chuẩn bị nội dung sản phẩm.</p>
            <p>3. Khi được duyệt, sản phẩm của bạn xuất hiện trên sàn và đơn hàng sẽ chảy về Trung tâm người bán.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => router.push('/ban-hang')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-bold"
            >
              <StoreIcon className="w-4 h-4" />
              Vào Trung tâm người bán
            </button>
            <Link href="/" className="px-5 py-3 rounded-xl border border-terracotta-200 text-lacquer-900 text-sm font-bold">
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-dopaper-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <header className="relative rounded-3xl bg-dopaper-50/90 border border-terracotta-200/90 p-8 sm:p-10 overflow-hidden shadow-xs text-center space-y-3">
          <div className="absolute inset-0 bg-cultural-moon opacity-20 mix-blend-multiply pointer-events-none bg-cover bg-right" />
          <div className="relative z-10 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-terracotta-100 text-terracotta-700 flex items-center justify-center mx-auto shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">Đăng ký bán hàng trên sàn Lang Thang</h1>
            <p className="text-xs text-lacquer-800/70 max-w-2xl mx-auto leading-relaxed">
              Dành cho nghệ nhân, hộ sản xuất và cửa hàng thủ công mỹ nghệ của các làng nghề Hà Nội. Mỗi tài khoản
              có một cửa hàng riêng, đơn hàng được tách theo cửa hàng nên bạn chỉ xử lý phần của mình.
            </p>
          </div>
        </header>

        {loggedInCustomer && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3 text-xs shadow-sm">
            <BadgeCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-emerald-950">
                Đang sử dụng tài khoản khách hàng ({loggedInCustomer.email})
              </p>
              <p className="text-emerald-800 leading-relaxed">
                Hệ thống sẽ nâng cấp tài khoản của bạn thành người bán và tạo hồ sơ cửa hàng. Mọi đơn hàng bạn đã mua trước đây vẫn được giữ nguyên đầy đủ.
              </p>
            </div>
          </div>
        )}

        {existingStoreError && (
          <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-3 shadow-sm">
            <div className="flex items-start gap-3">
              <StoreIcon className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="text-xs space-y-1.5 flex-1">
                <p className="font-bold text-base text-amber-950">Tài khoản này đã có cửa hàng trên sàn!</p>
                <p className="text-amber-800 leading-relaxed">{existingStoreError.message}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href={existingStoreError.redirectUrl}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow"
              >
                <StoreIcon className="w-4 h-4" />
                Vào Trung tâm người bán
              </Link>
              <button
                type="button"
                onClick={() => setExistingStoreError(null)}
                className="px-4 py-2 text-xs font-semibold text-amber-800 hover:text-amber-950"
              >
                Đóng thông báo
              </button>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-lacquer-900">1. Thông tin người bán</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1.5 text-xs">
                  <span className="font-bold text-lacquer-900">Họ và tên người đại diện <span className="text-rose-600">*</span></span>
                  <input
                    required
                    value={form.contactName}
                    onChange={(event) => setForm({ ...form, contactName: event.target.value })}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="font-bold text-lacquer-900">Tên cửa hàng <span className="text-rose-600">*</span></span>
                  <input
                    required
                    value={form.storeName}
                    onChange={(event) => setForm({ ...form, storeName: event.target.value })}
                    placeholder="Gốm Bát Tràng nhà Hải"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="font-bold text-lacquer-900">Email đăng nhập <span className="text-rose-600">*</span></span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm({ ...form, email: event.target.value })}
                    placeholder="cua-hang@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                  <span className="text-[10px] text-lacquer-800/60 block">
                    Email này dùng để đăng nhập, nhận thông báo đơn mới và kết quả xét duyệt.
                  </span>
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="font-bold text-lacquer-900">Số điện thoại <span className="text-rose-600">*</span></span>
                  <input
                    required
                    value={form.phone}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    placeholder="09xx xxx xxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="font-bold text-lacquer-900">Mật khẩu <span className="text-rose-600">*</span></span>
                  <input
                    required
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="Ít nhất 8 ký tự"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                </label>
                <label className="space-y-1.5 text-xs">
                  <span className="font-bold text-lacquer-900">Xác nhận mật khẩu <span className="text-rose-600">*</span></span>
                  <input
                    required
                    type="password"
                    value={form.confirmPassword}
                    onChange={(event) => setForm({ ...form, confirmPassword: event.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                  />
                  {passwordIssue && <span className="text-[10px] text-rose-600 block">{passwordIssue}</span>}
                </label>
              </div>
            </section>

            <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-lg font-bold text-lacquer-900">2. Địa chỉ xuất hàng của cửa hàng</h2>
                <span className="text-[10px] text-lacquer-800/60 flex items-center gap-1 text-right">
                  <MapPin className="w-3 h-3" />
                  Chọn trên bản đồ để có toạ độ chính xác
                </span>
              </div>

              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">
                  Địa chỉ chi tiết của cửa hàng / xưởng <span className="text-rose-600">*</span>
                </span>
                <input
                  required
                  value={form.addressText}
                  onChange={(event) => {
                    const text = event.target.value;
                    setForm((prev) => ({ ...prev, addressText: text }));
                    if (address) setAddress({ ...address, text });
                  }}
                  placeholder="Ví dụ: Số 24 ngõ 3 xóm 5 làng Bát Tràng, Gia Lâm, Hà Nội"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500 font-medium"
                />
                <span className="text-[10px] text-lacquer-800/60 block">
                  Nhập địa chỉ đầy đủ (hoặc tìm kiếm trên bản đồ bên dưới) để bên vận chuyển đến lấy hàng và giao nhận.
                </span>
              </label>

              <AddressPickerMap
                value={address}
                onChange={(selection) => {
                  setAddress(selection);
                  if (selection?.text) {
                    setForm((prev) => ({ ...prev, addressText: selection.text }));
                  }
                }}
                warehouse={warehouse}
              />

              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">Ghi chú địa chỉ (số nhà, xóm, xưởng...)</span>
                <input
                  value={form.addressNote}
                  onChange={(event) => setForm({ ...form, addressNote: event.target.value })}
                  placeholder="Gần đình làng, cạnh cổng chùa, xưởng sau..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>
              <p className="text-[10px] text-lacquer-800/60 leading-relaxed">
                Toạ độ này là điểm xuất hàng của cửa hàng bạn và được dùng để tính tuyến đường, phí vận chuyển
                cho từng đơn. Không lấy vị trí hiện tại của bạn làm địa chỉ giao hàng của khách.
              </p>
            </section>

            <section className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4">
              <h2 className="font-serif text-lg font-bold text-lacquer-900">3. Giới thiệu cửa hàng</h2>

              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">Mô tả cửa hàng</span>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Nghề truyền thống, số năm làm nghề, xưởng sản xuất, sản phẩm chủ lực..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>

              <div className="space-y-2">
                <span className="text-xs font-bold text-lacquer-900 block">Nhóm sản phẩm dự định kinh doanh</span>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((category) => {
                    const active = categories.includes(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setCategories((prev) =>
                            prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
                          )
                        }
                        className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold transition-colors ${
                          active
                            ? 'bg-terracotta-50 border-terracotta-300 text-terracotta-700'
                            : 'bg-white border-terracotta-200 text-lacquer-900 hover:bg-dopaper-50'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">Logo/ảnh đại diện cửa hàng (đường dẫn, tuỳ chọn)</span>
                <input
                  value={form.logoUrl}
                  onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
                  placeholder="https://... — sau khi đăng nhập bạn có thể tải logo lên trong Hồ sơ cửa hàng"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>
            </section>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 lg:sticky lg:top-28">
              <h2 className="font-serif text-lg font-bold text-lacquer-900">Hoàn tất đăng ký</h2>

              <ul className="text-[11px] text-lacquer-800/75 space-y-2">
                <li className="flex items-start gap-2">
                  <BadgeCheck className="w-3.5 h-3.5 text-terracotta-600 mt-0.5" />
                  <span>Mật khẩu được băm bằng scrypt ở máy chủ; hệ thống không lưu mật khẩu thô.</span>
                </li>
                <li className="flex items-start gap-2">
                  <BadgeCheck className="w-3.5 h-3.5 text-terracotta-600 mt-0.5" />
                  <span>Hồ sơ mặc định ở trạng thái chờ duyệt; ban quản trị sàn duyệt trước khi bạn đăng bán.</span>
                </li>
                <li className="flex items-start gap-2">
                  <BadgeCheck className="w-3.5 h-3.5 text-terracotta-600 mt-0.5" />
                  <span>Tài khoản người bán chỉ truy cập được dữ liệu cửa hàng mình.</span>
                </li>
              </ul>

              {error && (
                <p className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white text-sm font-bold"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <StoreIcon className="w-4 h-4" />}
                Gửi hồ sơ đăng ký
              </button>

              <div className="pt-3 border-t border-terracotta-100 space-y-2 text-center">
                <p className="text-[11px] text-lacquer-800/70">Đã có tài khoản người bán?</p>
                <Link
                  href="/ban-hang/dang-nhap"
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-900"
                >
                  Đăng nhập người bán
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
