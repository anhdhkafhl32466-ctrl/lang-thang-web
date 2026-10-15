'use client';

/**
 * Chuông thông báo TRONG WEBSITE — kênh thông báo chính của sàn (không phụ thuộc email).
 * - Đếm số chưa đọc và liệt kê thông báo lấy từ cơ sở dữ liệu.
 * - Tự cập nhật định kỳ (không cần tải lại trang) và khi quay lại tab.
 * - Thông báo MỚI nổi ngay thành thẻ ở góc phải trên (xem NotificationToasts) và, nếu người dùng đã cho
 *   phép, thành thông báo của hệ điều hành khi tab đang ở phía sau.
 * - Bấm vào thông báo sẽ mở đúng đơn hàng liên quan và đánh dấu đã đọc.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, CheckCheck, Loader2, MonitorSmartphone, X } from 'lucide-react';
import type { SiteNotification } from '@/lib/orders/types';
import { useWebPush } from '@/lib/client/useWebPush';
import NotificationToasts, {
  applyUnreadBadge,
  showSystemNotification,
  useNotificationToasts,
} from './NotificationToasts';

const POLL_MS = 20_000;

type SystemPermission = 'default' | 'denied' | 'granted' | 'unsupported';

export default function NotificationBell({ userEmail }: { userEmail: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [systemPermission, setSystemPermission] = useState<SystemPermission>('default');
  const containerRef = useRef<HTMLDivElement>(null);

  const push = useWebPush(userEmail);
  // Tách rời từng hàm (thay vì giữ cả object) để bộ đếm thời gian tải lại thông báo không bị dựng lại
  // mỗi lần giao diện vẽ lại — nếu không, chuông sẽ gọi API liên tục.
  const { collect: collectToasts, dismiss: dismissToast, items: toastItems } = useNotificationToasts();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await res.json();
      setAuthenticated(Boolean(data?.ok));
      if (data?.ok) {
        setItems(data.items || []);
        setUnread(Number(data.unreadCount || 0));
        // Thông báo mới → nổi thành thẻ ngay trong web; nếu tab đang ở phía sau thì báo bằng thông báo
        // của hệ điều hành (chỉ khi người dùng đã cho phép). Không cần email, không cần HTTPS/push.
        applyUnreadBadge(Number(data.unreadCount || 0));
        const fresh = collectToasts(data.items || []);
        if (document.hidden) {
          fresh.forEach((item) => showSystemNotification(item.title, item.body, () => window.focus()));
        }
      }
    } catch {
      /* im lặng, lần sau thử lại */
    } finally {
      setLoading(false);
    }
  }, [collectToasts]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('auth_state_changed', onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('auth_state_changed', onFocus);
    };
  }, [load]);

  // Số chưa đọc trên tiêu đề tab chỉ có ý nghĩa khi tab đang ở phía sau — đổi tab thì cập nhật lại.
  useEffect(() => {
    const onVisibilityChange = () => applyUnreadBadge(unread);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [unread]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setSystemPermission('unsupported');
      return;
    }
    setSystemPermission(Notification.permission as SystemPermission);
  }, []);

  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleOpenItem = async (item: SiteNotification) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
    } catch {
      /* thông báo vẫn mở được dù bước đánh dấu lỗi */
    }
    setOpen(false);
    load();
    if (item.link) router.push(item.link);
  };

  /** Nhấn vào thẻ nổi: mở đúng đơn của thông báo đó rồi đóng thẻ. */
  const handleOpenToast = useCallback(
    async (id: string) => {
      const item = items.find((entry) => entry.id === id);
      dismissToast(id);
      if (item) await handleOpenItem(item);
    },
    [items, dismissToast, handleOpenItem]
  );

  const enableSystemNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      setSystemPermission(permission as SystemPermission);
    } catch {
      setSystemPermission('denied');
    }
  };

  const markAll = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      });
      load();
    } catch {
      /* bỏ qua */
    }
  };

  if (!authenticated) return null;

  return (
    <div className="relative" ref={containerRef}>
      <NotificationToasts items={toastItems} onOpen={handleOpenToast} onDismiss={dismissToast} />

      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          if (!open) load();
        }}
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-white border border-terracotta-200 text-lacquer-900 hover:bg-dopaper-50 shadow-sm transition-colors"
        title="Thông báo đơn hàng"
        aria-label={`Thông báo, ${unread} chưa đọc`}
      >
        {unread > 0 ? <BellRing className="w-4 h-4 text-terracotta-600" /> : <Bell className="w-4 h-4" />}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-terracotta-200 shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-terracotta-100 flex items-center justify-between">
            <span className="text-xs font-bold text-lacquer-900 flex items-center gap-1.5">
              Thông báo {loading && <Loader2 className="w-3 h-3 animate-spin" />}
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button onClick={markAll} className="text-[11px] font-semibold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1">
                  <CheckCheck className="w-3 h-3" />
                  Đọc tất cả
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-lacquer-800/50 hover:text-lacquer-900">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-6 text-center text-xs text-lacquer-800/60">Chưa có thông báo nào.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleOpenItem(item)}
                  className={`w-full text-left px-4 py-3 border-b border-terracotta-100 last:border-0 hover:bg-dopaper-50 transition-colors ${
                    item.readAt ? 'opacity-70' : 'bg-terracotta-50/40'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!item.readAt && <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 mt-1.5 shrink-0" />}
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-lacquer-900 truncate">{item.title}</span>
                      {item.body && <span className="block text-[11px] text-lacquer-800/70 line-clamp-2">{item.body}</span>}
                      <span className="block text-[10px] text-lacquer-800/50 mt-0.5">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="px-4 py-3 bg-dopaper-50 border-t border-terracotta-100 space-y-3">
            {/* Kênh chính: thông báo nổi ngay trên web — không cần email, không cần HTTPS. */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-lacquer-800/70 flex items-start gap-1.5">
                <MonitorSmartphone className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                Thông báo nổi trên máy khi website đang mở
              </span>
              {systemPermission === 'granted' ? (
                <span className="text-[11px] font-bold text-emerald-600">Đang bật</span>
              ) : systemPermission === 'unsupported' ? (
                <span className="text-[11px] text-lacquer-800/50">Máy không hỗ trợ</span>
              ) : (
                <button
                  onClick={enableSystemNotifications}
                  disabled={systemPermission === 'denied'}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-lacquer-900 hover:bg-lacquer-800 text-white disabled:opacity-40"
                >
                  {systemPermission === 'denied' ? 'Đã bị chặn' : 'Bật'}
                </button>
              )}
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-lacquer-800/70">Thông báo đẩy (khi đã đóng website)</span>
              {push.isSubscribed ? (
                <button
                  onClick={push.unsubscribe}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                >
                  Tắt
                </button>
              ) : (
                <button
                  onClick={push.subscribe}
                  disabled={!push.serverConfigured}
                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-terracotta-500 hover:bg-terracotta-600 text-white disabled:opacity-50"
                >
                  Bật
                </button>
              )}
            </div>
            <p className="text-[10px] leading-relaxed text-lacquer-800/60">{push.message}</p>
          </div>
        </div>
      )}
    </div>
  );
}
