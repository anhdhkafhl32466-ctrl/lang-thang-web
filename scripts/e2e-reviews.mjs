/**
 * Kiểm thử đầu-cuối luồng ĐÁNH GIÁ – HỎI ĐÁP – BÁO CÁO của sàn Lang Thang.
 *
 * Chạy: node scripts/e2e-reviews.mjs [baseUrl]
 *
 * Nguyên tắc:
 *  - Chỉ dùng dữ liệu THỬ NGHIỆM (email/sản phẩm/đơn có tiền tố e2e) trên cơ sở dữ liệu LOCAL.
 *  - Không gọi API đặt đơn thật, không tạo đơn giả trên production.
 *  - Mọi thao tác đi qua HTTP API giống hệt trình duyệt (kèm cookie phiên đã ký), nên kết quả phản
 *    ánh đúng phân quyền ở tầng máy chủ chứ không chỉ kiểm tra hàm nội bộ.
 */
import crypto from 'crypto';
import { DatabaseSync } from 'node:sqlite';

const BASE = process.argv[2] || 'http://127.0.0.1:3011';
const PASSWORD = 'review-test-123';
const CUSTOMER = 'e2e-reviewer@test.local';
const SELLER = 'e2e-seller@test.local';
const STORE = 'st_e2e_review';
const PRODUCT = 'prd_e2e_review';
const ORDER = 'ord_e2e_review';
const SORDER = 'so_e2e_review';

const db = new DatabaseSync('.data/lang-thang.db');
db.exec('PRAGMA busy_timeout = 10000;');
const now = new Date().toISOString();

/* `--clean`: xoá toàn bộ dữ liệu thử (dùng sau khi kiểm tra xong trên CSDL local). */
if (process.argv.includes('--clean')) {
  db.prepare('DELETE FROM moderation_actions WHERE target_id IN (SELECT id FROM product_reviews WHERE product_id = ?)').run(PRODUCT);
  db.prepare('DELETE FROM content_reports WHERE product_id = ?').run(PRODUCT);
  db.prepare('DELETE FROM product_answers WHERE product_id = ?').run(PRODUCT);
  db.prepare('DELETE FROM product_questions WHERE product_id = ?').run(PRODUCT);
  db.prepare('DELETE FROM product_reviews WHERE product_id = ?').run(PRODUCT);
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(ORDER);
  db.prepare('DELETE FROM seller_orders WHERE id = ?').run(SORDER);
  db.prepare('DELETE FROM orders WHERE id = ?').run(ORDER);
  db.prepare('DELETE FROM products WHERE id = ?').run(PRODUCT);
  db.prepare('DELETE FROM stores WHERE id = ?').run(STORE);
  db.prepare('DELETE FROM users WHERE email IN (?, ?)').run(CUSTOMER, SELLER);
  console.log('Đã xoá dữ liệu thử e2e khỏi CSDL local.');
  process.exit(0);
}

