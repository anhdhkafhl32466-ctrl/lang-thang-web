'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ADMIN_HOME_PATH, loginHref } from '@/lib/client/authRedirect';
import {
  ShieldCheck, Loader2, RefreshCw, AlertTriangle, Flag, CheckCircle2, EyeOff, Undo2, History,
  ArrowLeft, Lock,
} from 'lucide-react';
import { REPORT_REASONS, type ContentReport, type ModerationAction } from '@/lib/reviews/types';

const REASON_LABEL = new Map(REPORT_REASONS.map((item) => [item.key, item.label]));

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
}

export default function AdminModerationPage() {
  const router = useRouter();
  const [reports, setReports] = useState<ContentReport[]>([]);
  const [actions, setActions] = useState<ModerationAction[]>([]);
  const [statusFilter, setStatusFilter] = useState<'open' | 'all'>('open');
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'unauthenticated' | 'forbidden'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/admin/moderation?status=${statusFilter}`, { cache: 'no-store' });
        if (res.status === 401) {
          setAuthState('unauthenticated');
          router.replace(loginHref('/admin/kiem-duyet'));
          return;
        }
        if (res.status === 403) {
          setAuthState('forbidden');
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setError(data?.error?.message || 'Không tải được hàng đợi kiểm duyệt.');
          return;
        }
        setAuthState('ok');
        setError(null);
        setReports(data.reports || []);
        setActions(data.actions || []);
      } catch {
        setError('Không kết nối được tới máy chủ.');
      } finally {
        setLoading(false);
      }
    },
    [router, statusFilter]
  );

  useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (report: ContentReport, action: 'hide' | 'restore') => {
    setBusyId(report.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          targetType: report.targetType,
          targetId: report.targetId,
          note: notes[report.id]?.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: 'error', text: data?.error?.message || 'Không xử lý được nội dung.' });
        return;
      }
      setFeedback({
        tone: 'ok',
        text: action === 'hide' ? 'Đã ẩn nội dung vi phạm (không xoá dữ liệu của khách).' : 'Đã khôi phục nội dung.',
      });
      await load(true);
    } catch {
      setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    } finally {
      setBusyId(null);
    }
  };

  const resolve = async (report: ContentReport, status: 'resolved' | 'dismissed') => {
    setBusyId(report.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve_report',
          reportId: report.id,
          status,
          note: notes[report.id]?.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setFeedback({ tone: 'error', text: data?.error?.message || 'Không cập nhật được báo cáo.' });
        return;
      }
      setFeedback({
        tone: 'ok',
        text: status === 'resolved' ? 'Báo cáo đã được xử lý.' : 'Đã bỏ qua báo cáo (không vi phạm).',
      });
      await load(true);
    } catch {
      setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
    } finally {
      setBusyId(null);
    }
  };

  if (authState !== 'ok') {
    return (
      <div className="min-h-screen texture-paper texture-paper--moon py-16">
        <div className="max-w-xl mx-auto px-4">
          <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-gold-400/20 text-gold-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-xl font-bold text-lacquer-900">Khu vực kiểm duyệt nội dung</h1>
            {authState === 'checking' || loading ? (
              <p className="text-xs text-lacquer-800/70 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra quyền truy cập...</span>
              </p>
            ) : authState === 'unauthenticated' ? (
              <p className="text-xs text-lacquer-800/70">Đang chuyển tới trang đăng nhập...</p>
            ) : (
              <p className="text-xs text-rose-700 flex items-center justify-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Tài khoản hiện tại không có quyền quản trị.</span>
              </p>
            )}
            <Link href={loginHref('/admin/kiem-duyet')} className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-gold-500 text-white text-sm font-bold shadow">
              <ShieldCheck className="w-4 h-4" />
              <span>Đăng nhập bằng tài khoản quản trị</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen texture-paper texture-paper--moon py-10 sm:py-14">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <Link href={ADMIN_HOME_PATH} className="inline-flex items-center gap-1 text-[11px] font-semibold text-lacquer-800/60 hover:text-terracotta-600 mb-1">
              <ArrowLeft className="w-3 h-3" />
              <span>Bảng quản trị</span>
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-terracotta-600" />
              <span>Kiểm duyệt đánh giá &amp; báo cáo</span>
            </h1>
            <p className="text-xs text-lacquer-800/70">
              Ẩn nội dung vi phạm, xử lý báo cáo và truy vết mọi thao tác. Không sửa hay xoá đánh giá của khách.
            </p>
          </div>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 paper-panel text-xs font-semibold text-lacquer-800 self-start"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2 ${
              feedback.tone === 'ok' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-700'
            }`}
          >
            {feedback.tone === 'ok' ? <CheckCircle2 className="w-4 h-4 mt-0.5" /> : <AlertTriangle className="w-4 h-4 mt-0.5" />}
            <span>{feedback.text}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {([
            { key: 'open' as const, label: `Đang chờ xử lý (${statusFilter === 'open' ? reports.length : '—'})` },
            { key: 'all' as const, label: 'Toàn bộ báo cáo' },
          ]).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setStatusFilter(item.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border ${
                statusFilter === item.key ? 'bg-terracotta-500 text-white border-terracotta-500' : 'paper-panel text-lacquer-800/70 border-terracotta-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && <p className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</p>}

        {loading ? (
          <p className="py-12 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải hàng đợi kiểm duyệt...</span>
          </p>
        ) : reports.length === 0 ? (
          <div className="p-10 text-center space-y-1 paper-panel rounded-3xl border border-dashed border-terracotta-200">
            <Flag className="w-6 h-6 text-terracotta-400 mx-auto" />
            <p className="font-serif text-base text-lacquer-900">Không có báo cáo nào</p>
            <p className="text-[11px] text-lacquer-800/60">
              Báo cáo của khách về đánh giá hoặc câu hỏi vi phạm sẽ xuất hiện ở đây kèm thông báo quản trị.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <article key={report.id} className="p-4 sm:p-5 rounded-2xl border border-terracotta-200 paper-panel space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {REASON_LABEL.get(report.reason) || report.reason}
                      </span>
                      <span className="text-[10px] text-lacquer-800/60">
                        {report.targetType === 'review' ? 'Đánh giá' : report.targetType === 'question' ? 'Câu hỏi' : 'Câu trả lời'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          report.status === 'open'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : report.status === 'resolved'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-dopaper-100 text-lacquer-800/60 border-terracotta-200'
                        }`}
                      >
                        {report.status === 'open' ? 'Chờ xử lý' : report.status === 'resolved' ? 'Đã xử lý' : 'Đã bỏ qua'}
                      </span>
                    </div>
                    <p className="text-[11px] text-lacquer-800/60">
                      {formatDate(report.createdAt)} · người báo cáo {report.reporterEmail || 'không rõ'}
                      {report.targetAuthor ? ` · tác giả nội dung: ${report.targetAuthor}` : ''}
                    </p>
                  </div>

                  {report.productId && (
                    <Link
                      href={`/san-pham/${report.productId}`}
                      className="text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700"
                    >
                      Xem sản phẩm
                    </Link>
                  )}
                </div>

                <blockquote className="p-3 rounded-xl bg-dopaper-100 border-l-2 border-rose-300 text-[11px] text-lacquer-800/85 whitespace-pre-line">
                  {report.targetExcerpt || '(nội dung không có văn bản — chỉ chấm điểm)'}
                </blockquote>

                {report.detail && (
                  <p className="text-[11px] text-lacquer-800/70">
                    <strong>Mô tả của người báo cáo:</strong> {report.detail}
                  </p>
                )}

                {report.resolutionNote && (
                  <p className="text-[11px] text-lacquer-800/60">
                    <strong>Ghi chú xử lý:</strong> {report.resolutionNote} · {report.resolvedBy} ·{' '}
                    {report.resolvedAt ? formatDate(report.resolvedAt) : ''}
                  </p>
                )}

                {report.status === 'open' && (
                  <div className="space-y-2 pt-1 border-t border-terracotta-100">
                    <input
                      value={notes[report.id] || ''}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [report.id]: event.target.value }))}
                      placeholder="Ghi chú xử lý (lưu vào lịch sử kiểm duyệt)"
                      className="w-full px-3 py-2.5 rounded-xl border border-terracotta-200 paper-panel text-xs focus:outline-none focus:border-terracotta-500"
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moderate(report, 'hide')}
                        disabled={busyId === report.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-[11px] font-bold"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ẩn nội dung</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => moderate(report, 'restore')}
                        disabled={busyId === report.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl paper-panel border border-terracotta-200 disabled:opacity-60 text-lacquer-900 text-[11px] font-bold"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span>Khôi phục</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => resolve(report, 'resolved')}
                        disabled={busyId === report.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-[11px] font-bold"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đã xử lý</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => resolve(report, 'dismissed')}
                        disabled={busyId === report.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl paper-panel border border-terracotta-200 disabled:opacity-60 text-lacquer-800/70 text-[11px] font-bold"
                      >
                        <span>Không vi phạm</span>
                      </button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 sm:p-6 space-y-3">
          <h2 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
            <History className="w-4 h-4 text-gold-600" />
            <span>Lịch sử kiểm duyệt gần đây</span>
          </h2>
          {actions.length === 0 ? (
            <p className="text-[11px] text-lacquer-800/60">Chưa có thao tác kiểm duyệt nào.</p>
          ) : (
            <ol className="space-y-2">
              {actions.map((action) => (
                <li key={action.id} className="text-[11px] text-lacquer-800/75 flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-terracotta-100 pb-1.5 last:border-0">
                  <span className="font-bold text-lacquer-900">
                    {action.action === 'hidden' ? 'Ẩn nội dung' : action.action === 'restored' ? 'Khôi phục nội dung' : action.action}
                  </span>
                  <span className="font-mono text-[10px] text-lacquer-800/50">
                    {action.targetType}:{action.targetId.slice(0, 14)}…
                  </span>
                  <span>· {action.actorEmail}</span>
                  <span>· {formatDate(action.createdAt)}</span>
                  {action.note && <span className="text-lacquer-800/60">· {action.note}</span>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
