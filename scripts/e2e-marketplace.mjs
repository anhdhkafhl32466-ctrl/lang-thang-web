/**
 * Kiểm thử đầu-cuối cho sàn thương mại đa người bán — chạy THẬT trên server đang chạy.
 *
 * Vì sao là script thật thay vì kiểm thử giả lập: yêu cầu quan trọng nhất của sàn là "đơn của khách
 * phải được tách đúng tới từng người bán và KHÔNG người bán nào chạm được dữ liệu của người khác".
 * Điều đó chỉ chứng minh được bằng cách gọi đúng các HTTP API mà trình duyệt gọi, với cookie phiên
 * thật của từng vai trò (khách, người bán A/B/C, quản trị viên).
 *
 * Cách chạy (server phải đang chạy, KHÔNG dùng cơ sở dữ liệu thật của khách):
 *   1) cd lang-thang-web
 *   2) SQLITE_DB_FILE="$PWD/.data/e2e-marketplace.db" npx next start -p 3123
 *   3) E2E_BASE_URL=http://127.0.0.1:3123 node scripts/e2e-marketplace.mjs
 *
 * Script chỉ ĐỌC ADMIN_ACCESS_KEY từ .env.local và không in giá trị bí mật ra màn hình.
 */

import fs from 'node:fs';
import path from 'node:path';

const BASE = (process.env.E2E_BASE_URL || 'http://127.0.0.1:3123').replace(/\/$/, '');
const ROOT = path.resolve(process.cwd());

const results = [];
let failed = 0;

function check(label, condition, detail = '') {
  const ok = Boolean(condition);
  if (!ok) failed += 1;
  results.push({ ok, label, detail });
  console.log(`${ok ? '  ✓' : '  ✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

function readEnvLocal(key) {
  for (const file of ['.env.local', '.env']) {
    const full = path.join(ROOT, file);
    if (!fs.existsSync(full)) continue;
    for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (match && match[1] === key) {
        return match[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return '';
}

function readFirstVillageSlug() {
  const source = fs.readFileSync(path.join(ROOT, 'data', 'craftVillages.ts'), 'utf8');
  const match = source.match(/slug:\s*'([a-z0-9-]+)'/);
  return match ? match[1] : 'bat-trang';
}

/** Một "trình duyệt" riêng: giữ cookie phiên như trình duyệt thật, không chia sẻ với vai trò khác. */
class Client {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
  }

  cookieHeader() {
    return Array.from(this.cookies.entries())
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  async request(method, url, body, options = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    // Gửi Origin như trình duyệt để đi qua được lớp chống CSRF của máy chủ.
    headers.Origin = BASE;
    const cookie = this.cookieHeader();
    if (cookie) headers.Cookie = cookie;

    const response = await fetch(`${BASE}${url}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: 'manual',
    });

    const setCookies = response.headers.getSetCookie ? response.headers.getSetCookie() : [];
    for (const raw of setCookies) {
      const [pair] = raw.split(';');
      const index = pair.indexOf('=');
      if (index > 0) {
        const name = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim();
        if (value === '' || /Max-Age=0/i.test(raw)) this.cookies.delete(name);
        else this.cookies.set(name, value);
      }
    }

    let json = null;
    const text = await response.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text.slice(0, 400) };
      }
    }
    return { status: response.status, json, options };
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

function messageOf(response) {
  return response.json?.error?.message || response.json?.raw || '';
}

function orderPricesMatch(order) {
  const children = order?.sellerOrders || [];
  if (children.length === 0) return false;
  const sum = (key) => children.reduce((total, child) => total + Number(child[key] || 0), 0);
  return sum('subtotal') === order.subtotal && sum('shippingFee') === order.shippingFee && sum('total') === order.total;
}

const stamp = Date.now().toString(36);
const password = 'MatKhauE2E-2026!';
const villageSlug = readFirstVillageSlug();
const adminKey = readEnvLocal('ADMIN_ACCESS_KEY');

const guest = new Client('khách');
const member = new Client('thành viên');
const sellerA = new Client('người bán A');
const sellerB = new Client('người bán B');
const sellerC = new Client('người bán C');
const admin = new Client('quản trị viên');

