'use client';

/**
 * Xem trước hoa văn dán lên phôi.
 *
 * Cách dựng "khối 3D": hoa văn được cuốn quanh mặt phôi như dán nhãn lên một mặt trụ — kéo ngang để
 * xoay, lớp sáng tối (shadingStops) tạo cảm giác cong, còn vùng dán bị cắt theo đúng đường viền phôi.
 * Cách này không cần thư viện 3D nào, chạy được ở mọi máy và vẫn cho người dùng cảm nhận đúng
 * vị trí hoa văn trên sản phẩm thật.
 *
 * Hoa văn là vector nên khi kéo xoay vẫn sắc nét ở mọi kích thước.
 */

import { useCallback, useId, useRef } from 'react';
import type { CraftBlank } from '@/lib/craftBlanks';

/**
 * Lề phủ thêm của hoa văn so với vùng dán.
 *
 * Vì sao cần: khung dán được khai báo bằng số tròn trong lib/craftBlanks.ts, còn BBox THẬT của đường
 * cắt (có đoạn cong) cao/thấp hơn một chút. Không có lề này sẽ hở một đường mảnh trên và dưới phôi.
 */
const OVERSCAN = 1.08;

interface PatternPreviewProps {
  blank: CraftBlank;
  /** Ảnh hoa văn dạng data URI (SVG). Null khi chưa sáng tác. */
  textureUri: string | null;
  /** Góc xoay 0–360 (độ). */
  rotation: number;
  onRotationChange?: (rotation: number) => void;
  className?: string;
}

export default function PatternPreview({
  blank,
  textureUri,
  rotation,
  onRotationChange,
  className = '',
}: PatternPreviewProps) {
  const clipId = useId().replace(/:/g, '');
  const shadeId = `${clipId}-shade`;
  const dragState = useRef<{ startX: number; startRotation: number; width: number } | null>(null);

  const { outline, clip, clipBox, shadingStops, shadingAxis, visibleRatio } = blank.shape;

  // Một vòng hoa văn quấn hết chu vi; phần nhìn thấy trước mặt là `visibleRatio` của vòng đó.
  //
  // RÀNG BUỘC: hoa văn là hình vuông và phải PHỦ HẾT vùng dán theo chiều dọc, nếu không sẽ hở
  // những dải trống trên/dưới (rõ nhất ở khăn lụa và nón lá vì hai phôi này cao hơn bề ngang).
  // Vì vậy tỉ lệ nhìn thấy thực tế không được lớn hơn w/h — lớn hơn là ảnh nhỏ hơn chiều cao vùng dán.
  const ratio = Math.min(Math.min(1, Math.max(0.3, visibleRatio)), clipBox.w / clipBox.h / OVERSCAN);
  const imageWidth = clipBox.w / ratio;
  const imageHeight = imageWidth;
  const imageY = clipBox.y + clipBox.h / 2 - imageHeight / 2;
  const imageX = clipBox.x + clipBox.w / 2 - imageWidth / 2 - (rotation / 360) * imageWidth;

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      if (!onRotationChange) return;
      const rect = event.currentTarget.getBoundingClientRect();
      dragState.current = { startX: event.clientX, startRotation: rotation, width: rect.width };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [onRotationChange, rotation]
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const state = dragState.current;
      if (!state || !onRotationChange) return;
      const deltaPx = event.clientX - state.startX;
      const deltaDegrees = (deltaPx / Math.max(1, state.width)) * 360;
      const next = (((state.startRotation - deltaDegrees) % 360) + 360) % 360;
      onRotationChange(next);
    },
    [onRotationChange]
  );

  const endDrag = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    dragState.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* con trỏ đã được giải phóng */
    }
  }, []);

  return (
    <svg
      viewBox="0 0 100 140"
      className={`${onRotationChange ? 'cursor-grab active:cursor-grabbing touch-none select-none' : ''} ${className}`}
      role="img"
      aria-label={`Xem trước ${blank.name}${textureUri ? ' với hoa văn vừa sáng tác' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={clip} />
        </clipPath>
        <linearGradient
          id={shadeId}
          x1={shadingAxis === 'horizontal' ? '0' : '0.5'}
          y1={shadingAxis === 'horizontal' ? '0.5' : '0'}
          x2={shadingAxis === 'horizontal' ? '1' : '0.5'}
          y2={shadingAxis === 'horizontal' ? '0.5' : '1'}
        >
          {shadingStops.map((stop) => (
            <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
          ))}
        </linearGradient>
      </defs>

      {/* Bóng đổ trên mặt bàn giúp phôi "đứng" trong không gian thay vì dán phẳng lên nền */}
      <ellipse cx="50" cy="137" rx={clipBox.w * 0.45} ry="3.4" fill="#3B2C1A" opacity="0.12" />

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="100" height="140" fill="#F3EDE2" />
        {textureUri ? (
          <>
            {/* Vẽ 3 bản sao liền nhau: hoa văn lặp liền mạch nên xoay tới đâu cũng không hở mép */}
            {[-1, 0, 1].map((offset) => (
              <image
                key={offset}
                href={textureUri}
                x={imageX + offset * imageWidth}
                y={imageY}
                width={imageWidth}
                height={imageHeight}
                preserveAspectRatio="none"
              />
            ))}
          </>
        ) : null}
        <rect x="0" y="0" width="100" height="140" fill={`url(#${shadeId})`} />
      </g>

      <path d={outline} fill="none" stroke="#8A7259" strokeWidth="0.8" strokeLinejoin="round" />
    </svg>
  );
}
