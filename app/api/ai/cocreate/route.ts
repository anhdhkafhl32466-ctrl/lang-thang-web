import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { assertRateLimit, callerId, recordRateLimitHit } from '@/lib/server/rateLimit';
import { generatePatternSpec } from '@/lib/server/patternAi';
import { blankById, blankSizeById } from '@/lib/craftBlanks';
import { buildSpecSheet, renderPatternSvg, svgToDataUri } from '@/lib/patternStudio';
import { generateCraftAiArt, CraftArtStyle } from '@/lib/server/craftImageAi';

export const dynamic = 'force-dynamic';

/** Giới hạn số lần sáng tác mỗi khách trong 10 phút — tránh lạm dụng khoá AI dùng chung. */
const RATE_LIMIT = { limit: 20, windowMs: 10 * 60 * 1000 };
const MAX_PROMPT_LENGTH = 600;
const MIN_PROMPT_LENGTH = 4;

interface CocreateBody {
  prompt?: string;
  blankId?: string;
  sizeId?: string;
  style?: CraftArtStyle;
  seed?: number;
  apiKey?: string;
}

/**
 * POST /api/ai/cocreate — GenAI sáng tác một bộ hoa văn cho phôi người dùng chọn.
 *
 * Trả về đặc tả hoa văn, ảnh SVG đã dựng và phiếu kỹ thuật dạng chữ để gửi nghệ nhân.
 * Đây là bước "đồng sáng tạo": khách nêu ý tưởng, AI phác hoa văn, khách duyệt rồi mới đặt làm.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);

    const caller = callerId(request);
    assertRateLimit(`cocreate:${caller}`, {
      ...RATE_LIMIT,
      message: 'Bạn đã sáng tác khá nhiều lần. Vui lòng thử lại sau khoảng {minutes} phút.',
    });

    const body = await readJson<CocreateBody>(request);

    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (prompt.length < MIN_PROMPT_LENGTH) {
      throw new HttpError(
        `Hãy mô tả ý tưởng của bạn rõ hơn một chút (ít nhất ${MIN_PROMPT_LENGTH} ký tự).`,
        400,
        'prompt_too_short',
        { field: 'prompt' }
      );
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new HttpError(
        `Ý tưởng quá dài (tối đa ${MAX_PROMPT_LENGTH} ký tự). Bạn hãy rút gọn lại giúp xưởng nhé.`,
        400,
        'prompt_too_long',
        { field: 'prompt' }
      );
    }

    const blank = blankById(body.blankId);
    if (!blank) {
      throw new HttpError('Phôi bạn chọn không tồn tại trong xưởng.', 400, 'unknown_blank', { field: 'blankId' });
    }

    const size = blankSizeById(blank, body.sizeId) || blank.sizes[0];

    const baseSeed = Number.isFinite(Number(body.seed)) ? Math.abs(Math.trunc(Number(body.seed))) : Math.floor(Math.random() * 100000);

    const generation = await generatePatternSpec({
      prompt,
      blank,
      sizeLabel: `${size.label} (${size.note})`,
      seed: baseSeed,
      userApiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
    });

    const svg = renderPatternSvg(generation.spec, { size: 900 });

    const style = (body.style as CraftArtStyle) || 'photorealistic';
    const art = await generateCraftAiArt({
      prompt,
      blank,
      style,
      seed: baseSeed,
    });

    recordRateLimitHit(`cocreate:${caller}`, RATE_LIMIT.windowMs);

    return NextResponse.json({
      ok: true,
      blankId: blank.id,
      sizeId: size.id,
      spec: generation.spec,
      svg,
      aiArtUrl: art.imageUrl,
      fallbackUrl: art.fallbackUrl,
      promptEnriched: art.promptEnriched,
      style: art.style,
      /** Dùng trực tiếp trong thẻ <img> hoặc làm ảnh nền CSS. */
      dataUri: svgToDataUri(renderPatternSvg(generation.spec, { size: 600 })),
      specSheet: buildSpecSheet(generation.spec, `${blank.name} — ${size.label}`, size.note),
      engine: generation.engine,
      modelUsed: generation.modelUsed ?? null,
      notice: generation.notice ?? null,
      /** Giá tham khảo để nghệ nhân đối chiếu khi báo giá. */
      suggestedPrice: size.basePrice,
      suggestedPrepDays: size.prepDays,
    });
  } catch (error) {
    return jsonError(error);
  }
}
