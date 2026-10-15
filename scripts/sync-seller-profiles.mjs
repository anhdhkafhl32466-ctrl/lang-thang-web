/**
 * Script đồng bộ dữ liệu hồ sơ người bán & cửa hàng (Yêu cầu 7).
 *
 * Nhiệm vụ:
 *  1. Quét toàn bộ bảng stores: nếu thiếu owner_id thì đối chiếu users.email để liên kết với users.id.
 *  2. Chuẩn hóa trạng thái duyệt: các shop 'approved' được chuẩn hóa thành 'active' và ghi nhận approval_status = 'approved'.
 *  3. Cập nhật role = 'seller' trong bảng users cho mọi chủ shop đã được duyệt.
 *  4. Tự động tạo kho mặc định trong bảng warehouses cho các shop đang hoạt động mà chưa có kho.
 *  5. Báo cáo chi tiết, không xóa bất kỳ bản ghi nào, chạy an toàn và có thể chạy lại nhiều lần (idempotent).
 *
 * Chạy bằng:
 *  node scripts/sync-seller-profiles.mjs
 */

import { execute, query, queryOne, getDbBackend, describeDbBackend } from '../lib/server/db.ts';
import { toStore } from '../lib/server/stores.ts';
import { ensureDefaultWarehouseForStore } from '../lib/server/warehouses.ts';

async function main() {
  console.log('=== BẮT ĐẦU ĐỒNG BỘ HỒ SƠ NGƯỜI BÁN & CỬA HÀNG ===');
  const backend = describeDbBackend();
  console.log(`Cơ sở dữ liệu: ${backend.backend} (${backend.target})`);

  const stores = await query('SELECT * FROM stores');
  console.log(`Tìm thấy tổng cộng ${stores.length} cửa hàng trong bảng stores.`);

  let linkedOwnerCount = 0;
  let updatedRoleCount = 0;
  let statusNormalizedCount = 0;
  let warehouseCreatedCount = 0;
  const orphanStores = [];

  for (const raw of stores) {
    const store = toStore(raw);
    const ownerEmail = (store.ownerEmail || '').trim().toLowerCase();

    if (!ownerEmail) {
      orphanStores.push({ id: store.id, name: store.name, reason: 'Không có owner_email' });
      continue;
    }

    const user = await queryOne('SELECT * FROM users WHERE lower(email) = ?', [ownerEmail]);

    if (!user) {
      orphanStores.push({ id: store.id, name: store.name, email: ownerEmail, reason: 'Chưa có tài khoản trong bảng users' });
    } else {
      // 1. Liên kết owner_id nếu chưa có
      if (!raw.owner_id || raw.owner_id !== user.id) {
        await execute('UPDATE stores SET owner_id = ? WHERE id = ?', [user.id, store.id]);
        linkedOwnerCount++;
        console.log(`[LIÊN KẾT] Cửa hàng "${store.name}" (${store.id}) -> User ID: ${user.id}`);
      }

      // 2. Chuẩn hóa trạng thái duyệt
      const rawStatus = String(raw.status || '').trim().toLowerCase();
      if (rawStatus === 'approved') {
        await execute("UPDATE stores SET status = 'active', approval_status = 'approved' WHERE id = ?", [store.id]);
        statusNormalizedCount++;
        console.log(`[CHUẨN HÓA] Cửa hàng "${store.name}" status: 'approved' -> 'active'`);
      } else if (!raw.approval_status) {
        const appStatus = store.status === 'active' ? 'approved' : store.status;
        await execute('UPDATE stores SET approval_status = ? WHERE id = ?', [appStatus, store.id]);
      }

      // 3. Cập nhật role = 'seller' cho chủ shop nếu shop đã active/approved
      if (store.status === 'active' && user.role !== 'seller' && user.role !== 'admin') {
        await execute("UPDATE users SET role = 'seller' WHERE id = ?", [user.id]);
        updatedRoleCount++;
        console.log(`[CẬP NHẬT QUYỀN] Tài khoản ${ownerEmail} -> role: 'seller'`);
      }
    }

    // 4. Đảm bảo kho xuất hàng mặc định
    if (store.status === 'active') {
      try {
        await ensureDefaultWarehouseForStore(store);
        warehouseCreatedCount++;
      } catch (e) {
        console.warn(`[CẢNH BÁO KHO] Không thể tạo kho mặc định cho shop ${store.id}:`, e.message);
      }
    }
  }

  console.log('\n=== KẾT QUẢ ĐỒNG BỘ DỮ LIỆU ===');
  console.log(`- Cửa hàng đã liên kết owner_id: ${linkedOwnerCount}`);
  console.log(`- Cửa hàng chuẩn hóa trạng thái: ${statusNormalizedCount}`);
  console.log(`- Tài khoản người dùng được nâng role seller: ${updatedRoleCount}`);
  console.log(`- Kho xuất hàng mặc định đã kiểm tra/tạo: ${warehouseCreatedCount}`);
  if (orphanStores.length > 0) {
    console.log(`- Cửa hàng cần kiểm tra thủ công (orphan): ${orphanStores.length}`);
    for (const item of orphanStores) {
      console.log(`  + ${item.id} - ${item.name} (${item.email || 'N/A'}): ${item.reason}`);
    }
  } else {
    console.log('- Tất cả cửa hàng đều đã được liên kết đầy đủ và an toàn!');
  }
  console.log('=== HOÀN TẤT ĐỒNG BỘ ===');
}

main().catch((err) => {
  console.error('Lỗi khi chạy đồng bộ dữ liệu:', err);
  process.exit(1);
});
