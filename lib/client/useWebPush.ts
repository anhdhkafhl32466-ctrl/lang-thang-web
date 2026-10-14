'use client';

/**
 * Đăng ký nhận thông báo đẩy (Web Push) từ trình duyệt.
 *
 * Quy trình thật:
 *  1. Đăng ký service worker /sw.js
 *  2. Xin quyền thông báo (Notification.requestPermission)
 *  3. Lấy khoá công khai VAPID từ /api/push
 *  4. pushManager.subscribe(...) -> gửi subscription lên server để lưu
 *
 * Nếu máy chủ chưa cấu hình VAPID, hook báo rõ trạng thái "chưa sẵn sàng" thay vì báo thành công giả.
 */

import { useCallback, useEffect, useState } from 'react';

export type PushStatus =
  | 'unsupported'
  | 'checking'
  | 'server-not-configured'
  | 'denied'
  | 'subscribed'
  | 'unsubscribed'
  | 'error';

export interface UseWebPushResult {
  status: PushStatus;
  message: string;
  isSubscribed: boolean;
  serverConfigured: boolean;
  missing: string[];
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  // Cấp phát ArrayBuffer tường minh để khớp kiểu BufferSource của pushManager.subscribe.
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i++) output[i] = rawData.charCodeAt(i);
  return output;
}

export function useWebPush(userEmail: string | null): UseWebPushResult {
  const [status, setStatus] = useState<PushStatus>('checking');
  const [message, setMessage] = useState('Đang kiểm tra khả năng nhận thông báo...');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [serverConfigured, setServerConfigured] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const refresh = useCallback(async () => {
    if (!supported) {
      setStatus('unsupported');
      setMessage('Trình duyệt này không hỗ trợ thông báo đẩy (Web Push).');
      return;
    }

    try {
      const res = await fetch('/api/push', { cache: 'no-store' });
      const data = await res.json();
      setServerConfigured(Boolean(data.configured));
      setMissing(Array.isArray(data.missing) ? data.missing : []);
      setPublicKey(data.publicKey || null);

      if (!data.configured) {
        setStatus('server-not-configured');
        setMessage(
          `Máy chủ chưa cấu hình khoá VAPID nên chưa thể gửi thông báo đẩy. Cần bổ sung: ${(data.missing || []).join(', ')}.`
        );
        return;
      }

      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      setIsSubscribed(Boolean(subscription));
      setStatus(subscription ? 'subscribed' : 'unsubscribed');
      setMessage(
        subscription
          ? 'Thiết bị này đang nhận thông báo đẩy về tiến trình đơn hàng.'
          : 'Bật thông báo đẩy để nhận tin ngay trên máy tính và điện thoại.'
      );
    } catch {
      setStatus('error');
      setMessage('Không kiểm tra được trạng thái thông báo đẩy.');
    }
  }, [supported]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!supported) return;

    if (!publicKey) {
      setStatus('server-not-configured');
      setMessage('Thiếu khoá VAPID công khai từ máy chủ.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        setMessage(
          'Bạn đã từ chối quyền thông báo. Hãy bật lại trong cài đặt trang web của trình duyệt rồi thử lại.'
        );
        return;
      }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const existing = await registration.pushManager.getSubscription();
      const subscription =
        existing ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      const res = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...subscription.toJSON(), userEmail }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setStatus('error');
        setMessage(data?.error?.message || 'Không lưu được đăng ký thông báo đẩy.');
        return;
      }

      setIsSubscribed(true);
      setStatus('subscribed');
      setMessage('Đã bật thông báo đẩy cho thiết bị này.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Không đăng ký được thông báo đẩy.');
    }
  }, [publicKey, supported, userEmail]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    try {
      const registration = await navigator.serviceWorker.getRegistration('/sw.js');
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      if (subscription) {
        await fetch('/api/push', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setIsSubscribed(false);
      setStatus('unsubscribed');
      setMessage('Đã tắt thông báo đẩy trên thiết bị này.');
    } catch (error: any) {
      setStatus('error');
      setMessage(error?.message || 'Không tắt được thông báo đẩy.');
    }
  }, [supported]);

  return { status, message, isSubscribed, serverConfigured, missing, subscribe, unsubscribe };
}
