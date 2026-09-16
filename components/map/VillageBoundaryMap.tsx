'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CraftVillage } from '@/data/craftVillages';
import { VILLAGE_BOUNDARIES } from '@/data/villageBoundaries';

interface VillageBoundaryMapProps {
  villages: CraftVillage[];
  hoveredVillageId?: string | null;
  onHoverVillage?: (village: CraftVillage | null) => void;
  onSelectVillage?: (village: CraftVillage) => void;
}

// Concise short names for markers to eliminate visual clutter and text overlap
const SHORT_NAMES: Record<string, string> = {
  'bat-trang': 'Bát Tràng',
  'van-phuc': 'Vạn Phúc',
  'kieu-ky': 'Kiêu Kỵ',
  'phu-vinh': 'Phú Vinh',
  'chuong': 'Làng Chuông',
  'dao-thuc': 'Đào Thục',
  'tay-tuu': 'Tây Tựu',
  'xuan-la': 'Xuân La',
  'quang-phu-cau': 'Quảng Phú Cầu',
  'chuon-ngo': 'Chuôn Ngọ',
  'ha-thai': 'Hạ Thái',
  'son-dong': 'Sơn Đồng',
  'trach-xa': 'Trạch Xá',
  'thach-xa': 'Thạch Xá',
  'chang-son': 'Chàng Sơn',
  'me-tri': 'Mễ Trì',
};

const getEmojiForCategory = (slug: string) => {
  switch (slug) {
    case 'gom-su': return '🏺';
    case 'lua-det': return '🧵';
    case 'may-tre-dan': return '🎋';
    case 'non-la': return '👒';
    case 'dat-vang': return '✨';
    case 'nghe-thuat-dan-gian': return '🎭';
    case 'hoa-nong-nghiep': return '🌸';
    case 'do-choi-dan-gian': return '🧸';
    case 'huong-thao-moc': return '🏮';
    case 'son-mai-kham-trai': return '🐚';
    case 'dieu-khac-go': return '⛩️';
    case 'am-thuc-truyen-thong': return '🍃';
    default: return '📍';
  }
};

function setPinActive(marker: any, active: boolean, color: string) {
  if (!marker) return;
  const el: HTMLElement | null = marker.getElement ? marker.getElement() : (marker as any)._icon;
  if (!el) return;

  const avatar = el.querySelector('.pin-avatar') as HTMLElement | null;
  const badge = el.querySelector('.pin-badge') as HTMLElement | null;

  if (active) {
    if (avatar) {
      avatar.style.transform = 'scale(1.22)';
      avatar.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
      avatar.style.zIndex = '999';
    }
    if (badge) {
      badge.style.background = color;
      badge.style.color = '#ffffff';
      badge.style.borderColor = color;
      badge.style.transform = 'scale(1.05)';
      badge.style.zIndex = '999';
    }
  } else {
    if (avatar) {
      avatar.style.transform = 'none';
      avatar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.22)';
      avatar.style.zIndex = '1';
    }
    if (badge) {
      badge.style.background = 'rgba(255, 255, 255, 0.95)';
      badge.style.color = '#1E293B';
      badge.style.borderColor = '#E2E8F0';
      badge.style.transform = 'none';
      badge.style.zIndex = '1';
    }
  }
}

