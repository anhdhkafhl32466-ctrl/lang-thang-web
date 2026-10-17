'use client';

import React from 'react';

/**
 * LỚP NỀN VĂN HOÁ TOÀN CỤC
 * ----------------------------------------------------------------------------
 * Một bức tranh phong cảnh làng quê Việt Nam (bg-landscape.jpg) phủ kín khung
 * nhìn, đứng SAU mọi nội dung và đứng YÊN khi cuộn trang hoặc chuyển trang.
 *
 * Cơ chế: `position: fixed` + `background-size: cover` + `background-attachment: fixed`
 * → Background không bao giờ xê dịch, chỉ nội dung phía trên thay đổi.
 *
 * Bề mặt nội dung phía trên dùng giấy bán trong suốt (xem .bg-dopaper-* trong
 * globals.css) nên họa tiết xuyên qua toàn trang thay vì bị nền trắng che mất.
 */

export default function CraftBackdrop() {
  return (
    <div className="craft-backdrop" aria-hidden="true">
      <div
        className="craft-backdrop__art"
        style={{
          backgroundImage: `url('/images/bg-landscape.jpg')`,
          backgroundPosition: 'center center',
        }}
      />
      <div className="craft-backdrop__veil" />
      <div className="craft-backdrop__vignette" />
    </div>
  );
}
