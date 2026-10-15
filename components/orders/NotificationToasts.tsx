'use client';

/**
 * THÔNG BÁO NỔI NGAY TRÊN WEB — kênh thông báo chính của sàn, KHÔNG cần email.
 *
 * Vì sao cần: người bán phải biết "có đơn mới" ngay lúc đang mở website, chứ không chỉ khi tự mở chuông
 * ra xem. Mỗi thông báo mới lấy từ /api/notifications được biến thành ba thứ không cần cấu hình gì thêm:
 *   1. Thẻ nổi ở góc phải trên, bấm vào là mở đúng đơn, tự tắt sau 12 giây.
 *   2. Thông báo của hệ điều hành — CHỈ khi người dùng đã cho phép quyền thông báo.
 *   3. Số chưa đọc hiện kèm trên tiêu đề tab khi tab đang ở phía sau (người bán đang làm việc khác).
 *
 * Chống trùng: thanh điều hướng và Trung tâm người bán có thể cùng hiện một chuông, nên danh sách
 * "đã nổi" được giữ ở phạm vi module — một thông báo chỉ nổi MỘT lần trên mỗi tab.
 *
 * Lưu ý: đây là thông báo phía trình duyệt, độc lập hoàn toàn với email (Resend) và với Web Push
 * (VAPID/HTTPS). Vì vậy kênh này chạy được cả khi chưa cấu hình dịch vụ email.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, ChevronRight, X } from 'lucide-react';

export interface NotificationToastItem {
  id: string;
  title: string;
  body: string | null;
}

/** Những mã thông báo đã từng nổi trên tab này (dùng chung cho mọi chuông đang hiện). */
const ALREADY_TOASTED = new Set<string>();
const AUTO_DISMISS_MS = 12_000;

/** Tiêu đề tab: '(3) Trung tâm người bán…' khi tab đang ở phía sau và còn thông báo chưa đọc. */
export function applyUnreadBadge(unread: number): void {
  if (typeof document === 'undefined') return;
  const stripped = document.title.replace(/^\(\d+\+?\)\s*/, '');
  const badge = unread > 0 && document.hidden ? `(${unread > 99 ? '99+' : unread}) ` : '';
  const next = `${badge}${stripped}`;
  if (document.title !== next) document.title = next;
}

/** Thông báo của hệ điều hành — chỉ chạy khi người dùng đã cấp quyền. */
export function showSystemNotification(title: string, body: string | null, onOpen?: () => void): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const notification = new Notification(title, {
      body: body || undefined,
      icon: '/images/lang-thang-logo.png',
      tag: title,
    });
    notification.onclick = () => {
      window.focus();
      notification.close();
      onOpen?.();
    };
  } catch {
    /* Trình duyệt có thể chặn tạo thông báo; thẻ nổi trong web vẫn hiển thị bình thường. */
  }
}

/**
 * Chuyển danh sách thông báo vừa đọc từ máy chủ thành thẻ nổi.
 * Lần đọc ĐẦU TIÊN chỉ ghi nhận danh sách cũ làm mốc (không nổi lại toàn bộ thông báo cũ).
 */
export function useNotificationToasts(): {
  items: NotificationToastItem[];
  /** Trả về ĐÚNG những thông báo vừa mới xuất hiện (để nơi gọi còn báo bằng thông báo hệ điều hành). */
  collect: (incoming: { id: string; title: string; body?: string | null; readAt?: string | null }[]) => NotificationToastItem[];
  dismiss: (id: string) => void;
} {
  const [items, setItems] = useState<NotificationToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const seeded = useRef(false);

  const remove = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const collect = useCallback(
    (incoming: { id: string; title: string; body?: string | null; readAt?: string | null }[]) => {
      if (incoming.length === 0) return [];

      if (!seeded.current) {
        seeded.current = true;
        incoming.forEach((item) => ALREADY_TOASTED.add(item.id));
        return [];
      }

      const fresh = incoming
        .filter((item) => !ALREADY_TOASTED.has(item.id) && !item.readAt)
        .map((item) => ({ id: item.id, title: item.title, body: item.body ?? null }));
      if (fresh.length === 0) return [];

      fresh.forEach((item) => {
        ALREADY_TOASTED.add(item.id);
        const timer = setTimeout(() => remove(item.id), AUTO_DISMISS_MS);
        timers.current.set(item.id, timer);
      });

      setItems((current) => [...fresh, ...current].slice(0, 4));
      return fresh;
    },
    [remove]
  );

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  return useMemo(() => ({ items, collect, dismiss: remove }), [items, collect, remove]);
}

/** Thẻ nổi — dựng qua portal để không bị cắt bởi khung/bóng mờ của thanh điều hướng. */
export default function NotificationToasts({
  items,
  onOpen,
  onDismiss,
}: {
  items: NotificationToastItem[];
  onOpen: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || items.length === 0) return null;

  return createPortal(
    <div
      className="fixed top-20 right-3 sm:right-5 z-[70] w-[min(92vw,22rem)] space-y-2 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className="pointer-events-auto bg-white rounded-2xl border border-terracotta-200 shadow-2xl p-3.5 flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]"
        >
          <span className="w-8 h-8 rounded-xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center shrink-0">
            <Bell className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <span className="block text-xs font-bold text-lacquer-900">{item.title}</span>
            {item.body && (
              <span className="block text-[11px] text-lacquer-800/70 leading-relaxed mt-0.5 line-clamp-2">
                {item.body}
              </span>
            )}
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-bold text-terracotta-600 hover:text-terracotta-700"
            >
              Xem chi tiết
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            aria-label="Đóng thông báo"
            className="text-lacquer-800/40 hover:text-lacquer-900 shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}
