/**
 * Đặt làm sản phẩm ĐỘC BẢN (bespoke) — cầu nối giữa bản thiết kế AI và nghệ nhân trên sàn.
 *
 * Vòng đời một yêu cầu:
 *   cho-bao-gia  → khách gửi bản thiết kế, chờ nghệ nhân xem
 *   da-bao-gia   → nghệ nhân gửi giá + số ngày làm, chờ khách quyết
 *   dang-che-tac → khách đồng ý, nghệ nhân bắt tay chế tác
 *   hoan-thanh   → tác phẩm xong
 *   tu-choi      → nghệ nhân từ chối (nêu lý do)
 *   da-huy       → khách huỷ hoặc không đồng ý báo giá
 *
 * Nguyên tắc phân quyền (không được nới lỏng):
 *  - Nghệ nhân chỉ chạm được yêu cầu gửi tới CỬA HÀNG của mình — `store_id` do máy chủ tra từ phiên.
 *  - Khách chỉ chạm được yêu cầu của chính email trong phiên đăng nhập.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from './db';
import { createNotification } from './notifications';
import { ensurePlatformStore, isSyntheticOrTestStore, isStoreSellable } from './stores';
import { getStoreById } from './stores';
import { HttpError } from './http';
import type { CraftBlank } from '@/lib/craftBlanks';

export type BespokeStatus =
  | 'cho-bao-gia'
  | 'da-bao-gia'
  | 'dang-che-tac'
  | 'hoan-thanh'
  | 'tu-choi'
  | 'da-huy';

export const BESPOKE_STATUSES: BespokeStatus[] = [
  'cho-bao-gia',
  'da-bao-gia',
  'dang-che-tac',
  'hoan-thanh',
  'tu-choi',
  'da-huy',
];

export const BESPOKE_STATUS_META: Record<BespokeStatus, { label: string; description: string; tone: 'wait' | 'offer' | 'work' | 'done' | 'stop' }> = {
  'cho-bao-gia': {
    label: 'Chờ nghệ nhân báo giá',
    description: 'Bản thiết kế đã gửi tới xưởng. Nghệ nhân đang xem để tính giá và thời gian chế tác.',
    tone: 'wait',
  },
  'da-bao-gia': {
    label: 'Nghệ nhân đã báo giá',
    description: 'Xưởng đã gửi giá và số ngày dự kiến. Khách xác nhận để bắt đầu chế tác.',
    tone: 'offer',
  },
  'dang-che-tac': {
    label: 'Đang chế tác',
    description: 'Nghệ nhân đang trực tiếp làm tác phẩm theo bản thiết kế đã duyệt.',
    tone: 'work',
  },
  'hoan-thanh': {
    label: 'Đã hoàn thành',
    description: 'Tác phẩm độc bản đã làm xong.',
    tone: 'done',
  },
  'tu-choi': {
    label: 'Nghệ nhân từ chối',
    description: 'Xưởng chưa đảm nhận được yêu cầu này. Lý do được ghi rõ bên dưới.',
    tone: 'stop',
  },
  'da-huy': {
    label: 'Đã huỷ',
    description: 'Yêu cầu đã dừng lại.',
    tone: 'stop',
  },
};

export function isBespokeStatus(value: unknown): value is BespokeStatus {
  return typeof value === 'string' && (BESPOKE_STATUSES as string[]).includes(value);
}

export interface BespokeRequest {
  id: string;
  code: string;
  customerEmail: string | null;
  customerName: string;
  customerPhone: string | null;
  storeId: string;
  storeName: string;
  villageSlug: string | null;
  villageName: string | null;
  blankId: string;
  blankName: string;
  sizeId: string | null;
  sizeLabel: string;
  quantity: number;
  prompt: string;
  patternTitle: string;
  patternStory: string | null;
  patternLayout: string | null;
  patternDensity: number | null;
  patternMotifs: string[];
  palette: string[];
  background: string | null;
  svg: string | null;
  note: string | null;
  budgetVnd: number | null;
  status: BespokeStatus;
  quotePriceVnd: number | null;
  quoteDays: number | null;
  quoteNote: string | null;
  quotedAt: string | null;
  decidedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BespokeRequestRow {
  id: string;
  code: string;
  customer_email: string | null;
  customer_name: string;
  customer_phone: string | null;
  store_id: string;
  store_name: string;
  village_slug: string | null;
  village_name: string | null;
  blank_id: string;
  blank_name: string;
  size_id: string | null;
  size_label: string;
  quantity: number;
  prompt: string;
  pattern_title: string;
  pattern_story: string | null;
  pattern_layout: string | null;
  pattern_density: number | null;
  pattern_motifs: string | null;
  palette: string | null;
  background: string | null;
  spec_json: string | null;
  svg: string | null;
  note: string | null;
  budget_vnd: number | null;
  status: string;
  quote_price_vnd: number | null;
  quote_days: number | null;
  quote_note: string | null;
  quoted_at: string | null;
  decided_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function parseJsonArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

export function toBespokeRequest(row: BespokeRequestRow): BespokeRequest {
  return {
    id: row.id,
    code: row.code,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    storeId: row.store_id,
    storeName: row.store_name,
    villageSlug: row.village_slug,
    villageName: row.village_name,
    blankId: row.blank_id,
    blankName: row.blank_name,
    sizeId: row.size_id,
    sizeLabel: row.size_label,
    quantity: Number(row.quantity) || 1,
    prompt: row.prompt,
    patternTitle: row.pattern_title,
    patternStory: row.pattern_story,
    patternLayout: row.pattern_layout,
    patternDensity: row.pattern_density == null ? null : Number(row.pattern_density),
    patternMotifs: parseJsonArray(row.pattern_motifs),
    palette: parseJsonArray(row.palette),
    background: row.background,
    svg: row.svg,
    note: row.note,
    budgetVnd: row.budget_vnd == null ? null : Number(row.budget_vnd),
    status: isBespokeStatus(row.status) ? row.status : 'cho-bao-gia',
    quotePriceVnd: row.quote_price_vnd == null ? null : Number(row.quote_price_vnd),
    quoteDays: row.quote_days == null ? null : Number(row.quote_days),
    quoteNote: row.quote_note,
    quotedAt: row.quoted_at,
    decidedAt: row.decided_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/* -------------------------------------------------------------------------- */
