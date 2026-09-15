'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { unlockBadge, saveCreation } from '@/lib/passportStorage';
import { Sparkles, CheckCircle2, ArrowRight, Award, Sun, Heart } from 'lucide-react';
import { PRODUCTS } from '@/data/products';

export default function HatWeavingGamePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [ironProgress, setIronProgress] = useState(0);
  const [placedRims, setPlacedRims] = useState(0);
  const [selectedPoem, setSelectedPoem] = useState(
    'Ai về làng Chuông quê tôi / Ngắm vành nón lá bài thơ thắm tình'
  );
  const [stitchCount, setStitchCount] = useState(0);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);

  const poems = [
    'Ai về làng Chuông quê tôi / Ngắm vành nón lá bài thơ thắm tình',
    'Nón Chuông che nắng che mưa / Cho duyên thôn nữ say sưa trọn đời',
    'Gió đưa cành trúc la đà / Tiếng chuông Trấn Vũ, canh gà Thọ Xương'
  ];

  const handleIronLeaf = () => {
    if (ironProgress < 100) {
      const next = ironProgress + 25;
      setIronProgress(next);
      if (next >= 100) {
        setTimeout(() => setStep(2), 600);
      }
    }
  };

  const handleAddRim = () => {
    if (placedRims < 16) {
      const next = placedRims + 4;
      setPlacedRims(next);
      if (next >= 16) {
        setTimeout(() => setStep(3), 600);
      }
    }
  };

  const handleStitch = () => {
    if (stitchCount < 16) {
      const next = stitchCount + 4;
      setStitchCount(next);
      if (next >= 16) {
        setTimeout(() => {
          setStep(5);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          const badge = unlockBadge('badge-hat');
          if (badge) setBadgeUnlocked(true);

          saveCreation({
            id: `hat-${Date.now()}`,
            type: 'hat',
            title: 'Nón Lá Bài Thơ Làng Chuông',
            villageName: 'Làng nón Chuông',
            date: new Date().toISOString(),
            details: { poem: selectedPoem }
          });
        }, 600);
      }
    }
  };

  const chuongProducts = PRODUCTS.filter((p) => p.villageId === 'chuong');

  return (
    <div className="min-h-screen py-8 sm:py-14 bg-dopaper-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/trai-nghiem"
            className="text-xs font-semibold text-lacquer-800/70 hover:text-terracotta-600 flex items-center gap-1"
          >
            ← Quay lại Trung tâm trải nghiệm
          </Link>
          <span className="text-xs bg-gold-400/30 text-lacquer-950 font-bold px-3 py-1 rounded-full border border-gold-400/40">
            Workshop Nón Lá Làng Chuông
          </span>
        </div>

        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-lacquer-900">
            Khâu nón lá bài thơ làng Chuông
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70">
            Tự tay trải nghiệm từng bước: Ủi lá lụi → Uốn 16 vành tre → Lồng câu thơ → Khâu mũi cước viền nón.
          </p>
        </div>

        {/* Stepper Progress */}
        <div className="grid grid-cols-4 gap-2 max-w-xl mx-auto">
          {[
            { step: 1, label: '1. Ủi lá lụi' },
            { step: 2, label: '2. Xếp 16 vành' },
            { step: 3, label: '3. Lồng thơ' },
            { step: 4, label: '4. Khâu cước' },
          ].map((s) => (
            <div
              key={s.step}
              className={`py-2 text-center rounded-xl text-xs font-bold border transition-all ${
                step === s.step || (step === 5 && s.step === 4)
                  ? 'bg-gold-500 text-lacquer-950 border-gold-500 shadow-md'
                  : 'bg-white text-lacquer-800/60 border-terracotta-200'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Interactive Workshop Board */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/90 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Interactive Stage Preview */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-8 bg-dopaper-100/60 rounded-2xl border border-terracotta-200/70 min-h-[340px] relative overflow-hidden">
            {/* Cone / Hat SVG representation */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              {/* Backglow for poem */}
              <div className="absolute inset-0 bg-amber-100/40 rounded-full filter blur-xl" />

              <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-md">
                {/* Conical hat shape */}
                <polygon
                  points="100,20 15,140 185,140"
                  fill={ironProgress > 0 ? '#FDF8EC' : '#D1C7B7'}
                  stroke="#8C7355"
                  strokeWidth="2"
                />

                {/* Concentric rings / rims (16 rims simulated) */}
                {Array.from({ length: placedRims }).map((_, idx) => {
                  const y = 25 + (idx + 1) * 6.8;
                  const halfW = (idx + 1) * 5;
                  return (
                    <line
                      key={idx}
                      x1={100 - halfW}
                      y1={y}
                      x2={100 + halfW}
                      y2={y}
                      stroke="#B89770"
                      strokeWidth="1.2"
                      strokeDasharray={step >= 4 ? '3,2' : 'none'}
                    />
                  );
                })}

                {/* Silhouette Poem under sunlight (Visible in Step 3, 4, 5) */}
                {step >= 3 && (
                  <text
                    x="100"
                    y="100"
                    textAnchor="middle"
                    fill="rgba(120, 80, 50, 0.45)"
                    fontSize="7"
                    fontFamily="serif"
                    fontStyle="italic"
                  >
                    {selectedPoem.split('/')[0]}
                  </text>
                )}
                {step >= 3 && (
                  <text
                    x="100"
                    y="112"
                    textAnchor="middle"
                    fill="rgba(120, 80, 50, 0.45)"
                    fontSize="7"
                    fontFamily="serif"
                    fontStyle="italic"
                  >
                    {selectedPoem.split('/')[1]}
                  </text>
                )}

                {/* Silk Ribbon */}
                {step === 5 && (
                  <path
                    d="M 50,140 Q 100,185 150,140"
                    fill="none"
                    stroke="#D97706"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}
              </svg>
            </div>

            <span className="text-xs font-semibold text-lacquer-800/70 mt-2">
              Mô phỏng nón lá bài thơ 16 vành tre xứ Đoài
            </span>
          </div>

          {/* Step Controls */}
          <div className="lg:col-span-6 space-y-6">
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Bước 1: Chọn lá lụi & ủi phẳng
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Lá nón xanh non được vò trong cát, sấy khô rồi dùng lưỡi cày gang nóng vuốt thật phẳng mà không làm rách gân lá.
                </p>

                <div className="p-4 bg-amber-50/70 rounded-2xl border border-gold-300 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-lacquer-900">
                    <span>Độ phẳng mượt của lá lụi:</span>
                    <span>{ironProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gold-500 h-full transition-all"
                      style={{ width: `${ironProgress}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleIronLeaf}
                  className="w-full py-3 rounded-2xl bg-gold-500 hover:bg-gold-600 text-lacquer-950 font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <Sun className="w-4 h-4 text-lacquer-950" />
                  <span>Dùng lưỡi cày gang ủi phẳng lá (Nhấn {4 - ironProgress / 25} lần nữa)</span>
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Bước 2: Xếp vành nón tre (16 vành)
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  16 vành tre vót tròn đều tượng trưng cho độ trọn vẹn của tuổi trăng tròn được nghệ nhân xếp cân xứng từ đỉnh xuống chân nón.
                </p>

                <div className="p-4 bg-amber-50/70 rounded-2xl border border-gold-300 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-lacquer-900">
                    <span>Số vành nón đã xếp:</span>
                    <span>{placedRims} / 16 vành</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gold-500 h-full transition-all"
                      style={{ width: `${(placedRims / 16) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddRim}
                  className="w-full py-3 rounded-2xl bg-gold-500 hover:bg-gold-600 text-lacquer-950 font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <span>Đặt và uốn vành nón tre ({placedRims}/16)</span>
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Bước 3: Lồng câu thơ xứ Đoài vào lòng nón
                </h3>
                <p className="text-xs text-lacquer-800/70">
                  Chọn câu thơ lục bát để lồng vào giữa hai lớp lá. Khi soi dưới nắng, câu thơ sẽ hiện rõ lung linh.
                </p>

                <div className="space-y-2">
                  {poems.map((poem, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedPoem(poem)}
                      className={`p-3 rounded-xl border cursor-pointer text-xs transition-all ${
                        selectedPoem === poem
                          ? 'bg-gold-100 border-gold-500 font-serif italic text-lacquer-900 font-bold shadow-sm'
                          : 'bg-dopaper-50 border-terracotta-200 text-lacquer-800/80'
                      }`}
                    >
                      "{poem}"
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3 rounded-2xl bg-gold-500 hover:bg-gold-600 text-lacquer-950 font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2"
                >
                  <span>Xác nhận câu thơ & Sang khâu nón</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Bước 4: Khâu từng mũi cước viền nón
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Dùng kim khâu mũi nhỏ li ti từ chóp nón xuống vành chân, mỗi centimet 3-4 mũi khâu chắc chắn không để lộ vết chỉ.
                </p>

                <div className="p-4 bg-amber-50/70 rounded-2xl border border-gold-300 space-y-2">
                  <div className="flex justify-between text-xs font-bold text-lacquer-900">
                    <span>Đường chỉ cước viền nón:</span>
                    <span>{stitchCount} / 16 công đoạn</span>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gold-500 h-full transition-all"
                      style={{ width: `${(stitchCount / 16) * 100}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleStitch}
                  className="w-full py-3 rounded-2xl bg-gold-500 hover:bg-gold-600 text-lacquer-950 font-bold text-xs sm:text-sm shadow flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <span>Đưa kim khâu mũi cước ({stitchCount}/16)</span>
                </button>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4 animate-fadeIn">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bamboo-100 text-bamboo-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-bamboo-600" />
                  <span>Hoàn Thành Chiếc Nón Bài Thơ!</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-lacquer-900">
                  Nón bài thơ xứ Đoài của bạn đã hoàn thành
                </h3>

                <p className="text-xs text-lacquer-800/70">
                  Khi soi lên ánh nắng mặt trời, bạn sẽ thấy câu thơ: <br />
                  <span className="font-serif italic font-semibold text-terracotta-600">
                    "{selectedPoem}"
                  </span>
                </p>

                {badgeUnlocked && (
                  <div className="p-3.5 bg-gold-100 rounded-2xl border border-gold-400 flex items-center gap-3">
                    <span className="text-3xl">👒</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-terracotta-700 block">
                        Huy hiệu mới mở khóa
                      </span>
                      <h4 className="text-sm font-bold text-lacquer-900">
                        Người Đan Nón Xứ Đoài
                      </h4>
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-terracotta-200 space-y-2">
                  <p className="text-xs font-bold text-terracotta-700">
                    Bạn có muốn sở hữu nón bài thơ thật từ nghệ nhân làng Chuông?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/san-pham"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gold-500 hover:bg-gold-600 text-lacquer-950 text-xs font-bold text-center shadow"
                    >
                      Xem nón lá bài thơ thật
                    </Link>
                    <Link
                      href="/du-lich"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-lacquer-900 hover:bg-lacquer-800 text-white text-xs font-bold text-center shadow"
                    >
                      Xem tour săn chợ phiên làng Chuông
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Real Product Section */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">
                Sản Phẩm Nghệ Nhân
              </span>
              <h2 className="font-serif text-2xl font-bold text-lacquer-900 mt-1">
                Nón lá thật từ làng Chuông Thanh Oai
              </h2>
            </div>
            <Link
              href="/san-pham"
              className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
            >
              <span>Xem tất cả sản phẩm</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {chuongProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-terracotta-200 bg-dopaper-50/50 flex flex-col sm:flex-row items-center gap-4"
              >
                <img
                  src={prod.image}
                  alt={prod.name}
                  className="w-28 h-28 rounded-xl object-cover shrink-0"
                />
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <h4 className="font-serif text-sm font-bold text-lacquer-900">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-lacquer-800/60 line-clamp-2">
                    {prod.description}
                  </p>
                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-terracotta-600">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                    </span>
                    <a
                      href={prod.shopeeUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-terracotta-500 text-white text-xs font-semibold hover:bg-terracotta-600"
                    >
                      Mua sản phẩm
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
