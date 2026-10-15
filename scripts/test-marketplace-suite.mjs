/**
 * Bộ kiểm thử toàn diện MarketPlace Đa Shop & Đăng ký người bán cho Lang Thang
 * Chạy trực tiếp qua node --experimental-json-modules
 */

import { execute, query, queryOne } from '../lib/server/db.ts';
import { getUserByEmail, createUser, verifyPassword, hashPassword } from '../lib/server/users.ts';
import { createStore, getStoreByOwnerEmail, getStoreById, listStores, reviewStore } from '../lib/server/stores.ts';
import {
  createWarehouse,
  listWarehousesByStore,
  getDefaultWarehouse,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  ensureDefaultWarehouseForStore,
} from '../lib/server/warehouses.ts';
import { createCustomerAddress, listCustomerAddresses, getDefaultCustomerAddress } from '../lib/server/customerAddresses.ts';
import { createStoreProduct, listProductsByStore } from '../lib/server/catalog.ts';
import { createOrder, getOrderById } from '../lib/server/orders.ts';
import { listSellerOrdersByStore, updateSellerOrderStatus } from '../lib/server/sellerOrders.ts';
import { getAdminEmail } from '../lib/config/commerce.ts';

async function runTestSuite() {
  console.log('\n===============================================================');
  console.log('🧪 BẮT ĐẦU BỘ KIỂM THỬ THỰC TẾ MARKETPLACE ĐA SHOP LANG THANG');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failed++;
      throw new Error(`Test assertion failed: ${message}`);
    }
  }

  // Dọn dẹp dữ liệu test cũ nếu có
  const testPrefix = `test_${Date.now()}`;
  const sellerAEmail = `${testPrefix}_sellerA@langthang.test`;
  const sellerBEmail = `${testPrefix}_sellerB@langthang.test`;
  const customerEmail = `${testPrefix}_customer@langthang.test`;

  try {
    // -------------------------------------------------------------
    // TEST 1: ĐĂNG KÝ NGƯỜI BÁN VỚI EMAIL MỚI TINH (Case 1)
    // -------------------------------------------------------------
    console.log('\n--- 1. Kiểm tra đăng ký người bán với EMAIL HOÀN TOÀN MỚI ---');
    const hashedPassA = await hashPassword('MatKhauChuan@123');
    const userA = await createUser({
      email: sellerAEmail,
      name: 'Nghệ nhân Bát Tràng A',
      phone: '0912000001',
      hashedPassword: hashedPassA,
      role: 'seller',
    });
    assert(userA.id && userA.role === 'seller', 'Tạo tài khoản người bán thành công với role = seller');

    const storeA = await createStore({
      ownerEmail: sellerAEmail,
      name: `Gốm Bát Tràng ${testPrefix}`,
      phone: '0912000001',
      contactName: 'Nghệ nhân Bát Tràng A',
      addressText: 'Thôn 1 Làng gốm Bát Tràng, Gia Lâm, Hà Nội',
      lat: 20.9754,
      lng: 105.9123,
      categories: ['Gốm sứ', 'Đồ thờ', 'Men rạn'],
      status: 'active',
    });
    assert(storeA.id && storeA.slug, `Tạo cửa hàng thành công: ${storeA.name} (slug: ${storeA.slug})`);

    const whADefault = await ensureDefaultWarehouseForStore(storeA);
    assert(whADefault.isDefault === true, `Tự động tạo kho mặc định cho shop: "${whADefault.name}"`);
    assert(whADefault.addressText === storeA.addressText, 'Địa chỉ kho mặc định trùng với địa chỉ shop khai báo');

    // -------------------------------------------------------------
    // TEST 2: EMAIL ĐÃ CÓ TÀI KHOẢN KHÁCH HÀNG NÂNG CẤP LÊN SHOP (Case 2)
    // -------------------------------------------------------------
    console.log('\n--- 2. Kiểm tra tài khoản khách hàng cũ NÂNG CẤP THÀNH NGƯỜI BÁN ---');
    // Giả lập tài khoản khách hàng cũ (đã từng mua hàng hoặc đăng nhập Google)
    const existingCustomer = await createUser({
      email: customerEmail,
      name: 'Khách Hàng Hà Nội',
      phone: '0988776655',
      role: 'customer',
    });
    assert(existingCustomer.role === 'customer', 'Tạo tài khoản khách hàng cũ với role = customer');

    // Nâng cấp khách hàng thành người bán mà không đổi ID tài khoản
    await execute(`UPDATE users SET role = 'seller', updated_at = ? WHERE id = ?`, [
      new Date().toISOString(),
      existingCustomer.id,
    ]);
    const upgradedUser = await getUserByEmail(customerEmail);
    assert(upgradedUser.id === existingCustomer.id, 'User ID được bảo toàn nguyên vẹn sau khi nâng cấp');
    assert(upgradedUser.role === 'seller', 'Quyền được nâng cấp thành seller hợp lệ');

    const storeCustomer = await createStore({
      ownerEmail: customerEmail,
      name: `Lụa Hà Đông ${testPrefix}`,
      contactName: upgradedUser.name,
      addressText: 'Phố Lụa Vạn Phúc, Hà Đông, Hà Nội',
      lat: 20.9789,
      lng: 105.7721,
      categories: ['Lụa tơ tằm', 'Khăn lụa', 'Áo dài'],
      status: 'active',
    });
    assert(storeCustomer.ownerEmail === customerEmail, 'Mở cửa hàng thành công cho tài khoản khách hàng cũ');

    // -------------------------------------------------------------
    // TEST 3: EMAIL ĐÃ CÓ CỬA HÀNG KHÔNG ĐƯỢC TẠO THÊM (Case 3)
    // -------------------------------------------------------------
    console.log('\n--- 3. Kiểm tra chặn tạo trùng cửa hàng khi đã có shop ---');
    let duplicateRejected = false;
    try {
      await createStore({
        ownerEmail: sellerAEmail,
        name: `Shop Thứ Hai Trùng Email ${testPrefix}`,
      });
    } catch (err) {
      duplicateRejected = true;
      assert(err.message.includes('đã có cửa hàng'), 'Máy chủ từ chối mở thêm cửa hàng khi tài khoản đã có shop');
    }
    assert(duplicateRejected, 'Hệ thống bảo đảm nguyên tắc 1 tài khoản tối đa 1 shop');

    // -------------------------------------------------------------
    // TEST 4: NHIỀU KHO HÀNG CHO MỘT SHOP & CÔ LẬP QUYỀN SỞ HỮU
    // -------------------------------------------------------------
    console.log('\n--- 4. Kiểm tra đa kho hàng và phân quyền cô lập giữa các shop ---');
    // Shop A tạo thêm kho thứ 2 (Xưởng nung men)
    const whA2 = await createWarehouse({
      storeId: storeA.id,
      name: 'Xưởng nung & hoàn thiện Bát Tràng (Kho 2)',
      addressText: 'Ngõ 5 Xóm Đông, Bát Tràng, Gia Lâm, Hà Nội',
      lat: 20.9765,
      lng: 105.914,
      contactName: 'Thợ cả Bát Tràng',
      phone: '0912000002',
      isDefault: false,
    });
    assert(whA2.id && whA2.storeId === storeA.id, 'Shop A tạo thành công kho thứ hai');

    // Tạo Shop B
    const userB = await createUser({
      email: sellerBEmail,
      name: 'Nghệ nhân Mây Tre B',
      phone: '0933000002',
      hashedPassword: hashedPassA,
      role: 'seller',
    });
    const storeB = await createStore({
      ownerEmail: sellerBEmail,
      name: `Mây Tre Phú Vinh ${testPrefix}`,
      addressText: 'Làng nghề Phú Vinh, Phú Nghĩa, Chương Mỹ, Hà Nội',
      lat: 20.9123,
      lng: 105.6789,
      categories: ['Mây tre đan', 'Nội thất thủ công'],
      status: 'active',
    });
    const whB = await ensureDefaultWarehouseForStore(storeB);
    assert(whB.storeId === storeB.id, 'Shop B tạo thành công kho riêng');

    // Shop B KHÔNG THỂ sửa hoặc xóa kho của Shop A
    let crossShopBlocked = false;
    try {
      await updateWarehouse(whA2.id, storeB.id, { name: 'Hack Kho A' });
    } catch (err) {
      crossShopBlocked = true;
      assert(err.message.includes('không có quyền') || err.status === 404, 'Shop B bị chặn khi cố sửa kho của Shop A');
    }
    assert(crossShopBlocked, 'Bảo mật cô lập kho giữa các shop hoạt động chính xác');

    // -------------------------------------------------------------
    // TEST 5: SẢN PHẨM GẮN KHO XUẤT HÀNG RIÊNG & RÀNG BUỘC KHI XÓA
    // -------------------------------------------------------------
    console.log('\n--- 5. Kiểm tra sản phẩm gắn kho riêng và ràng buộc toàn vẹn ---');
    // Sản phẩm 1 của Shop A dùng Kho 1 (mặc định)
    const productA1 = await createStoreProduct(storeA.id, {
      name: `Bình gốm men lam ${testPrefix}`,
      price: 450000,
      stock: 20,
      category: 'Gốm sứ',
      image: '/images/products/bat-trang-1.jpg',
      villageId: 'bat-trang',
      villageName: 'Làng gốm Bát Tràng',
      warehouseId: whADefault.id,
    });
    assert(productA1.warehouseId === whADefault.id, 'Sản phẩm 1 gắn đúng kho mặc định của Shop A');

    // Sản phẩm 2 của Shop A dùng Kho 2
    const productA2 = await createStoreProduct(storeA.id, {
      name: `Đĩa gốm men rạn vẽ vàng ${testPrefix}`,
      price: 850000,
      stock: 15,
      category: 'Gốm sứ',
      image: '/images/products/bat-trang-2.jpg',
      villageId: 'bat-trang',
      villageName: 'Làng gốm Bát Tràng',
      warehouseId: whA2.id,
    });
    assert(productA2.warehouseId === whA2.id, 'Sản phẩm 2 gắn đúng kho thứ hai của Shop A');

    // Sản phẩm 1 của Shop B dùng Kho của Shop B
    const productB1 = await createStoreProduct(storeB.id, {
      name: `Giỏ mây tre đan xuất khẩu ${testPrefix}`,
      price: 250000,
      stock: 30,
      category: 'Mây tre đan',
      image: '/images/products/phu-vinh-1.jpg',
      villageId: 'phu-vinh',
      villageName: 'Làng mây tre Phú Vinh',
      warehouseId: whB.id,
    });
    assert(productB1.warehouseId === whB.id, 'Sản phẩm của Shop B gắn đúng kho của Shop B');

    // Chặn xóa kho khi đang có sản phẩm dùng làm điểm xuất hàng
    let deleteWarehouseBlocked = false;
    try {
      await deleteWarehouse(whA2.id, storeA.id);
    } catch (err) {
      deleteWarehouseBlocked = true;
      assert(err.message.includes('đang sử dụng') || err.status === 409, 'Chặn xóa kho A2 vì có sản phẩm đang sử dụng');
    }
    assert(deleteWarehouseBlocked, 'Bảo vệ toàn vẹn dữ liệu kho và sản phẩm hoạt động chuẩn xác');

    // -------------------------------------------------------------
    // TEST 6: SỔ ĐỊA CHỈ KHÁCH HÀNG (Customer Address Book)
    // -------------------------------------------------------------
    console.log('\n--- 6. Kiểm tra Sổ địa chỉ khách hàng (Nhiều địa chỉ) ---');
    const addrHome = await createCustomerAddress({
      userEmail: customerEmail,
      recipientName: 'Khách Hàng',
      phone: '0988776655',
      addressText: 'Số 15 Phố Tràng Tiền, Hoàn Kiếm, Hà Nội',
      label: 'Nhà riêng',
      isDefault: true,
      lat: 21.0255,
      lng: 105.8567,
    });
    assert(addrHome.isDefault === true, 'Tạo địa chỉ Nhà riêng (mặc định)');

    const addrSchool = await createCustomerAddress({
      userEmail: customerEmail,
      recipientName: 'Khách Hàng (Ký túc xá)',
      phone: '0988776655',
      addressText: 'Ký túc xá Đại học FPT, Khu CNC Hòa Lạc, Thạch Thất, Hà Nội',
      label: 'Ký túc xá',
      isDefault: false,
      lat: 21.0135,
      lng: 105.5252,
    });
    assert(addrSchool.label === 'Ký túc xá', 'Tạo thêm địa chỉ Ký túc xá');

    const customerAddresses = await listCustomerAddresses(customerEmail);
    assert(customerAddresses.length === 2, `Khách hàng lưu thành công ${customerAddresses.length} địa chỉ nhận hàng`);

    // -------------------------------------------------------------
    // TEST 7: GIỎ HÀNG ĐA SHOP & TÁCH ĐƠN TỔNG THÀNH CÁC ĐƠN CON
    // -------------------------------------------------------------
    console.log('\n--- 7. Kiểm tra ĐẶT HÀNG ĐA SHOP và TÁCH ĐƠN CON ĐỘC LẬP ---');
    // Khách mua 1 sản phẩm của Shop A (Bình gốm 450k) và 2 sản phẩm của Shop B (Giỏ mây 250k x 2 = 500k)
    const orderResult = await createOrder(
      {
        customer: {
          name: 'Khách Hàng Tràng Tiền',
          phone: '0988776655',
          email: customerEmail,
        },
        address: {
          text: addrHome.addressText,
          lat: addrHome.lat,
          lng: addrHome.lng,
          source: 'manual',
        },
        items: [
          { productId: productA1.id, quantity: 1 },
          { productId: productB1.id, quantity: 2 },
        ],
        paymentMethod: 'cod',
      },
      customerEmail
    );

    assert(orderResult.order && orderResult.order.id, `Tạo đơn tổng thành công mã: ${orderResult.order.code}`);

    const loadedOrder = await getOrderById(orderResult.order.id);
    assert(loadedOrder.sellerOrders && loadedOrder.sellerOrders.length === 2, 'Đơn hàng được TÁCH THÀNH 2 ĐƠN CON theo đúng 2 shop');

    const subOrderA = loadedOrder.sellerOrders.find((so) => so.storeId === storeA.id);
    const subOrderB = loadedOrder.sellerOrders.find((so) => so.storeId === storeB.id);

    assert(Boolean(subOrderA), 'Đơn con của Shop A tồn tại');
    assert(Boolean(subOrderB), 'Đơn con của Shop B tồn tại');
    assert(subOrderA.subtotal === 450000, `Tiền hàng Shop A chính xác: ${subOrderA.subtotal} VNĐ`);
    assert(subOrderB.subtotal === 500000, `Tiền hàng Shop B chính xác: ${subOrderB.subtotal} VNĐ`);

    // Kiểm tra bản chụp kho xuất hàng trong đơn con
    assert(subOrderA.warehouseId === whADefault.id, `Đơn con A chụp đúng ID kho xuất: ${subOrderA.warehouseId}`);
    assert(subOrderA.storeAddress.includes('Bát Tràng'), 'Đơn con A chụp đúng địa chỉ xưởng Bát Tràng tại thời điểm đặt');
    assert(subOrderB.storeAddress.includes('Phú Vinh'), 'Đơn con B chụp đúng địa chỉ xưởng Phú Vinh tại thời điểm đặt');

    // -------------------------------------------------------------
    // TEST 8: BẤT BIẾN DỮ LIỆU ĐƠN CŨ KHI SỬA ĐỊA CHỈ KHO
    // -------------------------------------------------------------
    console.log('\n--- 8. Kiểm tra tính bất biến của đơn cũ khi shop đổi địa chỉ kho ---');
    await updateWarehouse(whADefault.id, storeA.id, {
      addressText: 'Địa Chỉ Mới Toàn Bộ Đã Dời Xưởng Về Long Biên',
    });
    const reloadedSubOrderA = (await getOrderById(orderResult.order.id)).sellerOrders.find((so) => so.storeId === storeA.id);
    assert(reloadedSubOrderA.storeAddress.includes('Bát Tràng'), 'Đơn cũ giữ nguyên bản chụp địa chỉ cũ, không bị biến dạng khi shop đổi kho');

    // -------------------------------------------------------------
    // TEST 9: PHÂN QUYỀN ĐƠN HÀNG GIỮA CÁC SHOP VÀ CHUYỂN TRẠNG THÁI ĐỘC LẬP
    // -------------------------------------------------------------
    console.log('\n--- 9. Kiểm tra phân quyền xử lý đơn & chuyển trạng thái độc lập ---');
    // Shop A chỉ thấy đơn của Shop A
    const sellerAOrders = await listSellerOrdersByStore(storeA.id);
    const hasOrderBInA = sellerAOrders.some((so) => so.storeId === storeB.id);
    assert(!hasOrderBInA, 'Shop A hoàn toàn không nhìn thấy đơn của Shop B');

    // Shop A xác nhận và chuẩn bị đơn của mình
    const transitionSuccess = await updateSellerOrderStatus({
      sellerOrderId: subOrderA.id,
      storeId: storeA.id,
      nextStatus: 'confirmed',
      note: 'Xưởng gốm đã tiếp nhận và chuẩn bị đóng gói sản phẩm men lam',
      actorEmail: sellerAEmail,
    });
    assert(transitionSuccess.status === 'confirmed', 'Shop A chuyển trạng thái đơn con thành "confirmed" thành công');

    // Shop B không thể sửa đơn của Shop A
    let crossOrderBlocked = false;
    try {
      await updateSellerOrderStatus({
        sellerOrderId: subOrderA.id,
        storeId: storeB.id,
        nextStatus: 'cancelled',
        note: 'Shop B cố huỷ đơn của Shop A',
        actorEmail: sellerBEmail,
      });
    } catch (err) {
      crossOrderBlocked = true;
      assert(err.message.includes('không thuộc cửa hàng') || err.status === 404, 'Shop B bị chặn khi cố sửa đơn của Shop A');
    }
    assert(crossOrderBlocked, 'Bảo vệ quyền xử lý đơn hàng giữa các shop hoạt động tuyệt đối an toàn');

    // -------------------------------------------------------------
    // TEST 10: QUẢN TRỊ VIÊN TOÀN SÀN (anhdhkafhl32466@gmail.com)
    // -------------------------------------------------------------
    console.log('\n--- 10. Kiểm tra quyền giám sát toàn sàn của Quản trị viên ---');
    const adminEmail = getAdminEmail();
    assert(adminEmail === 'anhdhkafhl32466@gmail.com', `Email quản trị viên cấu hình đúng: ${adminEmail}`);

    const allStores = await listStores();
    assert(allStores.length >= 2, `Admin truy xuất được toàn bộ ${allStores.length} cửa hàng trên sàn`);

    // Admin có thể duyệt / đình chỉ bất kỳ shop nào
    const suspendedStore = await reviewStore({
      storeId: storeB.id,
      status: 'suspended',
      note: 'Tạm khóa để kiểm tra chất lượng định kỳ',
      actorEmail: adminEmail,
    });
    assert(suspendedStore.status === 'suspended', 'Admin tạm khóa cửa hàng thành công');

    // Kích hoạt lại shop
    const reactivatedStore = await reviewStore({
      storeId: storeB.id,
      status: 'active',
      note: 'Đã hoàn tất kiểm tra, cho phép hoạt động lại bình thường',
      actorEmail: adminEmail,
    });
    assert(reactivatedStore.status === 'active', 'Admin kích hoạt lại cửa hàng thành công');

    console.log('\n===============================================================');
    console.log(`🎉 HOÀN THÀNH TẤT CẢ ${passed} BÀI KIỂM THỬ THÀNH CÔNG! (Thất bại: ${failed})`);
    console.log('===============================================================\n');
  } catch (error) {
    console.error('\n❌ PHÁT HIỆN LỖI TRONG QUÁ TRÌNH KIỂM THỬ:');
    console.error(error);
    process.exit(1);
  }
}

runTestSuite();
