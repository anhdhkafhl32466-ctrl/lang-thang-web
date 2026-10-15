import { NextResponse } from 'next/server';
import { getWarehouse, SHIPPING, STORE_INFO } from '@/lib/config/commerce';
import { describeDbBackend } from '@/lib/server/db';
import { isEmailConfigured } from '@/lib/server/email';
import { describePushConfig } from '@/lib/server/push';
import { isSessionSecretConfigured } from '@/lib/server/session';
import { jsonError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

/**
 * Trợ lý AI có khoá DÙNG CHUNG ở máy chủ hay không.
 * Có khoá → mọi khách dùng được trợ lý AI đầy đủ mà không phải tự dán khoá riêng.
 * Không có → hệ thống vẫn trả lời bằng Engine Chuyên gia tích hợp sẵn (không cần mạng).
 *
 * CHỈ tính GEMINI_API_KEY vì đây là nhà cung cấp duy nhất mà động cơ AI thực sự gọi
 * (`askEnhancedCraftAssistant` trong lib/craftAiEngine.ts). Nếu tính cả khoá chưa được hỗ trợ,
 * cờ này sẽ báo "đã cấu hình" trong khi trợ lý vẫn chạy bằng engine nội bộ — tức là nói sai sự thật.
 */
function isSharedAiKeyConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

/**
 * GET /api/config — thông tin công khai cho giao diện bán hàng (kho xuất hàng, phí ship, trạng thái dịch vụ).
 * KHÔNG trả về email quản trị hay bất kỳ khoá bí mật nào.
 */
export async function GET() {
  try {
    const warehouse = getWarehouse();
    const push = describePushConfig();

    return NextResponse.json({
      ok: true,
      store: STORE_INFO,
      warehouse,
      shipping: SHIPPING,
      services: {
        database: describeDbBackend(),
        email: { configured: isEmailConfigured(), missing: isEmailConfigured() ? [] : ['RESEND_API_KEY'] },
        push: { configured: push.configured, missing: push.missing },
        sessionSecret: isSessionSecretConfigured(),
        googleClientId: Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()),
        ai: {
          configured: isSharedAiKeyConfigured(),
          provider: 'Google Gemini',
          missing: isSharedAiKeyConfigured() ? [] : ['GEMINI_API_KEY'],
        },
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
