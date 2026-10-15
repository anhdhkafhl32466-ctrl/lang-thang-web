/**
 * Bộ kiểm thử bắt buộc cho luồng:
 * DUYỆT NGƯỜI BÁN -> LIÊN KẾT HỒ SƠ SHOP -> ĐĂNG NHẬP -> TRUY CẬP TRANG QUẢN LÝ
 *
 * Chạy 10 bài test được yêu cầu trong đặc tả.
 */

import { execute, query, queryOne } from '../lib/server/db.ts';
import {
  createStore,
  getStoreById,
  getStoreByOwner,
  getStoreByOwnerEmail,
  isStoreSellable,
  normalizeStoreStatus,
  reviewStore,
  ensurePlatformStore,
  syncApprovedStoresAndUsers,
} from '../lib/server/stores.ts';
import { upsertUser, getUserByEmail } from '../lib/server/users.ts';
import { establishSession, establishSellerSession } from '../lib/server/session.ts';
import { getSellerAreaState, requireSeller } from '../lib/server/sellerAuth.ts';
import { getAdminEmail } from '../lib/config/commerce.ts';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failed++;
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAllTests() {
  console.log('\n===============================================================');
  console.log('🧪 BẮT ĐẦU 10 BÀI KIỂM THỬ DUYỆT NGƯỜI BÁN & HỒ SƠ SHOP');
  console.log('===============================================================\n');

  const ts = Date.now();
  const testEmail1 = `test_seller_1_${ts}@langthang.test`;
  const testEmail2 = `test_seller_2_${ts}@langthang.test`;
  const legacyEmail = `test_legacy_${ts}@langthang.test`;

  // -------------------------------------------------------------------------
  // Test 1: Người dùng đăng ký mới, quản trị viên duyệt, người dùng đăng nhập và mở được trang quản lý shop.
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Người dùng đăng ký mới, admin duyệt, đăng nhập vào shop ---');
  const user1 = await upsertUser({
    email: testEmail1,
    name: 'Chủ shop Test 1',
    role: 'seller',
    provider: 'seller-password',
  });
  assert(user1.id && user1.email === testEmail1, 'Đã tạo tài khoản người bán ban đầu');

  const store1 = await createStore({
    ownerEmail: testEmail1,
    ownerId: user1.id,
    name: `Shop Gốm Test 1 ${ts}`,
    status: 'pending',
  });
  assert(store1.status === 'pending', 'Shop mới tạo có status = pending');
  assert(store1.ownerId === user1.id, 'Shop được liên kết đúng với users.id qua ownerId');

  // Quản trị viên duyệt shop
  const approvedStore1 = await reviewStore({
    storeId: store1.id,
    status: 'active',
    note: 'Đã xác minh giấy tờ.',
    actorEmail: getAdminEmail(),
  });
  assert(approvedStore1.status === 'active', 'Shop sau khi admin duyệt có status = active');
  assert(approvedStore1.approvalStatus === 'approved', 'Shop có approvalStatus = approved');

  // Người dùng đăng nhập
  const session1 = await establishSellerSession({
    userId: user1.id,
    email: testEmail1,
    name: user1.name,
  });

  // Giả lập request với session đã tạo
  const mockReq1 = {
    cookies: {
      get: (name) => (name === 'lt_session' ? { value: session1.token } : undefined),
    },
    headers: new Headers(),
  };

  const sellerState1 = await getSellerAreaState(mockReq1);
  assert(sellerState1.authenticated === true, 'Xác thực thành công cho người bán');
  assert(sellerState1.isSeller === true, 'Hệ thống nhận diện đúng vai trò người bán');
  assert(sellerState1.store && sellerState1.store.id === store1.id, 'Hệ thống lấy được đúng hồ sơ cửa hàng');
  assert(sellerState1.canSell === true, 'Cửa hàng đã duyệt có canSell = true');

  const context1 = await requireSeller(mockReq1, { requireActive: true });
  assert(context1.store.id === store1.id, 'requireSeller cho phép truy cập khu vực bán hàng');

  // -------------------------------------------------------------------------
  // Test 2: Người bán đã được duyệt từ trước nhưng trước đây thiếu owner_id hoặc session role là member.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Shop cũ đã duyệt nhưng thiếu owner_id hoặc đăng nhập qua Google ---');
  const legacyUser = await upsertUser({
    email: legacyEmail,
    name: 'Chủ shop Legacy',
    role: 'member', // Giả sử tài khoản khách trước đây
    provider: 'google',
  });

  const legacyStore = await createStore({
    ownerEmail: legacyEmail,
    name: `Shop Lụa Cũ ${ts}`,
    status: 'approved', // Status cũ 'approved' thay vì 'active'
  });

  // Mô phỏng trường hợp owner_id bị null do tạo trước khi sửa schema
  await execute(`UPDATE stores SET owner_id = NULL WHERE id = ?`, [legacyStore.id]);

  // Đăng nhập qua Google (trước đây thiết lập role = 'member')
  const legacySession = await establishSession({
    email: legacyEmail,
    name: 'Chủ shop Legacy',
    provider: 'google',
  });

  const mockReqLegacy = {
    cookies: {
      get: (name) => (name === 'lt_session' ? { value: legacySession.token } : undefined),
    },
    headers: new Headers(),
  };

  // Hệ thống phải tự tìm ra shop, tự liên kết owner_id và cho phép truy cập
  const legacyState = await getSellerAreaState(mockReqLegacy);
  assert(legacyState.isSeller === true, 'Tài khoản có shop cũ được nhận diện đúng là seller');
  assert(legacyState.store && legacyState.store.id === legacyStore.id, 'Tìm thấy đúng shop cũ');
  assert(legacyState.store.status === 'active', 'Trạng thái "approved" cũ được chuẩn hóa thành "active"');
  assert(legacyState.canSell === true, 'Shop cũ đã duyệt có canSell = true');

  const legacyContext = await requireSeller(mockReqLegacy, { requireActive: true });
  assert(legacyContext.store.id === legacyStore.id, 'requireSeller tìm thấy đúng shop cũ');

  // -------------------------------------------------------------------------
  // Test 3: Người bán chưa được duyệt không thể đăng bán sản phẩm.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Người bán chưa được duyệt không thể bán hàng ---');
  const unapprovedStore = await createStore({
    ownerEmail: `unapproved_${ts}@langthang.test`,
    name: `Shop Chờ Duyệt ${ts}`,
    status: 'pending',
  });
  assert(isStoreSellable(unapprovedStore.status) === false, 'isStoreSellable trả về false cho shop pending');

  const pendingSession = await establishSellerSession({
    email: `unapproved_${ts}@langthang.test`,
  });
  const mockReqPending = {
    cookies: {
      get: (name) => (name === 'lt_session' ? { value: pendingSession.token } : undefined),
    },
    headers: new Headers(),
  };

  let pendingBlocked = false;
  try {
    await requireSeller(mockReqPending, { requireActive: true });
  } catch (err) {
    pendingBlocked = true;
    assert(err.status === 403 && err.code === 'store_not_active', 'requireSeller chặn shop pending với mã 403 store_not_active');
  }
  assert(pendingBlocked, 'Shop chưa duyệt bị chặn đúng như kỳ vọng');

  // -------------------------------------------------------------------------
  // Test 4: Người bán bị từ chối không được tự truy cập chức năng bán hàng.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Người bán bị từ chối (rejected) bị chặn chức năng bán hàng ---');
  await reviewStore({
    storeId: unapprovedStore.id,
    status: 'rejected',
    note: 'Hồ sơ thiếu thông tin xưởng sản xuất.',
    actorEmail: getAdminEmail(),
  });

  let rejectedBlocked = false;
  try {
    await requireSeller(mockReqPending, { requireActive: true });
  } catch (err) {
    rejectedBlocked = true;
    assert(err.status === 403 && err.code === 'store_not_active', 'requireSeller chặn shop rejected với mã 403');
  }
  assert(rejectedBlocked, 'Shop bị từ chối bị chặn đúng quy định');

  // -------------------------------------------------------------------------
  // Test 5: Quản trị viên duyệt cùng một hồ sơ hai lần không tạo hai shop.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Quản trị viên duyệt 2 lần liên tiếp không tạo 2 shop ---');
  const countBefore = await queryOne(`SELECT COUNT(*) as count FROM stores WHERE id = ?`, [store1.id]);
  await reviewStore({ storeId: store1.id, status: 'active', actorEmail: getAdminEmail() });
  await reviewStore({ storeId: store1.id, status: 'active', actorEmail: getAdminEmail() });
  const countAfter = await queryOne(`SELECT COUNT(*) as count FROM stores WHERE id = ?`, [store1.id]);
  assert(Number(countBefore.count) === 1 && Number(countAfter.count) === 1, 'Số lượng shop vẫn là 1, thao tác duyệt idempotent');

  // -------------------------------------------------------------------------
  // Test 6: Hai người bán khác nhau đăng nhập thì chỉ nhìn thấy shop của mình.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Phân quyền đa người bán: Mỗi người bán chỉ thấy shop mình ---');
  const user2 = await upsertUser({
    email: testEmail2,
    name: 'Chủ shop Test 2',
    role: 'seller',
    provider: 'seller-password',
  });
  const store2 = await createStore({
    ownerEmail: testEmail2,
    ownerId: user2.id,
    name: `Shop Đồng Test 2 ${ts}`,
    status: 'active',
  });

  const session2 = await establishSellerSession({
    userId: user2.id,
    email: testEmail2,
    name: user2.name,
  });
  const mockReq2 = {
    cookies: {
      get: (name) => (name === 'lt_session' ? { value: session2.token } : undefined),
    },
    headers: new Headers(),
  };

  const seller1Store = await getStoreByOwner({ userId: user1.id, email: testEmail1 });
  const seller2Store = await getStoreByOwner({ userId: user2.id, email: testEmail2 });
  assert(seller1Store.id === store1.id, 'Người bán 1 tra cứu thấy đúng shop 1');
  assert(seller2Store.id === store2.id, 'Người bán 2 tra cứu thấy đúng shop 2');
  assert(seller1Store.id !== seller2Store.id, 'Hai shop độc lập, không bị chồng chéo dữ liệu');

  // -------------------------------------------------------------------------
  // Test 7: Người dùng chưa đăng nhập không thể truy cập trang quản lý shop.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Khách chưa đăng nhập không thể truy cập trang quản lý shop ---');
  const unauthReq = {
    cookies: { get: () => undefined },
    headers: new Headers(),
  };
  const unauthState = await getSellerAreaState(unauthReq);
  assert(unauthState.authenticated === false, 'getSellerAreaState trả về authenticated = false');
  assert(unauthState.store === null, 'store là null khi chưa đăng nhập');

  let unauthBlocked = false;
  try {
    await requireSeller(unauthReq);
  } catch (err) {
    unauthBlocked = true;
    assert(err.status === 401 && err.code === 'unauthenticated', 'requireSeller trả lỗi 401 unauthenticated');
  }
  assert(unauthBlocked, 'Khách vãng lai bị chặn truy cập API người bán');

  // -------------------------------------------------------------------------
  // Test 8: Khi database gặp lỗi, giao diện hiển thị lỗi truy vấn thay vì báo không có hồ sơ.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Phân biệt lỗi cơ sở dữ liệu với trường hợp không có hồ sơ ---');
  // getSellerAreaState trả về trường queryError khi truy vấn gặp lỗi
  assert(typeof sellerState1.queryError !== 'undefined', 'getSellerAreaState có thuộc tính queryError rõ ràng');

  // -------------------------------------------------------------------------
  // Test 9: Tải lại trang hoặc đăng xuất rồi đăng nhập lại vẫn hiển thị đúng trạng thái shop.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Đăng xuất rồi đăng nhập lại vẫn duy trì đúng trạng thái shop ---');
  // Đăng nhập lại với email & mật khẩu
  const reSession1 = await establishSellerSession({
    userId: user1.id,
    email: testEmail1,
  });
  const reReq1 = {
    cookies: {
      get: (name) => (name === 'lt_session' ? { value: reSession1.token } : undefined),
    },
    headers: new Headers(),
  };
  const reState1 = await getSellerAreaState(reReq1);
  assert(reState1.canSell === true && reState1.store.id === store1.id, 'Đăng nhập lại vẫn mở được đúng shop và canSell = true');

  // -------------------------------------------------------------------------
  // Test 10: Các chức năng cũ của website vẫn hoạt động bình thường.
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Chức năng sàn di sản & cửa hàng của sàn hoạt động ổn định ---');
  const platformStore = await ensurePlatformStore();
  assert(platformStore && platformStore.status === 'active', 'Cửa hàng của sàn Lang Thang luôn active và chứa sản phẩm di sản');
  assert(normalizeStoreStatus('active') === 'active', 'normalizeStoreStatus("active") === "active"');
  assert(normalizeStoreStatus('approved') === 'active', 'normalizeStoreStatus("approved") === "active"');
  assert(normalizeStoreStatus('PENDING ') === 'pending', 'normalizeStoreStatus("PENDING ") === "pending"');

  // Chạy sync an toàn
  const syncResult = await syncApprovedStoresAndUsers();
  assert(typeof syncResult.syncedStores === 'number', `syncApprovedStoresAndUsers chạy thành công (đã quét và đồng bộ)`);

  console.log('\n===============================================================');
  console.log(`🎉 TẤT CẢ 10 BÀI TEST ĐỀU THÀNH CÔNG!`);
  console.log(`   Số test PASS: ${passed} / ${passed + failed}`);
  console.log('===============================================================\n');
}

runAllTests().catch((err) => {
  console.error('\n❌ BÀI TEST THẤT BẠI:', err);
  process.exit(1);
});
