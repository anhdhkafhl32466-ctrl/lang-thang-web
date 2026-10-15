/**
 * Nhãn và mô tả trạng thái cửa hàng — dữ liệu THUẦN, dùng được ở cả máy chủ và trình duyệt.
 *
 * Vì sao tách khỏi lib/server/stores.ts: giao diện (client component) cần hiển thị nhãn trạng thái, mà
 * lib/server/stores.ts lại kéo theo tầng cơ sở dữ liệu (node:sqlite, fs) — nhập vào client sẽ làm hỏng
 * gói chạy trên trình duyệt. Tách dữ liệu thuần ra đây giữ một nguồn sự thật duy nhất cho cả hai phía.
 */

import type { StoreStatus } from './types';

export const STORE_STATUSES: StoreStatus[] = ['pending', 'active', 'suspended', 'rejected'];

export const STORE_STATUS_META: Record<
  StoreStatus,
  { label: string; description: string; tone: 'pending' | 'progress' | 'success' | 'danger' }
> = {
  pending: {
    label: 'Chờ xét duyệt',
    description: 'Hồ sơ đã được ghi nhận và đang chờ quản trị viên sàn duyệt.',
    tone: 'pending',
  },
  active: {
    label: 'Đang hoạt động',
    description: 'Cửa hàng đã được duyệt, sản phẩm được bán và đơn được xử lý bình thường.',
    tone: 'success',
  },
  suspended: {
    label: 'Bị tạm khóa',
    description: 'Cửa hàng tạm ngừng bán; sản phẩm không hiển thị và không nhận đơn mới.',
    tone: 'danger',
  },
  rejected: {
    label: 'Bị từ chối',
    description: 'Hồ sơ đăng ký không được chấp thuận.',
    tone: 'danger',
  },
};
