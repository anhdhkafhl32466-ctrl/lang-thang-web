'use client';

/**
 * Xưởng đồng sáng tạo sản phẩm cùng AI.
 *
 * Luồng làm việc của khách:
 *   1. Chọn phôi (gốm, lụa, nón lá, tranh khắc gỗ) — mỗi phôi thuộc một làng nghề.
 *   2. Mô tả ý tưởng bằng lời; AI phác bộ hoa văn và xưởng dựng hình lên phôi ngay trước mắt.
 *   3. Duyệt hoa văn, đọc phiếu kỹ thuật, chọn nghệ nhân của làng nghề tương ứng.
 *   4. Gửi yêu cầu đặt làm độc bản và theo dõi báo giá, tiến độ chế tác.
 *
 * Điểm cốt lõi: bản thiết kế không dừng ở hình ảnh — nó đi kèm PHIẾU KỸ THUẬT đọc được (màu, hoạ tiết,
 * mật độ, lối bố cục) để nghệ nhân chép lại bằng tay. Đó là thứ biến một bức vẽ AI thành đơn hàng thật.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Clock,
  Hammer,
  Layers,
  Loader2,
  Palette,
  RotateCcw,
  Send,
  Sparkles,
  Wand2,
} from 'lucide-react';
import PatternPreview from '@/components/craft/PatternPreview';
import { CRAFT_BLANKS, blankById, blankSizeById, formatVnd, type CraftBlank } from '@/lib/craftBlanks';
import { LAYOUT_META, MOTIF_CATALOG, motifName, type PatternSpec } from '@/lib/patternStudio';
import { getCurrentUser } from '@/lib/authStorage';

interface CocreateResult {
  spec: PatternSpec;
  svg: string;
  dataUri: string;
  specSheet: { label: string; value: string }[];
  engine: string;
  modelUsed: string | null;
  notice: string | null;
  suggestedPrice: number;
  suggestedPrepDays: number;
}

interface ArtisanOption {
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  villageProductCount: number;
  productCount: number;
  isPlatform: boolean;
}

interface BespokeRequest {
  id: string;
  code: string;
  storeName: string;
  blankName: string;
  sizeLabel: string;
  quantity: number;
  patternTitle: string;
  patternStory: string | null;
  patternMotifs: string[];
  palette: string[];
  svg: string | null;
  status: string;
  quotePriceVnd: number | null;
  quoteDays: number | null;
  quoteNote: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  'cho-bao-gia': { label: 'Chờ nghệ nhân báo giá', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  'da-bao-gia': { label: 'Nghệ nhân đã báo giá', className: 'bg-terracotta-50 text-terracotta-700 border-terracotta-200' },
  'dang-che-tac': { label: 'Đang chế tác', className: 'bg-gold-400/15 text-lacquer-900 border-gold-400/40' },
  'hoan-thanh': { label: 'Đã hoàn thành', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'tu-choi': { label: 'Nghệ nhân từ chối', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  'da-huy': { label: 'Đã huỷ', className: 'bg-dopaper-200 text-lacquer-800 border-dopaper-300' },
};

export default function BespokeStudio() {
  const [tab, setTab] = useState<'xuong' | 'don-cua-toi'>('xuong');

  const [blankId, setBlankId] = useState<string>(CRAFT_BLANKS[0].id);
  const blank = useMemo<CraftBlank>(() => blankById(blankId) || CRAFT_BLANKS[0], [blankId]);
  const [sizeId, setSizeId] = useState<string>(CRAFT_BLANKS[0].sizes[0].id);

  const [prompt, setPrompt] = useState('');
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 100000));
  const [result, setResult] = useState<CocreateResult | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [rotation, setRotation] = useState(24);

  const [artisans, setArtisans] = useState<ArtisanOption[]>([]);
  const [storeId, setStoreId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [budgetVnd, setBudgetVnd] = useState('');
  const [note, setNote] = useState('');
  const [customer, setCustomer] = useState({ name: '', phone: '', email: '' });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<BespokeRequest | null>(null);

  const [myRequests, setMyRequests] = useState<BespokeRequest[]>([]);
  const [loadingMine, setLoadingMine] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  /* ---------------------------- nạp dữ liệu ban đầu --------------------------- */

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setCustomer((prev) => ({ ...prev, name: user.name || prev.name, email: user.email || prev.email }));
    }
    if (typeof window !== 'undefined' && window.location.search.includes('tab=don-cua-toi')) {
      setTab('don-cua-toi');
    }
  }, []);

  const loadMine = useCallback(async () => {
    setLoadingMine(true);
    try {
      const res = await fetch('/api/bespoke', { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) setMyRequests(data.requests || []);
    } catch {
      /* danh sách đơn là thông tin phụ — lỗi tải không nên chặn xưởng */
    } finally {
      setLoadingMine(false);
    }
  }, []);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const loadArtisans = useCallback(async (targetBlank: CraftBlank) => {
    try {
      const res = await fetch(`/api/bespoke/artisans?blankId=${encodeURIComponent(targetBlank.id)}`, { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) {
        setArtisans(data.artisans || []);
      }
    } catch {
      setArtisans([]);
    }
  }, []);

  useEffect(() => {
    setStoreId('');
    loadArtisans(blank);
  }, [blank, loadArtisans]);

  /* ------------------------------- sinh hoa văn ------------------------------ */

  const generate = useCallback(
    async (nextSeed?: number) => {
      const idea = prompt.trim();
      if (idea.length < 4) {
        setError('Bạn hãy mô tả ý tưởng rõ hơn một chút (ít nhất 4 ký tự) để xưởng phác hoa văn nhé.');
        return;
      }

      const useSeed = nextSeed ?? seed;
      setGenerating(true);
      setError(null);
      setSubmitted(null);

      try {
        const res = await fetch('/api/ai/cocreate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: idea, blankId: blank.id, sizeId, seed: useSeed }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error?.message || 'Không sáng tác được hoa văn lúc này.');
        }
        setSeed(useSeed);
        setResult({
          spec: data.spec,
          svg: data.svg,
          dataUri: data.dataUri,
          specSheet: data.specSheet || [],
          engine: data.engine,
          modelUsed: data.modelUsed,
          notice: data.notice,
          suggestedPrice: data.suggestedPrice,
          suggestedPrepDays: data.suggestedPrepDays,
        });
        setRotation(24);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không sáng tác được hoa văn lúc này.');
      } finally {
        setGenerating(false);
      }
    },
    [blank.id, prompt, seed, sizeId]
  );

  /* ------------------------------ gửi đặt làm -------------------------------- */

  const submit = useCallback(async () => {
    if (!result) {
      setError('Bạn cần sáng tác hoa văn trước khi gửi nghệ nhân.');
      return;
    }
    if (!customer.name.trim()) {
      setError('Vui lòng cho xưởng biết tên bạn để nghệ nhân liên hệ.');
      return;
    }
    if (!customer.email.trim() && !customer.phone.trim()) {
      setError('Vui lòng để lại email hoặc số điện thoại để nghệ nhân báo giá.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setActionError(null);

    try {
      const res = await fetch('/api/bespoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blankId: blank.id,
          sizeId,
          quantity,
          prompt: prompt.trim(),
          note: note.trim() || null,
          budgetVnd: budgetVnd ? Number(String(budgetVnd).replace(/[^\d]/g, '')) : null,
          storeId: storeId || null,
          pattern: result.spec,
          customer: {
            name: customer.name.trim(),
            phone: customer.phone.trim() || null,
            email: customer.email.trim() || null,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error?.message || 'Không gửi được yêu cầu đặt làm.');
      }
      setSubmitted(data.request);
      loadMine();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được yêu cầu đặt làm.');
    } finally {
      setSubmitting(false);
    }
  }, [blank.id, budgetVnd, customer, loadMine, note, prompt, quantity, result, sizeId, storeId]);

  /* ------------------------- khách quyết định báo giá ------------------------- */

  const respond = useCallback(
    async (id: string, action: 'accept' | 'decline') => {
      setActionError(null);
      try {
        const res = await fetch(`/api/bespoke/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const data = await res.json();
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error?.message || 'Không cập nhật được yêu cầu.');
        }
        setMyRequests((prev) => prev.map((item) => (item.id === id ? { ...item, ...data.request } : item)));
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Không cập nhật được yêu cầu.');
      }
    },
    []
  );

  const selectedSize = blankSizeById(blank, sizeId) || blank.sizes[0];
  const motifLabels = result ? result.spec.motifs.map((kind) => motifName(kind)) : [];

  return (
    <div className="space-y-8">
      {/* ------------------------------- hai thẻ tab ------------------------------ */}
      <div className="flex flex-wrap gap-2 border-b border-terracotta-200/70 pb-3">
        {[
          { id: 'xuong' as const, label: 'Xưởng đồng sáng tạo', icon: Wand2 },
          { id: 'don-cua-toi' as const, label: `Đơn đặt làm của tôi${myRequests.length ? ` (${myRequests.length})` : ''}`, icon: Layers },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              tab === item.id
                ? 'bg-lacquer-900 text-white shadow-warm'
                : 'bg-white text-lacquer-800 border border-terracotta-200 hover:bg-terracotta-50'
            }`}
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'xuong' ? (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-8">
          {/* ============================ CỘT XEM TRƯỚC ============================ */}
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600">Phôi đang chọn</p>
                  <p className="font-serif text-lg font-bold text-lacquer-900">{blank.name}</p>
                </div>
                <span className="text-[11px] font-semibold text-lacquer-800 bg-dopaper-100 border border-dopaper-300 rounded-full px-3 py-1">
                  {blank.villageName}
                </span>
              </div>

              <PatternPreview
                blank={blank}
                textureUri={result?.dataUri ?? null}
                rotation={rotation}
                onRotationChange={setRotation}
                className="w-full max-w-[320px] mx-auto block"
              />

              <div className="flex items-center gap-3 mt-4">
                <input
                  type="range"
                  min={0}
                  max={359}
                  value={Math.round(rotation)}
                  onChange={(event) => setRotation(Number(event.target.value))}
                  className="flex-1 accent-terracotta-500"
                  aria-label="Xoay phôi"
                />
                <button
                  type="button"
                  onClick={() => setRotation(24)}
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Về mặc định
                </button>
              </div>
              <p className="text-[11px] text-lacquer-800/60 mt-1.5">
                Kéo trực tiếp lên phôi hoặc dùng thanh trượt để xoay và ngắm hoa văn ở các mặt khác nhau.
              </p>

              {result ? (
                <div className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-4 items-start border-t border-terracotta-100 pt-4">
                  <img
                    src={result.dataUri}
                    alt={`Bản trải phẳng của hoa văn ${result.spec.title}`}
                    className="w-24 h-24 rounded-xl border border-dashed border-terracotta-300 object-cover"
                  />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600">Bản trải phẳng</p>
                    <p className="text-[11px] text-lacquer-800/70 leading-relaxed mt-1">
                      Đây là bản nghệ nhân dùng để chép hoa văn, tách khỏi độ cong của phôi.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {result ? (
              <div className="bg-dopaper-50 rounded-3xl border border-dopaper-300 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-terracotta-600" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-600">Bảng màu hoa văn</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.spec.palette.map((hex) => (
                    <span
                      key={hex}
                      className="inline-flex items-center gap-2 text-[11px] font-semibold text-lacquer-900 bg-white border border-dopaper-300 rounded-full pl-1.5 pr-3 py-1"
                    >
                      <span className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: hex }} />
                      {hex.toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {/* =========================== CỘT ĐIỀU KHIỂN =========================== */}
          <div className="space-y-5">
            {/* Bước 1 */}
            <section className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-5">
              <StepHeader step={1} title="Chọn phôi để sáng tác" />
              <div className="grid sm:grid-cols-2 gap-3">
                {CRAFT_BLANKS.map((item) => {
                  const active = item.id === blank.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setBlankId(item.id);
                        setSizeId(item.sizes[0].id);
                        setResult(null);
                        setSubmitted(null);
                      }}
                      className={`text-left rounded-2xl border p-4 transition-all ${
                        active
                          ? 'border-terracotta-500 bg-terracotta-50 shadow-warm'
                          : 'border-terracotta-200 bg-white hover:border-terracotta-300 hover:bg-terracotta-50/40'
                      }`}
                    >
                      <p className="font-bold text-sm text-lacquer-900">{item.shortName}</p>
                      <p className="text-[11px] text-lacquer-800/70 mt-1 leading-relaxed">{item.villageName}</p>
                      <p className="text-[11px] text-terracotta-700 font-semibold mt-2">
                        Từ {formatVnd(item.sizes[0].basePrice)}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-bold text-lacquer-800/70 mb-2">Kích thước / sản phẩm</p>
                <div className="flex flex-wrap gap-2">
                  {blank.sizes.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setSizeId(item.id);
                        setResult(null);
                        setSubmitted(null);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        item.id === sizeId
                          ? 'bg-lacquer-900 text-white border-lacquer-900'
                          : 'bg-white text-lacquer-800 border-terracotta-200 hover:bg-terracotta-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-lacquer-800/60 mt-2">
                  {selectedSize.note} · dự kiến {selectedSize.prepDays} ngày · giá tham khảo {formatVnd(selectedSize.basePrice)}
                </p>
              </div>
            </section>

            {/* Bước 2 */}
            <section className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-5">
              <StepHeader step={2} title="Kể cho AI nghe ý tưởng của bạn" />

              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={4}
                maxLength={600}
                placeholder="Ví dụ: chiếc bình hoa sen nở trên sóng nước, men xanh ngọc thanh khiết, điểm vài chú cá chép…"
                className="w-full rounded-2xl border border-terracotta-200 bg-dopaper-50 p-3.5 text-sm text-lacquer-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100 resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-[11px] text-lacquer-800/50">{prompt.length}/600 ký tự</span>
                <span className="text-[11px] text-lacquer-800/50">AI chỉ phác hoa văn; nghệ nhân vẫn là người quyết định kỹ thuật</span>
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {blank.promptHints.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => setPrompt(hint)}
                    className="text-[11px] font-medium text-terracotta-700 bg-terracotta-50 border border-terracotta-200 rounded-full px-3 py-1.5 hover:bg-terracotta-100 transition-colors text-left"
                  >
                    {hint}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => generate()}
                  disabled={generating}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lacquer-900 hover:bg-terracotta-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                >
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {generating ? 'Đang phác hoa văn…' : result ? 'Phác lại từ ý tưởng này' : 'Sáng tác hoa văn'}
                </button>
                {result ? (
                  <button
                    type="button"
                    onClick={() => generate(seed + 7919)}
                    disabled={generating}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-terracotta-300 text-lacquer-900 disabled:opacity-60 text-sm font-bold hover:bg-terracotta-50 transition-colors"
                  >
                    <Wand2 className="w-4 h-4" /> Biến thể khác
                  </button>
                ) : null}
              </div>

              {error ? (
                <p className="mt-3 inline-flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> {error}
                </p>
              ) : null}
            </section>

            {/* Bước 3 */}
            {result ? (
              <section className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-5">
                <StepHeader step={3} title="Duyệt hoa văn và phiếu kỹ thuật" />

                <div className="rounded-2xl bg-dopaper-50 border border-dopaper-300 p-4">
                  <p className="font-serif text-lg font-bold text-lacquer-900">{result.spec.title}</p>
                  <p className="text-sm text-lacquer-800/80 leading-relaxed mt-1.5">{result.spec.story}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {motifLabels.map((label) => (
                      <span key={label} className="text-[11px] font-semibold text-lacquer-900 bg-white border border-dopaper-300 rounded-full px-2.5 py-1">
                        {label}
                      </span>
                    ))}
                    <span className="text-[11px] font-semibold text-terracotta-700 bg-terracotta-50 border border-terracotta-200 rounded-full px-2.5 py-1">
                      {LAYOUT_META[result.spec.layout].name}
                    </span>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-dopaper-300">
                  <table className="w-full text-[12px]">
                    <tbody>
                      {result.specSheet.map((line, index) => (
                        <tr key={line.label} className={index % 2 ? 'bg-white' : 'bg-dopaper-50'}>
                          <th className="text-left font-semibold text-lacquer-800/70 px-3 py-2 w-[38%] align-top">{line.label}</th>
                          <td className="text-lacquer-900 px-3 py-2">{line.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-3">
                  <p className="text-[11px] text-lacquer-800/60">
                    Phiếu kỹ thuật này được gửi kèm bản thiết kế để nghệ nhân chép lại đúng ý bạn.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(buildCopyText(result, blank.name, selectedSize.note))}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700 ml-auto"
                  >
                    <Copy className="w-3.5 h-3.5" /> Sao chép phiếu
                  </button>
                </div>

                <p className="mt-3 text-[11px] font-semibold text-lacquer-800/70 bg-dopaper-100 border border-dopaper-300 rounded-xl px-3 py-2">
                  {result.engine === 'gemini-cloud-ai'
                    ? `Hoa văn do trí tuệ nhân tạo sáng tác (Google Gemini · ${result.modelUsed}). Bạn có thể phác lại để có phương án khác.`
                    : 'Hoa văn được dựng bằng động cơ nghệ nhân ngoại tuyến của xưởng.'}
                  {result.notice ? ` ${result.notice}` : ''}
                </p>
              </section>
            ) : null}

            {/* Bước 4 */}
            {result ? (
              <section className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-5">
                <StepHeader step={4} title="Gửi nghệ nhân và đặt làm độc bản" />

                <p className="text-[11px] font-bold text-lacquer-800/70 mb-2">Chọn xưởng nhận bản thiết kế</p>
                <div className="space-y-2">
                  <label
                    className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-colors ${
                      storeId === '' ? 'border-terracotta-500 bg-terracotta-50' : 'border-terracotta-200 hover:bg-terracotta-50/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="artisan"
                      checked={storeId === ''}
                      onChange={() => setStoreId('')}
                      className="mt-1 accent-terracotta-500"
                    />
                    <span className="min-w-0">
                      <span className="block font-bold text-sm text-lacquer-900">Giao cho xưởng phù hợp nhất</span>
                      <span className="block text-[11px] text-lacquer-800/70 mt-0.5">
                        Xưởng có nhiều sản phẩm đúng nghề {blank.villageName.replace('Làng ', '')} sẽ nhận yêu cầu trước.
                      </span>
                    </span>
                  </label>

                  {artisans.map((artisan) => (
                    <label
                      key={artisan.storeId}
                      className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition-colors ${
                        storeId === artisan.storeId ? 'border-terracotta-500 bg-terracotta-50' : 'border-terracotta-200 hover:bg-terracotta-50/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="artisan"
                        checked={storeId === artisan.storeId}
                        onChange={() => setStoreId(artisan.storeId)}
                        className="mt-1 accent-terracotta-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-lacquer-900">{artisan.name}</span>
                          {artisan.villageProductCount > 0 ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-bamboo-700 bg-bamboo-100 border border-bamboo-500/30 rounded-full px-2 py-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Đúng nghề ({artisan.villageProductCount})
                            </span>
                          ) : null}
                          {artisan.isPlatform ? (
                            <span className="text-[10px] font-bold text-lacquer-800 bg-dopaper-200 border border-dopaper-300 rounded-full px-2 py-0.5">
                              Cửa hàng của sàn
                            </span>
                          ) : null}
                        </span>
                        {artisan.description ? (
                          <span className="block text-[11px] text-lacquer-800/70 mt-1 line-clamp-2">{artisan.description}</span>
                        ) : null}
                        <span className="block text-[11px] text-terracotta-700 font-semibold mt-1">
                          {artisan.productCount} sản phẩm đang bán
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                <div className="grid sm:grid-cols-3 gap-3 mt-4">
                  <Field label="Số lượng">
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={quantity}
                      onChange={(event) => setQuantity(Math.max(1, Math.min(20, Number(event.target.value) || 1)))}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Ngân sách dự kiến (tuỳ chọn)">
                    <input
                      inputMode="numeric"
                      value={budgetVnd}
                      onChange={(event) => setBudgetVnd(event.target.value)}
                      placeholder={String(selectedSize.basePrice)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Tên của bạn">
                    <input
                      value={customer.name}
                      onChange={(event) => setCustomer((prev) => ({ ...prev, name: event.target.value }))}
                      placeholder="Nguyễn Văn A"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Email liên hệ">
                    <input
                      type="email"
                      value={customer.email}
                      onChange={(event) => setCustomer((prev) => ({ ...prev, email: event.target.value }))}
                      placeholder="ban@email.com"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Số điện thoại">
                    <input
                      value={customer.phone}
                      onChange={(event) => setCustomer((prev) => ({ ...prev, phone: event.target.value }))}
                      placeholder="0912 345 678"
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Ghi chú cho nghệ nhân">
                    <input
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Ví dụ: cần xong trước 20/11 để làm quà"
                      className={inputClass}
                    />
                  </Field>
                </div>

                <p className="mt-3 text-[11px] text-lacquer-800/60">
                  Giá tham khảo cho lựa chọn này: <strong className="text-lacquer-900">{formatVnd(selectedSize.basePrice)}</strong> · khoảng{' '}
                  {selectedSize.prepDays} ngày. Nghệ nhân sẽ xem bản thiết kế rồi báo giá chính thức.
                </p>

                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-60 text-white text-sm font-bold transition-colors"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitting ? 'Đang gửi tới nghệ nhân…' : 'Gửi bản thiết kế & đặt làm'}
                </button>

                {submitted ? (
                  <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="inline-flex items-center gap-2 font-bold text-sm text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" /> Đã gửi tới {submitted.storeName}
                    </p>
                    <p className="text-[12px] text-emerald-900/90 mt-1.5">
                      Mã yêu cầu <strong>{submitted.code}</strong>. Nghệ nhân sẽ xem bản thiết kế và báo giá cho bạn trong mục
                      «Đơn đặt làm của tôi».
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab('don-cua-toi')}
                      className="mt-2.5 text-[11px] font-bold text-emerald-800 underline"
                    >
                      Xem đơn của tôi
                    </button>
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
        </div>
      ) : (
        /* =========================== ĐƠN ĐẶT LÀM CỦA TÔI =========================== */
        <div className="space-y-4">
          {actionError ? (
            <p className="inline-flex items-start gap-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> {actionError}
            </p>
          ) : null}

          {loadingMine ? (
            <p className="inline-flex items-center gap-2 text-sm text-lacquer-800/70">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải danh sách…
            </p>
          ) : myRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-terracotta-300 bg-white/60 p-10 text-center">
              <Hammer className="w-7 h-7 text-terracotta-400 mx-auto mb-3" />
              <p className="font-bold text-lacquer-900">Bạn chưa có đơn đặt làm nào</p>
              <p className="text-sm text-lacquer-800/70 mt-1.5 max-w-md mx-auto">
                Hãy sang thẻ «Xưởng đồng sáng tạo», mô tả ý tưởng để AI phác hoa văn rồi gửi cho nghệ nhân của làng nghề tương ứng.
              </p>
              <button
                type="button"
                onClick={() => setTab('xuong')}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-lacquer-900 hover:bg-terracotta-600 text-white text-sm font-bold transition-colors"
              >
                <Wand2 className="w-4 h-4" /> Vào xưởng sáng tác
              </button>
            </div>
          ) : (
            myRequests.map((request) => {
              const meta = STATUS_LABEL[request.status] || { label: request.status, className: 'bg-dopaper-200 text-lacquer-800 border-dopaper-300' };
              return (
                <article key={request.id} className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-5">
                  <div className="flex flex-wrap items-start gap-4">
                    {request.svg ? (
                      <img
                        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(request.svg)}`}
                        alt={request.patternTitle}
                        className="w-24 h-24 rounded-2xl border border-terracotta-200 object-cover shrink-0"
                      />
                    ) : null}

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold rounded-full border px-2.5 py-1 ${meta.className}`}>{meta.label}</span>
                        <span className="text-[11px] font-semibold text-lacquer-800/60">Mã {request.code}</span>
                      </div>
                      <p className="font-serif text-lg font-bold text-lacquer-900 mt-1.5">{request.patternTitle}</p>
                      {request.patternStory ? (
                        <p className="text-[12px] text-lacquer-800/75 leading-relaxed mt-1">{request.patternStory}</p>
                      ) : null}
                      <p className="text-[11px] text-lacquer-800/70 mt-2">
                        {request.blankName} · {request.sizeLabel} · số lượng {request.quantity}
                      </p>
                      <p className="text-[11px] text-lacquer-800/70 mt-0.5 inline-flex items-center gap-1.5">
                        <Hammer className="w-3.5 h-3.5" /> {request.storeName}
                        <span className="text-lacquer-800/30">•</span>
                        <Clock className="w-3.5 h-3.5" /> gửi {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                      </p>

                      {request.quotePriceVnd != null ? (
                        <div className="mt-3 rounded-2xl border border-terracotta-200 bg-terracotta-50 p-3.5">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-terracotta-700">Báo giá của nghệ nhân</p>
                          <p className="font-bold text-lacquer-900 mt-1">
                            {formatVnd(request.quotePriceVnd)} · khoảng {request.quoteDays} ngày
                          </p>
                          {request.quoteNote ? (
                            <p className="text-[12px] text-lacquer-800/80 mt-1 leading-relaxed">{request.quoteNote}</p>
                          ) : null}
                          {request.status === 'da-bao-gia' ? (
                            <div className="flex flex-wrap gap-2 mt-3">
                              <button
                                type="button"
                                onClick={() => respond(request.id, 'accept')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Đồng ý, bắt đầu chế tác
                              </button>
                              <button
                                type="button"
                                onClick={() => respond(request.id, 'decline')}
                                className="px-4 py-2 rounded-xl bg-white border border-terracotta-300 text-lacquer-900 text-xs font-bold hover:bg-terracotta-50 transition-colors"
                              >
                                Chưa tiếp tục
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- phần phụ --------------------------------- */

const inputClass =
  'w-full rounded-xl border border-terracotta-200 bg-dopaper-50 px-3 py-2 text-sm text-lacquer-900 outline-none focus:border-terracotta-400 focus:ring-2 focus:ring-terracotta-100';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-bold text-lacquer-800/70 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function StepHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className="w-6 h-6 rounded-full bg-lacquer-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0">
        {step}
      </span>
      <h3 className="font-serif text-base font-bold text-lacquer-900">{title}</h3>
    </div>
  );
}

/** Văn bản phiếu kỹ thuật để khách sao chép gửi nghệ nhân qua tin nhắn ngoài sàn. */
function buildCopyText(result: CocreateResult, blankName: string, sizeNote: string): string {
  const lines = [
    `PHIẾU KỸ THUẬT ĐẶT LÀM ĐỘC BẢN`,
    `Phôi: ${blankName} (${sizeNote})`,
    `Ngày: ${new Date().toLocaleDateString('vi-VN')}`,
    '',
    ...result.specSheet.map((line) => `${line.label}: ${line.value}`),
    '',
    `Ý tưởng gốc: ${result.spec.story}`,
    `Họa tiết có trong kho: ${result.spec.motifs.map((kind) => MOTIF_CATALOG.find((m) => m.kind === kind)?.name || kind).join(', ')}`,
  ];
  return lines.join('\n');
}
