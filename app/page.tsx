'use client';

import React from 'react';
import Link from 'next/link';
import HeroSection from '@/components/home/HeroSection';
import FlashCards from '@/components/home/FlashCards';
import StorytellingTimeline from '@/components/home/StorytellingTimeline';
import EcosystemSection from '@/components/home/EcosystemSection';
import { Map, Sparkles, ArrowRight, Award, Compass, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="space-y-0 selection:bg-terracotta-200 selection:text-terracotta-900">
      {/* 1. Hero Section (Isolated, with Sacred Banner & Quick Stats) */}
      <HeroSection />

      {/* 2. Flash Cards Làng Nghề (Lotus Pattern, Staggered Reveal) */}
      <FlashCards />

      {/* 3. Storytelling: Đất -> Đôi tay -> Nghệ nhân -> Tác phẩm -> Văn hóa -> Trải nghiệm -> Du lịch -> Thương mại */}
      <StorytellingTimeline />

      {/* 4. Interactive Map Teaser Section */}
      <section className="py-20 texture-paper relative overflow-hidden isolate">
        {/* Seamless Section Top & Bottom Gradient Blends */}
        <div className="section-blend-top" />
        <div className="section-blend-bottom" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="card-craft bg-[#FAF5ED] rounded-3xl border border-[#b89b78]/60 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border-antique"
          >
            <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold mb-3 border border-terracotta-200">
                  <Map className="w-3.5 h-3.5" />
                  <span>Bản Đồ Số Làng Nghề Hà Nội</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 leading-tight">
                  Tất cả làng nghề trên cùng một tọa độ
                </h2>
                <p className="text-xs sm:text-sm text-lacquer-800/70 mt-3 leading-relaxed">
                  Định vị chuẩn xác các làng nghề từ Gia Lâm, Hà Đông, Thanh Oai đến Đông Anh. Lọc theo chuyên ngành gốm, lụa, mây tre hoặc nón lá để lên kế hoạch du lịch cuối tuần hoàn hảo.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-lacquer-900">
                  <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                  <span>Chỉ đường trực tiếp & thời gian di chuyển từ trung tâm</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-lacquer-900">
                  <span className="w-2 h-2 rounded-full bg-gold-500" />
                  <span>Tích hợp thông tin giờ mở cửa, giá vé & địa chỉ nghệ nhân</span>
                </div>
              </div>

              <div>
                <Link
                  href="/ban-do"
                  className="btn-elastic inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-semibold shadow-md transition-all"
                >
                  <span>Mở bản đồ toàn màn hình</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[420px] bg-dopaper-200 card-sheen">
              <img
                src="/images/villages/bat-trang/market.jpg"
                alt="Bản đồ làng nghề Hà Nội"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#FAF5ED]/30 via-transparent to-black/20" />
              
              {/* Floating village preview pin */}
              <div className="absolute top-1/3 left-1/3 p-3 rounded-2xl bg-[#FAF5ED] shadow-xl border border-[#b89b78]/60 max-w-[200px] animate-float">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏺</span>
                  <div>
                    <h4 className="text-xs font-bold text-lacquer-900">Bát Tràng</h4>
                    <span className="text-[10px] text-terracotta-600 font-semibold">14 km • 35 phút</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 p-3 rounded-2xl bg-[#FAF5ED] shadow-xl border border-[#b89b78]/60 max-w-[200px] animate-float [animation-delay:1.5s]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👒</span>
                  <div>
                    <h4 className="text-xs font-bold text-lacquer-900">Làng Chuông</h4>
                    <span className="text-[10px] text-gold-600 font-semibold">30 km • Nón bài thơ</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Mini-game Experience Callout */}
      <section className="py-20 texture-paper relative overflow-hidden isolate">
        {/* Seamless Section Top & Bottom Gradient Blends */}
        <div className="section-blend-top" />
        <div className="section-blend-bottom" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center max-w-2xl mx-auto mb-12"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/25 text-lacquer-950 text-xs font-bold mb-2 border border-gold-400/40">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Workshop Ảo 2D & Canvas</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-lacquer-900">
              Tự tay làm nghề ngay trên màn hình
            </h2>
            <p className="text-xs sm:text-sm text-lacquer-800/70 mt-2">
              Không cần đến tận lò gốm, bạn có thể tự tay tạo hình, tráng men và nung chín chiếc bình ảo, hoặc thử khâu từng mũi cước trên vành nón tre.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pottery Game Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="card-craft card-sheen bg-[#FAF5ED] rounded-3xl p-6 border-2 border-[#b89b78]/70 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between group border-antique"
            >
              <div className="space-y-4">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden relative">
                  <img
                    src="/images/villages/bat-trang/artisan_wheel.jpg"
                    alt="Vuốt gốm ảo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-terracotta-500 text-white text-[11px] font-bold shadow-xs">
                    Tương tác Canvas vuốt tay
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                  Xưởng Làm Gốm Bát Tràng
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Chọn đất sét phù sa, kéo vuốt eo bình trên bàn xoay, phủ men lam hoặc men ngọc celadon và nung lò 1250°C.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#d6c4ac]/60 flex items-center justify-between">
                <span className="text-xs text-gold-600 font-semibold flex items-center gap-1">
                  <Award className="w-4 h-4" /> Mở khóa huy hiệu nghệ nhân
                </span>
                <Link
                  href="/trai-nghiem/gom"
                  className="btn-elastic px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-colors shadow"
                >
                  Bắt đầu vuốt gốm
                </Link>
              </div>
            </motion.div>

            {/* Hat Weaving Game Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="card-craft card-sheen bg-[#FAF5ED] rounded-3xl p-6 border-2 border-[#b89b78]/70 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between group border-antique"
            >
              <div className="space-y-4">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden relative">
                  <img
                    src="/images/villages/chuong/non_la_museum.jpg"
                    alt="Đan nón Chuông ảo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gold-600 text-white text-[11px] font-bold shadow-xs">
                    Trải nghiệm đan khâu nón
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-lacquer-900 group-hover:text-gold-700 transition-colors">
                  Khâu Nón Lá Bài Thơ Làng Chuông
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Chọn lá lụi, xếp 16 vành nón tre, đưa từng đường kim mũi cước và chèn câu thơ xứ Đoài ẩn hiện dưới ánh nắng.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-[#d6c4ac]/60 flex items-center justify-between">
                <span className="text-xs text-gold-600 font-semibold flex items-center gap-1">
                  <Award className="w-4 h-4" /> Nhận huy hiệu thợ nón xứ Đoài
                </span>
                <Link
                  href="/trai-nghiem/dan-non"
                  className="btn-elastic px-4 py-2 rounded-xl bg-lacquer-900 hover:bg-lacquer-800 text-white text-xs font-bold transition-colors shadow"
                >
                  Bắt đầu khâu nón
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Startup Ecosystem 4 Pillars (Breathing Room Section) */}
      <EcosystemSection />

      {/* 7. CTA: AI Recommendation Callout */}
      <section className="py-20 texture-paper relative overflow-hidden isolate">
        <div className="section-blend-top" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 16 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-3xl p-8 sm:p-14 text-center space-y-6 overflow-hidden shadow-2xl bg-gradient-to-br from-[#1F1610] via-[#2A1D15] to-[#1a120d] border-2 border-[#b89b78]/60 border-antique-double text-white"
          >
            {/* Elegant SVG corner accents */}
            <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-gold-400/50 pointer-events-none" />
            <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-gold-400/50 pointer-events-none" />
            <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-gold-400/50 pointer-events-none" />
            <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-gold-400/50 pointer-events-none" />

            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/20 text-gold-300 text-xs font-semibold border border-gold-400/30">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>AI Đề Xuất Cá Nhân Hóa</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Chưa biết cuối tuần này nên đi làng nghề nào?
            </h2>
            <p className="text-sm sm:text-base text-dopaper-100/85 max-w-2xl mx-auto leading-relaxed">
              Chỉ với 4 câu hỏi trắc nghiệm nhanh về sở thích, ngân sách và đối tượng đi cùng, thuật toán AI sẽ chọn ra làng nghề phù hợp nhất và lên lịch trình hoàn chỉnh cho bạn!
            </p>
            <div className="pt-2">
              <Link
                href="/ai-goi-y"
                className="btn-elastic inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gold-400 hover:bg-gold-300 text-lacquer-950 font-bold text-sm shadow-xl hover:scale-105 transition-all"
              >
                <span>Tìm làng nghề dành riêng cho bạn</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
