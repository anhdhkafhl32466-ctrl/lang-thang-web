/**
 * Xưởng họa tiết — biến ý tưởng (hoặc đặc tả do AI sinh ra) thành HÌNH VẼ VECTOR thật.
 *
 * Vì sao dùng vector thay vì ảnh điểm (raster):
 *  - Hoa văn luôn sắc nét ở mọi kích thước, từ ô xem trước trên điện thoại tới bản in khổ lớn.
 *  - Mỗi bản vẽ chỉ vài KB, dựng tức thì và tải gần như không đáng kể.
 *  - Quan trọng nhất: nghệ nhân nhận được BẢN ĐẶC TẢ ĐỌC ĐƯỢC (màu, họa tiết, mật độ, lối bố cục)
 *    để chép lại bằng tay, thay vì một tấm ảnh mờ không nói lên cách làm.
 *
 * Tệp này KHÔNG phụ thuộc máy chủ hay trình duyệt: dùng được ở cả hai phía.
 * Mọi dữ liệu đầu vào từ AI/bên ngoài đều phải đi qua `normalizePatternSpec` trước khi dựng hình.
 */

/* -------------------------------------------------------------------------- */
/* 1. Danh mục họa tiết                                                       */
/* -------------------------------------------------------------------------- */

export type MotifKind =
  | 'sen'
  | 'song-nuoc'
  | 'may-co'
  | 'rong'
  | 'chim-lac'
  | 'trong-dong'
  | 'hoa-chuoi'
  | 'tre'
  | 'ca-chep'
  | 'nui-song'
  | 'chuon-chuon'
  | 'hoa-cuc'
  | 'vay-ca'
  | 'mat-troi'
  | 'sparkle';

export interface MotifInfo {
  kind: MotifKind;
  name: string;
  /** Ý nghĩa / nguồn gốc — hiển thị trong phiếu kỹ thuật gửi nghệ nhân. */
  meaning: string;
}

export const MOTIF_CATALOG: MotifInfo[] = [
  { kind: 'sen', name: 'Hoa sen', meaning: 'Biểu tượng thanh khiết, gắn với Phật giáo và ao làng Bắc Bộ.' },
  { kind: 'song-nuoc', name: 'Sóng nước', meaning: 'Sóng nước sông Hồng — nhịp điệu của đồng bằng châu thổ.' },
  { kind: 'may-co', name: 'Mây cổ', meaning: 'Mây xoắn cổ điển trên đồ thờ và kiến trúc đình chùa.' },
  { kind: 'rong', name: 'Rồng thời Lý', meaning: 'Rồng mình trơn uốn khúc, biểu tượng vương quyền thời Lý.' },
  { kind: 'chim-lac', name: 'Chim Lạc', meaning: 'Chim Lạc trên trống đồng Đông Sơn — cội nguồn Âu Lạc.' },
  { kind: 'trong-dong', name: 'Trống đồng', meaning: 'Mặt trống đồng với ngôi sao nhiều cánh và các vành lông công.' },
  { kind: 'hoa-chuoi', name: 'Hoa chuối', meaning: 'Búp hoa chuối — mô típ quen thuộc của đan lát và chạm khắc.' },
  { kind: 'tre', name: 'Tre trúc', meaning: 'Tre trúc Việt Nam: ngay thẳng, dẻo dai, gắn với làng quê.' },
  { kind: 'ca-chep', name: 'Cá chép', meaning: 'Cá chép hoá rồng — ý chí vươn lên, cầu may mắn.' },
  { kind: 'nui-song', name: 'Núi sông', meaning: 'Núi non sông nước — sơn thuỷ trong tranh mỹ nghệ.' },
  { kind: 'chuon-chuon', name: 'Chuồn chuồn tre', meaning: 'Chuồn chuồn tre Thạch Xá — đồ chơi dân gian đặc sản Hà Nội.' },
  { kind: 'hoa-cuc', name: 'Hoa cúc', meaning: 'Hoa cúc — loài hoa chủ lực của làng hoa Tây Tựu, tượng trưng trường thọ.' },
  { kind: 'vay-ca', name: 'Vảy cá', meaning: 'Vân vảy cá — hoa văn chạm khắc gỗ và khảm trai truyền thống.' },
  { kind: 'mat-troi', name: 'Mặt trời', meaning: 'Mặt trời toả tia trên trống đồng, gắn với tín ngưỡng nông nghiệp.' },
  { kind: 'sparkle', name: 'Ánh xà cừ', meaning: 'Đốm sáng lấp lánh — gợi kỹ thuật khảm xà cừ của làng Chuôn Ngọ.' },
];

export const MOTIF_KINDS: MotifKind[] = MOTIF_CATALOG.map((m) => m.kind);

export function motifName(kind: MotifKind): string {
  return MOTIF_CATALOG.find((m) => m.kind === kind)?.name || kind;
}

/** Các lối bố cục. Mỗi lối cho ra một cảm giác rất khác nhau trên cùng một phôi. */
export type PatternLayout = 'radial' | 'bands' | 'allover' | 'center';

export const LAYOUT_META: Record<PatternLayout, { name: string; note: string }> = {
  radial: { name: 'Toả tròn', note: 'Bố cục đồng tâm như mặt trống đồng, hợp với đĩa và khay.' },
  bands: { name: 'Dải ngang', note: 'Các dải hoa văn chạy ngang như dải lụa dệt, hợp với khăn và băng vải.' },
  allover: { name: 'Rải đều', note: 'Hoa văn rải khắp mặt phôi — hợp với lụa, nón và các mặt phẳng lớn.' },
  center: { name: 'Chủ thể giữa', note: 'Một mô típ lớn ở giữa, viền quanh bằng hoạ tiết nhỏ — hợp với tranh và đĩa kỷ niệm.' },
};

