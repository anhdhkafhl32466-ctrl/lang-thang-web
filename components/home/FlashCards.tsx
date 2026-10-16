'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CRAFT_VILLAGES, CraftVillage } from '@/data/craftVillages';
import { MapPin, ArrowRight, Sparkles, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <section className="py-16 sm:py-24 texture-paper texture-paper--lotus relative overflow-hidden isolate">
      {/* Seamless Section Top & Bottom Gradient Blends */}
      <div className="section-blend-top" />
      <div className="section-blend-bottom" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-terracotta-100/90 text-terracotta-800 text-xs font-semibold mb-2 border border-terracotta-200">
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
            className="btn-elastic inline-flex items-center gap-1.5 text-sm font-bold text-terracotta-600 hover:text-terracotta-700 group shrink-0"
          >
            <span>Xem tất cả làng nghề</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 no-scrollbar"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`btn-elastic px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === tab.id
                  ? 'bg-lacquer-900 text-white shadow-sm'
                  : 'bg-[#FAF5ED] text-lacquer-800/80 hover:bg-[#F2EAE0] border border-[#d6c4ac]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* EDITORIAL SHOWCASE: Featured Lead Story (Village #0) */}
        {filteredVillages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mb-12 bg-[#FAF5ED] rounded-3xl border border-[#b89b78]/60 overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 group card-craft"
          >
            <div className="lg:col-span-7 relative min-h-[280px] sm:min-h-[360px] lg:min-h-[440px] overflow-hidden bg-dopaper-100 card-sheen">
              <img
                src={filteredVillages[0].heroImage}
                alt={filteredVillages[0].name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#FAF5ED]/95 text-xs font-bold text-terracotta-800 border border-[#d6c4ac] shadow-xs">
                {filteredVillages[0].category}
              </div>
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lacquer-950/85 backdrop-blur-xs text-white text-xs font-medium">
                  <MapPin className="w-3.5 h-3.5 text-gold-400" />
                  <span>{filteredVillages[0].location.district} • {filteredVillages[0].location.distanceFromCenter}</span>
                </span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/20 text-gold-900 text-xs font-bold border border-gold-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                  <span>Làng Nghề Tiêu Biểu Thăng Long</span>
                </div>

                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                  {filteredVillages[0].name}
                </h3>

                <p className="font-serif italic text-sm text-terracotta-700 pl-3 border-l-2 border-terracotta-400">
                  "{filteredVillages[0].tagline}"
                </p>

                <p className="text-xs sm:text-sm text-lacquer-800/80 leading-relaxed">
                  {filteredVillages[0].shortDescription}
                </p>

                {/* Cultural Highlights Tags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(filteredVillages[0].tags || []).slice(0, 3).map((tag: string, i: number) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[#F0E8D7] text-[11px] font-medium text-lacquer-800 border border-[#d6c4ac]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-[#d6c4ac]/60 flex items-center justify-between">
                <div className="text-xs text-lacquer-800/60 font-medium">
                  Khởi lập: <strong className="text-lacquer-900 font-semibold">{filteredVillages[0].history.originPeriod}</strong>
                </div>
                <Link
                  href={`/lang-nghe/${filteredVillages[0].slug}`}
                  className="btn-elastic inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  <span>Khám phá làng nghề</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}

        {/* 3-COLUMN EDITORIAL GRID: Staggered Cards for other villages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredVillages.slice(1, 7).map((village, idx) => (
            <motion.article
              key={village.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="card-craft card-sheen group bg-[#FAF5ED] rounded-3xl border border-[#d6c4ac] shadow-xs hover:shadow-xl hover:border-[#b89b78] transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Photo container with pristine image, zero grey overlay */}
                <div className="relative aspect-[16/10] overflow-hidden bg-dopaper-100">
                  <img
                    src={village.heroImage}
                    alt={village.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#FAF5ED]/95 text-[11px] font-bold text-terracotta-700 border border-[#d6c4ac] shadow-xs">
                    {village.category}
                  </div>
                  {village.gameUrl && (
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gold-400 text-lacquer-950 text-[10px] font-bold shadow-xs flex items-center gap-1">
                      <Sparkles className="w-3 3" />
                      <span>Xưởng ảo</span>
                    </div>
                  )}
                </div>

                {/* Card body with clear metadata */}
                <div className="p-5 sm:p-6 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-lacquer-800/70 pb-1 border-b border-[#d6c4ac]/60">
                    <span className="flex items-center gap-1 font-medium text-terracotta-700">
                      <MapPin className="w-3.5 h-3.5 text-terracotta-500 shrink-0" />
                      <span>{village.location.district}</span>
                    </span>
                    <span className="font-medium text-lacquer-800/60">
                      {village.history.originPeriod}
                    </span>
                  </div>

                  <h3 className="font-serif text-lg sm:text-xl font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors line-clamp-1">
                    {village.name}
                  </h3>

                  <div className="pl-3 border-l-2 border-gold-400 italic font-serif text-xs text-lacquer-800/80 line-clamp-1">
                    "{village.tagline}"
                  </div>

                  <p className="text-xs text-lacquer-800/70 line-clamp-2 leading-relaxed">
                    {village.shortDescription}
                  </p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-5 sm:p-6 pt-0">
                <div className="pt-3 border-t border-[#d6c4ac]/60 flex items-center justify-between">
                  <span className="text-[11px] text-lacquer-800/60 font-medium line-clamp-1 max-w-[55%]">
                    {village.location.distanceFromCenter}
                  </span>
                  <Link
                    href={`/lang-nghe/${village.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-terracotta-600 hover:text-terracotta-700 group-hover:translate-x-1 transition-transform"
                  >
                    <span>Khám phá</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
