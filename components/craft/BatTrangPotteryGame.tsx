'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Maximize2, Minimize2, RotateCcw, ExternalLink, Sparkles, Volume2 } from 'lucide-react';

export default function BatTrangPotteryGame() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [key, setKey] = useState(0);

  // Toggle Fullscreen mode
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Lỗi khi mở toàn màn hình:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Lỗi khi thoát toàn màn hình:', err);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Reload the game
  const handleReload = () => {
    setKey((prev) => prev + 1);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-stone-900 p-2 sm:p-4 flex flex-col h-screen'
          : 'rounded-2xl sm:rounded-3xl shadow-xl border border-[#ECE2C8] overflow-hidden bg-[#F4EEDF]'
      }`}
    >
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 bg-[#FFFCF6] border-b border-[#E4D9BE] text-[#2B2620] z-10 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
          <span className="text-xs sm:text-sm font-bold text-[#33455E]">
            Xưởng Gốm Trải Nghiệm Bát Tràng
          </span>
          <span className="hidden md:inline-block text-[11px] font-semibold text-[#8A5834] bg-[#F4EEDF] px-2 py-0.5 rounded-full border border-[#E4D9BE]">
            5 Công Đoạn Nghệ Nhân
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Reload button */}
          <button
            onClick={handleReload}
            title="Làm mới trò chơi"
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#F4EEDF] text-[#5A5348] hover:text-[#2B2620] hover:bg-[#EAE0C8] transition-colors border border-[#E4D9BE]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Chơi lại</span>
          </button>

          {/* Open full screen */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-[#33455E] text-white hover:bg-[#5B7599] transition-colors shadow-sm"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Thu nhỏ</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Toàn màn hình</span>
              </>
            )}
          </button>

          {/* Open in new tab */}
          <a
            href="/games/bat-trang-pottery.html"
            target="_blank"
            rel="noopener noreferrer"
            title="Mở trò chơi ở tab mới"
            className="p-1.5 rounded-lg text-[#8A5834] hover:bg-[#EAE0C8] transition-colors border border-[#E4D9BE]"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Game Iframe Container */}
      <div
        className={`w-full relative ${
          isFullscreen ? 'flex-1 h-full' : 'h-[640px] sm:h-[720px] lg:h-[780px]'
        }`}
      >
        <iframe
          key={key}
          ref={iframeRef}
          src="/games/bat-trang-pottery.html"
          title="Nặn Gốm Bát Tràng"
          className="w-full h-full border-0 block"
          allow="autoplay"
        />
      </div>
    </div>
  );
}