export const LAYOUTS: PatternLayout[] = ['radial', 'bands', 'allover', 'center'];

/* -------------------------------------------------------------------------- */
/* 2. Bảng màu                                                                */
/* -------------------------------------------------------------------------- */

export interface PalettePreset {
  id: string;
  name: string;
  /** Màu nền phôi và 3–5 màu hoạ tiết. */
  background: string;
  colors: string[];
  note: string;
}

export const PALETTE_PRESETS: PalettePreset[] = [
  { id: 'men-ngoc', name: 'Men ngọc', background: '#F1F5EC', colors: ['#2F6F5E', '#8FC7B3', '#123A30', '#D9E6D6'], note: 'Men ngọc Bát Tràng — xanh rêu nhạt, cổ điển.' },
  { id: 'men-lam', name: 'Men lam', background: '#F7F9FE', colors: ['#1B3A8F', '#5A7FD0', '#0C1E52', '#C7D6F2'], note: 'Men lam vẽ lam trên nền trắng ngà.' },
  { id: 'dat-nung', name: 'Đất nung', background: '#FBEFE6', colors: ['#C85A32', '#E8A87C', '#7A3A1E', '#F4DDCF'], note: 'Màu đất nung mộc của gốm Bát Tràng.' },
  { id: 'son-mai', name: 'Sơn mài', background: '#241811', colors: ['#D4A344', '#8E1B15', '#E5BF5A', '#C0512F'], note: 'Son đỏ thếp vàng trên nền sơn mài gỗ trầm.' },
  { id: 'lua-vang', name: 'Lụa vàng', background: '#FDFBF7', colors: ['#B8860B', '#E5BF5A', '#8E6706', '#D4C1A2'], note: 'Vàng tơ tằm Vạn Phúc trên nền lụa trắng ngà.' },
  { id: 'oc-xa-cu', name: 'Xà cừ', background: '#F4F8F7', colors: ['#7FA9A0', '#8FA9B8', '#D9C7A0', '#3F5C5A'], note: 'Ánh xà cừ ngũ sắc của khảm trai Chuôn Ngọ.' },
  { id: 'xanh-tre', name: 'Tre xanh', background: '#F3F8F5', colors: ['#2A5A3B', '#7FA98A', '#122518', '#C9DCCF'], note: 'Tre nứa Phú Vinh — xanh rừng mộc mạc.' },
  { id: 'trang-nga', name: 'Trắng ngà', background: '#F9F4E8', colors: ['#9C7C4E', '#D4C1A2', '#3B2C1A', '#C9A96B'], note: 'Trắng ngà của lá nón và giấy dó.' },
  { id: 'hong-sen', name: 'Hồng sen', background: '#FDF4F6', colors: ['#D96A8B', '#8C2F4A', '#F2B8C6', '#5E1F33'], note: 'Hồng sen — tươi sáng, hợp với lụa và hoa.' },
  { id: 'tim-hoa-ca', name: 'Tím hoa cà', background: '#F3F1FC', colors: ['#6A5ACD', '#3B2F7A', '#B9AEE8', '#241B52'], note: 'Tím hoa cà — gợi cánh đồng hoa Tây Tựu.' },
];

export const DEFAULT_PALETTE_ID = 'men-ngoc';

export function paletteById(id: string): PalettePreset {
  return PALETTE_PRESETS.find((p) => p.id === id) || PALETTE_PRESETS[0];
}

/** Tên gọi tiếng Việt gần đúng của một mã màu — dùng cho phiếu kỹ thuật gửi nghệ nhân. */
const COLOR_NAMES: { name: string; rgb: [number, number, number] }[] = [
  { name: 'trắng ngà', rgb: [250, 246, 236] },
  { name: 'kem', rgb: [233, 222, 199] },
  { name: 'be vàng', rgb: [206, 186, 150] },
  { name: 'nâu đất', rgb: [122, 78, 45] },
  { name: 'nâu trầm', rgb: [59, 44, 26] },
  { name: 'đen mực', rgb: [26, 22, 18] },
  { name: 'đỏ son', rgb: [180, 42, 32] },
  { name: 'đỏ đô', rgb: [128, 30, 34] },
  { name: 'hồng sen', rgb: [217, 106, 139] },
  { name: 'cam đất nung', rgb: [200, 90, 50] },
  { name: 'vàng quỳ', rgb: [212, 163, 68] },
  { name: 'vàng nghệ', rgb: [222, 178, 58] },
  { name: 'xanh ngọc', rgb: [47, 111, 94] },
  { name: 'xanh rêu', rgb: [95, 122, 74] },
  { name: 'xanh lam', rgb: [27, 58, 143] },
  { name: 'xanh thiên thanh', rgb: [86, 140, 190] },
  { name: 'xanh lá mạ', rgb: [143, 199, 179] },
  { name: 'tím hoa cà', rgb: [106, 90, 205] },
  { name: 'tím than', rgb: [59, 47, 122] },
  { name: 'xám bạc', rgb: [154, 162, 168] },
];

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16) || 0,
    parseInt(clean.slice(2, 4), 16) || 0,
    parseInt(clean.slice(4, 6), 16) || 0,
  ];
}

