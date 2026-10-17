'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

/**
 * LỚP NỀN VĂN HOÁ TOÀN CỤC
 * ----------------------------------------------------------------------------
 * Đây là "tờ giấy dó" thật của toàn site: một lớp ảnh minh hoạ văn hoá phủ kín
 * khung nhìn, đứng SAU mọi nội dung và đứng YÊN khi cuộn trang.
 *
 * Vì sao dùng `fixed` + `cover` thay vì đặt ảnh trong từng section:
 *   10 ảnh nguồn là dải tranh 742×196 có viền khung vẽ sẵn. Nếu lặp lại sẽ lộ
 *   đường nối, nếu kéo giãn theo từng khối thì bị cắt cụt thành một dải mỏng
 *   nằm lọt thỏm dưới các khối trắng. Neo vào khung nhìn thì mỗi khối trở thành
 *   một "ô cửa" nhìn vào cùng một bức tranh — liền mạch, không nối, không cắt.
 *
 * Bề mặt nội dung phía trên dùng giấy bán trong suốt (xem .bg-dopaper-* trong
 * globals.css) nên họa tiết xuyên qua toàn trang thay vì bị nền trắng che mất.
 */

type Backdrop = {
  match: RegExp;
  image: string;
  /** Neo trái khi hoạ tiết của dải tranh nằm ở nửa trái (khung cửi, đèn lồng). */
  anchor?: 'left';
};

const BACKDROPS: Backdrop[] = [
  { match: /^\/(ban-hang|admin)/, image: 'bg-cultural-moon' },
  { match: /^\/(gio-hang|thanh-toan)/, image: 'bg-cultural-silk', anchor: 'left' },
  { match: /^\/(don-hang|tai-khoan|ho-chieu)/, image: 'bg-cultural-plum' },
  { match: /^\/(san-pham|cua-hang)/, image: 'bg-cultural-pottery' },
  { match: /^\/(trai-nghiem|game|ky-nang)/, image: 'bg-cultural-lotus' },
  { match: /^\/ban-do/, image: 'bg-cultural-river' },
  { match: /^\/lang-nghe/, image: 'bg-cultural-bamboo' },
  { match: /^\/(du-lich|ai-goi-y)/, image: 'bg-cultural-river' },
];

const DEFAULT_BACKDROP: Backdrop = { match: /.*/, image: 'bg-cultural-village' };

function backdropFor(pathname: string | null): Backdrop {
  if (!pathname) return DEFAULT_BACKDROP;
  return BACKDROPS.find((entry) => entry.match.test(pathname)) ?? DEFAULT_BACKDROP;
}

export default function CraftBackdrop() {
  const pathname = usePathname();
  const { image, anchor } = backdropFor(pathname);

  return (
    <div className="craft-backdrop" aria-hidden="true">
      <div className={`craft-backdrop__art ${image}${anchor === 'left' ? ' craft-backdrop__art--left' : ''}`} />
      <div className="craft-backdrop__veil" />
      <div className="craft-backdrop__vignette" />
    </div>
  );
}
