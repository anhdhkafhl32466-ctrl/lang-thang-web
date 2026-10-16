'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Store as StoreIcon,
  Search,
  Package,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
  Filter,
} from 'lucide-react';

interface ShopItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  addressText: string | null;
  shippingPolicy: string | null;
  prepTimeDays: number | null;
  categories: string[];
  productCount: number;
}

export default function CraftShopsDirectoryPage() {
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/stores');
        const data = await res.json();
        if (!cancelled && data.ok) {
          setShops(data.stores || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải danh sách cửa hàng:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Tổng hợp tất cả các danh mục từ các shop
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    shops.forEach((s) => {
      s.categories.forEach((c) => {
        if (c.trim()) set.add(c.trim());
      });
    });
    return Array.from(set);
  }, [shops]);

  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const matchSearch =
        !search.trim() ||
        shop.name.toLowerCase().includes(search.toLowerCase()) ||
        (shop.description && shop.description.toLowerCase().includes(search.toLowerCase())) ||
        (shop.addressText && shop.addressText.toLowerCase().includes(search.toLowerCase()));

      const matchCat =
        selectedCategory === 'all' ||
        shop.categories.some((c) => c.toLowerCase() === selectedCategory.toLowerCase());

      return matchSearch && matchCat;
    });
  }, [shops, search, selectedCategory]);

  return (
    <div className="min-h-screen bg-dopaper-50 py-10 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Banner tiêu đề phong cách văn hoá làng nghề — Vietnamese Cultural Editorial Masthead */}
        <div className="relative rounded-3xl bg-dopaper-50/90 border border-terracotta-200/90 p-8 sm:p-12 overflow-hidden shadow-sm">
          <div className="absolute inset-0 bg-cultural-lantern opacity-30 mix-blend-multiply pointer-events-none bg-cover bg-right" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-400/20 text-gold-900 border border-gold-400/30 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Sàn Thương Mại Di Sản Thăng Long — Hà Nội</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-lacquer-900 leading-tight">
              Xưởng Chế Tác &amp; Cửa Hàng Làng Nghề
            </h1>
            <p className="text-sm sm:text-base text-lacquer-800/80 leading-relaxed font-light">
              Mỗi cửa hàng là một xưởng chế tác thủ công độc lập: từ gốm men rạn Bát Tràng, lụa Vạn Phúc mềm mại,
              đến mây tre đan Phú Vinh tinh xảo. Khám phá các gian hàng chính gốc do nghệ nhân trực tiếp vận hành.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-5 text-xs text-lacquer-800/80">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Chứng nhận xưởng thủ công làng nghề
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Package className="w-4 h-4 text-terracotta-600" />
                Vận chuyển trực tiếp từ kho xưởng
              </span>
            </div>
          </div>
        </div>

        {/* Thanh tìm kiếm & lọc danh mục */}
        <div className="bg-white rounded-3xl border border-terracotta-200 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-lacquer-800/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm tên cửa hàng, làng nghề, địa chỉ..."
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500 bg-dopaper-50/50"
              />
            </div>
            <div className="text-xs text-lacquer-800/70 w-full sm:w-auto text-right font-medium">
              Tìm thấy <strong className="text-terracotta-600">{filteredShops.length}</strong> cửa hàng
            </div>
          </div>

          {/* Tag categories */}
          {allCategories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none pt-1">
              <span className="text-xs font-bold text-lacquer-800/70 flex items-center gap-1 shrink-0 mr-1">
                <Filter className="w-3.5 h-3.5" />
                Chuyên ngành:
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-terracotta-600 text-white shadow-sm'
                    : 'bg-dopaper-100 text-lacquer-800/80 hover:bg-terracotta-100 border border-terracotta-200'
                }`}
              >
                Tất cả
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                    selectedCategory.toLowerCase() === cat.toLowerCase()
                      ? 'bg-terracotta-600 text-white shadow-sm'
                      : 'bg-dopaper-100 text-lacquer-800/80 hover:bg-terracotta-100 border border-terracotta-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Danh sách shop */}
        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center text-xs text-lacquer-800/60 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-terracotta-600" />
            <span>Đang tải danh sách cửa hàng di sản...</span>
          </div>
        ) : filteredShops.length === 0 ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <StoreIcon className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-lg font-bold text-lacquer-900">Không tìm thấy cửa hàng phù hợp</h3>
            <p className="text-xs text-lacquer-800/70 max-w-md mx-auto">
              Không có gian hàng nào khớp với từ khóa tìm kiếm hoặc chuyên ngành đã chọn. Hãy thử lại với từ khóa khác.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="group bg-white rounded-3xl border border-terracotta-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Banner & Logo */}
                <div>
                  <div className="relative h-36 w-full bg-dopaper-200 overflow-hidden border-b border-terracotta-100">
                    {shop.bannerUrl ? (
                      <img
                        src={shop.bannerUrl}
                        alt={`Ảnh bìa ${shop.name}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[radial-gradient(#c85a32_0.8px,transparent_0.8px)] [background-size:16px_16px] text-terracotta-800/40 font-serif text-base font-bold tracking-wider">
                        {shop.name}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  </div>

                  <div className="p-5 pt-0 relative space-y-3">
                    {/* Avatar nổi lên trên banner */}
                    <div className="flex items-end justify-between -mt-10 mb-2">
                      <div className="w-20 h-20 rounded-2xl bg-white border-2 border-white shadow-md overflow-hidden shrink-0">
                        {shop.logoUrl ? (
                          <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-dopaper-100 flex items-center justify-center">
                            <StoreIcon className="w-9 h-9 text-terracotta-600" />
                          </div>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <ShieldCheck className="w-3 h-3" />
                        Đã xác minh
                      </span>
                    </div>

                    <div>
                      <h2 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors line-clamp-1">
                        {shop.name}
                      </h2>
                      {shop.addressText && (
                        <p className="text-[11px] text-lacquer-800/60 flex items-center gap-1 mt-0.5 line-clamp-1">
                          <MapPin className="w-3 h-3 shrink-0 text-terracotta-500" />
                          <span>{shop.addressText}</span>
                        </p>
                      )}
                    </div>

                    {shop.description && (
                      <p className="text-xs text-lacquer-800/70 line-clamp-2 leading-relaxed">
                        {shop.description}
                      </p>
                    )}

                    {/* Danh mục tag */}
                    {shop.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {shop.categories.slice(0, 3).map((cat) => (
                          <span
                            key={cat}
                            className="px-2 py-0.5 rounded-lg bg-dopaper-100 border border-terracotta-100 text-[10px] font-semibold text-lacquer-800"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer thông số & Nút xem */}
                <div className="p-5 pt-3 border-t border-terracotta-100 flex items-center justify-between bg-dopaper-50/50">
                  <div className="flex items-center gap-3 text-[11px] text-lacquer-800/70 font-medium">
                    <span className="flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-terracotta-600" />
                      <strong>{shop.productCount}</strong> món
                    </span>
                    {shop.prepTimeDays != null && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold-600" />
                        ~{shop.prepTimeDays} ngày
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/cua-hang/${shop.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-all shadow-sm group-hover:translate-x-0.5"
                  >
                    <span>Vào cửa hàng</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