/**
 * Bảo đảm màu hoạ tiết đủ tương phản với màu nền phôi.
 *
 * Vì sao cần: mô hình ngôn ngữ rất hay trả về bảng màu "na ná nhau" (nền trắng ngà + hoạ tiết trắng
 * kem), dựng ra thì hoa văn gần như tàng hình. Ở đây tự kéo màu về phía tối hoặc sáng cho tới khi đủ
 * tách khỏi nền, nên kết quả luôn nhìn thấy được dù AI trả về màu gì.
 */
export function ensureContrast(hex: string, background: string): string {
  const bgLum = luminance(background);
  let [r, g, b] = hexToRgb(hex);
  for (let attempt = 0; attempt < 12; attempt++) {
    const current = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    if (Math.abs(current - bgLum) >= 0.22) break;
    // Nền sáng thì kéo hoạ tiết về phía tối, nền tối thì kéo về phía sáng.
    const target = bgLum > 0.5 ? 0 : 255;
    r = Math.round(r + (target - r) * 0.16);
    g = Math.round(g + (target - g) * 0.16);
    b = Math.round(b + (target - b) * 0.16);
  }
  return `#${[r, g, b].map((value) => Math.min(255, Math.max(0, value)).toString(16).padStart(2, '0')).join('')}`;
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

export function colorName(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  let best = COLOR_NAMES[0];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of COLOR_NAMES) {
    const [cr, cg, cb] = candidate.rgb;
    const score = (r - cr) ** 2 * 0.3 + (g - cg) ** 2 * 0.59 + (b - cb) ** 2 * 0.11;
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best.name;
}

/* -------------------------------------------------------------------------- */
/* 3. Đặc tả hoa văn                                                          */
/* -------------------------------------------------------------------------- */

export interface PatternSpec {
  /** Tên bộ hoa văn, ví dụ: "Sen nở trên sóng nước". */
  title: string;
  /** 1–2 câu kể ý nghĩa, dùng làm lời giới thiệu sản phẩm và ghi chú cho nghệ nhân. */
  story: string;
  /** Màu nền phôi. */
  background: string;
  /** 3–5 màu hoạ tiết, dùng theo vòng tròn. */
  palette: string[];
  /** 1–4 họa tiết chính. */
  motifs: MotifKind[];
  /** Họa tiết viền — null nếu không viền. */
  band: MotifKind | null;
  layout: PatternLayout;
  /** 1 = thưa, 2 = vừa, 3 = dày. */
  density: number;
  /** Hạt giống để tạo biến thể nhưng vẫn cho kết quả ổn định khi dựng lại. */
  seed: number;
}

export const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const DEFAULT_BACKGROUND = '#FDFBF7';

const FALLBACK_MOTIFS: MotifKind[] = ['sen', 'song-nuoc', 'may-co'];

/**
 * Chuẩn hoá đặc tả do AI hoặc người dùng cung cấp.
 *
 * Vì sao bắt buộc: đặc tả sinh bởi mô hình ngôn ngữ có thể chứa mã màu sai, họa tiết không tồn tại,
 * hoặc chuỗi rác. Dựng thẳng vào SVG sẽ cho ra hình vỡ (hoặc tệ hơn là chèn được nội dung lạ).
 * Ở đây mọi trường đều được kiểm và thay bằng giá trị mặc định hợp lệ.
 */
export function normalizePatternSpec(raw: unknown, fallbackSeed = 1): PatternSpec {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const cleanText = (value: unknown, max: number, fallback: string): string => {
    if (typeof value !== 'string') return fallback;
    const stripped = value.replace(/[<>]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!stripped) return fallback;
    return stripped.slice(0, max);
  };

  const rawPalette = Array.isArray(input.palette) ? input.palette : [];
  const palette: string[] = [];
  for (const candidate of rawPalette) {
    if (typeof candidate === 'string') {
      const hex = candidate.trim();
      if (HEX_PATTERN.test(hex) && !palette.includes(hex.toLowerCase())) palette.push(hex);
    }
    if (palette.length >= 5) break;
  }
  while (palette.length < 3) palette.push(PALETTE_PRESETS[0].colors[palette.length % PALETTE_PRESETS[0].colors.length]);

  const rawMotifs = Array.isArray(input.motifs) ? input.motifs : [];
  const motifs: MotifKind[] = [];
  for (const candidate of rawMotifs) {
    const kind = String(candidate).trim() as MotifKind;
    if (MOTIF_KINDS.includes(kind) && !motifs.includes(kind)) motifs.push(kind);
    if (motifs.length >= 4) break;
  }
  if (motifs.length === 0) motifs.push(...FALLBACK_MOTIFS);

  const bandCandidate = input.band == null ? null : (String(input.band).trim() as MotifKind);
  const band = bandCandidate && MOTIF_KINDS.includes(bandCandidate) ? bandCandidate : null;

  const layoutCandidate = String(input.layout || '').trim() as PatternLayout;
  const layout: PatternLayout = LAYOUTS.includes(layoutCandidate) ? layoutCandidate : 'allover';

  const densityRaw = Number(input.density);
  const density = Number.isFinite(densityRaw) ? Math.min(3, Math.max(1, Math.round(densityRaw))) : 2;

  const backgroundRaw = typeof input.background === 'string' ? input.background.trim() : '';
  const background = HEX_PATTERN.test(backgroundRaw) ? backgroundRaw : DEFAULT_BACKGROUND;

  const seedRaw = Number(input.seed);
  const seed = Number.isFinite(seedRaw) ? Math.abs(Math.trunc(seedRaw)) % 100000 : fallbackSeed;

  return {
    title: cleanText(input.title, 80, 'Hoa văn làng nghề'),
    story: cleanText(input.story, 400, 'Bộ hoa văn lấy cảm hứng từ mô típ truyền thống làng nghề Hà Nội.'),
    background,
    palette,
    motifs,
    band,
    layout,
    density,
    seed,
  };
}

/* -------------------------------------------------------------------------- */
/* 4. Bộ dựng họa tiết (mỗi họa tiết vẽ trong hộp 100×100)                    */
/* -------------------------------------------------------------------------- */

interface MotifColors {
  fill: string;
  stroke: string;
  accent: string;
}

function polar(cx: number, cy: number, r: number, angleRad: number): [number, number] {
  return [cx + r * Math.cos(angleRad), cy + r * Math.sin(angleRad)];
}

const n = (value: number) => Number(value.toFixed(2));

const MOTIF_DRAWERS: Record<MotifKind, (c: MotifColors) => string> = {
  sen: (c) => {
    const bx = 50;
    const by = 66;
    let petals = '';
    for (let i = 0; i < 7; i++) {
      const angle = -60 + i * 20;
      const len = i === 3 ? 48 : 38;
      petals +=
        `<path d="M${bx},${by} C${bx - 9},${n(by - len * 0.45)} ${bx - 7},${n(by - len * 0.82)} ${bx},${n(by - len)} ` +
        `C${bx + 7},${n(by - len * 0.82)} ${bx + 9},${n(by - len * 0.45)} ${bx},${by} Z" fill="${c.fill}" ` +
        `transform="rotate(${angle} ${bx} ${by})"/>`;
    }
    return (
      `<g>${petals}<ellipse cx="50" cy="52" rx="8" ry="12" fill="${c.stroke}"/>` +
      `<circle cx="50" cy="46" r="2.4" fill="${c.accent}"/><circle cx="45" cy="53" r="1.6" fill="${c.accent}"/>` +
      `<circle cx="55" cy="53" r="1.6" fill="${c.accent}"/></g>`
    );
  },

  'song-nuoc': (c) => {
    let d = '';
    for (let row = 0; row < 5; row++) {
      const y = 14 + row * 19;
      const offset = row % 2 === 0 ? 0 : 8;
      d += `M${-8 + offset},${y} `;
      for (let i = 0; i < 8; i++) d += 'q8,-10 16,0 ';
    }
    return `<path d="${d}" fill="none" stroke="${c.stroke}" stroke-width="3.4" stroke-linecap="round"/>`;
  },

  'may-co': (c) => (
    `<g fill="${c.fill}" stroke="${c.stroke}" stroke-width="3" stroke-linejoin="round">` +
    `<path d="M20,74 C6,74 3,57 17,54 C16,40 33,33 42,43 C47,31 66,31 70,44 C86,42 95,59 81,70 C74,75 66,75 60,73 Z"/>` +
    `</g><path d="M31,57 c7,0 9,9 2,12 -6,3 -10,-5 -5,-9" fill="none" stroke="${c.accent}" stroke-width="2.8" stroke-linecap="round"/>`
  ),

  rong: (c) => (
    `<path d="M6,84 C28,84 33,63 50,60 C68,57 74,43 66,32 C60,24 46,25 42,34" fill="none" stroke="${c.stroke}" stroke-width="7.5" stroke-linecap="round"/>` +
    `<circle cx="38" cy="29" r="7.5" fill="${c.fill}"/>` +
    `<path d="M31,24 L16,15 L34,31 Z" fill="${c.fill}"/>` +
    `<circle cx="40" cy="27" r="1.9" fill="${c.accent}"/>` +
    `<path d="M54,64 l12,-9 M63,49 l12,-5 M30,72 l-10,8" fill="none" stroke="${c.fill}" stroke-width="4.5" stroke-linecap="round"/>`
  ),

  'chim-lac': (c) => (
    `<g>` +
    `<path d="M46,58 C41,44 34,34 29,23" fill="none" stroke="${c.stroke}" stroke-width="5.5" stroke-linecap="round"/>` +
    `<circle cx="28" cy="21" r="5.5" fill="${c.stroke}"/>` +
    `<path d="M25,18 L4,7 L27,13 Z" fill="${c.stroke}"/>` +
    `<ellipse cx="52" cy="58" rx="17" ry="11.5" fill="${c.fill}" transform="rotate(-12 52 58)"/>` +
    `<path d="M46,50 C60,39 75,39 86,45 C73,48 62,55 50,61 Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2"/>` +
    `<path d="M66,65 C78,71 87,79 91,89 C78,83 68,77 60,71 Z" fill="${c.stroke}"/>` +
    `<path d="M50,68 L47,86 M57,68 L60,86" stroke="${c.stroke}" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`
  ),

  'trong-dong': (c) => {
    const points: string[] = [];
    const teeth = 14;
    for (let i = 0; i < teeth * 2; i++) {
      const r = i % 2 === 0 ? 26 : 12;
      const [x, y] = polar(50, 50, r, (Math.PI * i) / teeth - Math.PI / 2);
      points.push(`${n(x)},${n(y)}`);
    }
    let ticks = '';
    for (let i = 0; i < 32; i++) {
      const a = (Math.PI * 2 * i) / 32;
      const [x1, y1] = polar(50, 50, 31, a);
      const [x2, y2] = polar(50, 50, 38, a);
      ticks += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}"/>`;
    }
    return (
      `<g fill="none" stroke="${c.stroke}" stroke-width="2.4">` +
      `<circle cx="50" cy="50" r="46"/><circle cx="50" cy="50" r="41.5"/>${ticks}` +
      `<circle cx="50" cy="50" r="27.5"/><circle cx="50" cy="50" r="19"/>` +
      `<polygon points="${points.join(' ')}" fill="${c.fill}" stroke="none"/>` +
      `<circle cx="50" cy="50" r="5" fill="${c.accent}" stroke="none"/>` +
      `</g>`
    );
  },

  'hoa-chuoi': (c) => (
    `<g>` +
    `<path d="M50,10 C63,26 65,47 56,63 C50,75 43,75 39,63 C31,47 37,26 50,10 Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.4"/>` +
    `<path d="M37,33 q13,7 26,0 M35,45 q15,8 30,0 M37,57 q13,7 26,0" fill="none" stroke="${c.accent}" stroke-width="2.6"/>` +
    `<path d="M50,10 C48,30 48,50 50,72" fill="none" stroke="${c.stroke}" stroke-width="1.6" opacity="0.6"/>` +
    `</g>`
  ),

  tre: (c) => {
    const stalk = (x: number, height: number, halfWidth: number, nodeStep: number) => {
      let nodes = '';
      for (let y = 100 - height + nodeStep; y < 97; y += nodeStep) {
        nodes += `<line x1="${x - halfWidth}" y1="${n(y)}" x2="${x + halfWidth}" y2="${n(y)}" stroke="${c.accent}" stroke-width="2.2"/>`;
      }
      return `<rect x="${x - halfWidth}" y="${100 - height}" width="${halfWidth * 2}" height="${height}" rx="${halfWidth}" fill="${c.fill}"/>${nodes}`;
    };
    const leaf = (x: number, y: number, angle: number) =>
      `<ellipse cx="${x}" cy="${y}" rx="17" ry="4.4" transform="rotate(${angle} ${x} ${y})" fill="${c.stroke}"/>`;
    return `<g>${stalk(26, 80, 6, 17)}${stalk(56, 94, 5, 15)}${leaf(24, 22, -24)}${leaf(44, 40, 16)}${leaf(72, 28, -10)}${leaf(66, 62, 22)}</g>`;
  },

  'ca-chep': (c) => (
    `<g>` +
    `<path d="M16,52 C30,30 60,26 76,43 C83,50 83,56 76,63 C60,80 30,76 16,54 Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.6"/>` +
    `<path d="M78,52 C87,41 94,37 98,39 C93,47 91,57 97,65 C90,67 82,62 74,54 Z" fill="${c.stroke}"/>` +
    `<circle cx="33" cy="47" r="3" fill="${c.accent}"/>` +
    `<path d="M44,42 q11,9 0,19 M57,40 q11,11 0,22" fill="none" stroke="${c.accent}" stroke-width="2.2"/>` +
    `</g>`
  ),

  'nui-song': (c) => (
    `<g>` +
    `<path d="M0,74 L22,32 L38,58 L54,24 L74,60 L86,44 L100,74 Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M-6,84 q10,-9 20,0 t20,0 t20,0 t20,0 t20,0 t20,0" fill="none" stroke="${c.stroke}" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`
  ),

  'chuon-chuon': (c) => (
    `<g fill="${c.fill}" stroke="${c.stroke}" stroke-width="2.2" stroke-linejoin="round">` +
    `<ellipse cx="31" cy="38" rx="25" ry="7.5" transform="rotate(-26 31 38)"/>` +
    `<ellipse cx="69" cy="40" rx="25" ry="7.5" transform="rotate(26 69 40)"/>` +
    `<ellipse cx="33" cy="60" rx="21" ry="6.6" transform="rotate(20 33 60)"/>` +
    `<ellipse cx="67" cy="58" rx="21" ry="6.6" transform="rotate(-20 67 58)"/>` +
    `<rect x="47" y="38" width="6" height="52" rx="3"/>` +
    `<circle cx="50" cy="32" r="8.5"/>` +
    `<circle cx="47" cy="30" r="1.8" fill="${c.accent}" stroke="none"/><circle cx="53" cy="30" r="1.8" fill="${c.accent}" stroke="none"/>` +
    `</g>`
  ),

  'hoa-cuc': (c) => {
    let outer = '';
    for (let i = 0; i < 14; i++) {
      outer += `<ellipse cx="50" cy="23" rx="6" ry="20" transform="rotate(${n((360 / 14) * i)} 50 50)" fill="${c.fill}"/>`;
    }
    let inner = '';
    for (let i = 0; i < 10; i++) {
      inner += `<ellipse cx="50" cy="35" rx="5" ry="14" transform="rotate(${n((360 / 10) * i + 18)} 50 50)" fill="${c.stroke}"/>`;
    }
    return `<g>${outer}${inner}<circle cx="50" cy="50" r="10" fill="${c.accent}"/></g>`;
  },

  'vay-ca': (c) => {
    let out = '';
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        const x = col * 20 + (row % 2 ? 10 : 0);
        const y = row * 18 - 6;
        out += `<path d="M${x},${y + 18} a10,10 0 0 1 20,0" />`;
      }
    }
    return `<g fill="none" stroke="${c.stroke}" stroke-width="3.2" stroke-linecap="round">${out}</g>`;
  },

  'mat-troi': (c) => {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      const [x1, y1] = polar(50, 50, 16, a);
      const [x2, y2] = polar(50, 50, 42, a - 0.12);
      const [x3, y3] = polar(50, 50, 42, a + 0.12);
      rays += `<path d="M${n(x1)},${n(y1)} L${n(x2)},${n(y2)} L${n(x3)},${n(y3)} Z"/>`;
    }
    return `<g fill="${c.fill}">${rays}<circle cx="50" cy="50" r="17" fill="${c.stroke}"/><circle cx="50" cy="50" r="8" fill="${c.accent}"/></g>`;
  },

  sparkle: (c) => {
    const star = (cx: number, cy: number, r: number) =>
      `<path d="M${cx},${cy - r} L${cx + r * 0.22},${cy - r * 0.22} L${cx + r},${cy} L${cx + r * 0.22},${cy + r * 0.22} ` +
      `L${cx},${cy + r} L${cx - r * 0.22},${cy + r * 0.22} L${cx - r},${cy} L${cx - r * 0.22},${cy - r * 0.22} Z"/>`;
    return `<g fill="${c.fill}">${star(50, 50, 38)}</g><g fill="${c.accent}">${star(50, 50, 15)}</g>`;
  },
};

