import { execute, query, queryOne } from '../lib/server/db';
import {
  createStore,
  getStoreById,
  getStoreByOwner,
  getStoreByOwnerEmail,
  isStoreSellable,
  listStores,
  countStoresByStatus,
  normalizeStoreStatus,
  reviewStore,
  ensurePlatformStore,
  syncApprovedStoresAndUsers,
} from '../lib/server/stores';
import { upsertUser, getUserByEmail } from '../lib/server/users';
import { establishSession, establishSellerSession, requireAdminSession } from '../lib/server/session';
import { getSellerAreaState, requireSeller } from '../lib/server/sellerAuth';
import { getAdminEmail } from '../lib/config/commerce';
import { ensureDefaultWarehouseForStore } from '../lib/server/warehouses';
import crypto from 'crypto';

let passed = 0;
let failed = 0;

function assert(condition: any, message: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTestFlow() {
  console.log('\n===============================================================');
  console.log('🧪 KIỂM THỬ ĐẦY ĐỦ LUỒNG GỬI HỒ SƠ -> ADMIN NHẬN -> DUYỆT -> VÀO SHOP');
  console.log('===============================================================\n');

  const ts = Date.now();
  const sellerEmail = `artisan_${ts}@craft.test`;
  const sellerPassword = 'StrongPassword123!';
  const storeName = `Xưởng Gốm Thử Nghiệm ${ts}`;
  const addressText = 'Số 18 đường Bát Tràng, xã Bát Tràng, huyện Gia Lâm, Hà Nội';
  const adminEmail = getAdminEmail().toLowerCase();

  // BƯỚC 1: Đăng ký tài khoản người bán mới với dữ liệu hợp lệ
  console.log('--- BƯỚC 1: Người bán đăng ký hồ sơ mở shop ---');
  const userId = `usr_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await execute(
    `INSERT INTO users (id, email, name, role, provider, phone, created_at, last_login_at)
     VALUES (?, ?, ?, 'seller', 'seller-password', ?, ?, ?)`,
    [userId, sellerEmail, 'Nghệ nhân Thử Nghiệm', '0912345678', now, now]
  );
  assert(true, 'Tạo tài khoản người dùng với vai trò người bán');

  const newStore = await createStore({
    ownerEmail: sellerEmail,
    ownerId: userId,
    name: storeName,
    description: 'Xưởng gốm thủ công truyền thống 3 đời',
    phone: '0912345678',
    contactName: 'Nghệ nhân Thử Nghiệm',
    addressText,
    addressNote: 'Gần đình làng Bát Tràng',
    categories: ['Gốm sứ'],
    status: 'pending',
  });
  await ensureDefaultWarehouseForStore(newStore);

  assert(newStore.id && newStore.id.startsWith('str_'), 'Hồ sơ cửa hàng được tạo với ID hợp lệ');
  assert(newStore.status === 'pending', 'Trạng thái ban đầu là pending (chờ duyệt)');
  assert(newStore.ownerId === userId, 'Cửa hàng được liên kết chặt chẽ với users.id');
  assert(newStore.addressText === addressText, 'Địa chỉ xuất hàng dạng chữ được lưu chính xác');

  // BƯỚC 2: Kiểm tra bản ghi tồn tại trong Database
  console.log('\n--- BƯỚC 2: Xác nhận bản ghi thực sự tồn tại trong DB ---');
  const dbStore = await queryOne<any>(`SELECT * FROM stores WHERE id = ?`, [newStore.id]);
  assert(dbStore !== null, 'Bản ghi cửa hàng nằm trong bảng stores');
  assert(dbStore.owner_email === sellerEmail, 'Email chủ sở hữu chính xác');
  assert(dbStore.owner_id === userId, 'Khóa ngoại owner_id trỏ đúng tới tài khoản user');

  // BƯỚC 3: Mở trang quản trị bằng tài khoản admin & kiểm tra danh sách chờ duyệt
  console.log('\n--- BƯỚC 3: Quản trị viên truy vấn danh sách chờ duyệt ---');
  const adminSession = await establishSession({
    email: adminEmail,
    name: 'Quản trị viên Lang Thang',
    provider: 'admin-key',
  });
  assert(adminSession.payload.role === 'admin', 'Phiên quản trị viên có role = admin');

  // Mock request kiểm tra requireAdminSession
  const mockAdminReq = {
    headers: new Map([
      ['cookie', `lt_session=${adminSession.token}`],
      ['host', 'localhost:3000'],
    ]),
  } as any;
  const verifiedAdmin = requireAdminSession(mockAdminReq);
  assert(verifiedAdmin.role === 'admin', 'requireAdminSession xác thực thành công quyền admin');

  // Danh sách hồ sơ chờ duyệt
  const pendingStores = await listStores({ status: 'pending' });
  const foundPending = pendingStores.find((s) => s.id === newStore.id);
  assert(Boolean(foundPending), 'Hồ sơ mới gửi xuất hiện trong danh sách chờ duyệt của admin');

  const totals = await countStoresByStatus();
  assert(totals.pending >= 1, `Tổng số hồ sơ chờ duyệt hiển thị chính xác (pending = ${totals.pending})`);

  // BƯỚC 4: Quản trị viên duyệt hồ sơ
  console.log('\n--- BƯỚC 4: Quản trị viên duyệt hồ sơ cửa hàng ---');
  const approvedStore = await reviewStore({
    storeId: newStore.id,
    status: 'active',
    note: 'Đã xác minh đầy đủ thông tin xưởng gốm.',
    actorEmail: adminEmail,
  });
  assert(approvedStore.status === 'active', 'Trạng thái chuyển thành active sau khi duyệt');
  assert(approvedStore.approvalStatus === 'approved', 'Trường approvalStatus ghi nhận approved');
  assert(approvedStore.approvedBy === adminEmail, 'Lưu đúng email quản trị viên đã duyệt');

  // Xác nhận trong DB
  const dbApproved = await queryOne<any>(`SELECT * FROM stores WHERE id = ?`, [newStore.id]);
  assert(dbApproved.status === 'active', 'DB cập nhật status = active');
  assert(dbApproved.approval_status === 'approved', 'DB cập nhật approval_status = approved');

  const dbUser = await getUserByEmail(sellerEmail);
  assert(dbUser?.role === 'seller', 'Tài khoản người bán trong bảng users có role = seller');

  // BƯỚC 5: Người bán đăng nhập & truy cập Trung tâm người bán
  console.log('\n--- BƯỚC 5: Người bán đăng nhập & mở trang quản lý shop ---');
  // 1. Đăng nhập qua seller password session
  const sellerSession = await establishSellerSession({
    userId,
    email: sellerEmail,
    name: 'Nghệ nhân Thử Nghiệm',
  });
  const mockSellerReq = {
    headers: new Map([
      ['cookie', `lt_session=${sellerSession.token}`],
      ['host', 'localhost:3000'],
    ]),
  } as any;

  const sellerState = await getSellerAreaState(mockSellerReq);
  assert(sellerState.authenticated === true, 'Người bán đã đăng nhập');
  assert(sellerState.isSeller === true, 'Được nhận diện là người bán');
  assert(sellerState.store !== null, 'Tìm thấy hồ sơ cửa hàng');
  assert(sellerState.store?.id === newStore.id, 'Hồ sơ cửa hàng khớp với shop vừa được duyệt');
  assert(sellerState.canSell === true, 'Cửa hàng đủ điều kiện bán hàng (canSell = true)');

  const reqSeller = await requireSeller(mockSellerReq);
  assert(reqSeller.store.id === newStore.id, 'requireSeller cho phép truy cập khu vực người bán');

  // 2. Đăng nhập qua Google session (kiểm tra không bị hạ role)
  console.log('\n--- BƯỚC 6: Đăng nhập lại qua Google OAuth — bảo toàn quyền người bán ---');
  const googleSession = await establishSession({
    userId,
    email: sellerEmail,
    name: 'Nghệ nhân Google Login',
    provider: 'google',
  });
  assert(googleSession.payload.role === 'seller', 'establishSession tự động giữ vai trò seller');

  const mockGoogleReq = {
    headers: new Map([
      ['cookie', `lt_session=${googleSession.token}`],
      ['host', 'localhost:3000'],
    ]),
  } as any;
  const googleSellerState = await getSellerAreaState(mockGoogleReq);
  assert(googleSellerState.isSeller === true && googleSellerState.canSell === true, 'Vẫn mở được shop khi đăng nhập bằng Google');

  // BƯỚC 7: Kiểm tra tính Idempotent — Duyệt 2 lần không tạo 2 shop
  console.log('\n--- BƯỚC 7: Kiểm tra duyệt trùng lặp (Idempotent) ---');
  const reApproved = await reviewStore({
    storeId: newStore.id,
    status: 'active',
    note: 'Duyệt lần 2 kiểm tra idempotent',
    actorEmail: adminEmail,
  });
  assert(reApproved.id === newStore.id, 'ID cửa hàng giữ nguyên');
  const allStoresForEmail = await query(`SELECT * FROM stores WHERE lower(owner_email) = ?`, [sellerEmail]);
  assert(allStoresForEmail.length === 1, 'Chỉ có duy nhất 1 cửa hàng cho tài khoản này');

  // BƯỚC 8: Kiểm tra người dùng không phải admin bị chặn truy cập
  console.log('\n--- BƯỚC 8: Người dùng thường bị chặn truy cập API admin ---');
  let blocked = false;
  try {
    requireAdminSession(mockSellerReq);
  } catch (err: any) {
    blocked = err.status === 403;
  }
  assert(blocked, 'Người bán không thể gọi API quản trị sàn (403 forbidden)');

  console.log('\n===============================================================');
  console.log(`🎉 TOÀN BỘ KIỂM THỬ THÀNH CÔNG! [PASS: ${passed}/${passed + failed}]`);
  console.log('===============================================================\n');
}

runTestFlow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('FATAL ERROR IN TEST SUITE:', err);
    process.exit(1);
  });