/* Chọn nghệ nhân phù hợp với phôi                                            */
/* -------------------------------------------------------------------------- */

export interface ArtisanOption {
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  /** Số sản phẩm đang bán thuộc ĐÚNG làng nghề của phôi. */
  villageProductCount: number;
  /** Tổng số sản phẩm đang bán của cửa hàng. */
  productCount: number;
  /** Cửa hàng của chính sàn — phương án dự phòng khi chưa có xưởng riêng cho làng này. */
  isPlatform: boolean;
}

interface ArtisanOptionRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  owner_email: string;
  product_count: number | string;
  village_count: number | string;
}

/**
 * Danh sách xưởng có thể nhận phôi này, xếp xưởng đúng làng nghề lên trước.
 * Dữ liệu cửa hàng kiểm thử bị loại khỏi danh sách công khai (xem isSyntheticOrTestStore).
 */
export async function listArtisanOptions(blank: CraftBlank): Promise<ArtisanOption[]> {
  const platform = await ensurePlatformStore();

  const rows = await query<ArtisanOptionRow>(
    `SELECT s.id, s.name, s.slug, s.description, s.logo_url, s.owner_email,
            COUNT(p.id) AS product_count,
            SUM(CASE WHEN p.village_id = ? THEN 1 ELSE 0 END) AS village_count
       FROM stores s
       LEFT JOIN products p ON p.store_id = s.id AND p.active = 1
      WHERE s.status = 'active'
      GROUP BY s.id, s.name, s.slug, s.description, s.logo_url, s.owner_email`,
    [blank.villageSlug]
  );

  const options: ArtisanOption[] = rows
    .filter((row) => !isSyntheticOrTestStore({ name: row.name, ownerEmail: row.owner_email, description: row.description, slug: row.slug }))
    .map((row) => ({
      storeId: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description,
      logoUrl: row.logo_url,
      villageProductCount: Number(row.village_count) || 0,
      productCount: Number(row.product_count) || 0,
      isPlatform: row.id === platform.id,
    }));

  options.sort((a, b) => {
    if (b.villageProductCount !== a.villageProductCount) return b.villageProductCount - a.villageProductCount;
    if (a.isPlatform !== b.isPlatform) return a.isPlatform ? 1 : -1;
    return b.productCount - a.productCount;
  });

  return options;
}

