import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy ảnh an toàn cho các tác phẩm AI sinh ra từ Pollinations / Sana.
 * Tránh lỗi CORS trên trình duyệt, đồng thời gửi User-Agent chuẩn để không bị chặn.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const prompt = searchParams.get('prompt');
  const seed = searchParams.get('seed') || '42';

  if (!prompt) {
    return new NextResponse('Missing prompt parameter', { status: 400 });
  }

  const targetUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?nologo=true&seed=${encodeURIComponent(seed)}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 35000);

    const response = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new NextResponse(`Image generation upstream failed with status: ${response.status}`, {
        status: response.status,
      });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching AI image:', error);
    return new NextResponse('Failed to generate image', { status: 502 });
  }
}