/* -------------------------------------------------------------------------- */
/* 5. Bố cục và dựng SVG                                                      */
/* -------------------------------------------------------------------------- */

interface Placement {
  kind: MotifKind;
  cx: number;
  cy: number;
  scale: number;
  rotate: number;
  colorIndex: number;
}

const CANVAS = 600;

/** Sinh số giả ngẫu nhiên ổn định theo hạt giống — cùng hạt giống luôn cho cùng bố cục. */
function makeRng(seed: number): () => number {
  let state = (seed || 1) >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function buildPlacements(spec: PatternSpec): Placement[] {
  const rng = makeRng(spec.seed);
  const motifs = spec.motifs.length ? spec.motifs : FALLBACK_MOTIFS;
  const density = Math.min(3, Math.max(1, spec.density));
  const list: Placement[] = [];
  const pick = (i: number) => motifs[i % motifs.length];

  if (spec.layout === 'radial') {
    list.push({ kind: pick(0), cx: 300, cy: 300, scale: 2.5, rotate: 0, colorIndex: 0 });
    list.push({ kind: pick(1), cx: 300, cy: 300, scale: 1.5, rotate: 22, colorIndex: 1 });
    const rings = [
      { count: 8, radius: 172, scale: 0.95 },
      { count: 12, radius: 256, scale: 0.72 },
    ].slice(0, density);
    rings.forEach((ring, ringIndex) => {
      for (let i = 0; i < ring.count; i++) {
        const angle = (Math.PI * 2 * i) / ring.count + ringIndex * 0.26;
        list.push({
          kind: pick(i + ringIndex + 1),
          cx: 300 + ring.radius * Math.cos(angle),
          cy: 300 + ring.radius * Math.sin(angle),
          scale: ring.scale,
          rotate: (angle * 180) / Math.PI + 90,
          colorIndex: i + ringIndex,
        });
      }
    });
    return list;
  }

  if (spec.layout === 'bands') {
    const rows = [3, 4, 5][density - 1];
    const cols = [4, 6, 8][density - 1];
    const rowHeight = CANVAS / rows;
    const step = CANVAS / cols;
    const scale = Math.min(rowHeight / 118, step / 118);
    for (let row = 0; row < rows; row++) {
      const offset = row % 2 === 0 ? 0 : step / 2;
      const count = row % 2 === 0 ? cols : cols + 1;
      for (let col = 0; col < count; col++) {
        list.push({
          kind: pick(row),
          cx: col * step + step / 2 + offset,
          cy: row * rowHeight + rowHeight / 2,
          scale,
          rotate: 0,
          colorIndex: row + col,
        });
      }
    }
    return list;
  }

  if (spec.layout === 'center') {
    list.push({ kind: pick(0), cx: 300, cy: 300, scale: 3.1, rotate: 0, colorIndex: 0 });
    const corners: [number, number][] = [
      [118, 118],
      [482, 118],
      [118, 482],
      [482, 482],
    ];
    corners.forEach(([cx, cy], index) => {
      list.push({ kind: pick(index + 1), cx, cy, scale: 0.85, rotate: index * 90, colorIndex: index + 1 });
      if (density >= 2) list.push({ kind: pick(index + 1), cx, cy, scale: 0.5, rotate: index * 90 + 45, colorIndex: index + 2 });
    });
    return list;
  }

  // allover — lưới so le, có nhiễu nhẹ để trông thủ công hơn.
  const rows = [2, 3, 4][density - 1];
  const cols = [3, 4, 5][density - 1];
  const stepX = CANVAS / cols;
  const stepY = CANVAS / rows;
  const scale = Math.min(stepX / 150, stepY / 150) * 1.35;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const jitterX = (rng() - 0.5) * stepX * 0.18;
      const jitterY = (rng() - 0.5) * stepY * 0.18;
      const offset = row % 2 === 0 ? 0 : stepX / 2;
      list.push({
        kind: pick(row * 2 + col),
        cx: col * stepX + stepX / 2 + offset + jitterX,
        cy: row * stepY + stepY / 2 + jitterY,
        scale: scale * (0.86 + rng() * 0.28),
        rotate: spec.layout === 'allover' ? (rng() - 0.5) * 26 : 0,
        colorIndex: row + col,
      });
    }
  }
  return list;
}

