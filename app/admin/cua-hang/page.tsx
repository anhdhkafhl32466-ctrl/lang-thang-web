'use client';

/**
 * Quản lý cửa hàng (dành cho quản trị viên sàn).
 *
 * Vì sao quan trọng: đây là nơi quyết định một cửa hàng được phép bán hay không. Quyền truy cập do máy
 * chủ kiểm tra (cookie phiên đã ký + email trùng ADMIN_EMAIL); giao diện chỉ gọi API, không tự quyết định.
 *
 * Khi tạm khóa một cửa hàng, hiệu lực tức thì ở tầng dữ liệu: sản phẩm của cửa hàng biến khỏi sàn, không
 * đặt được đơn mới và API người bán cũng chặn đăng bán/xử lý đơn.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle, CheckCircle2, CircleSlash, Loader2, Lock, Package, RefreshCw, ShieldCheck, Store as StoreIcon,
  Truck, Undo2,
} from 'lucide-react';
import { formatCurrencyVND } from '@/lib/utils';
import { ADMIN_ORDERS_PATH, loginHref } from '@/lib/client/authRedirect';
import { STORE_STATUS_META } from '@/lib/orders/storeMeta';
import type { Store, StoreStatus } from '@/lib/orders/types';

type StoreRow = Store & {
  counts: { products: number; orders: number; delivered: number; revenue: number };
};

interface StoresResponse {
  ok: true;
  stores: StoreRow[];
  totals: Record<string, number>;
  statuses: { key: StoreStatus; label: string; description: string; tone: string }[];
  storage?: {
    backend: string;
    isEphemeral?: boolean;
    warning?: string | null;
  };
}

const TONE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  progress: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function AdminStoresPage() {
  const router = useRouter();
  const [data, setData] = useState<StoresResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'checking' | 'ok' | 'unauthenticated' | 'forbidden'>('checking');
  const [statusFilter, setStatusFilter] = useState<'all' | StoreStatus>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/stores', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthState('unauthenticated');
        router.replace(loginHref('/admin/cua-hang'));
        return;
      }
      if (res.status === 403) {
        setAuthState('forbidden');
        return;
      }
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setError(payload?.error?.message || 'Không tải được danh sách cửa hàng.');
        return;
      }
      setAuthState('ok');
      setError(null);
      setData(payload);
    } catch {
      setError('Không kết nối được tới máy chủ.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const review = useCallback(
    async (store: StoreRow, status: StoreStatus) => {
      const labels: Record<StoreStatus, string> = {
        active: 'duyệt và cho hoạt động',
        suspended: 'tạm khóa',
        rejected: 'từ chối',
        pending: 'đưa về trạng thái chờ duyệt',
      };
      if (!window.confirm(`Xác nhận ${labels[status]} cửa hàng “${store.name}”?`)) return;

      try {
        setBusyId(store.id);
        setFeedback(null);
        const res = await fetch(`/api/admin/stores/${store.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, note: notes[store.id]?.trim() || null }),
        });
        const payload = await res.json();
        if (!res.ok || !payload.ok) {
          setFeedback({ tone: 'error', text: payload?.error?.message || 'Không cập nhật được cửa hàng.' });
          return;
        }
        const emailState =
          payload.email?.status === 'sent'
            ? 'email đã gửi cho chủ cửa hàng'
            : `email chưa gửi (${payload.email?.error || 'chưa cấu hình dịch vụ email'})`;
        setFeedback({
          tone: 'ok',
          text: `Cửa hàng “${payload.store.name}” → ${payload.statusLabel}. Thông báo trong website: ${
            payload.notificationCreated ? 'đã tạo' : 'không tạo được'
          }; ${emailState}.`,
        });
        setNotes((prev) => ({ ...prev, [store.id]: '' }));
        await load();
      } catch {
        setFeedback({ tone: 'error', text: 'Không kết nối được tới máy chủ.' });
      } finally {
        setBusyId(null);
      }
    },
    [load, notes]
  );

  const filtered = useMemo(() => {
    const stores = data?.stores || [];
    return statusFilter === 'all' ? stores : stores.filter((store) => store.status === statusFilter);
  }, [data, statusFilter]);

  if (authState !== 'ok') {
    return (
      <div className="min-h-screen py-16 bg-dopaper-50">
        <div className="max-w-xl mx-auto px-4">
          <div className="bg-white rounded-3xl border border-terracotta-200 p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-gold-400/20 text-gold-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-serif text-xl font-bold text-lacquer-900">Khu vực quản trị cửa hàng</h1>
            {authState === 'checking' || loading ? (
              <p className="text-xs text-lacquer-800/70 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang kiểm tra quyền truy cập...
              </p>
            ) : authState === 'unauthenticated' ? (
              <p className="text-xs text-lacquer-800/70 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Bạn cần đăng nhập trước. Đang chuyển tới trang đăng nhập...
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-rose-700 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Tài khoản hiện tại không có quyền quản trị.
                </p>
                <p className="text-[11px] text-lacquer-800/70">
                  Quyền quản trị chỉ được cấp khi máy chủ xác minh danh tính: tài khoản Google trùng ADMIN_EMAIL
                  hoặc đăng nhập bằng khoá quản trị ADMIN_ACCESS_KEY.
                </p>
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link
                href={loginHref('/admin/cua-hang')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-gold-500 text-white text-sm font-bold shadow"
              >
                <ShieldCheck className="w-4 h-4" />
                Đăng nhập bằng tài khoản quản trị
              </Link>
              <Link href={ADMIN_ORDERS_PATH} className="text-xs font-bold text-terracotta-600">
                Sang quản trị đơn hàng
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totals = data?.totals || {};

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-dopaper-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 flex items-center gap-2">
              <StoreIcon className="w-6 h-6 text-terracotta-600" />
              Quản lý cửa hàng
            </h1>
            <p className="text-xs text-lacquer-800/70">
              Duyệt, tạm khóa và theo dõi hoạt động của từng cửa hàng trên sàn.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <Link
              href={ADMIN_ORDERS_PATH}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 bg-white text-xs font-semibold text-lacquer-800 hover:bg-dopaper-100"
            >
              <Package className="w-3.5 h-3.5" />
              Quản trị đơn hàng
            </Link>
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 bg-white text-xs font-semibold text-lacquer-800 hover:bg-dopaper-100"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
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
        {error && <p className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</p>}

        {data?.storage?.warning && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-sm text-amber-950">Lưu ý cấu hình cơ sở dữ liệu trên Vercel</p>
              <p className="text-amber-800 leading-relaxed">{data.storage.warning}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['pending', 'active', 'suspended', 'rejected'] as StoreStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={`p-4 rounded-2xl border text-left transition-colors ${
                statusFilter === status ? 'border-terracotta-400 bg-white' : 'border-terracotta-200 bg-white hover:bg-dopaper-50'
              }`}
            >
              <span className="block text-[11px] text-lacquer-800/70">{STORE_STATUS_META[status].label}</span>
              <strong className="block font-serif text-xl text-lacquer-900">{totals[status] || 0}</strong>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl border font-bold ${
              statusFilter === 'all' ? 'bg-terracotta-50 border-terracotta-300 text-terracotta-700' : 'bg-white border-terracotta-200'
            }`}
          >
            Tất cả cửa hàng ({data?.stores.length || 0})
          </button>
        </div>

        {loading && !data ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
            <Loader2 className="w-4 h-4 animate-spin" />
            Đang tải danh sách cửa hàng...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-10 text-center text-sm text-lacquer-800/70">
            Không có cửa hàng nào trong mục này.
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((store) => {
              const meta = STORE_STATUS_META[store.status];
              return (
                <li key={store.id} className="bg-white rounded-3xl border border-terracotta-200 p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {store.logoUrl ? (
                        <img src={store.logoUrl} alt={store.name} className="w-14 h-14 rounded-2xl object-cover border border-terracotta-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-dopaper-100 border border-terracotta-200 flex items-center justify-center">
                          <StoreIcon className="w-6 h-6 text-terracotta-600" />
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-lacquer-900">{store.name}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${TONE[meta.tone]}`}>
                            {meta.label}
                          </span>
                          {store.ownerEmail === 'anhdhkafhl32466@gmail.com' && (
                            <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-gold-400/10 border-gold-400/40 text-lacquer-900">
                              Cửa hàng của sàn
                            </span>
                          )}
                        </div>
                        <span className="block text-[11px] text-lacquer-800/70">
                          {store.contactName || 'Chưa có người đại diện'} · {store.ownerEmail} · {store.phone || 'chưa có điện thoại'}
                        </span>
                        <span className="block text-[11px] text-lacquer-800/60">
                          {store.addressText || 'Chưa khai địa chỉ xuất hàng'}
                          {store.lat != null && store.lng != null
                            ? ` · toạ độ ${store.lat.toFixed(5)}, ${store.lng.toFixed(5)}`
                            : ' · chưa có toạ độ'}
                        </span>
                        {store.categories.length > 0 && (
                          <span className="block text-[10px] text-lacquer-800/60">
                            Nhóm hàng: {store.categories.join(', ')}
                          </span>
                        )}
                        {store.description && (
                          <span className="block text-[11px] text-lacquer-800/70 line-clamp-2">{store.description}</span>
                        )}
                        {store.reviewNote && (
                          <span className="block text-[10px] text-lacquer-800/60 italic">Ghi chú xét duyệt: {store.reviewNote}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] shrink-0">
                      <div className="p-2.5 rounded-2xl bg-dopaper-50 border border-terracotta-100">
                        <span className="block text-lacquer-800/60">Sản phẩm</span>
                        <strong>{store.counts.products}</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-dopaper-50 border border-terracotta-100">
                        <span className="block text-lacquer-800/60">Đơn con</span>
                        <strong>{store.counts.orders}</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-dopaper-50 border border-terracotta-100">
                        <span className="block text-lacquer-800/60">Đã giao</span>
                        <strong className="text-emerald-700">{store.counts.delivered}</strong>
                      </div>
                      <div className="p-2.5 rounded-2xl bg-dopaper-50 border border-terracotta-100">
                        <span className="block text-lacquer-800/60">Doanh thu</span>
                        <strong className="text-terracotta-600">{formatCurrencyVND(store.counts.revenue)}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={notes[store.id] || ''}
                      onChange={(event) => setNotes((prev) => ({ ...prev, [store.id]: event.target.value }))}
                      placeholder="Ghi chú duyệt (gửi tới chủ cửa hàng)"
                      className="flex-1 min-w-[220px] px-3 py-2 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
                    />
                    {store.status !== 'active' && (
                      <button
                        onClick={() => review(store, 'active')}
                        disabled={busyId === store.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50"
                      >
                        {busyId === store.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                        {store.status === 'pending' ? 'Duyệt cho hoạt động' : 'Kích hoạt lại'}
                      </button>
                    )}
                    {store.status === 'active' && (
                      <button
                        onClick={() => review(store, 'suspended')}
                        disabled={busyId === store.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 text-[11px] font-bold hover:bg-rose-50 disabled:opacity-50"
                      >
                        {busyId === store.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CircleSlash className="w-3.5 h-3.5" />}
                        Tạm khóa
                      </button>
                    )}
                    {store.status !== 'rejected' && (
                      <button
                        onClick={() => review(store, 'rejected')}
                        disabled={busyId === store.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-700 text-[11px] font-bold hover:bg-rose-50 disabled:opacity-50"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Từ chối
                      </button>
                    )}
                    {store.status === 'rejected' && (
                      <button
                        onClick={() => review(store, 'pending')}
                        disabled={busyId === store.id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 text-amber-700 text-[11px] font-bold hover:bg-amber-50 disabled:opacity-50"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        Về chờ duyệt
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
