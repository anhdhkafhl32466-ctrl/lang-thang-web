import { NextResponse } from 'next/server';
import { askEnhancedCraftAssistant, ChatHistoryItem } from '@/lib/craftAiEngine';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || '';
    const userApiKey = body?.apiKey || '';
    const history: ChatHistoryItem[] = Array.isArray(body?.history) ? body.history : [];

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Tin nhắn không được để trống' }, { status: 400 });
    }

    const result = await askEnhancedCraftAssistant(message.trim(), userApiKey, history);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({
      reply: 'Xin lỗi, có trục trặc nhẹ trong kết nối máy chủ AI. Bạn hãy thử gửi lại câu hỏi hoặc chọn các chủ đề gợi ý nhé!',
      source: 'local-expert-engine'
    }, { status: 500 });
  }
}
