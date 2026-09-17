'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface HeritageLoadingScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export default function HeritageLoadingScreen({
  onFinish,
  minDurationMs = 2000,
}: HeritageLoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  // Generate 28 randomized subtle golden particles/embers for background
  const particles = useMemo(() => {
    return Array.from({ length: 28 }, (_, i) => ({
      id: i,
      left: `${(i * 13.7 + 7) % 96}%`,
      top: `${(i * 17.3 + 11) % 92}%`,
      size: (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1.5),
      opacity: 0.2 + ((i % 5) * 0.12),
      duration: 3 + (i % 4) * 1.5,
      delay: (i % 6) * 0.4,
    }));
  }, []);

  // Smooth realistic progress progression
  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 25;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));

      setProgress(pct);

      if (pct >= 100) {
        clearInterval(timer);
        // Pause briefly at 100% for satisfaction, then fade out
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsMounted(false);
            onFinish?.();
          }, 700);
        }, 220);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [minDurationMs, onFinish]);

  // Handle immediate skip
  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMounted(false);
      onFinish?.();
    }, 400);
  };

  if (!isMounted) return null;

  // Status message based on progress
  let statusText = 'Đang mở cánh cửa lịch sử...';
  if (progress >= 35 && progress < 70) {
    statusText = 'Kết nối dòng chảy di sản Thăng Long...';
  } else if (progress >= 70 && progress < 99) {
    statusText = 'Khơi nguồn tinh hoa 327 làng nghề...';
  } else if (progress >= 99) {
    statusText = 'Chào mừng bạn đến với Hà Nội!';
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0B0A08] select-none transition-all duration-700 ease-in-out ${
        isExiting
          ? 'opacity-0 scale-[1.02] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'radial-gradient(ellipse at 50% 48%, rgba(197, 160, 89, 0.14) 0%, rgba(14, 12, 10, 0.95) 55%, #080706 100%)',
      }}
    >
      {/* Background Floating Golden Stardust Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-amber-200"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              boxShadow: `0 0 ${p.size * 3}px rgba(251, 191, 36, 0.8)`,
              animation: `pulse ${p.duration}s ease-in-out ${p.delay}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Skip Button in Top Right */}
      <button
        onClick={handleSkip}
        type="button"
        className="absolute top-5 right-5 z-20 text-[11px] text-amber-300/50 hover:text-amber-200 transition-colors uppercase tracking-widest flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-amber-500/20 hover:border-amber-500/40 bg-black/40 backdrop-blur-md"
      >
        <span>Bỏ qua</span>
        <ArrowRight className="w-3 h-3" />
      </button>

      {/* Central Content Container */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 max-w-lg mx-auto">
        {/* Emblem: Concentric Golden Circles with Heritage Pavilion Icon */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute w-40 h-40 rounded-full bg-amber-500/15 blur-2xl animate-pulse pointer-events-none" />

          {/* Outermost Rotating Dashed Ring */}
          <div
            className="absolute w-28 h-28 rounded-full border border-amber-400/20 border-dashed pointer-events-none"
            style={{
              animation: 'spin 24s linear infinite',
            }}
          />

          {/* Secondary Golden Circle with Soft Glow */}
          <div className="absolute w-24 h-24 rounded-full border border-amber-400/40 shadow-[0_0_20px_rgba(217,119,6,0.25)] pointer-events-none" />

          {/* Core Dark Badge with Golden Pavilion */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-[#1C1813] to-[#0D0B08] border border-amber-400/80 shadow-2xl flex items-center justify-center overflow-hidden">
            {/* Inner Ring Detail */}
            <div className="absolute inset-1 rounded-full border border-amber-500/25 pointer-events-none" />

            {/* Stylized Khuê Văn Các / Cổng Làng Di Sản SVG Line Art in Gold */}
            <svg
              viewBox="0 0 64 64"
              fill="none"
              className="w-10 h-10 text-amber-300 transition-transform hover:scale-105"
            >
              {/* Roof Tip */}
              <path d="M32 7L32 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              
              {/* Upper Curved Roof */}
              <path
                d="M17 15.5C22 14.5 27 13.8 32 13.8C37 13.8 42 14.5 47 15.5C49 16 50 14.5 48.5 13C46.5 11 41 10.5 32 10.5C23 10.5 17.5 11 15.5 13C14 14.5 15 16 17 15.5Z"
                fill="currentColor"
                fillOpacity="0.25"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Khuê Văn Các Pavilion Window */}
              <rect x="23.5" y="17.5" width="17" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="32" cy="23.5" r="3.5" stroke="currentColor" strokeWidth="1.3" />
              <line x1="32" y1="20" x2="32" y2="27" stroke="currentColor" strokeWidth="1.1" />
              <line x1="28.5" y1="23.5" x2="35.5" y2="23.5" stroke="currentColor" strokeWidth="1.1" />

              {/* Lower Sweeping Roof */}
              <path
                d="M10 32C17.5 30.5 24.5 29.5 32 29.5C39.5 29.5 46.5 30.5 54 32C56.5 32.5 57.5 30.5 55.5 28.5C53.5 26 47 24.5 32 24.5C17 24.5 10.5 26 8.5 28.5C6.5 30.5 7.5 32.5 10 32Z"
                fill="currentColor"
                fillOpacity="0.3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />

              {/* Four Stately Pillars */}
              <line x1="18" y1="33" x2="18" y2="51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="27" y1="33" x2="27" y2="51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="37" y1="33" x2="37" y2="51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <line x1="46" y1="33" x2="46" y2="51" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />

              {/* Foundation Plinth Steps */}
              <line x1="13" y1="51" x2="51" y2="51" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="9" y1="55" x2="55" y2="55" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Top Era / Heritage Label */}
        <p className="text-[10px] sm:text-xs tracking-[0.26em] uppercase text-amber-300/80 font-semibold mb-2.5">
          DI SẢN THĂNG LONG HÀ NỘI • 1010 — 2026
        </p>

        {/* Main Title in Serif Cultural Styling */}
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] mb-3">
          LANG THANG — LÀNG NGHỀ HÀ NỘI
        </h1>

        {/* Dynamic Cultural Status Text */}
        <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm text-amber-200/80 italic font-sans mb-7 min-h-[22px]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span className="transition-all duration-300">{statusText}</span>
        </div>

        {/* Sleek Golden Progress Bar */}
        <div className="w-56 sm:w-72 mx-auto space-y-2.5">
          <div className="w-full h-[2px] sm:h-[2.5px] bg-white/10 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-300 to-yellow-200 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(251,191,36,0.9)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Percentage Counter */}
          <div className="text-center font-mono text-[11px] sm:text-xs text-amber-400/90 font-semibold tracking-wider">
            {progress}%
          </div>
        </div>
      </div>
    </div>
  );
}
