'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CRAFT_VILLAGES, CraftVillage } from '@/data/craftVillages';
import { MapPin, ArrowRight, Sparkles, Compass, Eye } from 'lucide-react';

export default function FlashCards() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredVillages = activeCategory === 'all'
    ? CRAFT_VILLAGES
    : CRAFT_VILLAGES.filter(v => v.categorySlug === activeCategory);

  const filterTabs = [
    { id: 'all', label: 'Tất cả làng nghề' },
    { id: 'gom-su', label: 'Gốm sứ' },
    { id: 'lua-det', label: 'Lụa tơ tằm' },
    { id: 'may-tre-dan', label: 'Mây tre đan' },
    { id: 'non-la', label: 'Nón lá' },
    { id: 'nghe-thuat-dan-gian', label: 'Dân gian & Khác' },
  ];

  return (
    <section className="py-16 sm:py-24 bg-dopaper-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-semibold mb-2">
              <Compass className="w-3.5 h-3.5 text-terracotta-600" />
              <span>Hành Trình Di Sản Thăng Long</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-lacquer-900">
              Khám phá các làng nghề truyền thống
            </h2>
            <p className="text-sm sm:text-base text-lacquer-800/70 mt-1 max-w-xl">
              Chạm tay vào các tác phẩm nghệ thuật sống động được gìn giữ qua hàng trăm năm bồi đắp phù sa và tâm huyết của các bậc nghệ nhân.
            </p>
          </div>

          <Link
            href="/lang-nghe"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-terracotta-600 hover:text-terracotta-700 group shrink-0"
          >
            <span>Xem tất cả làng nghề</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                activeCategory === tab.id
                  ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20'
                  : 'bg-dopaper-100 text-lacquer-800/80 hover:bg-terracotta-50 border border-terracotta-200/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Flash Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredVillages.map((village) => (
            <div
              key={village.id}
              className="group relative bg-white rounded-3xl border border-terracotta-200/80 shadow-sm hover:shadow-xl hover:border-terracotta-400/80 transition-all duration-300 flex flex-col overflow-hidden"
            >
              {/* Image Container with Zoom & Badge */}
              <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                <img
                  src={village.heroImage}
                  alt={village.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                {/* Craft Category Badge */}
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-bold text-terracotta-700 shadow-sm">
                  {village.category}
                </div>

                {/* Distance / Location Badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-medium drop-shadow">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  <span>{village.location.district}</span>
                </div>

                {/* Game badge if available */}
                {village.gameUrl && (
                  <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gold-500/90 text-white text-[11px] font-bold flex items-center gap-1 shadow">
                    <Sparkles className="w-3 h-3" />
                    <span>Có mini-game</span>
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-xl font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                    {village.name}
                  </h3>

                  {/* Catchy tagline quote */}
                  <div className="mt-2 pl-3 border-l-2 border-terracotta-400 italic text-xs text-lacquer-800/80 line-clamp-2">
                    "{village.tagline}"
                  </div>

                  <p className="text-xs text-lacquer-800/70 mt-3 line-clamp-2 leading-relaxed">
                    {village.shortDescription}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-4 border-t border-terracotta-100 flex items-center justify-between gap-2">
                  {village.gameUrl ? (
                    <Link
                      href={village.gameUrl}
                      className="text-xs text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                      <span>Thử làm nghề ảo</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-lacquer-800/50">
                      {village.history.originPeriod}
                    </span>
                  )}

                  <Link
                    href={`/lang-nghe/${village.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-dopaper-100 hover:bg-terracotta-500 hover:text-white text-lacquer-900 text-xs font-semibold border border-terracotta-200 transition-all group-hover:bg-terracotta-500 group-hover:text-white group-hover:border-transparent"
                  >
                    <span>Khám phá</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
