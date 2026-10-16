/**
 * Sáng tác hoa văn bằng AI (phía máy chủ).
 *
 * Cách làm và lý do:
 *  - Mô hình ngôn ngữ KHÔNG vẽ ra ảnh điểm, mà đưa ra ĐẶC TẢ có cấu trúc: tên bộ hoa văn, câu chuyện,
 *    bảng màu, danh sách hoạ tiết, lối bố cục và mật độ. Bộ dựng vector ở lib/patternStudio.ts biến
 *    đặc tả đó thành hình vẽ.
 *  - Nhờ vậy kết quả luôn sắc nét ở mọi kích thước, nhẹ vài KB, và quan trọng nhất là ĐỌC ĐƯỢC:
 *    nghệ nhân nhận bản mô tả bằng chữ để chép lại bằng tay chứ không chỉ một tấm ảnh.
 *  - Mô hình ảnh (diffusion/Imagen) cần hạn mức trả phí nên không dùng làm đường chính; khi chưa có
 *    khoá hoặc nhà cung cấp lỗi, động cơ ngoại tuyến trong patternStudio.ts vẫn cho ra kết quả.
 */

import {
  draftPatternSpec,
  LAYOUTS,
  LAYOUT_META,
  MOTIF_CATALOG,
  MOTIF_KINDS,
  normalizePatternSpec,
  PALETTE_PRESETS,
  type PatternSpec,
} from '@/lib/patternStudio';
import type { CraftBlank } from '@/lib/craftBlanks';

/** Danh sách mô hình theo thứ tự ưu tiên — giống lib/craftAiEngine.ts để cấu hình khoá là dùng được cả hai. */
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-flash-latest',
];

const REQUEST_TIMEOUT_MS = 25_000;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    story: { type: 'STRING' },
    background: { type: 'STRING' },
    palette: { type: 'ARRAY', items: { type: 'STRING' } },
    motifs: { type: 'ARRAY', items: { type: 'STRING', enum: MOTIF_KINDS } },
    band: { type: 'STRING', enum: [...MOTIF_KINDS, 'none'] },
    layout: { type: 'STRING', enum: LAYOUTS },
    density: { type: 'INTEGER' },
  },
  required: ['title', 'story', 'background', 'palette', 'motifs', 'layout', 'density'],
} as const;

function buildSystemPrompt(): string {
  return [
    'Viết tiếng Việt CÓ DẤU ĐẦY ĐỦ trong mọi trường văn bản (title, story). Không viết tiếng Việt không dấu.',
    '',
    'Bạn là nghệ nhân thiết kế hoa văn truyền thống Việt Nam, làm việc cho nền tảng "Lang Thang" —',
    'nền tảng làng nghề Hà Nội. Khách hàng mô tả ý tưởng bằng lời, bạn chuyển thành một BỘ HOA VĂN',
    'có cấu trúc để nghệ nhân chép lại bằng tay.',
    '',
    'NGUYÊN TẮC SÁNG TÁC:',
    '1. Hoa văn phải đậm chất Việt Nam, lấy từ mô típ dân gian có thật (hoa sen, sóng nước, mây cổ,',
    '   rồng thời Lý, chim Lạc, trống đồng Đông Sơn, hoa chuối, tre trúc, cá chép, núi sông, chuồn chuồn tre,',
    '   hoa cúc, vân vảy cá, mặt trời, ánh xà cừ). KHÔNG bịa mô típ ngoài danh mục được cấp.',
    '2. Bảng màu phải hợp chất liệu của phôi: men gốm thì xanh ngọc/lam, sơn mài thì son đỏ thếp vàng,',
    '   lụa thì vàng tơ tằm hoặc hồng sen, nón lá thì trắng ngà, khảm trai thì ánh xà cừ.',
    '3. Chọn 2–4 hoạ tiết chính đủ để tạo nhịp điệu, tránh nhồi nhét. Họa tiết viền chọn 1 hoặc để "none".',
    '4. "title" ngắn gọn, giàu hình ảnh (ví dụ: "Sen nở trên sóng nước").',
    '5. "story" 1–2 câu tiếng Việt kể ý nghĩa văn hoá của bộ hoa văn, giọng trang nhã, không sáo rỗng.',
    '6. Mã màu ghi đúng định dạng #RRGGBB. "palette" từ 3 đến 5 màu, đặt màu chủ đạo lên đầu.',
    '7. "background" là màu nền phôi, phải khác rõ với các màu hoạ tiết để hoa văn nổi lên.',
    '',
    'BỐ CỤC ĐƯỢC PHÉP:',
    ...LAYOUTS.map((layout) => `- ${layout}: ${LAYOUT_META[layout].note}`),
    '',
    'Chỉ trả về JSON đúng lược đồ, không thêm lời giải thích.',
  ].join('\n');
}

