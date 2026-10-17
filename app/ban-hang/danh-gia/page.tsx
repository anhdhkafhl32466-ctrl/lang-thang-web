'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Star, Loader2, RefreshCw, AlertTriangle, Send, MessageSquareQuote, HelpCircle, Store, BadgeCheck,
  CheckCircle2, XCircle, PackageCheck, Truck,
} from 'lucide-react';
import { REPORT_REASONS, type SellerQuestion, type SellerReview } from '@/lib/reviews/types';

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

function Stars({ value, size = 'w-3.5 h-3.5' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${size} ${star <= Math.round(value) ? 'text-gold-500 fill-gold-400' : 'text-terracotta-200'}`} />
      ))}
    </span>
  );
}

export default function SellerReviewsPage() {
  const [tab, setTab] = useState<'reviews' | 'questions'>('reviews');
  const [reviewFilter, setReviewFilter] = useState<'all' | 'unanswered' | 'negative'>('all');
  const [questionFilter, setQuestionFilter] = useState<'all' | 'unanswered'>('unanswered');

  const [reviews, setReviews] = useState<SellerReview[]>([]);
  const [reviewSummary, setReviewSummary] = useState<{ count: number; average: number; unanswered: number; negative: number } | null>(null);
  const [questions, setQuestions] = useState<SellerQuestion[]>([]);
  const [questionStats, setQuestionStats] = useState<{ total: number; unanswered: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reviewRes, questionRes] = await Promise.all([
        fetch(`/api/seller/reviews?filter=${reviewFilter}`, { cache: 'no-store' }),
        fetch(`/api/seller/questions?filter=${questionFilter}`, { cache: 'no-store' }),
      ]);

      if (reviewRes.status === 401 || questionRes.status === 401) {
        setError('Bạn cần đăng nhập bằng tài khoản người bán.');
        return;
      }
      if (reviewRes.status === 403 || questionRes.status === 403) {
        setError('Cửa hàng chưa được duyệt hoặc đang bị tạm khoá, chưa dùng được mục đánh giá.');
        return;
      }

      const reviewData = await reviewRes.json();
      const questionData = await questionRes.json();

      if (!reviewRes.ok || !reviewData.ok) {
        setError(reviewData?.error?.message || 'Không tải được đánh giá của cửa hàng.');
        return;
      }
      if (!questionRes.ok || !questionData.ok) {
        setError(questionData?.error?.message || 'Không tải được câu hỏi của cửa hàng.');
        return;
      }

      setReviews(reviewData.items || []);
      setReviewSummary(reviewData.summary || null);
      setQuestions(questionData.items || []);
      setQuestionStats({ total: Number(questionData.total || 0), unanswered: Number(questionData.unanswered || 0) });
    } catch {
      setError('Không kết nối được tới máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [reviewFilter, questionFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const replyReview = async (review: SellerReview) => {
    const body = (drafts[review.id] || '').trim();
    if (!body) {
      setFeedback({ tone: 'error', text: 'Nhập nội dung phản hồi trước khi gửi.' });
      return;
    }
    setBusyId(review.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/seller/reviews/${review.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: 'error', text: data?.error?.message || 'Không gửi được phản hồi.' });
        return;
      }
      setDrafts((prev) => ({ ...prev, [review.id]: '' }));
      setFeedback({ tone: 'ok', text: 'Đã gửi phản hồi và thông báo cho khách hàng.' });
      await load();
    } catch {
      setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    } finally {
      setBusyId(null);
    }
  };

  const answerQuestion = async (question: SellerQuestion) => {
    const body = (drafts[question.id] || '').trim();
    if (!body) {
      setFeedback({ tone: 'error', text: 'Nhập câu trả lời trước khi gửi.' });
      return;
    }
    setBusyId(question.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/seller/questions/${question.id}/answers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: 'error', text: data?.error?.message || 'Không gửi được câu trả lời.' });
        return;
      }
      setDrafts((prev) => ({ ...prev, [question.id]: '' }));
      setFeedback({ tone: 'ok', text: 'Đã trả lời công khai trên trang sản phẩm và thông báo cho khách.' });
      await load();
    } catch {
      setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-bold text-lacquer-900 flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-terracotta-600" />
            <span>Đánh giá &amp; hỏi đáp của cửa hàng</span>
          </h1>
          <p className="text-xs text-lacquer-800/70">
            Chỉ nội dung thuộc sản phẩm của cửa hàng bạn. Không thể sửa hay xoá đánh giá của khách; nội dung vi phạm do quản trị sàn xử lý.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 paper-panel text-xs font-semibold text-lacquer-800 self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới</span>
        </button>
      </header>

      {feedback && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
            feedback.tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
        >
          {feedback.tone === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <XCircle className="w-4 h-4 mt-0.5" />}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl border border-terracotta-200 paper-panel">
          <span className="text-[11px] text-lacquer-800/60">Tổng đánh giá</span>
          <strong className="block font-serif text-xl text-lacquer-900">{reviewSummary?.count ?? 0}</strong>
        </div>
        <div className="p-4 rounded-2xl border border-terracotta-200 paper-panel">
          <span className="text-[11px] text-lacquer-800/60">Điểm trung bình</span>
          <strong className="block font-serif text-xl text-gold-600">
            {reviewSummary?.average ? `${reviewSummary.average.toFixed(1)}/5` : '—'}
          </strong>
        </div>
        <div className="p-4 rounded-2xl border border-terracotta-200 paper-panel">
          <span className="text-[11px] text-lacquer-800/60">Chưa phản hồi</span>
          <strong className="block font-serif text-xl text-amber-600">{reviewSummary?.unanswered ?? 0}</strong>
        </div>
        <div className="p-4 rounded-2xl border border-terracotta-200 paper-panel">
          <span className="text-[11px] text-lacquer-800/60">Câu hỏi chờ trả lời</span>
          <strong className="block font-serif text-xl text-terracotta-600">{questionStats?.unanswered ?? 0}</strong>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border ${
            tab === 'reviews' ? 'bg-terracotta-500 text-white border-terracotta-500' : 'paper-panel text-lacquer-800/70 border-terracotta-200'
          }`}
        >
          Đánh giá ({reviewSummary?.count ?? 0})
        </button>
        <button
          type="button"
          onClick={() => setTab('questions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold border ${
            tab === 'questions' ? 'bg-terracotta-500 text-white border-terracotta-500' : 'paper-panel text-lacquer-800/70 border-terracotta-200'
          }`}
        >
          Hỏi đáp ({questionStats?.total ?? 0})
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </span>
          <button type="button" onClick={load} className="font-bold inline-flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      )}

      {loading ? (
        <p className="py-12 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tải nội dung từ máy chủ...</span>
        </p>
      ) : tab === 'reviews' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all' as const, label: 'Tất cả' },
              { key: 'unanswered' as const, label: 'Chưa phản hồi' },
              { key: 'negative' as const, label: 'Điểm thấp (≤ 3 sao)' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setReviewFilter(item.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                  reviewFilter === item.key ? 'bg-gold-100 text-gold-800 border-gold-300' : 'paper-panel text-lacquer-800/70 border-terracotta-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-terracotta-200 text-center space-y-1 paper-panel">
              <p className="font-serif text-base text-lacquer-900">Chưa có đánh giá nào</p>
              <p className="text-[11px] text-lacquer-800/60">
                Đánh giá chỉ xuất hiện sau khi khách đã nhận hàng thành công. Không có đánh giá nào được tạo tự động.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <article key={review.id} className="p-4 sm:p-5 rounded-2xl border border-terracotta-200 paper-panel space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {review.productImage && (
                        <img src={review.productImage} alt={review.productName} className="w-10 h-10 rounded-xl object-cover border border-terracotta-200" />
                      )}
                      <div className="min-w-0">
                        <Link href={`/san-pham/${review.productId}`} className="text-xs font-bold text-lacquer-900 hover:text-terracotta-600 line-clamp-1">
                          {review.productName}
                        </Link>
                        <div className="flex items-center gap-1.5 text-[10px] text-lacquer-800/60">
                          <span>{review.authorName}</span>
                          {review.verifiedPurchase && (
                            <span className="inline-flex items-center gap-0.5 text-emerald-700">
                              <BadgeCheck className="w-3 h-3" /> Đã mua
                            </span>
                          )}
                          <span>· {formatDate(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Stars value={review.rating} />
                      <span className="text-[11px] font-bold text-lacquer-900">{review.rating}/5</span>
                      {review.status === 'hidden' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Bị ẩn bởi quản trị
                        </span>
                      )}
                    </div>
                  </div>

                  {review.comment ? (
                    <p className="text-xs text-lacquer-800/85 leading-relaxed whitespace-pre-line">{review.comment}</p>
                  ) : (
                    <p className="text-[11px] text-lacquer-800/50 italic">Khách chỉ chấm điểm, không viết nhận xét.</p>
                  )}

                  {(review.packagingRating || review.deliveryRating) && (
                    <div className="flex flex-wrap gap-3 text-[10px] text-lacquer-800/60">
                      {review.packagingRating ? (
                        <span className="inline-flex items-center gap-1">
                          <PackageCheck className="w-3 h-3" /> Đóng gói {review.packagingRating}/5
                        </span>
                      ) : null}
                      {review.deliveryRating ? (
                        <span className="inline-flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Giao hàng {review.deliveryRating}/5
                        </span>
                      ) : null}
                    </div>
                  )}

                  {review.reply ? (
                    <div className="p-3 rounded-xl bg-dopaper-100 border-l-2 border-gold-400 space-y-1">
                      <span className="text-[10px] font-bold text-gold-700 uppercase flex items-center gap-1">
                        <Store className="w-3 h-3" /> Phản hồi của bạn · {formatDate(review.reply.at)}
                      </span>
                      <p className="text-[11px] text-lacquer-800/85 leading-relaxed whitespace-pre-line">{review.reply.body}</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={drafts[review.id] || ''}
                        onChange={(event) => setDrafts((prev) => ({ ...prev, [review.id]: event.target.value }))}
                        rows={2}
                        maxLength={2000}
                        placeholder="Cảm ơn khách hoặc giải thích lịch sự, kèm hướng khắc phục nếu cần..."
                        className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 paper-panel text-xs focus:outline-none focus:border-terracotta-500"
                      />
                      <button
                        type="button"
                        onClick={() => replyReview(review)}
                        disabled={busyId === review.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-[11px] font-bold"
                      >
                        {busyId === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Gửi phản hồi</span>
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'unanswered' as const, label: `Chưa trả lời (${questionStats?.unanswered ?? 0})` },
              { key: 'all' as const, label: 'Tất cả câu hỏi' },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setQuestionFilter(item.key)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${
                  questionFilter === item.key ? 'bg-gold-100 text-gold-800 border-gold-300' : 'paper-panel text-lacquer-800/70 border-terracotta-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {questions.length === 0 ? (
            <div className="p-8 rounded-3xl border border-dashed border-terracotta-200 text-center space-y-1 paper-panel">
              <p className="font-serif text-base text-lacquer-900">Không có câu hỏi nào</p>
              <p className="text-[11px] text-lacquer-800/60">
                Câu hỏi của khách về sản phẩm sẽ xuất hiện ở đây kèm thông báo trong Trung tâm người bán.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {questions.map((question) => (
                <article key={question.id} className="p-4 sm:p-5 rounded-2xl border border-terracotta-200 paper-panel space-y-3">
                  <div className="flex items-start gap-2.5">
                    {question.productImage && (
                      <img src={question.productImage} alt={question.productName} className="w-10 h-10 rounded-xl object-cover border border-terracotta-200" />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/san-pham/${question.productId}`} className="text-xs font-bold text-lacquer-900 hover:text-terracotta-600 line-clamp-1">
                        {question.productName}
                      </Link>
                      <p className="text-[10px] text-lacquer-800/55">
                        {question.authorName} · {formatDate(question.createdAt)}
                      </p>
                    </div>
                    <HelpCircle className="w-4 h-4 text-terracotta-400 shrink-0" />
                  </div>

                  <p className="text-xs text-lacquer-900 leading-relaxed">{question.body}</p>

                  {question.answers.length > 0 ? (
                    <div className="p-3 rounded-xl bg-dopaper-100 border-l-2 border-gold-400 space-y-1">
                      <span className="text-[10px] font-bold text-gold-700 uppercase">Đã trả lời</span>
                      {question.answers.map((answer) => (
                        <p key={answer.id} className="text-[11px] text-lacquer-800/85 leading-relaxed whitespace-pre-line">
                          {answer.body}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <textarea
                        value={drafts[question.id] || ''}
                        onChange={(event) => setDrafts((prev) => ({ ...prev, [question.id]: event.target.value }))}
                        rows={2}
                        maxLength={1000}
                        placeholder="Trả lời công khai, rõ chất liệu/kích thước/thời gian chuẩn bị..."
                        className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 paper-panel text-xs focus:outline-none focus:border-terracotta-500"
                      />
                      <button
                        type="button"
                        onClick={() => answerQuestion(question)}
                        disabled={busyId === question.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-[11px] font-bold"
                      >
                        {busyId === question.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        <span>Gửi câu trả lời</span>
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </>
      )}

      <p className="text-[10px] text-lacquer-800/50">
        Lý do báo cáo do khách gửi tới quản trị: {REPORT_REASONS.map((item) => item.label).join(' · ')}.
      </p>
    </div>
  );
}
