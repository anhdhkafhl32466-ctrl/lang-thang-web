'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { CRAFT_VILLAGES } from '@/data/craftVillages';
import { formatCurrencyVND } from '@/lib/utils';
import { useCart } from '@/lib/client/cart';
import {
  ShoppingBag, Search, Star, ArrowRight, PackageCheck, Loader2, AlertTriangle, ShoppingCart, Store,
} from 'lucide-react';

export default function CraftProductsPage() {
  const cart = useCart();
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const products = useMemo(() => Object.values(cart.products), [cart.products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const text = search.toLowerCase();
        const matchesSearch =
          product.name.toLowerCase().includes(text) ||
          product.artisanName.toLowerCase().includes(text) ||
          product.category.toLowerCase().includes(text) ||
          (product.material || '').toLowerCase().includes(text);

        const matchesVillage = selectedVillage === 'all' || product.villageId === selectedVillage;

        let matchesPrice = true;
        if (priceFilter === 'under-500k') matchesPrice = product.price < 500000;
        else if (priceFilter === '500k-1m') matchesPrice = product.price >= 500000 && product.price <= 1000000;
        else if (priceFilter === 'over-1m') matchesPrice = product.price > 1000000;

        return matchesSearch && matchesVillage && matchesPrice;
      }),
    [products, search, selectedVillage, priceFilter]
  );

  const handleAdd = (productId: string) => {
    const result = cart.addToCart(productId, 1);
    setToast({ tone: result.ok ? 'ok' : 'error', text: result.message });
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 texture-paper texture-paper--moon">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="relative rounded-3xl bg-cultural-brocade bg-cover bg-right border-2 border-terracotta-300 p-8 sm:p-10 overflow-hidden shadow-md text-center max-w-4xl mx-auto">
          <div className="relative z-10 max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/30 text-lacquer-950 text-xs font-bold border border-gold-400/40">
              <ShoppingBag className="w-3.5 h-3.5 text-gold-600" />
              <span>Sàn Tinh Hoa Thủ Công Mỹ Nghệ</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
              Tuyệt Tác Thủ Công Làng Nghề Hà Nội
            </h1>
            <p className="text-xs sm:text-sm text-lacquer-800/80 leading-relaxed max-w-2xl mx-auto">
              Trực tiếp kết nối tới các lò gốm, khung cửi và xưởng thủ công mỹ nghệ. Đơn hàng được xác thực trong hệ thống,
              vận chuyển cẩn trọng từ chính xưởng của nghệ nhân đến tận tay bạn.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <Link
                href="/gio-hang"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Giỏ hàng ({cart.totalCount})</span>
              </Link>
              <Link
                href="/don-hang"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-terracotta-200 text-lacquer-900 text-xs font-bold hover:bg-dopaper-100"
              >
                <PackageCheck className="w-3.5 h-3.5 text-terracotta-600" />
                <span>Đơn hàng của tôi</span>
              </Link>
            </div>
          </div>
        </div>

        {toast && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
              toast.tone === 'ok'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {toast.tone === 'ok' ? <PackageCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{toast.text}</span>
          </div>
        )}

        {cart.catalogError && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{cart.catalogError}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 border border-terracotta-200/90 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm sản phẩm, chất liệu, nghệ nhân..."
                className="w-full bg-dopaper-50 text-lacquer-900 pl-10 pr-4 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500"
              />
            </div>

            <div className="md:col-span-3">
              <select
                value={selectedVillage}
                onChange={(event) => setSelectedVillage(event.target.value)}
                className="w-full bg-dopaper-50 text-lacquer-900 px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500"
              >
                <option value="all">Tất cả làng nghề</option>
                {CRAFT_VILLAGES.map((village) => (
                  <option key={village.id} value={village.id}>
                    {village.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <select
                value={priceFilter}
                onChange={(event) => setPriceFilter(event.target.value)}
                className="w-full bg-dopaper-50 text-lacquer-900 px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500"
              >
                <option value="all">Tất cả mức giá</option>
                <option value="under-500k">Dưới 500.000đ</option>
                <option value="500k-1m">500.000đ – 1.000.000đ</option>
                <option value="over-1m">Trên 1.000.000đ</option>
              </select>
            </div>
          </div>
        </div>

        {cart.loadingCatalog && products.length === 0 ? (
          <div className="p-16 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải danh mục sản phẩm từ cơ sở dữ liệu...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => {
              const inCart = cart.lines.find((line) => line.productId === product.id)?.quantity || 0;
              const outOfStock = product.stock <= 0;
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-3xl border border-terracotta-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
                >
                  <div>
                    <Link href={`/san-pham/${product.id}`} className="block relative aspect-[4/3] overflow-hidden bg-gray-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-bold text-terracotta-700 shadow">
                        {product.villageName}
                      </div>
                      <div
                        className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold shadow ${
                          outOfStock ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {outOfStock ? 'Hết hàng' : `Kho: ${product.stock}`}
                      </div>
                    </Link>

                    <div className="p-6 space-y-3">
                      <div className="flex items-center justify-between text-xs text-lacquer-800/60">
                        <span className="text-[11px] font-semibold text-gold-600 uppercase">{product.category}</span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                          <span className="text-lacquer-800/70">Thủ công</span>
                        </span>
                      </div>

                      <Link href={`/san-pham/${product.id}`}>
                        <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>

                      <div className="pt-1 text-xs text-lacquer-800/60 space-y-0.5">
                        <div>
                          Nghệ nhân: <strong className="text-lacquer-900">{product.artisanName}</strong>
                        </div>
                        {/* Người bán: mỗi sản phẩm thuộc một cửa hàng, khách cần biết ai bán để theo dõi đơn theo cửa hàng. */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <Store className="w-3 h-3 text-terracotta-600 shrink-0" />
                          <span>
                            Bán bởi <strong className="text-lacquer-900">{product.storeName}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 pt-4 border-t border-terracotta-100 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-base font-serif font-bold text-terracotta-600">
                        {formatCurrencyVND(product.price)}
                      </span>
                      {inCart > 0 && (
                        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Trong giỏ: {inCart}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdd(product.id)}
                        disabled={outOfStock}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-300 text-white text-xs font-bold transition-all shadow"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Thêm vào giỏ</span>
                      </button>
                      <Link
                        href={`/san-pham/${product.id}`}
                        className="px-3 py-2 rounded-xl border border-terracotta-200 text-lacquer-900 text-xs font-bold hover:bg-dopaper-100 inline-flex items-center gap-1"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!cart.loadingCatalog && filteredProducts.length === 0 && (
          <p className="p-10 text-center text-xs text-lacquer-800/60">
            Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
          </p>
        )}
      </div>
    </div>
  );
}
