'use client';

/**
 * Thông báo của người bán.
 *
 * Dữ liệu lấy từ /api/notifications: máy chủ xác định vai trò người xem từ cookie phiên nên tài khoản
 * người bán CHỈ nhận thông báo gửi tới email chủ cửa hàng — không thấy thông báo của người bán khác.
 *
 * Thông báo được lưu trong cơ sở dữ liệu, vì vậy tải lại trang hay đổi thiết bị vẫn còn nguyên.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, Loader2, RefreshCw } from 'lucide-react';
import type { SiteNotification } from '@/lib/orders/types';
import { useWebPush } from '@/lib/client/useWebPush';
import { useSeller } from '@/components/seller/SellerGate';

export default function SellerNotificationsPage() {
  const router = useRouter();
  const { state } = useSeller();
  const [items, setItems] = useState<SiteNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const push = useWebPush(state?.email || null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/notifications?limit=50', { cache: 'no-store' });
      const data = await res.json();
      if (data?.ok) {
        setItems(data.items || []);
        setUnread(Number(data.unreadCount || 0));
      }
    } catch {
      /* lần sau thử lại */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openItem = async (item: SiteNotification) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id }),
      });
    } catch {
      /* vẫn mở được dù đánh dấu lỗi */
    }
    if (item.link) router.push(item.link);
    else load();
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

  return (
    <div className="space-y-5">
      <section className="paper-panel rounded-3xl border border-terracotta-200 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-terracotta-600" />
              Thông báo của cửa hàng
            </h1>
            <p className="text-[11px] text-lacquer-800/60 mt-0.5">
              {unread > 0 ? `${unread} thông báo chưa đọc` : 'Không có thông báo chưa đọc'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 text-[11px] font-bold text-lacquer-900 hover:bg-dopaper-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Đọc tất cả
              </button>
            )}
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 text-[11px] font-bold text-lacquer-900 hover:bg-dopaper-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </button>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-dopaper-50 border border-terracotta-100 space-y-2">
          <span className="text-[11px] font-bold text-lacquer-900 block">Thông báo đẩy trên máy tính & điện thoại</span>
          <p className="text-[10px] text-lacquer-800/70 leading-relaxed">{push.message}</p>
          <div className="flex items-center gap-2">
            {push.isSubscribed ? (
              <button
                onClick={push.unsubscribe}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
              >
                Tắt thông báo đẩy
              </button>
            ) : (
              <button
                onClick={push.subscribe}
                disabled={!push.serverConfigured}
                className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-terracotta-500 text-white hover:bg-terracotta-600 disabled:opacity-50"
              >
                Bật thông báo đẩy
              </button>
            )}
            {!push.serverConfigured && (
              <span className="text-[10px] text-amber-700">Máy chủ chưa cấu hình VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY.</span>
            )}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 flex items-center justify-center gap-2 text-sm text-lacquer-800/70">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải thông báo...
        </div>
      ) : items.length === 0 ? (
        <div className="paper-panel rounded-3xl border border-terracotta-200 p-10 text-center text-sm text-lacquer-800/70">
          Chưa có thông báo nào. Khi có đơn mới hoặc cửa hàng thay đổi trạng thái, thông báo sẽ xuất hiện ở đây.
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => openItem(item)}
                className={`w-full text-left paper-panel rounded-2xl border p-4 hover:border-terracotta-300 transition-colors ${
                  item.readAt ? 'border-terracotta-100 opacity-80' : 'border-terracotta-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {!item.readAt && <span className="w-2 h-2 rounded-full bg-terracotta-500 mt-1.5 shrink-0" />}
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-lacquer-900">{item.title}</span>
                    {item.body && <span className="block text-[11px] text-lacquer-800/70 mt-0.5">{item.body}</span>}
                    <span className="block text-[10px] text-lacquer-800/50 mt-1">
                      {new Date(item.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