function buildUserPrompt(params: { prompt: string; blank: CraftBlank; sizeLabel: string }): string {
  const motifList = MOTIF_CATALOG.map((motif) => `${motif.kind} (${motif.name}: ${motif.meaning})`).join('\n');
  const paletteList = PALETTE_PRESETS.map((preset) => `${preset.id}: ${preset.name} — nền ${preset.background}, màu ${preset.colors.join(' ')}`).join('\n');

  return [
    `PHÔI: ${params.blank.name} (${params.blank.villageName})`,
    `CHẤT LIỆU: ${params.blank.material}`,
    `KÍCH THƯỚC: ${params.sizeLabel}`,
    `KỸ THUẬT CHUYỂN HOA VĂN: ${params.blank.technique}`,
    `GỢI Ý HƯỚNG: ${params.blank.defaultMotifs.join(', ')}`,
    '',
    'Ý TƯỞNG CỦA KHÁCH HÀNG:',
    `"""${params.prompt.trim()}"""`,
    '',
    'DANH MỤC HOẠ TIẾT ĐƯỢC PHÉP (dùng đúng mã tiếng Anh trong ngoặc):',
    motifList,
    '',
    'BẢNG MÀU GỢI Ý SẴN CÓ (có thể dùng nguyên hoặc sáng tạo bảng màu mới hợp chất liệu):',
    paletteList,
    '',
    'Hãy trả về JSON mô tả bộ hoa văn cho phôi này.',
  ].join('\n');
}

export interface PatternGenerationResult {
  spec: PatternSpec;
  engine: 'gemini-cloud-ai' | 'local-artisan-engine';
  modelUsed?: string;
  /** Ghi chú hiển thị cho người dùng khi phải dùng động cơ ngoại tuyến. */
  notice?: string;
}

/**
 * Sinh đặc tả hoa văn. Luôn trả về kết quả dùng được: nếu AI lỗi, chuyển sang động cơ ngoại tuyến.
 */
export async function generatePatternSpec(params: {
  prompt: string;
  blank: CraftBlank;
  sizeLabel: string;
  seed: number;
  userApiKey?: string;
}): Promise<PatternGenerationResult> {
  const fallback = () =>
    draftPatternSpec({
      prompt: params.prompt,
      defaultPaletteId: params.blank.defaultPaletteId,
      defaultMotifs: params.blank.defaultMotifs,
      seed: params.seed,
    });

  const activeKey = (params.userApiKey || process.env.GEMINI_API_KEY || '').trim();
  if (!activeKey || activeKey.length <= 10) {
    return {
      spec: fallback(),
      engine: 'local-artisan-engine',
      notice: 'Chưa cấu hình khoá AI dùng chung nên hoa văn được dựng bằng động cơ nghệ nhân ngoại tuyến.',
    };
  }

  const body = JSON.stringify({
    system_instruction: { parts: [{ text: buildSystemPrompt() }] },
    contents: [{ role: 'user', parts: [{ text: buildUserPrompt(params) }] }],
    generationConfig: {
      temperature: 1.1,
      maxOutputTokens: 1024,
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  let lastError = '';
  for (const model of CANDIDATE_MODELS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(activeKey)}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal: controller.signal }
      );

      if (!res.ok) {
        lastError = `HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = 'Mô hình trả về nội dung rỗng.';
        continue;
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        lastError = 'Mô hình trả về JSON không hợp lệ.';
        continue;
      }

      const spec = normalizePatternSpec({ ...(parsed as Record<string, unknown>), seed: params.seed }, params.seed);
      return { spec, engine: 'gemini-cloud-ai', modelUsed: model };
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Lỗi không xác định.';
    } finally {
      clearTimeout(timer);
    }
  }

  console.warn('[patternAi] Không gọi được mô hình AI, dùng động cơ ngoại tuyến. Lý do cuối:', lastError);
  return {
    spec: fallback(),
    engine: 'local-artisan-engine',
    notice: `Nhà cung cấp AI tạm thời không phản hồi (${lastError || 'không rõ lý do'}), hoa văn được dựng bằng động cơ nghệ nhân ngoại tuyến.`,
  };
}
