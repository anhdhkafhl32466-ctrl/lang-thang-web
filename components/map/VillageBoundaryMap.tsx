'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CraftVillage } from '@/data/craftVillages';

interface VillageBoundaryMapProps {
  villages: CraftVillage[];
  hoveredVillageId?: string | null;
  onHoverVillage?: (village: CraftVillage | null) => void;
  onSelectVillage?: (village: CraftVillage) => void;
}

// Bảng màu nhận diện văn hóa theo từng ngành nghề
export const CATEGORY_COLORS: Record<string, string> = {
  'gom-su': '#C85A32',
  'lua-det': '#E11D48',
  'may-tre-dan': '#16A34A',
  'non-la': '#CA8A04',
  'dat-vang': '#D4A344',
  'nghe-thuat-dan-gian': '#0284C7',
  'hoa-nong-nghiep': '#EC4899',
  'do-choi-dan-gian': '#8B5CF6',
  'huong-thao-moc': '#DC2626',
  'son-mai-kham-trai': '#0D9488',
  'dieu-khac-go': '#78350F',
  'am-thuc-truyen-thong': '#10B981',
};

export function getCategoryColor(categorySlug: string): string {
  return CATEGORY_COLORS[categorySlug] || '#C85A32';
}

// Tên ngắn gọn hiển thị rõ ràng trên marker bản đồ
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
  'chuyen-my': 'Chuôn Ngọ',
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
      avatar.style.boxShadow = '0 8px 22px rgba(0,0,0,0.38)';
      avatar.style.borderColor = '#C79A46';
    }
    if (badge) {
      badge.style.background = color;
      badge.style.color = '#ffffff';
      badge.style.borderColor = color;
      badge.style.transform = 'scale(1.05)';
    }
  } else {
    if (avatar) {
      avatar.style.transform = 'none';
      avatar.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.22)';
      avatar.style.borderColor = '#ffffff';
    }
    if (badge) {
      badge.style.background = 'rgba(255, 255, 255, 0.96)';
      badge.style.color = '#1E293B';
      badge.style.borderColor = '#CBD5E1';
      badge.style.transform = 'none';
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
  const markersRef = useRef<{ [key: string]: any }>({});

  // Chế độ bản đồ: 'minimal' (ESRI Canvas tinh gọn, không rườm rà đường nhỏ) vs 'standard' (OpenStreetMap)
  const [mapStyle, setMapStyle] = useState<'minimal' | 'standard'>('minimal');

  const onHoverRef = useRef(onHoverVillage);
  onHoverRef.current = onHoverVillage;
  const onSelectRef = useRef(onSelectVillage);
  onSelectRef.current = onSelectVillage;

  // 1. Khởi tạo Leaflet Map khi component mount
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

      // Khung nhìn bao quát Hà Nội
      const map = L.map(mapContainerRef.current, {
        center: [20.95, 105.78],
        zoom: 10.5,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      // Lớp nền ESRI Light Gray Canvas - tinh gọn, tôn vinh các điểm đánh dấu
      const baseLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          maxZoom: 16,
        }
      ).addTo(map);

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

      renderMarkers(L, map, layersGroup);
    }

    function renderMarkers(L: any, map: any, layersGroup: any) {
      if (!isMounted) return;
      layersGroup.clearLayers();
      markersRef.current = {};

      const points: [number, number][] = [];

      villages.forEach((village) => {
        const coords = village.location.coordinates;
        if (!coords || coords.length < 2) return;
        points.push(coords);

        const color = getCategoryColor(village.categorySlug);
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
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                border: 2.5px solid white;
                font-size: 17px;
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
              ">
                ${emoji}
              </div>
              <div class="pin-badge" style="
                margin-top: 3px;
                background: rgba(255, 255, 255, 0.96);
                backdrop-filter: blur(4px);
                color: #1E293B;
                padding: 2px 7px;
                border-radius: 99px;
                border: 1px solid #CBD5E1;
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
          iconSize: [60, 56],
          iconAnchor: [30, 28]
        });

        const marker: any = L.marker(coords, { icon: pinIcon, zIndexOffset: 50 });
        marker.addTo(layersGroup);

        marker.on('mouseover', () => {
          try {
            marker.setZIndexOffset(1000);
            setPinActive(marker, true, color);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            marker.setZIndexOffset(50);
            setPinActive(marker, false, color);
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        marker.on('click', () => {
          onSelectRef.current?.(village);
        });

        markersRef.current[village.slug] = marker;
      });

      if (points.length > 0) {
        try {
          const bounds = L.latLngBounds(points);
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
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

  // 2. Chuyển đổi kiểu bản đồ (tinh gọn vs OpenStreetMap tiêu chuẩn)
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
      if (refTileLayerRef.current) map.removeLayer(refTileLayerRef.current);

      if (mapStyle === 'minimal') {
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

        if (layersGroupRef.current) layersGroupRef.current.bringToFront();
      } else {
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

  // 3. Cập nhật markers khi danh sách làng nghề thay đổi
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted || !mapInstanceRef.current || !layersGroupRef.current) return;

      const layersGroup = layersGroupRef.current;
      layersGroup.clearLayers();
      markersRef.current = {};

      const points: [number, number][] = [];

      villages.forEach((village) => {
        const coords = village.location.coordinates;
        if (!coords || coords.length < 2) return;
        points.push(coords);

        const color = getCategoryColor(village.categorySlug);
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
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
                border: 2.5px solid white;
                font-size: 17px;
                transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
              ">
                ${emoji}
              </div>
              <div class="pin-badge" style="
                margin-top: 3px;
                background: rgba(255, 255, 255, 0.96);
                backdrop-filter: blur(4px);
                color: #1E293B;
                padding: 2px 7px;
                border-radius: 99px;
                border: 1px solid #CBD5E1;
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
          iconSize: [60, 56],
          iconAnchor: [30, 28]
        });

        const marker: any = L.marker(coords, { icon: pinIcon, zIndexOffset: 50 });
        marker.addTo(layersGroup);

        marker.on('mouseover', () => {
          try {
            marker.setZIndexOffset(1000);
            setPinActive(marker, true, color);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            marker.setZIndexOffset(50);
            setPinActive(marker, false, color);
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

  // 4. Đồng bộ hiệu ứng hover từ bên ngoài (khi người dùng rê chuột vào thẻ danh sách làng)
  useEffect(() => {
    if (!markersRef.current) return;

    villages.forEach((village) => {
      const marker = markersRef.current[village.slug];
      if (!marker) return;
      const color = getCategoryColor(village.categorySlug);

      if (hoveredVillageId === village.slug) {
        try {
          marker.setZIndexOffset(1000);
          setPinActive(marker, true, color);
        } catch (e) {}
      } else {
        try {
          marker.setZIndexOffset(50);
          setPinActive(marker, false, color);
        } catch (e) {}
      }
    });
  }, [hoveredVillageId, villages]);

  return (
    <div className="relative isolate z-10 w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-inner border border-terracotta-200">
      {/* Khung bản đồ Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[600px]" />

      {/* Bộ chuyển đổi kiểu bản đồ (Góc dưới bên trái) */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-[#FAF5ED]/95 p-1 rounded-2xl border border-[#b89b78]/60 shadow-md pointer-events-auto">
        <button
          onClick={() => setMapStyle('minimal')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            mapStyle === 'minimal'
              ? 'bg-[#33455E] text-white shadow-sm'
              : 'text-[#5A5348] hover:text-[#1E293B]'
          }`}
          title="Bản đồ tinh gọn: làm nổi bật các điểm đánh dấu làng nghề"
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
