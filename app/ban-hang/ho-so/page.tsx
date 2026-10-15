'use client';

/**
 * Hồ sơ cửa hàng.
 *
 * Điểm quan trọng: địa chỉ + toạ độ xuất hàng ở đây quyết định CHẶNG GIAO HÀNG của cửa hàng bạn (mỗi
 * cửa hàng xuất hàng từ một điểm riêng). Toạ độ phải đi theo cặp vĩ độ/kinh độ; nếu bỏ trống, hệ thống
 * dùng kho mặc định của sàn và ghi rõ điều đó trên từng đơn.
 *
 * Thay đổi hồ sơ KHÔNG làm thay đổi đơn cũ: mỗi đơn con đã lưu bản chụp tên/địa chỉ cửa hàng tại thời
 * điểm khách đặt hàng.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, MapPin, Save, Store as StoreIcon } from 'lucide-react';
import AddressPickerMap, { type AddressSelection } from '@/components/orders/AddressPickerMap';
import { updateStoreProfile, uploadSellerImage } from '@/lib/client/sellerApi';
import { useSeller } from '@/components/seller/SellerGate';
import { STORE_STATUS_META } from '@/lib/orders/storeMeta';

interface WarehouseInfo {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export default function SellerProfilePage() {
  const { state, refresh } = useSeller();
  const store = state?.store || null;

  const [form, setForm] = useState({
    name: '',
    description: '',
    contactName: '',
    phone: '',
    addressNote: '',
    logoUrl: '',
    categories: '',
  });
  const [origin, setOrigin] = useState<AddressSelection | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseInfo | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!store) return;
    setForm({
      name: store.name || '',
      description: store.description || '',
      contactName: store.contactName || '',
      phone: store.phone || '',
      addressNote: store.addressNote || '',
      logoUrl: store.logoUrl || '',
      categories: store.categories.join(', '),
    });
    setOrigin(
      store.addressText
        ? {
            text: store.addressText,
            lat: store.lat ?? 0,
            lng: store.lng ?? 0,
            source: 'manual',
          }
        : null
    );
  }, [store]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/config', { cache: 'no-store' });
        const data = await res.json();
        if (data?.ok) setWarehouse(data.warehouse);
      } catch {
        /* bản đồ vẫn dùng được, chỉ thiếu điểm mốc kho */
      }
    })();
  }, []);

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const result = await uploadSellerImage(file);
      setForm((prev) => ({ ...prev, logoUrl: result.url }));
      setNotice('Đã tải logo lên hệ thống lưu trữ. Nhớ bấm “Lưu hồ sơ” để áp dụng.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được logo.');
    } finally {
      setUploading(false);
    }
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      contactName: form.contactName.trim() || null,
      phone: form.phone.trim() || null,
      addressNote: form.addressNote.trim() || null,
      logoUrl: form.logoUrl.trim() || null,
      categories: form.categories
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    };

    if (origin) {
      payload.addressText = origin.text;
      // Toạ độ 0/0 nghĩa là người bán chưa chọn vị trí trên bản đồ -> chỉ lưu địa chỉ văn bản.
      if (origin.lat !== 0 || origin.lng !== 0) {
        payload.lat = origin.lat;
        payload.lng = origin.lng;
      }
    }

    try {
      setSaving(true);
      const result = await updateStoreProfile(payload);
      setNotice(`Đã lưu hồ sơ cửa hàng. ${result.note}`);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Không lưu được hồ sơ cửa hàng.');
    } finally {
      setSaving(false);
    }
  };

  const hasOrigin = Boolean(origin && (origin.lat !== 0 || origin.lng !== 0));

  return (
    <form onSubmit={save} className="space-y-5">
      <section className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-4">
        <h1 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
          <StoreIcon className="w-4 h-4 text-terracotta-600" />
          Hồ sơ cửa hàng
        </h1>

        {store && (
          <p className="text-[11px] text-lacquer-800/70">
            Trạng thái do ban quản trị sàn quyết định:{' '}
            <strong className="text-lacquer-900">{STORE_STATUS_META[store.status].label}</strong> — bạn không thể
            tự đổi trạng thái này.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="space-y-1.5 text-xs">
            <span className="font-bold text-lacquer-900">Tên cửa hàng</span>
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
            />
          </label>
          <label className="space-y-1.5 text-xs">
            <span className="font-bold text-lacquer-900">Người đại diện</span>
            <input
              value={form.contactName}
              onChange={(event) => setForm({ ...form, contactName: event.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
            />
          </label>
          <label className="space-y-1.5 text-xs">
            <span className="font-bold text-lacquer-900">Điện thoại</span>
            <input
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              placeholder="09xx xxx xxx"
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
            />
          </label>
          <label className="space-y-1.5 text-xs">
            <span className="font-bold text-lacquer-900">Nhóm sản phẩm kinh doanh</span>
            <input
              value={form.categories}
              onChange={(event) => setForm({ ...form, categories: event.target.value })}
              placeholder="Gốm sứ, Quà tặng di sản"
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
            />
            <span className="text-[10px] text-lacquer-800/60 block">Phân tách bằng dấu phẩy, tối đa 10 nhóm.</span>
          </label>
        </div>

        <label className="space-y-1.5 text-xs block">
          <span className="font-bold text-lacquer-900">Mô tả cửa hàng</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Giới thiệu nghề truyền thống, xưởng sản xuất, điểm mạnh sản phẩm..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-lacquer-900 block">Logo cửa hàng</span>
            {form.logoUrl ? (
              <img
                src={form.logoUrl}
                alt="Logo cửa hàng"
                className="w-full aspect-square rounded-2xl object-cover border border-terracotta-100"
              />
            ) : (
              <div className="w-full aspect-square rounded-2xl bg-dopaper-50 border border-dashed border-terracotta-200 flex items-center justify-center text-[10px] text-lacquer-800/60 text-center px-3">
                Chưa có logo
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="space-y-1.5 text-xs block">
              <span className="font-bold text-lacquer-900 flex items-center gap-1.5">
                <ImagePlus className="w-3.5 h-3.5 text-terracotta-600" />
                Tải logo lên
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => handleUpload(event.target.files?.[0] || null)}
                className="text-[11px]"
              />
              {uploading && (
                <span className="flex items-center gap-1.5 text-[10px] text-lacquer-800/70">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang tải logo...
                </span>
              )}
            </label>
            <label className="space-y-1.5 text-xs block">
              <span className="font-bold text-lacquer-900">Hoặc dán đường dẫn logo</span>
              <input
                value={form.logoUrl}
                onChange={(event) => setForm({ ...form, logoUrl: event.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-terracotta-600" />
            Địa chỉ xuất hàng của cửa hàng
          </h2>
          <span className="text-[10px] text-lacquer-800/60 text-right">
            Dùng để tính tuyến đường và phí vận chuyển cho đơn của cửa hàng bạn
          </span>
        </div>

        <AddressPickerMap value={origin} onChange={setOrigin} warehouse={warehouse} />

        <label className="space-y-1.5 text-xs block">
          <span className="font-bold text-lacquer-900">Ghi chú địa chỉ (số nhà, ngõ, xưởng...)</span>
          <input
            value={form.addressNote}
            onChange={(event) => setForm({ ...form, addressNote: event.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
          />
        </label>

        <p className="text-[10px] text-lacquer-800/60 leading-relaxed">
          {hasOrigin
            ? `Đã có toạ độ xuất hàng: ${origin?.lat.toFixed(5)}, ${origin?.lng.toFixed(5)} — tuyến đường giao hàng sẽ tính từ điểm này.`
            : 'Chưa chọn toạ độ trên bản đồ: hệ thống sẽ dùng kho mặc định của sàn để tính phí và ghi rõ điều đó trên đơn hàng của bạn.'}
        </p>
      </section>

      <section className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-3">
        {error && (
          <p className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
            {error}
          </p>
        )}
        {notice && (
          <p className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5" />
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white text-sm font-bold"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Lưu hồ sơ
        </button>
      </section>
    </form>
  );
}
