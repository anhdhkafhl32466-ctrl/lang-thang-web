/**
 * Kiểu dữ liệu dùng chung (client + server) cho ĐÁNH GIÁ, HỎI ĐÁP và BÁO CÁO NỘI DUNG.
 *
 * Nguyên tắc: mọi con số thống kê (điểm trung bình, số lượt, phân bố sao) đều do máy chủ tính từ
 * bản ghi thật trong bảng product_reviews. Giao diện không bao giờ tự bịa số sao khi chưa có đánh giá.
 */

export type ReviewStatus = 'published' | 'hidden';
export type ReportTargetType = 'review' | 'question' | 'answer';
export type ReportStatus = 'open' | 'resolved' | 'dismissed';

export interface ReviewReply {
  body: string;
  by: string;
  at: string;
}

/** Một đánh giá sản phẩm kèm phản hồi của người bán (nếu có). */
export interface ProductReview {
  id: string;
  productId: string;
  storeId: string;
  orderId: string;
  orderCode: string | null;
  authorName: string;
  rating: number;
  comment: string | null;
  packagingRating: number | null;
  deliveryRating: number | null;
  images: string[];
  verifiedPurchase: boolean;
  status: ReviewStatus;
  reply: ReviewReply | null;
  createdAt: string;
  updatedAt: string;
  /** Đánh giá do chính tài khoản đang xem viết (máy chủ xác định từ phiên). */
  mine: boolean;
}

export interface ReviewSummary {
  /** Điểm trung bình từ đánh giá ĐANG HIỂN THỊ; 0 khi chưa có đánh giá nào. */
  average: number;
  count: number;
  /** Số lượt theo từng mức sao 1..5. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  /** Điểm trung bình đóng gói & giao hàng (chỉ tính đánh giá có chấm). */
  packagingAverage: number | null;
  deliveryAverage: number | null;
}

/** Một đơn đã giao đủ điều kiện đánh giá sản phẩm. */
export interface ReviewEligibility {
  orderId: string;
  orderCode: string;
  sellerOrderId: string | null;
  productId: string;
  deliveredAt: string | null;
  alreadyReviewed: boolean;
  reviewId: string | null;
}

export interface ProductAnswer {
  id: string;
  questionId: string;
  body: string;
  authorName: string;
  isSeller: boolean;
  createdAt: string;
  status: ReviewStatus;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  storeId: string;
  authorName: string;
  body: string;
  createdAt: string;
  status: ReviewStatus;
  mine: boolean;
  answers: ProductAnswer[];
}

/** Câu hỏi kèm tên sản phẩm — dùng cho trang quản lý của người bán. */
export interface SellerQuestion extends ProductQuestion {
  productName: string;
  productImage: string | null;
}

export interface SellerReview extends ProductReview {
  productName: string;
  productImage: string | null;
}

export interface ContentReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  productId: string | null;
  storeId: string | null;
  reporterEmail: string | null;
  reason: string;
  detail: string | null;
  status: ReportStatus;
  resolutionNote: string | null;
  resolvedBy: string | null;
  resolvedAt: string | null;
  createdAt: string;
  /** Trích nội dung bị báo cáo để quản trị viên đọc ngay trong danh sách. */
  targetExcerpt: string | null;
  targetAuthor: string | null;
}

export interface ModerationAction {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  action: string;
  actorEmail: string;
  note: string | null;
  createdAt: string;
}

export const REPORT_REASONS: { key: string; label: string }[] = [
  { key: 'spam', label: 'Spam / nội dung quảng cáo rác' },
  { key: 'offensive', label: 'Ngôn từ thô tục, xúc phạm' },
  { key: 'fake', label: 'Thông tin sai sự thật' },
  { key: 'private', label: 'Lộ thông tin cá nhân' },
  { key: 'other', label: 'Lý do khác' },
];
