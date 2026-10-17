/**
 * ĐÁNH GIÁ SẢN PHẨM – HỎI ĐÁP – BÁO CÁO NỘI DUNG (chỉ chạy phía server).
 *
 * Nguyên tắc bảo mật & tính trung thực của dữ liệu:
 *  1. Đánh giá "đã mua" chỉ được tạo từ một ĐƠN CON đã GIAO THÀNH CÔNG của CHÍNH tài khoản đang
 *     đăng nhập. Điều kiện này được kiểm tra bằng truy vấn DB, không dựa vào nút bị ẩn ở giao diện.
 *  2. Mỗi khách chỉ có một đánh giá cho mỗi sản phẩm trong một đơn (ràng buộc UNIQUE ở DB). Khách
 *     được SỬA đánh giá của mình; người bán và quản trị không sửa nội dung của khách.
 *  3. Người bán chỉ trả lời được đánh giá / câu hỏi thuộc sản phẩm của cửa hàng mình (WHERE store_id).
 *  4. Điểm sao, số lượt và phân bố sao LUÔN tính từ bản ghi thật; chưa có đánh giá thì trả về 0.
 *  5. Mọi hành động ẩn/khôi phục nội dung của quản trị đều ghi vào moderation_actions (không xoá cứng).
 */

import crypto from 'crypto';
import { execute, executeCount, query, queryOne } from './db';
import { HttpError } from './http';
import { createNotification } from './notifications';
import type {
  ContentReport,
  ModerationAction,
  ProductAnswer,
  ProductQuestion,
  ProductReview,
  ReportStatus,
  ReportTargetType,
  ReviewEligibility,
  ReviewSummary,
  ReviewStatus,
  SellerQuestion,
  SellerReview,
} from '@/lib/reviews/types';
import { REPORT_REASONS } from '@/lib/reviews/types';

const MAX_COMMENT = 2000;
const MAX_QUESTION = 1000;
const MAX_IMAGES = 4;

interface ReviewRow {
  id: string;
  order_id: string;
  seller_order_id: string | null;
  product_id: string;
  store_id: string;
  user_email: string;
  author_name: string;
  rating: number;
  comment: string | null;
  packaging_rating: number | null;
  delivery_rating: number | null;
  images: string | null;
  verified_purchase: number;
  status: ReviewStatus;
  reply_body: string | null;
  reply_by: string | null;
  reply_at: string | null;
  created_at: string;
  updated_at: string;
  order_code?: string | null;
  product_name?: string | null;
  product_image?: string | null;
}

function parseImages(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string').slice(0, MAX_IMAGES) : [];
  } catch {
    return [];
  }
}

function toReview(row: ReviewRow, viewerEmail?: string | null): ProductReview {
  return {
    id: row.id,
    productId: row.product_id,
    storeId: row.store_id,
    orderId: row.order_id,
    orderCode: row.order_code ?? null,
    authorName: row.author_name,
    rating: Number(row.rating),
    comment: row.comment,
    packagingRating: row.packaging_rating == null ? null : Number(row.packaging_rating),
    deliveryRating: row.delivery_rating == null ? null : Number(row.delivery_rating),
    images: parseImages(row.images),
    verifiedPurchase: Number(row.verified_purchase) === 1,
    status: row.status,
    reply: row.reply_body
      ? { body: row.reply_body, by: row.reply_by || 'Người bán', at: row.reply_at || row.updated_at }
      : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    mine: Boolean(viewerEmail && row.user_email === viewerEmail.trim().toLowerCase()),
  };
}

function toSellerReview(row: ReviewRow): SellerReview {
  return {
    ...toReview(row),
    productName: row.product_name || 'Sản phẩm',
    productImage: row.product_image || null,
  };
}

const REVIEW_SELECT = `
  SELECT r.*, o.code AS order_code, p.name AS product_name, p.image AS product_image
  FROM product_reviews r
  LEFT JOIN orders o ON o.id = r.order_id
  LEFT JOIN products p ON p.id = r.product_id`;

/* --------------------------------------------------------------------------
   ĐIỀU KIỆN "ĐÃ MUA": tìm các đơn con đã giao thành công chứa sản phẩm này
   -------------------------------------------------------------------------- */

