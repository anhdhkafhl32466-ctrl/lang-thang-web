'use client';

/**
 * Khung chung của TRUNG TÂM NGƯỜI BÁN.
 *
 * Vai trò:
 *  1. Chặn truy cập: chưa đăng nhập, không phải tài khoản người bán, hoặc chưa có cửa hàng thì hiển
 *     thị hướng dẫn rõ ràng thay vì để trang trắng hay lộ dữ liệu.
 *  2. Hiển thị tình trạng cửa hàng (chờ duyệt / đang hoạt động / bị tạm khóa) ngay trên đầu trang —
 *     người bán luôn biết vì sao mình chưa đăng bán được.
 *  3. Chia sẻ trạng thái phiên cho các trang con qua hook `useSeller()` (không phải gọi lại API).
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AlertTriangle, BadgeCheck, Bell, BarChart3, ClipboardList, LayoutDashboard, Loader2, LogOut,
  Package, PackagePlus, ShieldAlert, Store as StoreIcon, Truck, UserCircle, XCircle,
} from 'lucide-react';
import { fetchSellerState, logoutSeller, type SellerAreaState } from '@/lib/client/sellerApi';
import { logout as clearDisplayedAccount } from '@/lib/authStorage';
import { STORE_STATUS_META } from '@/lib/orders/storeMeta';
import NotificationBell from '@/components/orders/NotificationBell';

interface SellerContextValue {
  state: SellerAreaState;
  refresh: () => Promise<void>;
}

const SellerContext = createContext<SellerContextValue | null>(null);

export function useSeller(): SellerContextValue {
  const context = useContext(SellerContext);
  if (!context) throw new Error('useSeller phải dùng bên trong <SellerGate>.');
  return context;
}

const NAV_GROUPS: { title: string; items: { href: string; label: string; icon: React.ElementType }[] }[] = [
  {
    title: 'Bán hàng',
    items: [
      { href: '/ban-hang', label: 'Tổng quan cửa hàng', icon: LayoutDashboard },
      { href: '/ban-hang/san-pham', label: 'Sản phẩm của tôi', icon: Package },
      { href: '/ban-hang/san-pham/moi', label: 'Đăng sản phẩm mới', icon: PackagePlus },
    ],
  },
  {
    title: 'Đơn hàng',
    items: [
      { href: '/ban-hang/don-hang?filter=needs_action', label: 'Đơn cần xử lý', icon: ClipboardList },
      { href: '/ban-hang/don-hang?filter=preparing', label: 'Đang chuẩn bị hàng', icon: Package },
      { href: '/ban-hang/don-hang?filter=shipping', label: 'Đang vận chuyển', icon: Truck },
      { href: '/ban-hang/don-hang?filter=completed', label: 'Đã hoàn thành', icon: BadgeCheck },
      { href: '/ban-hang/don-hang?filter=failed', label: 'Huỷ / giao thất bại', icon: XCircle },
      { href: '/ban-hang/don-hang', label: 'Tất cả đơn hàng', icon: ClipboardList },
    ],
  },
  {
    title: 'Cửa hàng',
    items: [
      { href: '/ban-hang/thong-ke', label: 'Thống kê bán hàng', icon: BarChart3 },
      { href: '/ban-hang/thong-bao', label: 'Thông báo', icon: Bell },
      { href: '/ban-hang/ho-so', label: 'Hồ sơ cửa hàng', icon: StoreIcon },
    ],
  },
];

function StatusBadge({ status }: { status: keyof typeof STORE_STATUS_META }) {
  const meta = STORE_STATUS_META[status];
  const tone =
    meta.tone === 'success'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : meta.tone === 'danger'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${tone}`}>
      <ShieldAlert className="w-3 h-3" />
      {meta.label}
    </span>
  );
}

export default function SellerGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [state, setState] = useState<SellerAreaState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchSellerState();
      setState(next);
    } catch {
      setState(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Đọc lại phiên khi: mới mở khung, ĐỔI TRANG trong khu vực người bán, hoặc có sự kiện đăng nhập/đăng xuất.
    // Đổi trang là bắt buộc: trang đăng nhập người bán nằm trong cùng layout này, nên sau khi đăng nhập
    // component KHÔNG được dựng lại và sẽ giữ nguyên trạng thái "không phải người bán" đã đọc trước đó.
    void refresh();
    const onSessionChanged = () => void refresh();
    window.addEventListener('auth_state_changed', onSessionChanged);
    return () => window.removeEventListener('auth_state_changed', onSessionChanged);
  }, [refresh, pathname]);

  const value = useMemo(() => ({ state: state as SellerAreaState, refresh }), [state, refresh]);

  // Trang đăng nhập người bán nằm trong cùng khu vực đường dẫn nhưng phải truy cập được khi CHƯA
  // đăng nhập — nếu bọc cổng kiểm tra phiên thì người bán không có cách nào vào.
  if (pathname === '/ban-hang/dang-nhap') return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-lacquer-800/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Đang kiểm tra phiên đăng nhập người bán...</span>
        </div>
      </div>
    );
  }

  if (!state?.authenticated || !state.isSeller) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl border border-terracotta-200 p-8 space-y-4 text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-xl font-bold text-lacquer-900">
            {state?.authenticated ? 'Tài khoản này không phải tài khoản người bán' : 'Bạn cần đăng nhập tài khoản người bán'}
          </h1>
          <p className="text-xs text-lacquer-800/70 leading-relaxed">
            {state?.authenticated
              ? 'Tài khoản đang đăng nhập là tài khoản khách hàng/quản trị nên không có quyền truy cập dữ liệu cửa hàng. Hãy đăng ký cửa hàng hoặc đăng nhập bằng tài khoản người bán.'
              : 'Khu vực này chỉ dành cho tài khoản đã đăng ký bán hàng trên sàn. Mỗi tài khoản người bán có một cửa hàng riêng và chỉ thấy dữ liệu của cửa hàng mình.'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Link
              href="/ban-hang/dang-nhap"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold"
            >
              <UserCircle className="w-4 h-4" />
              Đăng nhập người bán
            </Link>
            <Link
              href="/dang-ky-nguoi-ban"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-terracotta-200 text-lacquer-900 text-xs font-bold"
            >
              <StoreIcon className="w-4 h-4" />
              Đăng ký bán hàng
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const store = state.store;
  const canSell = state.canSell;

  return (
    <SellerContext.Provider value={value}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <header className="bg-white rounded-3xl border border-terracotta-200 p-5 sm:p-6 mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {store?.logoUrl ? (
                <img
                  src={store.logoUrl}
                  alt={store.name}
                  className="w-12 h-12 rounded-2xl object-cover border border-terracotta-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-dopaper-100 border border-terracotta-200 flex items-center justify-center">
                  <StoreIcon className="w-6 h-6 text-terracotta-600" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-lacquer-800/60 block">Trung tâm người bán</span>
                <h1 className="font-serif text-lg sm:text-xl font-bold text-lacquer-900 truncate">
                  {store?.name || 'Chưa có cửa hàng'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell userEmail={state.email} />
              <Link
                href="/ban-hang/ho-so"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-900 hover:bg-dopaper-50"
              >
                <UserCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{state.email}</span>
                <span className="sm:hidden">Hồ sơ</span>
              </Link>
              <button
                onClick={async () => {
                  await logoutSeller();
                  // Phiên máy chủ đã bị xoá thì danh tính hiển thị ở thanh điều hướng cũng phải biến mất.
                  clearDisplayedAccount();
                  await refresh();
                  window.location.href = '/ban-hang/dang-nhap';
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50"
              >
                <LogOut className="w-3.5 h-3.5" />
                Đăng xuất
              </button>
            </div>
          </div>

          {store && (
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={store.status} />
              <span className="text-[11px] text-lacquer-800/70">{STORE_STATUS_META[store.status].description}</span>
              {!canSell && (
                <span className="text-[11px] font-bold text-rose-600">
                  Cửa hàng chưa ở trạng thái “Đang hoạt động” nên chưa thể đăng bán hoặc xử lý đơn.
                </span>
              )}
              {store.reviewNote && (
                <span className="text-[11px] text-lacquer-800/70 italic">Ghi chú của ban quản trị: {store.reviewNote}</span>
              )}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          <nav className="lg:sticky lg:top-28 self-start bg-white rounded-3xl border border-terracotta-200 p-4 space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <span className="px-2 text-[10px] font-bold uppercase tracking-wide text-lacquer-800/50">
                  {group.title}
                </span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const base = item.href.split('?')[0];
                  const withFilter = item.href.includes('?');
                  const active = withFilter
                    ? pathname + (item.href.includes('filter=') ? `?${item.href.split('?')[1]}` : '') === item.href
                    : pathname === base && !item.href.includes('?');
                  const disabled = !canSell && item.href.startsWith('/ban-hang/san-pham');
                  return (
                    <Link
                      key={item.href}
                      href={disabled ? '#' : item.href}
                      aria-disabled={disabled}
                      onClick={(event) => {
                        if (disabled) event.preventDefault();
                      }}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        active
                          ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200'
                          : disabled
                            ? 'text-lacquer-800/40 cursor-not-allowed'
                            : 'text-lacquer-900 hover:bg-dopaper-50 border border-transparent'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          <div className="min-w-0 space-y-5">{children}</div>
        </div>
      </div>
    </SellerContext.Provider>
  );
}
