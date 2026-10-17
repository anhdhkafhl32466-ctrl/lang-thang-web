'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles, Clock, Compass, MapPin, CheckCircle2, ArrowRight,
  Utensils, Phone, Calendar, User, ShieldCheck, Ticket, Download,
  Check, ChevronRight, AlertCircle, RefreshCw, Car, Bus, Train,
  Info, ExternalLink, Heart, Tag, DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  TourPlannerInput, TourPlanResult, WorkshopPartner,
  WorkshopBookingRecord, generateOneTouchTourPlan, WORKSHOP_PARTNERS
} from '@/lib/aiTourPlanner';

export default function OneTouchTourPlanner() {
  // Input states
  const [budget, setBudget] = useState<number>(300000);
  const [customBudgetInput, setCustomBudgetInput] = useState<string>('300.000');
  const [duration, setDuration] = useState<TourPlannerInput['duration']>('half-day-morning');
  const [preference, setPreference] = useState<TourPlannerInput['preference']>('pottery');
  const [departurePoint, setDeparturePoint] = useState<string>('Trung tâm Phố Cổ / Hoàn Kiếm');

  // Loading & Result states
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [tourPlan, setTourPlan] = useState<TourPlanResult | null>(null);

  // Booking Modal & State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [bookingName, setBookingName] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<WorkshopBookingRecord | null>(null);

  // Saved bookings from localStorage
  const [savedBookings, setSavedBookings] = useState<WorkshopBookingRecord[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('craft_tour_bookings');
        if (stored) {
          setSavedBookings(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error reading saved bookings:', e);
      }
    }
  }, []);

  const budgetPresets = [
    { label: '150.000đ', value: 150000, desc: 'Tiết kiệm / Học sinh - SV' },
    { label: '300.000đ', value: 300000, desc: 'Phổ biến / Vừa đủ trải nghiệm' },
    { label: '500.000đ', value: 500000, desc: 'Trọn vẹn / Ăn ngon cỗ làng' },
    { label: '1.000.000đ', value: 1000000, desc: 'Thoải mái / Mua sắm quà quý' }
  ];

  const durationOptions = [
    {
      id: 'half-day-morning',
      title: 'Nửa ngày: Buổi Sáng',
      time: '08:00 – 12:30',
      icon: '🌤️',
      desc: 'Đón bình minh, sương sớm, thực hành workshop & ăn trưa cỗ làng'
    },
    {
      id: 'half-day-afternoon',
      title: 'Nửa ngày: Buổi Chiều',
      time: '13:30 – 18:00',
      icon: '⛅',
      desc: 'Trải nghiệm xưởng nghề, dạo chợ mua quà & ngắm hoàng hôn'
    },
    {
      id: 'full-day',
      title: '1 Ngày trọn vẹn',
      time: '08:00 – 17:30',
      icon: '☀️',
      desc: 'Bảo tàng, workshop chuyên sâu, thưởng thức trọn vẹn cỗ làng & chợ nghề'
    }
  ];

  const preferenceOptions = [
    {
      id: 'pottery',
      title: 'Trải nghiệm làm gốm bàn xoay',
      icon: '🏺',
      desc: 'Ngồi bàn xoay điện, tự tay vuốt đất sét Bát Tràng, nung & vẽ men'
    },
    {
      id: 'food-shopping',
      title: 'Mua sắm & Thưởng thức ẩm thực',
      icon: '🍜',
      desc: 'Ăn cốm non lá sen, mua khăn lụa tơ tằm Vạn Phúc, vịt Vân Đình'
    },
    {
      id: 'craft-hands-on',
      title: 'Tự tay làm nghề thủ công khác',
      icon: '🎋',
      desc: 'Vót chuồn chuồn tre Thạch Xá, khâu nón lá Chuông, dệt lụa'
    },
    {
      id: 'photo-checkin',
      title: 'Săn ảnh check-in nghệ thuật',
      icon: '📸',
      desc: 'Sân phơi chân hương đỏ rực, bảo tàng gốm xoắn ốc 7 tầng'
    },
    {
      id: 'combo-all',
      title: 'Kết hợp trọn vẹn (Làm nghề + Ẩm thực)',
      icon: '✨',
      desc: 'Cân bằng hoàn hảo giữa học nghề truyền thống, check-in và ăn ngon'
    }
  ];

  const departureOptions = [
    'Trung tâm Phố Cổ / Hoàn Kiếm',
    'Khu vực Cầu Giấy / Mỹ Đình',
    'Khu vực Đống Đa / Ba Đình',
    'Khu vực Tây Hồ',
    'Khu vực Hà Đông / Thanh Xuân',
    'Khu vực Long Biên / Gia Lâm'
  ];

  const handleBudgetPreset = (val: number) => {
    setBudget(val);
    setCustomBudgetInput(val.toLocaleString('vi-VN'));
  };

  const handleCustomBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setBudget(num);
    setCustomBudgetInput(num > 0 ? num.toLocaleString('vi-VN') : '');
  };

  const handleGenerateTour = async () => {
    setIsGenerating(true);
    setLoadingStep(0);
    setTourPlan(null);

    // Step animation for AI thinking
    const timer1 = setTimeout(() => setLoadingStep(1), 500);
    const timer2 = setTimeout(() => setLoadingStep(2), 1100);
    const timer3 = setTimeout(() => setLoadingStep(3), 1700);

    try {
      // 1. Attempt call to server API /api/tour-planner
      const res = await fetch('/api/tour-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget,
          duration,
          preference,
          departurePoint
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.tourPlan) {
          setTourPlan(data.tourPlan);
          if (data.tourPlan.workshop?.slots?.length > 0) {
            setBookingSlot(data.tourPlan.workshop.slots[0]);
          }
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
          setIsGenerating(false);
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
          return;
        }
      }
    } catch (e) {
      console.warn('Server call failed, using client fallback engine:', e);
    }

    // 2. Client-side fallback engine
    try {
      const plan = await generateOneTouchTourPlan({
        budget,
        duration,
        preference,
        departurePoint
      });
      setTourPlan(plan);
      if (plan.workshop?.slots?.length > 0) {
        setBookingSlot(plan.workshop.slots[0]);
      }
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch (err) {
      console.error('Error generating tour plan:', err);
    } finally {
      setIsGenerating(false);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    }
  };

  const handleOpenBooking = () => {
    if (!tourPlan?.workshop) return;
    setBookingSlot(tourPlan.workshop.slots[0] || '09:00');
    setIsBookingOpen(true);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tourPlan || !bookingName.trim() || !bookingPhone.trim()) return;

    const ws = tourPlan.workshop;
    const newBooking: WorkshopBookingRecord = {
      bookingId: `LT-${ws.villageSlug.toUpperCase().slice(0, 3)}-${Math.floor(10000 + Math.random() * 90000)}`,
      planId: tourPlan.id,
      villageSlug: ws.villageSlug,
      villageName: ws.villageName,
      workshopName: ws.name,
      artisanName: ws.artisanName,
      address: ws.address,
      hotline: ws.hotline,
      customerName: bookingName.trim(),
      customerPhone: bookingPhone.trim(),
      selectedDate: new Date().toLocaleDateString('vi-VN'),
      selectedSlot: bookingSlot,
      guestCount,
      totalPrice: ws.priceDiscounted * guestCount,
      paymentMethod: 'pay-at-workshop',
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      notes: bookingNotes.trim()
    };

    const updated = [newBooking, ...savedBookings];
    setSavedBookings(updated);
    try {
      localStorage.setItem('craft_tour_bookings', JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving booking:', err);
    }

    setBookingSuccess(newBooking);
    setIsBookingOpen(false);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 } });
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* INTRO HERO BOX */}
      <div className="bg-gradient-to-br from-terracotta-600 via-terracotta-700 to-amber-700 rounded-3xl p-6 sm:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-terracotta-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400 text-lacquer-950 text-xs font-bold shadow-sm">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            <span>Công Nghệ Lập Tour 1-Chạm Thông Minh</span>
          </div>

          <h2 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-white leading-snug">
            Nhập ngân sách, thời gian & sở thích <br className="hidden sm:inline" />
            <span className="text-gold-300">AI tự động thiết kế trọn gói chuyến đi của bạn</span>
          </h2>

          <p className="text-xs sm:text-sm text-dopaper-100/90 leading-relaxed max-w-2xl">
            Không cần tự mày mò tìm xe buýt, không lo phát sinh chi phí ngoài ý muốn. Trí tuệ AI sẽ tính toán cung đường di chuyển tối ưu, cân đối chi phí từng nghìn đồng và giữ chỗ ưu tiên tại xưởng nghệ nhân cho bạn.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-gold-200">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Lộ trình di chuyển chi tiết
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Dự toán chi phí chuẩn xác
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Đặt chỗ trước workshop 0đ
            </span>
          </div>
        </div>
      </div>

      {/* INPUT FORM CARDS */}
      <div className="paper-panel rounded-3xl p-6 sm:p-10 border border-terracotta-200 shadow-xl space-y-8">
        {/* Step 1: Ngân sách */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-serif text-base sm:text-lg font-bold text-lacquer-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-terracotta-500 text-white text-xs flex items-center justify-center font-bold">1</span>
              <span>Ngân sách dự kiến của bạn (cho 1 người):</span>
            </label>
            <span className="text-xs font-bold text-terracotta-600 bg-terracotta-50 px-3 py-1 rounded-full border border-terracotta-200">
              {budget.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>

          {/* Preset Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {budgetPresets.map((p) => {
              const isSelected = budget === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => handleBudgetPreset(p.value)}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    isSelected
                      ? 'bg-terracotta-50 border-terracotta-500 shadow-sm'
                      : 'bg-dopaper-50/60 border-terracotta-100 hover:border-terracotta-300'
                  }`}
                >
                  <span className="font-bold text-sm block text-lacquer-900">{p.label}</span>
                  <span className="text-[11px] text-lacquer-800/60 block mt-0.5">{p.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Or type custom budget */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-xs text-lacquer-800/70 whitespace-nowrap">Hoặc nhập số tiền khác:</span>
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={customBudgetInput}
                onChange={handleCustomBudgetChange}
                placeholder="Ví dụ: 250.000"
                className="w-full text-xs font-bold px-3 py-2 rounded-xl bg-dopaper-50 border border-terracotta-200 text-lacquer-900 focus:outline-none focus:border-terracotta-500 pr-12"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-lacquer-800/50 font-bold">VNĐ</span>
            </div>
          </div>
        </div>

        {/* Step 2: Thời lượng chuyến đi */}
        <div className="space-y-3 pt-4 border-t border-terracotta-100">
          <label className="font-serif text-base sm:text-lg font-bold text-lacquer-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-terracotta-500 text-white text-xs flex items-center justify-center font-bold">2</span>
            <span>Thời gian bạn có cho chuyến đi:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {durationOptions.map((opt) => {
              const isSelected = duration === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => setDuration(opt.id as any)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-terracotta-50 border-terracotta-500 shadow-sm'
                      : 'bg-dopaper-50/60 border-terracotta-100 hover:border-terracotta-300'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-[11px] font-bold text-terracotta-700 bg-terracotta-100/70 px-2 py-0.5 rounded-full">
                        {opt.time}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-lacquer-900 pt-1">{opt.title}</h4>
                    <p className="text-xs text-lacquer-800/70 leading-relaxed">{opt.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-terracotta-600">
                      <CheckCircle2 className="w-4 h-4 fill-current text-terracotta-500" />
                      <span>Đã chọn</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 3: Sở thích & Hoạt động mong muốn */}
        <div className="space-y-3 pt-4 border-t border-terracotta-100">
          <label className="font-serif text-base sm:text-lg font-bold text-lacquer-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-terracotta-500 text-white text-xs flex items-center justify-center font-bold">3</span>
            <span>Sở thích & Ưu tiên hàng đầu của bạn:</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {preferenceOptions.map((pref) => {
              const isSelected = preference === pref.id;
              return (
                <div
                  key={pref.id}
                  onClick={() => setPreference(pref.id as any)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-50/80 border-gold-500 shadow-sm'
                      : 'bg-dopaper-50/60 border-terracotta-100 hover:border-terracotta-300'
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{pref.icon}</span>
                      <h4 className="font-bold text-xs sm:text-sm text-lacquer-900">{pref.title}</h4>
                    </div>
                    <p className="text-xs text-lacquer-800/70 leading-relaxed">{pref.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-gold-700">
                      <CheckCircle2 className="w-4 h-4 text-gold-600" />
                      <span>Đang ưu tiên tiêu chí này</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 4: Điểm xuất phát (Tùy chọn) */}
        <div className="space-y-2 pt-4 border-t border-terracotta-100">
          <label className="text-xs font-bold text-lacquer-900 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-terracotta-600" />
            <span>Khu vực xuất phát của bạn (để tối ưu tuyến đường):</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {departureOptions.map((dep) => (
              <button
                key={dep}
                type="button"
                onClick={() => setDeparturePoint(dep)}
                className={`text-xs px-3 py-1.5 rounded-xl border transition-colors ${
                  departurePoint === dep
                    ? 'bg-terracotta-500 text-white font-bold border-terracotta-500 shadow-sm'
                    : 'bg-dopaper-50 text-lacquer-800 border-terracotta-200 hover:bg-terracotta-50'
                }`}
              >
                {dep}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-6 border-t border-terracotta-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-lacquer-800/60 leading-relaxed text-center sm:text-left">
            ⚡ Thuật toán AI sẽ cân đối ngân sách <strong>{budget.toLocaleString('vi-VN')}đ</strong> và chọn lọc làng nghề, tuyến xe buýt cùng xưởng nghệ nhân phù hợp nhất.
          </div>

          <button
            onClick={handleGenerateTour}
            disabled={isGenerating || budget <= 0}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-terracotta-500 via-terracotta-600 to-amber-600 hover:from-terracotta-600 hover:to-amber-700 text-white text-sm font-bold shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Sparkles className="w-4 h-4 fill-current text-gold-300" />
            <span>AI LẬP TOUR 1-CHẠM NGAY</span>
          </button>
        </div>
      </div>

      {/* LOADING ANIMATION */}
      {isGenerating && (
        <div className="paper-panel rounded-3xl p-8 sm:p-12 border-2 border-gold-300 shadow-xl text-center space-y-6 animate-pulse">
          <div className="w-16 h-16 rounded-3xl bg-gold-400/20 text-terracotta-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <Sparkles className="w-8 h-8 animate-spin text-terracotta-600" />
          </div>

          <div className="space-y-2">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900">
              Trí Tuệ AI Đang Thiết Kế Tour 1-Chạm Cho Bạn...
            </h3>
            <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-md mx-auto">
              Hệ thống đang rà soát giá vé, tuyến buýt và lịch trống của các nghệ nhân làng nghề Hà Nội.
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="max-w-md mx-auto space-y-2 text-left text-xs">
            <div className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
              loadingStep >= 0 ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'text-gray-400'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Phân tích ngân sách {budget.toLocaleString('vi-VN')}đ và khung giờ {duration}</span>
            </div>
            <div className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
              loadingStep >= 1 ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'text-gray-400'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Vạch lộ trình di chuyển tối ưu & tìm tuyến xe buýt thuận tiện</span>
            </div>
            <div className={`p-2.5 rounded-xl flex items-center gap-2.5 transition-all ${
              loadingStep >= 2 ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-200' : 'text-gray-400'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Khớp nối xưởng nghệ nhân đối tác & bảng chi phí chi tiết</span>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESSFUL BOOKING NOTIFICATION CARD (If just booked) */}
      {bookingSuccess && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Đặt chỗ thành công 100%</span>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
                  Mã Voucher Giữ Chỗ: {bookingSuccess.bookingId}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setBookingSuccess(null)}
              className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-xl text-white font-semibold transition-colors self-start sm:self-auto"
            >
              Đóng thông báo
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs text-emerald-100">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-emerald-200 block text-[11px]">Xưởng nghệ nhân:</span>
              <strong className="text-white text-sm">{bookingSuccess.workshopName}</strong>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-emerald-200 block text-[11px]">Khung giờ & Số khách:</span>
              <strong className="text-white text-sm">{bookingSuccess.selectedSlot} • {bookingSuccess.guestCount} người</strong>
            </div>
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="text-emerald-200 block text-[11px]">Hotline đón tiếp:</span>
              <strong className="text-white text-sm">{bookingSuccess.hotline} ({bookingSuccess.artisanName})</strong>
            </div>
          </div>

          <p className="text-xs text-emerald-100/90 leading-relaxed">
            ✨ Bạn chỉ cần đến đúng giờ và đọc mã <strong>{bookingSuccess.bookingId}</strong> hoặc số điện thoại. Nghệ nhân đã chuẩn bị sẵn đất sét/nguyên liệu và bàn thực hành riêng cho bạn!
          </p>
        </div>
      )}

      {/* TOUR PLAN RESULT DISPLAY */}
      {tourPlan && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Result Banner */}
          <div className="paper-panel rounded-3xl border-2 border-gold-400 shadow-2xl overflow-hidden">
            {/* Header info */}
            <div className="p-6 sm:p-8 bg-gradient-to-r from-terracotta-600 via-terracotta-700 to-amber-700 text-white space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-gold-400 text-lacquer-950 text-xs font-bold shadow-sm flex items-center gap-1">
                    <Sparkles className="w-3 h-3 fill-current" />
                    <span>Lộ Trình Tour 1-Chạm Tối Ưu</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-sm">
                    {tourPlan.durationLabel}
                  </span>
                </div>

                <div className="text-[11px] text-gold-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{tourPlan.source === 'gemini-cloud-ai' ? `Mô hình AI: ${tourPlan.modelUsed}` : 'Engine Chuyên Gia 16 Làng Nghề'}</span>
                </div>
              </div>

              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white tracking-tight leading-snug">
                {tourPlan.title}
              </h2>

              <p className="text-xs sm:text-sm text-dopaper-100/90 leading-relaxed max-w-3xl">
                {tourPlan.summary}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-1">
                {tourPlan.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 rounded-xl bg-white/15 text-gold-200 font-semibold border border-white/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Budget Balance Ribbon */}
            <div className="bg-amber-50/90 p-4 sm:p-6 border-b border-gold-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-terracotta-500 text-white flex items-center justify-center font-bold shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs text-lacquer-800/70 font-semibold block">Đối soát Ngân sách & Dự toán AI:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm line-through text-lacquer-800/50">
                      Ngân sách: {tourPlan.budgetGiven.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="font-serif text-xl sm:text-2xl font-bold text-terracotta-700">
                      Dự toán: {tourPlan.totalEstimatedCost.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {tourPlan.savingsAmount > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-2 self-start sm:self-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dư tiết kiệm: +{tourPlan.savingsAmount.toLocaleString('vi-VN')}đ (Đạt 100% ngân sách)</span>
                </div>
              )}
            </div>

            {/* Detailed Content Tabs & Sections */}
            <div className="p-6 sm:p-10 space-y-10">
              {/* SECTION A: LỘ TRÌNH DI CHUYỂN TỐI ƯU */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-lacquer-900 flex items-center gap-2">
                    <Compass className="w-5 h-5 text-terracotta-600" />
                    <span>Lộ trình di chuyển tối ưu nhất</span>
                  </h3>
                  <span className="text-xs text-lacquer-800/60 font-semibold">
                    {tourPlan.transitSummary.distance}
                  </span>
                </div>

                <div className="p-5 rounded-2xl bg-dopaper-100/90 border border-terracotta-200/90 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-terracotta-200/60">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-terracotta-500 text-white flex items-center justify-center font-bold">
                        {tourPlan.transitSummary.recommendedMode === 'train' ? <Train className="w-5 h-5" /> : <Bus className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-lacquer-900">{tourPlan.transitSummary.routeName}</h4>
                        <span className="text-xs text-lacquer-800/70">Thời gian ước tính: {tourPlan.transitSummary.travelDuration}</span>
                      </div>
                    </div>
                    <div className="text-xs font-bold text-terracotta-700 paper-panel px-3 py-1.5 rounded-xl border border-terracotta-200 self-start sm:self-auto">
                      Vé khứ hồi: ~{tourPlan.transitSummary.cost.toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-lacquer-800/85 leading-relaxed">
                    📍 <strong>Chỉ dẫn chi tiết:</strong> {tourPlan.transitSummary.instruction}
                  </p>

                  <div className="pt-1 flex items-center justify-between text-xs">
                    <span className="text-lacquer-800/60">Điểm xuất phát: {departurePoint}</span>
                    <Link
                      href={`/lang-nghe/${tourPlan.villageSlug}`}
                      className="font-bold text-terracotta-600 hover:underline flex items-center gap-1"
                    >
                      <span>Xem bản đồ chi tiết làng nghề</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* SECTION B: TIMELINE CHI TIẾT TỪNG MỐC GIỜ */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-lacquer-900 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-terracotta-600" />
                    <span>Lịch trình trải nghiệm từng mốc giờ (Timeline)</span>
                  </h3>
                  <span className="text-xs text-terracotta-700 bg-terracotta-50 px-2.5 py-0.5 rounded-full font-bold border border-terracotta-200">
                    {tourPlan.itinerary.length} chặng
                  </span>
                </div>

                <div className="relative border-l-2 border-terracotta-300 ml-4 pl-6 space-y-6">
                  {tourPlan.itinerary.map((stop, sIdx) => (
                    <div key={sIdx} className="relative group">
                      {/* Timeline dot */}
                      <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full paper-panel border-4 border-terracotta-500 group-hover:scale-125 transition-transform" />

                      <div className="p-4 sm:p-5 rounded-2xl paper-panel border border-terracotta-200/90 shadow-xs hover:shadow-md transition-shadow space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-bold text-terracotta-700 bg-terracotta-50 px-2.5 py-1 rounded-lg border border-terracotta-200 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-terracotta-600" />
                            <span>{stop.time}</span>
                          </span>
                          {stop.costEstimated > 0 ? (
                            <span className="text-xs font-bold text-lacquer-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-gold-300">
                              Chi phí: ~{stop.costEstimated.toLocaleString('vi-VN')}đ
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                              Miễn phí
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm sm:text-base text-lacquer-900 pt-0.5">
                          {stop.icon && <span className="mr-1.5">{stop.icon}</span>}
                          {stop.title}
                        </h4>

                        <p className="text-xs sm:text-sm text-lacquer-800/80 leading-relaxed">
                          {stop.activity}
                        </p>

                        {stop.tips && (
                          <div className="p-2.5 rounded-xl bg-gold-50/80 border border-gold-200/80 text-[11px] text-amber-900 flex items-start gap-1.5 mt-2">
                            <Sparkles className="w-3.5 h-3.5 text-gold-600 shrink-0 mt-0.5" />
                            <span><strong>Mẹo AI:</strong> {stop.tips}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION C: ĐẶT CHỖ TRƯỚC TẠI WORKSHOP NGHỆ NHÂN (FEATURE CHÍNH) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-lacquer-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-terracotta-600" />
                    <span>Đặt trước chỗ tại Workshop nghệ nhân (Giữ chỗ 0đ)</span>
                  </h3>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    Ưu đãi độc quyền qua AI
                  </span>
                </div>

                <div className="bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-3xl p-6 sm:p-8 border-2 border-gold-300 shadow-md space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-gold-400 text-lacquer-950 text-[10px] font-bold">
                          {tourPlan.workshop.badge}
                        </span>
                        <span className="text-xs text-lacquer-800/60 font-semibold">Thời lượng: {tourPlan.workshop.duration}</span>
                      </div>
                      <h4 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900">
                        {tourPlan.workshop.name}
                      </h4>
                      <p className="text-xs text-lacquer-800/75 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-terracotta-600" />
                        <span>Người hướng dẫn trực tiếp: <strong>{tourPlan.workshop.artisanName}</strong></span>
                      </p>
                      <p className="text-xs text-lacquer-800/70 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-terracotta-600" />
                        <span>{tourPlan.workshop.address}</span>
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl paper-panel border border-gold-300 shadow-xs flex flex-col items-end shrink-0">
                      <span className="text-[11px] text-gray-400 line-through">
                        Giá tại xưởng: {tourPlan.workshop.priceOriginal.toLocaleString('vi-VN')}đ
                      </span>
                      <div className="font-serif text-2xl font-bold text-terracotta-600">
                        {tourPlan.workshop.priceDiscounted.toLocaleString('vi-VN')} VNĐ
                        <span className="text-xs font-sans text-lacquer-800/60 font-normal"> / khách</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                        Tiết kiệm {(tourPlan.workshop.priceOriginal - tourPlan.workshop.priceDiscounted).toLocaleString('vi-VN')}đ khi đặt trước
                      </span>
                    </div>
                  </div>

                  {/* Workshop Includes Checklist */}
                  <div className="space-y-2 pt-2">
                    <span className="text-xs font-bold text-lacquer-900 block">Quyền lợi trải nghiệm bao gồm:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {tourPlan.workshop.includes.map((inc, iIdx) => (
                        <div key={iIdx} className="flex items-center gap-2 text-xs text-lacquer-800/85">
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Booking Trigger CTA Button */}
                  <div className="pt-3 border-t border-gold-200/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs text-lacquer-800/70">
                      🛡️ Cam kết: <strong>Không thu phí trước (0đ)</strong>. Thanh toán trực tiếp tại xưởng khi hoàn thành trải nghiệm.
                    </div>
                    <button
                      onClick={handleOpenBooking}
                      className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-amber-600 hover:from-terracotta-600 hover:to-amber-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>ĐẶT CHỖ TRƯỚC TẠI WORKSHOP NÀY (0Đ)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SECTION D: DỰ TOÁN CHI PHÍ MINH BẠCH */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-lacquer-900 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-terracotta-600" />
                    <span>Dự toán chi phí minh bạch từng khoản (Bảng kê)</span>
                  </h3>
                  <span className="text-xs text-lacquer-800/60 font-semibold">
                    Không có chi phí ẩn
                  </span>
                </div>

                <div className="rounded-2xl border border-terracotta-200 overflow-hidden shadow-xs">
                  <div className="bg-dopaper-100 p-3.5 grid grid-cols-12 text-xs font-bold text-lacquer-900 border-b border-terracotta-200">
                    <span className="col-span-6 sm:col-span-5">Hạng mục chi tiêu</span>
                    <span className="col-span-3 sm:col-span-4 hidden sm:inline">Ghi chú & Chi tiết</span>
                    <span className="col-span-6 sm:col-span-3 text-right">Dự toán VNĐ</span>
                  </div>

                  <div className="divide-y divide-terracotta-100 paper-panel text-xs">
                    {tourPlan.costBreakdown.map((item, cIdx) => (
                      <div key={cIdx} className="p-3.5 grid grid-cols-12 items-center hover:bg-dopaper-50/50 transition-colors">
                        <div className="col-span-6 sm:col-span-5 flex items-center gap-2">
                          <span className="text-base">{item.icon || '💸'}</span>
                          <div>
                            <span className="font-bold text-lacquer-900 block">{item.category}</span>
                            <span className="text-[11px] text-lacquer-800/65 block sm:hidden">{item.name}</span>
                          </div>
                        </div>
                        <div className="col-span-3 sm:col-span-4 hidden sm:block text-lacquer-800/75">
                          <span className="font-medium text-lacquer-900">{item.name}</span>
                          {item.note && <span className="block text-[11px] text-lacquer-800/50">{item.note}</span>}
                        </div>
                        <div className="col-span-6 sm:col-span-3 text-right font-bold text-terracotta-700">
                          {item.amount.toLocaleString('vi-VN')}đ
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-amber-50/80 p-4 border-t-2 border-gold-300 flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-lacquer-900">TỔNG CHI PHÍ DỰ TOÁN:</span>
                    <span className="font-serif text-lg sm:text-xl font-bold text-terracotta-700">
                      {tourPlan.totalEstimatedCost.toLocaleString('vi-VN')} VNĐ
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION E: LỜI KHUYÊN ĐỘC QUYỀN TỪ AI */}
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-2">
                <h4 className="font-serif text-base font-bold text-emerald-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Lời khuyên độc quyền từ Trợ lý AI Làng nghề</span>
                </h4>
                <div className="text-xs sm:text-sm text-emerald-900/85 whitespace-pre-line leading-relaxed">
                  {tourPlan.aiAdvice}
                </div>
              </div>

              {/* Bottom Action CTA */}
              <div className="pt-6 border-t border-terracotta-100 flex flex-col sm:flex-row gap-3 justify-end">
                <button
                  onClick={() => {
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl border border-terracotta-200 text-xs font-semibold text-lacquer-800 hover:bg-dopaper-100 transition-colors flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Điều chỉnh ngân sách / thời gian</span>
                </button>

                <Link
                  href={`/lang-nghe/${tourPlan.villageSlug}`}
                  className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold text-center shadow flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Khám phá toàn bộ {tourPlan.villageName}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BOOKING MODAL */}
      {isBookingOpen && tourPlan?.workshop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="paper-panel rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border-2 border-gold-300 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-terracotta-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-gold-400 text-lacquer-950 flex items-center justify-center font-bold">
                  <Ticket className="w-5 h-5 text-lacquer-950" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-lacquer-900">Đặt Trước Chỗ Tại Workshop</h3>
                  <span className="text-[11px] text-emerald-700 font-semibold">Giữ chỗ 0đ • Thanh toán khi hoàn thành</span>
                </div>
              </div>
              <button
                onClick={() => setIsBookingOpen(false)}
                className="w-8 h-8 rounded-full bg-dopaper-100 hover:bg-dopaper-200 text-lacquer-900 flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Workshop Summary Mini */}
            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-gold-300 text-xs space-y-1">
              <span className="font-bold text-lacquer-900 block">{tourPlan.workshop.name}</span>
              <span className="text-lacquer-800/70 block">Nghệ nhân: {tourPlan.workshop.artisanName} • {tourPlan.workshop.hotline}</span>
              <div className="text-terracotta-700 font-bold pt-1">
                Ưu đãi: {tourPlan.workshop.priceDiscounted.toLocaleString('vi-VN')}đ / khách (Giá gốc: {tourPlan.workshop.priceOriginal.toLocaleString('vi-VN')}đ)
              </div>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-lacquer-900 block mb-1">Họ và tên của bạn: *</label>
                <input
                  type="text"
                  required
                  value={bookingName}
                  onChange={(e) => setBookingName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 bg-dopaper-50 text-lacquer-900 focus:outline-none focus:border-terracotta-500 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-lacquer-900 block mb-1">Số điện thoại / Zalo để nhận vé: *</label>
                <input
                  type="tel"
                  required
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  placeholder="Ví dụ: 0912 345 678"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 bg-dopaper-50 text-lacquer-900 focus:outline-none focus:border-terracotta-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-lacquer-900 block mb-1">Khung giờ đến:</label>
                  <select
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 bg-dopaper-50 text-lacquer-900 focus:outline-none focus:border-terracotta-500 font-medium"
                  >
                    {tourPlan.workshop.slots.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-lacquer-900 block mb-1">Số lượng khách:</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 bg-dopaper-50 text-lacquer-900 focus:outline-none focus:border-terracotta-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-lacquer-900 block mb-1">Yêu cầu đặc biệt (tùy chọn):</label>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="Ví dụ: Có 1 bé 6 tuổi, muốn khắc tên lên sản phẩm..."
                  className="w-full px-3.5 py-2 rounded-xl border border-terracotta-200 bg-dopaper-50 text-lacquer-900 focus:outline-none focus:border-terracotta-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 leading-relaxed">
                ✓ <strong>Tổng chi phí ước tính:</strong> {(tourPlan.workshop.priceDiscounted * guestCount).toLocaleString('vi-VN')} VNĐ cho {guestCount} khách. Thanh toán trực tiếp tại xưởng sau khi hoàn thành.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBookingOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-terracotta-200 text-lacquer-800 hover:bg-dopaper-100 font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-terracotta-500 to-amber-600 hover:from-terracotta-600 hover:to-amber-700 text-white font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>XÁC NHẬN GIỮ CHỖ (0Đ)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVED BOOKINGS SECTION (If user previously booked) */}
      {savedBookings.length > 0 && !tourPlan && (
        <div className="paper-panel rounded-3xl p-6 sm:p-8 border border-terracotta-200 shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-terracotta-600" />
              <span>Vé Workshop Bạn Đã Đặt Chỗ Trước ({savedBookings.length})</span>
            </h3>
            <span className="text-xs text-lacquer-800/60">Lưu trong thiết bị này</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savedBookings.map((b) => (
              <div key={b.bookingId} className="p-4 rounded-2xl bg-dopaper-50 border border-terracotta-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-terracotta-600 bg-terracotta-100 px-2 py-0.5 rounded-lg">
                    {b.bookingId}
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Đã xác nhận giữ chỗ
                  </span>
                </div>

                <h4 className="font-bold text-sm text-lacquer-900">{b.workshopName}</h4>
                <div className="text-lacquer-800/70 space-y-0.5">
                  <p>📍 {b.address}</p>
                  <p>📞 Nghệ nhân: {b.artisanName} ({b.hotline})</p>
                  <p>⏰ Khung giờ: {b.selectedSlot} • {b.guestCount} khách</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