interface DeliveredItemRow {
  order_id: string;
  order_code: string;
  seller_order_id: string | null;
  product_id: string;
  order_status: string;
  seller_status: string | null;
  seller_updated_at: string | null;
  order_updated_at: string | null;
}

/**
 * Các đơn của CHÍNH email này đã giao thành công và có chứa sản phẩm.
 * Đơn con được ưu tiên: đơn đa cửa hàng có trạng thái riêng cho từng cửa hàng.
 */
async function deliveredItems(email: string, productId?: string): Promise<DeliveredItemRow[]> {
  const normalized = email.trim().toLowerCase();
  const params: string[] = [normalized, normalized];
  let filter = '';
  if (productId) {
    filter = 'AND oi.product_id = ?';
    params.push(productId);
  }

  const rows = await query<DeliveredItemRow>(
    `SELECT oi.order_id, o.code AS order_code, oi.seller_order_id, oi.product_id,
            o.status AS order_status, so.status AS seller_status,
            so.updated_at AS seller_updated_at, o.updated_at AS order_updated_at
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     LEFT JOIN seller_orders so ON so.id = oi.seller_order_id
     WHERE (LOWER(COALESCE(o.user_email, '')) = ? OR LOWER(COALESCE(o.customer_email, '')) = ?)
       ${filter}`,
    params
  );

  return rows.filter((row) =>
    row.seller_order_id ? row.seller_status === 'delivered' : row.order_status === 'delivered'
  );
}

/** Danh sách đơn đã giao của khách cho một sản phẩm (kèm đánh giá đã viết nếu có). */
export async function listReviewEligibility(email: string, productId: string): Promise<ReviewEligibility[]> {
  const [items, reviews] = await Promise.all([
    deliveredItems(email, productId),
    query<{ id: string; order_id: string; status: ReviewStatus }>(
      `SELECT id, order_id, status FROM product_reviews WHERE product_id = ? AND user_email = ?`,
      [productId, email.trim().toLowerCase()]
    ),
  ]);

  const byOrder = new Map(reviews.map((review) => [review.order_id, review]));

  return items.map((item) => {
    const existing = byOrder.get(item.order_id);
    return {
      orderId: item.order_id,
      orderCode: item.order_code,
      sellerOrderId: item.seller_order_id,
      productId: item.product_id,
      deliveredAt: item.seller_updated_at || item.order_updated_at,
      alreadyReviewed: Boolean(existing),
      reviewId: existing?.id ?? null,
    };
  });
}

/* --------------------------------------------------------------------------
   ĐÁNH GIÁ: đọc, tạo/sửa, xoá
   -------------------------------------------------------------------------- */

export async function getReviewSummary(productId: string): Promise<ReviewSummary> {
  const rows = await query<{ rating: number; count: number; packaging: number | null; delivery: number | null }>(
    `SELECT rating, COUNT(*) AS count, AVG(packaging_rating) AS packaging, AVG(delivery_rating) AS delivery
     FROM product_reviews
     WHERE product_id = ? AND status = 'published'
     GROUP BY rating`,
    [productId]
  );

  const distribution: ReviewSummary['distribution'] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let count = 0;
  let weighted = 0;
  let packagingSum = 0;
  let packagingCount = 0;
  let deliverySum = 0;
  let deliveryCount = 0;

  for (const row of rows) {
    const star = Math.min(5, Math.max(1, Math.round(Number(row.rating)))) as 1 | 2 | 3 | 4 | 5;
    const amount = Number(row.count);
    distribution[star] += amount;
    count += amount;
    weighted += star * amount;
    if (row.packaging != null) {
      packagingSum += Number(row.packaging) * amount;
      packagingCount += amount;
    }
    if (row.delivery != null) {
      deliverySum += Number(row.delivery) * amount;
      deliveryCount += amount;
    }
  }

  return {
    average: count > 0 ? Math.round((weighted / count) * 10) / 10 : 0,
    count,
    distribution,
    packagingAverage: packagingCount > 0 ? Math.round((packagingSum / packagingCount) * 10) / 10 : null,
    deliveryAverage: deliveryCount > 0 ? Math.round((deliverySum / deliveryCount) * 10) / 10 : null,
  };
}

