'use client';

/**
 * Đăng sản phẩm mới / sửa sản phẩm của cửa hàng.
 *
 * Một biểu mẫu dùng cho cả hai việc: có `?id=` là sửa, không có là tạo mới. Nhờ vậy bộ kiểm tra dữ liệu
 * và giao diện luôn giống nhau, không có đường nào lỏng hơn đường nào.
 *
 * Lưu ý quan trọng cho người bán: giá và tồn kho do máy chủ kiểm tra lại; cửa hàng chưa được duyệt thì
 * API sẽ từ chối đăng sản phẩm (giao diện cũng chặn trước để không gây hiểu nhầm).
 */

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ImagePlus, Loader2, PackagePlus, Save, Upload, Warehouse as WarehouseIcon,
} from 'lucide-react';
import { CRAFT_VILLAGES } from '@/data/craftVillages';
import { createProduct, fetchMyProducts, updateProduct, uploadSellerImage } from '@/lib/client/sellerApi';
import { useSeller } from '@/components/seller/SellerGate';
import type { Warehouse } from '@/lib/orders/types';

interface FormState {
  name: string;
  villageId: string;
  category: string;
  price: string;
  stock: string;
  description: string;
  image: string;
  material: string;
  dimensions: string;
  artisanName: string;
  weightG: string;
  preparationDays: string;
  warehouseId: string;
  active: boolean;
}

const EMPTY: FormState = {
  name: '',
  villageId: CRAFT_VILLAGES[0]?.id || '',
  category: CRAFT_VILLAGES[0]?.category || '',
  price: '',
  stock: '10',
  description: '',
  image: '',
  material: '',
  dimensions: '',
  artisanName: '',
  weightG: '',
  preparationDays: '',
  warehouseId: '',
  active: true,
};

function ProductForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editingId = searchParams.get('id');
  const { state } = useSeller();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(Boolean(editingId));
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/seller/warehouses')
      .then((res) => res.json())
      .then((data) => {
        if (data?.ok && Array.isArray(data?.warehouses)) {
          setWarehouses(data.warehouses);
        }
      })
      .catch(() => {});
  }, []);

  const loadForEdit = useCallback(async () => {
    if (!editingId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyProducts();
      const product = data.products.find((item) => item.id === editingId);
      if (!product) {
        setError('Không tìm thấy sản phẩm này trong cửa hàng của bạn.');
        return;
      }
      setForm({
        name: product.name,
        villageId: product.villageId,
        category: product.category,
        price: String(product.price),
        stock: String(product.stock),
        description: product.description || '',
        image: product.image,
        material: product.material || '',
        dimensions: product.dimensions || '',
        artisanName: product.artisanName || '',
        weightG: product.weightG ? String(product.weightG) : '',
        preparationDays: product.preparationDays != null ? String(product.preparationDays) : '',
        warehouseId: product.warehouseId || '',
        active: product.active,
      });
    } catch (err: any) {
      setError(err?.message || 'Không tải được sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, [editingId]);

  useEffect(() => {
    loadForEdit();
  }, [loadForEdit]);

  const selectedVillage = useMemo(
    () => CRAFT_VILLAGES.find((village) => village.id === form.villageId),
    [form.villageId]
  );

  const canSell = state?.canSell ?? false;

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const result = await uploadSellerImage(file);
      setForm((prev) => ({ ...prev, image: result.url }));
      setNotice('Đã tải ảnh lên hệ thống lưu trữ.');
    } catch (err: any) {
      setError(err?.message || 'Không tải được ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      villageId: form.villageId,
      category: form.category.trim() || selectedVillage?.category,
      price: Number(form.price),
      stock: Number(form.stock),
      description: form.description.trim() || null,
      image: form.image.trim(),
      material: form.material.trim() || null,
      dimensions: form.dimensions.trim() || null,
      artisanName: form.artisanName.trim() || null,
      weightG: form.weightG ? Number(form.weightG) : null,
      preparationDays: form.preparationDays ? Number(form.preparationDays) : null,
      warehouseId: form.warehouseId ? form.warehouseId : null,
      active: form.active,
    };

    if (!payload.image) {
      setError('Vui lòng tải ảnh sản phẩm lên hoặc dán đường dẫn ảnh trước khi lưu.');
      return;
    }

    try {
      setSaving(true);
      if (editingId) {
        await updateProduct(editingId, payload);
        setNotice('Đã lưu thay đổi sản phẩm.');
        router.push('/ban-hang/san-pham');
      } else {
        await createProduct(payload);
        setNotice('Đã đăng sản phẩm mới. Sản phẩm sẽ hiển thị trên sàn khi cửa hàng đang hoạt động.');
        setForm({ ...EMPTY, villageId: form.villageId, category: form.category });
      }
    } catch (err: any) {
      setError(err?.message || 'Không lưu được sản phẩm.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
        <Loader2 className="w-4 h-4 animate-spin" />
        Đang tải sản phẩm...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link href="/ban-hang/san-pham" className="inline-flex items-center gap-1.5 text-[11px] font-bold text-terracotta-600">
          <ArrowLeft className="w-3.5 h-3.5" />
          Danh sách sản phẩm
        </Link>
        <span className="text-[11px] text-lacquer-800/60">Cửa hàng: {state?.store?.name}</span>
      </div>

      {!canSell && (
        <p className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
          <span>
            Cửa hàng đang ở trạng thái “{state?.store ? state.store.status : ''}”. Bạn vẫn có thể chuẩn bị nội
            dung sản phẩm, nhưng hệ thống sẽ từ chối lưu cho tới khi cửa hàng được duyệt và đang hoạt động.
          </span>
        </p>
      )}

      <form onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-4">
            <h1 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
              <PackagePlus className="w-4 h-4 text-terracotta-600" />
              {editingId ? 'Sửa sản phẩm' : 'Đăng sản phẩm mới'}
            </h1>

            <label className="space-y-1.5 text-xs block">
              <span className="font-bold text-lacquer-900">Tên sản phẩm <span className="text-rose-600">*</span></span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="VD: Bình gốm men rạn vẽ vàng kim"
                className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Làng nghề <span className="text-rose-600">*</span></span>
                <select
                  value={form.villageId}
                  onChange={(event) => {
                    const village = CRAFT_VILLAGES.find((item) => item.id === event.target.value);
                    setForm({ ...form, villageId: event.target.value, category: village?.category || form.category });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                >
                  {CRAFT_VILLAGES.map((village) => (
                    <option key={village.id} value={village.id}>
                      {village.name}
                    </option>
                  ))}
                </select>
                {selectedVillage && (
                  <span className="text-[10px] text-lacquer-800/60 block">
                    {selectedVillage.category} · {selectedVillage.location.district}, {selectedVillage.location.city}
                  </span>
                )}
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Danh mục hiển thị</span>
                <input
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Giá bán (VNĐ) <span className="text-rose-600">*</span></span>
                <input
                  required
                  type="number"
                  min={1000}
                  step={1000}
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                  placeholder="1850000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Số lượng tồn kho <span className="text-rose-600">*</span></span>
                <input
                  required
                  type="number"
                  min={0}
                  value={form.stock}
                  onChange={(event) => setForm({ ...form, stock: event.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>
            </div>

            <label className="space-y-1.5 text-xs block">
              <span className="font-bold text-lacquer-900">Mô tả chi tiết</span>
              <textarea
                rows={5}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Chất liệu, kỹ thuật chế tác, công dụng, câu chuyện làng nghề..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
              />
            </label>

            {/* Chọn Kho / Điểm xuất hàng của sản phẩm */}
            <div className="p-4 rounded-2xl bg-dopaper-50 border border-terracotta-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-lacquer-900 flex items-center gap-1.5">
                  <WarehouseIcon className="w-4 h-4 text-terracotta-600" />
                  Điểm xuất hàng (Kho / Xưởng chế tác)
                </span>
                <Link
                  href="/ban-hang/kho-hang"
                  target="_blank"
                  className="text-[11px] font-bold text-terracotta-600 hover:underline"
                >
                  + Quản lý điểm kho
                </Link>
              </div>
              <select
                value={form.warehouseId}
                onChange={(event) => setForm({ ...form, warehouseId: event.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500 paper-panel"
              >
                <option value="">Sử dụng kho mặc định của cửa hàng</option>
                {warehouses.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name} — {wh.addressText} {wh.isDefault ? '(Mặc định)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-lacquer-800/60 leading-relaxed">
                Mỗi sản phẩm có thể xuất từ một xưởng hoặc kho riêng biệt. Hệ thống sẽ căn cứ vào tọa độ và địa chỉ của kho này để tính khoảng cách và phí vận chuyển tới người nhận.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Chất liệu</span>
                <input
                  value={form.material}
                  onChange={(event) => setForm({ ...form, material: event.target.value })}
                  placeholder="Gốm, sơn mài..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Kích thước</span>
                <input
                  value={form.dimensions}
                  onChange={(event) => setForm({ ...form, dimensions: event.target.value })}
                  placeholder="Cao 30cm, đường kính 15cm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Tên nghệ nhân/cửa hàng</span>
                <input
                  value={form.artisanName}
                  onChange={(event) => setForm({ ...form, artisanName: event.target.value })}
                  placeholder="Nghệ nhân Nguyễn Văn A"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Khối lượng (gram)</span>
                <input
                  type="number"
                  min={1}
                  value={form.weightG}
                  onChange={(event) => setForm({ ...form, weightG: event.target.value })}
                  placeholder="1200"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
                <span className="text-[10px] text-lacquer-800/60 block">Dùng để đối chiếu phí vận chuyển theo khối lượng.</span>
              </label>
              <label className="space-y-1.5 text-xs">
                <span className="font-bold text-lacquer-900">Thời gian chuẩn bị (ngày)</span>
                <input
                  type="number"
                  min={0}
                  value={form.preparationDays}
                  onChange={(event) => setForm({ ...form, preparationDays: event.target.value })}
                  placeholder="2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
                />
              </label>
              <label className="flex items-end gap-2 text-xs pb-1">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) => setForm({ ...form, active: event.target.checked })}
                  className="w-4 h-4 rounded border-terracotta-300"
                />
                <span className="font-bold text-lacquer-900">Cho hiển thị trên sàn</span>
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-3">
            <h2 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
              <ImagePlus className="w-4 h-4 text-terracotta-600" />
              Ảnh sản phẩm
            </h2>

            {form.image ? (
              <img src={form.image} alt="Ảnh sản phẩm" className="w-full aspect-square rounded-2xl object-cover border border-terracotta-100" />
            ) : (
              <div className="w-full aspect-square rounded-2xl bg-dopaper-50 border border-dashed border-terracotta-200 flex items-center justify-center text-[11px] text-lacquer-800/60 text-center px-4">
                Chưa có ảnh. Tải ảnh lên hoặc dán đường dẫn ảnh.
              </div>
            )}

            <label className="space-y-1.5 text-xs block">
              <span className="font-bold text-lacquer-900">Tải ảnh từ máy</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => handleUpload(event.target.files?.[0] || null)}
                className="w-full text-[11px]"
              />
              {uploading && (
                <span className="flex items-center gap-1.5 text-[10px] text-lacquer-800/70">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Đang tải ảnh lên...
                </span>
              )}
            </label>

            <label className="space-y-1.5 text-xs block">
              <span className="font-bold text-lacquer-900">Hoặc dán đường dẫn ảnh (http(s))</span>
              <input
                value={form.image}
                onChange={(event) => setForm({ ...form, image: event.target.value })}
                placeholder="https://... hoặc /api/uploads/..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
              />
            </label>

            <p className="text-[10px] text-lacquer-800/60 leading-relaxed">
              Ảnh do máy chủ kiểm tra chữ ký nhị phân (chỉ nhận JPEG/PNG/GIF/WEBP) và tên tệp do hệ thống
              sinh ra, nên không thể tải lên tệp lạ hay ghi đè ảnh của người khác.
            </p>
          </section>

          <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-3">
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
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white text-sm font-bold"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Lưu thay đổi' : 'Đăng sản phẩm'}
            </button>
            <p className="text-[10px] text-lacquer-800/60 leading-relaxed">
              Giá, tồn kho và cửa hàng sở hữu đều do máy chủ xác định lại khi lưu — dữ liệu gửi từ trình
              duyệt không thể quyết định số tiền khách phải trả.
            </p>
          </section>

          <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-2">
            <h3 className="text-xs font-bold text-lacquer-900 flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-terracotta-600" />
              Gợi ý ảnh đạt yêu cầu
            </h3>
            <ul className="text-[10px] text-lacquer-800/70 space-y-1 list-disc list-inside leading-relaxed">
              <li>Ảnh vuông, nền sáng, sản phẩm chiếm phần lớn khung hình.</li>
              <li>Kích thước tối thiểu 800×800 px, dung lượng dưới 5 MB.</li>
              <li>Chụp ảnh thật của xưởng để khách tin tưởng chất lượng thủ công.</li>
            </ul>
          </section>
        </div>
      </form>
    </div>
  );
}

export default function SellerProductFormPage() {
  return (
    <Suspense
      fallback={
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải...
        </div>
      }
    >
      <ProductForm />
    </Suspense>
  );
}
