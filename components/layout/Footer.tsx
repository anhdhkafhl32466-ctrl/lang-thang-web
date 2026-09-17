import React from 'react';
import Link from 'next/link';
import { Compass, Sparkles, MapPin, Heart, ArrowRight, ShieldCheck, Mail, Phone, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-lacquer-900 text-dopaper-100 pt-16 pb-24 lg:pb-12 border-t-4 border-terracotta-500 relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-terracotta-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-lacquer-800">
          {/* Col 1 & 2: Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-terracotta-400 overflow-hidden shadow-md shrink-0 flex items-center justify-center">
                <img
                  src="/images/lang-thang-logo.png"
                  alt="Lang Thang — Làng Nghề Hà Nội"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold text-white tracking-tight block">
                  Lang Thang
                </span>
                <span className="text-xs text-terracotta-400 block font-serif">
                  Làng Nghề Hà Nội
                </span>
              </div>
            </div>
            <p className="text-sm text-dopaper-200/80 leading-relaxed max-w-sm">
              Nền tảng trải nghiệm du lịch số và kết nối thương mại tinh hoa làng nghề truyền thống Thủ đô. Cầu nối giữa thế hệ trẻ, du khách quốc tế và các nghệ nhân tài hoa ngàn năm.
            </p>
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-lacquer-800/80 border border-terracotta-500/30 text-xs text-gold-300">
                <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                <span className="italic">"Lang Thang ghé một ngôi làng — Theo chân văn hóa, mở ngàn điều hay"</span>
              </div>
            </div>

            {/* Newsletter / Stay connected */}
            <div className="pt-4">
              <p className="text-xs font-semibold text-dopaper-100 uppercase tracking-wider mb-2">
                Nhận tin về các workshop làng nghề mới
              </p>
              <div className="flex max-w-sm">
                <input
                  type="email"
                  placeholder="Email của bạn..."
                  className="bg-lacquer-800 text-dopaper-100 text-xs px-3 py-2.5 rounded-l-lg border border-lacquer-800 focus:outline-none focus:border-terracotta-500 w-full"
                />
                <button
                  type="button"
                  className="bg-terracotta-500 hover:bg-terracotta-600 text-white px-4 py-2.5 rounded-r-lg text-xs font-semibold transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>Đăng ký</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Col 3: Khám phá làng nghề */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-semibold text-white tracking-wide border-l-2 border-terracotta-500 pl-2">
              Làng Nghề Tiêu Biểu
            </h3>
            <ul className="space-y-2 text-sm text-dopaper-200/80">
              <li>
                <Link href="/lang-nghe/bat-trang" className="hover:text-terracotta-400 transition-colors flex items-center justify-between">
                  <span>Gốm Bát Tràng</span>
                  <span className="text-[11px] text-terracotta-400/80">700 năm</span>
                </Link>
              </li>
              <li>
                <Link href="/lang-nghe/van-phuc" className="hover:text-terracotta-400 transition-colors flex items-center justify-between">
                  <span>Lụa Vạn Phúc</span>
                  <span className="text-[11px] text-terracotta-400/80">1000 năm</span>
                </Link>
              </li>
              <li>
                <Link href="/lang-nghe/chuong" className="hover:text-terracotta-400 transition-colors flex items-center justify-between">
                  <span>Nón làng Chuông</span>
                  <span className="text-[11px] text-terracotta-400/80">300 năm</span>
                </Link>
              </li>
              <li>
                <Link href="/lang-nghe/phu-vinh" className="hover:text-terracotta-400 transition-colors flex items-center justify-between">
                  <span>Mây tre Phú Vinh</span>
                  <span className="text-[11px] text-terracotta-400/80">400 năm</span>
                </Link>
              </li>
              <li>
                <Link href="/lang-nghe/dao-thuc" className="hover:text-terracotta-400 transition-colors flex items-center justify-between">
                  <span>Rối nước Đào Thục</span>
                  <span className="text-[11px] text-terracotta-400/80">300 năm</span>
                </Link>
              </li>
              <li>
                <Link href="/ban-do" className="text-gold-400 hover:text-gold-300 font-medium inline-flex items-center gap-1 pt-1">
                  <span>Xem trên bản đồ Hà Nội</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Trải nghiệm & Du lịch */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-semibold text-white tracking-wide border-l-2 border-terracotta-500 pl-2">
              Trải Nghiệm Số
            </h3>
            <ul className="space-y-2 text-sm text-dopaper-200/80">
              <li>
                <Link href="/trai-nghiem/gom" className="hover:text-terracotta-400 transition-colors">
                  🏺 Xưởng gốm ảo Bát Tràng
                </Link>
              </li>
              <li>
                <Link href="/trai-nghiem/dan-non" className="hover:text-terracotta-400 transition-colors">
                  👒 Khâu nón lá làng Chuông
                </Link>
              </li>
              <li>
                <Link href="/ai-goi-y" className="hover:text-terracotta-400 transition-colors">
                  ✨ AI Gợi ý làng nghề cho bạn
                </Link>
              </li>
              <li>
                <Link href="/du-lich" className="hover:text-terracotta-400 transition-colors">
                  🧭 Tour & Workshop thực tế
                </Link>
              </li>
              <li>
                <Link href="/san-pham" className="hover:text-terracotta-400 transition-colors">
                  🛍️ Sàn sản phẩm tinh hoa
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 5: Dành cho đối tác & Startup */}
          <div className="space-y-3">
            <h3 className="font-serif text-base font-semibold text-white tracking-wide border-l-2 border-terracotta-500 pl-2">
              Hợp Tác Phát Triển
            </h3>
            <ul className="space-y-2 text-sm text-dopaper-200/80">
              <li>
                <Link
                  href="/chia-se-lang-nghe"
                  className="inline-flex items-center gap-1.5 text-gold-400 hover:text-gold-300 font-medium"
                >
                  <span>Gửi thông tin làng nghề</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </li>
              <li>
                <span className="text-xs text-dopaper-300/60 block">Dành cho nghệ nhân & cơ sở sản xuất</span>
              </li>
              <li className="pt-2">
                <Link href="/admin" className="text-dopaper-300/60 hover:text-dopaper-100 text-xs flex items-center gap-1">
                  <span>Trang quản trị (Admin Dashboard)</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
              <li className="text-xs text-dopaper-300/60 pt-2">
                Dự án khởi nghiệp đổi mới sáng tạo ứng dụng công nghệ bảo tồn di sản văn hóa Việt Nam.
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-dopaper-300/60 gap-4">
          <p>© {new Date().getFullYear()} Làng Nghề Hà Nội. Bảo tồn & Tinh hoa Di sản Việt Nam.</p>
          <div className="flex items-center gap-6">
            <span>Dữ liệu mẫu phục vụ trình diễn MVP</span>
            <span className="hidden sm:inline">•</span>
            <span className="flex items-center gap-1">
              Được thiết kế với <Heart className="w-3 h-3 text-terracotta-500 fill-terracotta-500" /> dành cho Hà Nội
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
