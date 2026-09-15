import { NextResponse } from 'next/server';
import { generateRecommendations } from '@/lib/aiService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const answers = body?.answers;

    if (!answers) {
      return NextResponse.json({ error: 'Answers are required' }, { status: 400 });
    }

    const recommendations = generateRecommendations(answers);
    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error('Error in /api/recommend:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
