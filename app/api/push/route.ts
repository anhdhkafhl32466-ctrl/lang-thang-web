import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, readJson } from '@/lib/server/http';
import { countSubscriptions, describePushConfig, getVapidPublicKey, removeSubscription, saveSubscription } from '@/lib/server/push';
import { getSession } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * GET /api/push — khoá công khai VAPID cho trình duyệt tạo subscription.
 * Trả về luôn trạng thái cấu hình để giao diện nói rõ khi tính năng chưa sẵn sàng.
 */
export async function GET() {
  try {
    const config = describePushConfig();
    return NextResponse.json({
      ok: true,
      configured: config.configured,
      missing: config.missing,
      publicKey: getVapidPublicKey(),
      subscriptions: await countSubscriptions(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

/** POST /api/push — lưu subscription của thiết bị hiện tại. */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);
    if (!describePushConfig().configured) {
      throw new HttpError(
        'Máy chủ chưa cấu hình VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY nên chưa thể đăng ký nhận thông báo đẩy.',
        503,
        'push_not_configured'
      );
    }

    const session = getSession(request);
    const body = await readJson<{ endpoint?: string; keys?: { p256dh?: string; auth?: string } }>(request);

    if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
      throw new HttpError('Dữ liệu đăng ký thông báo đẩy không đầy đủ.', 400, 'invalid_subscription');
    }

    await saveSubscription({
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userEmail: session?.userEmail ?? null,
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ ok: true, saved: true, subscriptions: await countSubscriptions() });
  } catch (error) {
    return jsonError(error);
  }
}

/** DELETE /api/push — huỷ đăng ký của thiết bị. Body: { endpoint } */
export async function DELETE(request: NextRequest) {
  try {
    assertSameOrigin(request);
    const body = await readJson<{ endpoint?: string }>(request);
    if (!body.endpoint) throw new HttpError('Thiếu endpoint của thiết bị.', 400, 'missing_endpoint');
    await removeSubscription(body.endpoint);
    return NextResponse.json({ ok: true, removed: true });
  } catch (error) {
    return jsonError(error);
  }
}
