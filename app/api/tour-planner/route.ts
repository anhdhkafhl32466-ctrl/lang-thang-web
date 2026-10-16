import { NextResponse } from 'next/server';
import { generateOneTouchTourPlan, TourPlannerInput } from '@/lib/aiTourPlanner';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const budget = Number(body?.budget) || 300000;
    const duration = body?.duration || 'half-day-morning';
    const preference = body?.preference || 'pottery';
    const departurePoint = body?.departurePoint || 'Trung tâm Hà Nội';
    const transportMode = body?.transportMode || 'bus';
    const userGeminiKey = body?.apiKey;

    const input: TourPlannerInput = {
      budget,
      duration,
      preference,
      departurePoint,
      transportMode,
      userGeminiKey
    };

    const tourPlan = await generateOneTouchTourPlan(input);

    return NextResponse.json({ success: true, tourPlan });
  } catch (error) {
    console.error('Error in /api/tour-planner:', error);
    return NextResponse.json(
      { success: false, error: 'Không thể lập tour, vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
