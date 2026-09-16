'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { TOURS, Tour } from '@/data/tours';
import { formatCurrencyVND } from '@/lib/utils';
import {
  Compass, Clock, Users, Star, CheckCircle2, ArrowRight, ShieldCheck,
  MapPin, Sparkles, Eye, Calendar, Phone, Mail, X
} from 'lucide-react';

export default function TourismPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'workshop' | 'half-day' | 'virtual'>('all');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    name: '',
    phone: '',
    email: '',
    date: '',
    guests: '2'
  });

  const filteredTours = TOURS.filter((t) => {
    if (activeTab === 'workshop') return t.category.includes('Workshop');
    if (activeTab === 'half-day') return t.category.includes('nửa ngày') || t.category.includes('trong ngày');
    return true;
  });

  const virtualSpots = [
    {
      title: 'Chợ Gốm Bát Tràng & Không gian Lò Bầu',
      village: 'Làng gốm Bát Tràng',
      image: '/images/villages/bat-trang/market.jpg',
      description: 'Không gian giao thương sầm uất với hàng ngàn mẫu gốm sứ độc đáo bên triền đê sông Hồng.'
    },
    {
      title: 'Khung Cửi & Xưởng Dệt Lụa Cổ Vạn Phúc',
      village: 'Làng lụa Vạn Phúc',
      image: '/images/villages/van-phuc/loom.jpg',
      description: 'Tiếng thoi đưa lách cách và đôi bàn tay nghệ nhân thoăn thoắt dệt nên những dải lụa Vân tinh tế.'
    },
    {
      title: 'Thủy Đình Múa Rối Nước Đào Thục',
      village: 'Làng rối nước Đào Thục',
      image: '/images/villages/dao-thuc/puppet_show.jpg',
      description: 'Sân khấu mái cong cổ kính giữa hồ sen làng Thụy Lâm, nơi diễn ra các tích trò rối nước mộc mạc.'
    },
    {
      title: 'Nón Lá Truyền Thống Làng Chuông',
      village: 'Làng nón Chuông',
      image: '/images/villages/chuong/non_la_museum.jpg',
      description: 'Những chiếc nón lá trắng bồng bềnh xếp 16 vành tre thanh tao, di sản trăm năm ven bờ sông Đáy.'
    }
  ];

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingSuccess(true);
    setTimeout(() => {
      setBookingSuccess(false);
      setSelectedTour(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>Du Lịch Trực Tuyến & Hành Trình Thực Tế</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
            Trải nghiệm & Tour làng nghề Hà Nội
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70 leading-relaxed">
            Khám phá các điểm đến di sản trực tuyến ngay tại nhà, hoặc đặt các workshop và tour trải nghiệm 1-kèm-1 cùng nghệ nhân bản địa.
          </p>
        </div>

        {/* SECTION 1: DU LỊCH ONLINE (VIRTUAL 360 HOTSPOTS) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-gold-600 uppercase tracking-wider">
                Du Lịch Ngay Tại Nhà
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 mt-0.5">
                Các điểm check-in di sản biểu tượng
              </h2>
            </div>
            <span className="text-xs text-lacquer-800/60">
              Trải nghiệm góc nhìn tương tác & không gian sống động
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {virtualSpots.map((spot, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-gray-900 shadow-md border border-terracotta-200"
              >
                <img
                  src={spot.image}
                  alt={spot.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-lacquer-950 via-lacquer-950/40 to-transparent" />

                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md text-[11px] text-white font-medium">
                  {spot.village}
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-white space-y-1">
                  <h3 className="font-serif text-base font-bold text-white line-clamp-2">
                    {spot.title}
                  </h3>
                  <p className="text-[11px] text-dopaper-200/80 line-clamp-2">
                    {spot.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: SẴN SÀNG ĐI THẬT? (TOUR & WORKSHOP THỰC TẾ) */}
        <section className="space-y-8 pt-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Sẵn Sàng Đi Thật?</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                Gợi ý hành trình & Workshop thực tế
              </h2>
              <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1">
                Mỗi tour được bảo trợ chất lượng và hướng dẫn trực tiếp bởi chính các nghệ nhân làng nghề.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-terracotta-200 shadow-sm shrink-0">
              {[
                { id: 'all', label: 'Tất cả tour' },
                { id: 'workshop', label: 'Workshop làm nghề' },
                { id: 'half-day', label: 'Tour nửa ngày' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-terracotta-500 text-white shadow'
                      : 'text-lacquer-800/70 hover:bg-terracotta-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tours Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTours.map((tour) => (
              <div
                key={tour.id}
                className="bg-white rounded-3xl border border-terracotta-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={tour.image}
                      alt={tour.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-terracotta-700 shadow">
                      {tour.category}
                    </div>
                    {tour.isPopular && (
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gold-500 text-white text-[11px] font-bold shadow">
                        Bán chạy nhất
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-3">
                    <div className="flex items-center justify-between text-xs text-lacquer-800/60">
                      <span className="flex items-center gap-1 font-semibold text-terracotta-600">
                        <MapPin className="w-3.5 h-3.5" />
                        {tour.villageName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-gold-500 fill-gold-500" />
                        <strong className="text-lacquer-900">{tour.rating}</strong> ({tour.reviewsCount})
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                      {tour.name}
                    </h3>

                    <p className="text-xs text-lacquer-800/70 line-clamp-3 leading-relaxed">
                      {tour.shortDescription}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs text-lacquer-800/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {tour.duration}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {tour.groupSize}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-4 border-t border-terracotta-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-lacquer-800/50 block">Giá trọn gói:</span>
                    <span className="text-base font-serif font-bold text-terracotta-600">
                      {formatCurrencyVND(tour.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedTour(tour)}
                    className="px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-all shadow"
                  >
                    Xem & Giữ chỗ
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Booking Modal */}
      {selectedTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lacquer-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border-2 border-terracotta-300 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTour(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-lacquer-900"
            >
              <X className="w-5 h-5" />
            </button>

            {bookingSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-bamboo-100 text-bamboo-600 flex items-center justify-center mx-auto text-3xl">
                  ✓
                </div>
                <h3 className="font-serif text-2xl font-bold text-lacquer-900">
                  Đăng ký giữ chỗ thành công!
                </h3>
                <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-md mx-auto">
                  Điều phối viên làng nghề sẽ gọi điện cho bạn qua số <strong>{bookingForm.phone}</strong> để xác nhận thời gian đón tiếp và cung cấp thông tin nghệ nhân 1-kèm-1.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setSelectedTour(null)}
                    className="px-6 py-2.5 rounded-xl bg-terracotta-500 text-white text-xs font-bold"
                  >
                    Hoàn tất
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-terracotta-600 uppercase">
                    Đặt Chỗ Trải Nghiệm Làng Nghề
                  </span>
                  <h3 className="font-serif text-xl font-bold text-lacquer-900 mt-1">
                    {selectedTour.name}
                  </h3>
                  <p className="text-xs text-lacquer-800/60 mt-1">
                    Giá: <strong className="text-terracotta-600">{formatCurrencyVND(selectedTour.price)}/khách</strong> • {selectedTour.duration}
                  </p>
                </div>

                <div className="p-3 bg-dopaper-100 rounded-xl text-xs space-y-1 border border-terracotta-100">
                  <div className="font-bold text-lacquer-900">Điểm đón & gặp gỡ:</div>
                  <div className="text-lacquer-800/70">{selectedTour.locationMeeting}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-xs font-bold text-lacquer-900 block mb-1">
                      Họ và tên của bạn:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                      className="w-full bg-dopaper-50 text-xs px-3 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-lacquer-900 block mb-1">
                      Số điện thoại nhận tin:
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912 345 678"
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      className="w-full bg-dopaper-50 text-xs px-3 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-lacquer-900 block mb-1">
                      Ngày dự kiến đi:
                    </label>
                    <input
                      type="date"
                      required
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full bg-dopaper-50 text-xs px-3 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-lacquer-900 block mb-1">
                      Số lượng khách:
                    </label>
                    <select
                      value={bookingForm.guests}
                      onChange={(e) => setBookingForm({ ...bookingForm, guests: e.target.value })}
                      className="w-full bg-dopaper-50 text-xs px-3 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                    >
                      <option value="1">1 người</option>
                      <option value="2">2 người (Cặp đôi / Bạn thân)</option>
                      <option value="4">3 - 4 người (Gia đình nhỏ)</option>
                      <option value="8">Đoàn 5 - 10 người</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-lacquer-800/60 italic">
                  * Prototype mô phỏng: Đăng ký giữ chỗ không trừ tiền tài khoản của bạn.
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedTour(null)}
                    className="px-4 py-2.5 rounded-xl border border-terracotta-200 text-xs font-semibold text-lacquer-800"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow"
                  >
                    Xác nhận giữ chỗ trải nghiệm
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
