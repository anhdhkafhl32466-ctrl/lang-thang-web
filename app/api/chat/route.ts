import { NextResponse } from 'next/server';
import { askCraftAssistant } from '@/lib/aiService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body?.message || '';

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Two-layer architecture:
    // Check if external Gemini API key is configured
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Bạn là trợ lý ảo chuyên nghiệp về toàn bộ 16 làng nghề truyền thống tiêu biểu của Hà Nội (Bát Tràng, Mễ Trì, Vạn Phúc, Quảng Phú Cầu, Tây Tựu, Đào Thục, Xuân La, Thạch Xá, làng Chuông, Phú Vinh, Trạch Xá, Sơn Đồng, Chuyên Mỹ, Hạ Thái, Kiêu Kỵ, Chàng Sơn). Hãy trả lời ngắn gọn, nhiệt tình, chuẩn xác tiếng Việt cho câu hỏi sau: "${message}"`
                  }
                ]
              }
            ]
          })
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const candidateText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return NextResponse.json({ reply: candidateText, source: 'gemini-pro' });
          }
        }
      } catch (err) {
        console.warn('Gemini API call error, falling back to local engine', err);
      }
    }

    // Default: Smart heuristic response from internal knowledge base
    const localReply = await askCraftAssistant(message);
    return NextResponse.json({ reply: localReply, source: 'local-knowledge-engine' });
  } catch (error) {
    console.error('Error in /api/chat:', error);
    return NextResponse.json({
      reply: 'Xin lỗi, có trục trặc nhẹ trong kết nối. Bạn hãy thử chọn các câu hỏi gợi ý nhanh nhé!'
    }, { status: 500 });
  }
}
