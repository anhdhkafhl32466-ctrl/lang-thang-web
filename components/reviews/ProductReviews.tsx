'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Star, Loader2, AlertTriangle, BadgeCheck, Send, Pencil, Trash2, Flag, RefreshCw,
  MessageSquareQuote, PackageCheck, Truck, ChevronDown, X,
} from 'lucide-react';
import { REPORT_REASONS, type ProductReview, type ReviewEligibility, type ReviewSummary } from '@/lib/reviews/types';
import { loginHref } from '@/lib/client/authRedirect';

const PAGE_SIZE = 5;

const EMPTY_SUMMARY: ReviewSummary = {
  average: 0,
  count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  packagingAverage: null,
  deliveryAverage: null,
};

/** Hiển thị sao từ dữ liệu thật (không làm tròn lên để tránh "đẹp hơn thực tế"). */
export function Stars({ value, size = 'w-4 h-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${size} ${star <= Math.round(value) ? 'text-gold-500 fill-gold-400' : 'text-terracotta-200'}`}
        />
      ))}
    </span>
  );
}

function StarPicker({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-semibold text-lacquer-900">
        {label} {required && <span className="text-terracotta-600">*</span>}
      </span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(value === star && !required ? 0 : star)}
            className="p-0.5 rounded transition-transform hover:scale-110"
            aria-label={`${label}: ${star} sao`}
          >
            <Star className={`w-5 h-5 ${star <= value ? 'text-gold-500 fill-gold-400' : 'text-terracotta-200'}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function ReportBox({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void;
  onSubmit: (reason: string, detail: string) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState(REPORT_REASONS[0].key);
  const [detail, setDetail] = useState('');

  return (
    <div className="mt-2 p-3 rounded-xl border border-rose-200 bg-rose-50/80 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-rose-800">Báo cáo nội dung vi phạm</span>
        <button type="button" onClick={onClose} className="text-rose-700 hover:text-rose-900" aria-label="Đóng">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <select
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        className="w-full px-2.5 py-2 rounded-lg border border-rose-200 paper-panel text-[11px]"
      >
        {REPORT_REASONS.map((item) => (
          <option key={item.key} value={item.key}>
            {item.label}
          </option>
        ))}
      </select>
      <textarea
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
        rows={2}
        maxLength={500}
        placeholder="Mô tả thêm (không bắt buộc)"
        className="w-full px-2.5 py-2 rounded-lg border border-rose-200 paper-panel text-[11px] focus:outline-none focus:border-rose-400"
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => onSubmit(reason, detail)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[11px] font-bold"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />}
        <span>Gửi báo cáo</span>
      </button>
    </div>
  );
}

export default function ProductReviews({ productId }: { productId: string }) {
  const pathname = usePathname();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [eligibility, setEligibility] = useState<ReviewEligibility[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent');

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ orderId: '', rating: 5, packaging: 0, delivery: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const [reportFor, setReportFor] = useState<{ type: 'review' | 'answer'; id: string } | null>(null);
  const [reportBusy, setReportBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(
    async (nextOffset = 0) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(nextOffset),
          sort,
        });
        if (ratingFilter) params.set('rating', String(ratingFilter));

        const res = await fetch(`/api/products/${productId}/reviews?${params.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data?.error?.message || 'Không tải được đánh giá sản phẩm.');
          return;
        }
        setReviews(data.reviews || []);
        setSummary(data.summary || EMPTY_SUMMARY);
        setTotal(Number(data.total || 0));
        setOffset(Number(data.offset || 0));
        setEligibility(data.eligibility || []);
      } catch {
        setError('Không kết nối được tới máy chủ.');
      } finally {
        setLoading(false);
      }
    },
    [productId, ratingFilter, sort]
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  const reviewable = useMemo(() => eligibility.filter((item) => !item.alreadyReviewed), [eligibility]);
  const myReviewableOrder = reviewable[0] || null;

  const openCreate = () => {
    setEditingId(null);
    setFormMessage(null);
    setForm({
      orderId: myReviewableOrder?.orderId || '',
      rating: 5,
      packaging: 0,
      delivery: 0,
      comment: '',
    });
    setFormOpen(true);
  };

  const openEdit = (review: ProductReview) => {
    setEditingId(review.id);
    setFormMessage(null);
    setForm({
      orderId: review.orderId,
      rating: review.rating,
      packaging: review.packagingRating || 0,
      delivery: review.deliveryRating || 0,
      comment: review.comment || '',
    });
    setFormOpen(true);
  };

  const submitReview = async () => {
    if (!form.orderId) {
      setFormMessage({ tone: 'error', text: 'Chọn đơn hàng đã nhận sản phẩm này để xác minh đã mua.' });
      return;
    }
    setSubmitting(true);
    setFormMessage(null);
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: form.orderId,
          rating: form.rating,
          packagingRating: form.packaging || null,
          deliveryRating: form.delivery || null,
          comment: form.comment.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFormMessage({ tone: 'error', text: data?.error?.message || 'Không gửi được đánh giá.' });
        return;
      }
      setFormMessage({ tone: 'ok', text: data.created ? 'Đã gửi đánh giá của bạn.' : 'Đã cập nhật đánh giá.' });
      setFormOpen(false);
      setEditingId(null);
      await load(0);
    } catch {
      setFormMessage({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    } finally {
      setSubmitting(false);
    }
  };

  const removeReview = async (review: ProductReview) => {
    if (!window.confirm('Xoá đánh giá này? Thao tác không thể hoàn tác.')) return;
    setFeedback(null);
    try {
      const res = await fetch(`/api/reviews/${review.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: 'error', text: data?.error?.message || 'Không xoá được đánh giá.' });
        return;
      }
      setFeedback({ tone: 'ok', text: 'Đã xoá đánh giá của bạn.' });
      await load(0);
    } catch {
      setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    }
  };

  const submitReport = async (reason: string, detail: string) => {
    if (!reportFor) return;
    setReportBusy(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: reportFor.type, targetId: reportFor.id, reason, detail }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: 'error', text: data?.error?.message || 'Không gửi được báo cáo.' });
        return;
      }
      setFeedback({ tone: 'ok', text: 'Đã gửi báo cáo tới quản trị viên sàn.' });
      setReportFor(null);
    } catch {
      setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    } finally {
      setReportBusy(false);
    }
  };

  const formatDate = (value: string) => new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  const hasMore = offset + reviews.length < total;

  return (
    <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-terracotta-600" />
            <span>Đánh giá từ người đã mua</span>
          </h2>
          <p className="text-[11px] text-lacquer-800/70">
            Chỉ tài khoản đã nhận hàng mới viết được đánh giá. Điểm số hiển thị tính từ đánh giá thật trong hệ thống.
          </p>
        </div>

        {formOpen ? (
          <button
            type="button"
            onClick={() => setFormOpen(false)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 paper-panel text-xs font-semibold text-lacquer-800"
          >
            <X className="w-3.5 h-3.5" />
            <span>Đóng biểu mẫu</span>
          </button>
        ) : myReviewableOrder ? (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            <span>Viết đánh giá</span>
          </button>
        ) : null}
      </div>

      {feedback && (
        <p
          className={`text-[11px] p-3 rounded-xl border ${
            feedback.tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.text}
        </p>
      )}

      {/* Tổng quan điểm số */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-dopaper-100 border border-terracotta-100 text-center space-y-1">
          {summary.count > 0 ? (
            <>
              <strong className="block font-serif text-4xl text-lacquer-900">{summary.average.toFixed(1)}</strong>
              <Stars value={summary.average} />
              <span className="block text-[11px] text-lacquer-800/70">{summary.count} đánh giá đã xác minh</span>
            </>
          ) : (
            <>
              <strong className="block font-serif text-base text-lacquer-900">Chưa có đánh giá</strong>
              <span className="block text-[11px] text-lacquer-800/60">
                Sản phẩm này chưa có khách nào để lại đánh giá.
              </span>
            </>
          )}
        </div>

        <div className="sm:col-span-2 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = summary.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
            const percent = summary.count > 0 ? Math.round((count / summary.count) * 100) : 0;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                className={`w-full flex items-center gap-2 text-[11px] rounded-lg px-1 py-0.5 transition-colors ${
                  ratingFilter === star ? 'bg-gold-100/70' : 'hover:bg-dopaper-100'
                }`}
              >
                <span className="w-10 shrink-0 text-lacquer-800/80 flex items-center gap-0.5">
                  {star}
                  <Star className="w-3 h-3 text-gold-500 fill-gold-400" />
                </span>
                <span className="flex-1 h-2 rounded-full bg-dopaper-200 overflow-hidden">
                  <span className="block h-full bg-gold-400" style={{ width: `${percent}%` }} />
                </span>
                <span className="w-9 text-right text-lacquer-800/60">{count}</span>
              </button>
            );
          })}
          {(summary.packagingAverage != null || summary.deliveryAverage != null) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-lacquer-800/70">
              {summary.packagingAverage != null && (
                <span className="flex items-center gap-1">
                  <PackageCheck className="w-3.5 h-3.5 text-terracotta-600" />
                  Đóng gói: <strong className="text-lacquer-900">{summary.packagingAverage.toFixed(1)}/5</strong>
                </span>
              )}
              {summary.deliveryAverage != null && (
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-terracotta-600" />
                  Giao hàng: <strong className="text-lacquer-900">{summary.deliveryAverage.toFixed(1)}/5</strong>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Biểu mẫu đánh giá */}
      {formOpen && (
        <div className="p-4 sm:p-5 rounded-2xl border border-gold-300/70 bg-gold-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-lacquer-900">
              {editingId ? 'Sửa đánh giá của bạn' : 'Đánh giá sản phẩm đã nhận'}
            </h3>
            {editingId && <span className="text-[10px] text-lacquer-800/60">Chính sách cho phép cập nhật đánh giá đã viết</span>}
          </div>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-lacquer-900">Đơn hàng đã giao (xác minh đã mua)</span>
            <select
              value={form.orderId}
              onChange={(event) => setForm((prev) => ({ ...prev, orderId: event.target.value }))}
              disabled={Boolean(editingId)}
              className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 paper-panel text-xs disabled:bg-dopaper-100"
            >
              {!form.orderId && <option value="">— Chọn đơn hàng —</option>}
              {Array.from(new Map([...eligibility].map((item) => [item.orderId, item])).values()).map((item) => (
                <option key={item.orderId} value={item.orderId}>
                  {item.orderCode} · giao {item.deliveredAt ? new Date(item.deliveredAt).toLocaleDateString('vi-VN') : 'thành công'}
                </option>
              ))}
            </select>
          </label>

          <StarPicker label="Chất lượng sản phẩm" value={form.rating} onChange={(value) => setForm((prev) => ({ ...prev, rating: value }))} required />
          <StarPicker label="Đóng gói" value={form.packaging} onChange={(value) => setForm((prev) => ({ ...prev, packaging: value }))} />
          <StarPicker label="Trải nghiệm giao hàng" value={form.delivery} onChange={(value) => setForm((prev) => ({ ...prev, delivery: value }))} />

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-lacquer-900">Nhận xét</span>
            <textarea
              value={form.comment}
              onChange={(event) => setForm((prev) => ({ ...prev, comment: event.target.value }))}
              rows={3}
              maxLength={2000}
              placeholder="Chất liệu, đường nét, cảm nhận khi nhận hàng..."
              className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 paper-panel text-xs focus:outline-none focus:border-terracotta-500"
            />
            <span className="block text-[10px] text-lacquer-800/50 text-right">{form.comment.length}/2000</span>
          </label>

          {formMessage && (
            <p
              className={`text-[11px] p-2.5 rounded-lg border ${
                formMessage.tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}
            >
              {formMessage.text}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={submitReview}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs font-bold"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{editingId ? 'Lưu thay đổi' : 'Gửi đánh giá'}</span>
            </button>
            <Link href={loginHref(pathname || '/')} className="text-[11px] font-semibold text-terracotta-600">
              Không thấy đơn của bạn? Đăng nhập bằng tài khoản đã đặt hàng
            </Link>
          </div>
        </div>
      )}

      {/* Bộ lọc & sắp xếp */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-terracotta-100 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setRatingFilter(null)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${
              ratingFilter === null ? 'bg-terracotta-500 text-white border-terracotta-500' : 'paper-panel text-lacquer-800/70 border-terracotta-200'
            }`}
          >
            Tất cả ({summary.count})
          </button>
          {summary.count > 0 &&
            [5, 4, 3, 2, 1]
              .filter((star) => (summary.distribution[star as 1 | 2 | 3 | 4 | 5] || 0) > 0)
              .map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingFilter(ratingFilter === star ? null : star)}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold border flex items-center gap-1 ${
                    ratingFilter === star ? 'bg-terracotta-500 text-white border-terracotta-500' : 'paper-panel text-lacquer-800/70 border-terracotta-200'
                  }`}
                >
                  {star}
                  <Star className="w-3 h-3 text-gold-500 fill-gold-400" />
                </button>
              ))}
        </div>

        <label className="inline-flex items-center gap-1.5 text-[11px] text-lacquer-800/70">
          <span>Sắp xếp</span>
          <span className="relative">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as 'recent' | 'highest' | 'lowest')}
              className="appearance-none pl-2.5 pr-7 py-1.5 rounded-xl border border-terracotta-200 paper-panel text-[11px] font-semibold text-lacquer-900"
            >
              <option value="recent">Mới nhất</option>
              <option value="highest">Điểm cao</option>
              <option value="lowest">Điểm thấp</option>
            </select>
            <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 text-lacquer-800/50 pointer-events-none" />
          </span>
        </label>
      </div>

      {/* Danh sách đánh giá */}
      {loading ? (
        <p className="py-8 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tải đánh giá...</span>
        </p>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </span>
          <button type="button" onClick={() => load(0)} className="inline-flex items-center gap-1 font-bold">
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-6 rounded-2xl border border-dashed border-terracotta-200 text-center space-y-1">
          <p className="font-serif text-base text-lacquer-900">
            {ratingFilter ? `Chưa có đánh giá ${ratingFilter} sao` : 'Chưa có đánh giá'}
          </p>
          <p className="text-[11px] text-lacquer-800/60">
            {ratingFilter
              ? 'Bỏ bộ lọc để xem tất cả đánh giá của sản phẩm.'
              : 'Đánh giá chỉ xuất hiện từ khách đã nhận hàng thành công, nên có thể chưa có ngay khi sản phẩm mới lên sàn.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <article key={review.id} className="p-4 rounded-2xl border border-terracotta-100 bg-white/70 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-lacquer-900">{review.authorName}</span>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        <BadgeCheck className="w-3 h-3" />
                        Đã mua
                      </span>
                    )}
                    {review.mine && <span className="text-[10px] font-bold text-terracotta-600">Đánh giá của bạn</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Stars value={review.rating} size="w-3.5 h-3.5" />
                    <span className="text-[10px] text-lacquer-800/50">{formatDate(review.createdAt)}</span>
                    {review.orderCode && <span className="text-[10px] font-mono text-lacquer-800/40">· {review.orderCode}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {review.mine && (
                    <>
                      <button
                        type="button"
                        onClick={() => openEdit(review)}
                        className="p-1.5 rounded-lg border border-terracotta-200 paper-panel text-lacquer-800/70 hover:text-terracotta-600"
                        title="Sửa đánh giá"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeReview(review)}
                        className="p-1.5 rounded-lg border border-rose-200 paper-panel text-rose-500 hover:text-rose-700"
                        title="Xoá đánh giá"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  {!review.mine && (
                    <button
                      type="button"
                      onClick={() => setReportFor({ type: 'review', id: review.id })}
                      className="p-1.5 rounded-lg border border-terracotta-200 paper-panel text-lacquer-800/50 hover:text-rose-600"
                      title="Báo cáo nội dung vi phạm"
                    >
                      <Flag className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {review.comment && (
                <p className="text-xs text-lacquer-800/85 leading-relaxed whitespace-pre-line">{review.comment}</p>
              )}

              {(review.packagingRating || review.deliveryRating) && (
                <div className="flex flex-wrap gap-3 text-[10px] text-lacquer-800/60">
                  {review.packagingRating ? <span>Đóng gói {review.packagingRating}/5</span> : null}
                  {review.deliveryRating ? <span>Giao hàng {review.deliveryRating}/5</span> : null}
                </div>
              )}

              {review.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.images.map((url) => (
                    <img
                      key={url}
                      src={url}
                      alt="Ảnh khách hàng đính kèm"
                      className="w-16 h-16 rounded-xl object-cover border border-terracotta-200"
                    />
                  ))}
                </div>
              )}

              {review.reply && (
                <div className="mt-1 p-3 rounded-xl bg-dopaper-100 border-l-2 border-terracotta-400 space-y-1">
                  <span className="text-[10px] font-bold text-terracotta-700 uppercase">
                    Phản hồi của người bán · {review.reply.by}
                  </span>
                  <p className="text-[11px] text-lacquer-800/85 leading-relaxed whitespace-pre-line">{review.reply.body}</p>
                  <span className="block text-[10px] text-lacquer-800/45">{formatDate(review.reply.at)}</span>
                </div>
              )}

              {reportFor?.type === 'review' && reportFor.id === review.id && (
                <ReportBox onClose={() => setReportFor(null)} onSubmit={submitReport} busy={reportBusy} />
              )}
            </article>
          ))}

          {hasMore && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => load(offset + PAGE_SIZE)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-terracotta-200 paper-panel text-xs font-bold text-lacquer-900 hover:bg-dopaper-100"
              >
                <span>Xem thêm đánh giá</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
