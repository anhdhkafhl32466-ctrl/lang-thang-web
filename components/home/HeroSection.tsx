'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, ArrowRight, MapPin, Award, Map, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-4 pb-14 lg:pt-6 lg:pb-18 texture-paper isolate">
      {/* Seamless Section Top & Bottom Gradient Blends */}
      <div className="section-blend-top" />
      <div className="section-blend-bottom" />

      {/* Subtle traditional motif background dot pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#b89b78_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Editorial Cultural Masthead Note above Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-[#b89b78]/40 pb-3"
        >
          <div className="inline-flex items-center gap-2.5 text-xs text-lacquer-800/80 font-medium">
            <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse" />
            <span className="font-serif italic text-terracotta-700">Chuyên mục Di sản Thủ đô</span>
            <span className="text-terracotta-300">•</span>
            <span className="tracking-wide">Số hóa không gian văn hóa &amp; Làng nghề truyền thống Thăng Long</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/15 text-gold-900 text-xs font-semibold border border-gold-400/40 shadow-xs">
            <Award className="w-3.5 h-3.5 text-gold-600" />
            <span>327 Làng nghề được công nhận</span>
          </div>
        </motion.div>

        {/* MAIN SHOWPIECE: Lang Thang Illustrated Banner (Full artwork zoomed out, completely unobscured) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-xl border-2 border-[#b89b78]/70 bg-[#F4ECE0]/85 group card-craft border-antique-double"
        >
          {/* Crisp traditional vector corner brackets */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t-2 border-l-2 border-[#b89b78] pointer-events-none z-20" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t-2 border-r-2 border-[#b89b78] pointer-events-none z-20" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b-2 border-l-2 border-[#b89b78] pointer-events-none z-20" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b-2 border-r-2 border-[#b89b78] pointer-events-none z-20" />

          {/* Main Illustration Image - Native 16:9 Aspect Ratio with Zero Cropping */}
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-transparent">
            <img
              src="/images/lang-thang-banner.png"
              alt="Lang Thang — Làng Nghề Hà Nội"
              className="w-full h-full object-contain object-center mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.01]"
            />

            {/* MINIMALIST POETIC SLOGAN BADGE (Tucked in bottom-right corner, non-intrusive) */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-5 z-20 pointer-events-auto max-w-xs sm:max-w-sm">
              <div className="bg-[#1F1610]/85 hover:bg-[#1F1610]/95 px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl border border-[#b89b78]/60 shadow-xl text-right transition-all animate-float">
                <p className="font-serif text-[11px] sm:text-xs md:text-sm font-bold text-white tracking-wide leading-snug drop-shadow">
                  “Lang Thang ghé một ngôi làng
                  <br />
                  <span className="text-gold-300 font-normal italic">
                    Theo chân văn hóa, mở ngàn điều hay”
                  </span>
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Button Row below the Artwork */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-1"
        >
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              href="/lang-nghe"
              className="btn-elastic flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-terracotta-500/25 hover:-translate-y-0.5 transition-all"
            >
              <span>Khám phá 327 làng nghề</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ban-do"
              className="btn-elastic flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FAF5ED] hover:bg-[#F2EAE0] text-lacquer-900 text-xs sm:text-sm font-bold border border-[#d6c4ac] shadow-sm transition-all"
            >
              <Map className="w-4 h-4 text-terracotta-600" />
              <span>Bản đồ ranh giới</span>
            </Link>
            <Link
              href="/cua-hang"
              className="btn-elastic flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#FAF5ED] hover:bg-[#F2EAE0] text-lacquer-900 text-xs sm:text-sm font-bold border border-[#d6c4ac] shadow-sm transition-all"
            >
              <Heart className="w-4 h-4 text-terracotta-600" />
              <span>Chợ di sản &amp; Xưởng nghề</span>
            </Link>
            <Link
              href="/trai-nghiem"
              className="btn-elastic hidden md:inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gold-400/20 hover:bg-gold-400/30 text-lacquer-900 text-xs sm:text-sm font-bold border border-gold-300 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span>Trải nghiệm làm nghề</span>
            </Link>
          </div>
        </motion.div>

        {/* Bottom Feature Columns & Quick Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Card 1: Bản đồ phân vùng */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/lang-nghe"
              className="card-craft card-sheen bg-[#FAF5ED] p-6 rounded-3xl border border-[#d6c4ac] shadow-xs hover:shadow-lg hover:border-[#b89b78] transition-all group flex flex-col justify-between h-full"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-terracotta-100 flex items-center justify-center text-terracotta-600 group-hover:scale-110 transition-transform">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                  Bản đồ ranh giới làng nghề
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Rê chuột khám phá 16 vùng ranh giới địa lý tiêu biểu và hệ thống dữ liệu 327 làng nghề được công nhận trên khắp 24 quận, huyện.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-[#d6c4ac]/60 flex items-center justify-between text-xs font-bold text-terracotta-600">
                <span>Mở bản đồ phân vùng</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Card 2: Trải nghiệm tương tác làm nghề */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/trai-nghiem"
              className="card-craft card-sheen bg-[#FAF5ED] p-6 rounded-3xl border border-[#d6c4ac] shadow-xs hover:shadow-lg hover:border-gold-500 transition-all group flex flex-col justify-between h-full"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-gold-100 flex items-center justify-center text-gold-700 group-hover:scale-110 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-gold-700 transition-colors">
                  Trải nghiệm làm nghề ảo &amp; Canvas
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Tự tay nắn vuốt bình gốm Bát Tràng, đan vành nón Chuông ngay trên màn hình và nhận mộc Hộ chiếu làng nghề độc bản.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-[#d6c4ac]/60 flex items-center justify-between text-xs font-bold text-gold-700">
                <span>Vào xưởng trải nghiệm</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>

          {/* Card 3: Sàn thủ công OCOP & Cửa hàng xưởng nghề */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link
              href="/cua-hang"
              className="card-craft card-sheen bg-[#FAF5ED] p-6 rounded-3xl border border-[#d6c4ac] shadow-xs hover:shadow-lg hover:border-emerald-500 transition-all group flex flex-col justify-between h-full"
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-emerald-700 transition-colors">
                  Chợ di sản &amp; Xưởng thủ công OCOP
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Ủng hộ trực tiếp các xưởng nghề: gốm men rạn Bát Tràng, lụa Vạn Phúc, hương thảo mộc Quảng Phú Cầu và mây tre Phú Vinh.
                </p>
              </div>
              <div className="pt-4 mt-2 border-t border-[#d6c4ac]/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Khám phá các xưởng nghề</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Quick Statistics Strip */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="card-craft bg-[#FAF5ED] border border-[#b89b78]/60 rounded-2xl p-4 shadow-sm border-antique grid grid-cols-2 sm:grid-cols-4 gap-4 text-center"
        >
          <div>
            <span className="font-serif text-2xl font-black text-terracotta-600">1.350+</span>
            <p className="text-[11px] text-lacquer-800/70 font-semibold">Làng có nghề (1/3 cả nước)</p>
          </div>
          <div>
            <span className="font-serif text-2xl font-black text-lacquer-900">327</span>
            <p className="text-[11px] text-lacquer-800/70 font-semibold">Làng nghề được công nhận</p>
          </div>
          <div>
            <span className="font-serif text-2xl font-black text-emerald-600">8</span>
            <p className="text-[11px] text-lacquer-800/70 font-semibold">Di sản văn hóa Quốc Gia</p>
          </div>
          <div>
            <span className="font-serif text-2xl font-black text-gold-600">47 / 52</span>
            <p className="text-[11px] text-lacquer-800/70 font-semibold">Nghề truyền thống toàn quốc</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