export default function VillageBoundaryMap({
  villages,
  hoveredVillageId,
  onHoverVillage,
  onSelectVillage
}: VillageBoundaryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const polygonsRef = useRef<{ [key: string]: any }>({});
  const markersRef = useRef<{ [key: string]: any }>({});
  const [showBoundaries, setShowBoundaries] = useState(false);

  // Use refs for callbacks so changing them NEVER triggers re-initialization
  const onHoverRef = useRef(onHoverVillage);
  onHoverRef.current = onHoverVillage;
  const onSelectRef = useRef(onSelectVillage);
  onSelectRef.current = onSelectVillage;
  const showBoundariesRef = useRef(showBoundaries);
  showBoundariesRef.current = showBoundaries;

  // 1. Initialize Leaflet Map ONCE on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    async function initMap() {
      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      // Hanoi center view
      const map = L.map(mapContainerRef.current, {
        center: [20.98, 105.78],
        zoom: 10.5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // CartoDB Voyager: Clean, elegant, minimalist basemap without visual clutter
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      renderLayers(L, map, layersGroup);
    }

    function renderLayers(L: any, map: any, layersGroup: any) {
      if (!isMounted) return;
      layersGroup.clearLayers();
      polygonsRef.current = {};
      markersRef.current = {};

      const allPoints: [number, number][] = [];

      villages.forEach((village) => {
        const boundaryInfo = VILLAGE_BOUNDARIES[village.slug];
        if (!boundaryInfo) return;

        // Clean subtle polygon style: hidden or ultra-subtle by default to keep map clean
        const defaultPolyStyle = {
          color: boundaryInfo.color,
          weight: showBoundariesRef.current ? 1.5 : 1,
          opacity: showBoundariesRef.current ? 0.45 : 0,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: showBoundariesRef.current ? 0.08 : 0,
          dashArray: ''
        };

        const highlightPolyStyle = {
          color: boundaryInfo.color,
          weight: 3,
          opacity: 1,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.35,
          dashArray: ''
        };

        const polygon = L.polygon(boundaryInfo.boundary, defaultPolyStyle);
        polygon.addTo(layersGroup);

        boundaryInfo.boundary.forEach((pt) => allPoints.push(pt));

        // Hover events on boundary polygon
        polygon.on('mouseover', () => {
          try {
            polygon.setStyle(highlightPolyStyle);
            polygon.bringToFront();
            const m = markersRef.current[village.slug];
            if (m) setPinActive(m, true, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        polygon.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            const m = markersRef.current[village.slug];
            if (m) setPinActive(m, false, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        polygon.on('click', () => {
          onSelectRef.current?.(village);
        });

        polygonsRef.current[village.slug] = polygon;

        // Sleek Minimalist Pin:
        // Round craft emoji badge + crisp short name (e.g. "Bát Tràng" instead of "Làng gốm Bát Tràng")
        const shortName = SHORT_NAMES[village.slug] || village.name.replace('Làng nghề ', '').replace('Làng ', '');
        const emoji = getEmojiForCategory(village.categorySlug);

        const pinIcon = L.divIcon({
          className: 'clean-village-marker',
          html: `
            <div class="village-pin-inner" id="pin-${village.slug}" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transform: translate(-50%, -50%);
              user-select: none;
            ">
              <div class="pin-avatar" style="
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: ${boundaryInfo.color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
                border: 2.5px solid white;
                font-size: 16px;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
              ">
                ${emoji}
              </div>
              <div class="pin-badge" style="
                margin-top: 3px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(4px);
                color: #1E293B;
                padding: 1.5px 7px;
                border-radius: 99px;
                border: 1px solid #E2E8F0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.12);
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
                pointer-events: none;
                transition: background 0.2s, color 0.2s, transform 0.2s;
              ">
                ${shortName}
              </div>
            </div>
          `,
          iconSize: [60, 52],
          iconAnchor: [30, 26]
        });

        const marker: any = L.marker(village.location.coordinates, { icon: pinIcon });
        marker.addTo(layersGroup);

        marker.on('mouseover', () => {
          try {
            polygon.setStyle(highlightPolyStyle);
            polygon.bringToFront();
            setPinActive(marker, true, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            setPinActive(marker, false, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        marker.on('click', () => {
          onSelectRef.current?.(village);
        });

        markersRef.current[village.slug] = marker;
      });

      if (allPoints.length > 0) {
        try {
          const bounds = L.latLngBounds(allPoints);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11.5 });
        } catch (e) {}
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Update layers when villages array changes
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted || !mapInstanceRef.current || !layersGroupRef.current) return;

      const layersGroup = layersGroupRef.current;
      layersGroup.clearLayers();
      polygonsRef.current = {};
      markersRef.current = {};

      const allPoints: [number, number][] = [];

      villages.forEach((village) => {
        const boundaryInfo = VILLAGE_BOUNDARIES[village.slug];
        if (!boundaryInfo) return;

        const defaultPolyStyle = {
          color: boundaryInfo.color,
          weight: showBoundaries ? 1.5 : 1,
          opacity: showBoundaries ? 0.45 : 0,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: showBoundaries ? 0.08 : 0,
          dashArray: ''
        };

        const highlightPolyStyle = {
          color: boundaryInfo.color,
          weight: 3,
          opacity: 1,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.35,
          dashArray: ''
        };

        const polygon = L.polygon(boundaryInfo.boundary, defaultPolyStyle);
        polygon.addTo(layersGroup);

        boundaryInfo.boundary.forEach((pt) => allPoints.push(pt));

        polygon.on('mouseover', () => {
          try {
            polygon.setStyle(highlightPolyStyle);
            polygon.bringToFront();
            const m = markersRef.current[village.slug];
            if (m) setPinActive(m, true, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        polygon.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            const m = markersRef.current[village.slug];
            if (m) setPinActive(m, false, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        polygon.on('click', () => {
          onSelectRef.current?.(village);
        });

        polygonsRef.current[village.slug] = polygon;

        const shortName = SHORT_NAMES[village.slug] || village.name.replace('Làng nghề ', '').replace('Làng ', '');
        const emoji = getEmojiForCategory(village.categorySlug);

        const pinIcon = L.divIcon({
          className: 'clean-village-marker',
          html: `
            <div class="village-pin-inner" id="pin-${village.slug}" style="
              display: flex;
              flex-direction: column;
              align-items: center;
              cursor: pointer;
              transform: translate(-50%, -50%);
              user-select: none;
            ">
              <div class="pin-avatar" style="
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: ${boundaryInfo.color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.22);
                border: 2.5px solid white;
                font-size: 16px;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
              ">
                ${emoji}
              </div>
              <div class="pin-badge" style="
                margin-top: 3px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(4px);
                color: #1E293B;
                padding: 1.5px 7px;
                border-radius: 99px;
                border: 1px solid #E2E8F0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.12);
                font-size: 11px;
                font-weight: 700;
                white-space: nowrap;
                pointer-events: none;
                transition: background 0.2s, color 0.2s, transform 0.2s;
              ">
                ${shortName}
              </div>
            </div>
          `,
          iconSize: [60, 52],
          iconAnchor: [30, 26]
        });

        const marker: any = L.marker(village.location.coordinates, { icon: pinIcon });
        marker.addTo(layersGroup);

        marker.on('mouseover', () => {
          try {
            polygon.setStyle(highlightPolyStyle);
            polygon.bringToFront();
            setPinActive(marker, true, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            setPinActive(marker, false, boundaryInfo.color);
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        marker.on('click', () => {
          onSelectRef.current?.(village);
        });

        markersRef.current[village.slug] = marker;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [villages, showBoundaries]);

  // 3. React to programmatic hover from outside (sync style)
  useEffect(() => {
    if (!polygonsRef.current) return;

    Object.keys(polygonsRef.current).forEach((slug) => {
      const poly = polygonsRef.current[slug];
      const boundaryInfo = VILLAGE_BOUNDARIES[slug];
      const marker = markersRef.current[slug];
      if (!poly || !boundaryInfo) return;

      if (hoveredVillageId === slug) {
        try {
          poly.setStyle({
            color: boundaryInfo.color,
            weight: 3,
            opacity: 1,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: 0.35,
            dashArray: ''
          });
          poly.bringToFront();
          if (marker) setPinActive(marker, true, boundaryInfo.color);
        } catch (e) {}
      } else {
        try {
          poly.setStyle({
            color: boundaryInfo.color,
            weight: showBoundaries ? 1.5 : 1,
            opacity: showBoundaries ? 0.45 : 0,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: showBoundaries ? 0.08 : 0,
            dashArray: ''
          });
          if (marker) setPinActive(marker, false, boundaryInfo.color);
        } catch (e) {}
      }
    });
  }, [hoveredVillageId, showBoundaries]);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-inner border border-terracotta-200">
      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[600px]" />

      {/* Map Control Utility: Toggle Boundaries */}
      <div className="absolute bottom-4 left-4 z-[400]">
        <button
          onClick={() => setShowBoundaries((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-md backdrop-blur-md transition-all border ${
            showBoundaries
              ? 'bg-lacquer-900 text-white border-lacquer-800'
              : 'bg-white/95 text-lacquer-800 hover:bg-white border-terracotta-200'
          }`}
        >
          <span>{showBoundaries ? '✓' : '⬡'}</span>
          <span>{showBoundaries ? 'Đang hiện ranh giới' : 'Hiện ranh giới làng'}</span>
        </button>
      </div>
    </div>
  );
}
