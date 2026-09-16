import { NextResponse } from 'next/server';
import { askEnhancedCraftAssistant } from '@/lib/craftAiEngine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || '';
    const userApiKey = body?.apiKey || '';

    if (!message) {
      return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 });
    }

    const result = await askEnhancedCraftAssistant(message, userApiKey);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({
      reply: 'Xin lỗi, có trục trặc nhẹ trong kết nối. Bạn hãy thử chọn các câu hỏi gợi ý nhanh nhé!',
      source: 'local-expert-engine'
    }, { status: 500 });
  }
}
