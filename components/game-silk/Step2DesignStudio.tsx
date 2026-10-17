'use client';

import React, { useState, useRef } from 'react';
import {
  SilkProduct,
  SilkColor,
  ThreadColor,
  WeaveTexture,
  PlacedMotif,
  SilkMotif,
  SILK_BASE_COLORS,
  SILK_THREAD_COLORS,
  SILK_MOTIFS
} from './silkConstants';
import SilkCanvasPreview from './SilkCanvasPreview';
import { silkSound } from './SilkSoundEffects';
import {
  Sparkles,
  Palette,
  Layers,
  RotateCw,
  Maximize2,
  Minimize2,
  Copy,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Undo2,
  Redo2,
  Grid,
  Check,
  Compass,
  Sliders,
  Move,
  FlipHorizontal,
  FlipVertical,
  HelpCircle,
  Eye
} from 'lucide-react';

interface Step2DesignStudioProps {
  product: SilkProduct;
  baseColor: SilkColor;
  setBaseColor: (color: SilkColor) => void;
  customBaseHex?: string;
  setCustomBaseHex: (hex: string | undefined) => void;
  weaveTexture: WeaveTexture;
  setWeaveTexture: (texture: WeaveTexture) => void;
  threadColor: ThreadColor;
  setThreadColor: (thread: ThreadColor) => void;
  motifs: PlacedMotif[];
  setMotifs: React.Dispatch<React.SetStateAction<PlacedMotif[]>>;
  onNext: () => void;
  onBack: () => void;
}

