'use client';

/**
 * Hộp yêu cầu đặt làm độc bản của NGHỆ NHÂN.
 *
 * Nghệ nhân nhận bản thiết kế do khách và AI cùng phác, xem phiếu kỹ thuật rồi quyết định:
 * báo giá (kèm số ngày chế tác) hoặc từ chối kèm lý do. Sau khi khách đồng ý, nghệ nhân chuyển
 * tiến độ sang «đang chế tác» rồi «hoàn thành».
 *
 * Quyền truy cập do máy chủ quyết định: API /api/seller/bespoke tra cửa hàng từ phiên đăng nhập,
 * nên người bán chỉ thấy yêu cầu gửi tới cửa hàng của mình.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Ruler,
  Send,
  Wand2,
  XCircle,
} from 'lucide-react';
import { formatVnd } from '@/lib/craftBlanks';
import { LAYOUT_META, motifName, type MotifKind } from '@/lib/patternStudio';

interface BespokeRequest {
  id: string;
  code: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  storeName: string;
  villageName: string | null;
  blankName: string;
  sizeLabel: string;
  quantity: number;
  prompt: string;
  patternTitle: string;
  patternStory: string | null;
  patternLayout: string | null;
  patternDensity: number | null;
  patternMotifs: MotifKind[];
  palette: string[];
  background: string | null;
  svg: string | null;
  note: string | null;
  budgetVnd: number | null;
  status: string;
  quotePriceVnd: number | null;
  quoteDays: number | null;
  quoteNote: string | null;
  createdAt: string;
}

const FILTERS = [
  { id: 'cho-bao-gia', label: 'Cần báo giá' },
  { id: 'da-bao-gia', label: 'Chờ khách xác nhận' },
  { id: 'dang-che-tac', label: 'Đang chế tác' },
  { id: 'hoan-thanh', label: 'Đã hoàn thành' },
  { id: '', label: 'Tất cả' },
];

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  'cho-bao-gia': { label: 'Chờ báo giá', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  'da-bao-gia': { label: 'Đã báo giá', className: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200' },
  'dang-che-tac': { label: 'Đang chế tác', className: 'bg-gold-400/15 text-lacquer-900 border-gold-400/40' },
  'hoan-thanh': { label: 'Hoàn thành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'tu-choi': { label: 'Đã từ chối', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  'da-huy': { label: 'Khách đã huỷ', className: 'bg-dopaper-200 text-lacquer-800 border-dopaper-300' },
};

export default function SellerBespokePage() {
  const [filter, setFilter] = useState('cho-bao-gia');
  const [requests, setRequests] = useState<BespokeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { price: string; days: string; note: string }>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/seller/bespoke${filter ? `?status=${filter}` : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error?.message || 'Không tải được danh sách yêu cầu đặt làm.');
      }
      setRequests(data.requests || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách yêu cầu đặt làm.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const draftFor = useCallback(
    (request: BespokeRequest) => {
      const existing = drafts[request.id];
      if (existing) return existing;
      return {
        price: request.quotePriceVnd ? String(request.quotePriceVnd) : '',
        days: request.quoteDays ? String(request.quoteDays) : '',
        note: request.quoteNote || '',
      };
    },
    [drafts]
  );

  const updateDraft = (id: string, patch: Partial<{ price: string; days: string; note: string }>) => {
    setDrafts((prev) => {
      const current = prev[id] || { price: '', days: '', note: '' };
      return {
        ...prev,
        [id]: {
          price: patch.price ?? current.price,
          days: patch.days ?? current.days,
          note: patch.note ?? current.note,
        },
      };
    });
  };

  const act = useCallback(
    async (request: BespokeRequest, body: Record<string, unknown>) => {
      setBusyId(request.id);
      setActionError(null);
      try {
        const res = await fetch(`/api/bespoke/${request.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error?.message || 'Không thực hiện được thao tác này.');
        }
        await load();
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Không thực hiện được thao tác này.');
      } finally {
        setBusyId(null);
      }
    },
    [load]
  );

  const emptyHint = useMemo(() => {
    if (filter === 'cho-bao-gia') return 'Hiện chưa có yêu cầu nào đang chờ bạn báo giá.';
    if (filter === 'dang-che-tac') return 'Chưa có tác phẩm nào đang trong tay bạn.';
    return 'Chưa có yêu cầu đặt làm nào ở mục này.';
  }, [filter]);

  return (
    <div className="space-y-5">
      <section className="bg-white rounded-3xl border border-terracotta-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-terracotta-600" /> Yêu cầu đặt làm độc bản
            </h1>
            <p className="text-[12px] text-lacquer-800/70 mt-1.5 max-w-2xl leading-relaxed">
              Khách hàng đã cùng AI phác hoa văn trên phôi của làng nghề bạn làm. Bạn xem phiếu kỹ thuật bên dưới
              rồi báo giá, kèm số ngày dự kiến hoàn thành. Sau khi khách đồng ý mới bắt đầu chế tác.
            </p>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-terracotta-200 text-lacquer-900 text-xs font-bold hover:bg-terracotta-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tải lại
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {FILTERS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                filter === item.id
                  ? 'bg-lacquer-900 text-white border-lacquer-900'
                  : 'bg-white text-lacquer-800 border-terracotta-200 hover:bg-terracotta-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {actionError ? (
        <p className="inline-flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-px" /> {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="bg-white rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
          <Loader2 className="w-4 h-4 animate-spin" /> Đang tải yêu cầu đặt làm…
        </div>
      ) : error ? (
        <div className="bg-white rounded-3xl border border-rose-200 p-8 space-y-3 text-center">
          <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto" />
          <p className="text-sm text-lacquer-800/80">{error}</p>
          <button onClick={load} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold">
            <RefreshCw className="w-3.5 h-3.5" /> Thử lại
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-terracotta-300 bg-white/60 p-10 text-center">
          <Wand2 className="w-7 h-7 text-terracotta-400 mx-auto mb-3" />
          <p className="font-bold text-lacquer-900">{emptyHint}</p>
          <p className="text-sm text-lacquer-800/70 mt-1.5 max-w-lg mx-auto">
            Khi khách gửi bản thiết kế tới cửa hàng của bạn, yêu cầu sẽ xuất hiện ở đây kèm phiếu kỹ thuật đầy đủ.
          </p>
        </div>
      ) : (
        requests.map((request) => {
          const meta = STATUS_LABEL[request.status] || { label: request.status, className: 'bg-dopaper-200 text-lacquer-800 border-dopaper-300' };
          const draft = draftFor(request);
          const busy = busyId === request.id;

          return (
            <article key={request.id} className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-4">
              <div className="flex flex-wrap items-start gap-4">
                {request.svg ? (
                  <img
                    src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(request.svg)}`}
                    alt={request.patternTitle}
                    className="w-28 h-28 rounded-2xl border border-terracotta-200 object-cover shrink-0"
                  />
                ) : null}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] font-bold rounded-full border px-2.5 py-1 ${meta.className}`}>{meta.label}</span>
                    <span className="text-[11px] font-semibold text-lacquer-800/60">Mã {request.code}</span>
                    <span className="text-[11px] text-lacquer-800/60 inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <p className="font-serif text-lg font-bold text-lacquer-900 mt-1.5">{request.patternTitle}</p>
                  {request.patternStory ? (
                    <p className="text-[12px] text-lacquer-800/75 leading-relaxed mt-1">{request.patternStory}</p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {request.patternMotifs.map((kind) => (
                      <span key={kind} className="text-[11px] font-semibold text-lacquer-900 bg-dopaper-100 border border-dopaper-300 rounded-full px-2.5 py-0.5">
                        {motifName(kind)}
                      </span>
                    ))}
                    {request.patternLayout ? (
                      <span className="text-[11px] font-semibold text-terracotta-700 bg-terracotta-50 border border-terracotta-200 rounded-full px-2.5 py-0.5">
                        {LAYOUT_META[request.patternLayout as keyof typeof LAYOUT_META]?.name || request.patternLayout}
                      </span>
                    ) : null}
                    {request.palette.map((hex) => (
                      <span key={hex} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: hex }} title={hex} />
                    ))}
                  </div>
                </div>
              </div>

              {/* -------------------------------- phiếu kỹ thuật -------------------------------- */}
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-dopaper-50 border border-dopaper-300 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 mb-1.5">Yêu cầu chế tác</p>
                  <ul className="text-[12px] text-lacquer-900 space-y-1">
                    <li className="inline-flex items-start gap-1.5">
                      <Ruler className="w-3.5 h-3.5 mt-0.5 shrink-0 text-lacquer-800/50" />
                      <span>
                        {request.blankName} — {request.sizeLabel} · số lượng {request.quantity}
                        {request.villageName ? ` · ${request.villageName}` : ''}
                      </span>
                    </li>
                    {request.patternDensity ? (
                      <li>Mật độ hoạ tiết: {request.patternDensity === 1 ? 'thưa' : request.patternDensity === 2 ? 'vừa' : 'dày'}</li>
                    ) : null}
                    <li>Ngân sách khách dự kiến: {request.budgetVnd ? formatVnd(request.budgetVnd) : 'khách không nêu'}</li>
                    {request.note ? <li>Ghi chú: {request.note}</li> : null}
                  </ul>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 mt-3 mb-1.5">Ý tưởng gốc của khách</p>
                  <p className="text-[12px] text-lacquer-800/80 italic leading-relaxed">“{request.prompt}”</p>
                </div>

                <div className="rounded-2xl bg-dopaper-50 border border-dopaper-300 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600 mb-1.5">Khách hàng</p>
                  <p className="text-[12px] font-semibold text-lacquer-900">{request.customerName}</p>
                  <ul className="text-[12px] text-lacquer-800/80 mt-1 space-y-1">
                    {request.customerEmail ? (
                      <li className="inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-lacquer-800/50" /> {request.customerEmail}
                      </li>
                    ) : null}
                    {request.customerPhone ? (
                      <li className="inline-flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-lacquer-800/50" /> {request.customerPhone}
                      </li>
                    ) : null}
                  </ul>

                  {request.quotePriceVnd != null ? (
                    <div className="mt-3 rounded-xl bg-white border border-dopaper-300 p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600">Báo giá đã gửi</p>
                      <p className="text-sm font-bold text-lacquer-900 mt-1">
                        {formatVnd(request.quotePriceVnd)} · {request.quoteDays} ngày
                      </p>
                      {request.quoteNote ? <p className="text-[12px] text-lacquer-800/80 mt-1">{request.quoteNote}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>

              {/* --------------------------------- thao tác --------------------------------- */}
              {request.status === 'cho-bao-gia' ? (
                <div className="rounded-2xl border border-terracotta-200 p-3.5 space-y-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600">Gửi báo giá cho khách</p>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <label className="block">
                      <span className="block text-[11px] font-bold text-lacquer-800/70 mb-1.5">Giá chế tác (đ)</span>
                      <input
                        inputMode="numeric"
                        value={draft.price}
                        onChange={(event) => updateDraft(request.id, { price: event.target.value })}
                        placeholder="1200000"
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-bold text-lacquer-800/70 mb-1.5">Số ngày hoàn thành</span>
                      <input
                        inputMode="numeric"
                        value={draft.days}
                        onChange={(event) => updateDraft(request.id, { days: event.target.value })}
                        placeholder="14"
                        className={inputClass}
                      />
                    </label>
                    <label className="block">
                      <span className="block text-[11px] font-bold text-lacquer-800/70 mb-1.5">Lời nhắn cho khách</span>
                      <input
                        value={draft.note}
                        onChange={(event) => updateDraft(request.id, { note: event.target.value })}
                        placeholder="Ví dụ: hoa văn sẽ vẽ tay dưới men, kèm hộp quà"
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        act(request, {
                          action: 'quote',
                          priceVnd: Number(String(draft.price).replace(/[^\d]/g, '')),
                          days: Number(String(draft.days).replace(/[^\d]/g, '')),
                          note: draft.note,
                        })
                      }
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs font-bold transition-colors"
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Gửi báo giá
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act(request, { action: 'advance', status: 'tu-choi', note: draft.note || 'Xưởng chưa đảm nhận được yêu cầu này.' })}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-terracotta-300 text-lacquer-900 disabled:opacity-60 text-xs font-bold hover:bg-terracotta-50 transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Từ chối
                    </button>
                  </div>
                </div>
              ) : null}

              {request.status === 'dang-che-tac' ? (
                <div className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[12px] text-lacquer-900">
                    Khách đã đồng ý báo giá. Khi tác phẩm xong, hãy đánh dấu hoàn thành để khách nhận thông báo.
                  </p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => act(request, { action: 'advance', status: 'hoan-thanh' })}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-lacquer-900 hover:bg-terracotta-600 disabled:opacity-60 text-white text-xs font-bold transition-colors"
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Đánh dấu hoàn thành
                  </button>
                </div>
              ) : null}
            </article>
          );
        })
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-terracotta-200 bg-dopaper-50 px-3 py-2 text-sm text-lacquer-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100';
