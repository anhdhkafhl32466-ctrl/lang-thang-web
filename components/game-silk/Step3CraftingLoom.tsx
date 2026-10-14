'use client';

import React, { useState, useEffect } from 'react';
import {
  SilkProduct,
  SilkColor,
  ThreadColor,
  WeaveTexture,
  PlacedMotif,
  VAN_PHUC_TRIVIA
} from './silkConstants';
import SilkCanvasPreview from './SilkCanvasPreview';
import { silkSound } from './SilkSoundEffects';
import {
  Sparkles,
  ArrowRight,
  RotateCw,
  CheckCircle2,
  Flame,
  Scissors,
  Check,
  Feather,
  Info
} from 'lucide-react';

interface Step3CraftingLoomProps {
  product: SilkProduct;
  baseColor: SilkColor;
  customBaseHex?: string;
  weaveTexture: WeaveTexture;
  threadColor: ThreadColor;
  motifs: PlacedMotif[];
  onComplete: () => void;
  onBackToDesign: () => void;
}

export default function Step3CraftingLoom({
  product,
  baseColor,
  customBaseHex,
  weaveTexture,
  threadColor,
  motifs,
  onComplete,
  onBackToDesign
}: Step3CraftingLoomProps) {
  // 3 sub-stages of Crafting:
  // 1 = Quay tơ & Mắc cửi (Spinning & Warping)
  // 2 = Dệt thoi đưa & Đập go (Loom Weaving with player's pattern)
  // 3 = Chuội lụa & Hoàn thiện viền (Finishing & Tailoring)
  const [subStage, setSubStage] = useState<1 | 2 | 3>(1);

  // Substage 1: Spinning & Warping state
  const [spinProgress, setSpinProgress] = useState(0);
  const [isWarped, setIsWarped] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  // Substage 2: Loom weaving state
  const [weaveProgress, setWeaveProgress] = useState(0); // 0 to 100%
  const [shuttleSide, setShuttleSide] = useState<'left' | 'right'>('left');
  const [isBeating, setIsBeating] = useState(false);
  const [shuttleAnimating, setShuttleAnimating] = useState(false);

  // Substage 3: Finishing state
  const [finishProgress, setFinishProgress] = useState(0);
  const [isSteaming, setIsSteaming] = useState(false);

  // Spacebar shortcut for weaving in substage 2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && subStage === 2) {
        e.preventDefault();
        handleLoomWeaveBeat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [subStage, weaveProgress, shuttleSide]);

  /* =========================================================================
     SUBSTAGE 1: SPINNING & WARPING
     ========================================================================= */
  const handleSpinWheel = () => {
    if (spinProgress >= 100) return;
    silkSound.playSpindleWhir();
    setWheelRotation((prev) => prev + 120);
    const next = Math.min(100, spinProgress + 25);
    setSpinProgress(next);

    if (next >= 100) {
      silkSound.playChime(1);
    }
  };

  const handleWarpThreads = () => {
    setIsWarped(true);
    silkSound.playChime(2);
    setTimeout(() => {
      setSubStage(2);
    }, 1100);
  };

  /* =========================================================================
     SUBSTAGE 2: WEAVING ON LOOM
     ========================================================================= */
  const handleLoomWeaveBeat = () => {
    if (weaveProgress >= 100 || shuttleAnimating) return;

    setShuttleAnimating(true);
    silkSound.playShuttle();
    setShuttleSide((prev) => (prev === 'left' ? 'right' : 'left'));

    // Loom reed beat after shuttle passes
    setTimeout(() => {
      setIsBeating(true);
      silkSound.playLoomClack();

      const next = Math.min(100, weaveProgress + 20);
      setWeaveProgress(next);

      setTimeout(() => {
        setIsBeating(false);
        setShuttleAnimating(false);

        if (next >= 100) {
          silkSound.playChime(4);
          setTimeout(() => {
            setSubStage(3);
          }, 1000);
        }
      }, 250);
    }, 350);
  };

  /* =========================================================================
     SUBSTAGE 3: FINISHING & STEAMING
     ========================================================================= */
  const handleFinishProcess = () => {
    if (finishProgress >= 100) return;
    setIsSteaming(true);
    silkSound.playSilkSteam();

    const next = Math.min(100, finishProgress + 35);
    setFinishProgress(next);

    setTimeout(() => {
      setIsSteaming(false);
      if (next >= 100) {
        silkSound.playChime(5);
      }
    }, 500);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Guide Bar */}
      <div className="bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-dopaper-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-terracotta-500/20 text-terracotta-700 flex items-center justify-center font-bold text-sm">
            3/4
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-lacquer-900">
              Quy Trình Chế Tác Lụa Thủ Công Vạn Phúc
            </h3>
            <p className="text-xs text-lacquer-800/70">
              {subStage === 1 && 'Công đoạn 1: Chuẩn bị tơ tằm & Mắc sợi dọc lên giàn cửi'}
              {subStage === 2 && 'Công đoạn 2: Dệt gấm hoa - Thoi đưa & Đập go tạo hình hoa văn'}
              {subStage === 3 && 'Công đoạn 3: Nấu chuội làm mềm lụa & Hoàn thiện đường viền'}
            </p>
          </div>
        </div>

        {/* Sub-steps Indicator */}
        <div className="flex items-center gap-2 text-xs">
          {[
            { num: 1, title: 'Mắc cửi' },
            { num: 2, title: 'Dệt thoi' },
            { num: 3, title: 'Hoàn thiện' }
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold transition-all ${
                subStage === s.num
                  ? 'bg-lacquer-900 text-white shadow-sm'
                  : subStage > s.num
                  ? 'bg-gold-100 text-gold-800'
                  : 'bg-dopaper-100 text-lacquer-800/40'
              }`}
            >
              {subStage > s.num ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-gold-600" />
              ) : (
                <span className="w-3.5 h-3.5 rounded-full bg-current opacity-30 text-[9px] flex items-center justify-center text-white">
                  {s.num}
                </span>
              )}
              <span>{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Crafting Simulation Container */}
      <div className="bg-gradient-to-b from-dopaper-100/90 to-dopaper-200/60 rounded-3xl p-6 sm:p-8 border-2 border-dopaper-300 shadow-inner relative overflow-hidden">
        {/* =====================================================================
            SUBSTAGE 1: QUAY TƠ & MẮC CỬI
           ===================================================================== */}
        {subStage === 1 && (
          <div className="max-w-2xl mx-auto space-y-8 py-4 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gold-700 bg-gold-100 px-3 py-1 rounded-full border border-gold-300">
                Giai đoạn 1/3
              </span>
              <h2 className="font-serif text-2xl font-bold text-lacquer-900">
                Ươm Kén & Quay Xa Kéo Tơ Tằm
              </h2>
              <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-lg mx-auto">
                Kén tằm vàng Vạn Phúc được luộc mềm, người thợ nhẹ nhàng rút sợi tơ nõn quấn đều lên ống suốt để tạo nên sợi tơ dọc dai bền.
              </p>
            </div>

            {/* Interactive Spinning Wheel Visual */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-dopaper-200">
              {/* Spinning Wheel Graphic */}
              <div className="relative w-44 h-44 flex items-center justify-center">
                <div
                  className="w-40 h-40 rounded-full border-4 border-amber-800/80 border-dashed transition-transform duration-500 flex items-center justify-center shadow-lg"
                  style={{ transform: `rotate(${wheelRotation}deg)` }}
                >
                  <div className="w-32 h-32 rounded-full border-2 border-gold-600 flex items-center justify-center">
                    {/* Spokes */}
                    <div className="absolute w-36 h-0.5 bg-amber-900" />
                    <div className="absolute w-36 h-0.5 bg-amber-900 rotate-45" />
                    <div className="absolute w-36 h-0.5 bg-amber-900 rotate-90" />
                    <div className="absolute w-36 h-0.5 bg-amber-900 rotate-135" />
                    <div className="w-8 h-8 rounded-full bg-gold-500 border-2 border-amber-900 z-10 shadow-md" />
                  </div>
                </div>

                {/* Silk Thread Bobbin */}
                <div className="absolute -bottom-2 -right-2 bg-lacquer-900 text-gold-300 px-3 py-1 rounded-lg text-xs font-mono font-bold border border-gold-500/40 shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                  <span>{spinProgress}% Tơ nõn</span>
                </div>
              </div>

              {/* Progress and Controls */}
              <div className="space-y-4 max-w-xs w-full text-center sm:text-left">
                <div>
                  <div className="flex justify-between text-xs font-bold text-lacquer-900 mb-1">
                    <span>Độ đầy ống suốt tơ:</span>
                    <span className="text-terracotta-600">{spinProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-dopaper-200 rounded-full overflow-hidden border border-dopaper-300">
                    <div
                      className="h-full bg-gradient-to-r from-gold-400 to-amber-600 transition-all duration-300 rounded-full"
                      style={{ width: `${spinProgress}%` }}
                    />
                  </div>
                </div>

                {spinProgress < 100 ? (
                  <button
                    onClick={handleSpinWheel}
                    className="w-full py-3 px-5 rounded-xl bg-gold-500 hover:bg-gold-400 active:scale-95 text-lacquer-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <RotateCw className="w-4 h-4" />
                    <span>Quay xa kéo tơ (+25%)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleWarpThreads}
                    disabled={isWarped}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-terracotta-600 to-terracotta-500 text-white font-bold text-sm shadow-lg hover:shadow-terracotta-500/30 transition-all flex items-center justify-center gap-2 animate-bounce"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Mắc sợi dọc lên khung cửi →</span>
                  </button>
                )}

                <p className="text-[11px] text-lacquer-800/60 leading-relaxed italic">
                  💡 Nhấn nút quay xa để kéo những sợi tơ tằm vàng óng ả vào suốt dệt.
                </p>
              </div>
            </div>

            {/* Warping Loom Threads Animation if warped */}
            {isWarped && (
              <div className="p-4 bg-amber-500/10 border border-amber-400/40 rounded-xl text-center space-y-1 animate-fadeIn">
                <span className="text-xs font-bold text-amber-900">
                  ✨ Đang mắc hàng ngàn sợi tơ dọc căng đều tăm tắp lên giàn cửi...
                </span>
                <div className="h-1 bg-gradient-to-r from-transparent via-gold-500 to-transparent animate-pulse" />
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            SUBSTAGE 2: DỆT GẤM HOA - THOI ĐƯA & ĐẬP GO (HERO INTERACTION)
           ===================================================================== */}
        {subStage === 2 && (
          <div className="space-y-6 py-2 animate-fadeIn">
            <div className="text-center space-y-1.5 max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                Giai đoạn 2/3: Công đoạn chính
              </span>
              <h2 className="font-serif text-2xl font-bold text-lacquer-900">
                Dệt Gấm Hoa: Thoi Đưa & Đập Go
              </h2>
              <p className="text-xs text-lacquer-800/70">
                Nhấn nhịp nhàng để con thoi gỗ lao qua luồn sợi chỉ ngang, đập go khít chặt để hoa văn của bạn dần hiện hình trên tấm lụa!
              </p>
            </div>

            {/* Loom Interactive Viewport */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Loom Visual Simulation Frame (7 COLS) */}
              <div className="md:col-span-7 relative bg-lacquer-950 rounded-2xl p-4 sm:p-6 border-4 border-amber-900/80 shadow-2xl overflow-hidden flex flex-col items-center justify-center min-h-[380px]">
                {/* Loom wooden frame beams */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-amber-900 border-b border-amber-700/50" />
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-amber-900 border-t border-amber-700/50" />
                <div className="absolute top-0 bottom-0 left-0 w-3 bg-amber-950 border-r border-amber-800" />
                <div className="absolute top-0 bottom-0 right-0 w-3 bg-amber-950 border-l border-amber-800" />

                {/* Vertical warp threads background grid */}
                <div
                  className="absolute inset-x-6 top-4 bottom-4 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, #E5BF5A 0px, #E5BF5A 1px, transparent 1px, transparent 6px)'
                  }}
                />

                {/* Shuttle Track & Animated Flying Wooden Shuttle */}
                <div className="w-full relative h-12 flex items-center mb-2 z-20">
                  <div className="w-full h-1 bg-amber-700/60 rounded-full" />

                  {/* Wooden Shuttle Item */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 flex items-center ${
                      shuttleSide === 'left' ? 'left-4' : 'right-4'
                    } ${isBeating ? 'scale-110' : ''}`}
                  >
                    <div className="relative px-4 py-1.5 bg-gradient-to-r from-amber-800 via-amber-700 to-amber-900 text-gold-200 rounded-full border border-gold-500/60 shadow-lg text-[10px] font-bold tracking-wider flex items-center gap-1">
                      <span>🧵 Con Thoi Gỗ</span>
                      {shuttleAnimating && (
                        <div className="w-2 h-2 rounded-full bg-gold-400 animate-ping" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Reed Beater (Khổ go đập vải) */}
                <div
                  className={`w-full max-w-[340px] h-3 bg-gradient-to-r from-amber-700 via-gold-600 to-amber-700 rounded-sm mb-3 shadow-md transition-transform duration-150 ${
                    isBeating ? 'translate-y-2 scale-y-125' : ''
                  }`}
                />

                {/* THE WOVEN FABRIC: PLAYER'S EXACT PATTERN REVEALING PROGRESSIVELY! */}
                <div className="relative max-w-[280px] sm:max-w-[320px] w-full flex items-center justify-center p-2 rounded-lg bg-black/40 border border-gold-500/30">
                  <SilkCanvasPreview
                    product={product}
                    baseColor={baseColor}
                    customBaseHex={customBaseHex}
                    weaveTexture={weaveTexture}
                    threadColor={threadColor}
                    motifs={motifs}
                    interactive={false}
                    weaveProgress={weaveProgress}
                    showDrapeShadows={false}
                  />

                  {/* Unwoven warp threads above cloth */}
                  {weaveProgress < 100 && (
                    <div className="absolute top-2 inset-x-4 h-8 bg-gradient-to-b from-amber-400/20 to-transparent pointer-events-none" />
                  )}
                </div>

                {/* Loom Bottom Cloth Roller */}
                <div className="w-full max-w-[340px] h-4 bg-amber-950 rounded-full mt-3 border border-amber-800 flex items-center justify-center">
                  <div className="w-20 h-1 bg-amber-700/50 rounded-full" />
                </div>
              </div>

              {/* Controls & Weaving Rhythms (5 COLS) */}
              <div className="md:col-span-5 space-y-5 bg-white/80 backdrop-blur-sm p-6 rounded-2xl border border-dopaper-200">
                <div>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-serif text-sm font-bold text-lacquer-900">
                      Tiến độ tấm lụa:
                    </span>
                    <span className="font-mono text-base font-bold text-terracotta-600">
                      {weaveProgress}%
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-dopaper-200 rounded-full overflow-hidden border border-dopaper-300 p-0.5">
                    <div
                      className="h-full bg-gradient-to-r from-terracotta-500 via-gold-500 to-terracotta-600 rounded-full transition-all duration-300"
                      style={{ width: `${weaveProgress}%` }}
                    />
                  </div>
                </div>

                {/* Weave Rhythm Action Button */}
                {weaveProgress < 100 ? (
                  <button
                    onClick={handleLoomWeaveBeat}
                    disabled={shuttleAnimating}
                    className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-lacquer-900 to-lacquer-800 hover:from-lacquer-800 hover:to-lacquer-700 active:scale-98 text-gold-300 font-bold text-base shadow-xl border-2 border-gold-500/50 transition-all flex flex-col items-center justify-center gap-1 group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold-400 group-hover:rotate-12 transition-transform" />
                      <span>Nhấn: Đập Go - Luồn Thoi</span>
                    </div>
                    <span className="text-[11px] font-normal text-dopaper-200/70">
                      (Hoặc nhấn phím [Spacebar])
                    </span>
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-1">
                    <div className="text-emerald-800 font-bold text-sm flex items-center justify-center gap-1.5">
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Đã dệt xong trọn vẹn tấm lụa!</span>
                    </div>
                    <p className="text-xs text-emerald-700/80">
                      Chuyển sang công đoạn chuội làm mềm và hoàn thiện viền...
                    </p>
                  </div>
                )}

                {/* Cultural Insight Card */}
                <div className="p-3.5 rounded-xl bg-gold-50/70 border border-gold-200 text-xs text-lacquer-900 space-y-1">
                  <div className="font-serif font-bold text-gold-800 flex items-center gap-1">
                    <Info className="w-3.5 h-3.5" />
                    <span>Nét độc đáo Lụa Vạn Phúc:</span>
                  </div>
                  <p className="text-[11px] text-lacquer-800/80 leading-relaxed">
                    Hoa văn không phải in lên sau mà được dệt nổi trực tiếp từ sợi tơ kim tuyến và tơ màu, tạo độ bóng sáng đa chiều khi xoay góc nhìn.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            SUBSTAGE 3: CHUỘI LỤA & HOÀN THIỆN VIỀN
           ===================================================================== */}
        {subStage === 3 && (
          <div className="max-w-2xl mx-auto space-y-8 py-4 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-bamboo-700 bg-bamboo-100 px-3 py-1 rounded-full border border-bamboo-300">
                Giai đoạn 3/3: Tác phẩm hoàn mỹ
              </span>
              <h2 className="font-serif text-2xl font-bold text-lacquer-900">
                Nấu Chuội & {product.finishingMethod}
              </h2>
              <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-lg mx-auto">
                Tấm lụa vừa dệt được chuội qua hơi nước ấm và nước giấm thanh giếng làng để sợi tơ bung nở độ mềm rủ, sau đó nghệ nhân cẩn trọng hoàn thiện từng đường viền.
              </p>
            </div>

            {/* Finishing Interactive Canvas */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 bg-white/70 backdrop-blur-sm p-6 rounded-2xl border border-dopaper-200 relative">
              {/* Product Preview with Steaming effect */}
              <div className="w-48 sm:w-56 flex items-center justify-center relative">
                <SilkCanvasPreview
                  product={product}
                  baseColor={baseColor}
                  customBaseHex={customBaseHex}
                  weaveTexture={weaveTexture}
                  threadColor={threadColor}
                  motifs={motifs}
                  interactive={false}
                  weaveProgress={100}
                  showDrapeShadows={true}
                />

                {/* Steam particles animation */}
                {isSteaming && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-32 h-32 rounded-full bg-white/40 blur-xl animate-ping" />
                  </div>
                )}
              </div>

              {/* Finishing Progress and Interaction */}
              <div className="space-y-4 max-w-xs w-full text-center sm:text-left">
                <div>
                  <div className="flex justify-between text-xs font-bold text-lacquer-900 mb-1">
                    <span>Độ hoàn thiện sản phẩm:</span>
                    <span className="text-bamboo-600 font-mono">{finishProgress}%</span>
                  </div>
                  <div className="w-full h-3 bg-dopaper-200 rounded-full overflow-hidden border border-dopaper-300">
                    <div
                      className="h-full bg-gradient-to-r from-bamboo-500 to-emerald-600 transition-all duration-300 rounded-full"
                      style={{ width: `${finishProgress}%` }}
                    />
                  </div>
                </div>

                {finishProgress < 100 ? (
                  <button
                    onClick={handleFinishProcess}
                    disabled={isSteaming}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-bamboo-600 to-emerald-700 hover:from-bamboo-500 hover:to-emerald-600 active:scale-95 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Feather className="w-4 h-4" />
                    <span>Chuốt tơ & Khâu mép viền (+35%)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      silkSound.playChime(5);
                      onComplete();
                    }}
                    className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-gold-500 via-amber-500 to-gold-600 text-lacquer-950 font-bold text-sm shadow-xl hover:shadow-gold-500/40 transition-all flex items-center justify-center gap-2 animate-bounce"
                  >
                    <Sparkles className="w-4 h-4 text-lacquer-950" />
                    <span>Bước 4: Nhận Tuyệt Tác Lụa →</span>
                  </button>
                )}

                <div className="text-[11px] text-lacquer-800/70 space-y-1">
                  <div>
                    Kỹ thuật đặc thù: <strong className="text-lacquer-950">{product.finishingMethod}</strong>
                  </div>
                  <p className="italic text-lacquer-800/60">
                    Tấm lụa đạt đến độ óng mượt tuyệt đối, sẵn sàng để xuất xưởng!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Back to Design Link */}
      <div className="flex justify-between items-center text-xs">
        <button
          onClick={onBackToDesign}
          className="text-lacquer-800/70 hover:text-lacquer-900 underline font-medium"
        >
          ← Chỉnh sửa lại thiết kế hoa văn
        </button>
      </div>
    </div>
  );
}
