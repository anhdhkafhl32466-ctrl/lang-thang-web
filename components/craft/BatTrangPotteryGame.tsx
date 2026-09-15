'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Flame, Volume2, VolumeX, RotateCcw, Download, Plus, Check, ArrowRight, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Preset {
  label: string;
  r: { base: number; lower: number; bulge: number; upper: number; neck: number; mouth: number };
  height: number;
}

const PRESETS: Record<string, Preset> = {
  binh: { label: 'Bình', r: { base: 36, lower: 58, bulge: 98, upper: 74, neck: 48, mouth: 56 }, height: 118 },
  coc:  { label: 'Cốc',  r: { base: 44, lower: 52, bulge: 58, upper: 58, neck: 58, mouth: 62 }, height: 62 },
  bat:  { label: 'Bát',  r: { base: 32, lower: 54, bulge: 82, upper: 96, neck: 100, mouth: 104 }, height: 50 },
  lo:   { label: 'Lọ',   r: { base: 40, lower: 68, bulge: 112, upper: 66, neck: 38, mouth: 44 }, height: 104 },
  dia:  { label: 'Đĩa',  r: { base: 58, lower: 88, bulge: 100, upper: 106, neck: 108, mouth: 110 }, height: 26 },
  tuong:{ label: 'Tượng/Trang trí', r: { base: 48, lower: 62, bulge: 66, upper: 52, neck: 34, mouth: 20 }, height: 132 }
};

const RADIUS_KEYS = ['base', 'lower', 'bulge', 'upper', 'neck', 'mouth'] as const;
const HEIGHT_FRACS = [0, 0.18, 0.42, 0.66, 0.86, 1.0];

const MOTIFS = [
  { key: 'sen',  icon: '🌸', label: 'Hoa sen' },
  { key: 'la',   icon: '🍃', label: 'Lá trúc' },
  { key: 'may',  icon: '☁️', label: 'Mây cổ' },
  { key: 'chim', icon: '🐦', label: 'Chim hạc' },
  { key: 'ca',   icon: '🐟', label: 'Cá chép' },
  { key: 'hh',   icon: '◆',  label: 'Hình học' },
  { key: 'song', icon: '〰️', label: 'Sóng nước' },
  { key: 'xoay', icon: '✦',  label: 'Gấm hoa' }
];

const GLAZES = [
  { key: 'trang', label: 'Men trắng', hex: '#F4EFE4' },
  { key: 'xanh',  label: 'Men xanh',  hex: '#5D7C68' },
  { key: 'nau',   label: 'Men nâu',   hex: '#7A4B2A' },
  { key: 'vang',  label: 'Men vàng',  hex: '#C79A46' },
  { key: 'ngoc',  label: 'Men ngọc', hex: '#3E8E7E' },
  { key: 'lam',   label: 'Men lam',   hex: '#33455E' },
  { key: 'do',    label: 'Men đỏ đất', hex: '#9A4B36' },
  { key: 'den',   label: 'Men đen',   hex: '#2B2620' }
];

const TIPS: Record<number, string> = {
  1: '💡 Bạn có biết? Đất sét trắng Bát Tràng từ thời xa xưa được người thợ nhào thấu kỹ lưỡng để loại bỏ tạp chất và tạo độ dẻo mịn hoàn hảo trước khi lên bàn xoay.',
  2: '💡 Bạn có biết? "Chuốt" là công đoạn tạo dáng sản phẩm ngay trên bàn xoay đang quay — người thợ dùng lực đôi bàn tay kéo đất phình hoặc thon theo ý muốn.',
  3: '💡 Bạn có biết? Hoa văn men lam, hoa sen, mây nước trên gốm Bát Tràng không chỉ mang vẻ đẹp nghệ thuật mà còn biểu trưng cho tài lộc, thanh cao và bình an.',
  4: '💡 Bạn có biết? Làng Bát Tràng nổi tiếng với các dòng men cổ độc bản như men tro, men rạn, men lam. Lớp men sau nung sẽ đanh bóng và không thấm nước.',
  5: '💡 Bạn có biết? Gốm Bát Tràng được nung đạt mức nhiệt từ 1.200°C đến 1.300°C. Ngọn lửa làm đất sét chuyển hóa thành gốm sứ cứng chắc như chuông.'
};

const STEP_LABELS = ['THẤU ĐẤT', 'CHUỐT GỐM', 'TRANG TRÍ', 'TRÁNG MEN', 'NUNG'];

const POT_W = 380;
const POT_H = 460;

