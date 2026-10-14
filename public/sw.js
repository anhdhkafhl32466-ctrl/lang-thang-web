/* Service worker cho thông báo đẩy của sàn Lang Thang.
 * - Nhận sự kiện push từ máy chủ và hiển thị thông báo hệ thống.
 * - Khi người dùng bấm vào thông báo, mở đúng trang đơn hàng.
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let data = {
    title: 'Lang Thang — cập nhật đơn hàng',
    body: 'Có thông tin mới về đơn hàng của bạn.',
    url: '/don-hang',
    tag: 'lang-thang-order',
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      tag: data.tag,
      badge: '/favicon-32x32.png',
      icon: '/android-chrome-192x192.png',
      data: { url: data.url },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/don-hang';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(self.location.origin)) {
          client.focus();
          if ('navigate' in client) return client.navigate(target);
          return undefined;
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