export async function listProductReviews(
  productId: string,
  options: { rating?: number | null; withImages?: boolean; sort?: 'recent' | 'highest' | 'lowest'; limit?: number; offset?: number; viewerEmail?: string | null } = {}
): Promise<{ items: ProductReview[]; summary: ReviewSummary; total: number; offset: number }> {
  const limit = Math.min(Math.max(Number(options.limit) || 10, 1), 50);
  const offset = Math.max(Number(options.offset) || 0, 0);

  const where: string[] = [`r.product_id = ?`, `r.status = 'published'`];
  const params: (string | number)[] = [productId];

  if (options.rating && options.rating >= 1 && options.rating <= 5) {
    where.push('r.rating = ?');
    params.push(options.rating);
  }
  if (options.withImages) {
    where.push(`r.images IS NOT NULL AND r.images != '' AND r.images != '[]'`);
  }

  const orderBy =
    options.sort === 'highest'
      ? 'r.rating DESC, r.created_at DESC'
      : options.sort === 'lowest'
        ? 'r.rating ASC, r.created_at DESC'
        : 'r.created_at DESC';

  const rows = await query<ReviewRow>(
    `${REVIEW_SELECT} WHERE ${where.join(' AND ')} ORDER BY ${orderBy} LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  const totals = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM product_reviews WHERE product_id = ? AND status = 'published'`,
    [productId]
  );

  return {
    items: rows.map((row) => toReview(row, options.viewerEmail)),
    summary: await getReviewSummary(productId),
    total: Number(totals?.count ?? 0),
    offset,
  };
}

/** Danh sách đánh giá của cửa hàng cho trang quản lý của người bán. */
export async function listStoreReviews(
  storeId: string,
  options: { filter?: 'all' | 'unanswered' | 'negative'; limit?: number } = {}
): Promise<{ items: SellerReview[]; summary: { count: number; average: number; unanswered: number; negative: number } }> {
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);
  const where = [`r.store_id = ?`];
  const params: (string | number)[] = [storeId];

  if (options.filter === 'unanswered') where.push('(r.reply_body IS NULL OR r.reply_body = \'\')');
  if (options.filter === 'negative') where.push('r.rating <= 3');

  const rows = await query<ReviewRow>(
    `${REVIEW_SELECT} WHERE ${where.join(' AND ')} ORDER BY r.created_at DESC LIMIT ${limit}`,
    params
  );

  const stats = await queryOne<{ count: number; average: number | null; unanswered: number; negative: number }>(
    `SELECT COUNT(*) AS count, AVG(rating) AS average,
            SUM(CASE WHEN reply_body IS NULL OR reply_body = '' THEN 1 ELSE 0 END) AS unanswered,
            SUM(CASE WHEN rating <= 3 THEN 1 ELSE 0 END) AS negative
     FROM product_reviews WHERE store_id = ?`,
    [storeId]
  );

  return {
    items: rows.map(toSellerReview),
    summary: {
      count: Number(stats?.count ?? 0),
      average: stats?.average == null ? 0 : Math.round(Number(stats.average) * 10) / 10,
      unanswered: Number(stats?.unanswered ?? 0),
      negative: Number(stats?.negative ?? 0),
    },
  };
}

function assertRating(value: unknown, field: string, required: boolean): number | null {
  if (value == null || value === '') {
    if (required) throw new HttpError(`${field} là bắt buộc (1–5 sao).`, 400, 'invalid_rating', { field });
    return null;
  }
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 1 || numeric > 5) {
    throw new HttpError(`${field} phải là số nguyên từ 1 đến 5 sao.`, 400, 'invalid_rating', { field });
  }
  return numeric;
}

function cleanText(value: unknown, maxLength: number, field: string): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > maxLength) {
    throw new HttpError(`${field} quá dài (tối đa ${maxLength} ký tự).`, 400, 'field_too_long', { field });
  }
  return trimmed;
}

function normalizeImages(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === 'string' && /^(https?:\/\/|\/)/.test(item.trim()))
    .map((item) => item.trim().slice(0, 500))
    .slice(0, MAX_IMAGES);
}

/**
 * Tạo mới hoặc cập nhật đánh giá của chính khách hàng cho một sản phẩm trong một đơn đã giao.
 * Không bao giờ tin `storeId`/`productId` do client khai: sản phẩm và cửa hàng được tra từ DB.
 */
