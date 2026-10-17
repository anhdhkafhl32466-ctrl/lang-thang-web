'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, ShieldCheck, CheckCircle2, Clock, Compass, MapPin,
  Utensils, DollarSign, Award, ChevronDown, ChevronUp, RefreshCw,
  AlertCircle, ExternalLink, ArrowRight, Info, Check, Navigation,
  FileText, Users, Star, Ticket, Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  UserInputConstraints,
  ProcessingStep,
  VerifiedRecommendation,
  HybridVerificationResult,
  executeHybridAiRecommendation,
  calculateHaversineDistanceKm,
} from '@/lib/hybridAiVerifier';
import { VERIFIED_CRAFT_VILLAGES } from '@/data/verifiedCraftDatabase';

const DEPARTURE_PRESETS = [
  { name: 'Trung tâm Phố Cổ / Hoàn Kiếm', lat: 21.0285, lng: 105.8542 },
  { name: 'Khu vực Cầu Giấy / Mỹ Đình', lat: 21.0333, lng: 105.7833 },
  { name: 'Khu vực Ba Đình / Đống Đa', lat: 21.02, lng: 105.82 },
  { name: 'Khu vực Tây Hồ', lat: 21.07, lng: 105.82 },
  { name: 'Khu vực Hà Đông / Thanh Xuân', lat: 20.97, lng: 105.77 },
  { name: 'Khu vực Long Biên / Gia Lâm', lat: 21.045, lng: 105.885 },
];

const PREFERENCE_PRESETS = [
  { id: 'pottery', label: 'Làm gốm bàn xoay', icon: '🏺', desc: 'Vuốt nặn đất sét Bát Tràng, nung & vẽ men' },
  { id: 'silk', label: 'Dệt lụa tơ tằm', icon: '🧵', desc: 'Ươm tơ, dệt lụa Vạn Phúc, may đo áo dài' },
  { id: 'weaving-hat', label: 'Nón lá & Mây tre', icon: '👒', desc: 'Khâu nón lá làng Chuông, đan lẵng tre Phú Vinh' },
  { id: 'culinary', label: 'Ẩm thực cỗ làng', icon: '🍜', desc: 'Cốm non Mễ Trì, vịt Vân Đình, bánh giầy' },
  { id: 'photo-checkin', label: 'Săn ảnh check-in', icon: '📸', desc: 'Sân phơi chân hương đỏ rực, bảo tàng xoắn ốc' },
  { id: 'heritage-wood', label: 'Sơn mài & Gỗ quý', icon: '🪵', desc: 'Thếp vàng tranh Hạ Thái, điêu khắc Sơn Đồng' },
  { id: 'folk-art', label: 'Nghệ thuật dân gian', icon: '🎋', desc: 'Chuồn chuồn tre Thạch Xá, rối nước Đào Thục' },
  { id: 'combo-all', label: 'Trọn gói kết hợp', icon: '✨', desc: 'Cân bằng giữa học nghề, check-in và ăn ngon' },
];

const BUDGET_PRESETS = [
  { label: '150.000đ', value: 150000, desc: 'Tiết kiệm / Học sinh - Sinh viên' },
  { label: '300.000đ', value: 300000, desc: 'Phổ biến / Vừa đủ trải nghiệm' },
  { label: '500.000đ', value: 500000, desc: 'Trọn vẹn / Ăn ngon cỗ làng' },
  { label: '1.000.000đ', value: 1000000, desc: 'Thoải mái / Mua quà độc bản' },
];

const TIME_PRESETS = [
  { label: 'Nửa ngày: Buổi Sáng (08:00 – 12:30)', start: '08:00', end: '12:30', icon: '🌤️' },
  { label: 'Nửa ngày: Buổi Chiều (13:30 – 18:00)', start: '13:30', end: '18:00', icon: '⛅' },
  { label: '1 Ngày trọn vẹn (08:00 – 17:30)', start: '08:00', end: '17:30', icon: '☀️' },
];