export default function Step2DesignStudio({
  product,
  baseColor,
  setBaseColor,
  customBaseHex,
  setCustomBaseHex,
  weaveTexture,
  setWeaveTexture,
  threadColor,
  setThreadColor,
  motifs,
  setMotifs,
  onNext,
  onBack
}: Step2DesignStudioProps) {
  const [selectedMotifId, setSelectedMotifId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'motifs' | 'arrangements'>('motifs');
  const [motifCategory, setMotifCategory] = useState<'all' | 'hoa-la' | 'linh-vat' | 'hinh-hoc'>('all');
  const [customColorPickerOpen, setCustomColorPickerOpen] = useState(false);
  const [history, setHistory] = useState<PlacedMotif[][]>([motifs]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Dragging state for canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const selectedMotif = motifs.find((m) => m.id === selectedMotifId);

  // Push state to undo history
  const pushHistory = (newMotifs: PlacedMotif[]) => {
    const updated = history.slice(0, historyIndex + 1);
    updated.push(newMotifs);
    setHistory(updated);
    setHistoryIndex(updated.length - 1);
    setMotifs(newMotifs);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = historyIndex - 1;
      setHistoryIndex(prev);
      setMotifs(history[prev]);
      silkSound.playPop();
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = historyIndex + 1;
      setHistoryIndex(next);
      setMotifs(history[next]);
      silkSound.playPop();
    }
  };

  // Add motif to canvas center or with small jitter
  const handleAddMotif = (motifDef: SilkMotif) => {
    silkSound.playPop();
    const count = motifs.length;
    const offset = (count % 5) * 15;
    const newMotif: PlacedMotif = {
      id: `motif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      motifId: motifDef.id,
      x: product.canvasWidth / 2 + (count % 2 === 0 ? offset : -offset),
      y: product.canvasHeight / 2 + (count % 3 === 0 ? offset : -offset),
      scale: motifDef.defaultScale,
      rotation: 0,
      color: threadColor.hex,
      flipX: false,
      flipY: false,
      opacity: 0.95
    };

    const nextMotifs = [...motifs, newMotif];
    pushHistory(nextMotifs);
    setSelectedMotifId(newMotif.id);
  };

  // Update selected motif properties
  const updateSelected = (updater: (prev: PlacedMotif) => PlacedMotif) => {
    if (!selectedMotifId) return;
    const nextMotifs = motifs.map((m) => (m.id === selectedMotifId ? updater(m) : m));
    pushHistory(nextMotifs);
  };

  // Motif actions
  const handleDuplicate = () => {
    if (!selectedMotif) return;
    silkSound.playPop();
    const clone: PlacedMotif = {
      ...selectedMotif,
      id: `motif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      x: Math.min(product.canvasWidth - 40, selectedMotif.x + 30),
      y: Math.min(product.canvasHeight - 40, selectedMotif.y + 30)
    };
    const next = [...motifs, clone];
    pushHistory(next);
    setSelectedMotifId(clone.id);
  };

  const handleDelete = () => {
    if (!selectedMotifId) return;
    silkSound.playPop();
    const next = motifs.filter((m) => m.id !== selectedMotifId);
    pushHistory(next);
    setSelectedMotifId(null);
  };

  const handleRotate = (degDelta: number) => {
    if (!selectedMotifId) return;
    silkSound.playPop();
    updateSelected((m) => ({
      ...m,
      rotation: (m.rotation + degDelta + 360) % 360
    }));
  };

  const handleScale = (factor: number) => {
    if (!selectedMotifId) return;
    silkSound.playPop();
    updateSelected((m) => ({
      ...m,
      scale: Math.max(0.4, Math.min(2.5, +(m.scale * factor).toFixed(2)))
    }));
  };

  const handleFlip = (axis: 'x' | 'y') => {
    if (!selectedMotifId) return;
    silkSound.playPop();
    updateSelected((m) => ({
      ...m,
      flipX: axis === 'x' ? !m.flipX : m.flipX,
      flipY: axis === 'y' ? !m.flipY : m.flipY
    }));
  };

  const handleCenter = () => {
    if (!selectedMotifId) return;
    silkSound.playPop();
    updateSelected((m) => ({
      ...m,
      x: product.canvasWidth / 2,
      y: product.canvasHeight / 2
    }));
  };

  // Intelligent Layout Presets
  const handleApplySymmetry4 = () => {
    if (!selectedMotif) return;
    silkSound.playChime(2);

    const w = product.canvasWidth;
    const h = product.canvasHeight;
    const insetX = 85;
    const insetY = 85;

    const corners: PlacedMotif[] = [
      {
        ...selectedMotif,
        id: `sym-tl-${Date.now()}`,
        x: insetX,
        y: insetY,
        rotation: 0,
        flipX: false,
        flipY: false
      },
      {
        ...selectedMotif,
        id: `sym-tr-${Date.now()}`,
        x: w - insetX,
        y: insetY,
        rotation: 90,
        flipX: true,
        flipY: false
      },
      {
        ...selectedMotif,
        id: `sym-br-${Date.now()}`,
        x: w - insetX,
        y: h - insetY,
        rotation: 180,
        flipX: true,
        flipY: true
      },
      {
        ...selectedMotif,
        id: `sym-bl-${Date.now()}`,
        x: insetX,
        y: h - insetY,
        rotation: 270,
        flipX: false,
        flipY: true
      }
    ];

    pushHistory([...motifs.filter((m) => m.id !== selectedMotif.id), ...corners]);
  };

  const handleScatterRepeat = () => {
    if (!selectedMotif) return;
    silkSound.playChime(3);

    const w = product.canvasWidth;
    const h = product.canvasHeight;
    const scattered: PlacedMotif[] = [];
    const countX = product.id === 'long-scarf' ? 5 : 3;
    const countY = product.id === 'long-scarf' ? 2 : 3;

    for (let ix = 0; ix < countX; ix++) {
      for (let iy = 0; iy < countY; iy++) {
        const x = (w * (ix + 1)) / (countX + 1);
        const y = (h * (iy + 1)) / (countY + 1);
        scattered.push({
          ...selectedMotif,
          id: `scat-${ix}-${iy}-${Date.now()}`,
          x,
          y,
          scale: selectedMotif.scale * 0.75,
          rotation: (ix + iy) % 2 === 0 ? 0 : 15
        });
      }
    }

    pushHistory([...motifs.filter((m) => m.id !== selectedMotif.id), ...scattered]);
  };

  const handleBorderRun = () => {
    if (!selectedMotif) return;
    silkSound.playChime(1);
    const w = product.canvasWidth;
    const h = product.canvasHeight;
    const borderList: PlacedMotif[] = [];
    const step = 90;

    // Top border
    for (let x = 60; x <= w - 60; x += step) {
      borderList.push({
        ...selectedMotif,
        id: `b-top-${x}-${Date.now()}`,
        x,
        y: 45,
        scale: selectedMotif.scale * 0.65,
        rotation: 0
      });
    }
    // Bottom border
    for (let x = 60; x <= w - 60; x += step) {
      borderList.push({
        ...selectedMotif,
        id: `b-bot-${x}-${Date.now()}`,
        x,
        y: h - 45,
        scale: selectedMotif.scale * 0.65,
        rotation: 180
      });
    }

    pushHistory([...motifs.filter((m) => m.id !== selectedMotif.id), ...borderList]);
  };

  const handleClearAll = () => {
    if (motifs.length === 0) return;
    if (confirm('Bạn có chắc chắn muốn xóa tất cả hoa văn trên thiết kế không?')) {
      silkSound.playPop();
      pushHistory([]);
      setSelectedMotifId(null);
    }
  };

  // Quick Preset Combinations
  const applyInspirationPreset = (type: 'van-may' | 'sen-vang' | 'hoang-kim') => {
    silkSound.playChime(4);
    const w = product.canvasWidth;
    const h = product.canvasHeight;

    if (type === 'van-may') {
      setBaseColor(SILK_BASE_COLORS[2]); // Xanh chàm
      setThreadColor(SILK_THREAD_COLORS[0]); // Vàng kim tuyến
      setWeaveTexture('brocade');
      const preset: PlacedMotif[] = [
        {
          id: `pre-1`,
          motifId: 'chim-hac',
          x: w / 2 - 50,
          y: h / 2 - 30,
          scale: 1.2,
          rotation: -10,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 1
        },
        {
          id: `pre-2`,
          motifId: 'van-may',
          x: w / 2 + 70,
          y: h / 2 + 40,
          scale: 1.1,
          rotation: 0,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 0.95
        },
        {
          id: `pre-3`,
          motifId: 'van-may',
          x: w / 2 - 120,
          y: h / 2 + 60,
          scale: 0.8,
          rotation: 5,
          color: '#FFFFFF',
          flipX: true,
          flipY: false,
          opacity: 0.85
        }
      ];
      pushHistory(preset);
    } else if (type === 'sen-vang') {
      setBaseColor(SILK_BASE_COLORS[4]); // Hồng phấn sen
      setThreadColor(SILK_THREAD_COLORS[0]); // Vàng kim
      setWeaveTexture('damask');
      const preset: PlacedMotif[] = [
        {
          id: `pre-s1`,
          motifId: 'hoa-sen',
          x: w / 2,
          y: h / 2 - 20,
          scale: 1.4,
          rotation: 0,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 1
        },
        {
          id: `pre-s2`,
          motifId: 'la-sen',
          x: w / 2 - 80,
          y: h / 2 + 60,
          scale: 0.9,
          rotation: -15,
          color: '#FFFFFF',
          flipX: false,
          flipY: false,
          opacity: 0.85
        },
        {
          id: `pre-s3`,
          motifId: 'la-sen',
          x: w / 2 + 80,
          y: h / 2 + 60,
          scale: 0.9,
          rotation: 15,
          color: '#FFFFFF',
          flipX: true,
          flipY: false,
          opacity: 0.85
        }
      ];
      pushHistory(preset);
    } else {
      setBaseColor(SILK_BASE_COLORS[1]); // Đỏ trầm
      setThreadColor(SILK_THREAD_COLORS[0]); // Kim tuyến
      setWeaveTexture('brocade');
      const preset: PlacedMotif[] = [
        {
          id: `pre-h1`,
          motifId: 'chu-phuc',
          x: w / 2,
          y: h / 2,
          scale: 1.3,
          rotation: 0,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 1
        },
        {
          id: `pre-h2`,
          motifId: 'qua-tram',
          x: 75,
          y: 75,
          scale: 0.8,
          rotation: 0,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 0.9
        },
        {
          id: `pre-h3`,
          motifId: 'qua-tram',
          x: w - 75,
          y: 75,
          scale: 0.8,
          rotation: 0,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 0.9
        },
        {
          id: `pre-h4`,
          motifId: 'qua-tram',
          x: 75,
          y: h - 75,
          scale: 0.8,
          rotation: 0,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 0.9
        },
        {
          id: `pre-h5`,
          motifId: 'qua-tram',
          x: w - 75,
          y: h - 75,
          scale: 0.8,
          rotation: 0,
          color: '#E5BF5A',
          flipX: false,
          flipY: false,
          opacity: 0.9
        }
      ];
      pushHistory(preset);
    }
  };

  // Mouse / Touch Drag handling on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedMotifId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = product.canvasWidth / rect.width;
    const scaleY = product.canvasHeight / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    if (selectedMotif) {
      const dist = Math.hypot(clickX - selectedMotif.x, clickY - selectedMotif.y);
      if (dist < 60 * selectedMotif.scale) {
        setIsDragging(true);
        setDragOffset({
          x: clickX - selectedMotif.x,
          y: clickY - selectedMotif.y
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedMotifId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = product.canvasWidth / rect.width;
    const scaleY = product.canvasHeight / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const newX = Math.round(Math.max(20, Math.min(product.canvasWidth - 20, currentX - dragOffset.x)));
    const newY = Math.round(Math.max(20, Math.min(product.canvasHeight - 20, currentY - dragOffset.y)));

    setMotifs((prev) =>
      prev.map((m) => (m.id === selectedMotifId ? { ...m, x: newX, y: newY } : m))
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      pushHistory(motifs);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
    }
  };

  const filteredMotifs =
    motifCategory === 'all'
      ? SILK_MOTIFS
      : SILK_MOTIFS.filter((m) => m.category === motifCategory);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Step Guide Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-2xl border border-dopaper-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-700 flex items-center justify-center font-bold text-sm">
            2/4
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-lacquer-900">
              Xưởng Thiết Kế Hoa Văn Lụa Vạn Phúc
            </h3>
            <p className="text-xs text-lacquer-800/70">
              Nhấp chọn hoa văn truyền thống, phối sắc tơ và kéo thả sắp đặt theo ý bạn.
            </p>
          </div>
        </div>

        {/* Undo / Redo / Clear Tools */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            title="Hoàn tác (Undo)"
            className="p-2 rounded-lg bg-dopaper-100 hover:bg-dopaper-200 text-lacquer-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            title="Làm lại (Redo)"
            className="p-2 rounded-lg bg-dopaper-100 hover:bg-dopaper-200 text-lacquer-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <div className="h-5 w-px bg-dopaper-300" />
          <button
            onClick={handleClearAll}
            title="Xóa tất cả hoa văn"
            className="text-xs text-red-700 hover:text-red-800 hover:bg-red-50 px-2.5 py-1.5 rounded-lg border border-red-200 transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Main Studio Workspace: Left/Center Canvas + Right Tool Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* CENTER / LEFT: CANVAS PREVIEW & ACTIVE CONTROLS (7 COLS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-gradient-to-b from-dopaper-100/90 to-dopaper-200/50 p-6 sm:p-8 rounded-3xl border-2 border-dopaper-300/80 shadow-inner flex flex-col items-center justify-center min-h-[460px] relative overflow-hidden">
            {/* Background Loom Grid Decor */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(#C85A32 1px, transparent 1px), radial-gradient(#1D3557 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                backgroundPosition: '0 0, 12px 12px'
              }}
            />

            {/* Canvas Interactive Container */}
            <div
              ref={canvasRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="max-w-[460px] w-full flex items-center justify-center relative touch-none"
            >
              <SilkCanvasPreview
                product={product}
                baseColor={baseColor}
                customBaseHex={customBaseHex}
                weaveTexture={weaveTexture}
                threadColor={threadColor}
                motifs={motifs}
                selectedMotifId={selectedMotifId}
                onSelectMotif={setSelectedMotifId}
                interactive={true}
                showDrapeShadows={false}
              />
            </div>

            {/* Canvas Quick Tip */}
            <div className="mt-4 text-center">
              <span className="text-[11px] text-lacquer-800/60 bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full border border-dopaper-200 shadow-sm">
                💡 Nhấp vào hoa văn để di chuyển, xoay hoặc nhân bản • Nhấp ra ngoài để bỏ chọn
              </span>
            </div>
          </div>

          {/* FLOATING ACTION BAR FOR SELECTED MOTIF */}
          {selectedMotif && (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-gold-400/40 shadow-lg space-y-2 animate-slideUp">
              <div className="flex items-center justify-between text-xs font-semibold text-lacquer-900 border-b border-dopaper-200 pb-2">
                <span className="flex items-center gap-1.5 text-terracotta-700">
                  <Sliders className="w-3.5 h-3.5" />
                  Đang chỉnh: {SILK_MOTIFS.find((m) => m.id === selectedMotif.motifId)?.name}
                </span>
                <span className="text-lacquer-800/50 text-[11px]">
                  Tọa độ ({Math.round(selectedMotif.x)}, {Math.round(selectedMotif.y)})
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => handleScale(1.15)}
                  className="px-2.5 py-1.5 rounded-lg bg-dopaper-100 hover:bg-gold-100 text-lacquer-800 text-xs font-medium flex items-center gap-1 border border-dopaper-200"
                  title="Phóng to"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-gold-700" />
                  <span>Phóng to</span>
                </button>
                <button
                  onClick={() => handleScale(0.85)}
                  className="px-2.5 py-1.5 rounded-lg bg-dopaper-100 hover:bg-gold-100 text-lacquer-800 text-xs font-medium flex items-center gap-1 border border-dopaper-200"
                  title="Thu nhỏ"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-gold-700" />
                  <span>Thu nhỏ</span>
                </button>
                <button
                  onClick={() => handleRotate(45)}
                  className="px-2.5 py-1.5 rounded-lg bg-dopaper-100 hover:bg-gold-100 text-lacquer-800 text-xs font-medium flex items-center gap-1 border border-dopaper-200"
                  title="Xoay 45°"
                >
                  <RotateCw className="w-3.5 h-3.5 text-gold-700" />
                  <span>Xoay 45°</span>
                </button>
                <button
                  onClick={() => handleFlip('x')}
                  className="px-2 py-1.5 rounded-lg bg-dopaper-100 hover:bg-gold-100 text-lacquer-800 text-xs font-medium flex items-center gap-1 border border-dopaper-200"
                  title="Lật ngang"
                >
                  <FlipHorizontal className="w-3.5 h-3.5" />
                  <span>Lật X</span>
                </button>
                <button
                  onClick={handleCenter}
                  className="px-2 py-1.5 rounded-lg bg-dopaper-100 hover:bg-gold-100 text-lacquer-800 text-xs font-medium flex items-center gap-1 border border-dopaper-200"
                  title="Căn giữa"
                >
                  <Move className="w-3.5 h-3.5" />
                  <span>Tâm</span>
                </button>
                <button
                  onClick={handleDuplicate}
                  className="px-2.5 py-1.5 rounded-lg bg-dopaper-100 hover:bg-gold-100 text-lacquer-800 text-xs font-medium flex items-center gap-1 border border-dopaper-200"
                  title="Nhân bản"
                >
                  <Copy className="w-3.5 h-3.5 text-gold-700" />
                  <span>Nhân bản</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-medium flex items-center gap-1 border border-red-200 ml-auto"
                  title="Xóa hoa văn"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>

              {/* Advanced Symmetry Shortcuts */}
              <div className="pt-2 border-t border-dopaper-200 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-[11px] text-lacquer-800/60 font-medium">Bố cục nhanh:</span>
                <button
                  onClick={handleApplySymmetry4}
                  className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-300"
                >
                  ❖ Đối xứng 4 góc
                </button>
                <button
                  onClick={handleScatterRepeat}
                  className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-300"
                >
                  ∷ Rải hoa văn đều
                </button>
                <button
                  onClick={handleBorderRun}
                  className="px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold border border-amber-300"
                >
                  ═ Viền chạy quanh
                </button>
              </div>
            </div>
          )}

          {/* Quick Preset Ideas */}
          <div className="bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-dopaper-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-semibold text-lacquer-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              Mẫu phối sắc cảm hứng Vạn Phúc:
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => applyInspirationPreset('van-may')}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 font-medium border border-blue-200 transition-colors"
              >
                Chàm Song Hạc
              </button>
              <button
                onClick={() => applyInspirationPreset('sen-vang')}
                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 font-medium border border-rose-200 transition-colors"
              >
                Bạch Liên Hương
              </button>
              <button
                onClick={() => applyInspirationPreset('hoang-kim')}
                className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-900 font-medium border border-red-200 transition-colors"
              >
                Gấm Đỏ Cát Tường
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: TOOL CONTROLS (5 COLS) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Studio Tab Navigation */}
          <div className="flex rounded-2xl bg-dopaper-200/70 p-1.5 border border-dopaper-300/60">
            <button
              onClick={() => {
                silkSound.playPop();
                setActiveTab('motifs');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'motifs'
                  ? 'paper-panel text-lacquer-950 shadow-md'
                  : 'text-lacquer-800/70 hover:text-lacquer-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-terracotta-600" />
              <span>Thư viện hoa văn</span>
            </button>
            <button
              onClick={() => {
                silkSound.playPop();
                setActiveTab('colors');
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'colors'
                  ? 'paper-panel text-lacquer-950 shadow-md'
                  : 'text-lacquer-800/70 hover:text-lacquer-900'
              }`}
            >
              <Palette className="w-3.5 h-3.5 text-gold-600" />
              <span>Màu lụa & Sợi dệt</span>
            </button>
          </div>

          {/* TAB 1: MOTIFS LIBRARY */}
          {activeTab === 'motifs' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-dopaper-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-bold text-lacquer-900">
                  Họa Tiết Di Sản Vạn Phúc
                </h4>
                <span className="text-[11px] font-mono text-lacquer-800/60">
                  {motifs.length} họa tiết trên lụa
                </span>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 text-xs overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'Tất cả' },
                  { id: 'hoa-la', label: 'Hoa sen & Cúc' },
                  { id: 'linh-vat', label: 'Mây & Hạc' },
                  { id: 'hinh-hoc', label: 'Gấm & Triện' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      silkSound.playPop();
                      setMotifCategory(cat.id as any);
                    }}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors ${
                      motifCategory === cat.id
                        ? 'bg-lacquer-900 text-white'
                        : 'bg-dopaper-100 hover:bg-dopaper-200 text-lacquer-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Motif Grid */}
              <div className="grid grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
                {filteredMotifs.map((motifDef) => (
                  <button
                    key={motifDef.id}
                    onClick={() => handleAddMotif(motifDef)}
                    className="p-3 rounded-xl border border-dopaper-200/80 bg-dopaper-50/50 hover:bg-gold-50/50 hover:border-gold-400/80 transition-all text-left flex flex-col items-center justify-center gap-2 group hover:shadow-md"
                  >
                    {/* SVG Icon */}
                    <div className="w-12 h-12 flex items-center justify-center text-lacquer-900 group-hover:text-gold-700 transition-colors">
                      <svg viewBox={motifDef.viewBox} className="w-10 h-10 stroke-current fill-current">
                        <path
                          d={motifDef.svgPath}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <div className="text-center w-full">
                      <div className="font-serif text-xs font-bold text-lacquer-900 truncate">
                        {motifDef.name}
                      </div>
                      <div className="text-[10px] text-lacquer-800/60 truncate mt-0.5">
                        {motifDef.symbolism.split('-')[0]}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: SILK COLORS & THREADS */}
          {activeTab === 'colors' && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 border border-dopaper-200 shadow-sm space-y-5">
              {/* Silk Base Color Presets */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-xs font-bold text-lacquer-900 uppercase tracking-wider">
                    Màu Nền Lụa Tơ Tằm
                  </h4>
                  <span className="text-[11px] text-gold-700 font-semibold">
                    {baseColor.name}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {SILK_BASE_COLORS.map((col) => {
                    const isSelected = baseColor.id === col.id && !customBaseHex;
                    return (
                      <button
                        key={col.id}
                        onClick={() => {
                          silkSound.playPop();
                          setBaseColor(col);
                          setCustomBaseHex(undefined);
                        }}
                        style={{ backgroundColor: col.hex }}
                        title={`${col.name} (${col.origin})`}
                        className={`w-full aspect-square rounded-xl shadow-inner relative transition-transform hover:scale-105 border-2 ${
                          isSelected ? 'border-lacquer-950 scale-105 ring-2 ring-gold-400' : 'border-white/50'
                        }`}
                      >
                        {isSelected && (
                          <Check
                            className="w-4 h-4 absolute inset-0 m-auto"
                            style={{ color: col.textColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom Base Color Picker Toggle */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <label className="text-[11px] text-lacquer-800/70 font-medium">
                    Tùy chỉnh mã màu riêng:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customBaseHex || baseColor.hex}
                      onChange={(e) => {
                        setCustomBaseHex(e.target.value);
                      }}
                      className="w-8 h-8 rounded-lg cursor-pointer border border-dopaper-300"
                    />
                    <span className="font-mono text-[11px] text-lacquer-800">
                      {customBaseHex || baseColor.hex}
                    </span>
                  </div>
                </div>
              </div>

              {/* Silk Weave Texture Selection */}
              <div className="space-y-2 pt-2 border-t border-dopaper-200">
                <h4 className="font-serif text-xs font-bold text-lacquer-900 uppercase tracking-wider">
                  Hiệu Ứng Dệt Mặt Vải
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'brocade', label: 'Gấm Thoi Nổi', desc: 'Ánh chỉ kim tuyến' },
                    { id: 'damask', label: 'Lụa Sa Vân', desc: 'Vân mây chìm nổi' },
                    { id: 'satin', label: 'Tơ Tằm Trơn', desc: 'Óng ả nguyên bản' }
                  ].map((tex) => (
                    <button
                      key={tex.id}
                      onClick={() => {
                        silkSound.playPop();
                        setWeaveTexture(tex.id as WeaveTexture);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        weaveTexture === tex.id
                          ? 'border-gold-500 bg-gold-50/70 text-lacquer-950 shadow-sm font-bold'
                          : 'border-dopaper-200 bg-dopaper-50/60 hover:bg-white text-lacquer-800'
                      }`}
                    >
                      <div className="text-xs">{tex.label}</div>
                      <div className="text-[10px] text-lacquer-800/60 font-normal">{tex.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Thread / Embroidery Color Selection */}
              <div className="space-y-2 pt-2 border-t border-dopaper-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif text-xs font-bold text-lacquer-900 uppercase tracking-wider">
                    Màu Sợi Chỉ Dệt Hoa Văn
                  </h4>
                  <span className="text-[11px] text-terracotta-700 font-semibold">
                    {threadColor.name}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {SILK_THREAD_COLORS.map((th) => {
                    const isSelected = threadColor.id === th.id;
                    return (
                      <button
                        key={th.id}
                        onClick={() => {
                          silkSound.playPop();
                          setThreadColor(th);
                          // Also update selected motif color if active
                          if (selectedMotifId) {
                            updateSelected((m) => ({ ...m, color: th.hex }));
                          }
                        }}
                        className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          isSelected
                            ? 'border-gold-500 bg-gold-50 shadow-sm ring-1 ring-gold-400'
                            : 'border-dopaper-200 hover:border-gold-300'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full shadow-sm border border-black/10"
                          style={{ backgroundColor: th.hex }}
                        />
                        <span className="text-[10px] font-medium text-lacquer-900 truncate max-w-full">
                          {th.name.replace('Chỉ ', '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              onClick={() => {
                silkSound.playPop();
                onBack();
              }}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-dopaper-200 hover:bg-dopaper-300 text-lacquer-900 font-semibold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Chọn lại dáng</span>
            </button>

            <button
              onClick={() => {
                silkSound.playChime(0);
                onNext();
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-terracotta-700 hover:from-terracotta-500 hover:to-terracotta-600 text-white font-bold text-sm shadow-xl hover:shadow-terracotta-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Bước 3: Đưa Vào Khung Cửi Dệt</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