export async function saveReview(params: {
  email: string;
  name: string;
  productId: string;
  orderId: string;
  rating: unknown;
  comment?: unknown;
  packagingRating?: unknown;
  deliveryRating?: unknown;
  images?: unknown;
}): Promise<{ review: ProductReview; created: boolean }> {
  const email = params.email.trim().toLowerCase();
  const rating = assertRating(params.rating, 'Số sao', true) as number;
  const comment = cleanText(params.comment, MAX_COMMENT, 'Nhận xét');
  const packaging = assertRating(params.packagingRating, 'Đánh giá đóng gói', false);
  const delivery = assertRating(params.deliveryRating, 'Đánh giá giao hàng', false);
  const images = normalizeImages(params.images);

  const product = await queryOne<{ id: string; store_id: string | null; name: string }>(
    `SELECT id, store_id, name FROM products WHERE id = ?`,
    [params.productId]
  );
  if (!product) throw new HttpError('Sản phẩm không tồn tại.', 404, 'product_not_found');
  const storeId = product.store_id || 'platform';

  const items = await deliveredItems(email, params.productId);
  const order = items.find((item) => item.order_id === params.orderId);
  if (!order) {
    throw new HttpError(
      'Chỉ tài khoản đã nhận được sản phẩm này (đơn đã giao thành công) mới được đánh giá.',
      403,
      'not_eligible'
    );
  }

  const existing = await queryOne<ReviewRow>(
    `${REVIEW_SELECT} WHERE r.product_id = ? AND r.order_id = ? AND r.user_email = ?`,
    [params.productId, params.orderId, email]
  );
  const now = new Date().toISOString();

  let reviewId: string;
  let created: boolean;
  if (existing) {
    reviewId = existing.id;
    created = false;
    await execute(
      `UPDATE product_reviews
       SET rating = ?, comment = ?, packaging_rating = ?, delivery_rating = ?, images = ?, updated_at = ?
       WHERE id = ? AND user_email = ?`,
      [rating, comment, packaging, delivery, JSON.stringify(images), now, reviewId, email]
    );
  } else {
    reviewId = `rev_${crypto.randomUUID()}`;
    created = true;
    await execute(
      `INSERT INTO product_reviews (id, order_id, seller_order_id, product_id, store_id, user_email, author_name,
         rating, comment, packaging_rating, delivery_rating, images, verified_purchase, status,
         reply_body, reply_by, reply_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'published', NULL, NULL, NULL, ?, ?)`,
      [
        reviewId,
        params.orderId,
        order.seller_order_id,
        params.productId,
        storeId,
        email,
        params.name.trim().slice(0, 80) || email.split('@')[0],
        rating,
        comment,
        packaging,
        delivery,
        JSON.stringify(images),
        now,
        now,
      ]
    );
  }

  const saved = await queryOne<ReviewRow>(`${REVIEW_SELECT} WHERE r.id = ?`, [reviewId]);
  if (!saved) throw new HttpError('Không đọc lại được đánh giá vừa lưu.', 500, 'save_failed');

  // Thông báo cho ĐÚNG người bán sở hữu sản phẩm.
  const store = await queryOne<{ owner_email: string | null; name: string }>(
    `SELECT owner_email, name FROM stores WHERE id = ?`,
    [storeId]
  );
  if (store?.owner_email) {
    await createNotification({
      audience: 'seller',
      userEmail: store.owner_email,
      orderId: params.orderId,
      title: created ? 'Có đánh giá mới cho sản phẩm' : 'Khách đã cập nhật đánh giá',
      body: `${saved.author_name} chấm ${rating}/5 sao cho “${product.name}”.`,
      link: '/ban-hang/danh-gia',
    });
  }

  return { review: toReview(saved, email), created };
}

export async function deleteOwnReview(reviewId: string, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();
  const existing = await queryOne<ReviewRow>(`SELECT * FROM product_reviews WHERE id = ?`, [reviewId]);
  if (!existing) return false;
  if (existing.user_email !== normalized) {
    throw new HttpError('Bạn chỉ có thể xoá đánh giá của chính mình.', 403, 'forbidden');
  }
  const affected = await executeCount(`DELETE FROM product_reviews WHERE id = ? AND user_email = ?`, [
    reviewId,
    normalized,
  ]);
  return affected > 0;
}

