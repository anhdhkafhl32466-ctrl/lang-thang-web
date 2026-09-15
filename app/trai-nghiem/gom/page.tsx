'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { unlockBadge, saveCreation } from '@/lib/passportStorage';
import { Sparkles, Flame, CheckCircle2, RotateCcw, ArrowRight, Award, ShoppingBag, Eye, Heart } from 'lucide-react';
import { PRODUCTS } from '@/data/products';

export default function PotteryGamePage() {
  const [step, setStep] = useState<'clay' | 'shape' | 'glaze' | 'fire' | 'finish'>('clay');

  // Clay selection
  const [selectedClay, setSelectedClay] = useState({
    id: 'white',
    name: 'Đất sét trắng cao lanh Bát Tràng',
    color: '#E8DFD5',
    desc: 'Độ tinh khiết cao, nung ra cốt sứ trắng đanh chắc như chuông.'
  });

  // Shaping parameters
  const [rim, setRim] = useState(45);        // Miệng bình
  const [neck, setNeck] = useState(25);       // Cổ bình
  const [belly, setBelly] = useState(75);     // Bụng bình
  const [base, setBase] = useState(40);       // Đáy bình
  const [vaseHeight, setVaseHeight] = useState(180); // Chiều cao

  // Glaze & Pattern selection
  const [selectedGlaze, setSelectedGlaze] = useState({
    id: 'blue',
    name: 'Men lam truyền thống Bát Tràng',
    baseColor: '#F5F5FA',
    accentColor: '#1E3A8A',
    description: 'Nước men màu trắng ngà kết hợp nét vẽ hoa lam sắc sảo từ thế kỷ 14.'
  });

  const [selectedPattern, setSelectedPattern] = useState<'lotus' | 'crackle' | 'wave' | 'pure'>('lotus');

  // Kiln firing state
  const [temperature, setTemperature] = useState(25);
  const [isFiring, setIsFiring] = useState(false);
  const [firingDone, setFiringDone] = useState(false);

  // Finished creation
  const [creationName, setCreationName] = useState('Bình Hút Lộc Bát Tràng');
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw vase on canvas
  const drawVase = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    progressGlaze: boolean = false,
    kilnHeat: number = 0
  ) => {
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const halfH = vaseHeight / 2;

    // Draw spinning pottery wheel base
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + halfH + 15, 100, 22, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#4A3B32';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#2B1E16';
    ctx.stroke();

    // Wheel top metal disc
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + halfH + 10, 85, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#786657';
    ctx.fill();

    // Key points of the vase
    const topY = centerY - halfH;
    const neckY = centerY - halfH * 0.45;
    const bellyY = centerY + halfH * 0.15;
    const baseY = centerY + halfH;

    // Outer path
    ctx.beginPath();
    // Top rim ellipse
    ctx.ellipse(centerX, topY, rim, rim * 0.25, 0, 0, Math.PI * 2);

    // Left side curve
    ctx.moveTo(centerX - rim, topY);
    ctx.bezierCurveTo(
      centerX - neck * 0.9, neckY - 15,
      centerX - neck, neckY,
      centerX - neck, neckY + 10
    );
    ctx.bezierCurveTo(
      centerX - belly * 0.95, bellyY - 20,
      centerX - belly, bellyY,
      centerX - base * 1.1, baseY - 10
    );
    ctx.lineTo(centerX - base, baseY);

    // Bottom base curve
    ctx.ellipse(centerX, baseY, base, base * 0.2, 0, 0, Math.PI);

    // Right side curve
    ctx.lineTo(centerX + base, baseY);
    ctx.bezierCurveTo(
      centerX + base * 1.1, baseY - 10,
      centerX + belly, bellyY,
      centerX + belly * 0.95, bellyY - 20
    );
    ctx.bezierCurveTo(
      centerX + neck, neckY + 10,
      centerX + neck, neckY,
      centerX + rim, topY
    );
    ctx.closePath();

    // Fill Color based on stage
    let fillColor = selectedClay.color;

    if (kilnHeat > 0) {
      // Glow red-hot in kiln
      const heatFactor = kilnHeat / 1250;
      fillColor = heatFactor > 0.6 ? '#FF4500' : '#D9531E';
    } else if (progressGlaze) {
      fillColor = selectedGlaze.baseColor;
    }

    ctx.fillStyle = fillColor;
    ctx.fill();

    // Shading gradient for 3D cylinder/pottery look
    const grad = ctx.createLinearGradient(centerX - belly, centerY, centerX + belly, centerY);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.65, 'rgba(255, 255, 255, 0.05)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.35)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = progressGlaze ? 'rgba(30, 58, 138, 0.3)' : 'rgba(100, 70, 50, 0.4)';
    ctx.stroke();

    // Glaze Patterns
    if (progressGlaze && kilnHeat === 0) {
      ctx.save();
      ctx.clip(); // Keep patterns inside vase contour

      if (selectedPattern === 'lotus') {
        // Draw hand-painted Lotus motif in blue
        ctx.fillStyle = selectedGlaze.accentColor;
        ctx.beginPath();
        // Central lotus petal
        ctx.ellipse(centerX, bellyY - 5, 14, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left petal
        ctx.beginPath();
        ctx.ellipse(centerX - 16, bellyY, 11, 24, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Right petal
        ctx.beginPath();
        ctx.ellipse(centerX + 16, bellyY, 11, 24, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Stems & water ripples
        ctx.strokeStyle = selectedGlaze.accentColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, bellyY + 28, 30, 0.2, Math.PI - 0.2);
        ctx.stroke();
      } else if (selectedPattern === 'crackle') {
        // Crackle lines
        ctx.strokeStyle = 'rgba(70, 50, 40, 0.45)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = -belly; i < belly; i += 22) {
          ctx.moveTo(centerX + i, topY + 20);
          ctx.lineTo(centerX + i + (i % 2 === 0 ? 12 : -10), bellyY);
          ctx.lineTo(centerX + i + 5, baseY - 10);
        }
        ctx.stroke();
      } else if (selectedPattern === 'wave') {
        // Classical waves
        ctx.strokeStyle = selectedGlaze.accentColor;
        ctx.lineWidth = 2.5;
        for (let y = neckY; y < baseY - 15; y += 24) {
          ctx.beginPath();
          ctx.arc(centerX - 25, y, 14, 0, Math.PI);
          ctx.arc(centerX, y, 14, 0, Math.PI);
          ctx.arc(centerX + 25, y, 14, 0, Math.PI);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Top inner rim mouth hole
    ctx.beginPath();
    ctx.ellipse(centerX, topY, rim * 0.85, rim * 0.2, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30, 20, 15, 0.6)';
    ctx.fill();
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawVase(
      ctx,
      canvas.width,
      canvas.height,
      step === 'glaze' || step === 'fire' || step === 'finish',
      isFiring ? temperature : 0
    );
  }, [rim, neck, belly, base, vaseHeight, selectedClay, selectedGlaze, selectedPattern, step, temperature, isFiring]);

  // Firing animation simulation
  const handleStartFiring = () => {
    setIsFiring(true);
    setTemperature(25);
    setFiringDone(false);

    let currentTemp = 25;
    const interval = setInterval(() => {
      currentTemp += 45;
      if (currentTemp >= 1250) {
        currentTemp = 1250;
        setTemperature(1250);
        clearInterval(interval);
        setTimeout(() => {
          setIsFiring(false);
          setFiringDone(true);
          setStep('finish');

          // Trigger celebratory confetti
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 }
          });

          // Unlock pottery master badge in passport
          const badge = unlockBadge('badge-pottery');
          if (badge) setBadgeUnlocked(true);

          // Save creation to user passport
          saveCreation({
            id: `pottery-${Date.now()}`,
            type: 'pottery',
            title: creationName,
            villageName: 'Làng gốm Bát Tràng',
            date: new Date().toISOString(),
            previewColor: selectedGlaze.baseColor,
            details: {
              clay: selectedClay.name,
              glaze: selectedGlaze.name,
              pattern: selectedPattern,
              rim,
              belly
            }
          });
        }, 1200);
      } else {
        setTemperature(currentTemp);
      }
    }, 80);
  };

  const battrangProducts = PRODUCTS.filter((p) => p.villageId === 'bat-trang');

  return (
    <div className="min-h-screen py-8 sm:py-14 bg-dopaper-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/trai-nghiem"
            className="text-xs font-semibold text-lacquer-800/70 hover:text-terracotta-600 flex items-center gap-1"
          >
            ← Quay lại Trung tâm trải nghiệm
          </Link>
          <span className="text-xs bg-terracotta-100 text-terracotta-700 font-bold px-3 py-1 rounded-full">
            Workshop Gốm Sứ Bát Tràng
          </span>
        </div>

        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-lacquer-900">
            Tự tay vuốt gốm Bát Tràng
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70">
            Trải nghiệm 4 bước làm nghề: Chọn đất → Vuốt dáng bàn xoay → Phủ men ngọc → Nung lò 1.250°C.
          </p>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-4 gap-2 max-w-2xl mx-auto">
          {[
            { id: 'clay', label: '1. Chọn đất' },
            { id: 'shape', label: '2. Vuốt bàn xoay' },
            { id: 'glaze', label: '3. Phủ men' },
            { id: 'fire', label: '4. Nung lò' },
          ].map((s) => (
            <div
              key={s.id}
              className={`py-2 text-center rounded-xl text-xs font-bold transition-all border ${
                step === s.id || (step === 'finish' && s.id === 'fire')
                  ? 'bg-terracotta-500 text-white border-terracotta-500 shadow-md'
                  : 'bg-white text-lacquer-800/60 border-terracotta-200'
              }`}
            >
              {s.label}
            </div>
          ))}
        </div>

        {/* Main Interactive Studio Canvas & Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/90 shadow-xl">
          {/* Canvas Preview Area */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center p-4 bg-dopaper-100/60 rounded-2xl border border-terracotta-200/70 relative overflow-hidden">
            {isFiring && (
              <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center text-white animate-pulse">
                <Flame className="w-16 h-16 text-amber-400 animate-bounce" />
                <span className="font-serif text-3xl font-bold mt-2 text-gold-300 drop-shadow">
                  {temperature}°C
                </span>
                <span className="text-xs tracking-wider uppercase text-dopaper-100 mt-1">
                  Đang nung gốm trong lò...
                </span>
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={380}
              height={360}
              className="max-w-full drop-shadow-xl cursor-grab active:cursor-grabbing"
            />

            <div className="mt-4 text-center">
              <span className="text-xs font-semibold text-lacquer-800/70 block">
                {selectedClay.name}
              </span>
              {step === 'glaze' && (
                <span className="text-[11px] text-terracotta-600 font-bold block mt-0.5">
                  {selectedGlaze.name}
                </span>
              )}
            </div>
          </div>

          {/* Step Controls Area */}
          <div className="lg:col-span-6 space-y-6">
            {/* STEP 1: CHỌN ĐẤT */}
            {step === 'clay' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Bước 1: Chọn nguyên liệu đất sét
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Đất là xương thịt của gốm. Mỗi chất đất mang lại độ bóng, độ đanh và màu sắc cốt gốm đặc trưng sau khi nung.
                </p>

                <div className="space-y-2.5">
                  {[
                    {
                      id: 'white',
                      name: 'Đất sét trắng cao lanh Bát Tràng',
                      color: '#E8DFD5',
                      desc: 'Độ dẻo mịn tuyệt hảo, thích hợp làm gốm sứ men lam và men ngọc ngự dụng.'
                    },
                    {
                      id: 'brown',
                      name: 'Đất phù sa bãi bồi sông Hồng',
                      color: '#B8825D',
                      desc: 'Giàu khoáng chất tự nhiên, nung ra sắc gốm mộc tử sa đầm ấm.'
                    },
                    {
                      id: 'chamotte',
                      name: 'Đất sa mốt chịu lửa cao',
                      color: '#9C7A65',
                      desc: 'Độ đanh chắc vượt trội, nung được ở mức nhiệt trên 1.300°C.'
                    }
                  ].map((clay) => (
                    <div
                      key={clay.id}
                      onClick={() => setSelectedClay(clay)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        selectedClay.id === clay.id
                          ? 'bg-terracotta-50 border-terracotta-500 shadow-sm'
                          : 'bg-dopaper-50/50 border-terracotta-200 hover:bg-dopaper-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-xl border-2 border-white shadow-sm"
                          style={{ backgroundColor: clay.color }}
                        />
                        <div>
                          <h4 className="text-sm font-bold text-lacquer-900">{clay.name}</h4>
                          <p className="text-[11px] text-lacquer-800/60 leading-snug">{clay.desc}</p>
                        </div>
                      </div>
                      {selectedClay.id === clay.id && (
                        <CheckCircle2 className="w-5 h-5 text-terracotta-600 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setStep('shape')}
                    className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-2"
                  >
                    <span>Lên bàn xoay tạo hình</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VUỐT BÀN XOAY */}
            {step === 'shape' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-xl font-bold text-lacquer-900">
                    Bước 2: Nắn vuốt dáng bình gốm
                  </h3>
                  <button
                    onClick={() => {
                      setRim(45);
                      setNeck(25);
                      setBelly(75);
                      setBase(40);
                      setVaseHeight(180);
                    }}
                    className="text-xs text-terracotta-600 hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại dáng</span>
                  </button>
                </div>
                <p className="text-xs text-lacquer-800/70">
                  Kéo các thanh trượt bên dưới để điều chỉnh miệng bình, eo thon và độ phình của bụng bình gốm theo ý muốn của bạn.
                </p>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-lacquer-900 mb-1">
                      <span>Miệng bình (Độ loe)</span>
                      <span>{rim} mm</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={75}
                      value={rim}
                      onChange={(e) => setRim(Number(e.target.value))}
                      className="w-full accent-terracotta-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-lacquer-900 mb-1">
                      <span>Cổ bình (Độ thắt eo)</span>
                      <span>{neck} mm</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={55}
                      value={neck}
                      onChange={(e) => setNeck(Number(e.target.value))}
                      className="w-full accent-terracotta-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-lacquer-900 mb-1">
                      <span>Bụng bình (Độ phình tài lộc)</span>
                      <span>{belly} mm</span>
                    </div>
                    <input
                      type="range"
                      min={45}
                      max={110}
                      value={belly}
                      onChange={(e) => setBelly(Number(e.target.value))}
                      className="w-full accent-terracotta-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold text-lacquer-900 mb-1">
                      <span>Chiều cao bình</span>
                      <span>{vaseHeight} mm</span>
                    </div>
                    <input
                      type="range"
                      min={140}
                      max={220}
                      value={vaseHeight}
                      onChange={(e) => setVaseHeight(Number(e.target.value))}
                      className="w-full accent-terracotta-500"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep('clay')}
                    className="px-4 py-2 rounded-xl border border-terracotta-200 text-xs font-semibold text-lacquer-800"
                  >
                    ← Chọn lại đất
                  </button>
                  <button
                    onClick={() => setStep('glaze')}
                    className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-2"
                  >
                    <span>Phủ men & Hoa văn</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PHỦ MEN */}
            {step === 'glaze' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Bước 3: Tráng nước men bí truyền & Hoa văn
                </h3>
                <p className="text-xs text-lacquer-800/70">
                  Chọn dòng men cổ điển của Bát Tràng và hoa văn trang trí tinh tế.
                </p>

                {/* Glaze selector */}
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    {
                      id: 'blue',
                      name: 'Men lam truyền thống',
                      baseColor: '#F8F9FA',
                      accentColor: '#1E3A8A',
                      description: 'Trắng ngà phối hoa lam cung đình'
                    },
                    {
                      id: 'celadon',
                      name: 'Men ngọc Celadon',
                      baseColor: '#D1E7DD',
                      accentColor: '#198754',
                      description: 'Xanh ngọc bích bóng mịn quý phái'
                    },
                    {
                      id: 'crackle',
                      name: 'Men rạn cổ thời Lê',
                      baseColor: '#EBE5D8',
                      accentColor: '#493829',
                      description: 'Vân rạn thời gian độc bản'
                    },
                    {
                      id: 'flambe',
                      name: 'Men hỏa biến',
                      baseColor: '#4A5568',
                      accentColor: '#DD6B20',
                      description: 'Biến hóa kỳ ảo dưới ngọn lửa'
                    }
                  ].map((glz) => (
                    <div
                      key={glz.id}
                      onClick={() => setSelectedGlaze(glz)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedGlaze.id === glz.id
                          ? 'bg-terracotta-50 border-terracotta-500 shadow-sm'
                          : 'bg-dopaper-50/50 border-terracotta-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border shadow-sm shrink-0"
                          style={{ backgroundColor: glz.baseColor }}
                        />
                        <span className="text-xs font-bold text-lacquer-900 truncate">
                          {glz.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-lacquer-800/60 block mt-1 truncate">
                        {glz.description}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pattern selector */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-lacquer-900 block mb-2">
                    Chọn họa tiết thủ công:
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'lotus', label: 'Đóa sen thanh tao' },
                      { id: 'crackle', label: 'Vân men rạn' },
                      { id: 'wave', label: 'Sóng nước Thăng Long' },
                    ].map((pat) => (
                      <button
                        key={pat.id}
                        onClick={() => setSelectedPattern(pat.id as any)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                          selectedPattern === pat.id
                            ? 'bg-lacquer-900 text-white border-lacquer-900'
                            : 'bg-white text-lacquer-800/80 border-terracotta-200 hover:bg-terracotta-50'
                        }`}
                      >
                        {pat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep('shape')}
                    className="px-4 py-2 rounded-xl border border-terracotta-200 text-xs font-semibold text-lacquer-800"
                  >
                    ← Chỉnh lại dáng
                  </button>
                  <button
                    onClick={() => setStep('fire')}
                    className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-2"
                  >
                    <span>Đưa vào lò nung</span>
                    <Flame className="w-4 h-4 text-gold-300" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: NUNG LÒ */}
            {step === 'fire' && (
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Bước 4: Nung gốm trong lò lửa 1.250°C
                </h3>
                <p className="text-xs text-lacquer-800/70 leading-relaxed">
                  Lửa là linh hồn biến đất sét mộc thành sứ vĩnh cửu. Nhấn nút bên dưới để nhóm lửa lò nung và theo dõi nhiệt độ tăng dần từ 25°C lên tới 1.250°C.
                </p>

                <div className="p-4 bg-terracotta-50 rounded-2xl border border-terracotta-200 space-y-3">
                  <div className="flex justify-between items-center text-xs font-bold text-lacquer-900">
                    <span>Nhiệt độ lò nung hiện tại:</span>
                    <span className="text-base text-terracotta-600 font-serif">
                      {temperature}°C / 1.250°C
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 h-full transition-all duration-100"
                      style={{ width: `${(temperature / 1250) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center">
                  <button
                    disabled={isFiring}
                    onClick={() => setStep('glaze')}
                    className="px-4 py-2 rounded-xl border border-terracotta-200 text-xs font-semibold text-lacquer-800 disabled:opacity-40"
                  >
                    ← Chọn lại men
                  </button>
                  <button
                    disabled={isFiring}
                    onClick={handleStartFiring}
                    className="px-8 py-3 rounded-2xl bg-gradient-to-r from-terracotta-600 to-red-600 hover:from-terracotta-700 hover:to-red-700 text-white font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    <Flame className="w-5 h-5 text-gold-300 animate-pulse" />
                    <span>{isFiring ? 'Đang nung...' : 'Kích hoạt lò nung 1.250°C'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: HOÀN THÀNH */}
            {step === 'finish' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-bamboo-100 text-bamboo-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-bamboo-600" />
                  <span>Tác Phẩm Hoàn Thành Xuất Sắc!</span>
                </div>

                <h3 className="font-serif text-2xl font-bold text-lacquer-900">
                  Chúc mừng bạn đã tạo nên tuyệt phẩm gốm!
                </h3>

                <p className="text-xs text-lacquer-800/70">
                  Bạn vừa hoàn thành một chiếc bình lấy cảm hứng từ kỹ nghệ Bát Tràng ngàn năm. Tác phẩm đã được lưu vào Hộ Chiếu Làng Nghề của bạn (+50 điểm).
                </p>

                {badgeUnlocked && (
                  <div className="p-3.5 bg-gradient-to-r from-gold-400/20 to-terracotta-100 rounded-2xl border border-gold-400/60 flex items-center gap-3">
                    <span className="text-3xl">🏺</span>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-terracotta-700 block">
                        Huy hiệu mới mở khóa
                      </span>
                      <h4 className="text-sm font-bold text-lacquer-900">
                        Bậc Thầy Bàn Xoay Bát Tràng
                      </h4>
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <label className="text-xs font-semibold text-lacquer-800/80 block mb-1">
                    Đặt tên cho bình gốm của bạn:
                  </label>
                  <input
                    type="text"
                    value={creationName}
                    onChange={(e) => setCreationName(e.target.value)}
                    className="w-full bg-dopaper-100 text-lacquer-900 px-3.5 py-2 rounded-xl border border-terracotta-200 text-sm font-serif font-bold"
                  />
                </div>

                {/* Direct Startup CTA connection to real commerce & tours */}
                <div className="pt-4 border-t border-terracotta-200 space-y-2">
                  <p className="text-xs font-bold text-terracotta-700">
                    Bạn có muốn sở hữu sản phẩm gốm thật từ các nghệ nhân không?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href="/san-pham"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold text-center shadow"
                    >
                      Xem sản phẩm gốm thật
                    </Link>
                    <Link
                      href="/du-lich"
                      className="flex-1 py-2.5 px-4 rounded-xl bg-lacquer-900 hover:bg-lacquer-800 text-white text-xs font-bold text-center shadow"
                    >
                      Đặt workshop thực tế tại Bát Tràng
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Featured Real Products from Artisans below game */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">
                Kết Nối Thương Mại Thực Tế
              </span>
              <h2 className="font-serif text-2xl font-bold text-lacquer-900 mt-1">
                Các sản phẩm gốm thật tương tự từ nghệ nhân Bát Tràng
              </h2>
            </div>
            <Link
              href="/san-pham"
              className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {battrangProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-terracotta-200/80 bg-dopaper-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full aspect-[4/3] rounded-xl object-cover mb-3"
                  />
                  <h4 className="font-serif text-sm font-bold text-lacquer-900 line-clamp-1">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-lacquer-800/60 mt-1 line-clamp-2">
                    {prod.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-terracotta-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-terracotta-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                  </span>
                  <a
                    href={prod.shopeeUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-terracotta-500 text-white text-xs font-semibold hover:bg-terracotta-600 shadow-sm"
                  >
                    Mua sản phẩm
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
