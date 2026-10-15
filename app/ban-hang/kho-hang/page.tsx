'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Warehouse as WarehouseIcon,
  Plus,
  MapPin,
  Phone,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Trash2,
  Star,
  Edit2,
  X,
  Navigation,
} from 'lucide-react';
import type { Warehouse } from '@/lib/orders/types';
import { useSeller } from '@/components/seller/SellerGate';

interface WarehouseWithUsage extends Warehouse {
  inUseCount?: number;
}

export default function SellerWarehousesPage() {
  const { state } = useSeller();
  const [warehouses, setWarehouses] = useState<WarehouseWithUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Form modal / collapse state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [addressText, setAddressText] = useState('');
  const [addressNote, setAddressNote] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);

  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/seller/warehouses');
      const data = await res.json();
      if (!data.ok) {
        setError(data.message || 'Không thể tải danh sách kho hàng.');
        return;
      }
      setWarehouses(data.warehouses || []);
    } catch {
      setError('Lỗi kết nối khi tải danh sách kho hàng.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  const resetForm = () => {
    setName('');
    setAddressText('');
    setAddressNote('');
    setContactName('');
    setPhone('');
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

  const openEdit = (wh: Warehouse) => {
    setEditingId(wh.id);
    setName(wh.name);
    setAddressText(wh.addressText);
    setAddressNote(wh.addressNote || '');
    setContactName(wh.contactName || '');
    setPhone(wh.phone || '');
    setIsDefault(wh.isDefault);
    setLat(wh.lat ?? null);
    setLng(wh.lng ?? null);
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
        alert('Không thể lấy tọa độ hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
      }
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);

    if (!name.trim() || !addressText.trim()) {
      setError('Vui lòng nhập tên kho và địa chỉ chi tiết.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: name.trim(),
        addressText: addressText.trim(),
        addressNote: addressNote.trim() || null,
        contactName: contactName.trim() || null,
        phone: phone.trim() || null,
        isDefault,
        lat,
        lng,
      };

      const url = editingId ? `/api/seller/warehouses/${editingId}` : '/api/seller/warehouses';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || 'Lỗi khi lưu kho hàng.');
      }

      setNotice(editingId ? 'Đã cập nhật kho hàng.' : 'Đã thêm kho mới thành công.');
      resetForm();
      await fetchWarehouses();
    } catch (err: any) {
      setError(err?.message || 'Không thể lưu kho hàng.');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (wh: Warehouse) => {
    if (wh.isDefault) return;
    try {
      setError(null);
      const res = await fetch(`/api/seller/warehouses/${wh.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setNotice(`Đã đặt "${wh.name}" làm kho xuất hàng mặc định.`);
      await fetchWarehouses();
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt làm kho mặc định.');
    }
  };

  const handleDelete = async (wh: Warehouse) => {
    if (wh.isDefault) {
      alert('Không thể xóa kho mặc định. Vui lòng đặt kho khác làm mặc định trước.');
      return;
    }
    if (!confirm(`Bạn có chắc muốn xóa kho "${wh.name}"? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    try {
      setDeletingId(wh.id);
      setError(null);
      const res = await fetch(`/api/seller/warehouses/${wh.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) {
        throw new Error(data.message || 'Không thể xóa kho hàng.');
      }
      setNotice('Đã xóa kho hàng thành công.');
      await fetchWarehouses();
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi xóa kho hàng.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Giới thiệu */}
      <div className="bg-white rounded-3xl border border-terracotta-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <WarehouseIcon className="w-5 h-5 text-terracotta-600" />
            <h1 className="font-serif text-xl font-bold text-lacquer-900">
              Kho hàng &amp; Điểm xuất hàng
            </h1>
          </div>
          <p className="text-xs text-lacquer-800/70 mt-1 max-w-2xl leading-relaxed">
            Mỗi cửa hàng có thể thiết lập nhiều kho (xưởng sản xuất, kho chính, điểm tập kết hàng).
            Khi đăng sản phẩm, bạn có thể chọn kho xuất phát riêng để tính tuyến đường và phí vận chuyển chính xác nhất.
          </p>
        </div>

        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-all shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm kho mới</span>
        </button>
      </div>

      {/* Thông báo lỗi / thành công */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Form thêm / sửa kho */}
      {showForm && (
        <div className="bg-white rounded-3xl border-2 border-terracotta-300 p-6 space-y-5 shadow-md animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-terracotta-100">
            <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
              <WarehouseIcon className="w-4 h-4 text-terracotta-600" />
              {editingId ? 'Chỉnh sửa thông tin kho' : 'Thêm điểm xuất hàng mới'}
            </h2>
            <button
              onClick={resetForm}
              className="p-1 rounded-lg text-lacquer-800/50 hover:bg-dopaper-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">
                  Tên kho / xưởng <span className="text-rose-600">*</span>
                </span>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Xưởng gốm Bát Tràng (Kho chính), Kho phụ Hà Đông..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>

              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">
                  Địa chỉ xuất hàng chi tiết <span className="text-rose-600">*</span>
                </span>
                <input
                  required
                  value={addressText}
                  onChange={(e) => setAddressText(e.target.value)}
                  placeholder="Số nhà, ngõ/thôn, xã/phường, quận/huyện, Hà Nội"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>
            </div>

            <label className="space-y-1.5 text-xs block">
              <span className="font-bold text-lacquer-900">Chỉ dẫn lấy hàng / Lưu ý giao vận</span>
              <input
                value={addressNote}
                onChange={(e) => setAddressNote(e.target.value)}
                placeholder="VD: Đi vào cổng làng 200m rẽ phải, xe tải 2.5 tấn vào được..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">Người phụ trách kho</span>
                <input
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Họ tên thủ kho / nghệ nhân phụ trách"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>

              <label className="space-y-1.5 text-xs block">
                <span className="font-bold text-lacquer-900">Số điện thoại liên hệ xuất hàng</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912345678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                />
              </label>
            </div>

            <div className="p-3.5 rounded-2xl bg-dopaper-50 border border-terracotta-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div>
                <span className="font-bold text-lacquer-900 block">Tọa độ GPS điểm lấy hàng</span>
                <span className="text-[11px] text-lacquer-800/60">
                  {lat && lng ? `Đã ghim: ${lat}, ${lng}` : 'Chưa có tọa độ GPS (hệ thống sẽ tra cứu theo địa chỉ văn bản)'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-terracotta-200 text-[11px] font-bold text-terracotta-600 hover:bg-dopaper-100 shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Lấy vị trí GPS hiện tại</span>
              </button>
            </div>

            <label className="flex items-center gap-2 text-xs pt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="w-4 h-4 rounded text-terracotta-600 border-terracotta-300 focus:ring-terracotta-500"
              />
              <span className="font-bold text-lacquer-900">
                Đặt làm kho xuất hàng mặc định của cửa hàng
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2.5 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-800 hover:bg-dopaper-50"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white text-xs font-bold shadow-sm"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{editingId ? 'Cập nhật kho' : 'Lưu kho mới'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Danh sách kho hàng */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-terracotta-200 p-12 flex items-center justify-center gap-2 text-xs text-lacquer-800/60">
          <Loader2 className="w-4 h-4 animate-spin text-terracotta-600" />
          <span>Đang tải danh sách kho...</span>
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-3">
          <WarehouseIcon className="w-12 h-12 text-lacquer-800/40 mx-auto" />
          <h3 className="font-serif text-base font-bold text-lacquer-900">Chưa có kho hàng nào</h3>
          <p className="text-xs text-lacquer-800/70 max-w-md mx-auto">
            Hãy thêm kho hàng đầu tiên để bắt đầu đăng sản phẩm và xuất đơn tới khách hàng.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold hover:bg-terracotta-600"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm kho ngay</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className={`bg-white rounded-3xl border p-5 sm:p-6 space-y-4 shadow-xs transition-all relative ${
                wh.isDefault ? 'border-terracotta-400 ring-1 ring-terracotta-300' : 'border-terracotta-200'
              }`}
            >
              {/* Header kho */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-serif text-base font-bold text-lacquer-900">{wh.name}</h3>
                    {wh.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-terracotta-100 text-terracotta-800 border border-terracotta-200 text-[10px] font-bold">
                        <Star className="w-3 h-3 fill-terracotta-600 text-terracotta-600" />
                        Kho mặc định
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-lacquer-800/70 flex items-start gap-1.5 pt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-terracotta-600 shrink-0 mt-0.5" />
                    <span>{wh.addressText}</span>
                  </p>
                </div>
              </div>

              {wh.addressNote && (
                <div className="p-3 rounded-xl bg-dopaper-50 border border-terracotta-100 text-[11px] text-lacquer-800/70">
                  <strong>Chỉ dẫn:</strong> {wh.addressNote}
                </div>
              )}

              {/* Thông tin liên hệ */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-lacquer-800/80 pt-1">
                {wh.contactName && (
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-lacquer-800/50" />
                    <span>Phụ trách: <strong>{wh.contactName}</strong></span>
                  </div>
                )}
                {wh.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-lacquer-800/50" />
                    <span>SĐT: <strong>{wh.phone}</strong></span>
                  </div>
                )}
              </div>

              {/* Actions footer */}
              <div className="pt-3 border-t border-terracotta-100 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {!wh.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(wh)}
                      className="text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700 hover:underline"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(wh)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-terracotta-200 text-xs font-semibold text-lacquer-800 hover:bg-dopaper-50"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>

                  {!wh.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDelete(wh)}
                      disabled={deletingId === wh.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {deletingId === wh.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Trash2 className="w-3 h-3" />
                      )}
                      <span>Xóa</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