/** Người bán phản hồi đánh giá THUỘC CỬA HÀNG MÌNH (WHERE store_id ở tầng truy vấn). */
export async function replyToReview(params: {
  reviewId: string;
  storeId: string;
  sellerEmail: string;
  sellerName: string;
  body: unknown;
}): Promise<ProductReview> {
  const body = cleanText(params.body, MAX_COMMENT, 'Nội dung phản hồi');
  if (!body) throw new HttpError('Nội dung phản hồi không được để trống.', 400, 'missing_field');

  const existing = await queryOne<ReviewRow>(`SELECT * FROM product_reviews WHERE id = ? AND store_id = ?`, [
    params.reviewId,
    params.storeId,
  ]);
  if (!existing) {
    throw new HttpError('Không tìm thấy đánh giá này trong cửa hàng của bạn.', 404, 'review_not_found');
  }

  const now = new Date().toISOString();
  await execute(
    `UPDATE product_reviews SET reply_body = ?, reply_by = ?, reply_at = ?, updated_at = ? WHERE id = ? AND store_id = ?`,
    [body, params.sellerName, now, now, params.reviewId, params.storeId]
  );

  await createNotification({
    audience: 'customer',
    userEmail: existing.user_email,
    orderId: existing.order_id,
    title: 'Người bán đã phản hồi đánh giá của bạn',
    body: `${params.sellerName}: ${body.slice(0, 140)}`,
    link: `/san-pham/${existing.product_id}`,
  });

  const saved = await queryOne<ReviewRow>(`${REVIEW_SELECT} WHERE r.id = ?`, [params.reviewId]);
  if (!saved) throw new HttpError('Không đọc lại được phản hồi.', 500, 'save_failed');
  return toReview(saved, params.sellerEmail);
}

/* --------------------------------------------------------------------------
   HỎI ĐÁP SẢN PHẨM
   -------------------------------------------------------------------------- */

interface QuestionRow {
  id: string;
  product_id: string;
  store_id: string;
  user_email: string;
  author_name: string;
  body: string;
  status: ReviewStatus;
  created_at: string;
  product_name?: string | null;
  product_image?: string | null;
}

interface AnswerRow {
  id: string;
  question_id: string;
  body: string;
  author_name: string;
  is_seller: number;
  status: ReviewStatus;
  created_at: string;
}

export async function listProductQuestions(
  productId: string,
  options: { viewerEmail?: string | null } = {}
): Promise<ProductQuestion[]> {
  const rows = await query<QuestionRow>(
    `SELECT * FROM product_questions WHERE product_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 100`,
    [productId]
  );
  if (rows.length === 0) return [];

  const answers = await query<AnswerRow>(
    `SELECT id, question_id, body, author_name, is_seller, status, created_at
     FROM product_answers WHERE product_id = ? AND status = 'published' ORDER BY created_at ASC`,
    [productId]
  );

  const grouped = new Map<string, ProductAnswer[]>();
  for (const answer of answers) {
    const list = grouped.get(answer.question_id) || [];
    list.push({
      id: answer.id,
      questionId: answer.question_id,
      body: answer.body,
      authorName: answer.author_name,
      isSeller: Number(answer.is_seller) === 1,
      createdAt: answer.created_at,
      status: answer.status,
    });
    grouped.set(answer.question_id, list);
  }

  const viewer = options.viewerEmail?.trim().toLowerCase() || null;
  return rows.map((row) => ({
    id: row.id,
    productId: row.product_id,
    storeId: row.store_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
    status: row.status,
    mine: Boolean(viewer && row.user_email === viewer),
    answers: grouped.get(row.id) || [],
  }));
}

