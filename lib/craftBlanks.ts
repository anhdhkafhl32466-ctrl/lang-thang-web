/**
 * Phôi sản phẩm của xưởng đồng sáng tạo.
 *
 * Mỗi phôi gắn chặt với MỘT làng nghề cụ thể trên sàn: gốm Bát Tràng, lụa Vạn Phúc, nón Làng Chuông,
 * tranh khắc gỗ Hạ Thái. Nhờ vậy bản thiết kế do khách và AI cùng tạo ra luôn được gửi tới đúng
 * nghệ nhân có tay nghề làm ra nó, thay vì một cửa hàng bất kỳ.
 *
 * Tệp này chỉ chứa dữ liệu thuần — dùng được ở cả máy chủ lẫn trình duyệt.
 */

import type { MotifKind } from '@/lib/patternStudio';

export type BlankId = 'gom' | 'lua' | 'non-la' | 'tranh-khac-go';

export const BLANK_IDS: BlankId[] = ['gom', 'lua', 'non-la', 'tranh-khac-go'];

/** Cách dán hoa văn lên phôi trong ô xem trước. */
export interface BlankShape {
  /**
   * cylinder: mặt trụ tròn (bình gốm) — hoa văn quấn quanh thân.
   * cone: mặt nón (nón lá) — hoa văn quấn quanh vành.
   * panel: mặt phẳng (khăn lụa, tranh khắc gỗ) — hoa văn trải thẳng.
   */
  kind: 'cylinder' | 'cone' | 'panel';
  /** Đường viền phôi trong khung toạ độ 0 0 100 140. */
  outline: string;
  /** Vùng dán hoa văn trong cùng khung toạ độ (dùng để cắt). */
  clip: string;
  /** Khung bao của vùng dán — cần để tính vị trí cuốn hoa văn quanh phôi. */
  clipBox: { x: number; y: number; w: number; h: number };
  /**
   * Lớp sáng tối vẽ đè lên hoa văn để tạo cảm giác mặt cong.
   * Để dạng dữ liệu (chứ không phải chuỗi SVG) để giao diện dựng bằng JSX thuần.
   */
  shadingStops: { offset: string; color: string; opacity: number }[];
  /** Hướng gradient của lớp sáng tối. */
  shadingAxis: 'horizontal' | 'vertical';
  /** Chiều rộng tương đối của vùng nhìn thấy so với một vòng hoa văn (0.3–1). */
  visibleRatio: number;
}

export interface BlankSize {
  id: string;
  label: string;
  note: string;
  /** Giá tham khảo để gợi ý cho nghệ nhân, tính bằng đồng. */
  basePrice: number;
  /** Số ngày làm dự kiến. */
  prepDays: number;
}

export interface CraftBlank {
  id: BlankId;
  name: string;
  /** Tên ngắn dùng trên nút chọn phôi. */
  shortName: string;
  /** Làng nghề đảm nhận phôi này (slug trong data/craftVillages.ts). */
  villageSlug: string;
  villageName: string;
  material: string;
  /** Kỹ thuật mà nghệ nhân sẽ dùng để chuyển hoa văn lên phôi. */
  technique: string;
  defaultPaletteId: string;
  defaultMotifs: MotifKind[];
  sizes: BlankSize[];
  /** Gợi ý bấm nhanh trong ô nhập ý tưởng. */
  promptHints: string[];
  shape: BlankShape;
}

