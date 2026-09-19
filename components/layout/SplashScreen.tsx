'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface SplashScreenProps {
  onFinish?: () => void;
  minDurationMs?: number;
}

export default function SplashScreen({
  onFinish,
  minDurationMs = 2200,
}: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 25;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / minDurationMs) * 100));

      setProgress(pct);

      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsMounted(false);
            onFinish?.();
          }, 700);
        }, 250);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [minDurationMs, onFinish]);

  const handleSkip = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsMounted(false);
      onFinish?.();
    }, 350);
  };

  if (!isMounted) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex items-center justify-center cursor-pointer select-none transition-all duration-700 ease-in-out ${
        isExiting
          ? 'opacity-0 scale-[1.03] pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      style={{
        background: 'linear-gradient(135deg, #fce5dc 0%, #faede6 50%, #f5e3d7 100%)',
      }}
    >
      {/* Nút Bỏ qua ở góc phải */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleSkip();
        }}
        type="button"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 text-xs text-lacquer-800/80 hover:text-lacquer-950 font-medium tracking-wide flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white backdrop-blur-md border border-terracotta-200 shadow-sm transition-all hover:scale-105"
      >
        <span>Bỏ qua</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Khung tranh minh họa Splash Screen */}
      <div className="relative w-full h-full max-w-6xl max-h-[92vh] flex items-center justify-center p-2 sm:p-4 md:p-6">
        <div className="relative w-full aspect-[16/9] max-h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-terracotta-200/70 bg-[#faede6] group">
          {/* Tranh vẽ màu nước chính xác theo mẫu của người dùng */}
          <img
            src="/images/splash-screen.jpg"
            alt="Lang Thang — Khám phá • Truyền tải • Kết nối"
            className="w-full h-full object-cover sm:object-contain object-center transition-transform duration-1000 ease-out scale-100"
          />

          {/* Thanh tiến trình tải động khớp vị trí chữ 'Đang tải...' */}
          <div className="absolute bottom-3 sm:bottom-5 left-0 right-0 z-20 flex flex-col items-center justify-center px-4 pointer-events-none">
            <div className="w-48 sm:w-64 h-1.5 sm:h-2 bg-white/70 backdrop-blur-md rounded-full overflow-hidden border border-black/10 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-terracotta-500 via-amber-500 to-emerald-600 rounded-full transition-all duration-100 ease-out shadow-[0_0_10px_rgba(200,90,50,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px] sm:text-xs font-semibold text-lacquer-900 bg-white/85 backdrop-blur-md px-3.5 py-0.5 rounded-full border border-terracotta-200 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 animate-ping" />
              <span>Đang tải... {progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