function b64(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${b64(salt)}$${b64(derived)}`;
}

/* -------------------- Dữ liệu thử -------------------- */
for (const [email, role] of [
  [CUSTOMER, 'member'],
  [SELLER, 'seller'],
]) {
  db.prepare('DELETE FROM users WHERE email = ?').run(email);
  db.prepare("INSERT INTO users (id, email, name, role, provider, created_at) VALUES (?, ?, ?, ?, 'test', ?)").run(
    `usr_${crypto.randomUUID()}`,
    email,
    email.split('@')[0],
    role,
    now
  );
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?').run(hashPassword(PASSWORD), email);
}

db.prepare('DELETE FROM product_answers WHERE product_id = ?').run(PRODUCT);
db.prepare('DELETE FROM product_questions WHERE product_id = ?').run(PRODUCT);
db.prepare('DELETE FROM product_reviews WHERE product_id = ?').run(PRODUCT);
db.prepare('DELETE FROM order_items WHERE order_id = ?').run(ORDER);
db.prepare('DELETE FROM seller_orders WHERE id = ?').run(SORDER);
db.prepare('DELETE FROM orders WHERE id = ?').run(ORDER);
db.prepare('DELETE FROM products WHERE id = ?').run(PRODUCT);
db.prepare('DELETE FROM stores WHERE id = ?').run(STORE);

db.prepare(
  `INSERT INTO stores (id, owner_email, name, slug, description, phone, contact_name, address_text, lat, lng, categories, status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`
).run(
  STORE,
  SELLER,
  'Shop Kiểm Thử E2E',
  'shop-kiem-thu-e2e',
  'Cửa hàng dành cho kiểm thử tự động',
  '0900000000',
  'Nghệ nhân Test',
  'Bát Tràng, Gia Lâm, Hà Nội',
  21.0285,
  105.8542,
  'Gốm sứ',
  now,
  now
);

db.prepare(
  `INSERT INTO products (id, name, village_id, village_name, category, price, stock, image, artisan_name, description, store_id, active, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
).run(
  PRODUCT,
  'Bình gốm men rạn kiểm thử',
  // Làng nghề riêng cho kiểm thử: bước nạp danh mục tự gán sản phẩm theo village_id của các xưởng
  // thật, nên dùng mã làng riêng để dữ liệu thử không bị đổi chủ cửa hàng khi máy chủ khởi động lại.
  'e2e-test-village',
  'Làng Kiểm Thử',
  'Gốm sứ',
  250000,
  10,
  '/images/products/bat-trang.svg',
  'Nghệ nhân Test',
  'Sản phẩm thử nghiệm.',
  STORE,
  now,
  now
);

db.prepare(
  `INSERT INTO orders (id, code, user_email, customer_name, customer_phone, customer_email, address_text, lat, lng,
     address_source, subtotal, shipping_fee, total, status, payment_method, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'gps', ?, ?, ?, 'delivered', 'cod', ?, ?)`
).run(
  ORDER,
  'LT-E2E-REVIEW',
  CUSTOMER,
  'Khách Kiểm Thử',
  '0912345678',
  CUSTOMER,
  'Số 1 Tràng Tiền, Hoàn Kiếm, Hà Nội',
  21.0245,
  105.857,
  250000,
  30000,
  280000,
  now,
  now
);

db.prepare(
  `INSERT INTO seller_orders (id, order_id, store_id, code, store_name, store_address, subtotal, shipping_fee, total, status, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'delivered', ?, ?)`
).run(SORDER, ORDER, STORE, 'LT-E2E-REVIEW-1', 'Shop Kiểm Thử E2E', 'Bát Tràng, Gia Lâm, Hà Nội', 250000, 30000, 280000, now, now);

db.prepare(
  `INSERT INTO order_items (id, order_id, product_id, name, unit_price, quantity, line_total, store_id, seller_order_id)
   VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`
).run(`itm_${crypto.randomUUID()}`, ORDER, PRODUCT, 'Bình gốm men rạn kiểm thử', 250000, 250000, STORE, SORDER);

console.log('Fixture thử nghiệm đã sẵn sàng.');

/* -------------------- HTTP helpers -------------------- */
let failures = 0;
function check(label, condition, extra = '') {
  console.log(`${condition ? 'PASS' : 'FAIL'} · ${label}${extra ? ` — ${extra}` : ''}`);
  if (!condition) failures += 1;
}

async function login(email) {
  const res = await fetch(`${BASE}/api/seller/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: BASE },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const data = await res.json();
  const cookie = (res.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
  if (!res.ok || !cookie) throw new Error(`Đăng nhập thất bại (${email}): ${JSON.stringify(data)}`);
  return { cookie, data };
}

async function api(path, options = {}, cookie = '') {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Origin: BASE,
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

const customer = await login(CUSTOMER);
const seller = await login(SELLER);
check('Đăng nhập khách và người bán bằng mật khẩu', Boolean(customer.cookie && seller.cookie));

/* 1. Điều kiện đánh giá được xác định từ đơn đã giao */
let r = await api(`/api/products/${PRODUCT}/reviews`, {}, customer.cookie);
check(
  'Có đơn đã giao → đủ điều kiện đánh giá',
  r.data?.eligibility?.length === 1 && r.data?.canReview === true,
  JSON.stringify(r.data?.eligibility || r.data?.error || '')
);
check('Chưa có đánh giá → điểm trung bình 0 (không bịa sao)', r.data?.summary?.count === 0 && r.data?.summary?.average === 0);

/* 2. Gửi đánh giá đã xác minh */
r = await api(
  `/api/products/${PRODUCT}/reviews`,
  {
    method: 'POST',
    body: JSON.stringify({ orderId: ORDER, rating: 5, comment: 'Men rạn đẹp, đóng gói chắc chắn.', packagingRating: 5, deliveryRating: 4 }),
  },
  customer.cookie
);
check('Gửi đánh giá đã mua → 201', r.status === 201 && r.data?.created === true, JSON.stringify(r.data?.error || ''));
const reviewId = r.data?.review?.id;

/* 3. Gửi lần hai cùng đơn → cập nhật, không nhân bản */
r = await api(
  `/api/products/${PRODUCT}/reviews`,
  { method: 'POST', body: JSON.stringify({ orderId: ORDER, rating: 3, comment: 'Cập nhật: men có một vết nhỏ.' }) },
  customer.cookie
);
check('Gửi lần hai → cập nhật (không tạo trùng)', r.status === 200 && r.data?.created === false && r.data?.review?.id === reviewId);

const duplicate = db.prepare('SELECT COUNT(*) AS c FROM product_reviews WHERE product_id = ?').get(PRODUCT);
check('Ràng buộc DB: đúng 1 đánh giá cho sản phẩm trong đơn', Number(duplicate.c) === 1, `count=${duplicate.c}`);

/* 4. Tổng hợp điểm thật */
r = await api(`/api/products/${PRODUCT}/reviews`, {}, customer.cookie);
check('Điểm trung bình cập nhật từ dữ liệu thật', r.data?.summary?.count === 1 && r.data?.summary?.average === 3);
check('Đánh giá của chính mình được đánh dấu mine', r.data?.reviews?.[0]?.mine === true);

/* 5. Phía người bán: phạm vi cửa hàng + phản hồi */
r = await api('/api/seller/reviews', {}, seller.cookie);
check('Người bán thấy đánh giá của cửa hàng mình', r.data?.items?.some((item) => item.id === reviewId) === true);
check('Mọi đánh giá trả về đều thuộc store_id của phiên', r.data?.items?.every((item) => item.storeId === STORE) === true);

r = await api(
  `/api/seller/reviews/${reviewId}/reply`,
  { method: 'POST', body: JSON.stringify({ body: 'Cảm ơn bạn đã phản hồi, shop sẽ kiểm tra kỹ hơn.' }) },
  seller.cookie
);
check('Người bán phản hồi đánh giá → 200', r.status === 200 && Boolean(r.data?.review?.reply?.body), JSON.stringify(r.data?.error || ''));

/* 6. Khách nhận thông báo trong website */
r = await api('/api/notifications', {}, customer.cookie);
check('Khách nhận thông báo phản hồi', (r.data?.items || []).some((item) => String(item.title).includes('phản hồi')));

/* 7. Hỏi đáp */
r = await api(
  `/api/products/${PRODUCT}/questions`,
  { method: 'POST', body: JSON.stringify({ body: 'Bình này có chịu được nước sôi không?' }) },
  customer.cookie
);
check('Khách gửi câu hỏi → 201', r.status === 201, JSON.stringify(r.data?.error || ''));
const questionId = r.data?.question?.id;

r = await api('/api/seller/questions?filter=unanswered', {}, seller.cookie);
check('Người bán thấy câu hỏi chưa trả lời', r.data?.items?.some((item) => item.id === questionId) === true);

r = await api(
  `/api/seller/questions/${questionId}/answers`,
  { method: 'POST', body: JSON.stringify({ body: 'Bình nung ở 1250°C nên dùng được với nước sôi.' }) },
  seller.cookie
);
check('Người bán trả lời câu hỏi → 201', r.status === 201, JSON.stringify(r.data?.error || ''));

r = await api(`/api/products/${PRODUCT}/questions`, {}, customer.cookie);
check('Câu trả lời hiển thị công khai với nhãn người bán', r.data?.questions?.[0]?.answers?.[0]?.isSeller === true);

/* 8. Báo cáo nội dung + phân quyền quản trị */
r = await api(
  '/api/reports',
  { method: 'POST', body: JSON.stringify({ targetType: 'review', targetId: reviewId, reason: 'fake', detail: 'Báo cáo thử.' }) },
  seller.cookie
);
check('Báo cáo nội dung → 201', r.status === 201, JSON.stringify(r.data?.error || ''));
check('Báo cáo được lưu vào DB', Number(db.prepare('SELECT COUNT(*) AS c FROM content_reports WHERE target_id = ?').get(reviewId).c) === 1);

r = await api('/api/admin/moderation', {}, customer.cookie);
check('Tài khoản không phải quản trị bị chặn khỏi kiểm duyệt (403)', r.status === 403, `status=${r.status}`);

/* 9. Xoá đánh giá của chính mình */
r = await api(`/api/reviews/${reviewId}`, { method: 'DELETE' }, customer.cookie);
check('Khách xoá đánh giá của mình → 200', r.status === 200, JSON.stringify(r.data?.error || ''));
r = await api(`/api/products/${PRODUCT}/reviews`, {}, customer.cookie);
check('Sau khi xoá, tổng số đánh giá về 0', r.data?.summary?.count === 0);

/* 10. Không thể đánh giá khi chưa mua */
r = await api(
  `/api/products/${PRODUCT}/reviews`,
  { method: 'POST', body: JSON.stringify({ orderId: ORDER, rating: 5, comment: 'Tài khoản không mua' }) },
  seller.cookie
);
check('Tài khoản chưa mua sản phẩm → 403', r.status === 403, `status=${r.status} code=${r.data?.error?.code}`);

console.log(`\nTổng kết: ${failures === 0 ? 'TẤT CẢ PASS' : `${failures} kiểm thử FAIL`}`);
process.exit(failures === 0 ? 0 : 1);
