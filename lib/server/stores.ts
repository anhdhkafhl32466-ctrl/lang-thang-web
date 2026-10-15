/**
 * Cửa hàng (người bán) — tầng nghiệp vụ đa người bán.
 *
 * Quy tắc cốt lõi:
 *  - Mỗi tài khoản sở hữu TỐI ĐA MỘT cửa hàng (kiểm tra ở đây, không tin dữ liệu client gửi lên).
 *  - Chủ sở hữu được xác định từ EMAIL TRONG PHIÊN ĐĂNG NHẬP đã ký (cookie HMAC), không bao giờ từ
 *    `storeId` do client khai báo.
 *  - Trạng thái: pending (chờ duyệt) → active (đang bán) | rejected (từ chối); active ⇄ suspended (tạm khóa).
 *  - Sàn cũng có một cửa hàng của chính nó để 18 sản phẩm gốc có chủ hợp lệ.
 */

import crypto from 'crypto';
import { execute, query, queryOne } from './db';
import { getAdminEmail } from '@/lib/config/commerce';
import { STORE_STATUSES, STORE_STATUS_META } from '@/lib/orders/storeMeta';
import type { Store, StoreStatus } from '@/lib/orders/types';
import { getUserByEmail } from './users';

// Nhãn/mô tả trạng thái nằm ở lib/orders/storeMeta.ts (dữ liệu thuần) để giao diện dùng được mà không
// phải nhập tầng cơ sở dữ liệu. Re-export tại đây cho các phía gọi phía máy chủ hiện có.
export { STORE_STATUSES, STORE_STATUS_META };

/**
 * Chuẩn hóa trạng thái cửa hàng: hỗ trợ cả 'active' và 'approved' (đồng nghĩa duyệt thành công),
 * xử lý khoảng trắng hoặc chữ hoa/thường.
 */
export function normalizeStoreStatus(status: unknown): StoreStatus {
  if (!status) return 'pending';
  const clean = String(status).trim().toLowerCase();
  if (clean === 'active' || clean === 'approved') return 'active';
  if (clean === 'suspended' || clean === 'inactive' || clean === 'locked') return 'suspended';
  if (clean === 'rejected' || clean === 'declined') return 'rejected';
  return 'pending';
}

