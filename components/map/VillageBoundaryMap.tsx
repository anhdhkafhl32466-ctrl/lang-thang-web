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

// Concise short names for markers
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
      avatar.style.transform = 'scale(1.25)';
      avatar.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
      avatar.style.borderColor = '#C79A46';
    }
    if (badge) {
      badge.style.background = color;
      badge.style.color = '#ffffff';
      badge.style.borderColor = color;
    }
  } else {
    if (avatar) {
      avatar.style.transform = 'none';
      avatar.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.22)';
      avatar.style.borderColor = '#ffffff';
    }
    if (badge) {
      badge.style.background = 'rgba(255, 255, 255, 0.95)';
      badge.style.color = '#1E293B';
      badge.style.borderColor = '#E2E8F0';
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
  const baseTileLayerRef = useRef<any>(null);
  const refTileLayerRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const polygonsRef = useRef<{ [key: string]: any }>({});
  const markersRef = useRef<{ [key: string]: any }>({});

  // Map mode: 'minimal' (ESRI Light Gray Canvas - simplified roads/creeks) vs 'standard' (OpenStreetMap)
  const [mapStyle, setMapStyle] = useState<'minimal' | 'standard'>('minimal');

  const onHoverRef = useRef(onHoverVillage);
  onHoverRef.current = onHoverVillage;
  const onSelectRef = useRef(onSelectVillage);
  onSelectRef.current = onSelectVillage;

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

      // Hanoi view
      const map = L.map(mapContainerRef.current, {
        center: [20.98, 105.78],
        zoom: 10.5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Default: ESRI Light Gray Canvas — completely removes small roads, minor canals & alleys!
      const baseLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }
      ).addTo(map);

      // Subtle city/province text labels overlay
      const refLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '',
          maxZoom: 16,
        }
      ).addTo(map);

      baseTileLayerRef.current = baseLayer;
      refTileLayerRef.current = refLayer;

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

        // Clean, vibrant boundary style ALWAYS VISIBLE by default as requested!
        const defaultPolyStyle = {
          color: boundaryInfo.color,
          weight: 2,
          opacity: 0.9,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.22,
          dashArray: ''
        };

        const highlightPolyStyle = {
          color: boundaryInfo.color,
          weight: 4,
          opacity: 1,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.45,
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

        // Sleek Pin Marker
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
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.22);
                border: 2.5px solid white;
                font-size: 16px;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
              ">
                ${emoji}
              </div>
              <div class="pin-badge" style="
                margin-top: 2px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(4px);
                color: #1E293B;
                padding: 1.5px 6px;
                border-radius: 99px;
                border: 1px solid #E2E8F0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.12);
                font-size: 10.5px;
                font-weight: 700;
                white-space: nowrap;
                pointer-events: none;
                transition: background 0.2s, color 0.2s, transform 0.2s;
              ">
                ${shortName}
              </div>
            </div>
          `,
          iconSize: [54, 50],
          iconAnchor: [27, 25]
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

  // 2. Switch basemap style (minimalist vs standard OSM)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      // Remove old tile layers
      if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
      if (refTileLayerRef.current) map.removeLayer(refTileLayerRef.current);

      if (mapStyle === 'minimal') {
        // ESRI Light Gray Base (simplified: no small roads, no tangled creeks, clean background)
        baseTileLayerRef.current = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
            maxZoom: 16,
          }
        ).addTo(map);

        refTileLayerRef.current = L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
          {
            attribution: '',
            maxZoom: 16,
          }
        ).addTo(map);

        // Ensure layersGroup stays on top
        if (layersGroupRef.current) layersGroupRef.current.bringToFront();
      } else {
        // Standard OpenStreetMap (full roads & transit networks)
        baseTileLayerRef.current = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 18,
          }
        ).addTo(map);
        refTileLayerRef.current = null;

        if (layersGroupRef.current) layersGroupRef.current.bringToFront();
      }
    });
  }, [mapStyle]);

  // 3. Update layers when villages array changes
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
          weight: 2,
          opacity: 0.9,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.22,
          dashArray: ''
        };

        const highlightPolyStyle = {
          color: boundaryInfo.color,
          weight: 4,
          opacity: 1,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.45,
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
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.22);
                border: 2.5px solid white;
                font-size: 16px;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
              ">
                ${emoji}
              </div>
              <div class="pin-badge" style="
                margin-top: 2px;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(4px);
                color: #1E293B;
                padding: 1.5px 6px;
                border-radius: 99px;
                border: 1px solid #E2E8F0;
                box-shadow: 0 2px 5px rgba(0,0,0,0.12);
                font-size: 10.5px;
                font-weight: 700;
                white-space: nowrap;
                pointer-events: none;
                transition: background 0.2s, color 0.2s, transform 0.2s;
              ">
                ${shortName}
              </div>
            </div>
          `,
          iconSize: [54, 50],
          iconAnchor: [27, 25]
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
  }, [villages]);

  // 4. React to programmatic hover from outside
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
            weight: 4,
            opacity: 1,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: 0.45,
            dashArray: ''
          });
          poly.bringToFront();
          if (marker) setPinActive(marker, true, boundaryInfo.color);
        } catch (e) {}
      } else {
        try {
          poly.setStyle({
            color: boundaryInfo.color,
            weight: 2,
            opacity: 0.9,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: 0.22,
            dashArray: ''
          });
          if (marker) setPinActive(marker, false, boundaryInfo.color);
        } catch (e) {}
      }
    });
  }, [hoveredVillageId]);

  return (
    <div className="relative w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-inner border border-terracotta-200">
      {/* Map DOM node */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[600px]" />

      {/* Map Style Switcher (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-2xl border border-terracotta-200 shadow-md">
        <button
          onClick={() => setMapStyle('minimal')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mapStyle === 'minimal'
              ? 'bg-[#33455E] text-white shadow-sm'
              : 'text-[#5A5348] hover:text-[#1E293B]'
          }`}
          title="Bản đồ tinh gọn: loại bỏ các tuyến đường nhỏ & kênh rạch vụn vặt"
        >
          ✨ Tinh gọn (ít đường nhỏ)
        </button>
        <button
          onClick={() => setMapStyle('standard')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mapStyle === 'standard'
              ? 'bg-[#33455E] text-white shadow-sm'
              : 'text-[#5A5348] hover:text-[#1E293B]'
          }`}
          title="Bản đồ giao thông OpenStreetMap đầy đủ"
        >
          🗺️ Chi tiết
        </button>
      </div>
    </div>
  );
}