/**
 * Xác định cửa hàng sẽ nhận yêu cầu.
 *  - Khách chọn rõ cửa hàng: phải tồn tại và đang ở trạng thái bán được.
 *  - Khách để trống ("giao cho xưởng phù hợp"): chọn xưởng có nhiều sản phẩm đúng làng nghề nhất,
 *    cuối cùng mới tới cửa hàng của sàn — nhờ vậy yêu cầu không bao giờ rơi vào hư không.
 */
export async function resolveArtisanStore(blank: CraftBlank, requestedStoreId: string | null) {
  if (requestedStoreId) {
    const store = await getStoreById(requestedStoreId);
    if (!store) {
      throw new HttpError('Không tìm thấy cửa hàng bạn chọn để gửi bản thiết kế.', 404, 'store_not_found');
    }
    if (!isStoreSellable(store.status)) {
      throw new HttpError(
        'Cửa hàng này hiện không nhận đơn. Bạn hãy chọn một xưởng khác đang hoạt động.',
        409,
        'store_not_sellable'
      );
    }
    return store;
  }

  const options = await listArtisanOptions(blank);
  const best = options.find((option) => option.villageProductCount > 0) || options[0];
  if (best) {
    const store = await getStoreById(best.storeId);
    if (store) return store;
  }
  return ensurePlatformStore();
}

/* -------------------------------------------------------------------------- */
/* Tạo và đọc yêu cầu                                                         */
/* -------------------------------------------------------------------------- */

export interface CreateBespokeInput {
  customerEmail: string | null;
  customerName: string;
  customerPhone: string | null;
  blank: CraftBlank;
  sizeId: string | null;
  sizeLabel: string;
  quantity: number;
  prompt: string;
  patternTitle: string;
  patternStory: string | null;
  patternLayout: string | null;
  patternDensity: number | null;
  patternMotifs: string[];
  palette: string[];
  background: string | null;
  svg: string | null;
  specJson: string | null;
  note: string | null;
  budgetVnd: number | null;
  requestedStoreId: string | null;
}

