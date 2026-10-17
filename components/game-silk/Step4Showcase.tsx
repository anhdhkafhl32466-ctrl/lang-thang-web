'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  SilkProduct,
  SilkColor,
  ThreadColor,
  WeaveTexture,
  PlacedMotif,
  SILK_MOTIFS,
  POETIC_NAMES
} from './silkConstants';
import SilkCanvasPreview from './SilkCanvasPreview';
import { silkSound } from './SilkSoundEffects';
import { unlockBadge, saveCreation } from '@/lib/passportStorage';
import {
  Sparkles,
  Download,
  RotateCcw,
  Award,
  CheckCircle2,
  Bookmark,
  Share2,
  Compass,
  Palette,
  Layers,
  Heart
} from 'lucide-react';

interface Step4ShowcaseProps {
  product: SilkProduct;
  baseColor: SilkColor;
  customBaseHex?: string;
  weaveTexture: WeaveTexture;
  threadColor: ThreadColor;
  motifs: PlacedMotif[];
  onPlayAgain: () => void;
}

export default function Step4Showcase({
  product,
  baseColor,
  customBaseHex,
  weaveTexture,
  threadColor,
  motifs,
  onPlayAgain
}: Step4ShowcaseProps) {
  const [artworkName, setArtworkName] = useState('Bạch Liên Dạ Nguyệt');
  const [artisanName, setArtisanName] = useState('Nghệ nhân Tơ Lụa');
  const [isSavedToPassport, setIsSavedToPassport] = useState(false);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Confetti and passport save on mount
  useEffect(() => {
    // Fire confetti celebration
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#D4A344', '#C85A32', '#F1D58B', '#1D3557', '#FFFFFF']
      });
      silkSound.playChime(3);
    } catch {
      // Ignore
    }

    // Auto unlock silk badge in passport
    try {
      const badge = unlockBadge('badge-silk');
      if (badge) {
        setBadgeUnlocked(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSaveToPassport = () => {
    try {
      saveCreation({
        id: `silk-${Date.now()}`,
        type: 'silk',
        title: artworkName || 'Sắc Lụa Vạn Phúc',
        villageName: 'Làng lụa Vạn Phúc',
        date: new Date().toISOString(),
        previewColor: customBaseHex || baseColor.hex,
        details: {
          productName: product.name,
          weaveTexture,
          threadColor: threadColor.name,
          motifCount: motifs.length,
          artisanName
        }
      });
      setIsSavedToPassport(true);
      silkSound.playChime(1);
    } catch (e) {
      console.error(e);
    }
  };

  /* =========================================================================
     EXPORT HIGH-RESOLUTION PNG IMAGE
     ========================================================================= */
  const handleExportPNG = async () => {
    setIsExporting(true);
    silkSound.playPop();

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2; // High-res
      canvas.width = 800 * scale;
      canvas.height = 950 * scale;
      ctx.scale(scale, scale);

      // Background: Dopaper vintage silk texture
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 950);
      bgGrad.addColorStop(0, '#FCF9F2');
      bgGrad.addColorStop(1, '#F3EBDD');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 950);

      // Antique decorative double border
      ctx.strokeStyle = '#D4A344';
      ctx.lineWidth = 3;
      ctx.strokeRect(25, 25, 750, 900);
      ctx.lineWidth = 1;
      ctx.strokeRect(32, 32, 736, 886);

      // Header: Certificate Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#C85A32';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('DI SẢN NGHỀ DỆT LỤA TRUYỀN THỐNG VIỆT NAM', 400, 75);

      ctx.fillStyle = '#1F1610';
      ctx.font = 'bold 30px "Playfair Display", Georgia, serif';
      ctx.fillText('SẮC LỤA VẠN PHÚC', 400, 115);

      ctx.fillStyle = '#79311A';
      ctx.font = 'italic 15px Georgia, serif';
      ctx.fillText(`“${artworkName || 'Tuyệt tác tơ tằm'}”`, 400, 145);

      // Silk Product Display Area
      const silkX = 150;
      const silkY = 180;
      const silkW = 500;
      const silkH = product.id === 'long-scarf' ? 240 : 420;

      // Drop shadow for silk cloth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
      ctx.shadowBlur = 25;
      ctx.shadowOffsetY = 15;

      // Silk Base Shape
      ctx.fillStyle = customBaseHex || baseColor.hex;
      ctx.fillRect(silkX, silkY, silkW, silkH);

      // Silk hem border
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = '#E5BF5A';
      ctx.lineWidth = 3;
      ctx.strokeRect(silkX + 6, silkY + 6, silkW - 12, silkH - 12);

      // Render Motifs onto canvas
      motifs.forEach((m) => {
        const motifDef = SILK_MOTIFS.find((def) => def.id === m.motifId);
        if (!motifDef) return;

        ctx.save();
        // Transform coords from product canvas to certificate canvas
        const mappedX = silkX + (m.x * silkW) / product.canvasWidth;
        const mappedY = silkY + (m.y * silkH) / product.canvasHeight;

        ctx.translate(mappedX, mappedY);
        ctx.rotate((m.rotation * Math.PI) / 180);
        ctx.scale(m.scale * 0.9, m.scale * 0.9);

        const path2d = new Path2D(motifDef.svgPath);
        ctx.translate(-50, -50);

        // Shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.translate(1.5, 1.5);
        ctx.fill(path2d);
        ctx.translate(-1.5, -1.5);

        // Fill motif
        ctx.fillStyle = m.color || threadColor.hex;
        ctx.fill(path2d);
        ctx.restore();
      });

      // Wooden Hanger Decor on top of silk
      ctx.fillStyle = '#4A2E1B';
      ctx.fillRect(silkX - 20, silkY - 14, silkW + 40, 14);
      ctx.fillStyle = '#D4A344';
      ctx.fillRect(silkX - 22, silkY - 16, 12, 18);
      ctx.fillRect(silkX + silkW + 10, silkY - 16, 12, 18);

      // Red Artisan Seal (Con triện đỏ)
      const sealX = 640;
      const sealY = 820;
      ctx.strokeStyle = '#BA2D2D';
      ctx.lineWidth = 3;
      ctx.strokeRect(sealX - 35, sealY - 35, 70, 70);
      ctx.fillStyle = 'rgba(186, 45, 45, 0.08)';
      ctx.fillRect(sealX - 35, sealY - 35, 70, 70);

      ctx.fillStyle = '#BA2D2D';
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px serif';
      ctx.fillText('VẠN PHÚC', sealX, sealY - 10);
      ctx.fillText('CHI BẢO', sealX, sealY + 8);
      ctx.font = '9px serif';
      ctx.fillText('HÀ ĐÔNG', sealX, sealY + 23);

      // Specs Footer
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1F1610';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`Tác giả: ${artisanName || 'Nghệ nhân Việt'}`, 60, 800);
      ctx.fillText(`Sản phẩm: ${product.name} (${product.realDimensions})`, 60, 825);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#79311A';
      ctx.fillText(
        `Kỹ thuật: Dệt gấm thoi nổi • Màu nền: ${baseColor.name} • Sợi: ${threadColor.name}`,
        60,
        850
      );
      ctx.fillText(
        `Chứng nhận ngày: ${new Date().toLocaleDateString('vi-VN')} • Làng nghề dệt lụa Vạn Phúc`,
        60,
        872
      );

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const cleanTitle = (artworkName || 'Tac-Pham').replace(/\s+/g, '-');
      a.download = `Sac-Lua-Van-Phuc-${cleanTitle}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Celebration Banner */}
      <div className="bg-gradient-to-r from-lacquer-950 via-terracotta-900 to-lacquer-950 text-white rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-2xl border-2 border-gold-500/40 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/20 text-gold-300 text-xs font-bold border border-gold-400/30">
          <Sparkles className="w-4 h-4 text-gold-400" />
          <span>Chúc Mừng! Bạn Đã Hoàn Thành Tuyệt Tác Lụa Vạn Phúc</span>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gold-100 tracking-tight">
          “{artworkName || 'Sắc Lụa Vạn Phúc'}”
        </h1>

        <p className="text-xs sm:text-sm text-dopaper-200/80 max-w-xl mx-auto leading-relaxed">
          Tấm lụa thủ công mang trọn vẹn hồn cốt làng nghề ngàn năm, kết tinh từ sợi tơ nõn vàng óng và những nhịp thoi đưa chan chứa tình cảm của người thợ.
        </p>

        {badgeUnlocked && (
          <div className="inline-flex items-center gap-2 bg-gold-500/30 border border-gold-400/50 px-4 py-1 rounded-full text-xs text-gold-200 font-semibold animate-bounce mt-2">
            <Award className="w-4 h-4 text-gold-400" />
            <span>Đã mở khóa Huy hiệu: Bậc Thầy Canh Cửi Vạn Phúc (+50 điểm di sản)!</span>
          </div>
        )}
      </div>

      {/* Main Showcase Layout: Left/Center Masterpiece Display + Right Details & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT / CENTER: GALLERY DISPLAY (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-gradient-to-b from-dopaper-100 to-dopaper-200/80 rounded-3xl p-6 sm:p-10 border-2 border-dopaper-300 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Traditional Wooden Carved Display Hanger */}
            <div className="w-full max-w-[420px] mb-2 flex items-center justify-center">
              <div className="relative w-full h-5 bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 rounded-md shadow-md flex items-center justify-between px-3 border border-amber-950">
                <div className="w-3 h-3 rounded-full bg-gold-500 border border-amber-950 shadow-inner" />
                <div className="text-[9px] font-serif uppercase tracking-widest text-gold-300 font-bold">
                  VẠN PHÚC KIM BẢO
                </div>
                <div className="w-3 h-3 rounded-full bg-gold-500 border border-amber-950 shadow-inner" />
              </div>
            </div>

            {/* The Finished Silk Product Canvas with Dynamic Light & Drapes */}
            <div className="max-w-[440px] w-full flex items-center justify-center transform hover:scale-[1.02] transition-transform duration-500">
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
            </div>

            {/* Red Artisan Seal Stamp on display */}
            <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 w-16 h-16 sm:w-20 sm:h-20 border-2 border-red-700 bg-red-600/10 rounded-lg p-1 flex flex-col items-center justify-center text-red-700 font-serif shadow-sm rotate-6 pointer-events-none select-none">
              <span className="text-[10px] sm:text-xs font-bold leading-tight">VẠN PHÚC</span>
              <span className="text-[8px] sm:text-[9px] font-bold">CHI BẢO</span>
              <span className="text-[7px] text-red-800">NGHỆ NHÂN</span>
            </div>
          </div>
        </div>

        {/* RIGHT: DETAILS, NAMING & EXPORT (5 COLS) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card 1: Naming & Customizing Identity */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-dopaper-200 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold-600" />
              <span>Đặt Tên Cho Tuyệt Tác Của Bạn</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-lacquer-800 mb-1">
                  Tên tác phẩm:
                </label>
                <input
                  type="text"
                  value={artworkName}
                  onChange={(e) => setArtworkName(e.target.value)}
                  placeholder="Nhập tên thơ mộng cho tác phẩm..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-dopaper-300 text-sm font-serif font-bold text-lacquer-900 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-dopaper-50/50"
                />
              </div>

              {/* Poetic Name Suggestions */}
              <div>
                <span className="text-[11px] text-lacquer-800/60 block mb-1.5 font-medium">
                  Gợi ý tên thi vị:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {POETIC_NAMES.slice(0, 6).map((name) => (
                    <button
                      key={name}
                      onClick={() => {
                        silkSound.playPop();
                        setArtworkName(name);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-dopaper-100 hover:bg-gold-100 text-[11px] font-serif text-lacquer-900 border border-dopaper-200 transition-colors"
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-lacquer-800 mb-1">
                  Tên nghệ nhân tác giả:
                </label>
                <input
                  type="text"
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  placeholder="Tên của bạn..."
                  className="w-full px-3.5 py-2 rounded-xl border border-dopaper-300 text-xs text-lacquer-900 focus:outline-none focus:ring-2 focus:ring-gold-400 bg-dopaper-50/50"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Crafting Specification Breakdown */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-dopaper-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-serif font-bold text-lacquer-900 text-sm border-b border-dopaper-200 pb-2">
              Chứng Nhận Đặc Tính Tác Phẩm
            </h4>

            <div className="grid grid-cols-2 gap-2 text-lacquer-800">
              <div className="p-2.5 rounded-xl bg-dopaper-50 border border-dopaper-200/60 space-y-1">
                <span className="text-[10px] text-lacquer-800/60 font-semibold uppercase">
                  Dáng lụa
                </span>
                <div className="font-bold text-lacquer-900 truncate">{product.name}</div>
                <div className="text-[10px] font-mono text-lacquer-700">{product.realDimensions}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-dopaper-50 border border-dopaper-200/60 space-y-1">
                <span className="text-[10px] text-lacquer-800/60 font-semibold uppercase">
                  Sắc nền lụa
                </span>
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-3.5 h-3.5 rounded-full border border-black/20"
                    style={{ backgroundColor: customBaseHex || baseColor.hex }}
                  />
                  <span className="font-bold text-lacquer-900 truncate">
                    {customBaseHex ? 'Sắc tự phối' : baseColor.name}
                  </span>
                </div>
                <div className="text-[10px] text-lacquer-700">100% tơ tằm thiên nhiên</div>
              </div>

              <div className="p-2.5 rounded-xl bg-dopaper-50 border border-dopaper-200/60 space-y-1">
                <span className="text-[10px] text-lacquer-800/60 font-semibold uppercase">
                  Sợi dệt hoa
                </span>
                <div className="font-bold text-lacquer-900 truncate">{threadColor.name}</div>
                <div className="text-[10px] text-lacquer-700">{threadColor.type}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-dopaper-50 border border-dopaper-200/60 space-y-1">
                <span className="text-[10px] text-lacquer-800/60 font-semibold uppercase">
                  Quy trình dệt
                </span>
                <div className="font-bold text-lacquer-900 truncate">Gấm thoi nổi</div>
                <div className="text-[10px] text-lacquer-700">{motifs.length} hoa văn dệt</div>
              </div>
            </div>
          </div>

          {/* Action Buttons: Export PNG, Save to Passport, Play Again */}
          <div className="space-y-3">
            <button
              onClick={handleExportPNG}
              disabled={isExporting}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-terracotta-700 hover:from-terracotta-500 hover:to-terracotta-600 text-white font-bold text-sm shadow-xl hover:shadow-terracotta-500/30 transition-all flex items-center justify-center gap-2 group active:scale-98"
            >
              <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
              <span>{isExporting ? 'Đang kết xuất ảnh...' : 'Tải Ảnh Tuyệt Tác (PNG Cao Cấp)'}</span>
            </button>

            <button
              onClick={handleSaveToPassport}
              disabled={isSavedToPassport}
              className={`w-full py-3 px-6 rounded-2xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                isSavedToPassport
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'paper-panel hover:bg-gold-50 text-lacquer-900 border-gold-400/80 shadow-sm'
              }`}
            >
              {isSavedToPassport ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã lưu vào Hộ Chiếu Làng Nghề!</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-gold-600" />
                  <span>Lưu Tác Phẩm Vào Hộ Chiếu Làng Nghề</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                silkSound.playPop();
                onPlayAgain();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-dopaper-200/80 hover:bg-dopaper-300 text-lacquer-800 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Chơi lại & Sáng tạo tác phẩm mới</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