export default function BatTrangPotteryGame() {
  // Game Navigation State
  const [currentStep, setCurrentStep] = useState<number>(0); // 0: Intro, 1-5: Steps, 6: Result
  const [unlockedStep, setUnlockedStep] = useState<number>(1);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Step 1: Kneading
  const [kneadProgress, setKneadProgress] = useState<number>(0);

  // Step 2: Shaping
  const [shape, setShape] = useState({
    r: { base: 40, lower: 66, bulge: 88, upper: 70, neck: 52, mouth: 58 },
    height: 100,
    hOff: [0, 0, 0, 0, 0, 0]
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [shapeTouched, setShapeTouched] = useState<boolean>(false);

  // Step 3: Decoration
  const [patternTool, setPatternTool] = useState<'stamp' | 'draw'>('stamp');
  const [selectedMotif, setSelectedMotif] = useState(MOTIFS[0]);
  const [brushSize, setBrushSize] = useState<number>(8);
  const [drawColor, setDrawColor] = useState<string>('#33455E');
  const [patternStrokes, setPatternStrokes] = useState<any[]>([]);

  // Step 4: Glazing
  const [glazeColorKey, setGlazeColorKey] = useState<string | null>('lam');
  const [glazeIntensity, setGlazeIntensity] = useState<number>(0.55);
  const [glazeStrokes, setGlazeStrokes] = useState<{ x: number; y: number; r: number }[]>([]);
  const [glazeFullCover, setGlazeFullCover] = useState<boolean>(false);
  const [glazePct, setGlazePct] = useState<number>(0);

  // Step 5: Kiln Firing
  const [isFiringActive, setIsFiringActive] = useState<boolean>(false);
  const [doorClosed, setDoorClosed] = useState<boolean>(false);
  const [glowOn, setGlowOn] = useState<boolean>(false);
  const [kilnTemp, setKilnTemp] = useState<number>(20);
  const [kilnStatus, setKilnStatus] = useState<string>('Sẵn sàng đưa sản phẩm vào lò');
  const [fired, setFired] = useState<boolean>(false);
  const [tempGameActive, setTempGameActive] = useState<boolean>(false);
  const [tempRound, setTempRound] = useState<number>(0);
  const [tempGameInfo, setTempGameInfo] = useState<string>('');

  // Result
  const [productName, setProductName] = useState<string>('Bình Sen Lam Bát Tràng');

  // Canvas Refs
  const kneadCanvasRef = useRef<HTMLCanvasElement>(null);
  const potCanvasRef = useRef<HTMLCanvasElement>(null);
  const kilnItemCanvasRef = useRef<HTMLCanvasElement>(null);
  const tempBarCanvasRef = useRef<HTMLCanvasElement>(null);
  const resultCanvasRef = useRef<HTMLCanvasElement>(null);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);
  const humOscRef = useRef<OscillatorNode | null>(null);
  const humGainRef = useRef<GainNode | null>(null);

  // Wheel animation
  const wheelAngleRef = useRef<number>(0);
  const wheelAnimIdRef = useRef<number | null>(null);

  // Dragging refs
  const dragIndexRef = useRef<number>(-1);
  const handleDragStartRef = useRef<{ x: number; y: number; r: number; off: number } | null>(null);
  const heightDragStartRef = useRef<{ y: number; h: number } | null>(null);
  const isKneadHoldingRef = useRef<boolean>(false);
  const kneadLastPosRef = useRef<{ x: number; y: number } | null>(null);
  const drawingStrokeRef = useRef<any>(null);
  const isGlazingPaintingRef = useRef<boolean>(false);
  const tempGameRef = useRef<{
    active: boolean;
    round: number;
    barW: number;
    barX: number;
    barY: number;
    barH: number;
    markerX: number;
    dir: number;
    zoneStart: number;
    zoneW: number;
    speed: number;
    flash: number;
    flashColor: string;
    busy: boolean;
  }>({
    active: false,
    round: 0,
    barW: 260,
    barX: 10,
    barY: 26,
    barH: 16,
    markerX: 10,
    dir: 1,
    zoneStart: 60,
    zoneW: 80,
    speed: 2,
    flash: 0,
    flashColor: 'ok',
    busy: false
  });
  const tempAnimIdRef = useRef<number | null>(null);

  // Sound generator
  const playSound = useCallback((type: 'thud' | 'tick' | 'swish' | 'crackle' | 'chime' | 'humStart' | 'humStop') => {
    if (!soundOn) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      if (type === 'thud') {
        const dur = 0.15;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = 'lowpass';
        filt.frequency.value = 350;
        const g = ctx.createGain();
        g.gain.value = 0.15;
        src.connect(filt);
        filt.connect(g);
        g.connect(ctx.destination);
        src.start();
      } else if (type === 'tick') {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 650;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.04, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.09);
      } else if (type === 'swish') {
        const dur = 0.1;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.value = 1800;
        const g = ctx.createGain();
        g.gain.value = 0.04;
        src.connect(filt);
        filt.connect(g);
        g.connect(ctx.destination);
        src.start();
      } else if (type === 'crackle') {
        const dur = 0.1;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const filt = ctx.createBiquadFilter();
        filt.type = 'highpass';
        filt.frequency.value = 2500;
        const g = ctx.createGain();
        g.gain.value = 0.05;
        src.connect(filt);
        filt.connect(g);
        g.connect(ctx.destination);
        src.start();
      } else if (type === 'chime') {
        [523, 659, 784].forEach((freq, idx) => {
          setTimeout(() => {
            if (!audioCtxRef.current) return;
            const o = ctx.createOscillator();
            o.type = 'sine';
            o.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.06, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            o.connect(g);
            g.connect(ctx.destination);
            o.start();
            o.stop(ctx.currentTime + 0.42);
          }, idx * 110);
        });
      } else if (type === 'humStart') {
        if (humOscRef.current) return;
        humOscRef.current = ctx.createOscillator();
        humOscRef.current.type = 'sine';
        humOscRef.current.frequency.value = 75;
        humGainRef.current = ctx.createGain();
        humGainRef.current.gain.setValueAtTime(0.02, ctx.currentTime);
        humOscRef.current.connect(humGainRef.current);
        humGainRef.current.connect(ctx.destination);
        humOscRef.current.start();
      } else if (type === 'humStop') {
        if (humOscRef.current && humGainRef.current) {
          try {
            humGainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
            setTimeout(() => {
              humOscRef.current?.stop();
              humOscRef.current = null;
              humGainRef.current = null;
            }, 250);
          } catch (e) {
            humOscRef.current = null;
            humGainRef.current = null;
          }
        }
      }
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }, [soundOn]);

  // Geometry computation
  const computeGeom = useCallback(() => {
    const cx = POT_W / 2;
    const baseY = POT_H - 70;
    const potHeightPx = 210 * (shape.height / 100);
    const MIN_GAP = 16;
    const hOff = shape.hOff || [0, 0, 0, 0, 0, 0];
    const ys: number[] = [];

    for (let i = 0; i < HEIGHT_FRACS.length; i++) {
      let y = baseY - HEIGHT_FRACS[i] * potHeightPx - hOff[i];
      if (i === 0) y = Math.min(y, baseY + 6);
      if (i > 0) y = Math.min(y, ys[i - 1] - MIN_GAP);
      ys.push(y);
    }
    const topY = ys[ys.length - 1];
    const rightPts = RADIUS_KEYS.map((key, i) => ({
      x: cx + shape.r[key],
      y: ys[i]
    }));
    const leftPts = rightPts.map(p => ({ x: 2 * cx - p.x, y: p.y }));
    return { cx, baseY, topY, rightPts, leftPts, potHeightPx };
  }, [shape]);

  // Build silhouette path
  const buildSilhouettePath = useCallback((geom: ReturnType<typeof computeGeom>) => {
    const path = new Path2D();
    const rp = geom.rightPts;
    const lp = [...geom.leftPts].reverse();

    path.moveTo(rp[0].x, rp[0].y);
    const pushSmooth = (arr: typeof rp) => {
      for (let i = 0; i < arr.length - 1; i++) {
        const p0 = arr[i - 1] || arr[i];
        const p1 = arr[i];
        const p2 = arr[i + 1];
        const p3 = arr[i + 2] || p2;
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        path.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
      }
    };
    pushSmooth(rp);
    path.lineTo(lp[0].x, lp[0].y);
    pushSmooth(lp);
    path.closePath();
    return path;
  }, []);

  const pointInsideShape = useCallback((x: number, y: number, geom: ReturnType<typeof computeGeom>) => {
    if (y > geom.baseY || y < geom.topY) return false;
    const pts = geom.rightPts;
    let r = pts[pts.length - 1].x - geom.cx;
    if (y >= pts[0].y) {
      r = pts[0].x - geom.cx;
    } else {
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i];
        const b = pts[i + 1];
        if (y <= a.y && y >= b.y) {
          const t = (a.y - y) / Math.max(1, a.y - b.y);
          r = (a.x - geom.cx) + ((b.x - geom.cx) - (a.x - geom.cx)) * t;
          break;
        }
      }
    }
    return Math.abs(x - geom.cx) <= r;
  }, []);

  // Smooth Catmull-Rom path helper for freehand drawing
  const smoothPath = (ctx: CanvasRenderingContext2D, pts: { x: number; y: number }[]) => {
    if (pts.length < 2) return;
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    }
  };

  // Main pottery rendering on canvas
  const renderPottery = useCallback((
    ctx: CanvasRenderingContext2D,
    opts: { showWheel?: boolean; wheelAngle?: number; showHandles?: boolean; dragIndex?: number; firedState?: boolean }
  ) => {
    ctx.clearRect(0, 0, POT_W, POT_H);
    const geom = computeGeom();
    const path = buildSilhouettePath(geom);

    // Shadow underneath base
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(geom.cx, geom.baseY + 10, geom.rightPts[0].x - geom.cx + 14, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(43,38,32,.12)';
    ctx.fill();
    ctx.restore();

    // Spinning wheel at step 2
    if (opts.showWheel) {
      ctx.save();
      ctx.translate(geom.cx, geom.baseY + 6);
      ctx.rotate(opts.wheelAngle || 0);
      ctx.beginPath();
      ctx.ellipse(0, 0, geom.rightPts[0].x - geom.cx + 34, 13, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(93,124,104,.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 7]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }

    // Clay Body Gradient
    const bodyGrad = ctx.createLinearGradient(geom.cx - 120, 0, geom.cx + 120, 0);
    if (opts.firedState) {
      bodyGrad.addColorStop(0, '#C98A5C');
      bodyGrad.addColorStop(0.5, '#B4744A');
      bodyGrad.addColorStop(1, '#8A5834');
    } else {
      bodyGrad.addColorStop(0, '#E4D6B8');
      bodyGrad.addColorStop(0.5, '#D2BE96');
      bodyGrad.addColorStop(1, '#AD9770');
    }
    ctx.fillStyle = bodyGrad;
    ctx.fill(path);

    // Decorated motifs (Clipped to pottery shape)
    ctx.save();
    ctx.clip(path);

    for (const s of patternStrokes) {
      if (s.type === 'stamp') {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.font = `${s.size}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.icon, 0, 0);
        ctx.restore();
      } else if (s.type === 'draw' && s.points.length > 1) {
        ctx.beginPath();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.size;
        smoothPath(ctx, s.points);
        ctx.stroke();
      }
    }

    // Glaze coating layer
    if (glazeColorKey && (glazeFullCover || glazeStrokes.length > 0)) {
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = POT_W;
      maskCanvas.height = POT_H;
      const mctx = maskCanvas.getContext('2d');
      if (mctx) {
        mctx.fillStyle = '#fff';
        if (glazeFullCover) {
          mctx.fillRect(0, 0, POT_W, POT_H);
        } else {
          for (const g of glazeStrokes) {
            mctx.beginPath();
            mctx.arc(g.x, g.y, g.r, 0, Math.PI * 2);
            mctx.fill();
          }
        }
      }

      const glazeHex = GLAZES.find(g => g.key === glazeColorKey)?.hex || '#33455E';
      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = POT_W;
      colorCanvas.height = POT_H;
      const cctx = colorCanvas.getContext('2d');
      if (cctx) {
        cctx.fillStyle = glazeHex;
        cctx.fillRect(0, 0, POT_W, POT_H);
        cctx.globalCompositeOperation = 'destination-in';
        cctx.drawImage(maskCanvas, 0, 0);
      }

      ctx.save();
      ctx.globalAlpha = glazeIntensity;
      ctx.drawImage(colorCanvas, 0, 0);
      ctx.restore();
    }

    // Glossy sheen when fired
    if (opts.firedState) {
      const sheen = ctx.createLinearGradient(geom.cx - 100, geom.topY, geom.cx + 40, geom.baseY);
      sheen.addColorStop(0, 'rgba(255,255,255,.45)');
      sheen.addColorStop(0.25, 'rgba(255,255,255,.08)');
      sheen.addColorStop(1, 'rgba(0,0,0,.08)');
      ctx.fillStyle = sheen;
      ctx.fill(path);
    }
    ctx.restore(); // end clip

    // Delicate outer contour
    ctx.save();
    ctx.strokeStyle = 'rgba(43,38,32,.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke(path);
    ctx.restore();

    // Mouth hollow ellipse
    const mouthR = geom.rightPts[5].x - geom.cx;
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(geom.cx, geom.topY, mouthR, mouthR * 0.28, 0, 0, Math.PI * 2);
    const mouthGrad = ctx.createRadialGradient(geom.cx, geom.topY, 2, geom.cx, geom.topY, mouthR);
    mouthGrad.addColorStop(0, 'rgba(30,24,18,.55)');
    mouthGrad.addColorStop(1, 'rgba(30,24,18,.15)');
    ctx.fillStyle = mouthGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(43,38,32,.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Control handles for shaping step
    if (opts.showHandles) {
      geom.rightPts.forEach((p, i) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = (opts.dragIndex === i) ? '#33455E' : '#ffffff';
        ctx.strokeStyle = '#33455E';
        ctx.lineWidth = 2;
        ctx.fill();
        ctx.stroke();
      });
    }
  }, [computeGeom, buildSilhouettePath, patternStrokes, glazeColorKey, glazeFullCover, glazeStrokes, glazeIntensity]);

  // Step 1: Draw Knead Blob
  const drawKneadBlob = useCallback((progress: number) => {
    const canvas = kneadCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 300, 300);
    const prog = progress / 100;
    const cx = 150;
    const cy = 155;
    const baseR = 88;
    const jag = 1 - prog;

    ctx.beginPath();
    const N = 18;
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI * 2;
      const wobble = 1 + (Math.sin(i * 2.5) * 0.3) * jag;
      const r = baseR * wobble;
      const x = cx + Math.cos(a) * r;
      const y = cy + Math.sin(a) * r * 0.92;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();

    const grad = ctx.createRadialGradient(cx - 30, cy - 40, 10, cx, cy, 110);
    grad.addColorStop(0, '#E4D6B8');
    grad.addColorStop(0.6, '#C98A5C');
    grad.addColorStop(1, '#8A5834');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(43,38,32,.2)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (isKneadHoldingRef.current) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, baseR * 0.5, baseR * 0.32, 0.3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,.4)';
      ctx.lineWidth = 6;
      ctx.stroke();
    }
  }, []);

  // Update pottery canvas whenever relevant state changes
  useEffect(() => {
    if (currentStep === 1) {
      drawKneadBlob(kneadProgress);
    } else if (currentStep >= 2 && currentStep <= 5) {
      const canvas = potCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      renderPottery(ctx, {
        showWheel: currentStep === 2,
        wheelAngle: wheelAngleRef.current,
        showHandles: currentStep === 2,
        dragIndex: dragIndexRef.current,
        firedState: fired
      });
    }
  }, [currentStep, kneadProgress, renderPottery, fired, drawKneadBlob]);

  // Wheel spinning animation loop for Step 2
  useEffect(() => {
    if (currentStep === 2) {
      playSound('humStart');
      const loop = () => {
        wheelAngleRef.current += 0.02;
        const canvas = potCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            renderPottery(ctx, {
              showWheel: true,
              wheelAngle: wheelAngleRef.current,
              showHandles: true,
              dragIndex: dragIndexRef.current,
              firedState: false
            });
          }
        }
        wheelAnimIdRef.current = requestAnimationFrame(loop);
      };
      wheelAnimIdRef.current = requestAnimationFrame(loop);
      return () => {
        if (wheelAnimIdRef.current) cancelAnimationFrame(wheelAnimIdRef.current);
        playSound('humStop');
      };
    } else {
      playSound('humStop');
    }
  }, [currentStep, renderPottery, playSound]);

  // Validation logic
  const isStepValid = (step: number) => {
    switch (step) {
      case 1: return kneadProgress >= 100;
      case 2: return shapeTouched;
      case 3: return patternStrokes.length >= 1;
      case 4: return glazeFullCover || glazePct >= 50;
      case 5: return fired;
      default: return true;
    }
  };

  // Step 1: Kneading interactions
  const handleKneadDown = () => {
    isKneadHoldingRef.current = true;
    playSound('thud');
    setKneadProgress(p => Math.min(100, p + 1.5));
    drawKneadBlob(kneadProgress);
  };

  const handleKneadUp = () => {
    isKneadHoldingRef.current = false;
    kneadLastPosRef.current = null;
    drawKneadBlob(kneadProgress);
  };

  const handleKneadMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isKneadHoldingRef.current || !kneadCanvasRef.current) return;
    const rect = kneadCanvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = { x: clientX - rect.left, y: clientY - rect.top };

    if (kneadLastPosRef.current) {
      const d = Math.hypot(pos.x - kneadLastPosRef.current.x, pos.y - kneadLastPosRef.current.y);
      setKneadProgress(p => {
        const next = Math.min(100, p + d * 0.08);
        drawKneadBlob(next);
        return next;
      });
    }
    kneadLastPosRef.current = pos;
  };

  // Step 2: Shaping Handlers
  const handlePotCanvasDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!potCanvasRef.current) return;
    const rect = potCanvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = {
      x: (clientX - rect.left) * (POT_W / rect.width),
      y: (clientY - rect.top) * (POT_H / rect.height)
    };

    if (currentStep === 2) {
      const geom = computeGeom();
      let hit = -1;
      let best = 20;
      geom.rightPts.forEach((p, i) => {
        const d = Math.hypot(pos.x - p.x, pos.y - p.y);
        if (d < best) {
          best = d;
          hit = i;
        }
      });
      if (hit >= 0) {
        dragIndexRef.current = hit;
        const key = RADIUS_KEYS[hit];
        handleDragStartRef.current = {
          x: pos.x,
          y: pos.y,
          r: shape.r[key],
          off: shape.hOff[hit] || 0
        };
      } else {
        heightDragStartRef.current = { y: pos.y, h: shape.height };
      }
    } else if (currentStep === 3) {
      const geom = computeGeom();
      if (!pointInsideShape(pos.x, pos.y, geom)) return;

      if (patternTool === 'stamp') {
        const newStroke = {
          type: 'stamp',
          icon: selectedMotif.icon,
          x: pos.x,
          y: pos.y,
          size: 26 + Math.random() * 8,
          rot: (Math.random() - 0.5) * 0.6
        };
        setPatternStrokes(prev => [...prev, newStroke]);
        playSound('tick');
      } else if (patternTool === 'draw') {
        drawingStrokeRef.current = {
          type: 'draw',
          color: drawColor,
          size: brushSize,
          points: [pos]
        };
        setPatternStrokes(prev => [...prev, drawingStrokeRef.current]);
        playSound('tick');
      }
    } else if (currentStep === 4) {
      if (!glazeColorKey) return;
      isGlazingPaintingRef.current = true;
      paintGlaze(pos);
    }
  };

  const handlePotCanvasMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!potCanvasRef.current) return;
    const rect = potCanvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const pos = {
      x: (clientX - rect.left) * (POT_W / rect.width),
      y: (clientY - rect.top) * (POT_H / rect.height)
    };

    if (currentStep === 2) {
      if (dragIndexRef.current >= 0 && handleDragStartRef.current) {
        const key = RADIUS_KEYS[dragIndexRef.current];
        const dx = pos.x - handleDragStartRef.current.x;
        const dy = pos.y - handleDragStartRef.current.y;
        const newR = Math.max(14, Math.min(140, handleDragStartRef.current.r + dx));
        const newOff = Math.max(-70, Math.min(90, handleDragStartRef.current.off - dy));

        setShape(prev => {
          const nextR = { ...prev.r, [key]: newR };
          const nextOff = [...prev.hOff];
          nextOff[dragIndexRef.current] = newOff;
          return { ...prev, r: nextR, hOff: nextOff };
        });
        setShapeTouched(true);
      } else if (heightDragStartRef.current) {
        const dy = heightDragStartRef.current.y - pos.y;
        const nextH = Math.max(55, Math.min(135, heightDragStartRef.current.h + dy * 0.4));
        setShape(prev => ({ ...prev, height: nextH }));
        setShapeTouched(true);
      }
    } else if (currentStep === 3) {
      if (drawingStrokeRef.current) {
        drawingStrokeRef.current.points.push(pos);
        setPatternStrokes(prev => [...prev]);
      }
    } else if (currentStep === 4 && isGlazingPaintingRef.current) {
      paintGlaze(pos);
    }
  };

  const handlePotCanvasUp = () => {
    if (currentStep === 2) {
      if (dragIndexRef.current >= 0 || heightDragStartRef.current) {
        playSound('tick');
      }
      dragIndexRef.current = -1;
      handleDragStartRef.current = null;
      heightDragStartRef.current = null;
    } else if (currentStep === 3) {
      drawingStrokeRef.current = null;
    } else if (currentStep === 4) {
      isGlazingPaintingRef.current = false;
    }
  };

  const paintGlaze = (pos: { x: number; y: number }) => {
    const geom = computeGeom();
    if (!pointInsideShape(pos.x, pos.y, geom)) return;
    setGlazeStrokes(prev => [...prev, { x: pos.x, y: pos.y, r: 28 }]);
    if (Math.random() < 0.25) playSound('swish');
    setGlazePct(prev => Math.min(100, prev + 3));
  };

  // Step 5: Kiln Temperature Minigame Logic
  const TEMP_ROUNDS = [
    { temp: 900,  zoneW: 95, speed: 2.0 },
    { temp: 1000, zoneW: 75, speed: 2.6 },
    { temp: 1100, zoneW: 56, speed: 3.2 },
    { temp: 1200, zoneW: 42, speed: 3.8 }
  ];

  const startFiring = () => {
    setIsFiringActive(true);
    setKilnStatus('Đang đưa sản phẩm vào lò nung...');

    // Draw mini preview on kiln item canvas
    if (kilnItemCanvasRef.current) {
      const ctx = kilnItemCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 70, 90);
        ctx.save();
        ctx.scale(0.16, 0.16);
        ctx.translate(20, -50);
        renderPottery(ctx, { firedState: false });
        ctx.restore();
      }
    }

    setTimeout(() => {
      setDoorClosed(true);
      setKilnStatus('Đóng cửa lò, bắt đầu nhóm lửa...');
    }, 900);

    setTimeout(() => {
      setGlowOn(true);
      setKilnStatus('Canh nhiệt độ chuẩn để giữ lửa đều tay!');
      setTempGameActive(true);
      initTempGameRound(0);
    }, 1800);
  };

  const initTempGameRound = (roundIdx: number) => {
    const cfg = TEMP_ROUNDS[roundIdx];
    const g = tempGameRef.current;
    g.active = true;
    g.round = roundIdx;
    g.zoneW = cfg.zoneW;
    g.speed = cfg.speed;
    g.zoneStart = g.barX + 8 + Math.random() * (g.barW - 16 - cfg.zoneW);
    g.markerX = g.barX;
    g.dir = 1;
    g.busy = false;
    setTempRound(roundIdx);
    setTempGameInfo(`Lượt ${roundIdx + 1}/${TEMP_ROUNDS.length} · Mục tiêu ${cfg.temp}°C`);
  };

  useEffect(() => {
    if (tempGameActive) {
      const canvas = tempBarCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loop = () => {
        const g = tempGameRef.current;
        if (g.active) {
          g.markerX += g.speed * g.dir;
          if (g.markerX >= g.barX + g.barW - 6) {
            g.markerX = g.barX + g.barW - 6;
            g.dir = -1;
          }
          if (g.markerX <= g.barX + 6) {
            g.markerX = g.barX + 6;
            g.dir = 1;
          }
          if (g.flash > 0) g.flash -= 0.05;

          // Render Temp Bar
          ctx.clearRect(0, 0, 280, 64);

          // Bar Background
          ctx.beginPath();
          ctx.roundRect(g.barX, g.barY, g.barW, g.barH, 8);
          ctx.fillStyle = '#D8CEB2';
          ctx.fill();
          ctx.strokeStyle = 'rgba(43,38,32,.2)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Golden Zone
          ctx.beginPath();
          ctx.roundRect(g.zoneStart, g.barY, g.zoneW, g.barH, 6);
          ctx.fillStyle = '#F2C94C';
          ctx.fill();
          ctx.strokeStyle = 'rgba(199,154,70,.8)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Flash on hit/miss
          if (g.flash > 0) {
            ctx.fillStyle = g.flashColor === 'ok'
              ? `rgba(93,124,104,${g.flash})`
              : `rgba(154,75,54,${g.flash})`;
            ctx.fillRect(0, 0, 280, 64);
          }

          // Indicator needle
          const mx = g.markerX;
          ctx.beginPath();
          ctx.moveTo(mx - 8, g.barY - 10);
          ctx.lineTo(mx + 8, g.barY - 10);
          ctx.lineTo(mx, g.barY - 1);
          ctx.closePath();
          ctx.fillStyle = '#33455E';
          ctx.fill();
          ctx.fillRect(mx - 1.5, g.barY, 3, g.barH);

          tempAnimIdRef.current = requestAnimationFrame(loop);
        }
      };

      tempAnimIdRef.current = requestAnimationFrame(loop);
      return () => {
        if (tempAnimIdRef.current) cancelAnimationFrame(tempAnimIdRef.current);
      };
    }
  }, [tempGameActive]);

  const handleTempAttempt = () => {
    const g = tempGameRef.current;
    if (!g.active || g.busy) return;
    const inZone = g.markerX >= g.zoneStart && g.markerX <= g.zoneStart + g.zoneW;
    const cfg = TEMP_ROUNDS[g.round];

    if (inZone) {
      g.busy = true;
      g.flash = 0.55;
      g.flashColor = 'ok';
      playSound('chime');
      playSound('crackle');
      setKilnStatus(`Chính xác! Lửa lò đạt ${cfg.temp}°C 🔥`);
      setKilnTemp(cfg.temp);

      const nextRound = g.round + 1;
      if (nextRound >= TEMP_ROUNDS.length) {
        g.active = false;
        setTempGameActive(false);
        setKilnStatus('Nung thành công! 1.200°C làm cốt gốm chín hoàn hảo.');
        setTimeout(() => {
          setFired(true);
          setGlowOn(false);
          setDoorClosed(false);
          setKilnStatus('Gốm đã nguội — sẵn sàng mở lò chiêm ngưỡng!');
          playSound('chime');
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch (e) {}
        }, 1200);
      } else {
        setTimeout(() => {
          initTempGameRound(nextRound);
          setKilnStatus('Canh nhiệt chuẩn để giữ lửa đều tay!');
        }, 600);
      }
    } else {
      g.flash = 0.4;
      g.flashColor = 'miss';
      playSound('tick');
      setKilnStatus('Chưa đúng lúc! Hãy căn kim vào vùng vàng.');
    }
  };

  // Result Render
  useEffect(() => {
    if (currentStep === 6 && resultCanvasRef.current) {
      const canvas = resultCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 360, 440);
        ctx.save();
        ctx.translate(-10, -10);
        renderPottery(ctx, { firedState: true });
        ctx.restore();
      }
    }
  }, [currentStep, renderPottery]);

  const handleDownload = () => {
    if (!resultCanvasRef.current) return;
    const link = document.createElement('a');
    link.download = `${productName.trim() || 'gom-bat-trang'}.png`;
    link.href = resultCanvasRef.current.toDataURL('image/png');
    link.click();
  };

  const handleFullReset = () => {
    setCurrentStep(1);
    setUnlockedStep(1);
    setKneadProgress(0);
    setShape({
      r: { base: 40, lower: 66, bulge: 88, upper: 70, neck: 52, mouth: 58 },
      height: 100,
      hOff: [0, 0, 0, 0, 0, 0]
    });
    setSelectedPreset(null);
    setShapeTouched(false);
    setPatternStrokes([]);
    setGlazeStrokes([]);
    setGlazeFullCover(false);
    setGlazePct(0);
    setGlazeColorKey('lam');
    setFired(false);
    setIsFiringActive(false);
    setDoorClosed(false);
    setGlowOn(false);
    setKilnTemp(20);
    setKilnStatus('Sẵn sàng đưa sản phẩm vào lò');
    setStartTime(Date.now());
  };

  const nextStep = () => {
    if (currentStep === 5) {
      setCurrentStep(6);
      return;
    }
    const n = currentStep + 1;
    setCurrentStep(n);
    setUnlockedStep(prev => Math.max(prev, n));
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Crafting Duration
  const getCraftingDuration = () => {
    if (!startTime) return '1 phút 30s';
    const totalSecs = Math.max(1, Math.round((Date.now() - startTime) / 1000));
    const mins = Math.floor(totalSecs / 60);
    const rem = totalSecs % 60;
    return mins > 0 ? `${mins} phút ${rem}s` : `${rem} giây`;
  };

  return (
    <div className="w-full bg-[#F4EEDF] text-[#2B2620] rounded-3xl border-2 border-[#E4D9BE] shadow-2xl overflow-hidden font-sans relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-white border-b border-[#E4D9BE]">
        <div className="flex items-center gap-2">
          <span className="font-serif font-black text-sm sm:text-base text-[#33455E] tracking-tight">
            Xưởng Nghệ Nhân · <span className="text-[#B4744A]">Gốm Bát Tràng</span>
          </span>
        </div>

        {/* Step Progress Dots */}
        {currentStep >= 1 && currentStep <= 5 && (
          <div className="hidden sm:flex items-center gap-1">
            {STEP_LABELS.map((label, idx) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isDone = currentStep > stepNum;
              return (
                <button
                  key={idx}
                  onClick={() => stepNum <= unlockedStep && setCurrentStep(stepNum)}
                  disabled={stepNum > unlockedStep}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-[#33455E] text-white shadow'
                      : isDone
                      ? 'bg-[#5D7C68] text-white'
                      : 'bg-[#E9E0C9] text-[#8A7F6C] cursor-not-allowed'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">
                    {stepNum}
                  </span>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundOn(!soundOn)}
          className="p-2 rounded-xl bg-[#F4EEDF] hover:bg-[#EAE0C8] border border-[#E4D9BE] text-[#33455E] transition-colors"
          title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      {/* SCREEN 0: INTRO */}
      {currentStep === 0 && (
        <div className="p-8 sm:p-14 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#B4744A] via-[#D9A67C] to-[#8A5834] flex items-center justify-center shadow-xl animate-spin [animation-duration:8s]">
            <div className="w-10 h-10 rounded-full bg-[#F4EEDF]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#B4744A]/15 text-[#8A5834] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mini Game Trải Nghiệm Làng Nghề</span>
          </div>

          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-[#2B2620] leading-tight">
            Tự tay nặn nên <span className="text-[#33455E]">gốm Bát Tràng</span> của riêng bạn
          </h2>

          <p className="text-sm sm:text-base text-[#5A5348] leading-relaxed">
            Không có khuôn mẫu, không có sản phẩm định sẵn. Bạn tự chọn đất, vuốt hình trên bàn xoay,
            vẽ hoa văn phong thủy, phủ lớp men cổ và canh nhiệt lò nung 1.200°C.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {STEP_LABELS.map((lbl, idx) => (
              <span key={idx} className="text-xs font-semibold px-3 py-1 bg-white border border-[#E4D9BE] rounded-full text-[#8A5834]">
                {idx + 1}. {lbl}
              </span>
            ))}
          </div>

          <div className="pt-4">
            <button
              onClick={() => {
                setStartTime(Date.now());
                setCurrentStep(1);
              }}
              className="px-8 py-4 rounded-full bg-[#33455E] hover:bg-[#5B7599] text-white font-bold text-base shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2 mx-auto"
            >
              <span>Bắt đầu nặn gốm ngay</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 1-5: MAIN WORKSHOP STAGE */}
      {currentStep >= 1 && currentStep <= 5 && (
        <div className="flex flex-col lg:flex-row min-h-[580px]">
          {/* Stage Area: Interactive Canvas */}
          <div className="flex-1 p-6 flex flex-col items-center justify-center relative bg-[radial-gradient(#e5a882_1px,transparent_1px)] [background-size:24px_24px]">
            <div className="bg-white p-4 rounded-3xl border border-[#ECE2C8] shadow-xl flex flex-col items-center gap-3">
              {/* Step 1: Kneading Canvas */}
              {currentStep === 1 && (
                <div className="flex flex-col items-center gap-3">
                  <canvas
                    ref={kneadCanvasRef}
                    width={300}
                    height={300}
                    onMouseDown={handleKneadDown}
                    onMouseUp={handleKneadUp}
                    onMouseMove={handleKneadMove}
                    onTouchStart={handleKneadDown}
                    onTouchEnd={handleKneadUp}
                    onTouchMove={handleKneadMove}
                    className="cursor-grab active:cursor-grabbing rounded-2xl touch-none bg-gradient-to-b from-[#EFE6D2] to-[#E4D6B8]"
                  />
                  <div className="w-full max-w-xs space-y-1">
                    <div className="flex justify-between text-xs font-bold text-[#8A7F6C]">
                      <span>Độ dẻo mịn của đất</span>
                      <span>{Math.floor(kneadProgress)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[#EEE4CE] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#5D7C68] to-[#33455E] transition-all duration-150"
                        style={{ width: `${kneadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Steps 2-4: Pottery Canvas */}
              {(currentStep >= 2 && currentStep <= 4) && (
                <div className="relative">
                  <canvas
                    ref={potCanvasRef}
                    width={POT_W}
                    height={POT_H}
                    onMouseDown={handlePotCanvasDown}
                    onMouseMove={handlePotCanvasMove}
                    onMouseUp={handlePotCanvasUp}
                    onTouchStart={handlePotCanvasDown}
                    onTouchMove={handlePotCanvasMove}
                    onTouchEnd={handlePotCanvasUp}
                    className="rounded-2xl touch-none bg-white"
                  />
                </div>
              )}

              {/* Step 5: Kiln Firing */}
              {currentStep === 5 && (
                <div className="flex flex-col items-center gap-4 py-2">
                  <div className="w-64 h-56 rounded-2xl bg-gradient-to-b from-[#4a3a2c] to-[#2c231a] relative shadow-xl overflow-hidden flex items-center justify-center">
                    {/* Glowing Heat Background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-t from-[#d8480c] via-[#ffb15c] to-transparent transition-opacity duration-700 ${
                        glowOn ? 'opacity-85 animate-pulse' : 'opacity-0'
                      }`}
                    />

                    {/* Pottery Item Inside Kiln */}
                    <canvas
                      ref={kilnItemCanvasRef}
                      width={70}
                      height={90}
                      className={`relative z-10 transition-all duration-700 ${isFiringActive ? 'translate-y-0' : 'translate-y-20'}`}
                    />

                    {/* Kiln Door */}
                    <div
                      className={`absolute inset-3.5 bg-[#1b140d] rounded-xl border border-[#4a3a2c] transition-all duration-700 origin-left flex items-center justify-center ${
                        doorClosed ? 'rotate-0 opacity-95' : '-rotate-90 opacity-0 pointer-events-none'
                      }`}
                    >
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
                        Lò Đang Nung
                      </span>
                    </div>
                  </div>

                  {/* Temperature Readout */}
                  <div className="text-center">
                    <span className="font-serif text-3xl font-black text-[#B4744A] tracking-wider">
                      {kilnTemp}°C
                    </span>
                    <p className="text-xs font-bold text-[#33455E] mt-0.5">{kilnStatus}</p>
                  </div>

                  {/* Temperature Timing Game */}
                  {tempGameActive && (
                    <div className="flex flex-col items-center gap-1.5 p-2 bg-[#F4EEDF] rounded-2xl border border-[#E4D9BE]">
                      <span className="text-xs font-bold text-[#33455E]">
                        {tempGameInfo}
                      </span>
                      <canvas
                        ref={tempBarCanvasRef}
                        width={280}
                        height={64}
                        onClick={handleTempAttempt}
                        onTouchStart={(e) => { e.preventDefault(); handleTempAttempt(); }}
                        className="cursor-pointer rounded-xl touch-manipulation"
                      />
                      <span className="text-[11px] text-[#8A7F6C]">
                        👉 Chạm đúng lúc mũi tên chạy vào vùng màu vàng!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Step Instruction Hint */}
              <p className="text-xs text-[#8A7F6C] text-center max-w-sm">
                {currentStep === 1 && 'Giữ chuột (hoặc chạm) và xoay tròn trên khối đất sét để nhào cho đến khi đạt 100% độ dẻo.'}
                {currentStep === 2 && 'Kéo các chấm tròn trên mép gốm theo mọi hướng: kéo ngang để phình/thu, kéo dọc để nâng/hạ cổ hoặc eo bình.'}
                {currentStep === 3 && (patternTool === 'stamp' ? 'Chọn họa tiết rồi chạm lên thân gốm để dán.' : 'Vẽ tự do bằng bút lông men lam lên cốt gốm mộc.')}
                {currentStep === 4 && 'Chọn màu men bên phải rồi rê cọ lên thân gốm để tráng men.'}
                {currentStep === 5 && !isFiringActive && 'Đưa gốm vào lò nung truyền thống và giữ lửa đạt chuẩn 1.200°C.'}
              </p>
            </div>
          </div>

          {/* Control Panel (Side) */}
          <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-[#ECE2C8] p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Step 1 Control */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-[#B4744A] uppercase">Bước 1 · Thấu đất sét</span>
                  <h3 className="font-serif text-xl font-bold text-[#2B2620]">Nhào luyện đất</h3>
                  <p className="text-xs text-[#5A5348] leading-relaxed">
                    Đất sét trắng cao lanh Bát Tràng được lấy từ phù sa sông Hồng. Thấu đất giúp bọt khí thoát ra ngoài,
                    tạo khối đất mịn dẻo để sản phẩm không bị nứt vỡ khi vào lò nung.
                  </p>
                </div>
              )}

              {/* Step 2 Control: Presets & Height */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#B4744A] uppercase">Bước 2 · Chuốt trên bàn xoay</span>
                  <h3 className="font-serif text-xl font-bold text-[#2B2620]">Tạo dáng sản phẩm</h3>

                  <div>
                    <label className="text-xs font-bold text-[#5A5348] block mb-1.5">Mẫu gốm Bát Tràng tiêu biểu:</label>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(PRESETS).map(([key, p]) => (
                        <button
                          key={key}
                          onClick={() => {
                            setShape({ r: { ...p.r }, height: p.height, hOff: [0, 0, 0, 0, 0, 0] });
                            setSelectedPreset(key);
                            setShapeTouched(true);
                            playSound('tick');
                          }}
                          className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                            selectedPreset === key
                              ? 'bg-[#33455E] text-white border-[#33455E]'
                              : 'bg-[#F4EEDF] text-[#2B2620] border-[#E4D9BE] hover:border-[#33455E]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#5A5348] mb-1">
                      <span>Chiều cao dáng gốm</span>
                      <span>{Math.round(shape.height)}%</span>
                    </div>
                    <input
                      type="range"
                      min={55}
                      max={135}
                      value={shape.height}
                      onChange={(e) => {
                        setShape(prev => ({ ...prev, height: parseFloat(e.target.value) }));
                        setShapeTouched(true);
                      }}
                      className="w-full accent-[#33455E]"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setShape({ r: { base: 40, lower: 66, bulge: 88, upper: 70, neck: 52, mouth: 58 }, height: 100, hOff: [0, 0, 0, 0, 0, 0] });
                      setSelectedPreset(null);
                      playSound('tick');
                    }}
                    className="w-full py-2 rounded-xl bg-[#F4EEDF] hover:bg-[#EAE0C8] border border-[#E4D9BE] text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại dáng gốm</span>
                  </button>
                </div>
              )}

              {/* Step 3 Control: Motif & Painting */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#B4744A] uppercase">Bước 3 · Trang trí hoa văn</span>
                  <h3 className="font-serif text-xl font-bold text-[#2B2620]">Thổi hồn di sản</h3>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setPatternTool('stamp')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        patternTool === 'stamp'
                          ? 'bg-[#5D7C68] text-white border-[#5D7C68]'
                          : 'bg-[#F4EEDF] border-[#E4D9BE]'
                      }`}
                    >
                      🌸 Dán họa tiết
                    </button>
                    <button
                      onClick={() => setPatternTool('draw')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        patternTool === 'draw'
                          ? 'bg-[#5D7C68] text-white border-[#5D7C68]'
                          : 'bg-[#F4EEDF] border-[#E4D9BE]'
                      }`}
                    >
                      ✏️ Tự vẽ cọ
                    </button>
                  </div>

                  {patternTool === 'stamp' ? (
                    <div className="grid grid-cols-4 gap-2">
                      {MOTIFS.map(m => (
                        <button
                          key={m.key}
                          onClick={() => {
                            setSelectedMotif(m);
                            playSound('tick');
                          }}
                          className={`aspect-square rounded-xl border text-xl flex items-center justify-center transition-all ${
                            selectedMotif.key === m.key
                              ? 'bg-[#33455E] border-[#33455E] shadow'
                              : 'bg-[#F4EEDF] border-[#E4D9BE] hover:border-[#33455E]'
                          }`}
                          title={m.label}
                        >
                          {m.icon}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-bold text-[#5A5348] mb-1">
                          <span>Cỡ nét cọ vẽ</span>
                          <span>{brushSize}px</span>
                        </div>
                        <input
                          type="range"
                          min={3}
                          max={20}
                          value={brushSize}
                          onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
                          className="w-full accent-[#33455E]"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#5A5348]">Màu men vẽ</span>
                        <input
                          type="color"
                          value={drawColor}
                          onChange={(e) => setDrawColor(e.target.value)}
                          className="w-8 h-8 rounded border-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setPatternStrokes(prev => prev.slice(0, -1));
                      playSound('tick');
                    }}
                    disabled={patternStrokes.length === 0}
                    className="w-full py-2 rounded-xl bg-[#F4EEDF] hover:bg-[#EAE0C8] border border-[#E4D9BE] text-xs font-bold disabled:opacity-40"
                  >
                    ↺ Xóa nét gần nhất
                  </button>
                </div>
              )}

              {/* Step 4 Control: Glazing */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#B4744A] uppercase">Bước 4 · Tráng men cổ</span>
                  <h3 className="font-serif text-xl font-bold text-[#2B2620]">Khoác tấm áo mới</h3>

                  <div>
                    <label className="text-xs font-bold text-[#5A5348] block mb-1.5">Bảng men truyền thống Bát Tràng:</label>
                    <div className="grid grid-cols-4 gap-2">
                      {GLAZES.map(g => (
                        <button
                          key={g.key}
                          onClick={() => {
                            setGlazeColorKey(g.key);
                            playSound('swish');
                          }}
                          className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all ${
                            glazeColorKey === g.key ? 'border-[#2B2620] ring-2 ring-[#33455E]' : 'border-transparent'
                          }`}
                        >
                          <span
                            className="w-8 h-8 rounded-lg shadow-inner border border-black/10"
                            style={{ backgroundColor: g.hex }}
                          />
                          <span className="text-[10px] font-semibold text-[#5A5348] text-center line-clamp-1">
                            {g.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-[#5A5348] mb-1">
                      <span>Độ đậm lớp men</span>
                      <span>{Math.round(glazeIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={25}
                      max={75}
                      value={Math.round(glazeIntensity * 100)}
                      onChange={(e) => setGlazeIntensity(parseInt(e.target.value, 10) / 100)}
                      className="w-full accent-[#33455E]"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setGlazeFullCover(true);
                      setGlazePct(100);
                      playSound('swish');
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#5D7C68] hover:bg-[#4d6957] text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>🫗 Nhúng men nhanh (Phủ toàn bộ)</span>
                  </button>
                </div>
              )}

              {/* Step 5 Control: Kiln */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <span className="text-xs font-bold text-[#B4744A] uppercase">Bước 5 · Hóa thân trong lửa</span>
                  <h3 className="font-serif text-xl font-bold text-[#2B2620]">Nung gốm 1.200°C</h3>
                  <p className="text-xs text-[#5A5348] leading-relaxed">
                    Đưa sản phẩm vào lò và theo dõi sát màu lửa. Ở 1.200°C, các khoáng sét kết khối vĩnh cửu,
                    men tan chảy tạo nên lớp áo bóng sâu thẳm.
                  </p>

                  {!isFiringActive && (
                    <button
                      onClick={startFiring}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#B4744A] to-[#8A5834] hover:opacity-95 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2"
                    >
                      <Flame className="w-4 h-4 text-amber-300" />
                      <span>Đưa gốm vào lò nung</span>
                    </button>
                  )}
                </div>
              )}

              {/* Educational Tip Box */}
              <div className="p-3 bg-[#F4EEDF] rounded-2xl border-l-4 border-[#C79A46] text-xs text-[#5A5348] leading-relaxed">
                {TIPS[currentStep]}
              </div>
            </div>

            {/* Bottom Nav Buttons inside panel */}
            <div className="pt-4 border-t border-[#ECE2C8] flex items-center justify-between gap-3">
              <button
                onClick={prevStep}
                disabled={currentStep <= 1}
                className="px-4 py-2.5 rounded-xl bg-[#F4EEDF] hover:bg-[#EAE0C8] border border-[#E4D9BE] text-xs font-bold text-[#2B2620] disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quay lại</span>
              </button>

              <button
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="px-6 py-2.5 rounded-xl bg-[#33455E] hover:bg-[#5B7599] text-white text-xs font-bold shadow disabled:bg-[#D8CEB2] disabled:text-[#9A9078] disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <span>{currentStep === 5 ? 'Xem tác phẩm →' : 'Tiếp tục →'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 6: RESULT */}
      {currentStep === 6 && (
        <div className="p-6 sm:p-12 flex flex-col lg:flex-row items-center justify-center gap-8 max-w-5xl mx-auto">
          {/* Finished Product Card */}
          <div className="bg-white p-5 rounded-3xl border border-[#ECE2C8] shadow-2xl">
            <canvas ref={resultCanvasRef} width={360} height={440} className="rounded-2xl block" />
          </div>

          {/* Certificate & Actions */}
          <div className="space-y-5 max-w-md w-full">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase mb-2">
                <Check className="w-3.5 h-3.5" />
                <span>Đã Hoàn Thành 5/5 Công Đoạn</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#2B2620]">
                Tác phẩm gốm của bạn
              </h2>
            </div>

            <div>
              <label className="text-xs font-bold text-[#5A5348] block mb-1">Đặt tên cho tác phẩm:</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                maxLength={45}
                className="w-full px-4 py-2.5 rounded-xl bg-[#F4EEDF] border border-[#E4D9BE] text-sm font-bold text-[#2B2620] focus:outline-none focus:border-[#33455E]"
              />
            </div>

            <div className="space-y-2 text-xs divide-y divide-[#ECE2C8] bg-white p-4 rounded-2xl border border-[#ECE2C8]">
              <div className="flex justify-between py-1">
                <span className="text-[#8A7F6C]">Kiểu dáng</span>
                <span className="font-bold text-[#2B2620]">
                  {selectedPreset ? PRESETS[selectedPreset]?.label : 'Dáng gốm vuốt tay tự do'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A7F6C]">Hoa văn</span>
                <span className="font-bold text-[#2B2620]">
                  {patternStrokes.length > 0 ? `${patternStrokes.length} họa tiết thủ công` : 'Gốm mộc thuần khiết'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A7F6C]">Dòng men phủ</span>
                <span className="font-bold text-[#2B2620]">
                  {GLAZES.find(g => g.key === glazeColorKey)?.label || 'Men truyền thống'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A7F6C]">Nhiệt độ nung</span>
                <span className="font-bold text-amber-700">1.200°C (Cốt sứ đanh như chuông)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#8A7F6C]">Thời gian chế tác</span>
                <span className="font-bold text-[#2B2620]">{getCraftingDuration()}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleDownload}
                className="flex-1 py-3 px-4 rounded-xl bg-[#C79A46] hover:bg-[#b0883b] text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Lưu ảnh PNG</span>
              </button>
              <button
                onClick={handleFullReset}
                className="flex-1 py-3 px-4 rounded-xl bg-[#5D7C68] hover:bg-[#4b6654] text-white text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo sản phẩm mới</span>
              </button>
            </div>

            <p className="text-xs italic text-[#8A7F6C] text-center pt-2">
              "Không có sản phẩm nào giống sản phẩm nào — vì đây là tác phẩm của chính bạn."
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