interface StoreRow {
  id: string;
  owner_id?: string | null;
  owner_email: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  contact_name: string | null;
  address_text: string | null;
  address_note: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
  banner_url?: string | null;
  shipping_policy?: string | null;
  prep_time_days?: number | null;
  categories: string | null;
  status: string;
  approval_status?: string | null;
  review_note: string | null;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export function toStore(row: StoreRow): Store {
  const normStatus = normalizeStoreStatus(row.status || row.approval_status);
  return {
    id: row.id,
    ownerId: row.owner_id || null,
    ownerEmail: row.owner_email,
    name: row.name,
    slug: row.slug,
    description: row.description,
    phone: row.phone,
    contactName: row.contact_name,
    addressText: row.address_text,
    addressNote: row.address_note,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    logoUrl: row.logo_url,
    bannerUrl: row.banner_url || null,
    shippingPolicy: row.shipping_policy || null,
    prepTimeDays: row.prep_time_days == null ? 1 : Number(row.prep_time_days),
    categories: (row.categories || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    status: normStatus,
    approvalStatus: row.approval_status || (normStatus === 'active' ? 'approved' : normStatus),
    reviewNote: row.review_note,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Bỏ dấu tiếng Việt để tạo slug đường dẫn. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function getStoreById(id: string): Promise<Store | null> {
  const row = await queryOne<StoreRow>(`SELECT * FROM stores WHERE id = ?`, [id]);
  return row ? toStore(row) : null;
}

/** Tìm cửa hàng theo slug (URL công khai /cua-hang/[slug]). */
export async function getStoreBySlug(slug: string): Promise<Store | null> {
  const row = await queryOne<StoreRow>(`SELECT * FROM stores WHERE slug = ?`, [slug.trim().toLowerCase()]);
  return row ? toStore(row) : null;
}

/**
 * Tra cứu cửa hàng theo User ID hoặc Email chủ sở hữu.
 * Đảm bảo liên kết nhất quán giữa tài khoản người dùng và cửa hàng.
 */
export async function getStoreByOwner(identifier: {
  userId?: string | null;
  email?: string | null;
}): Promise<Store | null> {
  const cleanEmail = identifier.email?.trim().toLowerCase();
  const cleanId = identifier.userId?.trim();

  let row: StoreRow | null = null;
  if (cleanId) {
    row = await queryOne<StoreRow>(`SELECT * FROM stores WHERE owner_id = ?`, [cleanId]);
  }
  if (!row && cleanEmail) {
    row = await queryOne<StoreRow>(
      `SELECT * FROM stores WHERE lower(owner_email) = ? OR owner_id = ?`,
      [cleanEmail, cleanEmail]
    );
    // Tự động liên kết owner_id nếu hồ sơ shop chưa có nhưng đã xác định được userId
    if (row && cleanId && !row.owner_id) {
      await execute(`UPDATE stores SET owner_id = ? WHERE id = ?`, [cleanId, row.id]).catch(() => {});
      row.owner_id = cleanId;
    }
  }
  return row ? toStore(row) : null;
}

/** Cửa hàng của một tài khoản (tìm qua email hoặc user ID). */
export async function getStoreByOwnerEmail(email: string): Promise<Store | null> {
  const clean = email.trim().toLowerCase();
  return getStoreByOwner({
    email: clean,
    userId: clean.startsWith('usr_') ? clean : undefined,
  });
}

export async function listStores(params: { status?: string | null; limit?: number } = {}): Promise<Store[]> {
  const limit = Math.min(Number(params.limit) || 200, 500);
  let rows: StoreRow[];
  if (params.status) {
    const norm = normalizeStoreStatus(params.status);
    if (norm === 'active') {
      rows = await query<StoreRow>(
        `SELECT * FROM stores WHERE lower(status) IN ('active', 'approved') OR lower(approval_status) = 'approved' ORDER BY created_at DESC LIMIT ${limit}`
      );
    } else {
      rows = await query<StoreRow>(
        `SELECT * FROM stores WHERE lower(status) = ? ORDER BY created_at DESC LIMIT ${limit}`,
        [norm]
      );
    }
  } else {
    rows = await query<StoreRow>(`SELECT * FROM stores ORDER BY created_at DESC LIMIT ${limit}`);
  }
  return rows.map(toStore);
}

export async function countStoresByStatus(): Promise<Record<string, number>> {
  const rows = await query<{ status: string; count: number }>(
    `SELECT status, COUNT(*) AS count FROM stores GROUP BY status`
  );
  const result: Record<string, number> = {
    pending: 0,
    active: 0,
    suspended: 0,
    rejected: 0,
  };
  for (const row of rows) {
    const norm = normalizeStoreStatus(row.status);
    result[norm] = (result[norm] || 0) + Number(row.count || 0);
  }
  return result;
}

async function uniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'cua-hang';
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const existing = await queryOne<{ id: string }>(`SELECT id FROM stores WHERE slug = ?`, [candidate]);
    if (!existing || existing.id === excludeId) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 6)}`;
}

export interface CreateStoreInput {
  ownerEmail: string;
  ownerId?: string | null;
  name: string;
  description?: string | null;
  phone?: string | null;
  contactName?: string | null;
  addressText?: string | null;
  addressNote?: string | null;
  lat?: number | null;
  lng?: number | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  shippingPolicy?: string | null;
  prepTimeDays?: number | null;
  categories?: string[];
  status?: StoreStatus | 'approved' | string;
}

/**
 * Tạo cửa hàng cho một tài khoản. Ném lỗi rõ ràng nếu tài khoản đã có cửa hàng.
 * `status` mặc định là 'pending' — quyết định tự động kích hoạt hay chờ duyệt do phía gọi quyết định
 * dựa trên cấu hình SELLER_AUTO_APPROVE, KHÔNG do client gửi lên.
 * Tự động liên kết owner_id từ tài khoản người dùng (users.id).
 */
export async function createStore(input: CreateStoreInput): Promise<Store> {
  const ownerEmail = input.ownerEmail.trim().toLowerCase();
  let ownerId = input.ownerId?.trim() || null;
  if (!ownerId) {
    const user = await getUserByEmail(ownerEmail);
    if (user) ownerId = user.id;
  }

  const existing = await getStoreByOwner({ userId: ownerId, email: ownerEmail });
  if (existing) {
    const error = new Error('Tài khoản này đã có cửa hàng.');
    (error as any).existingStore = existing;
    throw error;
  }

  const id = `str_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const status: StoreStatus = normalizeStoreStatus(input.status);
  const approvalStatus = status === 'active' ? 'approved' : status;
  const slug = await uniqueSlug(input.name);

  await execute(
    `INSERT INTO stores (id, owner_id, owner_email, name, slug, description, phone, contact_name, address_text,
      address_note, lat, lng, logo_url, banner_url, shipping_policy, prep_time_days, categories, status, approval_status, review_note, approved_at, approved_by,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)`,
    [
      id,
      ownerId,
      ownerEmail,
      input.name.trim(),
      slug,
      input.description?.trim() || null,
      input.phone?.trim() || null,
      input.contactName?.trim() || null,
      input.addressText?.trim() || null,
      input.addressNote?.trim() || null,
      typeof input.lat === 'number' ? input.lat : null,
      typeof input.lng === 'number' ? input.lng : null,
      input.logoUrl?.trim() || null,
      input.bannerUrl?.trim() || null,
      input.shippingPolicy?.trim() || null,
      input.prepTimeDays == null ? 1 : Number(input.prepTimeDays),
      (input.categories || []).join(', ') || null,
      status,
      approvalStatus,
      status === 'active' ? now : null,
      status === 'active' ? ownerEmail : null,
      now,
      now,
    ]
  );

  const created = await getStoreById(id);
  if (!created) throw new Error('Không đọc lại được cửa hàng vừa tạo.');
  return created;
}

/** Người bán tự cập nhật hồ sơ cửa hàng mình (không đổi được trạng thái/quyền sở hữu). */
export async function updateStoreProfile(
  storeId: string,
  patch: {
    name?: string;
    description?: string | null;
    phone?: string | null;
    contactName?: string | null;
    addressText?: string | null;
    addressNote?: string | null;
    lat?: number | null;
    lng?: number | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    shippingPolicy?: string | null;
    prepTimeDays?: number | null;
    categories?: string[];
  }
): Promise<Store> {
  const store = await getStoreById(storeId);
  if (!store) {
    const error = new Error('Không tìm thấy cửa hàng.');
    (error as any).notFound = true;
    throw error;
  }

  const name = patch.name?.trim() || store.name;
  const slug = name === store.name ? store.slug : await uniqueSlug(name, store.id);
  const now = new Date().toISOString();

  await execute(
    `UPDATE stores SET name = ?, slug = ?, description = ?, phone = ?, contact_name = ?, address_text = ?,
       address_note = ?, lat = ?, lng = ?, logo_url = ?, banner_url = ?, shipping_policy = ?, prep_time_days = ?, categories = ?, updated_at = ?
     WHERE id = ?`,
    [
      name,
      slug,
      patch.description === undefined ? store.description : patch.description?.trim() || null,
      patch.phone === undefined ? store.phone : patch.phone?.trim() || null,
      patch.contactName === undefined ? store.contactName : patch.contactName?.trim() || null,
      patch.addressText === undefined ? store.addressText : patch.addressText?.trim() || null,
      patch.addressNote === undefined ? store.addressNote : patch.addressNote?.trim() || null,
      patch.lat === undefined ? store.lat : patch.lat,
      patch.lng === undefined ? store.lng : patch.lng,
      patch.logoUrl === undefined ? store.logoUrl : patch.logoUrl?.trim() || null,
      patch.bannerUrl === undefined ? store.bannerUrl : patch.bannerUrl?.trim() || null,
      patch.shippingPolicy === undefined ? store.shippingPolicy : patch.shippingPolicy?.trim() || null,
      patch.prepTimeDays === undefined ? store.prepTimeDays : patch.prepTimeDays == null ? 1 : Number(patch.prepTimeDays),
      patch.categories === undefined ? store.categories.join(', ') || null : patch.categories.join(', ') || null,
      now,
      store.id,
    ]
  );

  const updated = await getStoreById(store.id);
  if (!updated) throw new Error('Không đọc lại được cửa hàng sau khi cập nhật.');
  return updated;
}

export interface StoreReviewInput {
  storeId: string;
  status: StoreStatus | 'approved' | string;
  note?: string | null;
  actorEmail: string;
}

/**
 * Quản trị viên sàn duyệt / từ chối / tạm khóa / kích hoạt lại cửa hàng.
 * Khi duyệt (status = 'active' hoặc 'approved'):
 *  1. Cập nhật trạng thái duyệt vào database (status = 'active', approval_status = 'approved').
 *  2. Liên kết chặt chẽ shop với tài khoản người bán qua owner_id (users.id).
 *  3. Nâng cấp vai trò người dùng trong bảng users (role = 'seller').
 *  4. Tự động đảm bảo kho xuất hàng mặc định nếu chưa có.
 *  5. Chạy an toàn, hoàn toàn idempotent (duyệt nhiều lần không tạo shop hay dữ liệu trùng).
 */
export async function reviewStore(input: StoreReviewInput): Promise<Store> {
  const store = await getStoreById(input.storeId);
  if (!store) {
    const error = new Error('Không tìm thấy cửa hàng.');
    (error as any).notFound = true;
    throw error;
  }

  const now = new Date().toISOString();
  const targetStatus = normalizeStoreStatus(input.status);
  const approved = targetStatus === 'active';
  const approvalStatus = approved ? 'approved' : targetStatus;

  // Tìm ID tài khoản để liên kết chặt chẽ nếu chưa có
  let ownerId = store.ownerId;
  if (!ownerId && store.ownerEmail) {
    const user = await getUserByEmail(store.ownerEmail);
    if (user) ownerId = user.id;
  }

  await execute(
    `UPDATE stores SET status = ?, approval_status = ?, owner_id = COALESCE(?, owner_id), review_note = ?, approved_at = ?, approved_by = ?, updated_at = ? WHERE id = ?`,
    [
      targetStatus,
      approvalStatus,
      ownerId,
      input.note?.trim() || null,
      approved ? store.approvedAt || now : null,
      approved ? input.actorEmail : null,
      now,
      store.id,
    ]
  );

  // Khi duyệt người bán: cập nhật vai trò tài khoản trong bảng users (role = 'seller')
  if (store.ownerEmail) {
    const cleanEmail = store.ownerEmail.trim().toLowerCase();
    if (approved) {
      await execute(
        `UPDATE users SET role = 'seller', last_login_at = COALESCE(last_login_at, ?) WHERE lower(email) = ? OR id = ?`,
        [now, cleanEmail, ownerId || '']
      );
    }
  }

  const updated = await getStoreById(store.id);
  if (!updated) throw new Error('Không đọc lại được cửa hàng sau khi duyệt.');

  // Tự động đảm bảo kho xuất hàng mặc định cho shop khi duyệt
  if (approved) {
    try {
      const { ensureDefaultWarehouseForStore } = await import('./warehouses');
      await ensureDefaultWarehouseForStore(updated);
    } catch {
      /* skip */
    }
  }

  return updated;
}

/** Cửa hàng của chính sàn (chủ là ADMIN_EMAIL) — nơi chứa danh mục sản phẩm gốc. */
export async function ensurePlatformStore(): Promise<Store> {
  const adminEmail = getAdminEmail();
  const existing = await getStoreByOwnerEmail(adminEmail);
  if (existing) {
    if (existing.status !== 'active') {
      return reviewStore({ storeId: existing.id, status: 'active', note: 'Cửa hàng của sàn.', actorEmail: adminEmail });
    }
    return existing;
  }

  return createStore({
    ownerEmail: adminEmail,
    name: 'Lang Thang — Sàn di sản',
    description: 'Danh mục sản phẩm tinh hoa do chính sàn Lang Thang tuyển chọn từ các làng nghề Hà Nội.',
    contactName: 'Ban quản trị sàn Lang Thang',
    status: 'active',
    categories: ['Đặc sản làng nghề', 'Quà tặng di sản', 'Thủ công mỹ nghệ'],
  });
}

export function isStoreSellable(status: string | null | undefined): boolean {
  return normalizeStoreStatus(status) === 'active';
}

/**
 * Đồng bộ an toàn dữ liệu người bán & cửa hàng cũ (Yêu cầu số 7).
 *  - Gán owner_id cho các shop còn thiếu
 *  - Cập nhật role = 'seller' cho các chủ shop đã được duyệt
 *  - Đảm bảo kho xuất hàng mặc định cho các shop active
 */
export async function syncApprovedStoresAndUsers(): Promise<{
  syncedStores: number;
  syncedUsers: number;
  createdWarehouses: number;
}> {
  let syncedStores = 0;
  let syncedUsers = 0;
  let createdWarehouses = 0;

  try {
    const allStores = await query<StoreRow>(`SELECT * FROM stores`);
    for (const row of allStores) {
      const store = toStore(row);
      const email = store.ownerEmail?.trim().toLowerCase();
      if (!email) continue;

      const user = await getUserByEmail(email);
      if (user) {
        if (!row.owner_id) {
          await execute(`UPDATE stores SET owner_id = ? WHERE id = ?`, [user.id, store.id]);
          syncedStores++;
        }
        if (store.status === 'active' && user.role !== 'seller' && user.role !== 'admin') {
          await execute(`UPDATE users SET role = 'seller' WHERE id = ?`, [user.id]);
          syncedUsers++;
        }
      }

      if (store.status === 'active') {
        try {
          const { ensureDefaultWarehouseForStore } = await import('./warehouses');
          await ensureDefaultWarehouseForStore(store);
          createdWarehouses++;
        } catch {
          /* skip */
        }
      }
    }
  } catch (error) {
    console.warn('syncApprovedStoresAndUsers warning:', error);
  }

  return { syncedStores, syncedUsers, createdWarehouses };
}

/**
 * Chế độ cho bán NGAY sau khi đăng ký (mặc định TẮT).
 *
 * Mặc định hệ thống chờ quản trị viên sàn duyệt hồ sơ — phù hợp vận hành thật vì sàn phải chịu trách
 * nhiệm về hàng hoá. Bật `SELLER_AUTO_APPROVE=true` chỉ khi chủ sàn muốn mở cửa tự do; khi đó hồ sơ
 * vẫn được ghi nhận và quản trị viên nhận thông báo để kiểm tra sau (có thể tạm khóa bất cứ lúc nào).
 */
export function isSellerAutoApproveEnabled(): boolean {
  return String(process.env.SELLER_AUTO_APPROVE || '').trim().toLowerCase() === 'true';
}
