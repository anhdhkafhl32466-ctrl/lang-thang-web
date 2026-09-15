'use client';

import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, Users, ShoppingCart, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

export default function EcosystemSection() {
  const pillars = [
    {
      id: 'discover',
      title: '1. Discover (Khám phá)',
      tag: 'Bản đồ & Dữ liệu',
      icon: Compass,
      color: 'from-blue-500 to-cyan-600',
      description: 'Bản đồ số tương tác toàn diện hơn 1.350 làng nghề Hà Nội với thông tin chuẩn xác về lịch sử, nghệ nhân, tọa độ và thời điểm ghé thăm lý tưởng.',
      benefits: ['Bản đồ Leaflet đa tầng', 'Bộ lọc chuyên sâu theo loại nghề', 'Thông tin lịch sử xác thực']
    },
    {
      id: 'experience',
      title: '2. Experience (Trải nghiệm)',
      tag: 'Xưởng nghề ảo 2D/Canvas',
      icon: Sparkles,
      color: 'from-terracotta-500 to-terracotta-700',
      description: 'Mô phỏng quy trình vuốt gốm Bát Tràng, đan nón bài thơ làng Chuông và tò he Xuân La bằng công nghệ web tương tác dành cho giới trẻ.',
      benefits: ['Vuốt tạo hình trực quan bằng chuột/chạm', 'Nung gốm và tráng men tự động', 'Tích điểm Hộ chiếu làng nghề']
    },
    {
      id: 'connect',
      title: '3. Connect (Kết nối)',
      tag: 'Tour & Workshop thực tế',
      icon: Users,
      color: 'from-bamboo-600 to-emerald-700',
      description: 'Đưa du khách từ màn hình ảo đến tận xưởng nghệ nhân bằng các gói tour văn hóa, vé tàu điện Metro và lớp học làm nghề thực tế.',
      benefits: ['Đặt workshop trực tiếp với nghệ nhân', 'Tour nửa ngày và 1 ngày linh hoạt', 'Giao lưu văn hóa bản địa']
    },
    {
      id: 'commerce',
      title: '4. Commerce (Thương mại)',
      tag: 'Kinh tế di sản bền vững',
      icon: ShoppingCart,
      color: 'from-amber-500 to-gold-600',
      description: 'Cầu nối xúc tiến thương mại các sản phẩm thủ công OCOP cao cấp lên các sàn thương mại điện tử Shopee, TikTok Shop và đơn hàng xuất khẩu.',
      benefits: ['Chứng nhận nguồn gốc chính hãng', 'Mỗi đơn hàng trực tiếp hỗ trợ nghệ nhân', 'Mô hình hoa hồng chia sẻ doanh thu']
    }
  ];

  return (
    <section className="py-20 bg-dopaper-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-bamboo-50 border border-bamboo-200 text-bamboo-700 text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Mô Hình Khởi Nghiệp Di Sản</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-lacquer-900">
            Hệ sinh thái kết nối 4 trụ cột
          </h2>
          <p className="text-sm sm:text-base text-lacquer-800/70 mt-2">
            Không chỉ là website đọc thông tin, Làng Nghề Hà Nội là giải pháp toàn diện đưa di sản truyền thống hòa nhập vào nền kinh tế số đương đại.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 border border-terracotta-200/80 shadow-sm hover:shadow-xl hover:border-terracotta-400 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-terracotta-100 flex items-center justify-center text-terracotta-600 mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <span className="text-[11px] font-bold uppercase tracking-wider text-gold-600 block">
                    {p.tag}
                  </span>
                  <h3 className="font-serif text-lg font-bold text-lacquer-900 mt-1">
                    {p.title}
                  </h3>
                  <p className="text-xs text-lacquer-800/70 mt-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-terracotta-100 space-y-2">
                  {p.benefits.map((b, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-[11px] text-lacquer-800/80">
                      <CheckCircle2 className="w-3 h-3 text-bamboo-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Startup Flow Infographic */}
        <div className="bg-gradient-to-br from-lacquer-900 to-lacquer-950 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl">
            <span className="text-xs text-gold-400 font-semibold tracking-wider uppercase">
              User Journey & Startup Flywheel
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold mt-1">
              Từ trải nghiệm màn hình tới hành trình thực tế
            </h3>
            <p className="text-xs sm:text-sm text-dopaper-200/80 mt-2 leading-relaxed">
              Người dùng khám phá thông qua Flashcard & AI gợi ý → Trải nghiệm tự tay làm gốm ảo → Chiêm ngưỡng thành phẩm ảo → Nhận gợi ý mua sản phẩm thật tương ứng từ nghệ nhân → Đặt tour workshop trực tiếp tại làng nghề.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/ai-goi-y"
                className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-600 text-lacquer-950 font-bold text-xs sm:text-sm shadow-lg transition-all"
              >
                Trắc nghiệm AI: Tìm làng nghề của bạn
              </Link>
              <Link
                href="/chia-se-lang-nghe"
                className="px-6 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold text-xs sm:text-sm border border-white/25 transition-all"
              >
                Dành cho nghệ nhân: Đóng góp làng nghề
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