/** Câu hỏi của cửa hàng cho trang quản lý người bán (ưu tiên câu chưa trả lời). */
export async function listStoreQuestions(
  storeId: string,
  options: { filter?: 'all' | 'unanswered'; limit?: number } = {}
): Promise<{ items: SellerQuestion[]; unanswered: number; total: number }> {
  const limit = Math.min(Math.max(Number(options.limit) || 50, 1), 200);
  const rows = await query<QuestionRow>(
    `SELECT q.*, p.name AS product_name, p.image AS product_image
     FROM product_questions q
     LEFT JOIN products p ON p.id = q.product_id
     WHERE q.store_id = ? ${options.filter === 'unanswered' ? `AND NOT EXISTS (SELECT 1 FROM product_answers a WHERE a.question_id = q.id AND a.status = 'published')` : ''}
     ORDER BY q.created_at DESC LIMIT ${limit}`,
    [storeId]
  );

  const stats = await queryOne<{ total: number }>(
    `SELECT COUNT(*) AS total FROM product_questions WHERE store_id = ?`,
    [storeId]
  );
  const unanswered = await queryOne<{ count: number }>(
    `SELECT COUNT(*) AS count FROM product_questions q
     WHERE q.store_id = ? AND NOT EXISTS (SELECT 1 FROM product_answers a WHERE a.question_id = q.id AND a.status = 'published')`,
    [storeId]
  );

  return {
    items: rows.map((row) => ({
      id: row.id,
      productId: row.product_id,
      storeId: row.store_id,
      authorName: row.author_name,
      body: row.body,
      createdAt: row.created_at,
      status: row.status,
      mine: false,
      answers: [],
      productName: row.product_name || 'Sản phẩm',
      productImage: row.product_image || null,
    })),
    unanswered: Number(unanswered?.count ?? 0),
    total: Number(stats?.total ?? 0),
  };
}