function renderPlacement(placement: Placement, colors: string[]): string {
  const fill = colors[placement.colorIndex % colors.length];
  const stroke = colors[(placement.colorIndex + 1) % colors.length];
  const accent = colors[(placement.colorIndex + 2) % colors.length];
  const transform =
    `translate(${n(placement.cx)} ${n(placement.cy)}) scale(${n(placement.scale)}) translate(-50 -50) ` +
    `rotate(${n(placement.rotate)} 50 50)`;
  return `<g transform="${transform}">${MOTIF_DRAWERS[placement.kind]({ fill, stroke, accent })}</g>`;
}

export interface RenderOptions {
  /** Kích thước cạnh của SVG (mặc định 600). */
  size?: number;
  /** Vẽ thêm một lớp nền mờ để trông như men/ lụa thay vì nền phẳng. */
  texture?: boolean;
}

/**
 * Dựng SVG hoàn chỉnh từ đặc tả.
 *
 * Bố cục được chọn sao cho hoa văn LẶP LIỀN MẠCH theo chiều ngang: bước lặp luôn chia hết cho
 * chiều rộng khung, nhờ đó khi dán lên mặt trụ (bình gốm, thân nón, khăn lụa) không thấy đường nối.
 */
export function renderPatternSvg(spec: PatternSpec, options: RenderOptions = {}): string {
  const size = options.size && options.size > 0 ? options.size : CANVAS;
  const texture = options.texture !== false;
  const background = spec.background || DEFAULT_BACKGROUND;
  const rawColors = spec.palette.length ? spec.palette : PALETTE_PRESETS[0].colors;
  const colors = rawColors.map((color) => ensureContrast(color, background));

  const backdrop = texture
    ? `<rect width="${CANVAS}" height="${CANVAS}" fill="${background}"/>` +
      `<rect width="${CANVAS}" height="${CANVAS}" fill="url(#paperGrain)" opacity="0.32"/>`
    : `<rect width="${CANVAS}" height="${CANVAS}" fill="${background}"/>`;

  const defs =
    `<defs><filter id="paperGrain" x="0" y="0" width="100%" height="100%">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>` +
    `<feColorMatrix type="saturate" values="0"/></filter></defs>`;

  const placements = buildPlacements(spec);
  // Vẽ thêm bản sao lệch ±600 để hoa văn gần mép vẫn liền mạch khi quấn quanh mặt trụ.
  const wrapped = placements.flatMap((placement) => [
    placement,
    { ...placement, cx: placement.cx - CANVAS },
    { ...placement, cx: placement.cx + CANVAS },
  ]);
  const body = wrapped.map((placement) => renderPlacement(placement, colors)).join('');

  let band = '';
  if (spec.band) {
    const bandKind = spec.band;
    const tile = 60;
    const count = CANVAS / tile;
    const drawBand = (y: number, indexBase: number) => {
      let out = '';
      for (let i = 0; i < count; i++) {
        const colorsForTile: MotifColors = {
          fill: colors[(i + indexBase) % colors.length],
          stroke: colors[(i + indexBase + 1) % colors.length],
          accent: colors[(i + indexBase + 2) % colors.length],
        };
        out += `<g transform="translate(${n(i * tile + tile / 2)} ${n(y + tile / 2)}) scale(0.5) translate(-50 -50)">${MOTIF_DRAWERS[bandKind](colorsForTile)}</g>`;
      }
      return out;
    };
    band =
      `<g opacity="0.95">${drawBand(6, 0)}${drawBand(CANVAS - tile - 6, 1)}</g>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" width="${size}" height="${size}" ` +
    `role="img" aria-label="${escapeXml(spec.title)}">` +
    `${defs}${backdrop}${body}${band}</svg>`
  );
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Đóng gói SVG thành data URI để dùng làm ảnh nền / ảnh trong thẻ <img>. */
export function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/* -------------------------------------------------------------------------- */
/* 6. Động cơ sáng tác ngoại tuyến (không cần mạng)                           */
/* -------------------------------------------------------------------------- */

const PROMPT_MOTIF_MAP: { words: string[]; motif: MotifKind }[] = [
  { words: ['sen', 'lotus', 'phật', 'chùa', 'thanh tịnh'], motif: 'sen' },
  { words: ['sóng', 'nước', 'biển', 'sông', 'hồ', 'thuỷ'], motif: 'song-nuoc' },
  { words: ['mây', 'trời', 'gió'], motif: 'may-co' },
  { words: ['rồng', 'long', 'vua', 'hoàng gia'], motif: 'rong' },
  { words: ['chim', 'cò', 'hạc', 'lạc', 'muôn loài'], motif: 'chim-lac' },
  { words: ['trống đồng', 'đông sơn', 'mặt trống', 'cồng chiêng'], motif: 'trong-dong' },
  { words: ['chuối', 'búp', 'vườn'], motif: 'hoa-chuoi' },
  { words: ['tre', 'trúc', 'nứa', 'làng quê'], motif: 'tre' },
  { words: ['cá', 'chép', 'koi', 'long lanh'], motif: 'ca-chep' },
  { words: ['núi', 'non', 'sơn thuỷ', 'phong cảnh'], motif: 'nui-song' },
  { words: ['chuồn chuồn', 'tuổi thơ', 'đồ chơi'], motif: 'chuon-chuon' },
  { words: ['cúc', 'hoa', 'mùa thu', 'vườn hoa'], motif: 'hoa-cuc' },
  { words: ['vảy', 'khảm', 'chạm', 'khắc', 'gỗ', 'sơn mài'], motif: 'vay-ca' },
  { words: ['mặt trời', 'nắng', 'ánh sáng', 'tia'], motif: 'mat-troi' },
  { words: ['xà cừ', 'lấp lánh', 'ngọc', 'trai'], motif: 'sparkle' },
];

const PROMPT_PALETTE_MAP: { words: string[]; paletteId: string }[] = [
  { words: ['gốm', 'sứ', 'bát tràng', 'men'], paletteId: 'men-ngoc' },
  { words: ['lam', 'cổ điển', 'trắng xanh'], paletteId: 'men-lam' },
  { words: ['đất nung', 'mộc', 'nâu', 'terracotta'], paletteId: 'dat-nung' },
  { words: ['sơn mài', 'đỏ', 'thếp vàng', 'lacquer'], paletteId: 'son-mai' },
  { words: ['lụa', 'tơ tằm', 'vàng', 'sang trọng'], paletteId: 'lua-vang' },
  { words: ['xà cừ', 'trai', 'ốc', 'bạc'], paletteId: 'oc-xa-cu' },
  { words: ['tre', 'mây', 'xanh lá', 'sống xanh'], paletteId: 'xanh-tre' },
  { words: ['nón', 'giấy dó', 'mộc mạc', 'ngà'], paletteId: 'trang-nga' },
  { words: ['hồng', 'lãng mạn', 'hoa sen'], paletteId: 'hong-sen' },
  { words: ['tím', 'hoa cà', 'mộng mơ'], paletteId: 'tim-hoa-ca' },
];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export interface DraftInput {
  prompt: string;
  /** Gợi ý từ phôi: màu nền và họa tiết mặc định của làng nghề. */
  defaultPaletteId?: string;
  defaultMotifs?: MotifKind[];
  seed?: number;
}

/**
 * Động cơ ngoại tuyến: đọc từ khoá trong câu mô tả rồi ghép thành một đặc tả hợp lệ.
 * Dùng khi chưa cấu hình được khoá AI, hoặc khi nhà cung cấp AI tạm lỗi — khách vẫn luôn có kết quả.
 */
export function draftPatternSpec(input: DraftInput): PatternSpec {
  const prompt = (input.prompt || '').toLowerCase();
  const seed = input.seed ?? hashString(input.prompt || 'lang-nghe');

  const matchedMotifs: MotifKind[] = [];
  for (const entry of PROMPT_MOTIF_MAP) {
    if (entry.words.some((word) => prompt.includes(word)) && !matchedMotifs.includes(entry.motif)) {
      matchedMotifs.push(entry.motif);
    }
  }
  if (matchedMotifs.length === 0 && input.defaultMotifs?.length) matchedMotifs.push(...input.defaultMotifs);
  if (matchedMotifs.length === 0) matchedMotifs.push(...FALLBACK_MOTIFS);

  let paletteId = input.defaultPaletteId || DEFAULT_PALETTE_ID;
  for (const entry of PROMPT_PALETTE_MAP) {
    if (entry.words.some((word) => prompt.includes(word))) {
      paletteId = entry.paletteId;
      break;
    }
  }
  const preset = paletteById(paletteId);

  const density = /dày|rậm|nhiều|kín|chi tiết/.test(prompt) ? 3 : /thưa|tối giản|thanh thoát|đơn giản/.test(prompt) ? 1 : 2;
  const layout: PatternLayout = /đĩa|tròn|mặt trống|đồng tâm|khay/.test(prompt)
    ? 'radial'
    : /khăn|dải|băng|sọc|viền|dệt/.test(prompt)
      ? 'bands'
      : /tranh|kỷ niệm|trung tâm|chủ thể|giữa/.test(prompt)
        ? 'center'
        : 'allover';

  const themes = matchedMotifs.slice(0, 2).map((kind) => motifName(kind).toLowerCase());
  const title = themes.length ? `${themes.join(' & ')}` : 'Hoa văn làng nghề';

  return normalizePatternSpec(
    {
      title: `Bộ hoa văn ${title}`,
      story:
        `Lấy cảm hứng từ ${themes.join(' và ') || 'mô típ truyền thống'}, phối trên nền ${preset.name.toLowerCase()}. ` +
        `Bố cục ${LAYOUT_META[layout].name.toLowerCase()} với mật độ ${density === 1 ? 'thưa, thanh thoát' : density === 3 ? 'dày, nhiều lớp' : 'vừa phải'}.`,
      background: preset.background,
      palette: preset.colors,
      motifs: matchedMotifs.slice(0, 3),
      band: density >= 2 ? matchedMotifs[matchedMotifs.length - 1] : null,
      layout,
      density,
      seed,
    },
    seed
  );
}

/* -------------------------------------------------------------------------- */
/* 7. Phiếu kỹ thuật gửi nghệ nhân                                            */
/* -------------------------------------------------------------------------- */

export interface SpecSheetLine {
  label: string;
  value: string;
}

/**
 * Phiếu kỹ thuật đọc được — phần cốt lõi của "đặt làm theo yêu cầu".
 * Nghệ nhân nhận bản mô tả bằng chữ để chép lại bằng tay, không chỉ một tấm ảnh.
 */
export function buildSpecSheet(spec: PatternSpec, blankLabel: string, sizeLabel: string): SpecSheetLine[] {
  return [
    { label: 'Phôi', value: blankLabel },
    { label: 'Kích thước', value: sizeLabel },
    { label: 'Tên bộ hoa văn', value: spec.title },
    { label: 'Họa tiết chính', value: spec.motifs.map(motifName).join(', ') },
    { label: 'Họa tiết viền', value: spec.band ? motifName(spec.band) : 'Không viền' },
    { label: 'Lối bố cục', value: `${LAYOUT_META[spec.layout].name} — ${LAYOUT_META[spec.layout].note}` },
    { label: 'Mật độ', value: spec.density === 1 ? 'Thưa (1)' : spec.density === 2 ? 'Vừa (2)' : 'Dày (3)' },
    {
      label: 'Màu nền',
      value: `${colorName(spec.background)} (${spec.background.toUpperCase()})`,
    },
    {
      label: 'Màu hoạ tiết',
      value: spec.palette.map((hex) => `${colorName(hex)} ${hex.toUpperCase()}`).join(' · '),
    },
  ];
}