function makeCode(): string {
  return `DS-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export async function createBespokeRequest(input: CreateBespokeInput): Promise<BespokeRequest> {
  const store = await resolveArtisanStore(input.blank, input.requestedStoreId);
  const id = `bsp_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO bespoke_requests (
       id, code, customer_email, customer_name, customer_phone,
       store_id, store_name, village_slug, village_name,
       blank_id, blank_name, size_id, size_label, quantity,
       prompt, pattern_title, pattern_story, pattern_layout, pattern_density,
       pattern_motifs, palette, background, spec_json, svg, note, budget_vnd,
       status, quote_price_vnd, quote_days, quote_note, quoted_at, decided_at, completed_at,
       created_at, updated_at
     ) VALUES (?,?,?,?,?, ?,?,?,?, ?,?,?,?,?, ?,?,?,?,?, ?,?,?,?,?,?,?, ?, NULL,NULL,NULL,NULL,NULL,NULL, ?, ?)`,
    [
      id,
      makeCode(),
      input.customerEmail,
      input.customerName,
      input.customerPhone,
      store.id,
      store.name,
      input.blank.villageSlug,
      input.blank.villageName,
      input.blank.id,
      input.blank.name,
      input.sizeId,
      input.sizeLabel,
      input.quantity,
      input.prompt,
      input.patternTitle,
      input.patternStory,
      input.patternLayout,
      input.patternDensity,
      JSON.stringify(input.patternMotifs),
      JSON.stringify(input.palette),
      input.background,
      input.specJson,
      input.svg,
      input.note,
      input.budgetVnd,
      'cho-bao-gia',
      now,
      now,
    ]
  );

  const created = await getBespokeById(id);
  if (!created) {
    throw new HttpError('Không lưu được yêu cầu đặt làm. Vui lòng thử lại.', 500, 'bespoke_save_failed');
  }

  await notifySeller(created, {
    title: `Yêu cầu đặt làm độc bản mới · ${created.blankName}`,
    body: `${created.customerName} vừa gửi bản thiết kế "${created.patternTitle}" cho ${created.sizeLabel}. Mã yêu cầu ${created.code}.`,
  });
  if (created.customerEmail) {
    await createNotification({
      audience: 'customer',
      userEmail: created.customerEmail,
      title: `Đã gửi bản thiết kế tới ${created.storeName}`,
      body: `Mã yêu cầu ${created.code}. Nghệ nhân sẽ xem và báo giá cho bạn.`,
      link: '/dong-sang-tao?tab=don-cua-toi',
    });
  }

  return created;
}

async function notifySeller(request: BespokeRequest, payload: { title: string; body: string }): Promise<void> {
  const store = await getStoreById(request.storeId);
  const sellerEmail = store?.ownerEmail || null;
  if (sellerEmail) {
    await createNotification({
      audience: 'seller',
      userEmail: sellerEmail,
      title: payload.title,
      body: payload.body,
      link: '/ban-hang/dong-sang-tao',
    });
  }
  // Cửa hàng của sàn: quản trị viên cũng cần thấy để điều phối xưởng phù hợp.
  if (store && (await isPlatformStore(store.id))) {
    await createNotification({
      audience: 'admin',
      title: payload.title,
      body: `${payload.body} (Yêu cầu đang nằm ở cửa hàng của sàn.)`,
      link: '/admin',
    });
  }
}

let platformStoreIdCache: string | null = null;
async function isPlatformStore(storeId: string): Promise<boolean> {
  if (!platformStoreIdCache) {
    const platform = await ensurePlatformStore();
    platformStoreIdCache = platform.id;
  }
  return platformStoreIdCache === storeId;
}

export async function getBespokeById(id: string): Promise<BespokeRequest | null> {
  const row = await queryOne<BespokeRequestRow>(`SELECT * FROM bespoke_requests WHERE id = ?`, [id]);
  return row ? toBespokeRequest(row) : null;
}

export async function listBespokeForCustomer(email: string, limit = 50): Promise<BespokeRequest[]> {
  const rows = await query<BespokeRequestRow>(
    `SELECT * FROM bespoke_requests WHERE customer_email = ? ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 100)}`,
    [email.trim().toLowerCase()]
  );
  return rows.map(toBespokeRequest);
}

export async function listBespokeForStore(storeId: string, status?: string | null): Promise<BespokeRequest[]> {
  if (status && isBespokeStatus(status)) {
    const rows = await query<BespokeRequestRow>(
      `SELECT * FROM bespoke_requests WHERE store_id = ? AND status = ? ORDER BY created_at DESC LIMIT 200`,
      [storeId, status]
    );
    return rows.map(toBespokeRequest);
  }
  const rows = await query<BespokeRequestRow>(
    `SELECT * FROM bespoke_requests WHERE store_id = ? ORDER BY created_at DESC LIMIT 200`,
    [storeId]
  );
  return rows.map(toBespokeRequest);
}

export async function countBespokeNeedingSellerAction(storeId: string): Promise<number> {
  const row = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM bespoke_requests WHERE store_id = ? AND status IN ('cho-bao-gia','dang-che-tac')`,
    [storeId]
  );
  return Number(row?.count ?? 0);
}

/* -------------------------------------------------------------------------- */
/* Chuyển trạng thái                                                          */
/* -------------------------------------------------------------------------- */

export async function quoteBespoke(params: {
  id: string;
  storeId: string;
  priceVnd: number;
  days: number;
  note: string | null;
}): Promise<BespokeRequest> {
  const request = await requireOwnedRequest(params.id, params.storeId);
  if (request.status !== 'cho-bao-gia') {
    throw new HttpError(
      `Chỉ báo giá được cho yêu cầu đang chờ báo giá (yêu cầu này đang ở trạng thái "${BESPOKE_STATUS_META[request.status].label}").`,
      409,
      'invalid_transition'
    );
  }

  const now = new Date().toISOString();
  await execute(
    `UPDATE bespoke_requests
        SET status = 'da-bao-gia', quote_price_vnd = ?, quote_days = ?, quote_note = ?, quoted_at = ?, updated_at = ?
      WHERE id = ?`,
    [params.priceVnd, params.days, params.note, now, now, params.id]
  );

  const updated = await getBespokeById(params.id);
  if (updated?.customerEmail) {
    await createNotification({
      audience: 'customer',
      userEmail: updated.customerEmail,
      title: `${updated.storeName} đã báo giá yêu cầu ${updated.code}`,
      body: `Giá ${Math.round(params.priceVnd).toLocaleString('vi-VN')}đ · khoảng ${params.days} ngày chế tác. Mở xưởng để xác nhận.`,
      link: '/dong-sang-tao?tab=don-cua-toi',
    });
  }
  return updated as BespokeRequest;
}

