'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HelpCircle, Loader2, AlertTriangle, Send, Flag, RefreshCw, Store, MessageSquare,
} from 'lucide-react';
import { REPORT_REASONS, type ProductQuestion } from '@/lib/reviews/types';
import { loginHref } from '@/lib/client/authRedirect';

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ProductQuestions({ productId }: { productId: string }) {
  const pathname = usePathname();
  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [reportFor, setReportFor] = useState<{ type: 'question' | 'answer'; id: string } | null>(null);
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0].key);
  const [reportBusy, setReportBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/products/${productId}/questions`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Không tải được phần hỏi đáp.');
        return;
      }
      setQuestions(data.questions || []);
    } catch {
      setError('Không kết nối được tới máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    void load();
  }, [load]);

  const ask = async () => {
    if (!body.trim()) {
      setFeedback({ tone: 'error', text: 'Vui lòng nhập câu hỏi trước khi gửi.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/products/${productId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: body.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({
          tone: 'error',
          text:
            res.status === 401
              ? 'Bạn cần đăng nhập để gửi câu hỏi cho người bán.'
              : data?.error?.message || 'Không gửi được câu hỏi.',
        });
        return;
      }
      setBody('');
      setFeedback({ tone: 'ok', text: 'Đã gửi câu hỏi. Người bán sẽ nhận thông báo và trả lời tại đây.' });
      await load();
    } catch {
      setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    } finally {
      setSubmitting(false);
    }
  };

  const report = async () => {
    if (!reportFor) return;
    setReportBusy(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType: reportFor.type, targetId: reportFor.id, reason: reportReason }),
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

  return (
    <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 sm:p-8 space-y-5">
      <div className="space-y-1">
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-terracotta-600" />
          <span>Hỏi đáp về sản phẩm</span>
        </h2>
        <p className="text-[11px] text-lacquer-800/70">
          Hỏi về chất liệu, kích thước, cách bảo quản, thời gian chuẩn bị hoặc vận chuyển. Người bán của đúng cửa hàng sẽ trả lời.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-dopaper-100 border border-terracotta-100 space-y-2">
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={2}
          maxLength={1000}
          placeholder="Ví dụ: Sản phẩm này có đủ bộ 4 chiếc không, và có thể gói quà không?"
          className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 paper-panel text-xs focus:outline-none focus:border-terracotta-500"
        />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Link href={loginHref(pathname || '/')} className="text-[11px] text-lacquer-800/60">
            Cần đăng nhập trước khi gửi nội dung.
          </Link>
          <button
            type="button"
            onClick={ask}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs font-bold"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Gửi câu hỏi</span>
          </button>
        </div>
        {feedback && (
          <p
            className={`text-[11px] p-2.5 rounded-lg border ${
              feedback.tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {feedback.text}
          </p>
        )}
      </div>

      {loading ? (
        <p className="py-6 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang tải hỏi đáp...</span>
        </p>
      ) : error ? (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>{error}</span>
          </span>
          <button type="button" onClick={load} className="inline-flex items-center gap-1 font-bold">
            <RefreshCw className="w-3.5 h-3.5" />
            Thử lại
          </button>
        </div>
      ) : questions.length === 0 ? (
        <div className="p-5 rounded-2xl border border-dashed border-terracotta-200 text-center space-y-1">
          <p className="font-serif text-base text-lacquer-900">Chưa có câu hỏi nào</p>
          <p className="text-[11px] text-lacquer-800/60">Hãy là người đầu tiên hỏi người bán về sản phẩm này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {questions.map((question) => (
            <article key={question.id} className="p-4 rounded-2xl border border-terracotta-100 bg-white/70 space-y-2">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-terracotta-500 mt-0.5 shrink-0" />
                <div className="flex-1 space-y-0.5">
                  <p className="text-xs text-lacquer-900 leading-relaxed">{question.body}</p>
                  <span className="block text-[10px] text-lacquer-800/50">
                    {question.authorName} · {formatDate(question.createdAt)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setReportFor({ type: 'question', id: question.id })}
                  className="p-1.5 rounded-lg border border-terracotta-200 paper-panel text-lacquer-800/50 hover:text-rose-600 shrink-0"
                  title="Báo cáo câu hỏi vi phạm"
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>

              {question.answers.map((answer) => (
                <div key={answer.id} className="ml-5 p-3 rounded-xl bg-dopaper-100 border-l-2 border-gold-400 space-y-1">
                  <span className="text-[10px] font-bold text-gold-700 flex items-center gap-1">
                    {answer.isSeller && <Store className="w-3 h-3" />}
                    {answer.isSeller ? `Người bán · ${answer.authorName}` : answer.authorName}
                    <span className="font-normal text-lacquer-800/45">· {formatDate(answer.createdAt)}</span>
                  </span>
                  <p className="text-[11px] text-lacquer-800/85 leading-relaxed whitespace-pre-line">{answer.body}</p>
                </div>
              ))}

              {question.answers.length === 0 && (
                <p className="ml-5 text-[10px] text-lacquer-800/50 italic">Đang chờ người bán trả lời.</p>
              )}

              {reportFor?.type === 'question' && reportFor.id === question.id && (
                <div className="ml-1 p-3 rounded-xl border border-rose-200 bg-rose-50/80 space-y-2">
                  <span className="text-[11px] font-bold text-rose-800">Báo cáo câu hỏi vi phạm</span>
                  <select
                    value={reportReason}
                    onChange={(event) => setReportReason(event.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg border border-rose-200 paper-panel text-[11px]"
                  >
                    {REPORT_REASONS.map((item) => (
                      <option key={item.key} value={item.key}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={report}
                      disabled={reportBusy}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-[11px] font-bold"
                    >
                      Gửi báo cáo
                    </button>
                    <button type="button" onClick={() => setReportFor(null)} className="text-[11px] text-lacquer-800/60">
                      Huỷ
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
