'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PRODUCTS, Product } from '@/data/products';
import { CRAFT_VILLAGES } from '@/data/craftVillages';
import { formatCurrencyVND } from '@/lib/utils';
import {
  ShoppingBag, Search, Filter, ExternalLink, Star, ShieldCheck,
  Sparkles, CheckCircle2, ArrowRight, X, Heart
} from 'lucide-react';

export default function CraftProductsPage() {
  const [search, setSearch] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.artisanName.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      p.material.toLowerCase().includes(search.toLowerCase());

    const matchesVillage =
      selectedVillage === 'all' || p.villageId === selectedVillage;

    let matchesPrice = true;
    if (priceFilter === 'under-500k') matchesPrice = p.price < 500000;
    else if (priceFilter === '500k-1m') matchesPrice = p.price >= 500000 && p.price <= 1000000;
    else if (priceFilter === 'over-1m') matchesPrice = p.price > 1000000;

    return matchesSearch && matchesVillage && matchesPrice;
  });

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/30 text-lacquer-950 text-xs font-bold border border-gold-400/40">
            <ShoppingBag className="w-3.5 h-3.5 text-gold-600" />
            <span>Sàn Tinh Hoa Thủ Công Mỹ Nghệ</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
            Mua sản phẩm từ làng nghề Hà Nội
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70 leading-relaxed">
            Mỗi sản phẩm bạn mua trực tiếp hỗ trợ kinh tế cho các nghệ nhân và gia đình thợ thủ công, giữ cho ngọn lửa di sản luôn bừng sáng.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="bg-white rounded-3xl p-6 border border-terracotta-200/90 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm, chất liệu, nghệ nhân..."
                className="w-full bg-dopaper-50 text-lacquer-900 pl-10 pr-4 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500"
              />
            </div>

            {/* Village Select */}
            <div className="md:col-span-3">
              <select
                value={selectedVillage}
                onChange={(e) => setSelectedVillage(e.target.value)}
                className="w-full bg-dopaper-50 text-lacquer-900 px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500"
              >
                <option value="all">Tất cả làng nghề</option>
                {CRAFT_VILLAGES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Filter */}
            <div className="md:col-span-3">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
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

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-terracotta-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-sm text-[11px] font-bold text-terracotta-700 shadow">
                    {product.villageName}
                  </div>
                  {product.isBestSeller && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gold-500 text-white text-[11px] font-bold shadow">
                      Bán chạy
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center justify-between text-xs text-lacquer-800/60">
                    <span className="text-[11px] font-semibold text-gold-600 uppercase">
                      {product.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-gold-500 fill-gold-500" />
                      <strong className="text-lacquer-900">{product.rating}</strong> ({product.reviewsCount})
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors line-clamp-1">
                    {product.name}
                  </h3>

                  <p className="text-xs text-lacquer-800/70 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>

                  <div className="pt-1 text-xs text-lacquer-800/60">
                    Nghệ nhân: <strong className="text-lacquer-900">{product.artisanName}</strong>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-terracotta-100 flex items-center justify-between">
                <div>
                  <span className="text-base font-serif font-bold text-terracotta-600">
                    {formatCurrencyVND(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-[11px] text-gray-400 line-through block">
                      {formatCurrencyVND(product.originalPrice)}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setSelectedProduct(product)}
                  className="px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-all shadow"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lacquer-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border-2 border-terracotta-300 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-lacquer-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              <div className="aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-md">
                <img
                  src={selectedProduct.image}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-gold-600 uppercase">
                    {selectedProduct.villageName}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-lacquer-900 mt-1">
                    {selectedProduct.name}
                  </h3>
                  <div className="mt-2 text-xl font-serif font-bold text-terracotta-600">
                    {formatCurrencyVND(selectedProduct.price)}
                  </div>
                </div>

                <p className="text-xs text-lacquer-800/80 leading-relaxed">
                  {selectedProduct.description}
                </p>

                <div className="p-3.5 bg-dopaper-100 rounded-xl space-y-1.5 text-xs text-lacquer-800/80 border border-terracotta-100">
                  <div><strong>Nghệ nhân:</strong> {selectedProduct.artisanName}</div>
                  <div><strong>Chất liệu:</strong> {selectedProduct.material}</div>
                  {selectedProduct.dimensions && (
                    <div><strong>Kích thước:</strong> {selectedProduct.dimensions}</div>
                  )}
                  <div><strong>Kỹ nghệ:</strong> {selectedProduct.craftDetails}</div>
                </div>

                {/* Direct Purchase Links */}
                <div className="pt-2 space-y-2">
                  <span className="text-[11px] font-bold text-lacquer-900 block">
                    Chọn kênh mua hàng chính thức:
                  </span>
                  <div className="flex flex-col gap-2">
                    {selectedProduct.shopeeUrl && (
                      <a
                        href={selectedProduct.shopeeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold text-center shadow flex items-center justify-center gap-1.5"
                      >
                        <span>Mua trên Gian hàng Shopee Làng nghề</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {selectedProduct.tiktokShopUrl && (
                      <a
                        href={selectedProduct.tiktokShopUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-4 rounded-xl bg-black hover:bg-gray-800 text-white text-xs font-bold text-center shadow flex items-center justify-center gap-1.5"
                      >
                        <span>Xem livestream trên TikTok Shop</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
