'use client';

import React from 'react';
import { SilkProduct, PlacedMotif, SilkColor, ThreadColor, WeaveTexture, SILK_MOTIFS } from './silkConstants';

interface SilkCanvasPreviewProps {
  product: SilkProduct;
  baseColor: SilkColor;
  customBaseHex?: string;
  weaveTexture: WeaveTexture;
  threadColor: ThreadColor;
  motifs: PlacedMotif[];
  selectedMotifId?: string | null;
  onSelectMotif?: (id: string | null) => void;
  interactive?: boolean;
  weaveProgress?: number; // 0 to 100 for loom animation
  showDrapeShadows?: boolean;
  className?: string;
}

export default function SilkCanvasPreview({
  product,
  baseColor,
  customBaseHex,
  weaveTexture,
  threadColor,
  motifs,
  selectedMotifId = null,
  onSelectMotif,
  interactive = false,
  weaveProgress = 100,
  showDrapeShadows = true,
  className = ''
}: SilkCanvasPreviewProps) {
  const finalColorHex = customBaseHex || baseColor.hex;
  const isSquare = product.id === 'square-scarf';
  const isLong = product.id === 'long-scarf';
  const isTote = product.id === 'tote-bag';

  // SVG dimensions
  const width = product.canvasWidth;
  const height = product.canvasHeight;

  // Weave mask cutoff calculation for loom progress
  const visibleHeight = (height * weaveProgress) / 100;

  return (
    <div className={`relative select-none flex items-center justify-center ${className}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto drop-shadow-2xl transition-all duration-300"
        style={{
          filter: showDrapeShadows
            ? 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.25)) drop-shadow(0 8px 10px rgba(0, 0, 0, 0.15))'
            : 'none'
        }}
        onClick={(e) => {
          if (interactive && onSelectMotif && e.target === e.currentTarget) {
            onSelectMotif(null);
          }
        }}
      >
        <defs>
          {/* Silk Sheen Gradient */}
          <linearGradient id={`silk-sheen-${product.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#000000" stopOpacity="0.08" />
            <stop offset="75%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.12" />
          </linearGradient>

          {/* Diagonal Silk Draping Wave Gradient */}
          <linearGradient id={`silk-folds-${product.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="18%" stopColor="#FFFFFF" stopOpacity="0.18" />
            <stop offset="35%" stopColor="#000000" stopOpacity="0.14" />
            <stop offset="52%" stopColor="#FFFFFF" stopOpacity="0.22" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.12" />
            <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </linearGradient>

          {/* Damask Jacquard Subtle Weave Pattern */}
          <pattern id="damask-grain" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M0,6 L6,0 L12,6 L6,12 Z" fill="none" stroke="#FFFFFF" strokeWidth="0.6" strokeOpacity="0.15" />
            <circle cx="6" cy="6" r="1.5" fill="#FFFFFF" fillOpacity="0.1" />
          </pattern>

          {/* Brocade Gold/Metallic Thread Shimmer */}
          <pattern id="brocade-grain" width="8" height="8" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="8" y2="8" stroke="#E5BF5A" strokeWidth="0.5" strokeOpacity="0.2" />
            <line x1="8" y1="0" x2="0" y2="8" stroke="#FFFFFF" strokeWidth="0.5" strokeOpacity="0.15" />
          </pattern>

          {/* Gold Edge Border */}
          <linearGradient id="gold-border" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F1D58B" />
            <stop offset="50%" stopColor="#D4A344" />
            <stop offset="100%" stopColor="#8E6706" />
          </linearGradient>

          {/* Clip Path for Loom Weaving Progress */}
          {weaveProgress < 100 && (
            <clipPath id={`loom-clip-${product.id}`}>
              <rect x="0" y={height - visibleHeight} width={width} height={visibleHeight} />
            </clipPath>
          )}

          {/* Product Specific Shapes */}
          {isSquare && (
            <clipPath id="square-clip">
              <rect x="18" y="18" width={width - 36} height={height - 36} rx="6" />
            </clipPath>
          )}

          {isLong && (
            <clipPath id="long-clip">
              <rect x="16" y="16" width={width - 32} height={height - 32} rx="4" />
            </clipPath>
          )}

          {isTote && (
            <clipPath id="tote-clip">
              <path d="M 40 85 Q 220 75 400 85 L 390 460 Q 220 480 50 460 Z" />
            </clipPath>
          )}
        </defs>

        {/* CONTAINER WITH OPTIONAL WEAVE PROGRESS CLIP */}
        <g clipPath={weaveProgress < 100 ? `url(#loom-clip-${product.id})` : undefined}>
          {/* =========================================================
              PRODUCT 1: KHĂN VUÔNG (SQUARE SCARF)
             ========================================================= */}
          {isSquare && (
            <g id="square-scarf-group">
              {/* Outer hem shadow */}
              <rect
                x="14"
                y="14"
                width={width - 28}
                height={height - 28}
                rx="8"
                fill="#000000"
                opacity="0.15"
              />
              {/* Base silk body */}
              <rect
                x="18"
                y="18"
                width={width - 36}
                height={height - 36}
                rx="6"
                fill={finalColorHex}
              />

              {/* Hand-rolled silk edge (Viền cuộn tay) */}
              <rect
                x="18"
                y="18"
                width={width - 36}
                height={height - 36}
                rx="6"
                fill="none"
                stroke="url(#gold-border)"
                strokeWidth="3.5"
                opacity="0.85"
              />
              <rect
                x="26"
                y="26"
                width={width - 52}
                height={height - 52}
                rx="4"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="1"
                strokeDasharray="4 3"
                opacity="0.35"
              />

              {/* Texture Overlays */}
              {weaveTexture === 'damask' && (
                <rect x="18" y="18" width={width - 36} height={height - 36} fill="url(#damask-grain)" />
              )}
              {weaveTexture === 'brocade' && (
                <rect x="18" y="18" width={width - 36} height={height - 36} fill="url(#brocade-grain)" />
              )}

              {/* Silk Draping & Sheen Layer */}
              <rect
                x="18"
                y="18"
                width={width - 36}
                height={height - 36}
                rx="6"
                fill={`url(#silk-sheen-${product.id})`}
                style={{ mixBlendMode: 'overlay' }}
              />
              {showDrapeShadows && (
                <rect
                  x="18"
                  y="18"
                  width={width - 36}
                  height={height - 36}
                  rx="6"
                  fill={`url(#silk-folds-${product.id})`}
                  opacity="0.25"
                  style={{ mixBlendMode: 'multiply' }}
                />
              )}
            </g>
          )}

          {/* =========================================================
              PRODUCT 2: KHĂN QUÀNG CỔ LỤA (LONG SCARF)
             ========================================================= */}
          {isLong && (
            <g id="long-scarf-group">
              {/* Left End Fringes (Tua rua bên trái) */}
              <g id="left-fringes" stroke={finalColorHex} strokeWidth="2.5" opacity="0.9">
                {Array.from({ length: 22 }).map((_, i) => {
                  const y = 26 + (i * (height - 52)) / 21;
                  return (
                    <path
                      key={`lf-${i}`}
                      d={`M 16 ${y} C 10 ${y - 2} 4 ${y + (i % 2 === 0 ? 3 : -3)} 0 ${y + (i % 3 - 1)}`}
                      strokeDasharray={i % 3 === 0 ? 'none' : '6 1'}
                    />
                  );
                })}
              </g>

              {/* Right End Fringes (Tua rua bên phải) */}
              <g id="right-fringes" stroke={finalColorHex} strokeWidth="2.5" opacity="0.9">
                {Array.from({ length: 22 }).map((_, i) => {
                  const y = 26 + (i * (height - 52)) / 21;
                  return (
                    <path
                      key={`rf-${i}`}
                      d={`M ${width - 16} ${y} C ${width - 10} ${y - 2} ${width - 4} ${y + (i % 2 === 0 ? 3 : -3)} ${width} ${y + (i % 3 - 1)}`}
                    />
                  );
                })}
              </g>

              {/* Main Scarf Body */}
              <rect
                x="16"
                y="16"
                width={width - 32}
                height={height - 32}
                rx="4"
                fill={finalColorHex}
              />

              {/* Top & Bottom Fine Hem Stitch */}
              <line x1="16" y1="20" x2={width - 16} y2="20" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />
              <line x1="16" y1={height - 20} x2={width - 16} y2={height - 20} stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

              {/* Weave Textures */}
              {weaveTexture === 'damask' && (
                <rect x="16" y="16" width={width - 32} height={height - 32} fill="url(#damask-grain)" />
              )}
              {weaveTexture === 'brocade' && (
                <rect x="16" y="16" width={width - 32} height={height - 32} fill="url(#brocade-grain)" />
              )}

              {/* Silk Sheen & Long Flowing Folds */}
              <rect
                x="16"
                y="16"
                width={width - 32}
                height={height - 32}
                rx="4"
                fill={`url(#silk-sheen-${product.id})`}
                style={{ mixBlendMode: 'overlay' }}
              />
              {showDrapeShadows && (
                <rect
                  x="16"
                  y="16"
                  width={width - 32}
                  height={height - 32}
                  rx="4"
                  fill={`url(#silk-folds-${product.id})`}
                  opacity="0.35"
                  style={{ mixBlendMode: 'multiply' }}
                />
              )}
            </g>
          )}

          {/* =========================================================
              PRODUCT 3: TÚI VẢI LỤA QUAI TRE (TOTE BAG)
             ========================================================= */}
          {isTote && (
            <g id="tote-bag-group">
              {/* Bamboo handle (Quai tre uốn cong) */}
              <path
                d="M 120 90 C 120 20 320 20 320 90"
                fill="none"
                stroke="#B8860B"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Bamboo nodes / markings */}
              <circle cx="160" cy="38" r="4" fill="#6B4E1B" />
              <circle cx="220" cy="22" r="4" fill="#6B4E1B" />
              <circle cx="280" cy="38" r="4" fill="#6B4E1B" />

              {/* Bag Body Shadow */}
              <path
                d="M 38 85 Q 220 73 402 85 L 392 462 Q 220 484 48 462 Z"
                fill="#000000"
                opacity="0.2"
              />

              {/* Bag Body Silk */}
              <path
                d="M 40 85 Q 220 75 400 85 L 390 460 Q 220 480 50 460 Z"
                fill={finalColorHex}
              />

              {/* Stitched seams & pleats */}
              <path
                d="M 40 85 Q 220 75 400 85"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.4"
              />
              <path
                d="M 80 87 L 85 455 M 360 87 L 355 455"
                fill="none"
                stroke="#000000"
                strokeWidth="1"
                opacity="0.15"
              />

              {/* Weave Textures */}
              {weaveTexture === 'damask' && (
                <path d="M 40 85 Q 220 75 400 85 L 390 460 Q 220 480 50 460 Z" fill="url(#damask-grain)" />
              )}
              {weaveTexture === 'brocade' && (
                <path d="M 40 85 Q 220 75 400 85 L 390 460 Q 220 480 50 460 Z" fill="url(#brocade-grain)" />
              )}

              {/* Silk Sheen */}
              <path
                d="M 40 85 Q 220 75 400 85 L 390 460 Q 220 480 50 460 Z"
                fill={`url(#silk-sheen-${product.id})`}
                style={{ mixBlendMode: 'overlay' }}
              />
            </g>
          )}

          {/* =========================================================
              RENDER PLACED MOTIFS
             ========================================================= */}
          <g id="placed-motifs-container">
            {motifs.map((motif) => {
              const def = SILK_MOTIFS.find((m) => m.id === motif.motifId);
              if (!def) return null;

              const isSelected = selectedMotifId === motif.id;
              const motifColor = motif.color || threadColor.hex;

              return (
                <g
                  key={motif.id}
                  transform={`translate(${motif.x}, ${motif.y}) rotate(${motif.rotation}) scale(${motif.flipX ? -motif.scale : motif.scale}, ${motif.flipY ? -motif.scale : motif.scale}) translate(-50, -50)`}
                  className={interactive ? 'cursor-move' : ''}
                  onClick={(e) => {
                    if (interactive && onSelectMotif) {
                      e.stopPropagation();
                      onSelectMotif(motif.id);
                    }
                  }}
                >
                  {/* Subtle embossed embroidery drop shadow */}
                  <path
                    d={def.svgPath}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.25"
                    transform="translate(1.5, 1.5)"
                  />

                  {/* Motif Main Silhouette / Stroke */}
                  <path
                    d={def.svgPath}
                    fill={motifColor}
                    stroke={motifColor}
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={motif.opacity || 0.95}
                    style={{
                      filter: threadColor.shimmer
                        ? 'drop-shadow(0 0 2px rgba(229, 191, 90, 0.6))'
                        : undefined
                    }}
                  />

                  {/* Shimmer thread highlight */}
                  {threadColor.shimmer && (
                    <path
                      d={def.svgPath}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="0.8"
                      strokeOpacity="0.35"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* Selection indicator box (only when interactive and selected) */}
                  {interactive && isSelected && (
                    <g className="pointer-events-none">
                      <rect
                        x="-4"
                        y="-4"
                        width="108"
                        height="108"
                        fill="none"
                        stroke="#D4A344"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        rx="4"
                      />
                      <circle cx="50" cy="-14" r="5" fill="#D4A344" />
                      <line x1="50" y1="-4" x2="50" y2="-9" stroke="#D4A344" strokeWidth="1.5" />
                      {/* Corner anchor dots */}
                      <circle cx="-4" cy="-4" r="4" fill="#D4A344" />
                      <circle cx="104" cy="-4" r="4" fill="#D4A344" />
                      <circle cx="-4" cy="104" r="4" fill="#D4A344" />
                      <circle cx="104" cy="104" r="4" fill="#D4A344" />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
