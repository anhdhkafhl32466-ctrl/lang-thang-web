import type { Metadata } from 'next';
import SellerGate from '@/components/seller/SellerGate';

export const metadata: Metadata = {
  title: 'Trung tâm người bán | Lang Thang — Làng Nghề Hà Nội',
  description:
    'Khu vực quản lý cửa hàng: đăng sản phẩm thủ công mỹ nghệ, nhận đơn theo cửa hàng, cập nhật trạng thái giao hàng và theo dõi doanh thu.',
};

/**
 * Khu vực dành riêng cho NGƯỜI BÁN.
 * Quyền truy cập do máy chủ quyết định ở từng API; layout chỉ lo giao diện và trạng thái cửa hàng.
 */
export default function SellerLayout({ children }: { children: React.ReactNode }) {
  return <SellerGate>{children}</SellerGate>;
}
