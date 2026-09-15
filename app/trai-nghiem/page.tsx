'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Award, ArrowRight, Play, CheckCircle2, Flame, Feather, Trees } from 'lucide-react';
import { getPassport, PassportData } from '@/lib/passportStorage';

export default function ExperienceHubPage() {
  const [passport, setPassport] = useState<PassportData | null>(null);

  useEffect(() => {
    setPassport(getPassport());
    const handler = () => setPassport(getPassport());
    window.addEventListener('passport_updated', handler);
    return () => window.removeEventListener('passport_updated', handler);
  }, []);

  const experiences = [
    {
      id: 'pottery',
      title: 'Xưởng Làm Gốm Bát Tràng',
      subtitle: 'Bàn xoay vuốt gốm 2D Canvas & Nung lò 1.250°C',
      village: 'Làng gốm Bát Tràng',
      category: 'Gốm sứ',
      icon: '🏺',
      duration: 'Khoảng 3 - 5 phút',
      difficulty: 'Dễ tiếp cận',
      badgeName: 'Bậc Thầy Bàn Xoay Bát Tràng',
      href: '/trai-nghiem/gom',
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      description: 'Chọn đất sét phù sa, kéo vuốt biên dạng bình trên bàn xoay chuyển động, phủ nước men lam hoặc men rạn cổ và nhóm lửa nung gốm.',
      steps: ['Lọc đất sét phù sa', 'Vuốt dáng trên bàn xoay', 'Phủ men lam / men rạn', 'Nung lò 1.250°C'],
      isReady: true,
      accentColor: 'from-terracotta-500 to-terracotta-700'
    },
    {
      id: 'hat',
      title: 'Xưởng Khâu Nón Làng Chuông',
      subtitle: 'Uốn 16 vành tre & Lồng câu thơ xứ Đoài',
      village: 'Làng nón Chuông',
      category: 'Nón lá',
      icon: '👒',
      duration: 'Khoảng 3 phút',
      difficulty: 'Khéo léo',
      badgeName: 'Người Đan Nón Xứ Đoài',
      href: '/trai-nghiem/dan-non',
      image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
      description: 'Ủi phẳng lá lụi, xếp đều lên 16 vành nón tre, chèn bài thơ cổ xứ Đoài và khâu từng mũi cước nhỏ li ti hoàn thiện chiếc nón thanh tao.',
      steps: ['Ủi phẳng lá lụi', 'Xếp 16 vành tre', 'Lồng bài thơ lục bát', 'Khâu mũi cước viền nón'],
      isReady: true,
      accentColor: 'from-gold-500 to-amber-700'
    },
    {
      id: 'bamboo',
      title: 'Xưởng Mây Tre Đan Phú Vinh',
      subtitle: 'Chuốt nan mây & Đan họa tiết lóng đôi',
      village: 'Làng mây tre Phú Vinh',
      category: 'Mây tre đan',
      icon: '🎋',
      duration: 'Khoảng 4 phút',
      difficulty: 'Thú vị',
      badgeName: 'Nghệ Nhân Mây Tre Xanh',
      href: '/trai-nghiem/gom', // Points to available workshop
      image: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=800&q=80',
      description: 'Lựa chọn sợi mây dẻo dai từ rừng Tây Bắc, chuốt sợi nan mịn và đan cài các nan dọc ngang tạo thành chiếc khay trà vintage độc đáo.',
      steps: ['Chuốt nan mây dẻo', 'Đan cốt khung viền', 'Đan hoa thị / lóng đôi', 'Quét sơn sáp ong'],
      isReady: false,
      accentColor: 'from-bamboo-500 to-emerald-700'
    }
  ];

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/30 text-lacquer-950 text-xs font-bold border border-gold-400/40">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Xưởng Nghề Tương Tác Ảo</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
            Tự tay làm nghề – Chạm vào tinh hoa
          </h1>
          <p className="text-sm sm:text-base text-lacquer-800/70 leading-relaxed">
            Mô phỏng chân thực các bước làm nghề truyền thống bằng công nghệ tương tác Canvas 2D. Hoàn thành sản phẩm ảo để nhận huy hiệu và chiêm ngưỡng các tác phẩm thật từ nghệ nhân!
          </p>
        </div>

        {/* Passport Status Quick Banner */}
        {passport && (
          <div className="bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-terracotta-700 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gold-400 text-lacquer-950 flex items-center justify-center text-3xl shadow-lg">
                🏮
              </div>
              <div>
                <span className="text-xs text-gold-300 font-semibold uppercase">
                  Tiến độ Hộ Chiếu Làng Nghề
                </span>
                <h3 className="font-serif text-xl font-bold">
                  Bạn đã tích lũy {passport.points} điểm di sản
                </h3>
                <p className="text-xs text-dopaper-200/90">
                  Đã sở hữu {Object.keys(passport.badges).length} huy hiệu • {passport.creations.length} tác phẩm ảo đã tạo
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs bg-white/20 px-3 py-1.5 rounded-xl text-white font-medium">
                Mỗi tác phẩm = +30 điểm
              </span>
            </div>
          </div>
        )}

        {/* Experiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className="bg-white rounded-3xl border border-terracotta-200/90 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden group"
            >
              <div>
                {/* Visual */}
                <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                  <img
                    src={exp.image}
                    alt={exp.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-terracotta-700 shadow">
                    {exp.category}
                  </div>

                  <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white text-xs font-medium">
                    <span className="text-xl">{exp.icon}</span>
                    <span className="font-semibold drop-shadow">{exp.village}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6 space-y-3">
                  <h3 className="font-serif text-xl font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                    {exp.title}
                  </h3>
                  <p className="text-xs font-semibold text-terracotta-600">
                    {exp.subtitle}
                  </p>
                  <p className="text-xs text-lacquer-800/70 leading-relaxed">
                    {exp.description}
                  </p>

                  {/* 4 Process Steps Pills */}
                  <div className="pt-2 space-y-1.5">
                    <span className="text-[11px] font-bold text-lacquer-800/60 uppercase block">
                      Các bước mô phỏng:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {exp.steps.map((st, idx) => (
                        <div
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-dopaper-100 text-[11px] text-lacquer-900 flex items-center gap-1 border border-terracotta-100"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 shrink-0" />
                          <span className="truncate">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom CTA */}
              <div className="p-6 pt-4 border-t border-terracotta-100 flex items-center justify-between">
                <span className="text-xs text-lacquer-800/60">
                  {exp.duration}
                </span>

                {exp.isReady ? (
                  <Link
                    href={exp.href}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow-md transition-all"
                  >
                    <span>Vào trải nghiệm</span>
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-gray-100 text-gray-500 font-semibold text-xs">
                    Sắp ra mắt
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