export async function askQuestion(params: {
  email: string;
  name: string;
  productId: string;
  body: unknown;
}): Promise<ProductQuestion> {
  const body = cleanText(params.body, MAX_QUESTION, 'Câu hỏi');
  if (!body) throw new HttpError('Nội dung câu hỏi không được để trống.', 400, 'missing_field');

  const product = await queryOne<{ id: string; store_id: string | null; name: string }>(
    `SELECT id, store_id, name FROM products WHERE id = ?`,
    [params.productId]
  );
  if (!product) throw new HttpError('Sản phẩm không tồn tại.', 404, 'product_not_found');

  const storeId = product.store_id || 'platform';
  const email = params.email.trim().toLowerCase();
  const id = `qst_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  await execute(
    `INSERT INTO product_questions (id, product_id, store_id, user_email, author_name, body, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, 'published', ?, ?)`,
    [id, params.productId, storeId, email, params.name.trim().slice(0, 80) || email.split('@')[0], body, now, now]
  );

  const store = await queryOne<{ owner_email: string | null }>(`SELECT owner_email FROM stores WHERE id = ?`, [storeId]);
  if (store?.owner_email) {
    await createNotification({
      audience: 'seller',
      userEmail: store.owner_email,
      title: 'Có câu hỏi mới về sản phẩm',
      body: `“${product.name}”: ${body.slice(0, 140)}`,
      link: '/ban-hang/danh-gia',
    });
  }

  return {
    id,
    productId: params.productId,
    storeId,
    authorName: email.split('@')[0],
    body,
    createdAt: now,
    status: 'published',
    mine: true,
    answers: [],
  };
}

/** Người bán trả lời câu hỏi thuộc sản phẩm của cửa hàng mình. */
export async function answerQuestion(params: {
  questionId: string;
  storeId: string;
  sellerEmail: string;
  sellerName: string;
  body: unknown;
}): Promise<ProductAnswer> {
  const body = cleanText(params.body, MAX_QUESTION, 'Nội dung trả lời');
  if (!body) throw new HttpError('Nội dung trả lời không được để trống.', 400, 'missing_field');

  const question = await queryOne<{ id: string; product_id: string; user_email: string }>(
    `SELECT id, product_id, user_email FROM product_questions WHERE id = ? AND store_id = ?`,
    [params.questionId, params.storeId]
  );
  if (!question) {
    throw new HttpError('Câu hỏi không thuộc cửa hàng của bạn.', 404, 'question_not_found');
  }

  const id = `ans_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO product_answers (id, question_id, product_id, store_id, user_email, author_name, body, is_seller, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'published', ?)`,
    [id, params.questionId, question.product_id, params.storeId, params.sellerEmail.trim().toLowerCase(), params.sellerName, body, now]
  );

  await createNotification({
    audience: 'customer',
    userEmail: question.user_email,
    title: 'Người bán đã trả lời câu hỏi của bạn',
    body: body.slice(0, 160),
    link: `/san-pham/${question.product_id}`,
  });

  return {
    id,
    questionId: params.questionId,
    body,
    authorName: params.sellerName,
    isSeller: true,
    createdAt: now,
    status: 'published',
  };
}

/* --------------------------------------------------------------------------
   BÁO CÁO NỘI DUNG & KIỂM DUYỆT
   -------------------------------------------------------------------------- */

export async function createReport(params: {
  targetType: ReportTargetType;
  targetId: string;
  reporterEmail: string;
  reason: unknown;
  detail?: unknown;
}): Promise<ContentReport> {
  const validReasons = new Set(REPORT_REASONS.map((item) => item.key));
  const reason = typeof params.reason === 'string' && validReasons.has(params.reason) ? params.reason : 'other';
  const detail = cleanText(params.detail, 500, 'Mô tả');

  let productId: string | null = null;
  let storeId: string | null = null;
  let excerpt = '';
  let author = '';

  if (params.targetType === 'review') {
    const row = await queryOne<{ product_id: string; store_id: string; comment: string | null; author_name: string }>(
      `SELECT product_id, store_id, comment, author_name FROM product_reviews WHERE id = ?`,
      [params.targetId]
    );
    if (!row) throw new HttpError('Đánh giá không tồn tại.', 404, 'target_not_found');
    productId = row.product_id;
    storeId = row.store_id;
    excerpt = row.comment || '';
    author = row.author_name;
  } else if (params.targetType === 'question') {
    const row = await queryOne<{ product_id: string; store_id: string; body: string; author_name: string }>(
      `SELECT product_id, store_id, body, author_name FROM product_questions WHERE id = ?`,
      [params.targetId]
    );
    if (!row) throw new HttpError('Câu hỏi không tồn tại.', 404, 'target_not_found');
    productId = row.product_id;
    storeId = row.store_id;
    excerpt = row.body;
    author = row.author_name;
  } else {
    const row = await queryOne<{ product_id: string; store_id: string; body: string; author_name: string }>(
      `SELECT product_id, store_id, body, author_name FROM product_answers WHERE id = ?`,
      [params.targetId]
    );
    if (!row) throw new HttpError('Câu trả lời không tồn tại.', 404, 'target_not_found');
    productId = row.product_id;
    storeId = row.store_id;
    excerpt = row.body;
    author = row.author_name;
  }

  const email = params.reporterEmail.trim().toLowerCase();
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM content_reports WHERE target_type = ? AND target_id = ? AND reporter_email = ? AND status = 'open'`,
    [params.targetType, params.targetId, email]
  );
  if (existing) {
    throw new HttpError('Bạn đã báo cáo nội dung này và báo cáo đang được xem xét.', 409, 'duplicate_report');
  }

  const id = `rpt_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO content_reports (id, target_type, target_id, product_id, store_id, reporter_email, reason, detail, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
    [id, params.targetType, params.targetId, productId, storeId, email, reason, detail, now]
  );

  const reasonLabel = REPORT_REASONS.find((item) => item.key === reason)?.label || 'Khác';
  await createNotification({
    audience: 'admin',
    title: 'Có báo cáo nội dung cần kiểm duyệt',
    body: `${reasonLabel}: ${excerpt.slice(0, 120) || '(không có nội dung)'} — ${author}`,
    link: '/admin/kiem-duyet',
  });

  return {
    id,
    targetType: params.targetType,
    targetId: params.targetId,
    productId,
    storeId,
    reporterEmail: email,
    reason,
    detail,
    status: 'open',
    resolutionNote: null,
    resolvedBy: null,
    resolvedAt: null,
    createdAt: now,
    targetExcerpt: excerpt,
    targetAuthor: author,
  };
}

export async function listReports(status: ReportStatus | 'all' = 'open'): Promise<ContentReport[]> {
  const rows = await query<{
    id: string;
    target_type: ReportTargetType;
    target_id: string;
    product_id: string | null;
    store_id: string | null;
    reporter_email: string | null;
    reason: string;
    detail: string | null;
    status: ReportStatus;
    resolution_note: string | null;
    resolved_by: string | null;
    resolved_at: string | null;
    created_at: string;
    review_comment: string | null;
    review_author: string | null;
    question_body: string | null;
    question_author: string | null;
    answer_body: string | null;
    answer_author: string | null;
  }>(
    `SELECT rp.*,
            rv.comment AS review_comment, rv.author_name AS review_author,
            q.body AS question_body, q.author_name AS question_author,
            a2.body AS answer_body, a2.author_name AS answer_author
     FROM content_reports rp
     LEFT JOIN product_reviews rv ON rp.target_type = 'review' AND rv.id = rp.target_id
     LEFT JOIN product_questions q ON rp.target_type = 'question' AND q.id = rp.target_id
     LEFT JOIN product_answers a2 ON rp.target_type = 'answer' AND a2.id = rp.target_id
     ${status === 'all' ? '' : `WHERE rp.status = '${status}'`}
     ORDER BY rp.created_at DESC LIMIT 200`
  );

  return rows.map((row) => ({
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    productId: row.product_id,
    storeId: row.store_id,
    reporterEmail: row.reporter_email,
    reason: row.reason,
    detail: row.detail,
    status: row.status,
    resolutionNote: row.resolution_note,
    resolvedBy: row.resolved_by,
    resolvedAt: row.resolved_at,
    createdAt: row.created_at,
    targetExcerpt:
      row.review_comment ?? row.question_body ?? row.answer_body ?? null,
    targetAuthor: row.review_author ?? row.question_author ?? row.answer_author ?? null,
  }));
}

/** Ẩn hoặc khôi phục nội dung vi phạm. Không xoá cứng dữ liệu của khách. */
export async function moderateContent(params: {
  targetType: ReportTargetType;
  targetId: string;
  action: 'hide' | 'restore';
  actorEmail: string;
  note?: string | null;
}): Promise<{ changed: boolean; status: ReviewStatus }> {
  const table =
    params.targetType === 'review'
      ? 'product_reviews'
      : params.targetType === 'question'
        ? 'product_questions'
        : 'product_answers';
  const nextStatus: ReviewStatus = params.action === 'hide' ? 'hidden' : 'published';

  const existing = await queryOne<{ id: string; status: ReviewStatus }>(
    `SELECT id, status FROM ${table} WHERE id = ?`,
    [params.targetId]
  );
  if (!existing) throw new HttpError('Nội dung không tồn tại.', 404, 'target_not_found');

  await execute(`UPDATE ${table} SET status = ? WHERE id = ?`, [nextStatus, params.targetId]);
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO moderation_actions (id, target_type, target_id, action, actor_email, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `mod_${crypto.randomUUID()}`,
      params.targetType,
      params.targetId,
      params.action === 'hide' ? 'hidden' : 'restored',
      params.actorEmail.trim().toLowerCase(),
      params.note?.trim() || null,
      now,
    ]
  );

  return { changed: existing.status !== nextStatus, status: nextStatus };
}

export async function resolveReport(params: {
  reportId: string;
  status: Exclude<ReportStatus, 'open'>;
  note?: string | null;
  actorEmail: string;
}): Promise<boolean> {
  const existing = await queryOne<{ id: string }>(`SELECT id FROM content_reports WHERE id = ?`, [params.reportId]);
  if (!existing) return false;
  const now = new Date().toISOString();
  const affected = await executeCount(
    `UPDATE content_reports SET status = ?, resolution_note = ?, resolved_by = ?, resolved_at = ? WHERE id = ?`,
    [params.status, params.note?.trim() || null, params.actorEmail.trim().toLowerCase(), now, params.reportId]
  );
  return affected > 0;
}

export async function listModerationActions(limit = 50): Promise<ModerationAction[]> {
  const rows = await query<{
    id: string;
    target_type: ReportTargetType;
    target_id: string;
    action: string;
    actor_email: string;
    note: string | null;
    created_at: string;
  }>(`SELECT * FROM moderation_actions ORDER BY created_at DESC LIMIT ${Math.min(Math.max(limit, 1), 200)}`);

  return rows.map((row) => ({
    id: row.id,
    targetType: row.target_type,
    targetId: row.target_id,
    action: row.action,
    actorEmail: row.actor_email,
    note: row.note,
    createdAt: row.created_at,
  }));
}