export async function decideBespoke(params: {
  id: string;
  customerEmail: string;
  accept: boolean;
}): Promise<BespokeRequest> {
  const request = await getBespokeById(params.id);
  if (!request) throw new HttpError('Không tìm thấy yêu cầu đặt làm này.', 404, 'bespoke_not_found');
  if ((request.customerEmail || '').toLowerCase() !== params.customerEmail.trim().toLowerCase()) {
    throw new HttpError('Bạn không phải người đã gửi yêu cầu này.', 403, 'forbidden');
  }
  if (request.status !== 'da-bao-gia') {
    throw new HttpError('Yêu cầu này chưa có báo giá để xác nhận.', 409, 'invalid_transition');
  }

  const now = new Date().toISOString();
  await execute(`UPDATE bespoke_requests SET status = ?, decided_at = ?, updated_at = ? WHERE id = ?`, [
    params.accept ? 'dang-che-tac' : 'da-huy',
    now,
    now,
    params.id,
  ]);

  const updated = (await getBespokeById(params.id)) as BespokeRequest;
  await notifySeller(updated, {
    title: params.accept ? `Khách đã xác nhận đơn độc bản ${updated.code}` : `Khách đã huỷ đơn độc bản ${updated.code}`,
    body: params.accept
      ? `${updated.customerName} đồng ý với báo giá và chờ bạn bắt đầu chế tác.`
      : `${updated.customerName} chưa tiếp tục với báo giá này.`,
  });
  return updated;
}

export async function updateBespokeProgress(params: {
  id: string;
  storeId: string;
  status: BespokeStatus;
  note: string | null;
}): Promise<BespokeRequest> {
  const request = await requireOwnedRequest(params.id, params.storeId);

  const allowed: Record<BespokeStatus, BespokeStatus[]> = {
    'cho-bao-gia': ['tu-choi'],
    'da-bao-gia': ['tu-choi'],
    'dang-che-tac': ['hoan-thanh'],
    'hoan-thanh': [],
    'tu-choi': [],
    'da-huy': [],
  };
  if (!allowed[request.status].includes(params.status)) {
    throw new HttpError(
      `Không thể chuyển từ "${BESPOKE_STATUS_META[request.status].label}" sang "${BESPOKE_STATUS_META[params.status].label}".`,
      409,
      'invalid_transition'
    );
  }

  const now = new Date().toISOString();
  const completing = params.status === 'hoan-thanh';
  await execute(
    `UPDATE bespoke_requests
        SET status = ?, quote_note = COALESCE(?, quote_note), completed_at = ?, updated_at = ?
      WHERE id = ?`,
    [params.status, params.note, completing ? now : request.completedAt, now, params.id]
  );

  const updated = (await getBespokeById(params.id)) as BespokeRequest;
  if (updated.customerEmail) {
    await createNotification({
      audience: 'customer',
      userEmail: updated.customerEmail,
      title: `Yêu cầu ${updated.code}: ${BESPOKE_STATUS_META[params.status].label}`,
      body: params.note || BESPOKE_STATUS_META[params.status].description,
      link: '/dong-sang-tao?tab=don-cua-toi',
    });
  }
  return updated;
}

async function requireOwnedRequest(id: string, storeId: string): Promise<BespokeRequest> {
  const request = await getBespokeById(id);
  if (!request) throw new HttpError('Không tìm thấy yêu cầu đặt làm này.', 404, 'bespoke_not_found');
  if (request.storeId !== storeId) {
    throw new HttpError('Yêu cầu này không thuộc cửa hàng của bạn.', 403, 'forbidden');
  }
  return request;
}
