import { NextRequest, NextResponse } from 'next/server';
import { assertSameOrigin, HttpError, jsonError, normalizeEmail, normalizePhone, readJson, requireString } from '@/lib/server/http';
import { assertRateLimit, callerId, recordRateLimitHit } from '@/lib/server/rateLimit';
import { getSession } from '@/lib/server/session';
import { blankById, blankSizeById } from '@/lib/craftBlanks';
import { normalizePatternSpec, renderPatternSvg } from '@/lib/patternStudio';
import { createBespokeRequest, listBespokeForCustomer, type CreateBespokeInput } from '@/lib/server/bespoke';

export const dynamic = 'force-dynamic';

const RATE_LIMIT = { limit: 12, windowMs: 10 * 60 * 1000 };
const MAX_QUANTITY = 20;
const MAX_BUDGET = 1_000_000_000;

interface BespokeBody {
  blankId?: string;
  sizeId?: string;
  quantity?: number;
  prompt?: string;
  note?: string;
  budgetVnd?: number;
  storeId?: string | null;
  pattern?: {
    title?: string;
    story?: string;
    layout?: string;
    density?: number;
    motifs?: string[];
    palette?: string[];
    background?: string;
    seed?: number;
  };
  customer?: { name?: string; phone?: string; email?: string };
}

/**
 * GET /api/bespoke — danh sách yêu cầu đặt làm của CHÍNH khách đang đăng nhập.
 *
 * Email lấy từ phiên đã ký; tham số `email` chỉ dùng được khi KHÔNG có phiên (khách chưa đăng nhập,
 * tương tự sổ địa chỉ ở /api/customer/addresses). Không bao giờ cho phép xem đơn của email khác.
 */
export async function GET(request: NextRequest) {
  try {
    const session = getSession(request);
    const emailParam = normalizeEmail(request.nextUrl.searchParams.get('email'));
    const email = session?.userEmail || emailParam;

    if (!email) return NextResponse.json({ ok: true, requests: [] });

    if (session && emailParam && emailParam !== session.userEmail.trim().toLowerCase()) {
      throw new HttpError('Không thể xem yêu cầu đặt làm của tài khoản khác.', 403, 'forbidden');
    }

    const requests = await listBespokeForCustomer(email);
    return NextResponse.json({ ok: true, requests });
  } catch (error) {
    return jsonError(error);
  }
}

/**
 * POST /api/bespoke — gửi bản thiết kế đã đồng sáng tạo tới nghệ nhân để báo giá.
 *
 * Hình hoa văn được DỰNG LẠI ở máy chủ từ đặc tả đã chuẩn hoá, không nhận SVG do trình duyệt gửi lên:
 * chuỗi SVG lưu trong cơ sở dữ liệu sẽ được hiển thị lại cho nghệ nhân và quản trị viên, nên tuyệt đối
 * không được tin dữ liệu đó từ phía client.
 */
export async function POST(request: NextRequest) {
  try {
    assertSameOrigin(request);

    const caller = callerId(request);
    assertRateLimit(`bespoke:${caller}`, {
      ...RATE_LIMIT,
      message: 'Bạn đã gửi khá nhiều yêu cầu đặt làm. Vui lòng thử lại sau khoảng {minutes} phút.',
    });

    const session = getSession(request);
    const body = await readJson<BespokeBody>(request);

    const blank = blankById(body.blankId);
    if (!blank) {
      throw new HttpError('Phôi bạn chọn không tồn tại trong xưởng.', 400, 'unknown_blank', { field: 'blankId' });
    }

    const size = blankSizeById(blank, body.sizeId) || blank.sizes[0];

    const prompt = requireString(body.prompt, 'ý tưởng thiết kế', 600);

    const customerName = requireString(
      session?.name || body.customer?.name,
      'tên người đặt',
      120
    );
    const customerEmail = normalizeEmail(session?.userEmail || body.customer?.email);
    const customerPhone = normalizePhone(body.customer?.phone);

    if (!customerEmail && !customerPhone) {
      throw new HttpError(
        'Vui lòng để lại email hoặc số điện thoại để nghệ nhân liên hệ báo giá.',
        400,
        'missing_contact'
      );
    }

    const quantityRaw = Number(body.quantity);
    const quantity = Number.isFinite(quantityRaw) ? Math.min(MAX_QUANTITY, Math.max(1, Math.round(quantityRaw))) : 1;

    const budgetRaw = Number(body.budgetVnd);
    const budgetVnd =
      Number.isFinite(budgetRaw) && budgetRaw > 0 ? Math.min(MAX_BUDGET, Math.round(budgetRaw)) : null;

    const note = typeof body.note === 'string' && body.note.trim() ? body.note.trim().slice(0, 1000) : null;

    // Đặc tả hoa văn do trình duyệt gửi lên vẫn phải đi qua chuẩn hoá trước khi dựng hình.
    const spec = normalizePatternSpec(
      { ...(body.pattern || {}), seed: Number(body.pattern?.seed) || 1 },
      Math.abs(Math.trunc(Date.now() % 100000))
    );
    const svg = renderPatternSvg(spec, { size: 900 });

    const input: CreateBespokeInput = {
      customerEmail,
      customerName,
      customerPhone,
      blank,
      sizeId: size.id,
      sizeLabel: `${size.label} — ${size.note}`,
      quantity,
      prompt,
      patternTitle: spec.title,
      patternStory: spec.story,
      patternLayout: spec.layout,
      patternDensity: spec.density,
      patternMotifs: spec.motifs,
      palette: spec.palette,
      background: spec.background,
      svg,
      specJson: JSON.stringify(spec),
      note,
      budgetVnd,
      requestedStoreId: typeof body.storeId === 'string' && body.storeId.trim() ? body.storeId.trim() : null,
    };

    const created = await createBespokeRequest(input);
    recordRateLimitHit(`bespoke:${caller}`, RATE_LIMIT.windowMs);

    return NextResponse.json({ ok: true, request: created }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