const sellerAEmail = `e2e-seller-a-${stamp}@example.com`;
const sellerBEmail = `e2e-seller-b-${stamp}@example.com`;
const sellerCEmail = `e2e-seller-c-${stamp}@example.com`;

async function registerSeller(client, email, storeName, address) {
  return client.post('/api/seller/register', {
    contactName: 'Chủ cửa hàng E2E',
    storeName,
    email,
    phone: '0912345678',
    password,
    confirmPassword: password,
    addressText: address,
    addressNote: 'Ngõ 1',
    description: 'Cửa hàng tạo bởi script kiểm thử đầu-cuối.',
    categories: ['Gốm sứ', 'Dệt may'],
  });
}

async function main() {
  section('0. Máy chủ sẵn sàng');
  const config = await guest.get('/api/config');
  check('GET /api/config trả 200', config.status === 200, `status=${config.status}`);

  if (!adminKey) {
    console.log('\n⚠ Không đọc được ADMIN_ACCESS_KEY từ .env.local — không thể kiểm thử luồng quản trị.');
  }

  section('1. Khách đăng ký làm người bán (chờ duyệt)');
  const regA = await registerSeller(
    sellerA,
    sellerAEmail,
    `Cửa hàng Gốm A ${stamp}`,
    'Số 1 đường Gốm, Bát Tràng, Gia Lâm, Hà Nội'
  );
  check('POST /api/seller/register (A) trả 201', regA.status === 201, `status=${regA.status} ${messageOf(regA)}`);
  const storeA = regA.json?.store;
  check('Cửa hàng A ở trạng thái "pending"', storeA?.status === 'pending', `status=${storeA?.status}`);
  check('Mật khẩu KHÔNG bị trả về trình duyệt', !JSON.stringify(regA.json || {}).includes('scrypt$'));

  const stateA = await sellerA.get('/api/seller/session');
  check('Khu vực người bán: đã đăng nhập + là người bán', stateA.json?.isSeller === true);
  check('Chưa được duyệt nên canSell = false', stateA.json?.canSell === false);
  check('Có lý do chặn rõ ràng cho người dùng', Boolean(stateA.json?.blockedReason), stateA.json?.blockedReason);

  const regB = await registerSeller(sellerB, sellerBEmail, `Cửa hàng Mây B ${stamp}`, 'Số 2 đường Mây, Phú Vinh, Hà Nội');
  const regC = await registerSeller(sellerC, sellerCEmail, `Cửa hàng Lụa C ${stamp}`, 'Số 3 đường Lụa, Vạn Phúc, Hà Nội');
  check('POST /api/seller/register (B) trả 201', regB.status === 201, `status=${regB.status}`);
  check('POST /api/seller/register (C) trả 201', regC.status === 201, `status=${regC.status}`);
  const storeB = regB.json?.store;
  const storeC = regC.json?.store;

  // Kiểm tra Case 3: Đăng ký khi email đã có shop -> 409 store_exists và redirectUrl
  const dupStore = await registerSeller(sellerA, sellerAEmail, 'Shop Trùng', 'Địa chỉ');
  check(
    'Email đã có shop đăng ký lại: trả 409 store_exists',
    dupStore.status === 409 && dupStore.json?.error?.code === 'store_exists',
    `status=${dupStore.status} code=${dupStore.json?.error?.code}`
  );
  check('Trả redirectUrl về /ban-hang', dupStore.json?.redirectUrl === '/ban-hang');

  // Kiểm tra Case 2: Khách hàng cũ đăng ký mở shop -> nâng cấp role, không báo trùng email
  const upgradeClient = new Client('khách nâng cấp');
  const upgradeEmail = `e2e-upgraded-${stamp}@example.com`;
  await upgradeClient.post('/api/auth/session', { email: upgradeEmail, name: 'Khách Làng Nghề Cũ' });
  const upgradeReg = await registerSeller(
    upgradeClient,
    upgradeEmail,
    `Cửa hàng Nâng Cấp ${stamp}`,
    'Hà Đông, Hà Nội'
  );
  check(
    'Khách hàng cũ đăng ký mở shop: nâng cấp thành công (201)',
    upgradeReg.status === 201,
    `status=${upgradeReg.status} ${messageOf(upgradeReg)}`
  );
  const upgradeSession = await upgradeClient.get('/api/seller/session');
  check('Tài khoản khách cũ đã thành seller', upgradeSession.json?.isSeller === true);

  section('2. Chưa được duyệt thì KHÔNG được đăng bán');
  const pendingProduct = await sellerA.post('/api/seller/products', {
    name: 'Sản phẩm khi chưa duyệt',
    price: 100000,
    stock: 5,
    image: 'https://example.com/anh.jpg',
    villageId: villageSlug,
  });
  check(
    'Đăng sản phẩm khi cửa hàng chờ duyệt bị từ chối (403)',
    pendingProduct.status === 403,
    `status=${pendingProduct.status} code=${pendingProduct.json?.error?.code}`
  );

  section('3. Phiên thành viên (khách) không được dùng API người bán');
  const memberSession = await member.post('/api/auth/session', {
    email: `e2e-member-${stamp}@example.com`,
    name: 'Khách E2E',
    verifiedByMx: true,
  });
  check('Tạo phiên thành viên (email MX) thành công', memberSession.status === 200, `status=${memberSession.status}`);
  const memberSellerApi = await member.get('/api/seller/orders');
  check(
    'API quản lý cửa hàng từ chối tài khoản thành viên',
    memberSellerApi.status === 403 || memberSellerApi.status === 401,
    `status=${memberSellerApi.status} code=${memberSellerApi.json?.error?.code}`
  );

  section('4. Quản trị viên đăng nhập và duyệt người bán');
  const adminLogin = await admin.post('/api/auth/session', { adminKey });
  check('POST /api/auth/session (adminKey) thành công', adminLogin.status === 200, `status=${adminLogin.status} ${messageOf(adminLogin)}`);
  check('Phiên được cấp quyền quản trị', adminLogin.json?.user?.isAdmin === true);

  const storeList = await admin.get('/api/admin/stores');
  check('GET /api/admin/stores trả 200', storeList.status === 200, `status=${storeList.status}`);
  check(
    'Danh sách cửa hàng có cả A, B, C và hồ sơ đang chờ duyệt',
    [storeA, storeB, storeC].every((store) => (storeList.json?.stores || []).some((item) => item.id === store.id))
  );

  const approveA = await admin.patch(`/api/admin/stores/${storeA.id}`, { status: 'active', note: 'Hồ sơ đầy đủ.' });
  const approveB = await admin.patch(`/api/admin/stores/${storeB.id}`, { status: 'active' });
  const approveC = await admin.patch(`/api/admin/stores/${storeC.id}`, { status: 'active' });
  check('Duyệt cửa hàng A → active', approveA.json?.store?.status === 'active', messageOf(approveA));
  check('Duyệt cửa hàng B → active', approveB.json?.store?.status === 'active', messageOf(approveB));
  check('Duyệt cửa hàng C → active', approveC.json?.store?.status === 'active', messageOf(approveC));

  section('5. Người bán đăng nhập lại bằng email + mật khẩu');
  const loginA = await sellerA.post('/api/seller/session', { email: sellerAEmail, password });
  check('Đăng nhập người bán A thành công', loginA.status === 200, `status=${loginA.status} ${messageOf(loginA)}`);
  check('Sau khi duyệt: canSell = true', (await sellerA.get('/api/seller/session')).json?.canSell === true);
  const wrongPassword = await new Client('sai mật khẩu').post('/api/seller/session', { email: sellerAEmail, password: 'sai-mat-khau' });
  check('Sai mật khẩu bị từ chối 401', wrongPassword.status === 401, `status=${wrongPassword.status}`);

  await sellerB.post('/api/seller/session', { email: sellerBEmail, password });
  await sellerC.post('/api/seller/session', { email: sellerCEmail, password });

  section('5.5. Quản lý kho hàng của shop & Sổ địa chỉ khách');
  const whListA = await sellerA.get('/api/seller/warehouses');
  check('Shop A có sẵn kho mặc định tự động tạo', (whListA.json?.warehouses || []).length >= 1);
  const defaultWhA = (whListA.json?.warehouses || [])[0];

  const newWhA = await sellerA.post('/api/seller/warehouses', {
    name: `Xưởng nung men số 2 ${stamp}`,
    addressText: 'Xóm 3 Bát Tràng, Gia Lâm, Hà Nội',
    isDefault: false,
  });
  check('Shop A tạo thêm kho thứ 2 thành công', newWhA.status === 201, `status=${newWhA.status}`);
  const whA2Id = newWhA.json?.warehouse?.id;

  // Shop B cố sửa kho của Shop A -> 404
  const crossWhEdit = await sellerB.patch(`/api/seller/warehouses/${whA2Id}`, { name: 'Hack Kho A' });
  check('Shop B không được sửa kho của Shop A (404)', crossWhEdit.status === 404);

  // Khách lưu địa chỉ vào Sổ địa chỉ
  const memberAddr = await member.post('/api/customer/addresses', {
    recipientName: 'Khách Thân Thiết',
    phone: '0988112233',
    addressText: 'Số 10 Phố Nhà Thờ, Hoàn Kiếm, Hà Nội',
    label: 'Nhà riêng',
    isDefault: true,
  });
  check('Khách lưu địa chỉ vào sổ thành công (201)', memberAddr.status === 201);
  const memberAddrList = await member.get('/api/customer/addresses');
  check('Khách đọc lại được sổ địa chỉ của mình', (memberAddrList.json?.addresses || []).length >= 1);

  // Cửa hàng công khai
  const publicStores = await guest.get('/api/stores');
  check('Khách xem danh sách cửa hàng di sản thành công', publicStores.status === 200 && (publicStores.json?.stores || []).length >= 3);
  const publicStoreA = await guest.get(`/api/stores/${storeA.slug}`);
  check('Khách xem chi tiết gian hàng của Shop A qua slug', publicStoreA.status === 200 && publicStoreA.json?.store?.name === storeA.name);

  section('6. Người bán đăng sản phẩm');
  const sharedBody = {
    name: `Bình gốm E2E ${stamp}`,
    description: 'Bình gốm do script kiểm thử tạo.',
    price: 320000,
    stock: 10,
    image: 'https://example.com/binh-gom.jpg',
    villageId: villageSlug,
    material: 'Đất sét',
    weightG: 900,
  };

  // Cố tình gửi storeId của cửa hàng B: máy chủ phải bỏ qua và gán theo phiên đăng nhập.
  // Gán kho xuất hàng thứ hai (whA2Id) để kiểm tra luồng kho riêng
  const productA = await sellerA.post('/api/seller/products', { ...sharedBody, storeId: storeB.id, warehouseId: whA2Id });
  check('Đăng sản phẩm A thành công', productA.status === 201, `status=${productA.status} ${messageOf(productA)}`);
  check(
    'storeId giả mạo từ client bị bỏ qua (sản phẩm thuộc cửa hàng A)',
    productA.json?.product?.storeId === storeA.id,
    `storeId=${productA.json?.product?.storeId}`
  );
  check('Sản phẩm A gắn đúng kho xuất hàng thứ hai đã chọn', productA.json?.product?.warehouseId === whA2Id);

  const productB = await sellerB.post('/api/seller/products', { ...sharedBody, name: `Đèn mây E2E ${stamp}`, price: 250000 });
  const productC = await sellerC.post('/api/seller/products', { ...sharedBody, name: `Khăn lụa E2E ${stamp}`, price: 410000 });
  check('Đăng sản phẩm B thành công', productB.status === 201, `status=${productB.status} ${messageOf(productB)}`);
  check('Đăng sản phẩm C thành công', productC.status === 201, `status=${productC.status} ${messageOf(productC)}`);

  const invalidVillage = await sellerA.post('/api/seller/products', { ...sharedBody, villageId: 'lang-nghe-khong-co' });
  check('Làng nghề không có trong danh mục bị từ chối (400)', invalidVillage.status === 400, `status=${invalidVillage.status}`);
  const invalidPrice = await sellerA.post('/api/seller/products', { ...sharedBody, price: 10 });
  check('Giá dưới mức tối thiểu bị từ chối (400)', invalidPrice.status === 400, `status=${invalidPrice.status}`);

  const idA = productA.json.product.id;
  const idB = productB.json.product.id;
  const idC = productC.json.product.id;

  section('7. Sản phẩm của người bán xuất hiện trên trang mua hàng');
  const catalog = await guest.get('/api/catalog');
  const foundA = (catalog.json?.products || []).find((item) => item.id === idA);
  check('Sản phẩm A có trong danh mục sàn', Boolean(foundA));
  check('Danh mục ghi rõ cửa hàng bán sản phẩm', foundA?.storeName === storeA.name, `storeName=${foundA?.storeName}`);
  check('Danh mục ghi trạng thái cửa hàng là active', foundA?.storeStatus === 'active');

  section('8. Khách mua sản phẩm của người bán A');
  const address = {
    text: 'Số 9 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội',
    note: 'Giao giờ hành chính',
    lat: 21.0285,
    lng: 105.8542,
    source: 'manual',
  };
  const customerEmail = `e2e-customer-${stamp}@example.com`;

  const orderA = await guest.post('/api/orders', {
    customer: { name: 'Khách E2E', phone: '0987654321', email: customerEmail },
    address,
    items: [{ productId: idA, quantity: 2 }],
  });
  check('Đặt đơn 1 cửa hàng thành công (201)', orderA.status === 201, `status=${orderA.status} ${messageOf(orderA)}`);
  const orderARecord = orderA.json?.order;
  check('Đơn có đúng 1 đơn con theo cửa hàng', orderARecord?.sellerOrders?.length === 1, `children=${orderARecord?.sellerOrders?.length}`);
  check('Đơn con thuộc cửa hàng A', orderARecord?.sellerOrders?.[0]?.storeId === storeA.id);
  check('Đơn con ở trạng thái chờ xác nhận', orderARecord?.sellerOrders?.[0]?.status === 'pending_confirmation');
  check('Tiền của đơn con khớp với đơn tổng', orderPricesMatch(orderARecord));
  const childA1 = orderARecord?.sellerOrders?.[0];

  const stockAfter = (await guest.get('/api/catalog')).json?.products?.find((item) => item.id === idA);
  check('Tồn kho bị trừ đúng 2 sau khi đặt', stockAfter?.stock === 8, `stock=${stockAfter?.stock}`);

  const orderAsGuest = await guest.get(`/api/orders/${orderARecord.id}`);
  check('Chính trình duyệt vừa đặt xem lại được đơn (không cần đăng nhập)', orderAsGuest.status === 200, `status=${orderAsGuest.status}`);
  const outsider = await new Client('người lạ').get(`/api/orders/${orderARecord.id}`);
  check('Trình duyệt khác không xem được đơn này (403)', outsider.status === 403, `status=${outsider.status}`);

  section('9. Chỉ người bán A nhận đơn và thông báo của đơn đó');
  const ordersOfA = await sellerA.get('/api/seller/orders');
  check('A thấy đơn con của mình trong Trung tâm người bán', (ordersOfA.json?.orders || []).some((item) => item.id === childA1.id));
  const ordersOfB = await sellerB.get('/api/seller/orders');
  check(
    'B KHÔNG thấy đơn của A',
    !(ordersOfB.json?.orders || []).some((item) => item.id === childA1.id),
    `B có ${ordersOfB.json?.orders?.length ?? 0} đơn`
  );
  const statsA = ordersOfA.json?.stats;
  check('Thống kê của A ghi nhận đơn cần xử lý', (statsA?.needsAction ?? 0) >= 1, `needsAction=${statsA?.needsAction}`);

  // API thông báo trả về { items, unreadCount } — đúng trường mà giao diện đang dùng.
  const notificationsA = await sellerA.get('/api/notifications');
  check(
    'A nhận thông báo "đơn mới" trong website',
    (notificationsA.json?.items || []).some((item) => item.orderId === orderARecord.id),
    `số thông báo=${notificationsA.json?.items?.length} chưa đọc=${notificationsA.json?.unreadCount}`
  );
  const notificationsB = await sellerB.get('/api/notifications');
  check(
    'B KHÔNG nhận thông báo của đơn A',
    !(notificationsB.json?.items || []).some((item) => item.orderId === orderARecord.id)
  );
  const notificationsAdmin = await admin.get('/api/notifications');
  check(
    'Quản trị viên nhận thông báo đơn mới',
    (notificationsAdmin.json?.items || []).some((item) => item.orderId === orderARecord.id)
  );

  section('10. Bảo mật: A không đọc/ghi được đơn của B');
  const orderAB = await guest.post('/api/orders', {
    customer: { name: 'Khách E2E', phone: '0987654321', email: customerEmail },
    address,
    items: [
      { productId: idA, quantity: 1 },
      { productId: idB, quantity: 1 },
    ],
  });
  const childB2 = (orderAB.json?.order?.sellerOrders || []).find((item) => item.storeId === storeB.id);
  const childA2 = (orderAB.json?.order?.sellerOrders || []).find((item) => item.storeId === storeA.id);
  const crossRead = await sellerA.get(`/api/seller/orders/${childB2?.id}`);
  check('A đọc đơn của B bị chặn (404)', crossRead.status === 404, `status=${crossRead.status}`);
  const crossWrite = await sellerA.patch(`/api/seller/orders/${childB2?.id}`, { status: 'confirmed' });
  check('A cập nhật đơn của B bị chặn (404)', crossWrite.status === 404, `status=${crossWrite.status}`);
  const reverseRead = await sellerB.get(`/api/seller/orders/${childA2?.id}`);
  check('B đọc đơn của A bị chặn (404)', reverseRead.status === 404, `status=${reverseRead.status}`);
  const sellerAdminApi = await sellerA.get('/api/admin/orders');
  check(
    'Người bán KHÔNG vào được API quản trị sàn',
    sellerAdminApi.status === 401 || sellerAdminApi.status === 403,
    `status=${sellerAdminApi.status}`
  );

  section('11. Khách mua từ ba cửa hàng trong cùng giỏ → ba đơn con');
  const orderABC = await guest.post('/api/orders', {
    customer: { name: 'Khách E2E', phone: '0987654321', email: customerEmail },
    address,
    items: [
      { productId: idA, quantity: 1 },
      { productId: idB, quantity: 2 },
      { productId: idC, quantity: 1 },
    ],
  });
  const orderABCRecord = orderABC.json?.order;
  check('Đặt đơn 3 cửa hàng thành công (201)', orderABC.status === 201, `status=${orderABC.status} ${messageOf(orderABC)}`);
  check('Tạo đúng 3 đơn con', orderABCRecord?.sellerOrders?.length === 3, `children=${orderABCRecord?.sellerOrders?.length}`);
  const storeIdsOfChildren = (orderABCRecord?.sellerOrders || []).map((item) => item.storeId).sort();
  check(
    'Mỗi cửa hàng nhận đúng một đơn con riêng',
    JSON.stringify(storeIdsOfChildren) === JSON.stringify([storeA.id, storeB.id, storeC.id].sort()),
    storeIdsOfChildren.join(',')
  );
  check('Tiền hàng + phí ship của các đơn con khớp đơn tổng', orderPricesMatch(orderABCRecord));
  check(
    'Mã đơn con phân biệt theo từng cửa hàng',
    new Set((orderABCRecord?.sellerOrders || []).map((item) => item.code)).size === 3,
    (orderABCRecord?.sellerOrders || []).map((item) => item.code).join(' ')
  );

  section('12. Người bán cập nhật trạng thái, khách thấy trạng thái mới');
  const confirmA = await sellerA.patch(`/api/seller/orders/${childA1.id}`, { status: 'confirmed', note: 'Đã tiếp nhận đơn.' });
  check('A xác nhận tiếp nhận đơn', confirmA.status === 200, `status=${confirmA.status} ${messageOf(confirmA)}`);
  check('Trạng thái đơn con đã đổi', confirmA.json?.order?.status === 'confirmed');
  check('Trạng thái đơn TỔNG được tổng hợp theo đơn con', confirmA.json?.parentStatus === 'confirmed', `parent=${confirmA.json?.parentStatus}`);

  const customerAfterConfirm = await guest.get(`/api/orders/${orderARecord.id}`);
  check(
    'Khách nhìn thấy trạng thái mới của đơn',
    customerAfterConfirm.json?.order?.status === 'confirmed',
    `status=${customerAfterConfirm.json?.order?.status}`
  );
  check(
    'Lịch sử đơn ghi rõ người thực hiện và thời gian',
    (customerAfterConfirm.json?.order?.events || []).some((event) => event.status === 'confirmed' && event.actorType === 'seller' && event.createdAt)
  );
  check(
    'Đơn con có lịch sử riêng để người bán/khách theo dõi',
    ((await sellerA.get(`/api/seller/orders/${childA1.id}`)).json?.order?.events || []).length >= 2
  );

  for (const next of ['preparing', 'ready_for_pickup']) {
    const step = await sellerA.patch(`/api/seller/orders/${childA1.id}`, { status: next });
    check(`A chuyển đơn sang "${next}"`, step.status === 200, `status=${step.status} ${messageOf(step)}`);
  }
  const handOver = await sellerA.patch(`/api/seller/orders/${childA1.id}`, {
    status: 'handed_to_carrier',
    note: 'Đã bàn giao cho đơn vị vận chuyển.',
    carrier: 'Viettel Post',
    trackingCode: `VTP${stamp.toUpperCase()}`,
  });
  check('A bàn giao đơn cho đơn vị vận chuyển', handOver.status === 200, `status=${handOver.status} ${messageOf(handOver)}`);
  check('Mã vận đơn do người bán nhập được lưu', handOver.json?.order?.trackingCode === `VTP${stamp.toUpperCase()}`);

  const jumpToDelivered = await sellerA.patch(`/api/seller/orders/${childA1.id}`, { status: 'delivered' });
  check(
    'Người bán KHÔNG thể nhảy bước tự đánh dấu đã giao (409)',
    jumpToDelivered.status === 409,
    `status=${jumpToDelivered.status} code=${jumpToDelivered.json?.error?.code}`
  );

  section('13. Quản trị viên theo dõi toàn sàn và đẩy đơn con theo từng cửa hàng');
  const adminOrders = await admin.get('/api/admin/orders');
  const adminOrder = (adminOrders.json?.orders || []).find((item) => item.id === orderARecord.id);
  check('Quản trị viên thấy đơn trong danh sách toàn sàn', Boolean(adminOrder));
  check('Đơn hiển thị kèm các đơn con theo cửa hàng', (adminOrder?.sellerOrders || []).length === 1);

  const adminTransit = await admin.patch(`/api/admin/orders/${orderARecord.id}`, { status: 'in_transit', note: 'Đơn vị vận chuyển đã lấy hàng.' });
  check('Quản trị viên chuyển đơn sang "đang vận chuyển"', adminTransit.status === 200, `status=${adminTransit.status} ${messageOf(adminTransit)}`);
  check(
    'Máy chủ báo cáo bước chuyển đã áp cho cửa hàng nào',
    (adminTransit.json?.sellerOrders || []).some((item) => item.storeId === storeA.id || item.storeName === storeA.name)
  );

  await admin.patch(`/api/admin/orders/${orderARecord.id}`, { status: 'out_for_delivery' });
  const delivered = await admin.patch(`/api/admin/orders/${orderARecord.id}`, { status: 'delivered', note: 'Khách đã nhận hàng.' });
  check('Quản trị viên hoàn tất đơn (đã giao)', delivered.json?.order?.status === 'delivered', `status=${delivered.json?.order?.status}`);
  const customerFinal = await guest.get(`/api/orders/${orderARecord.id}`);
  check('Khách thấy đơn đã giao thành công', customerFinal.json?.order?.status === 'delivered', `status=${customerFinal.json?.order?.status}`);

  const statsA2 = (await sellerA.get('/api/seller/orders')).json?.stats;
  check('Doanh thu của A được ghi nhận từ đơn đã giao', (statsA2?.revenue ?? 0) > 0, `revenue=${statsA2?.revenue}`);

  section('14. Tạm khóa người bán: không đăng bán, không xử lý đơn, sản phẩm ẩn khỏi sàn');
  const suspendB = await admin.patch(`/api/admin/stores/${storeB.id}`, { status: 'suspended', note: 'Tạm khóa để kiểm thử.' });
  check('Quản trị viên tạm khóa cửa hàng B', suspendB.json?.store?.status === 'suspended', messageOf(suspendB));

  const blockedProduct = await sellerB.post('/api/seller/products', { ...sharedBody, name: `Sản phẩm khi bị khóa ${stamp}` });
  check('B bị khóa KHÔNG thể đăng sản phẩm (403)', blockedProduct.status === 403, `status=${blockedProduct.status} code=${blockedProduct.json?.error?.code}`);
  const blockedOrder = await sellerB.patch(`/api/seller/orders/${childB2.id}`, { status: 'confirmed' });
  check('B bị khóa KHÔNG thể xử lý đơn (403)', blockedOrder.status === 403, `status=${blockedOrder.status} code=${blockedOrder.json?.error?.code}`);

  const catalogAfterSuspend = await guest.get('/api/catalog');
  check(
    'Sản phẩm của cửa hàng bị khóa KHÔNG còn hiển thị trên sàn',
    !(catalogAfterSuspend.json?.products || []).some((item) => item.id === idB)
  );
  const buySuspended = await guest.post('/api/orders', {
    customer: { name: 'Khách E2E', phone: '0987654321', email: customerEmail },
    address,
    items: [{ productId: idB, quantity: 1 }],
  });
  check('Khách KHÔNG đặt được sản phẩm của cửa hàng bị khóa (400)', buySuspended.status === 400, `status=${buySuspended.status}`);

  const reactivateB = await admin.patch(`/api/admin/stores/${storeB.id}`, { status: 'active', note: 'Mở lại sau kiểm thử.' });
  check('Quản trị viên kích hoạt lại cửa hàng B', reactivateB.json?.store?.status === 'active');

  section('15. Dữ liệu bền vững sau khi tải lại');
  const reloadCatalog = await guest.get('/api/catalog');
  check(
    'Sản phẩm và cửa hàng vẫn còn sau khi tải lại',
    (reloadCatalog.json?.products || []).some((item) => item.id === idA && item.storeName === storeA.name)
  );
  const reloadOrder = await guest.get(`/api/orders/${orderARecord.id}`);
  check('Trạng thái đơn giữ nguyên sau khi tải lại', reloadOrder.json?.order?.status === 'delivered');
  const reloadNotifications = await sellerA.get('/api/notifications');
  check(
    'Thông báo vẫn còn trong cơ sở dữ liệu (email chưa cấu hình cũng không mất)',
    (reloadNotifications.json?.items || []).length > 0,
    `số thông báo=${reloadNotifications.json?.items?.length}`
  );

  section('16. Website văn hóa hiện có vẫn hoạt động');
  for (const page of ['/', '/lang-nghe', '/cua-hang', '/san-pham', '/gio-hang', '/trai-nghiem', '/ho-chieu', '/ban-do', '/du-lich', '/thanh-toan']) {
    const response = await fetch(`${BASE}${page}`);
    check(`Trang ${page} trả 200`, response.status === 200, `status=${response.status}`);
  }
  const heritageApi = await guest.get('/api/catalog');
  check('API danh mục vẫn trả dữ liệu văn hóa/làng nghề', (heritageApi.json?.products || []).length > 0);

  // Tổng kết
  const passed = results.length - failed;
  console.log(`\n================ KẾT QUẢ KIỂM THỬ ================`);
  console.log(`Tổng số kiểm tra: ${results.length} — đạt: ${passed} — hỏng: ${failed}`);
  if (failed > 0) {
    console.log('\nCác kiểm tra KHÔNG đạt:');
    for (const item of results.filter((entry) => !entry.ok)) {
      console.log(`  ✗ ${item.label}${item.detail ? ` — ${item.detail}` : ''}`);
    }
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\nLỗi không mong đợi khi chạy kiểm thử:', error);
  process.exit(2);
});
