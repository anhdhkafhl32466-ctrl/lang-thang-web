/**
 * Tạo DỮ LIỆU DEMO cho sàn đa người bán — dùng khi bạn muốn mở Trung tâm người bán và xem giao diện
 * có dữ liệu thật trong cơ sở dữ liệu (không phải dữ liệu giả trong trình duyệt).
 *
 * Script chỉ gọi HTTP API công khai giống như người dùng thao tác, nên nó cũng là một cách kiểm tra
 * nhanh xem server + quyền + đơn con có hoạt động không.
 *
 * Cách dùng (server đang chạy):
 *   E2E_BASE_URL=http://127.0.0.1:3123 node scripts/seed-demo-seller.mjs
 *
 * Tài khoản tạo ra (chỉ để thử nghiệm — ĐỔI MẬT KHẨU nếu dùng ngoài máy cá nhân):
 *   email: demo.nguoiban@langthang.test      mật khẩu: Demo123456!
 *   email: demo.khachhang@langthang.test     (khách đặt đơn demo)
 *
 * Dữ liệu demo có thể xoá bằng cách trỏ biến SQLITE_DB_FILE sang file CSDL khác rồi khởi động lại
 * (không cần xoá tay bản ghi nào).
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:3123').replace(/\/$/, '');
const ROOT = path.resolve(process.cwd());
const SELLER_EMAIL = 'demo.nguoiban@langthang.test';
const SELLER_PASSWORD = 'Demo123456!';

function readEnvLocal(key) {
  const full = path.join(ROOT, '.env.local');
  if (!fs.existsSync(full)) return '';
  for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match && match[1] === key) return match[2].trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

function readVillageSlug() {
  const source = fs.readFileSync(path.join(ROOT, 'data', 'craftVillages.ts'), 'utf8');
  const match = source.match(/slug:\s*'([a-z0-9-]+)'/);
  return match ? match[1] : 'bat-trang';
}

class Client {
  constructor() {
    this.cookies = new Map();
  }

  async request(method, url, body) {
    const headers = { Accept: 'application/json', Origin: BASE };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const cookie = Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    if (cookie) headers.Cookie = cookie;

    const response = await fetch(`${BASE}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const raw of response.headers.getSetCookie ? response.headers.getSetCookie() : []) {
      const [pair] = raw.split(';');
      const index = pair.indexOf('=');
      if (index > 0) this.cookies.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
    }
    const text = await response.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    return { status: response.status, json };
  }

  get(url) {
    return this.request('GET', url);
  }
  post(url, body) {
    return this.request('POST', url, body);
  }
  patch(url, body) {
    return this.request('PATCH', url, body);
  }
}

const seller = new Client();
const admin = new Client();
const customer = new Client();

async function main() {
  const adminKey = readEnvLocal('ADMIN_ACCESS_KEY');
  if (!adminKey) {
    console.error('Thiếu ADMIN_ACCESS_KEY trong .env.local — không duyệt được cửa hàng demo.');
    process.exit(1);
  }

  console.log(`Máy chủ: ${BASE}`);

  // 1. Đăng ký người bán (nếu đã tồn tại thì bỏ qua bước này).
  const register = await seller.post('/api/seller/register', {
    contactName: 'Nguyễn Văn Demo',
    storeName: 'Cửa hàng Demo — Gốm Bát Tràng',
    email: SELLER_EMAIL,
    phone: '0901234567',
    password: SELLER_PASSWORD,
    confirmPassword: SELLER_PASSWORD,
    addressText: 'Số 5, xóm 2, Bát Tràng, Gia Lâm, Hà Nội',
    addressNote: 'Cổng sau chợ gốm',
    description: 'Cửa hàng mẫu để xem giao diện Trung tâm người bán.',
    categories: ['Gốm sứ', 'Đồ thủ công mỹ nghệ'],
    lat: 20.9812,
    lng: 105.9133,
  });

  let store = register.json?.store;
  if (register.status === 409) {
    const existing = await seller.post('/api/seller/session', { email: SELLER_EMAIL, password: SELLER_PASSWORD });
    store = existing.json?.store;
    console.log('Cửa hàng demo đã tồn tại — dùng lại.');
  } else if (register.status !== 201) {
    console.error('Không đăng ký được người bán demo:', register.status, JSON.stringify(register.json));
    process.exit(1);
  }

  // 2. Quản trị viên duyệt.
  const login = await admin.post('/api/auth/session', { adminKey });
  if (login.status !== 200) {
    console.error('Không đăng nhập được quản trị viên:', login.status);
    process.exit(1);
  }
  const approve = await admin.patch(`/api/admin/stores/${store.id}`, { status: 'active', note: 'Duyệt cho dữ liệu demo.' });
  console.log('Trạng thái cửa hàng demo:', approve.json?.store?.status);
  await seller.post('/api/seller/session', { email: SELLER_EMAIL, password: SELLER_PASSWORD });

  // 3. Đăng hai sản phẩm cho cửa hàng demo.
  const villageSlug = readVillageSlug();
  const products = [
    { name: 'Ấm trà gốm men lam (demo)', price: 480000, stock: 12, image: 'https://example.com/am-tra-demo.jpg' },
    { name: 'Đĩa gốm vẽ tay (demo)', price: 220000, stock: 25, image: 'https://example.com/dia-gom-demo.jpg' },
  ];
  const created = [];
  for (const product of products) {
    const response = await seller.post('/api/seller/products', { ...product, villageId: villageSlug, material: 'Đất sét Bát Tràng' });
    if (response.status === 201) created.push(response.json.product);
    else console.log('Không đăng được sản phẩm demo:', response.status, JSON.stringify(response.json));
  }
  console.log(`Sản phẩm demo: ${created.length}`);

  // 4. Khách đặt một đơn gồm hàng của cửa hàng demo + một cửa hàng khác đang hoạt động,
  //    để thấy ngay việc TÁCH ĐƠN THEO CỬA HÀNG trong Trung tâm người bán và trang quản trị.
  const catalog = await customer.get('/api/catalog');
  const demoIds = new Set(created.map((item) => item.id));
  const other = (catalog.json?.products || []).find((item) => !demoIds.has(item.id) && item.storeStatus === 'active');

  const items = created.slice(0, 1).map((item) => ({ productId: item.id, quantity: 1 }));
  if (other) items.push({ productId: other.id, quantity: 1 });

  if (items.length > 0) {
    const order = await customer.post('/api/orders', {
      customer: { name: 'Khách Demo', phone: '0911222333', email: 'demo.khachhang@langthang.test' },
      address: { text: 'Số 12 Lý Thái Tổ, Hoàn Kiếm, Hà Nội', note: 'Gọi trước khi giao', lat: 21.0289, lng: 105.8537, source: 'manual' },
      items,
    });
    if (order.status === 201) {
      console.log(`Đơn demo: ${order.json.order.code} — ${order.json.order.sellerOrders.length} đơn con theo cửa hàng`);
      console.log(`Trang khách theo dõi: ${BASE}/don-hang/${order.json.order.id}`);
    } else {
      console.log('Không tạo được đơn demo:', order.status, JSON.stringify(order.json));
    }
  }

  console.log('\nĐăng nhập tại:', `${BASE}/ban-hang/dang-nhap`);
  console.log(`  email: ${SELLER_EMAIL}   mật khẩu: ${SELLER_PASSWORD}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(2);
});
