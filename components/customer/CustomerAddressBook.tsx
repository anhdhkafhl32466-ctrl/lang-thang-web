'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Edit2,
  X,
  Home,
  GraduationCap,
  Building,
  Navigation,
} from 'lucide-react';
import type { CustomerAddress, AddressLabel } from '@/lib/orders/types';

const LABELS: AddressLabel[] = ['Nhà riêng', 'Trường học', 'Ký túc xá', 'Công ty', 'Khác'];

function LabelBadge({ label }: { label: string }) {
  if (label === 'Nhà riêng') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
        <Home className="w-3 h-3" />
        Nhà riêng
      </span>
    );
  }
  if (label === 'Trường học' || label === 'Ký túc xá') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
        <GraduationCap className="w-3 h-3" />
        {label}
      </span>
    );
  }
  if (label === 'Công ty') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
        <Building className="w-3 h-3" />
        Công ty
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 text-gray-700 border border-gray-200 text-[10px] font-bold">
      <MapPin className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function CustomerAddressBook() {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressText, setAddressText] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [label, setLabel] = useState<string>('Nhà riêng');
  const [isDefault, setIsDefault] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/customer/addresses');
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || 'Không thể tải sổ địa chỉ.');
        return;
      }
      setAddresses(data.addresses || []);
    } catch {
      setError('Lỗi khi kết nối đến máy chủ sổ địa chỉ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const resetForm = () => {
    setRecipientName('');
    setPhone('');
    setAddressText('');
    setAddressNote('');
    setLabel('Nhà riêng');
    setIsDefault(false);
    setLat(null);
    setLng(null);
    setEditingId(null);
    setShowForm(false);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (addr: CustomerAddress) => {
    setEditingId(addr.id);
    setRecipientName(addr.recipientName);
    setPhone(addr.phone);
    setAddressText(addr.addressText);
    setAddressNote(addr.addressNote || '');
    setLabel(addr.label || 'Nhà riêng');
    setIsDefault(addr.isDefault);
    setLat(addr.lat ?? null);
    setLng(addr.lng ?? null);
    setShowForm(true);
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Trình duyệt không hỗ trợ định vị GPS.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
      },
      () => {
        alert('Không thể lấy tọa độ hiện tại. Vui lòng cho phép truy cập vị trí.');
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!recipientName.trim() || !phone.trim() || !addressText.trim()) {
      setError('Vui lòng điền đủ người nhận, số điện thoại và địa chỉ giao hàng.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        recipientName: recipientName.trim(),
        phone: phone.trim(),
        addressText: addressText.trim(),
        addressNote: addressNote.trim() || null,
        label,
        isDefault,
        lat,
        lng,
      };

      const url = editingId ? `/api/customer/addresses/${editingId}` : '/api/customer/addresses';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.message || 'Lỗi khi lưu địa chỉ.');

      setNotice(editingId ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ nhận hàng mới.');
      resetForm();
      await fetchAddresses();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (addr: CustomerAddress) => {
    if (addr.isDefault) return;
    try {
      setError(null);
      const res = await fetch(`/api/customer/addresses/${addr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setNotice(`Đã đặt địa chỉ "${addr.addressText}" làm mặc định khi thanh toán.`);
      await fetchAddresses();
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt địa chỉ mặc định.');
    }
  };

  const handleDelete = async (addr: CustomerAddress) => {
    if (!confirm(`Bạn có chắc muốn xóa địa chỉ "${addr.addressText}"?`)) return;
    try {
      setDeletingId(addr.id);
      setError(null);
      const res = await fetch(`/api/customer/addresses/${addr.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setNotice('Đã xóa địa chỉ nhận hàng.');
      await fetchAddresses();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi xóa địa chỉ.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-terracotta-200 shadow-md space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-terracotta-100">
        <div>
          <h3 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-terracotta-600" />
            <span>Sổ địa chỉ nhận hàng của bạn</span>
          </h3>
          <p className="text-xs text-lacquer-800/60 mt-0.5">
            Lưu sẵn nhiều địa chỉ giao hàng (Nhà riêng, Trường học, Ký túc xá, Công ty...) để chọn nhanh khi thanh toán.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-all shadow-sm shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Thêm địa chỉ mới</span>
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Form modal / inline */}
      {showForm && (
        <div className="p-5 rounded-2xl bg-dopaper-50 border-2 border-terracotta-300 space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-terracotta-200">
            <span className="font-serif text-sm font-bold text-lacquer-900">
              {editingId ? 'Chỉnh sửa địa chỉ nhận hàng' : 'Thêm địa chỉ nhận hàng mới'}
            </span>
            <button onClick={resetForm} className="p-1 rounded-lg text-lacquer-800/50 hover:bg-dopaper-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-xs block">
                <span className="font-bold text-lacquer-900">Họ và tên người nhận <span className="text-rose-600">*</span></span>
                <input
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-terracotta-200 text-xs bg-white focus:outline-none focus:border-terracotta-500"
                />
              </label>

              <label className="space-y-1 text-xs block">
                <span className="font-bold text-lacquer-900">Số điện thoại nhận hàng <span className="text-rose-600">*</span></span>
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3 py-2 rounded-xl border border-terracotta-200 text-xs bg-white focus:outline-none focus:border-terracotta-500"
                />
              </label>
            </div>

            <label className="space-y-1 text-xs block">
              <span className="font-bold text-lacquer-900">Địa chỉ chi tiết <span className="text-rose-600">*</span></span>
              <input
                required
                value={addressText}
                onChange={(e) => setAddressText(e.target.value)}
                placeholder="Số nhà, ngõ, ngách, tên đường, phường/xã, quận/huyện, Hà Nội"
                className="w-full px-3 py-2 rounded-xl border border-terracotta-200 text-xs bg-white focus:outline-none focus:border-terracotta-500"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 text-xs block">
                <span className="font-bold text-lacquer-900">Nhãn địa chỉ</span>
                <select
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-terracotta-200 text-xs bg-white focus:outline-none focus:border-terracotta-500"
                >
                  {LABELS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 text-xs block">
                <span className="font-bold text-lacquer-900">Ghi chú giao hàng</span>
                <input
                  value={addressNote}
                  onChange={(e) => setAddressNote(e.target.value)}
                  placeholder="VD: Gọi trước khi giao, gửi bảo vệ tòa nhà..."
                  className="w-full px-3 py-2 rounded-xl border border-terracotta-200 text-xs bg-white focus:outline-none focus:border-terracotta-500"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-white border border-terracotta-100 text-xs">
              <span className="text-[11px] text-lacquer-800/70">
                {lat && lng ? `Tọa độ GPS: ${lat}, ${lng}` : 'Chưa lưu tọa độ GPS'}
              </span>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-terracotta-200 text-[10px] font-bold text-terracotta-600 hover:bg-dopaper-50"
              >
                <Navigation className="w-3 h-3" />
                <span>Gán vị trí hiện tại</span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-terracotta-600 border-terracotta-300"
              />
              <span className="font-bold text-lacquer-900">Đặt làm địa chỉ nhận hàng mặc định</span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-800 hover:bg-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow-sm disabled:opacity-50"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingId ? 'Lưu thay đổi' : 'Thêm địa chỉ'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách địa chỉ */}
      {loading ? (
        <div className="py-12 flex items-center justify-center gap-2 text-xs text-lacquer-800/60">
          <Loader2 className="w-4 h-4 animate-spin text-terracotta-600" />
          <span>Đang tải sổ địa chỉ...</span>
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-10 text-center space-y-3 bg-dopaper-50/50 rounded-2xl border border-dashed border-terracotta-200">
          <MapPin className="w-8 h-8 text-lacquer-800/40 mx-auto" />
          <p className="text-xs text-lacquer-800/70">
            Bạn chưa lưu địa chỉ nhận hàng nào. Hãy thêm địa chỉ để thanh toán nhanh hơn!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-4 rounded-2xl border bg-white space-y-2.5 transition-all relative ${
                addr.isDefault ? 'border-terracotta-400 ring-1 ring-terracotta-300' : 'border-terracotta-200'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-xs text-lacquer-900">{addr.recipientName}</span>
                  <span className="text-xs text-lacquer-800/70">({addr.phone})</span>
                  <LabelBadge label={addr.label} />
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-terracotta-100 text-terracotta-800 text-[10px] font-bold">
                      <Star className="w-3 h-3 fill-terracotta-600 text-terracotta-600" />
                      Mặc định
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-lacquer-800/80 leading-relaxed">{addr.addressText}</p>
              {addr.addressNote && (
                <p className="text-[11px] text-lacquer-800/60 italic">Ghi chú: {addr.addressNote}</p>
              )}

              <div className="pt-2 border-t border-terracotta-100 flex items-center justify-between text-xs">
                {!addr.isDefault ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr)}
                    className="text-[11px] font-bold text-terracotta-600 hover:underline"
                  >
                    Đặt làm mặc định
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(addr)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-lacquer-800 hover:text-terracotta-600"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addr)}
                    disabled={deletingId === addr.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 disabled:opacity-50"
                  >
                    {deletingId === addr.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    <span>Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
