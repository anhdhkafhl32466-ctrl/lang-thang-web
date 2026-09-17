'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, ArrowRight, MapPin, Award, Map, Heart } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-4 pb-12 lg:pt-6 lg:pb-16 bg-gradient-to-b from-dopaper-100 via-dopaper-50 to-dopaper-100">
      {/* Background traditional wave & cloud motifs */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(#e5a882_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-terracotta-200 text-xs sm:text-sm text-terracotta-800 font-semibold shadow-sm">
            <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse" />
            <span>Cổng thông tin & Trải nghiệm Di sản Làng nghề Hà Nội</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-100 text-gold-900 text-xs font-bold border border-gold-300 shadow-sm">
            <Award className="w-3.5 h-3.5 text-gold-600" />
            <span>327 Làng nghề được công nhận</span>
          </div>
        </div>

        {/* MAIN SHOWPIECE: Lang Thang Illustrated Banner (Full artwork zoomed out, completely unobscured) */}
        <div className="relative max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl border-2 border-terracotta-300/80 bg-white group">
          {/* Main Illustration Image - Native 16:9 Aspect Ratio with Zero Cropping */}
          <div className="relative w-full aspect-[16/9] overflow-hidden bg-dopaper-200">
            <img
              src="/images/lang-thang-banner.png"
              alt="Lang Thang — Làng Nghề Hà Nội"
              className="w-full h-full object-contain object-center"
            />

            {/* MINIMALIST POETIC SLOGAN BADGE (Tucked in bottom-right corner, non-intrusive) */}
            <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-5 z-20 pointer-events-auto max-w-xs sm:max-w-sm">
              <div className="bg-black/50 hover:bg-black/60 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2.5 rounded-2xl border border-white/25 shadow-xl text-right transition-all">
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
        </div>

        {/* Action Button Row below the Artwork */}
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <Link
              href="/lang-nghe"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-terracotta-500/25 hover:-translate-y-0.5 transition-all"
            >
              <span>Khám phá 327 làng nghề</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/ban-do"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white hover:bg-terracotta-50 text-lacquer-900 text-xs sm:text-sm font-bold border border-terracotta-200 shadow-sm transition-all"
            >
              <Map className="w-4 h-4 text-terracotta-600" />
              <span>Bản đồ ranh giới</span>
            </Link>
            <Link
              href="/trai-nghiem"
              className="hidden md:inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gold-400/20 hover:bg-gold-400/30 text-lacquer-900 text-xs sm:text-sm font-bold border border-gold-300 shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span>Trải nghiệm làm nghề</span>
            </Link>
          </div>
        </div>

        {/* Bottom Feature Columns & Quick Navigation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
          {/* Card 1: Bản đồ phân vùng */}
          <Link
            href="/lang-nghe"
            className="bg-white p-5 rounded-3xl border border-terracotta-200/90 shadow-sm hover:shadow-xl hover:border-terracotta-400 transition-all group flex flex-col justify-between"
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
            <div className="pt-4 mt-2 border-t border-terracotta-100 flex items-center justify-between text-xs font-bold text-terracotta-600">
              <span>Mở bản đồ phân vùng</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Trải nghiệm tương tác làm nghề */}
          <Link
            href="/trai-nghiem"
            className="bg-white p-5 rounded-3xl border border-terracotta-200/90 shadow-sm hover:shadow-xl hover:border-gold-400 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-gold-100 flex items-center justify-center text-gold-700 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-gold-700 transition-colors">
                Trải nghiệm làm nghề ảo & Canvas
              </h3>
              <p className="text-xs text-lacquer-800/70 leading-relaxed">
                Tự tay nắn vuốt bình gốm Bát Tràng, đan vành nón Chuông ngay trên màn hình và nhận mộc Hộ chiếu làng nghề độc bản.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-gold-100 flex items-center justify-between text-xs font-bold text-gold-700">
              <span>Vào xưởng trải nghiệm</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Sàn thủ công OCOP */}
          <Link
            href="/san-pham"
            className="bg-white p-5 rounded-3xl border border-terracotta-200/90 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all group flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
                <Heart className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-emerald-700 transition-colors">
                Kết nối nghệ nhân & Sản phẩm OCOP
              </h3>
              <p className="text-xs text-lacquer-800/70 leading-relaxed">
                Ủng hộ trực tiếp các nghệ nhân với sản phẩm khảm trai Chuôn Ngọ, sơn mài Hạ Thái, tăm hương thảo mộc và lụa Vạn Phúc.
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-emerald-100 flex items-center justify-between text-xs font-bold text-emerald-700">
              <span>Xem gian hàng thủ công</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Quick Statistics Strip */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-terracotta-200 shadow-sm grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
        </div>
      </div>
    </section>
  );
}
