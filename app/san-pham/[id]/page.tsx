'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/lib/client/cart';
import { formatCurrencyVND } from '@/lib/utils';
import type { CatalogProduct } from '@/lib/orders/types';
import ProductReviews, { Stars } from '@/components/reviews/ProductReviews';
import ProductQuestions from '@/components/reviews/ProductQuestions';
import {
  ShoppingCart, ArrowLeft, PackageCheck, Truck, ShieldCheck, Loader2, AlertTriangle, Minus, Plus, ArrowRight, Store,
  Zap,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const productId = params?.id;
  const cart = useCart();

  const [product, setProduct] = useState<CatalogProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/catalog', { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        const found = (data.products || []).find((item: CatalogProduct) => item.id === productId) || null;
        setProduct(found);
        setError(found ? null : 'Không tìm thấy sản phẩm này trong hệ thống.');
      } catch {
        if (!cancelled) setError('Không tải được thông tin sản phẩm.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const inCart = product ? cart.lines.find((line) => line.productId === product.id)?.quantity || 0 : 0;
  const maxQuantity = Math.min(product?.stock ?? 1, 99);

  const addToCart = () => {
    if (!product) return;
    const result = cart.addToCart(product.id, quantity);
    setToast({ tone: result.ok ? 'ok' : 'error', text: result.message });
    setTimeout(() => setToast(null), 3500);
  };

  /** Mua ngay: thêm đúng số lượng rồi chuyển thẳng tới trang thanh toán. */
  const buyNow = () => {
    if (!product) return;
    const result = cart.addToCart(product.id, quantity);
    if (!result.ok) {
      setToast({ tone: 'error', text: result.message });
      setTimeout(() => setToast(null), 3500);
      return;
    }
    router.push('/thanh-toan');
  };

  if (loading) {
    return (
      <div className="min-h-screen texture-paper texture-paper--silk flex items-center justify-center text-xs text-lacquer-800/60 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Đang tải sản phẩm...</span>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen texture-paper texture-paper--silk py-20 text-center space-y-4">
        <p className="text-sm text-rose-700 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error || 'Không tìm thấy sản phẩm.'}</span>
        </p>
        <Link href="/san-pham" className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-600">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh sách sản phẩm</span>
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <div className="min-h-screen texture-paper texture-paper--silk py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link href="/san-pham" className="inline-flex items-center gap-1.5 text-xs font-semibold text-lacquer-800/70 hover:text-terracotta-600">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Danh sách sản phẩm</span>
        </Link>

        <div className="paper-panel rounded-3xl border border-terracotta-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-2">
          <div className="aspect-[4/3] lg:aspect-auto lg:h-full bg-gray-100">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-gold-600 uppercase">{product.villageName} · {product.category}</span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">{product.name}</h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-serif font-bold text-terracotta-600">{formatCurrencyVND(product.price)}</span>
                {product.reviewCount ? (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-lacquer-800/70">
                    <Stars value={product.ratingAverage || 0} size="w-3.5 h-3.5" />
                    <span>
                      {(product.ratingAverage || 0).toFixed(1)} · {product.reviewCount} đánh giá
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] text-lacquer-800/50">Chưa có đánh giá</span>
                )}
                <span
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                    outOfStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {outOfStock ? 'Hết hàng' : `Còn ${product.stock} sản phẩm trong kho`}
                </span>
              </div>
            </div>

            <div className="p-4 bg-dopaper-100 rounded-2xl space-y-1.5 text-xs text-lacquer-800/80 border border-terracotta-100">
              <div><strong>Nghệ nhân:</strong> {product.artisanName}</div>
              {product.material && <div><strong>Chất liệu:</strong> {product.material}</div>}
              {product.dimensions && <div><strong>Kích thước:</strong> {product.dimensions}</div>}
              {product.weightG ? <div><strong>Khối lượng:</strong> {product.weightG} g</div> : null}
              {product.preparationDays ? <div><strong>Thời gian chuẩn bị hàng:</strong> khoảng {product.preparationDays} ngày</div> : null}
              <div><strong>Mã sản phẩm:</strong> <span className="font-mono">{product.id}</span></div>
            </div>

            {/* Thông tin NGƯỜI BÁN & KHO XUẤT HÀNG: sàn đa người bán */}
            <div className="p-4 rounded-2xl border border-terracotta-200 paper-panel space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-bold text-lacquer-900">
                  <Store className="w-3.5 h-3.5 text-terracotta-600" />
                  Cửa hàng sở hữu
                </span>
                <Link
                  href={`/cua-hang/${product.storeSlug || product.storeId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700 bg-terracotta-50 px-2.5 py-1 rounded-lg border border-terracotta-200"
                >
                  <span>Ghé thăm gian hàng</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="text-lacquer-800/80">
                Gian hàng: <strong className="text-lacquer-900 text-sm font-serif">{product.storeName}</strong>
                {product.storeStatus !== 'active' && (
                  <span className="ml-1 text-rose-600 font-bold">(cửa hàng tạm ngừng bán)</span>
                )}
              </div>

              {product.warehouseName && (
                <div className="text-[11px] text-lacquer-800/70 flex items-center gap-1">
                  <Truck className="w-3 h-3 text-terracotta-500 shrink-0" />
                  <span>Xuất kho từ: <strong className="text-lacquer-900">{product.warehouseName}</strong></span>
                </div>
              )}

              <p className="text-[11px] text-lacquer-800/60 leading-relaxed pt-1 border-t border-terracotta-100">
                Sản phẩm đóng gói và giao trực tiếp từ kho của {product.storeName}. Nếu giỏ hàng có sản phẩm từ nhiều cửa hàng, sàn sẽ tự động tách gói hàng độc lập.
              </p>
            </div>

            {product.description && (
              <div className="text-xs text-lacquer-800/80 leading-relaxed whitespace-pre-line">
                {product.description}
              </div>
            )}

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-lacquer-900">Số lượng</span>
              <div className="inline-flex items-center border border-terracotta-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 hover:bg-dopaper-100 text-lacquer-900"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="number"
                  min={1}
                  max={maxQuantity}
                  value={quantity}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setQuantity(Number.isFinite(value) ? Math.max(1, Math.min(value, maxQuantity)) : 1);
                  }}
                  className="w-14 text-center text-sm py-2 border-x border-terracotta-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
                  className="px-3 py-2 hover:bg-dopaper-100 text-lacquer-900"
                  disabled={quantity >= maxQuantity}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-xs text-lacquer-800/60">
                Tạm tính: <strong className="text-terracotta-600">{formatCurrencyVND(product.price * quantity)}</strong>
              </span>
            </div>

            {toast && (
              <p className={`text-xs p-3 rounded-xl border ${toast.tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                {toast.text}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={addToCart}
                disabled={outOfStock}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-300 text-white text-sm font-bold shadow"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Thêm vào giỏ hàng</span>
              </button>
              <button
                onClick={buyNow}
                disabled={outOfStock}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold-600 hover:bg-gold-700 disabled:bg-gray-300 text-white text-sm font-bold shadow"
              >
                <Zap className="w-4 h-4" />
                <span>Mua ngay</span>
              </button>
              <Link
                href="/gio-hang"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl paper-panel border border-terracotta-200 text-lacquer-900 text-sm font-bold hover:bg-dopaper-100"
              >
                <PackageCheck className="w-4 h-4 text-terracotta-600" />
                <span>Xem giỏ hàng ({cart.totalCount})</span>
              </Link>
              {inCart > 0 && (
                <Link href="/thanh-toan" className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-600 hover:text-terracotta-700">
                  <span>Đi tới thanh toán</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            <div className="pt-3 border-t border-terracotta-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-lacquer-800/70">
              <span className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-terracotta-600" />
                <span>
                  Giao từ địa chỉ xuất hàng của {product.storeName}; phí tính theo tuyến đường thật của từng cửa hàng.
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Tồn kho và tổng tiền do máy chủ kiểm tra khi đặt hàng.</span>
              </span>
            </div>
          </div>
        </div>

        <ProductReviews productId={product.id} />
        <ProductQuestions productId={product.id} />
      </div>
    </div>
  );
}
