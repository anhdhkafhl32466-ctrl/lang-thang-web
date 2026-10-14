'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  SILK_PRODUCTS,
  SILK_BASE_COLORS,
  SILK_THREAD_COLORS,
  SilkProduct,
  SilkColor,
  ThreadColor,
  WeaveTexture,
  PlacedMotif,
  VAN_PHUC_TRIVIA
} from './silkConstants';
import Step1ProductSelect from './Step1ProductSelect';
import Step2DesignStudio from './Step2DesignStudio';
import Step3CraftingLoom from './Step3CraftingLoom';
import Step4Showcase from './Step4Showcase';
import { silkSound } from './SilkSoundEffects';
import {
  Volume2,
  VolumeX,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  X,
  BookOpen,
  Compass
} from 'lucide-react';

export default function SilkGame() {
  // Game Steps: 1 | 2 | 3 | 4
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Sound state
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Help modal
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Core Silk Creation State
  const [selectedProduct, setSelectedProduct] = useState<SilkProduct>(SILK_PRODUCTS[0]);
  const [baseColor, setBaseColor] = useState<SilkColor>(SILK_BASE_COLORS[0]); // Trắng ngà
  const [customBaseHex, setCustomBaseHex] = useState<string | undefined>(undefined);
  const [weaveTexture, setWeaveTexture] = useState<WeaveTexture>('brocade');
  const [threadColor, setThreadColor] = useState<ThreadColor>(SILK_THREAD_COLORS[0]); // Vàng kim tuyến
  const [motifs, setMotifs] = useState<PlacedMotif[]>([
    {
      id: 'init-1',
      motifId: 'hoa-sen',
      x: 250,
      y: 250,
      scale: 1.3,
      rotation: 0,
      color: '#E5BF5A',
      flipX: false,
      flipY: false,
      opacity: 1
    }
  ]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    silkSound.setEnabled(next);
    if (next) silkSound.playPop();
  };

  const handleRestart = () => {
    setCurrentStep(1);
    setSelectedProduct(SILK_PRODUCTS[0]);
    setBaseColor(SILK_BASE_COLORS[0]);
    setCustomBaseHex(undefined);
    setWeaveTexture('brocade');
    setThreadColor(SILK_THREAD_COLORS[0]);
    setMotifs([
      {
        id: `init-${Date.now()}`,
        motifId: 'hoa-sen',
        x: 250,
        y: 250,
        scale: 1.3,
        rotation: 0,
        color: '#E5BF5A',
        flipX: false,
        flipY: false,
        opacity: 1
      }
    ]);
  };

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-dopaper-50 text-lacquer-950 font-sans selection:bg-gold-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* =====================================================================
            TOP HEADER & UTILITY BAR
           ===================================================================== */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-dopaper-300 pb-5">
          <div className="flex items-center gap-3">
            <Link
              href="/trai-nghiem"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-dopaper-200 hover:border-terracotta-400 text-xs font-semibold text-lacquer-800 hover:text-terracotta-600 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Trung tâm trải nghiệm</span>
            </Link>

            <span className="h-4 w-px bg-dopaper-300 hidden sm:block" />

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-400/20 text-lacquer-950 text-xs font-bold border border-gold-400/30">
              <span className="text-sm">🧵</span>
              <span>Làng Lụa Vạn Phúc • Hà Đông</span>
            </div>
          </div>

          {/* Sound & Help Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-dopaper-200 hover:bg-dopaper-100 text-xs font-medium text-lacquer-800 shadow-sm transition-colors"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px]">Âm thanh: Bật</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4 text-lacquer-400" />
                  <span className="text-[11px] text-lacquer-500">Âm thanh: Tắt</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                silkSound.playPop();
                setShowHelpModal(true);
              }}
              title="Tìm hiểu về nghề dệt lụa Vạn Phúc"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-dopaper-200 hover:bg-gold-50 text-xs font-medium text-lacquer-800 shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4 text-gold-600" />
              <span className="text-[11px]">Cẩm nang nghề</span>
            </button>
          </div>
        </header>

        {/* =====================================================================
            GAME TITLE & STEPPER PROGRESS HEADER
           ===================================================================== */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
            Sắc Lụa Vạn Phúc
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/75 leading-relaxed">
            Hóa thân thành nghệ nhân làng dệt lụa cổ Vạn Phúc: Tự do chọn sắc lụa, sáng tạo hoa văn gấm vóc, nhấn nhịp thoi đưa trên khung cửi và chiêm ngưỡng tuyệt tác của riêng bạn.
          </p>

          {/* Stepper Progress Bar */}
          <div className="pt-2 max-w-2xl mx-auto">
            <div className="grid grid-cols-4 gap-2 sm:gap-3">
              {[
                { step: 1, title: 'Chọn dáng', icon: '1' },
                { step: 2, title: 'Tạo hoa văn', icon: '2' },
                { step: 3, title: 'Dệt thoi đưa', icon: '3' },
                { step: 4, title: 'Thành phẩm', icon: '4' }
              ].map((item) => {
                const isActive = currentStep === item.step;
                const isPassed = currentStep > item.step;

                return (
                  <div
                    key={item.step}
                    onClick={() => {
                      // Allow going back to previous steps
                      if (item.step < currentStep) {
                        silkSound.playPop();
                        setCurrentStep(item.step as any);
                      }
                    }}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      item.step < currentStep ? 'cursor-pointer hover:border-gold-400' : ''
                    } ${
                      isActive
                        ? 'bg-lacquer-900 text-white border-lacquer-900 shadow-md font-bold'
                        : isPassed
                        ? 'bg-gold-100/80 text-gold-900 border-gold-300 font-semibold'
                        : 'bg-white/60 text-lacquer-800/40 border-dopaper-200 font-medium'
                    }`}
                  >
                    <div className="text-[11px] uppercase tracking-wider mb-0.5 opacity-80">
                      Bước {item.step}
                    </div>
                    <div className="text-xs sm:text-sm truncate">{item.title}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =====================================================================
            MAIN STEP VIEWS
           ===================================================================== */}
        <main>
          {currentStep === 1 && (
            <Step1ProductSelect
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
              onNext={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 2 && (
            <Step2DesignStudio
              product={selectedProduct}
              baseColor={baseColor}
              setBaseColor={setBaseColor}
              customBaseHex={customBaseHex}
              setCustomBaseHex={setCustomBaseHex}
              weaveTexture={weaveTexture}
              setWeaveTexture={setWeaveTexture}
              threadColor={threadColor}
              setThreadColor={setThreadColor}
              motifs={motifs}
              setMotifs={setMotifs}
              onNext={() => setCurrentStep(3)}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <Step3CraftingLoom
              product={selectedProduct}
              baseColor={baseColor}
              customBaseHex={customBaseHex}
              weaveTexture={weaveTexture}
              threadColor={threadColor}
              motifs={motifs}
              onComplete={() => setCurrentStep(4)}
              onBackToDesign={() => setCurrentStep(2)}
            />
          )}

          {currentStep === 4 && (
            <Step4Showcase
              product={selectedProduct}
              baseColor={baseColor}
              customBaseHex={customBaseHex}
              weaveTexture={weaveTexture}
              threadColor={threadColor}
              motifs={motifs}
              onPlayAgain={handleRestart}
            />
          )}
        </main>

        {/* =====================================================================
            HERITAGE GUIDE MODAL (CẨM NANG NGHỀ DỆT VẠN PHÚC)
           ===================================================================== */}
        {showHelpModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-dopaper-300 space-y-5 relative animate-scaleUp">
              <button
                onClick={() => setShowHelpModal(false)}
                className="absolute top-5 right-5 p-2 rounded-full hover:bg-dopaper-100 text-lacquer-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-700 uppercase tracking-wider">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Cẩm Nang Làng Nghề</span>
                </div>
                <h3 className="font-serif text-2xl font-bold text-lacquer-900">
                  Làng Lụa Vạn Phúc - Ngàn Năm Tinh Hoa
                </h3>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-lacquer-800/80 leading-relaxed max-h-[380px] overflow-y-auto pr-2">
                <p>
                  Nằm bên bờ sông Nhuệ, thuộc phường Vạn Phúc, quận Hà Đông, làng lụa Vạn Phúc được suy tôn là cái nôi của nghề dệt lụa tơ tằm xứ Bắc hơn 1.000 năm lịch sử.
                </p>

                <div className="space-y-2 pt-2">
                  {VAN_PHUC_TRIVIA.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-dopaper-100/70 border border-dopaper-200">
                      <div className="font-serif font-bold text-lacquer-900 text-xs sm:text-sm mb-1 text-terracotta-700">
                        ❖ {item.title}
                      </div>
                      <p className="text-xs text-lacquer-800/80">
                        {item.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-3 rounded-xl bg-lacquer-900 text-white font-bold text-xs uppercase tracking-wider hover:bg-lacquer-800 transition-colors shadow-md"
              >
                Đã hiểu, quay lại trò chơi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
