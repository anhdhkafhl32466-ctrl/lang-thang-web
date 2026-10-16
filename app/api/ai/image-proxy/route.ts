import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

/**
 * Proxy ảnh an toàn cho các tác phẩm AI sinh ra từ Pollinations / Sana.
 * Luôn phản hồi trong vòng tối đa 6.5s (tránh timeout 10s của Vercel).
 * Nếu nguồn AI ngoài phản hồi chậm hoặc lỗi, tự động phục vụ ảnh mỹ nghệ thủ công bản quyền tương ứng.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  const seed = searchParams.get('seed') || '42';
  const blankId = searchParams.get('blankId') || 'gom';

  if (!prompt) {
    return serveFallback(blankId);
  }

  // Thêm width/height cụ thể để mô hình sinh siêu tốc trong ~2-3 giây
  const targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&seed=${encodeURIComponent(seed)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6500);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (response.ok) {
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      const buffer = await response.arrayBuffer();

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=604800, immutable',
        },
      });
    }
  } catch (error) {
    console.warn('AI image upstream took too long or failed, switching to curated craft fallback:', error);
  }

  // Tự động phục vụ ảnh chất lượng cao nếu AI chậm hoặc lỗi
  return serveFallback(blankId);
}

function serveFallback(blankId: string) {
  let fallbackRel = 'public/images/villages/bat-trang/blue_glaze_vase.jpg';
  if (blankId === 'lua') {
    fallbackRel = 'public/images/villages/van-phuc/lua_van_phuc.jpg';
  } else if (blankId === 'non-la') {
    fallbackRel = 'public/images/villages/chuong/conical_hat1.jpg';
  } else if (blankId === 'tranh-khac-go') {
    fallbackRel = 'public/images/villages/ha-thai/lacquer_box2.jpg';
  }

  const fallbackPath = path.join(process.cwd(), fallbackRel);
  try {
    if (fs.existsSync(fallbackPath)) {
      const fileBuf = fs.readFileSync(fallbackPath);
      return new NextResponse(fileBuf, {
        status: 200,
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400',
          'X-Craft-Fallback': 'true',
        },
      });
    }
  } catch {
    /* fallback error ignored */
  }

  return new NextResponse('No fallback available', { status: 404 });
}
