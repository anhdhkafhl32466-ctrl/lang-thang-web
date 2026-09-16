import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';

const dnsPromises = dns.promises;

// List of known temporary / disposable email providers
const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', '10minutemail.com', 'mailinator.com',
  'guerrillamail.com', 'guerrillamailblock.com', 'sharklasers.com',
  'yopmail.com', 'trashmail.com', 'throwawaymail.com', 'fakeinbox.com',
  'getairmail.com', 'dispostable.com', 'crazymailing.com'
]);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = body?.email;

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json(
        { valid: false, message: 'Vui lòng cung cấp địa chỉ email hợp lệ' },
        { status: 400 }
      );
    }

    const cleanEmail = rawEmail.trim().toLowerCase();

    // 1. Basic format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { valid: false, message: 'Địa chỉ email không đúng định dạng tiêu chuẩn (vd: yourname@gmail.com)' },
        { status: 400 }
      );
    }

    const [username, domain] = cleanEmail.split('@');

    // 2. Disposable domain check
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return NextResponse.json(
        { valid: false, message: `Hệ thống không chấp nhận email rác hoặc tạm thời từ @${domain}` },
        { status: 400 }
      );
    }

    // 3. Strict Google Mail rules if domain is gmail.com / googlemail.com
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      if (username.length < 6 || username.length > 30) {
        return NextResponse.json(
          { valid: false, message: 'Tên tài khoản Gmail phải có độ dài từ 6 đến 30 ký tự theo quy định của Google' },
          { status: 400 }
        );
      }
      if (username.startsWith('.') || username.endsWith('.')) {
        return NextResponse.json(
          { valid: false, message: 'Tài khoản Gmail không được bắt đầu hoặc kết thúc bằng dấu chấm' },
          { status: 400 }
        );
      }
      if (username.includes('..')) {
        return NextResponse.json(
          { valid: false, message: 'Tài khoản Gmail không được chứa hai dấu chấm liên tiếp' },
          { status: 400 }
        );
      }
      const gmailUsernameRegex = /^[a-z0-9.]+$/;
      if (!gmailUsernameRegex.test(username)) {
        return NextResponse.json(
          { valid: false, message: 'Tài khoản Gmail chỉ được chứa chữ cái thường (a-z), chữ số (0-9) và dấu chấm (.)' },
          { status: 400 }
        );
      }
    }

    // 4. DNS MX record validation (checks if domain actually exists and has mail servers)
    try {
      const mxRecords = await dnsPromises.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return NextResponse.json(
          { valid: false, message: `Tên miền "@${domain}" không có máy chủ nhận thư (MX record). Đây không phải là địa chỉ email có thật.` },
          { status: 400 }
        );
      }

      return NextResponse.json({
        valid: true,
        email: cleanEmail,
        username,
        domain,
        mxHost: mxRecords[0].exchange,
        message: 'Email hợp lệ và máy chủ nhận thư hoạt động bình thường'
      });
    } catch (dnsErr: any) {
      return NextResponse.json(
        { valid: false, message: `Tên miền "@${domain}" không tồn tại trên hệ thống máy chủ mạng Internet toàn cầu (DNS).` },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { valid: false, message: 'Không thể xác minh email. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
