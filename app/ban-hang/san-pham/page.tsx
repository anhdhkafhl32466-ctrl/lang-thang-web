'use client';

/**
 * Sản phẩm của tôi — chỉ liệt kê sản phẩm thuộc cửa hàng đang đăng nhập.
 * Cửa hàng chưa được duyệt/bị tạm khóa: danh sách vẫn xem được nhưng không đăng bán mới và sản phẩm
 * cũng không hiển thị trên sàn (quy tắc nằm ở lib/server/catalog.ts).
 */

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, Package, PackagePlus, RefreshCw, Eye, EyeOff, Trash2 } from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';
import { fetchMyProducts, stopSellingProduct, updateProduct } from '@/lib/client/sellerApi';
import { useSeller } from '@/components/seller/SellerGate';
import type { CatalogProduct } from '@/lib/orders/types';

type Row = CatalogProduct & { active: boolean };

export default function SellerProductsPage() {
  const { state } = useSeller();
  const [products, setProducts] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyProducts();
      setProducts(data.products);
    } catch (err: any) {
      setError(err?.message || 'Không tải được danh sách sản phẩm.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (product: Row) => {
    try {
      setBusyId(product.id);
      setNotice(null);
      setError(null);
      await updateProduct(product.id, { active: !product.active });
      setNotice(
        !product.active
          ? `Đã mở bán lại “${product.name}”.`
          : `Đã tạm ẩn “${product.name}” khỏi sàn (hồ sơ sản phẩm vẫn được giữ).`
      );
      await load();
    } catch (err: any) {
      setError(err?.message || 'Không cập nhật được trạng thái sản phẩm.');
    } finally {
      setBusyId(null);
    }
  };

  const stopSelling = async (product: Row) => {
    if (!window.confirm(`Ngừng bán “${product.name}”? Sản phẩm sẽ bị ẩn khỏi sàn nhưng lịch sử đơn hàng vẫn giữ nguyên.`)) {
      return;
    }
    try {
      setBusyId(product.id);
      setNotice(null);
      setError(null);
      await stopSellingProduct(product.id);
      setNotice(`Đã ngừng bán “${product.name}”.`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Không ngừng bán được sản phẩm.');
    } finally {
      setBusyId(null);
    }
  };

  const canSell = state?.canSell;

  return (
    <div className="space-y-5">
      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-terracotta-600" />
              Sản phẩm của tôi
            </h1>
            <p className="text-[11px] text-lacquer-800/60 mt-0.5">
              {products.length} sản phẩm · {products.filter((item) => item.active).length} đang bán
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 text-[11px] font-bold text-lacquer-900 hover:bg-dopaper-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </button>
            <Link
              href={canSell ? '/ban-hang/san-pham/moi' : '#'}
              onClick={(event) => {
                if (!canSell) event.preventDefault();
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold ${
                canSell ? 'bg-terracotta-500 text-white hover:bg-terracotta-600' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              <PackagePlus className="w-3.5 h-3.5" />
              Đăng sản phẩm mới
            </Link>
          </div>
        </div>

        {!canSell && (
          <p className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
            Cửa hàng chưa ở trạng thái “Đang hoạt động” nên chưa thể đăng bán sản phẩm mới. Sản phẩm đang có
            cũng tạm không hiển thị trên sàn cho tới khi cửa hàng được kích hoạt lại.
          </p>
        )}

        {error && (
          <p className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
        {notice && (
          <p className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px]">{notice}</p>
        )}
      </section>

      {loading ? (
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải sản phẩm...
        </div>
      ) : products.length === 0 ? (
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 text-center space-y-3">
          <p className="text-sm text-lacquer-800/70">Cửa hàng chưa có sản phẩm nào.</p>
          <Link
            href={canSell ? '/ban-hang/san-pham/moi' : '#'}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta-500 text-white text-xs font-bold"
          >
            <PackagePlus className="w-4 h-4" />
            Đăng sản phẩm đầu tiên
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {products.map((product) => (
            <li key={product.id} className="paper-panel rounded-3xl border border-terracotta-200 p-4">
              <div className="flex flex-wrap items-start gap-3">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-terracotta-100"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-lacquer-900">{product.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${
                        product.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      }`}
                    >
                      {product.active ? 'Đang bán' : 'Đã ẩn / ngừng bán'}
                    </span>
                  </div>
                  <span className="block text-[11px] text-lacquer-800/70">
                    {product.category} · {product.villageName} · tồn kho {product.stock}
                    {product.weightG ? ` · ${product.weightG} g` : ''}
                    {product.preparationDays ? ` · chuẩn bị ${product.preparationDays} ngày` : ''}
                  </span>
                  <strong className="block text-sm text-terracotta-600">{formatCurrencyVND(product.price)}</strong>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => toggleActive(product)}
                    disabled={busyId === product.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 text-[11px] font-bold text-lacquer-900 hover:bg-dopaper-50 disabled:opacity-50"
                  >
                    {busyId === product.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : product.active ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    {product.active ? 'Tạm ẩn' : 'Mở bán lại'}
                  </button>
                  <Link
                    href={`/ban-hang/san-pham/moi?id=${product.id}`}
                    className="px-3 py-2 rounded-xl border border-terracotta-200 text-[11px] font-bold text-lacquer-900 hover:bg-dopaper-50"
                  >
                    Sửa
                  </Link>
                  <button
                    onClick={() => stopSelling(product)}
                    disabled={busyId === product.id}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-[11px] font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Ngừng bán
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
