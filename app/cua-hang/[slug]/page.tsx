'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Store as StoreIcon,
  MapPin,
  Clock,
  Truck,
  ShieldCheck,
  Search,
  ShoppingCart,
  ArrowLeft,
  Loader2,
  PackageCheck,
  Package,
  Phone,
  Sparkles,
} from 'lucide-react';
import { useCart } from '@/lib/client/cart';
import { formatCurrencyVND } from '@/lib/utils';
import type { CatalogProduct } from '@/lib/orders/types';

interface StoreData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  contactName: string | null;
  phone: string | null;
  addressText: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  shippingPolicy: string | null;
  prepTimeDays: number | null;
  categories: string[];
  status: string;
  createdAt: string;
}

interface WarehouseData {
  id: string;
  name: string;
  addressText: string;
}

export default function StoreFrontPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug;
  const cart = useCart();

  const [store, setStore] = useState<StoreData | null>(null);
  const [warehouse, setWarehouse] = useState<WarehouseData | null>(null);
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [toast, setToast] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/stores/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (cancelled) return;
        if (!data.ok) {
          setError(data.message || 'Không tìm thấy cửa hàng.');
          return;
        }
        setStore(data.store);
        setWarehouse(data.warehouse);
        setProducts(data.products || []);
      } catch {
        if (!cancelled) setError('Không thể tải thông tin cửa hàng.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // Danh mục sản phẩm có trong cửa hàng này
  const shopCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase())) ||
        (p.artisanName && p.artisanName.toLowerCase().includes(search.toLowerCase()));

      const matchCat =
        selectedCat === 'all' || p.category.toLowerCase() === selectedCat.toLowerCase();

      return matchSearch && matchCat;
    });
  }, [products, search, selectedCat]);

  const handleAddToCart = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const result = cart.addToCart(productId, 1);
    setToast({ tone: result.ok ? 'ok' : 'error', text: result.message });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xs text-lacquer-800/60 gap-2 bg-dopaper-50">
        <Loader2 className="w-5 h-5 animate-spin text-terracotta-600" />
        <span>Đang mở gian hàng di sản...</span>
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen py-20 text-center space-y-4 bg-dopaper-50">
        <p className="text-sm text-rose-700">{error || 'Không tìm thấy cửa hàng này.'}</p>
        <Link
          href="/cua-hang"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-600 hover:text-terracotta-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Về danh sách cửa hàng làng nghề</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dopaper-50 pb-16">
      {/* Banner bìa cửa hàng */}
      <div className="relative h-56 sm:h-72 lg:h-80 w-full bg-[#1c1613] overflow-hidden">
        {store.bannerUrl ? (
          <img
            src={store.bannerUrl}
            alt={store.name}
            className="w-full h-full object-cover opacity-85"
          />
        ) : (
          <div className="w-full h-full bg-[#1e1713] flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#c25e36_1px,transparent_1px)] [background-size:20px_20px]" />
            <span className="text-[11px] font-mono tracking-widest text-gold-400 uppercase mb-2">
              Không Gian Nghề Truyền Thống Thăng Long
            </span>
            <h2 className="text-white font-serif text-2xl sm:text-4xl font-bold tracking-tight max-w-xl">
              {store.name}
            </h2>
            <p className="text-xs sm:text-sm text-dopaper-200/70 mt-2 max-w-md font-serif italic">
              Tinh hoa chế tác thủ công từ bàn tay nghệ nhân và thợ giỏi làng nghề
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

        <div className="absolute top-6 left-4 sm:left-8 z-10">
          <Link
            href="/cua-hang"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/50 backdrop-blur-md text-dopaper-100 text-xs font-semibold hover:bg-black/75 transition-colors border border-white/20 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tất cả cửa hàng di sản</span>
          </Link>
        </div>
      </div>

      {/* Thông tin hồ sơ gian hàng */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-10 space-y-8">
        <div className="bg-white rounded-3xl border border-terracotta-200 p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="flex items-start sm:items-end gap-4 sm:gap-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-white border-4 border-white shadow-xl overflow-hidden shrink-0">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-dopaper-100 flex items-center justify-center">
                    <StoreIcon className="w-12 h-12 text-terracotta-600" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                    {store.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Gian hàng chính gốc
                  </span>
                </div>
                {store.contactName && (
                  <p className="text-xs text-lacquer-800/80 font-medium">
                    Đại diện xưởng: <strong className="text-lacquer-900">{store.contactName}</strong>
                  </p>
                )}
                {store.addressText && (
                  <p className="text-xs text-lacquer-800/70 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />
                    <span>{store.addressText}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:self-center">
              <div className="px-3.5 py-2 rounded-2xl bg-dopaper-100 border border-terracotta-200 text-xs font-semibold text-lacquer-900 text-center">
                <span className="block text-terracotta-600 font-bold text-sm sm:text-base">{products.length}</span>
                <span className="text-[10px] text-lacquer-800/60 uppercase">Sản phẩm</span>
              </div>
              {store.prepTimeDays != null && (
                <div className="px-3.5 py-2 rounded-2xl bg-dopaper-100 border border-terracotta-200 text-xs font-semibold text-lacquer-900 text-center">
                  <span className="block text-gold-600 font-bold text-sm sm:text-base">~{store.prepTimeDays} ngày</span>
                  <span className="text-[10px] text-lacquer-800/60 uppercase">Chuẩn bị hàng</span>
                </div>
              )}
            </div>
          </div>

          {store.description && (
            <div className="pt-4 border-t border-terracotta-100 text-xs sm:text-sm text-lacquer-800/80 leading-relaxed whitespace-pre-line">
              {store.description}
            </div>
          )}

          {/* Logistics & Chính sách vận chuyển của shop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-terracotta-100 text-xs text-lacquer-800/80">
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <Truck className="w-4 h-4 text-terracotta-600 mt-0.5 shrink-0" />
              <div>
                <strong className="block text-lacquer-900">Chính sách vận chuyển &amp; kho xuất:</strong>
                <span>
                  {store.shippingPolicy ||
                    'Đóng gói cẩn thận bằng rơm giấy thủ công chống va đập. Phí vận chuyển tính từ xưởng xuất hàng trực tiếp tới khách.'}
                </span>
                {warehouse && (
                  <span className="block text-[11px] text-lacquer-800/60 mt-1 font-medium">
                    Kho xuất hàng chính: <strong>{warehouse.name}</strong> ({warehouse.addressText})
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-dopaper-50 border border-terracotta-100">
              <Clock className="w-4 h-4 text-gold-600 mt-0.5 shrink-0" />
              <div>
                <strong className="block text-lacquer-900">Cam kết chất lượng:</strong>
                <span>
                  Sản phẩm thủ công 100% chế tác bởi nghệ nhân và thợ giỏi làng nghề. Hỗ trợ kiểm tra hàng
                  khi nhận và đối chiếu chứng nhận di sản.
                </span>
                {store.phone && (
                  <span className="block text-[11px] text-lacquer-800/60 mt-1 flex items-center gap-1 font-medium">
                    <Phone className="w-3 h-3 text-terracotta-500" />
                    Hotline xưởng: {store.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Thông báo toast thêm giỏ hàng */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
                toast.tone === 'ok'
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-rose-600 text-white border-rose-500'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>{toast.text}</span>
            </div>
          </div>
        )}

        {/* Thanh tìm kiếm & bộ lọc sản phẩm trong cửa hàng */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900">
                Sản phẩm của cửa hàng
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-terracotta-100 text-terracotta-700 font-bold">
                {filteredProducts.length}
              </span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-lacquer-800/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sản phẩm của xưởng..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500 bg-white"
              />
            </div>
          </div>

          {/* Tag danh mục */}
          {shopCategories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCat('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedCat === 'all'
                    ? 'bg-terracotta-600 text-white shadow-sm'
                    : 'bg-white text-lacquer-800/70 hover:bg-dopaper-100 border border-terracotta-200'
                }`}
              >
                Tất cả ({products.length})
              </button>
              {shopCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    selectedCat.toLowerCase() === cat.toLowerCase()
                      ? 'bg-terracotta-600 text-white shadow-sm'
                      : 'bg-white text-lacquer-800/70 hover:bg-dopaper-100 border border-terracotta-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Lưới sản phẩm */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-lacquer-800/40 mx-auto" />
              <p className="text-xs text-lacquer-800/70">
                Chưa có sản phẩm nào khớp với tìm kiếm trong cửa hàng này.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredProducts.map((p) => {
                const outOfStock = p.stock <= 0;
                return (
                  <Link
                    key={p.id}
                    href={`/san-pham/${p.id}`}
                    className="group bg-white rounded-3xl border border-terracotta-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-square w-full bg-gray-100 overflow-hidden">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {outOfStock && (
                          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center">
                            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-bold">
                              Hết hàng
                            </span>
                          </div>
                        )}
                        {p.warehouseName && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[9px] font-medium line-clamp-1 max-w-[90%]">
                            Kho: {p.warehouseName}
                          </span>
                        )}
                      </div>

                      <div className="p-3 sm:p-4 space-y-1.5">
                        <span className="text-[10px] font-bold text-gold-600 uppercase block truncate">
                          {p.category}
                        </span>
                        <h3 className="font-serif text-xs sm:text-sm font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors line-clamp-2">
                          {p.name}
                        </h3>
                        <p className="text-[10px] text-lacquer-800/60 line-clamp-1">
                          Nghệ nhân: {p.artisanName}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 pt-0 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-serif text-sm sm:text-base font-bold text-terracotta-600">
                          {formatCurrencyVND(p.price)}
                        </span>
                        <span className="text-[10px] text-lacquer-800/60 font-medium">
                          Kho: {p.stock}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleAddToCart(p.id, e)}
                        disabled={outOfStock}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold transition-colors shadow-sm"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Thêm vào giỏ</span>
                      </button>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
