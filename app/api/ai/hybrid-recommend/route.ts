import { NextRequest, NextResponse } from 'next/server';
import {
  executeHybridAiRecommendation,
  UserInputConstraints,
} from '@/lib/hybridAiVerifier';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await executeHybridAiRecommendation(body);

    return NextResponse.json({
      ok: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Error in /api/ai/hybrid-recommend:', error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || 'Không thể thực hiện gợi ý Hybrid AI lúc này.',
      },
      { status: 500 }
    );
  }
}