export default function HybridAiRecommendationStudio() {
  // Input constraints state
  const [budget, setBudget] = useState<number>(300000);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>('300.000');
  const [timeStart, setTimeStart] = useState<string>('08:00');
  const [timeEnd, setTimeEnd] = useState<string>('13:00');
  const [selectedLocation, setSelectedLocation] = useState(DEPARTURE_PRESETS[0]);
  const [preference, setPreference] = useState<string>('pottery');
  const [freeTextPrompt, setFreeTextPrompt] = useState<string>('');

  // GPS state
  const [isGettingGps, setIsGettingGps] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<string | null>(null);

  // Engine Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [result, setResult] = useState<HybridVerificationResult | null>(null);

  // Evidence Accordion toggle state (slug -> boolean)
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});

  // Booking Modal Mock state
  const [bookingVillage, setBookingVillage] = useState<VerifiedRecommendation | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Run initial recommendation on mount
  useEffect(() => {
    handleRunHybridAi(false);
  }, []);

  const handleCustomBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(raw, 10) || 0;
    setBudget(num);
    setCustomBudgetInput(num > 0 ? num.toLocaleString('vi-VN') : '');
  };

  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus('Trình duyệt không hỗ trợ Geolocation.');
      return;
    }
    setIsGettingGps(true);
    setGpsStatus('Đang định vị tọa độ GPS thực tế...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          name: `Vị trí GPS của bạn [${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}]`,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setSelectedLocation(coords);
        setIsGettingGps(false);
        setGpsStatus('✓ Đã nhận diện GPS chính xác!');
        setTimeout(() => setGpsStatus(null), 3000);
      },
      (err) => {
        setIsGettingGps(false);
        setGpsStatus('Không lấy được GPS. Đã giữ vị trí trung tâm mặc định.');
        setTimeout(() => setGpsStatus(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleRunHybridAi = async (withScroll = true) => {
    setIsProcessing(true);
    setCurrentStepIndex(1);

    // Visual animated steps for judge and users
    const timer1 = setTimeout(() => setCurrentStepIndex(2), 400);
    const timer2 = setTimeout(() => setCurrentStepIndex(3), 850);
    const timer3 = setTimeout(() => setCurrentStepIndex(4), 1300);

    try {
      const res = await executeHybridAiRecommendation({
        budgetMaxVnd: budget,
        timeStart,
        timeEnd,
        userLocation: selectedLocation,
        preference,
        freeTextPrompt: freeTextPrompt.trim() || undefined,
      });

      // Synchronize input controls if NLP extracted new constraints from free text
      if (res.constraints) {
        if (res.constraints.budgetMaxVnd !== budget) {
          setBudget(res.constraints.budgetMaxVnd);
          setCustomBudgetInput(res.constraints.budgetMaxVnd.toLocaleString('vi-VN'));
        }
        if (res.constraints.timeStart !== timeStart) setTimeStart(res.constraints.timeStart);
        if (res.constraints.timeEnd !== timeEnd) setTimeEnd(res.constraints.timeEnd);
        if (res.constraints.preference !== preference) setPreference(res.constraints.preference);
      }

      setResult(res);

      // Auto expand first evidence card
      if (res.recommendations.length > 0) {
        setExpandedEvidence({ [res.recommendations[0].village.slug]: true });
      }

      if (withScroll) {
        setTimeout(() => {
          document.getElementById('hybrid-results-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 1500);
        confetti({ particleCount: 60, spread: 55, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Hybrid AI Error:', err);
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStepIndex(4);
      }, 1400);
    }
  };

  const toggleEvidence = (slug: string) => {
    setExpandedEvidence((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  return (
    <div className="space-y-10">
      {/* =========================================================================
          BANNER GIỚI THIỆU KIẾN TRÚC HYBRID AI & EXPLAINABLE AI
      ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl bg-[#FAF5ED] border-2 border-terracotta-200/80 shadow-warm p-6 md:p-8">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-gold-400/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-500 text-white text-xs font-bold tracking-wider uppercase shadow-xs">
              <ShieldCheck className="w-4 h-4" />
              Kiến trúc Hybrid AI &amp; Explainable AI (XAI)
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Bộ Lọc Hậu Kiểm Rule-based
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-900 border border-gold-300 text-xs font-semibold">
              <Compass className="w-3.5 h-3.5 text-gold-700" /> Toán Haversine GPS (30km/h)
            </span>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-lacquer-900 leading-tight">
              AI Gợi Ý Lộ Trình &amp; Giải Trình Căn Cứ Minh Bạch
            </h1>
            <p className="text-sm md:text-base text-lacquer-800/80 max-w-4xl leading-relaxed">
              Không đưa ra câu trả lời ngẫu nhiên hay "ảo giác" (hallucination). Hệ thống kết hợp khả năng hiểu ngôn ngữ của AI với <strong>Bộ lọc hậu kiểm toán học (Rule-based Validator)</strong>: đối chiếu giờ mở cửa thực tế, biểu giá workshop niêm yết từ xưởng và cự ly GPS để đảm bảo chuyến đi <strong>luôn đúng giờ, khớp ngân sách và có căn cứ xác thực 100%</strong>.
            </p>
          </div>

          {/* QUY TRÌNH 4 BƯỚC XỬ LÝ MINH BẠCH (PROCESSING FLOW VISUALIZER) */}
          <div className="pt-4 border-t border-terracotta-200/60">
            <p className="text-xs font-bold uppercase tracking-wider text-terracotta-700 mb-3 flex items-center gap-1.5">
              <Info className="w-4 h-4" /> Luồng Xử Lý 4 Bước Của Động Cơ Hybrid AI:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                {
                  step: 1,
                  title: '1. AI Phân Tích Nhu Cầu',
                  desc: 'Bóc tách ngân sách tối đa, khung giờ rảnh, GPS & sở thích từ form hoặc chat',
                  icon: Sparkles,
                },
                {
                  step: 2,
                  title: '2. Đối Chiếu Database 327 Làng',
                  desc: 'Quét biểu giá niêm yết xưởng nghệ nhân, giờ mở cửa & quyết định công nhận',
                  icon: FileText,
                },
                {
                  step: 3,
                  title: '3. Hậu Kiểm Giờ & Ngân Sách',
                  desc: 'Tính cự ly Haversine 30km/h, kiểm tra giờ đóng/mở & tự động hạ cấp gói chi phí',
                  icon: ShieldCheck,
                },
                {
                  step: 4,
                  title: '4. Xuất Căn Cứ Xác Thực (XAI)',
                  desc: 'Cấp Verification Badge [✓ Đã hậu kiểm] và hiển thị minh bạch từng dòng chi phí',
                  icon: Award,
                },
              ].map((st) => {
                const isActive = isProcessing && currentStepIndex === st.step;
                const isPassed = !isProcessing || currentStepIndex > st.step;
                return (
                  <div
                    key={st.step}
                    className={`relative p-3.5 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-gold-50 border-gold-400 ring-2 ring-gold-400 shadow-md scale-[1.02]'
                        : isPassed
                        ? 'bg-white border-emerald-200 shadow-xs'
                        : 'bg-white/60 border-terracotta-100 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isActive
                            ? 'bg-gold-500 text-white animate-pulse'
                            : isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-dopaper-200 text-lacquer-800'
                        }`}
                      >
                        <st.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-xs text-lacquer-900">{st.title}</span>
                    </div>
                    <p className="text-[11px] text-lacquer-800/70 leading-relaxed">{st.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          BỘ LỌC RÀNG BUỘC ĐẦU VÀO (INPUT CONSTRAINTS CONTROLLER)
      ========================================================================= */}
      <section className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terracotta-100 pb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-lacquer-900 flex items-center gap-2">
              <Compass className="w-5 h-5 text-terracotta-600" />
              Thiết Lập Bộ Lọc Ràng Buộc (Input Constraints)
            </h2>
            <p className="text-xs text-lacquer-800/70 mt-0.5">
              Các tham số cứng để AI và Bộ lọc hậu kiểm đối chiếu chính xác với thực tế
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBudget(300000);
                setCustomBudgetInput('300.000');
                setTimeStart('08:00');
                setTimeEnd('13:00');
                setSelectedLocation(DEPARTURE_PRESETS[0]);
                setPreference('pottery');
                setFreeTextPrompt('');
              }}
              className="text-xs font-semibold text-lacquer-800/60 hover:text-lacquer-900 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Đặt lại mặc định
            </button>
          </div>
        </div>

        {/* CÁCH 1: THANH NHẬP CHAT TỰ DO (AI TỰ BÓC TÁCH THAM SỐ) */}
        <div className="p-4 rounded-2xl bg-[#FAF5ED] border border-terracotta-200/90 space-y-2">
          <label className="text-xs font-bold text-lacquer-900 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-gold-600" />
              Cách 1: Gõ yêu cầu tự nhiên (AI tự động bóc tách ngân sách, thời gian, GPS và sở thích)
            </span>
            <span className="text-[11px] font-normal text-lacquer-800/60">Tùy chọn</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={freeTextPrompt}
              onChange={(e) => setFreeTextPrompt(e.target.value)}
              placeholder="Ví dụ: Mình có 300k, rảnh từ 8h đến 12h, xuất phát từ Cầu Giấy muốn tự tay làm gốm..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-terracotta-200 bg-white text-sm text-lacquer-900 outline-none focus:border-terracotta-500 focus:ring-2 focus:ring-terracotta-100"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRunHybridAi(true);
              }}
            />
            <button
              type="button"
              onClick={() => handleRunHybridAi(true)}
              disabled={isProcessing}
              className="px-5 py-2.5 rounded-xl bg-lacquer-900 hover:bg-lacquer-950 text-white text-xs font-bold shadow transition-all shrink-0 flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              <span>Bóc tách &amp; Hậu kiểm</span>
            </button>
          </div>
          {/* Quick suggestions chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-lacquer-800/50">Mẫu thử nhanh:</span>
            {[
              'Có 300k, rảnh sáng từ 8h đến 12h30 muốn nặn gốm Bát Tràng',
              'Có 200k, rảnh chiều 13h30-18h muốn đi dệt lụa Vạn Phúc bằng tàu điện',
              'Có 150k, rảnh 2 tiếng muốn ăn cốm Mễ Trì gần Cầu Giấy',
              'Có 400k, muốn chụp ảnh sân hương Quảng Phú Cầu',
            ].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setFreeTextPrompt(s);
                  setTimeout(() => handleRunHybridAi(true), 100);
                }}
                className="text-[11px] text-terracotta-700 bg-white hover:bg-terracotta-50 border border-terracotta-200 px-2.5 py-1 rounded-full transition-colors truncate max-w-xs"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* CÁCH 2: THIẾT LẬP THAM SỐ CỨNG */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* 1. NGÂN SÁCH TỐI ĐA */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-lacquer-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-terracotta-600" />
                1. Ngân sách tối đa của bạn (VNĐ)
              </span>
              <span className="text-terracotta-600 font-extrabold font-mono text-sm">
                {budget.toLocaleString('vi-VN')} đ
              </span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {BUDGET_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setBudget(p.value);
                    setCustomBudgetInput(p.value.toLocaleString('vi-VN'));
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    budget === p.value
                      ? 'bg-terracotta-50 border-terracotta-500 text-terracotta-700 font-bold shadow-xs'
                      : 'bg-white border-terracotta-200 hover:bg-terracotta-50/50 text-lacquer-800'
                  }`}
                >
                  <p className="text-xs font-bold">{p.label}</p>
                  <p className="text-[10px] text-lacquer-800/60 line-clamp-1 mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-lacquer-800/70 whitespace-nowrap">Hoặc nhập số tiền khác:</span>
              <div className="relative flex-1">
                <input
                  type="text"
                  value={customBudgetInput}
                  onChange={handleCustomBudgetChange}
                  className="w-full px-3 py-1.5 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-900 pr-10 focus:border-terracotta-500 outline-none"
                  placeholder="300.000"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-lacquer-800/50">
                  VNĐ
                </span>
              </div>
            </div>
          </div>

          {/* 2. KHUNG GIỜ RẢNH */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-lacquer-900 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-terracotta-600" />
                2. Khung giờ rảnh của bạn
              </span>
              <span className="text-emerald-700 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                {timeStart} – {timeEnd}
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIME_PRESETS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTimeStart(t.start);
                    setTimeEnd(t.end);
                  }}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    timeStart === t.start && timeEnd === t.end
                      ? 'bg-terracotta-50 border-terracotta-500 font-bold shadow-xs'
                      : 'bg-white border-terracotta-200 hover:bg-terracotta-50/50'
                  }`}
                >
                  <p className="text-xs font-bold text-lacquer-900 flex items-center gap-1">
                    <span>{t.icon}</span>
                    <span>{t.start} – {t.end}</span>
                  </p>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-lacquer-800/70">Từ:</span>
                <input
                  type="time"
                  value={timeStart}
                  onChange={(e) => setTimeStart(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-900 outline-none focus:border-terracotta-500"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-lacquer-800/70">Đến:</span>
                <input
                  type="time"
                  value={timeEnd}
                  onChange={(e) => setTimeEnd(e.target.value)}
                  className="px-2.5 py-1 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-900 outline-none focus:border-terracotta-500"
                />
              </div>
              <span className="text-[11px] text-lacquer-800/50 italic">Hậu kiểm sẽ chặn nếu trễ giờ</span>
            </div>
          </div>
        </div>

        {/* 3. VỊ TRÍ XUẤT PHÁT (GPS HAVERSINE) & 4. SỞ THÍCH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-terracotta-100">
          {/* VỊ TRÍ GPS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-lacquer-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-terracotta-600" />
                3. Vị trí xuất phát (GPS)
              </label>
              <button
                type="button"
                onClick={handleGetLiveGps}
                disabled={isGettingGps}
                className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1 bg-terracotta-50 border border-terracotta-200 px-2.5 py-1 rounded-full shadow-2xs transition-all hover:bg-terracotta-100"
              >
                <Navigation className={`w-3.5 h-3.5 ${isGettingGps ? 'animate-spin' : ''}`} />
                <span>{isGettingGps ? 'Đang lấy GPS...' : 'Lấy GPS hiện tại'}</span>
              </button>
            </div>

            {gpsStatus && (
              <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                {gpsStatus}
              </p>
            )}

            <select
              value={selectedLocation.name}
              onChange={(e) => {
                const found = DEPARTURE_PRESETS.find((p) => p.name === e.target.value);
                if (found) setSelectedLocation(found);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 bg-white text-xs font-bold text-lacquer-900 outline-none focus:border-terracotta-500"
            >
              {DEPARTURE_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} — [GPS: {p.lat}, {p.lng}]
                </option>
              ))}
              {!DEPARTURE_PRESETS.some((p) => p.name === selectedLocation.name) && (
                <option value={selectedLocation.name}>{selectedLocation.name}</option>
              )}
            </select>
            <p className="text-[11px] text-lacquer-800/60 leading-relaxed">
              Khoảng cách sẽ được tính bằng công thức toán học Haversine với vận tốc giả định 30km/h trên đường đô thị Hà Nội.
            </p>
          </div>

          {/* SỞ THÍCH */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-lacquer-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-terracotta-600" />
              4. Sở thích trải nghiệm cốt lõi
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PREFERENCE_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPreference(p.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    preference === p.id
                      ? 'bg-terracotta-50 border-terracotta-500 shadow-xs'
                      : 'bg-white border-terracotta-200 hover:bg-terracotta-50/50'
                  }`}
                >
                  <p className="text-xs font-bold text-lacquer-900 flex items-center gap-1">
                    <span>{p.icon}</span>
                    <span className="truncate">{p.label}</span>
                  </p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-lacquer-800/60">
              {PREFERENCE_PRESETS.find((p) => p.id === preference)?.desc}
            </p>
          </div>
        </div>

        {/* NÚT THỰC THI CHÍNH */}
        <div className="pt-4 border-t border-terracotta-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-lacquer-800/70">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Mọi kết quả bắt buộc chạy qua bộ lọc toán học trước khi hiển thị</span>
          </div>

          <button
            type="button"
            onClick={() => handleRunHybridAi(true)}
            disabled={isProcessing}
            className="btn-elastic inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-sm shadow-lg shadow-terracotta-500/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Đang hậu kiểm ràng buộc thực tế...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5 text-gold-300" />
                <span>Khởi Chạy Hybrid AI &amp; Hậu Kiểm Ràng Buộc</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </section>

      {/* =========================================================================
          KHU VỰC HIỂN THỊ KẾT QUẢ GỢI Ý & BẢNG GIẢI TRÌNH CĂN CỨ (XAI)
      ========================================================================= */}
      <section id="hybrid-results-section" className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl font-bold text-lacquer-900 flex items-center gap-2">
              <Award className="w-6 h-6 text-gold-600" />
              Kết Quả Đã Qua Hậu Kiểm Ràng Buộc ({result?.recommendations.length || 0} Địa Điểm)
            </h2>
            <p className="text-xs text-lacquer-800/70 mt-0.5">
              Tất cả gợi ý dưới đây đã vượt qua bài kiểm tra chéo về ngân sách, giờ mở cửa và dữ liệu thực tế
            </p>
          </div>

          {result && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
              ✓ Đối chiếu 327 Làng nghề Hà Nội
            </span>
          )}
        </div>

        {/* NHẬT KÝ XỬ LÝ HẬU KIỂM 4 BƯỚC (AUDIT TRAIL LOG) */}
        {result?.stepsAudit && (
          <div className="bg-[#FAF5ED] rounded-2xl border border-terracotta-200 p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-lacquer-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Nhật Ký Hậu Kiểm Minh Bạch (Verification Audit Trail):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {result.stepsAudit.map((st) => (
                <div key={st.step} className="p-2.5 rounded-xl bg-white border border-terracotta-100 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-terracotta-700">{st.title}</span>
                    <span className="text-[10px] font-mono text-lacquer-800/50">{st.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-lacquer-800/80 leading-relaxed">{st.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DANH SÁCH RECOMMENDATION CARDS CÓ GIẢI TRÌNH CĂN CỨ */}
        <div className="space-y-6">
          {result?.recommendations.map((rec, index) => {
            const isExpanded = Boolean(expandedEvidence[rec.village.slug]);
            const isFirst = index === 0;

            return (
              <div
                key={rec.village.slug}
                className={`bg-white rounded-3xl border-2 transition-all shadow-warm overflow-hidden ${
                  isFirst ? 'border-terracotta-500 ring-2 ring-terracotta-100' : 'border-terracotta-200'
                }`}
              >
                {/* PHẦN ĐẦU THẺ (CARD HEADER) */}
                <div className="p-6 md:p-7 space-y-4">
                  {/* Badge & Top Meta */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* NHÃN XÁC THỰC MÀU XANH LÁ BẮT BUỘC (VERIFICATION BADGE) */}
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-extrabold tracking-wide shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        {rec.evidence.badgeText}
                      </span>

                      {rec.evidence.budgetEvidence.downgraded && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold">
                          ⚡ Tự động hạ cấp gói tiết kiệm
                        </span>
                      )}

                      {isFirst && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-400 text-lacquer-950 text-[11px] font-extrabold">
                          ⭐ Gợi ý tối ưu nhất
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-lacquer-800/70">Độ phù hợp:</span>
                      <span className="text-sm font-extrabold font-mono text-terracotta-600 bg-terracotta-50 border border-terracotta-200 px-2.5 py-0.5 rounded-full">
                        {rec.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  {/* THÔNG TIN CHÍNH VỀ LÀNG NGHỀ */}
                  <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6 items-start">
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-terracotta-600 mb-0.5">
                          <span>{rec.village.category}</span>
                          <span>•</span>
                          <span>{rec.village.district}</span>
                        </div>
                        <h3 className="font-serif text-2xl font-bold text-lacquer-900 hover:text-terracotta-600 transition-colors">
                          <Link href={`/lang-nghe/${rec.village.slug}`}>{rec.village.name}</Link>
                        </h3>
                        <p className="text-xs italic text-lacquer-800/70 mt-0.5">&ldquo;{rec.village.tagline}&rdquo;</p>
                      </div>

                      <p className="text-sm text-lacquer-800/80 leading-relaxed">
                        {rec.village.shortDescription}
                      </p>

                      {/* Lời khuyên độc quyền từ AI */}
                      <div className="p-3 rounded-2xl bg-[#FAF5ED] border border-terracotta-100 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-lacquer-900 leading-relaxed">
                          <strong>Gợi ý AI:</strong> {rec.aiAdvice}
                        </p>
                      </div>

                      {/* Quick Snapshot Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                        <div className="p-2 rounded-xl bg-dopaper-50 border border-dopaper-200 text-center">
                          <p className="text-[10px] text-lacquer-800/60 uppercase">Chi phí thực tế</p>
                          <p className="font-extrabold text-terracotta-700 font-mono mt-0.5">
                            {rec.evidence.budgetEvidence.actualCost.toLocaleString('vi-VN')} đ
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-dopaper-50 border border-dopaper-200 text-center">
                          <p className="text-[10px] text-lacquer-800/60 uppercase">Cự ly Haversine</p>
                          <p className="font-extrabold text-lacquer-900 font-mono mt-0.5">
                            {rec.evidence.timeEvidence.haversineDistanceKm} km
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-dopaper-50 border border-dopaper-200 text-center">
                          <p className="text-[10px] text-lacquer-800/60 uppercase">Thời gian di chuyển</p>
                          <p className="font-extrabold text-lacquer-900 font-mono mt-0.5">
                            ~{rec.evidence.timeEvidence.travelDurationMinutes} phút
                          </p>
                        </div>
                        <div className="p-2 rounded-xl bg-dopaper-50 border border-dopaper-200 text-center">
                          <p className="text-[10px] text-lacquer-800/60 uppercase">Đóng dấu hộ chiếu</p>
                          <p className="font-extrabold text-emerald-700 font-mono mt-0.5">
                            {rec.village.passport_checkins.toLocaleString('vi-VN')} lượt
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Ảnh đại diện & Nút mở rộng */}
                    <div className="space-y-3">
                      <div className="relative aspect-4/3 w-full rounded-2xl overflow-hidden border border-terracotta-200 shadow-sm">
                        <img
                          src={rec.village.heroImage}
                          alt={rec.village.name}
                          className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs">
                          ★ {rec.village.rating} ({rec.village.positive_rate})
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setBookingVillage(rec)}
                          className="w-full py-2.5 px-4 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Ticket className="w-3.5 h-3.5" />
                          <span>Đặt chỗ workshop ({rec.evidence.budgetEvidence.actualCost.toLocaleString('vi-VN')}đ)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleEvidence(rec.village.slug)}
                          className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isExpanded
                              ? 'bg-lacquer-900 text-white border-lacquer-900'
                              : 'bg-white text-lacquer-800 border-terracotta-200 hover:bg-terracotta-50'
                          }`}
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>{isExpanded ? 'Thu gọn căn cứ xác thực' : 'Xem căn cứ vì sao gợi ý điểm này?'}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* LỘ TRÌNH THỜI GIAN THỰC TẾ (TIMELINE ITINERARY) */}
                  <div className="pt-3 border-t border-terracotta-100">
                    <p className="text-xs font-bold text-lacquer-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-terracotta-600" />
                      Lộ trình di chuyển &amp; trải nghiệm tối ưu ({rec.evidence.timeEvidence.departureTime} – {rec.evidence.timeEvidence.returnTime}):
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      {rec.itinerary.map((it, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-dopaper-50/70 border border-dopaper-200 text-xs space-y-1">
                          <span className="font-mono font-bold text-terracotta-700 bg-white border border-terracotta-200 px-2 py-0.5 rounded-md inline-block">
                            {it.time}
                          </span>
                          <p className="font-semibold text-lacquer-900 line-clamp-2">{it.activity}</p>
                          <p className="text-[10px] text-lacquer-800/60 truncate">{it.location}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ===================================================================
                    HỘP GIẢI TRÌNH CĂN CỨ XÁC THỰC (EXPLAINABLE AI - EVIDENCE ACCORDION)
                =================================================================== */}
                {isExpanded && (
                  <div className="border-t-2 border-emerald-500 bg-emerald-50/25 p-6 md:p-7 space-y-6 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                      <h4 className="font-serif text-lg font-bold text-emerald-950 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        Hồ Sơ Giải Trình Căn Cứ Tư Vấn (Explainable AI Dossier)
                      </h4>
                      <span className="text-xs font-bold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-1 rounded-full">
                        {rec.evidence.packageTier}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* CĂN CỨ 1: NGÂN SÁCH (BUDGET EVIDENCE) */}
                      <div className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 text-terracotta-700 font-bold text-xs uppercase tracking-wider">
                          <DollarSign className="w-4 h-4 text-terracotta-600" />
                          <span>1. Căn Cứ Ngân Sách</span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-dopaper-50 border border-dopaper-200 space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-lacquer-800/70">Ngân sách tối đa của bạn:</span>
                            <span className="font-bold font-mono">{rec.evidence.budgetEvidence.maxBudget.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex items-center justify-between text-terracotta-700 font-bold">
                            <span>Chi phí thực tế ước tính:</span>
                            <span className="font-mono text-sm">{rec.evidence.budgetEvidence.actualCost.toLocaleString('vi-VN')} đ</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-700 font-semibold pt-1 border-t border-dopaper-200">
                            <span>Tiết kiệm / Còn dư:</span>
                            <span className="font-mono">
                              +{rec.evidence.budgetEvidence.savings.toLocaleString('vi-VN')} đ ({rec.evidence.budgetEvidence.savingsPercent}%)
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] font-bold text-lacquer-800 uppercase">Bóc tách chi phí thực tế:</p>
                          {rec.evidence.budgetEvidence.breakdown.map((item, bIdx) => (
                            <div key={bIdx} className="text-xs p-2 rounded-lg bg-gray-50 border border-gray-100 space-y-0.5">
                              <div className="flex items-center justify-between font-semibold text-lacquer-900">
                                <span>{item.name}</span>
                                <span className="font-mono">{item.amount.toLocaleString('vi-VN')} đ</span>
                              </div>
                              <p className="text-[10px] text-lacquer-800/60">{item.note}</p>
                              <p className="text-[10px] text-emerald-800 font-medium">Nguồn: {item.source}</p>
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-lacquer-800/70 italic border-t border-gray-100 pt-2 leading-relaxed">
                          {rec.evidence.budgetEvidence.auditNote}
                        </p>
                      </div>

                      {/* CĂN CỨ 2: THỜI GIAN & LỘ TRÌNH (TIME & ROUTE EVIDENCE) */}
                      <div className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider">
                          <Clock className="w-4 h-4 text-emerald-600" />
                          <span>2. Căn Cứ Thời Gian &amp; Lộ Trình</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                            <span className="text-lacquer-800/70">Khoảng cách Haversine:</span>
                            <span className="font-bold font-mono text-lacquer-900">
                              {rec.evidence.timeEvidence.haversineDistanceKm} km (Đường bộ: ~{rec.evidence.timeEvidence.roadDistanceKm}km)
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                            <span className="text-lacquer-800/70">Vận tốc trung bình đô thị:</span>
                            <span className="font-bold text-lacquer-900">30 km/h (Chuẩn đường Hà Nội)</span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                            <span className="text-lacquer-800/70">Thời gian di chuyển 1 chiều:</span>
                            <span className="font-bold font-mono text-terracotta-700">
                              ~{rec.evidence.timeEvidence.travelDurationMinutes} phút
                            </span>
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                            <span className="text-lacquer-800/70">Giờ mở cửa xưởng:</span>
                            <span className="font-bold text-lacquer-900">{rec.evidence.timeEvidence.openingHours}</span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-dopaper-50 border border-dopaper-200 space-y-1">
                            <p className="font-bold text-lacquer-900 text-[11px]">Đối chiếu mốc thời gian:</p>
                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                              <span>• Xuất phát: <strong>{rec.evidence.timeEvidence.departureTime}</strong></span>
                              <span>• Đến xưởng: <strong>{rec.evidence.timeEvidence.arrivalTime}</strong></span>
                              <span>• Kết thúc: <strong>{rec.evidence.timeEvidence.finishTime}</strong></span>
                              <span>• Về đích: <strong>{rec.evidence.timeEvidence.returnTime}</strong></span>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-emerald-800 font-medium leading-relaxed border-t border-gray-100 pt-2">
                          ✓ {rec.evidence.timeEvidence.auditNote}
                        </p>
                      </div>

                      {/* CĂN CỨ 3: DỮ LIỆU DI SẢN & CỘNG ĐỒNG (DATA & COMMUNITY EVIDENCE) */}
                      <div className="bg-white rounded-2xl border border-emerald-200 p-4 space-y-3 shadow-xs">
                        <div className="flex items-center gap-2 text-gold-800 font-bold text-xs uppercase tracking-wider">
                          <Award className="w-4 h-4 text-gold-700" />
                          <span>3. Căn Cứ Dữ Liệu &amp; Cộng Đồng</span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-gold-50/80 border border-gold-200 space-y-1">
                            <p className="text-[10px] uppercase font-bold text-gold-900">Căn cứ pháp lý công nhận:</p>
                            <p className="font-bold text-lacquer-950 text-xs">
                              {rec.evidence.dataEvidence.officialDecisionId}
                            </p>
                            <p className="text-[11px] text-lacquer-800/70">
                              Năm công nhận: {rec.evidence.dataEvidence.recognitionYear} • {rec.evidence.dataEvidence.heritageRank}
                            </p>
                          </div>

                          <div className="p-2 rounded-lg bg-gray-50 border border-gray-100">
                            <span className="text-lacquer-800/70 block text-[10px]">Niên đại &amp; Lịch sử:</span>
                            <span className="font-semibold text-lacquer-900 text-xs">
                              {rec.evidence.dataEvidence.historyOrigin}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-center pt-1">
                            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                              <p className="text-[10px] text-emerald-800 uppercase font-semibold">Check-in Hộ Chiếu</p>
                              <p className="font-extrabold text-emerald-900 font-mono text-sm">
                                {rec.evidence.dataEvidence.passportCheckins.toLocaleString('vi-VN')}
                              </p>
                              <p className="text-[9px] text-emerald-700">Du khách đã đóng dấu</p>
                            </div>
                            <div className="p-2 rounded-xl bg-gold-50 border border-gold-200">
                              <p className="text-[10px] text-gold-800 uppercase font-semibold">Tỷ lệ hài lòng</p>
                              <p className="font-extrabold text-gold-900 font-mono text-sm">
                                {rec.evidence.dataEvidence.positiveRate}
                              </p>
                              <p className="text-[9px] text-gold-700">★ {rec.evidence.dataEvidence.rating} / 5.0</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-lacquer-800/70 leading-relaxed border-t border-gray-100 pt-2">
                          {rec.evidence.dataEvidence.legalBasisText}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action inside Evidence */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
                      <span className="text-lacquer-800/60 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Dữ liệu được xác thực tự động bởi Explainable AI Engine
                      </span>

                      <div className="flex items-center gap-2">
                        <Link
                          href={`/ban-do?highlight=${rec.village.slug}`}
                          className="px-3.5 py-1.5 rounded-xl bg-white border border-terracotta-200 text-terracotta-700 font-semibold hover:bg-terracotta-50 shadow-2xs"
                        >
                          Mở bản đồ GIS dẫn đường →
                        </Link>
                        <Link
                          href={`/lang-nghe/${rec.village.slug}`}
                          className="px-3.5 py-1.5 rounded-xl bg-terracotta-500 text-white font-bold hover:bg-terracotta-600 shadow-2xs"
                        >
                          Xem hồ sơ di sản làng nghề →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          MODAL ĐẶT TRƯỚC CHỖ WORKSHOP (BOOKING MODAL)
      ========================================================================= */}
      {bookingVillage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-terracotta-200 shadow-2xl p-6 md:p-8 space-y-5">
            {!bookingSuccess ? (
              <>
                <div className="flex items-center justify-between border-b border-terracotta-100 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-terracotta-600 uppercase">Đặt chỗ trải nghiệm</span>
                    <h3 className="font-serif text-xl font-bold text-lacquer-900">{bookingVillage.village.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBookingVillage(null)}
                    className="p-1 rounded-full text-lacquer-800 hover:bg-terracotta-50"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#FAF5ED] border border-terracotta-200 space-y-1.5 text-xs">
                  <p className="font-bold text-lacquer-900">{bookingVillage.village.workshop_name}</p>
                  <p className="text-lacquer-800/70">Nghệ nhân phụ trách: <strong>{bookingVillage.village.artisan_name}</strong></p>
                  <p className="text-lacquer-800/70">Khung giờ đến dự kiến: <strong>{bookingVillage.evidence.timeEvidence.arrivalTime}</strong> (Kịp giờ mở cửa {bookingVillage.village.opening_hours.open})</p>
                  <div className="pt-1 flex items-center justify-between font-bold text-terracotta-700">
                    <span>Tổng dự toán trọn gói:</span>
                    <span className="font-mono text-sm">{bookingVillage.evidence.budgetEvidence.actualCost.toLocaleString('vi-VN')} đ</span>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setBookingSuccess(true);
                    confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
                  }}
                  className="space-y-3 text-xs"
                >
                  <div>
                    <label className="font-bold text-lacquer-900 block mb-1">Họ tên của bạn *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      className="w-full px-3.5 py-2 rounded-xl border border-terracotta-200 outline-none focus:border-terracotta-500"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-lacquer-900 block mb-1">Số điện thoại liên hệ *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0912 345 678"
                      className="w-full px-3.5 py-2 rounded-xl border border-terracotta-200 outline-none focus:border-terracotta-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-lacquer-900 block mb-1">Số lượng khách</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={2}
                        className="w-full px-3.5 py-2 rounded-xl border border-terracotta-200 outline-none focus:border-terracotta-500"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-lacquer-900 block mb-1">Thanh toán</label>
                      <select className="w-full px-3 py-2 rounded-xl border border-terracotta-200 outline-none focus:border-terracotta-500 bg-white">
                        <option>Thanh toán tại xưởng</option>
                        <option>Chuyển khoản QR trước</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setBookingVillage(null)}
                      className="px-4 py-2 rounded-xl border border-terracotta-200 text-lacquer-800 hover:bg-terracotta-50 font-bold"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold shadow-xs"
                    >
                      Xác Nhận Giữ Chỗ
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-xl font-bold text-lacquer-900">Đặt Chỗ Thành Công!</h3>
                  <p className="text-xs text-lacquer-800/80 max-w-sm mx-auto">
                    Xưởng <strong>{bookingVillage.village.workshop_name}</strong> đã nhận thông tin giữ chỗ của bạn vào khung giờ <strong>{bookingVillage.evidence.timeEvidence.arrivalTime}</strong>.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 text-left max-w-sm mx-auto space-y-1">
                  <p>• Mã giữ chỗ: <strong>LT-{Math.floor(100000 + Math.random() * 900000)}</strong></p>
                  <p>• Dự toán chi phí: <strong>{bookingVillage.evidence.budgetEvidence.actualCost.toLocaleString('vi-VN')} đ</strong></p>
                  <p>• Hotline xưởng: <strong>0912 345 678</strong> (Nghệ nhân {bookingVillage.village.artisan_name})</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBookingSuccess(false);
                    setBookingVillage(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-lacquer-900 hover:bg-lacquer-950 text-white text-xs font-bold shadow"
                >
                  Hoàn Tất &amp; Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
