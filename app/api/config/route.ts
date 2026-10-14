import { NextResponse } from 'next/server';
import { getWarehouse, SHIPPING, STORE_INFO } from '@/lib/config/commerce';
import { describeDbBackend } from '@/lib/server/db';
import { isEmailConfigured } from '@/lib/server/email';
import { describePushConfig } from '@/lib/server/push';
import { isSessionSecretConfigured } from '@/lib/server/session';
import { jsonError } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

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
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
