'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CRAFT_VILLAGES, CATEGORIES, CraftVillage } from '@/data/craftVillages';
import { Search, MapPin, Compass, ArrowRight, Sparkles, Navigation, Layers } from 'lucide-react';

const CraftMapLeaflet = dynamic(() => import('@/components/map/CraftMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-dopaper-200/60 rounded-3xl animate-pulse">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-lacquer-800/70">Đang tải bản đồ Hà Nội...</p>
      </div>
    </div>
  )
});

export default function CraftMapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState<CraftVillage | null>(null);

  const filteredVillages = CRAFT_VILLAGES.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || v.categorySlug === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-dopaper-50 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Bản Đồ Di Sản Địa Lý</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-lacquer-900">
              Bản đồ làng nghề Hà Nội
            </h1>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm làng nghề hoặc quận huyện..."
              className="w-full bg-white text-lacquer-900 pl-10 pr-4 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-terracotta-500 text-white shadow-sm'
                  : 'bg-white text-lacquer-800/80 hover:bg-terracotta-50 border border-terracotta-200/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Map & Sidebar Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[72vh] min-h-[600px]">
          {/* Sidebar Village List (Hidden on mobile or drawer) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-terracotta-200/90 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-dopaper-100/70 border-b border-terracotta-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-lacquer-900">
                Tìm thấy {filteredVillages.length} làng nghề
              </span>
              <span className="text-[11px] text-lacquer-800/60">
                Nhấp để định vị trên bản đồ
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredVillages.map((v) => {
                const isSelected = selectedVillage?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVillage(v)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-terracotta-50/90 border-terracotta-400 shadow-sm'
                        : 'bg-white border-terracotta-100 hover:border-terracotta-300 hover:bg-dopaper-50'
                    }`}
                  >
                    <img
                      src={v.heroImage}
                      alt={v.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-terracotta-600 uppercase">
                          {v.category}
                        </span>
                        <span className="text-[10px] text-lacquer-800/50">
                          {v.location.distanceFromCenter.split('về')[0]}
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-lacquer-900 truncate mt-0.5">
                        {v.name}
                      </h4>
                      <p className="text-xs text-lacquer-800/60 truncate">
                        {v.location.address}
                      </p>

                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-gold-600 font-medium">
                          {v.history.originPeriod}
                        </span>
                        <Link
                          href={`/lang-nghe/${v.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-[11px] text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center gap-0.5"
                        >
                          <span>Xem chi tiết</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaflet Map Interactive Canvas */}
          <div className="lg:col-span-8 h-full">
            <CraftMapLeaflet
              villages={filteredVillages}
              selectedVillageId={selectedVillage?.id}
              onSelectVillage={(v) => setSelectedVillage(v)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
