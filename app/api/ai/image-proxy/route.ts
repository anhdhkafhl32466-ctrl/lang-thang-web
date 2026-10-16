import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy ảnh an toàn cho các tác phẩm AI sinh ra từ mô hình khuếch tán.
 * TUYỆT ĐỐI không trả về ảnh tĩnh có sẵn để mạo danh ảnh AI.
 * Nếu AI đang bận hoặc mạng gián đoạn, trả về mã lỗi rõ ràng để phía client cho phép người dùng bấm thử lại.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  const seed = searchParams.get('seed') || '42';

  if (!prompt) {
    return NextResponse.json({ error: 'MISSING_PROMPT', message: 'Thiếu mô tả ý tưởng tranh.' }, { status: 400 });
  }

  const targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&nologo=true&seed=${encodeURIComponent(seed)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000); // 25s timeout

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
      // Nếu response trả về ảnh thật
      if (contentType.startsWith('image/')) {
        const buffer = await response.arrayBuffer();
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=604800, immutable',
          },
        });
      }
    }

    return NextResponse.json(
      { error: 'AI_BUSY', message: 'Mô hình AI đang bận xử lý, vui lòng bấm vẽ lại.' },
      { status: 502 }
    );
  } catch (error) {
    console.warn('AI image upstream took too long or failed:', error);
    return NextResponse.json(
      { error: 'AI_TIMEOUT', message: 'Mô hình AI phản hồi chậm, vui lòng bấm vẽ lại.' },
      { status: 504 }
    );
  }
}
