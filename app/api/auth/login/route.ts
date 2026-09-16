import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, method } = body;

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Thông tin người dùng không hợp lệ' }, { status: 400 });
    }

    // Extract real client IP and headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp || '127.0.0.1 (Localhost / Wi-Fi)');
    const userAgent = req.headers.get('user-agent') || '';

    // Guess approximate location based on IP or default to Vietnam
    const location = clientIp.startsWith('127.') || clientIp.startsWith('192.168.') || clientIp === '::1'
      ? 'Hà Nội, Việt Nam (Mạng nội bộ)'
      : 'Việt Nam';

    return NextResponse.json({
      success: true,
      ip: clientIp,
      location,
      userAgent,
      method: method || 'Google OAuth 2.0 (Gmail)',
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi ghi nhận đăng nhập' }, { status: 500 });
  }
}
