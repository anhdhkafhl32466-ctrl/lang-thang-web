'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { CraftVillage } from '@/data/craftVillages';
import { LatLng } from '@/lib/geo';

export interface CraftMapHandle {
  /** Di chuyển bản đồ tới vị trí GPS hiện tại (nếu đã có vị trí thật). */
  centerOnUser: () => void;
  /** Căn bản đồ để thấy toàn bộ tuyến đường đang vẽ. */
  fitRoute: () => void;
  centerOn: (point: LatLng, zoom?: number) => void;
  openVillage: (villageId: string) => void;
}

/** Vị trí GPS thật của người dùng. null = chưa có vị trí, bản đồ không vẽ gì (không có vị trí giả). */
export interface MapUserLocation extends LatLng {
  accuracy?: number;
}

/** Tuyến đường thật đã được dịch vụ định tuyến trả về. */
export interface MapRoute {
  geometry: LatLng[];
  origin: LatLng;
  destination: LatLng;
  originLabel?: string;
  destinationLabel?: string;
}

interface CraftMapLeafletProps {
  villages: CraftVillage[];
  selectedVillageId?: string | null;
  onSelectVillage?: (village: CraftVillage) => void;
  userLocation?: MapUserLocation | null;
  route?: MapRoute | null;
}

function getEmoji(categorySlug: string): string {
  switch (categorySlug) {
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
}

/** Popup của marker làng nghề: giữ nguyên thiết kế cũ, bổ sung nút Chỉ đường. */
function buildPopupContent(v: CraftVillage): string {
  return `
    <div style="min-width: 220px; max-width: 260px; font-family: inherit; padding: 0;">
      <div style="height: 110px; width: 100%; overflow: hidden; position: relative;">
        <img src="${v.heroImage}" alt="${v.name}" style="width: 100%; height: 100%; object-fit: cover;" />
        <span style="position: absolute; top: 6px; left: 6px; background: rgba(0,0,0,0.65); color: white; padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: bold;">
          ${v.category}
        </span>
      </div>
      <div style="padding: 10px 12px;">
        <h4 style="margin: 0; font-size: 14px; font-weight: bold; color: #1E293B;">${v.name}</h4>
        <p style="margin: 4px 0 8px 0; font-size: 11px; color: #64748B; line-height: 1.4;">
          ${v.shortDescription.substring(0, 75)}...
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 6px; gap: 6px;">
          <span style="font-size: 11px; color: #C85A32; font-weight: bold;">
            ${v.location.district}
          </span>
          <span style="display: inline-flex; gap: 6px;">
            <a href="/ban-do?to=${v.slug}" style="background: #1E293B; color: white; text-decoration: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">
              Chỉ đường
            </a>
            <a href="/lang-nghe/${v.slug}" style="background: #C85A32; color: white; text-decoration: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">
              Khám phá →
            </a>
          </span>
        </div>
      </div>
    </div>
  `;
}

function createVillageIcon(L: any, v: CraftVillage) {
  return L.divIcon({
    className: 'custom-map-pin',
    html: `
      <div style="
        background: #C85A32;
        color: white;
        width: 38px;
        height: 38px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(200, 90, 50, 0.4);
        border: 2px solid white;
        cursor: pointer;
      ">
        <span style="transform: rotate(45deg); font-size: 16px;">${getEmoji(v.categorySlug)}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38],
  });
}

/** Vẽ lại toàn bộ marker làng nghề vào layer group. */
function renderVillages(
  L: any,
  villages: CraftVillage[],
  layersGroup: any,
  markersRef: React.MutableRefObject<{ [key: string]: any }>,
  onSelect: (village: CraftVillage) => void
) {
  layersGroup.clearLayers();
  markersRef.current = {};

  villages.forEach((v) => {
    const marker = L.marker(v.location.coordinates, { icon: createVillageIcon(L, v) });
    marker.addTo(layersGroup);
    marker.bindPopup(buildPopupContent(v), { maxWidth: 280, className: 'custom-leaflet-popup' });
    marker.on('click', () => onSelect(v));
    markersRef.current[v.id] = marker;
  });
}

const CraftMapLeaflet = forwardRef<CraftMapHandle, CraftMapLeafletProps>(function CraftMapLeaflet(
  { villages, selectedVillageId, onSelectVillage, userLocation, route },
  ref
) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const userLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  const onSelectRef = useRef(onSelectVillage);
  onSelectRef.current = onSelectVillage;

  // Vị trí GPS và tuyến đường mới nhất, dùng cho các hàm điều khiển bản đồ.
  const userLocationRef = useRef<MapUserLocation | null>(null);
  const routeRef = useRef<MapRoute | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  userLocationRef.current = userLocation ?? null;
  routeRef.current = route ?? null;

  const fitRoute = () => {
    const map = mapInstanceRef.current;
    const currentRoute = routeRef.current;
    if (!map || !currentRoute || currentRoute.geometry.length === 0) return;
    import('leaflet').then((L) => {
      const bounds = L.latLngBounds(currentRoute.geometry.map((p) => [p.lat, p.lng] as [number, number]));
      map.fitBounds(bounds, { padding: [50, 50] });
    });
  };

  const centerOnUser = () => {
    const map = mapInstanceRef.current;
    const position = userLocationRef.current;
    if (!map || !position) return;
    hasCenteredOnUserRef.current = true;
    map.setView([position.lat, position.lng], 15, { animate: true });
  };

  useImperativeHandle(ref, () => ({
    centerOnUser,
    fitRoute,
    centerOn: (point: LatLng, zoom = 15) => {
      mapInstanceRef.current?.setView([point.lat, point.lng], zoom, { animate: true });
    },
    openVillage: (villageId: string) => {
      const marker = markersRef.current[villageId];
      if (!marker || !mapInstanceRef.current) return;
      try {
        marker.openPopup();
        mapInstanceRef.current.setView(marker.getLatLng(), 13, { animate: true });
      } catch {
        /* bỏ qua */
      }
    },
  }));

  // 1. Khởi tạo bản đồ Leaflet đúng một lần khi mount
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

      // Trung tâm Hà Nội; bản đồ sẽ tự căn lại theo vị trí GPS hoặc theo tuyến đường.
      const map = L.map(mapContainerRef.current, {
        center: [20.985, 105.82],
        zoom: 11,
        zoomControl: true,
      });

      // Nền bản đồ OpenStreetMap: miễn phí, không cần API key.
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Thứ tự thêm layer quyết định lớp nào nằm trên: làng nghề → vị trí GPS → tuyến đường.
      const layersGroup = L.layerGroup().addTo(map);
      const userLayer = L.layerGroup().addTo(map);
      const routeLayer = L.layerGroup().addTo(map);

      layersGroupRef.current = layersGroup;
      userLayerRef.current = userLayer;
      routeLayerRef.current = routeLayer;
      mapInstanceRef.current = map;

      renderVillages(L, villages, layersGroup, markersRef, (v) => onSelectRef.current?.(v));
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch {
          /* bỏ qua */
        }
        mapInstanceRef.current = null;
      }
      layersGroupRef.current = null;
      userLayerRef.current = null;
      routeLayerRef.current = null;
      hasCenteredOnUserRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Cập nhật marker khi danh sách làng nghề thay đổi (tìm kiếm / lọc)
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted || !layersGroupRef.current) return;
      renderVillages(L, villages, layersGroupRef.current, markersRef, (v) => onSelectRef.current?.(v));
    });

    return () => {
      isMounted = false;
    };
  }, [villages]);

  // 3. Vẽ vị trí GPS THẬT của người dùng (vòng bán kính = độ chính xác thiết bị báo về)
  useEffect(() => {
    const LPromise = import('leaflet');
    LPromise.then((L) => {
      const layer = userLayerRef.current;
      const map = mapInstanceRef.current;
      if (!layer || !map) return;

      layer.clearLayers();
      if (!userLocation) return;

      const { lat, lng, accuracy } = userLocation;
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      if (Number.isFinite(accuracy) && (accuracy as number) > 0) {
        L.circle([lat, lng], {
          radius: accuracy as number,
          color: '#2563EB',
          weight: 1,
          opacity: 0.6,
          fillColor: '#2563EB',
          fillOpacity: 0.1,
        }).addTo(layer);
      }

      L.marker([lat, lng], {
        icon: L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="position: relative; width: 22px; height: 22px;">
              <span style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(37,99,235,0.35); animation: user-ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
              <span style="position: absolute; inset: 4px; border-radius: 9999px; background: #2563EB; border: 2.5px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.35);"></span>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        }),
        zIndexOffset: 500,
      })
        .addTo(layer)
        .bindTooltip(
          `Vị trí GPS của bạn (sai số ±${Math.round(Number(accuracy) || 0)} m)`,
          { direction: 'top', offset: [0, -12] }
        );

      // Lần đầu có vị trí thật: đưa bản đồ tới đó (nếu chưa có tuyến đường đang hiển thị).
      if (!hasCenteredOnUserRef.current && !routeRef.current) {
        hasCenteredOnUserRef.current = true;
        map.setView([lat, lng], 14, { animate: true });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng, userLocation?.accuracy]);

  // 4. Vẽ tuyến đường thật: xoá tuyến cũ rồi mới vẽ tuyến mới, sau đó căn bản đồ theo tuyến
  useEffect(() => {
    import('leaflet').then((L) => {
      const layer = routeLayerRef.current;
      const map = mapInstanceRef.current;
      if (!layer || !map) return;

      layer.clearLayers();
      if (!route || route.geometry.length < 2) return;

      const latlngs: [number, number][] = route.geometry.map((p) => [p.lat, p.lng]);

      // Viền trắng giúp tuyến đường nổi bật trên mọi loại nền bản đồ.
      L.polyline(latlngs, { color: '#ffffff', weight: 10, opacity: 0.85, lineJoin: 'round' }).addTo(layer);
      L.polyline(latlngs, { color: '#C85A32', weight: 5, opacity: 0.95, lineJoin: 'round' }).addTo(layer);

      const endpointIcon = (color: string, text: string) =>
        L.divIcon({
          className: 'route-endpoint-marker',
          html: `
            <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%);">
              <div style="width: 22px; height: 22px; border-radius: 9999px; background: ${color}; color: #fff; border: 2.5px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; box-shadow: 0 3px 10px rgba(0,0,0,0.35);">
                ${text}
              </div>
            </div>
          `,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

      L.marker([route.origin.lat, route.origin.lng], { icon: endpointIcon('#16A34A', 'A'), zIndexOffset: 400 })
        .addTo(layer)
        .bindTooltip(route.originLabel ? `Điểm đi: ${route.originLabel}` : 'Điểm xuất phát', {
          direction: 'top',
          offset: [0, -12],
        });

      L.marker([route.destination.lat, route.destination.lng], {
        icon: endpointIcon('#C85A32', 'B'),
        zIndexOffset: 400,
      })
        .addTo(layer)
        .bindTooltip(route.destinationLabel ? `Điểm đến: ${route.destinationLabel}` : 'Điểm đến', {
          direction: 'top',
          offset: [0, -12],
        });

      try {
        const bounds = L.latLngBounds(latlngs);
        map.fitBounds(bounds, { padding: [50, 50] });
      } catch {
        /* bỏ qua */
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  // 5. Mở popup marker khi làng nghề được chọn từ danh sách (không phá khung nhìn tuyến đường)
  useEffect(() => {
    if (!selectedVillageId || !mapInstanceRef.current) return;
    const targetMarker = markersRef.current[selectedVillageId];
    if (!targetMarker) return;
    try {
      targetMarker.openPopup();
      if (!routeRef.current) {
        mapInstanceRef.current.setView(targetMarker.getLatLng(), 13, { animate: true });
      }
    } catch {
      /* bỏ qua */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVillageId]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden shadow-inner border border-terracotta-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
});

export default CraftMapLeaflet;