export const CRAFT_BLANKS: CraftBlank[] = [
  {
    id: 'gom',
    name: 'Gốm sứ Bát Tràng',
    shortName: 'Gốm',
    villageSlug: 'bat-trang',
    villageName: 'Làng gốm Bát Tràng',
    material: 'Đất sét trắng Bát Tràng, tráng men',
    technique: 'Vẽ tay dưới men (vẽ lam / vẽ nâu) hoặc đắp nổi rồi tráng men rạn',
    defaultPaletteId: 'men-ngoc',
    defaultMotifs: ['sen', 'song-nuoc', 'may-co'],
    sizes: [
      { id: 'binh-nho', label: 'Bình hoa nhỏ', note: 'Cao ~22cm, đường kính thân ~14cm', basePrice: 620000, prepDays: 12 },
      { id: 'am-chen', label: 'Bộ ấm chén', note: 'Bộ 6 chén + 1 ấm, men toàn thân', basePrice: 1450000, prepDays: 15 },
      { id: 'dia-ky-niem', label: 'Đĩa kỷ niệm', note: 'Đường kính ~26cm, có thể ghi tên và ngày', basePrice: 890000, prepDays: 10 },
    ],
    promptHints: [
      'Hoa sen nở trên sóng nước, men ngọc thanh khiết',
      'Rồng thời Lý uốn khúc quanh thân bình, men lam cổ điển',
      'Đàn cá chép bơi giữa rong nước, men xanh ngọc non',
    ],
    shape: {
      kind: 'cylinder',
      outline:
        'M39,8 L61,8 C61,8 61,19 65,25 C75,40 83,60 81,86 C79,111 68,125 60,133 L40,133 C32,125 21,111 19,86 C17,60 25,40 35,25 C39,19 39,8 39,8 Z',
      clip: 'M22,26 L78,26 Q84,26 84,34 L84,124 Q84,132 78,132 L22,132 Q16,132 16,124 L16,34 Q16,26 22,26 Z',
      clipBox: { x: 20, y: 30, w: 60, h: 100 },
      shadingAxis: 'horizontal',
      shadingStops: [
        { offset: '0%', color: '#000000', opacity: 0.34 },
        { offset: '16%', color: '#000000', opacity: 0.1 },
        { offset: '38%', color: '#ffffff', opacity: 0.26 },
        { offset: '62%', color: '#ffffff', opacity: 0.1 },
        { offset: '86%', color: '#000000', opacity: 0.18 },
        { offset: '100%', color: '#000000', opacity: 0.4 },
      ],
      visibleRatio: 0.62,
    },
  },
  {
    id: 'lua',
    name: 'Lụa tơ tằm Vạn Phúc',
    shortName: 'Lụa',
    villageSlug: 'van-phuc',
    villageName: 'Làng lụa Vạn Phúc',
    material: 'Lụa tơ tằm Vạn Phúc dệt thoi',
    technique: 'Nhuộm vẽ thủ công hoặc dệt hoa nổi theo bản vẽ — mỗi khăn một bản độc bản',
    defaultPaletteId: 'lua-vang',
    defaultMotifs: ['song-nuoc', 'hoa-cuc', 'may-co'],
    sizes: [
      { id: 'khan-55', label: 'Khăn vuông 55cm', note: 'Khăn nhỏ dùng hàng ngày', basePrice: 480000, prepDays: 8 },
      { id: 'khan-90', label: 'Khăn vuông 90cm', note: 'Khăn quàng cổ, dệt viền hoa văn', basePrice: 1150000, prepDays: 12 },
      { id: 'khan-120', label: 'Khăn lớn 120cm', note: 'Khăn trang trí / choàng lớn', basePrice: 2100000, prepDays: 16 },
    ],
    promptHints: [
      'Dải sóng nước sông Hồng chạy ngang, sắc vàng tơ tằm',
      'Vườn hoa cúc mùa thu Tây Tựu rải đều trên nền lụa trắng ngà',
      'Mây cổ xoắn và chim Lạc bay, tông màu đỏ son truyền thống',
    ],
    shape: {
      kind: 'panel',
      outline: 'M16,22 Q50,16 84,22 L84,118 Q50,124 16,118 Z',
      clip: 'M20,26 Q50,20 80,26 L80,114 Q50,120 20,114 Z',
      clipBox: { x: 20, y: 24, w: 60, h: 92 },
      shadingAxis: 'horizontal',
      shadingStops: [
        { offset: '0%', color: '#000000', opacity: 0.16 },
        { offset: '12%', color: '#000000', opacity: 0.05 },
        { offset: '42%', color: '#ffffff', opacity: 0.24 },
        { offset: '70%', color: '#ffffff', opacity: 0.08 },
        { offset: '100%', color: '#000000', opacity: 0.14 },
      ],
      visibleRatio: 1,
    },
  },
  {
    id: 'non-la',
    name: 'Nón lá Làng Chuông',
    shortName: 'Nón lá',
    villageSlug: 'chuong',
    villageName: 'Làng nón Chuông',
    material: 'Lá cọ non, nan tre chuốt, vành nón khâu tay',
    technique: 'Xếp lá theo bản vẽ rồi khâu chìm lụi — hoa văn hiện lên khi soi nắng',
    defaultPaletteId: 'trang-nga',
    defaultMotifs: ['chim-lac', 'song-nuoc', 'tre'],
    sizes: [
      { id: 'non-thuong', label: 'Nón thường', note: 'Đường kính ~48cm', basePrice: 260000, prepDays: 7 },
      { id: 'non-bai-tho', label: 'Nón bài thơ', note: 'Có chữ và hoa văn khâu chìm, soi nắng mới thấy', basePrice: 540000, prepDays: 10 },
      { id: 'non-quai-thao', label: 'Nón quai thao', note: 'Nón rộng vành kèm quai thao dệt', basePrice: 780000, prepDays: 12 },
    ],
    promptHints: [
      'Chim Lạc bay trên sóng nước, khâu chìm trên nón bài thơ',
      'Tre trúc xanh mát và mây cổ, tông trắng ngà mộc mạc',
      'Vân vảy cá chạy quanh vành nón, viền sóng nước',
    ],
    shape: {
      kind: 'cone',
      outline: 'M50,6 L15,118 Q50,132 85,118 Z',
      clip: 'M50,14 L22,114 Q50,126 78,114 Z',
      clipBox: { x: 22, y: 14, w: 56, h: 112 },
      shadingAxis: 'horizontal',
      shadingStops: [
        { offset: '0%', color: '#000000', opacity: 0.3 },
        { offset: '30%', color: '#ffffff', opacity: 0.24 },
        { offset: '70%', color: '#000000', opacity: 0.08 },
        { offset: '100%', color: '#000000', opacity: 0.32 },
      ],
      visibleRatio: 0.9,
    },
  },
  {
    id: 'tranh-khac-go',
    name: 'Tranh khắc gỗ — sơn mài Hạ Thái',
    shortName: 'Tranh khắc gỗ',
    villageSlug: 'ha-thai',
    villageName: 'Làng sơn mài Hạ Thái',
    material: 'Gỗ mít khắc nổi, sơn ta, lá vàng và vỏ trứng',
    technique: 'Khắc nổi theo bản vẽ rồi sơn ta nhiều lớp, mài nước và dát vàng theo từng mảng hoạ tiết',
    defaultPaletteId: 'son-mai',
    defaultMotifs: ['vay-ca', 'rong', 'mat-troi'],
    sizes: [
      { id: 'tranh-30', label: 'Tranh nhỏ 30×40cm', note: 'Treo bàn làm việc', basePrice: 1750000, prepDays: 18 },
      { id: 'tranh-50', label: 'Tranh vừa 50×70cm', note: 'Treo phòng khách nhỏ', basePrice: 3400000, prepDays: 25 },
      { id: 'tranh-80', label: 'Tranh lớn 80×120cm', note: 'Tranh khổ lớn, nhiều lớp dát vàng', basePrice: 6800000, prepDays: 35 },
    ],
    promptHints: [
      'Trống đồng Đông Sơn với ngôi sao nhiều cánh, sơn đỏ thếp vàng',
      'Rồng cuộn mây cổ trên nền sơn mài đen, dát vàng lá',
      'Vân vảy cá chạm nổi và đốm xà cừ lấp lánh',
    ],
    shape: {
      kind: 'panel',
      outline: 'M10,10 L90,10 L90,130 L10,130 Z',
      clip: 'M18,18 L82,18 L82,122 L18,122 Z',
      clipBox: { x: 18, y: 18, w: 64, h: 104 },
      shadingAxis: 'vertical',
      shadingStops: [
        { offset: '0%', color: '#ffffff', opacity: 0.18 },
        { offset: '55%', color: '#000000', opacity: 0.05 },
        { offset: '100%', color: '#000000', opacity: 0.24 },
      ],
      visibleRatio: 1,
    },
  },
];

export function blankById(id: string | null | undefined): CraftBlank | null {
  if (!id) return null;
  return CRAFT_BLANKS.find((blank) => blank.id === id) || null;
}

export function blankSizeById(blank: CraftBlank, sizeId: string | null | undefined): BlankSize | null {
  if (!sizeId) return null;
  return blank.sizes.find((size) => size.id === sizeId) || null;
}

/** Định dạng giá tiền Việt Nam cho phiếu kỹ thuật và bảng báo giá. */
export function formatVnd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  return `${Math.round(Number(value)).toLocaleString('vi-VN')}đ`;
}
