import React from 'react';
import Link from 'next/link';
import HeroSection from '@/components/home/HeroSection';
import FlashCards from '@/components/home/FlashCards';
import StorytellingTimeline from '@/components/home/StorytellingTimeline';
import EcosystemSection from '@/components/home/EcosystemSection';
import { Map, Sparkles, ArrowRight, Award, Compass, Heart, ShieldCheck } from 'lucide-react';
import { CRAFT_VILLAGES } from '@/data/craftVillages';

export default function HomePage() {
  return (
    <div className="space-y-0">
      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Flash Cards Làng Nghề */}
      <FlashCards />

      {/* 3. Storytelling: Đất -> Đôi tay -> Nghệ nhân -> Tác phẩm -> Văn hóa -> Trải nghiệm -> Du lịch -> Thương mại */}
      <StorytellingTimeline />

      {/* 4. Interactive Map Teaser Section */}
      <section className="py-20 bg-dopaper-100/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl border border-terracotta-200 shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 p-8 sm:p-12 flex flex-col justify-between space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold mb-3">
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
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-semibold shadow-md transition-all"
                >
                  <span>Mở bản đồ toàn màn hình</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[420px] bg-dopaper-200">
              <img
                src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80"
                alt="Bản đồ làng nghề Hà Nội"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-transparent to-black/20" />
              
              {/* Floating village preview pin */}
              <div className="absolute top-1/3 left-1/3 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-terracotta-300 max-w-[200px] animate-float">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🏺</span>
                  <div>
                    <h4 className="text-xs font-bold text-lacquer-900">Bát Tràng</h4>
                    <span className="text-[10px] text-terracotta-600 font-semibold">14 km • 35 phút</span>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-8 right-8 p-3 rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl border border-terracotta-300 max-w-[200px] animate-float [animation-delay:1.5s]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👒</span>
                  <div>
                    <h4 className="text-xs font-bold text-lacquer-900">Làng Chuông</h4>
                    <span className="text-[10px] text-gold-600 font-semibold">30 km • Nón bài thơ</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Mini-game Experience Callout */}
      <section className="py-20 bg-gradient-to-b from-dopaper-50 to-terracotta-50/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/30 text-lacquer-950 text-xs font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Workshop Ảo 2D & Canvas</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-lacquer-900">
              Tự tay làm nghề ngay trên màn hình
            </h2>
            <p className="text-xs sm:text-sm text-lacquer-800/70 mt-2">
              Không cần đến tận lò gốm, bạn có thể tự tay tạo hình, tráng men và nung chín chiếc bình ảo, hoặc thử khâu từng mũi cước trên vành nón tre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Pottery Game Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-terracotta-300 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80"
                    alt="Vuốt gốm ảo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-terracotta-500 text-white text-[11px] font-bold">
                    Tương tác Canvas vuốt tay
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Xưởng Làm Gốm Bát Tràng
                </h3>
                <p className="text-xs text-lacquer-800/70">
                  Chọn đất sét phù sa, kéo vuốt eo bình trên bàn xoay, phủ men lam hoặc men ngọc celadon và nung lò 1250°C.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-terracotta-100 flex items-center justify-between">
                <span className="text-xs text-gold-600 font-semibold flex items-center gap-1">
                  <Award className="w-4 h-4" /> Mở khóa huy hiệu nghệ nhân
                </span>
                <Link
                  href="/trai-nghiem/gom"
                  className="px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-colors shadow"
                >
                  Bắt đầu vuốt gốm
                </Link>
              </div>
            </div>

            {/* Hat Weaving Game Card */}
            <div className="bg-white rounded-3xl p-6 border-2 border-gold-300 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="aspect-[16/10] rounded-2xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80"
                    alt="Đan nón Chuông ảo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-gold-600 text-white text-[11px] font-bold">
                    Trải nghiệm đan khâu nón
                  </div>
                </div>
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Khâu Nón Lá Bài Thơ Làng Chuông
                </h3>
                <p className="text-xs text-lacquer-800/70">
                  Chọn lá lụi, xếp 16 vành nón tre, đưa từng đường kim mũi cước và chèn câu thơ xứ Đoài ẩn hiện dưới ánh nắng.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gold-100 flex items-center justify-between">
                <span className="text-xs text-gold-600 font-semibold flex items-center gap-1">
                  <Award className="w-4 h-4" /> Nhận huy hiệu thợ nón xứ Đoài
                </span>
                <Link
                  href="/trai-nghiem/dan-non"
                  className="px-4 py-2 rounded-xl bg-lacquer-900 hover:bg-lacquer-800 text-white text-xs font-bold transition-colors shadow"
                >
                  Bắt đầu khâu nón
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Startup Ecosystem 4 Pillars */}
      <EcosystemSection />

      {/* 7. CTA: AI Recommendation Callout */}
      <section className="py-16 bg-terracotta-500 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-gold-300" />
            <span>AI Đề Xuất Cá Nhân Hóa</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold">
            Chưa biết cuối tuần này nên đi làng nghề nào?
          </h2>
          <p className="text-sm sm:text-base text-dopaper-100/90 max-w-2xl mx-auto">
            Chỉ với 4 câu hỏi trắc nghiệm nhanh về sở thích, ngân sách và đối tượng đi cùng, thuật toán AI sẽ chọn ra làng nghề phù hợp nhất và lên lịch trình hoàn chỉnh cho bạn!
          </p>
          <div className="pt-2">
            <Link
              href="/ai-goi-y"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gold-400 hover:bg-gold-300 text-lacquer-950 font-bold text-sm shadow-xl hover:scale-105 transition-all"
            >
              <span>Tìm làng nghề dành riêng cho bạn</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
