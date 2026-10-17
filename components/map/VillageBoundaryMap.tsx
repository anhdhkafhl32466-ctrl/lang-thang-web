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

/**
 * Kích thước ghim và mốc neo — QUAN TRỌNG để ghim khớp đúng toạ độ.
 *
 * Leaflet đặt góc trên-trái của hộp icon tại (toạ độ - iconAnchor). Nếu đặt iconAnchor = [32, 18]
 * thì tâm vòng tròn avatar (36px, nằm ở 0..36px tính từ mép trên hộp) rơi đúng vào toạ độ.
 * Bản trước dùng thêm `transform: translate(-50%, -50%)` nên đẩy ghim lệch lên-trên khoảng
 * 30px × 28px — ở mức zoom 10 là lệch ~7 km so với vị trí thật.
 */
const PIN_WIDTH = 64;
const AVATAR_SIZE = 36;
const PIN_ICON_SIZE: [number, number] = [PIN_WIDTH, 64];
const PIN_ICON_ANCHOR: [number, number] = [PIN_WIDTH / 2, AVATAR_SIZE / 2];

function pinHtml(village: CraftVillage, color: string, shortName: string, emoji: string, priority: number) {
  return `
    <div
      class="village-pin-inner"
      id="pin-${village.slug}"
      style="position: absolute; left: 0; top: 0; width: ${PIN_WIDTH}px; height: ${PIN_ICON_SIZE[1]}px; display: flex; flex-direction: column; align-items: center; cursor: pointer; user-select: none;"
    >
      <div
        class="pin-avatar"
        style="
          width: ${AVATAR_SIZE}px;
          height: ${AVATAR_SIZE}px;
          border-radius: 50%;
          background: ${color};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
          border: 2.5px solid white;
          font-size: 17px;
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s;
        "
      >
        ${emoji}
      </div>
      <div
        class="pin-badge"
        data-priority="${priority}"
        data-placement="bottom"
        style="
          left: 8px;
          top: 39px;
          background: rgba(255, 255, 255, 0.96);
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
        "
      >
        ${shortName}
      </div>
    </div>
  `;
}

function createPinIcon(L: any, village: CraftVillage, priority = 0) {
  const shortName = SHORT_NAMES[village.slug] || village.name.replace('Làng nghề ', '').replace('Làng ', '');
  return L.divIcon({
    className: 'clean-village-marker',
    html: pinHtml(village, getCategoryColor(village.categorySlug), shortName, getEmojiForCategory(village.categorySlug), priority),
    iconSize: PIN_ICON_SIZE,
    iconAnchor: PIN_ICON_ANCHOR,
  });
}

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
      badge.dataset.priority = '2';
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
      badge.dataset.priority = '0';
    }
  }
}

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

type LabelPlacement = 'bottom' | 'top' | 'right' | 'left';

const LABEL_GAP = 4;

function rectOf(r: DOMRect): Rect {
  return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
}

function inflate(box: Rect, padding: number): Rect {
  return {
    left: box.left - padding,
    right: box.right + padding,
    top: box.top - padding,
    bottom: box.bottom + padding,
  };
}

function intersects(a: Rect, b: Rect): boolean {
  return !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);
}

interface LabelItem {
  el: HTMLElement;
  priority: number;
  width: number;
  height: number;
  anchorX: number;
  anchorY: number;
  radius: number;
  ownAvatar: Rect | null;
}

/** Bốn vị trí thử cho nhãn, xếp theo mức ưu tiên hiển thị (dưới ghim là mặc định). */
function labelCandidates(item: LabelItem): { name: LabelPlacement; box: Rect }[] {
  const { anchorX: x, anchorY: y, width: w, height: h, radius: r } = item;
  return [
    { name: 'bottom', box: { left: x - w / 2, right: x + w / 2, top: y + r + LABEL_GAP, bottom: y + r + LABEL_GAP + h } },
    { name: 'top', box: { left: x - w / 2, right: x + w / 2, top: y - r - LABEL_GAP - h, bottom: y - r - LABEL_GAP } },
    { name: 'right', box: { left: x + r + LABEL_GAP, right: x + r + LABEL_GAP + w, top: y - h / 2, bottom: y + h / 2 } },
    { name: 'left', box: { left: x - r - LABEL_GAP - w, right: x - r - LABEL_GAP, top: y - h / 2, bottom: y + h / 2 } },
  ];
}

/**
 * Đặt nhãn tên làng quanh ghim sao cho không chồng chữ — cách bản đồ Google Maps xử lý.
 *
 * Vì sao cần: 8 làng nghề nằm trong vành đai Hà Nội, ở mức zoom thấp nhãn đè lên nhau thành một
 * mảng chữ không đọc được. Mỗi nhãn được thử lần lượt bốn vị trí (dưới, trên, phải, trái) và
 * nhận vị trí trống đầu tiên; nhãn làng đang chọn hoặc đang rê chuột luôn được xét trước. Nhãn
 * không còn chỗ nào trống sẽ được giấu, và vì nhãn được định vị tuyệt đối nên lần đo sau không
 * bị lệch như cách giấu cũ.
 */
function placeVillageLabels(container: HTMLElement | null) {
  if (!container) return;
  const badges = Array.from(container.querySelectorAll<HTMLElement>('.pin-badge'));
  if (badges.length === 0) return;

  const obstacles: Rect[] = [];

  const items: LabelItem[] = badges.map((el) => {
    const avatar = el.parentElement?.querySelector<HTMLElement>('.pin-avatar') ?? null;
    const avatarRect = avatar ? avatar.getBoundingClientRect() : null;

    // Đo kích thước nhãn trong lúc còn hiển thị; vị trí tuyệt đối không làm đổi kích thước.
    el.style.visibility = '';
    el.style.opacity = '';
    const rect = el.getBoundingClientRect();

    const ownAvatar = avatarRect ? rectOf(avatarRect) : null;
    if (ownAvatar) obstacles.push(ownAvatar);

    return {
      el,
      priority: Number(el.dataset.priority || 0),
      width: rect.width,
      height: rect.height,
      anchorX: ownAvatar ? (ownAvatar.left + ownAvatar.right) / 2 : 0,
      anchorY: ownAvatar ? (ownAvatar.top + ownAvatar.bottom) / 2 : 0,
      radius: ownAvatar ? (ownAvatar.right - ownAvatar.left) / 2 : 0,
      ownAvatar,
    };
  });

  // Ưu tiên: làng đang chọn/rê chuột trước, rồi tới thứ tự trên-xuống, trái-sang-phải.
  items.sort((a, b) => b.priority - a.priority || a.anchorY - b.anchorY || a.anchorX - b.anchorX);

  const placed: Rect[] = [];

  items.forEach((item) => {
    const wrapperRect = item.el.parentElement?.getBoundingClientRect() ?? null;
    const chosen = wrapperRect
      ? labelCandidates(item).find((candidate) => {
          const box = inflate(candidate.box, 2);
          return !obstacles.some((o) => o !== item.ownAvatar && intersects(box, o)) && !placed.some((p) => intersects(box, p));
        })
      : undefined;

    if (!chosen || !wrapperRect) {
      item.el.style.visibility = 'hidden';
      item.el.style.opacity = '0';
      return;
    }

    item.el.style.left = `${Math.round(chosen.box.left - wrapperRect.left)}px`;
    item.el.style.top = `${Math.round(chosen.box.top - wrapperRect.top)}px`;
    item.el.dataset.placement = chosen.name;
    item.el.style.visibility = '';
    item.el.style.opacity = '';
    placed.push(inflate(chosen.box, 2));
  });
}

/**
 * Hai kiểu nền bản đồ, chọn theo TIÊU CHÍ ĐỊA GIỚI CẬP NHẬT chứ không theo màu sắc.
 *
 * Vì sao phải như vậy: sau cuộc sáp nhập đơn vị hành chính năm 2025, Hà Nội không còn cấp
 * huyện và nhiều xã/phường đổi tên. Lớp nền của Esri (World Street Map, Light Gray) vẫn in
 * "Huyện Ứng Hòa" — một đơn vị đã bỏ, nên không dùng cho chế độ xem đường phố nữa.
 * OpenStreetMap đã cập nhật và hiển thị "Xã Ứng Thiên"… tức tên mới.
 *
 * - 'street'   : OpenStreetMap — địa giới và tên đơn vị hành chính mới nhất.
 * - 'satellite': ảnh vệ tinh Esri World Imagery — không có nhãn, nên không thể hiện sai địa giới;
 *                dùng để nhìn rõ làng nghề từ trên cao.
 */
export type MapStyle = 'street' | 'satellite';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const ESRI_IMAGERY_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Esri, Maxar, Earthstar Geographics';

/** Dựng bộ lớp nền cho một kiểu bản đồ. */
function createBaseLayers(L: any, style: MapStyle): { base: any; reference: any } {
  if (style === 'satellite') {
    return {
      base: L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { attribution: ESRI_IMAGERY_ATTRIBUTION, maxZoom: 18 }
      ),
      reference: null,
    };
  }

  return {
    base: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: OSM_ATTRIBUTION,
      maxZoom: 19,
    }),
    reference: null,
  };
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
  // Kiểu nền hiện tại, để hàm khởi tạo bản đồ dùng đúng kiểu mà không cần chạy lại effect.
  const mapStyleRef = useRef<MapStyle>('street');
  // Khung nhìn đã do người dùng tự kéo/phóng chưa (để không giật bản đồ khi dữ liệu đổi liên tục).
  const declutterFrameRef = useRef<number | null>(null);

  // Mặc định nền OpenStreetMap: địa giới và tên xã/phường đã cập nhật theo đơn vị hành chính mới.
  const [mapStyle, setMapStyle] = useState<MapStyle>('street');

  const onHoverRef = useRef(onHoverVillage);
  onHoverRef.current = onHoverVillage;
  const onSelectRef = useRef(onSelectVillage);
  onSelectRef.current = onSelectVillage;

  /**
   * Thu nhỏ ghim khi khung nhìn còn rộng. Vành đai Hà Nội có 8 làng nghề cách nhau vài km nên
   * ở mức zoom thấp các vòng tròn 36px sẽ đè lên nhau; hạ tỉ lệ giúp phân biệt được từng làng
   * mà toạ độ vẫn giữ nguyên (transform-origin nằm đúng mốc neo).
   */
  const applyZoomScale = () => {
    const container = mapContainerRef.current;
    const map = mapInstanceRef.current;
    if (!container || !map) return;
    const zoom = map.getZoom();
    container.classList.toggle('village-map-zoom-far', zoom <= 10);
    container.classList.toggle('village-map-zoom-mid', zoom > 10 && zoom <= 12);
  };

  /** Giấu nhãn chồng nhau + chỉnh tỉ lệ ghim, gộp nhiều lần gọi trong cùng một khung hình. */
  const scheduleDeclutter = () => {
    if (declutterFrameRef.current !== null) return;
    declutterFrameRef.current = window.requestAnimationFrame(() => {
      declutterFrameRef.current = null;
      applyZoomScale();
      placeVillageLabels(mapContainerRef.current);
    });
  };

  /** Vẽ toàn bộ ghim làng nghề vào layer group. */
  const renderMarkers = (L: any, layersGroup: any) => {
    layersGroup.clearLayers();
    markersRef.current = {};

    villages.forEach((village) => {
      const coords = village.location.coordinates;
      if (!coords || coords.length < 2) return;

      const color = getCategoryColor(village.categorySlug);
      const isActive = hoveredVillageId === village.slug;
      const marker: any = L.marker(coords, {
        icon: createPinIcon(L, village, isActive ? 2 : 0),
        zIndexOffset: isActive ? 1000 : 50,
      });
      marker.addTo(layersGroup);

      marker.on('mouseover', () => {
        try {
          marker.setZIndexOffset(1000);
          setPinActive(marker, true, color);
        } catch (e) {}
        scheduleDeclutter();
        onHoverRef.current?.(village);
      });

      marker.on('mouseout', () => {
        try {
          marker.setZIndexOffset(50);
          setPinActive(marker, false, color);
        } catch (e) {}
        scheduleDeclutter();
        onHoverRef.current?.(null);
      });

      marker.on('click', () => {
        onSelectRef.current?.(village);
      });

      markersRef.current[village.slug] = marker;
    });

    scheduleDeclutter();
  };

  /**
   * Căn bản đồ theo đúng tập làng đang hiển thị.
   * Một làng duy nhất thì phóng thẳng tới làng đó — trước đây `fitBounds` trên một điểm cho ra
   * khung nhìn rất rộng nên người dùng lọc một ngành nghề lại thấy cả vùng đồng bằng.
   */
  const fitToVillages = (L: any, map: any) => {
    const points: [number, number][] = villages
      .map((v) => v.location.coordinates)
      .filter((c) => Array.isArray(c) && c.length >= 2) as [number, number][];

    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true });
      return;
    }
    try {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 12 });
    } catch (e) {}
  };

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
        zoom: 10,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      const { base, reference } = createBaseLayers(L, mapStyleRef.current);
      base.addTo(map);
      if (reference) reference.addTo(map);

      baseTileLayerRef.current = base;
      refTileLayerRef.current = reference;

      // Điều khiển zoom/thước tỉ lệ ở góc dưới-phải: góc trên-trái đã dành cho bảng hướng dẫn,
      // nút zoom mặc định từng bị bảng đó che mất.
      L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      renderMarkers(L, layersGroup);

      const refit = () => scheduleDeclutter();
      map.on('zoomend moveend resize', refit);

      if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => {
          try {
            map.invalidateSize();
          } catch (e) {}
          scheduleDeclutter();
        });
        observer.observe(mapContainerRef.current);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      if (declutterFrameRef.current !== null) {
        window.cancelAnimationFrame(declutterFrameRef.current);
        declutterFrameRef.current = null;
      }
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.off();
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Chuyển đổi kiểu nền bản đồ (địa giới mới / vệ tinh)
  useEffect(() => {
    mapStyleRef.current = mapStyle;
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import('leaflet').then((L) => {
      if (baseTileLayerRef.current) map.removeLayer(baseTileLayerRef.current);
      if (refTileLayerRef.current) map.removeLayer(refTileLayerRef.current);

      const { base, reference } = createBaseLayers(L, mapStyle);
      base.addTo(map);
      if (reference) reference.addTo(map);

      baseTileLayerRef.current = base;
      refTileLayerRef.current = reference;

      // Không cần nâng lớp ghim: Leaflet vẽ ghim ở marker pane, vốn luôn nằm trên tile pane
      // của lớp nền vừa thêm (LayerGroup không có bringToFront).
      scheduleDeclutter();
    });
  }, [mapStyle]);

  // 3. Vẽ lại ghim khi tập làng nghề đổi (tìm kiếm / lọc ngành nghề) rồi căn lại khung nhìn
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layersGroup = layersGroupRef.current;
    if (!map || !layersGroup) return;

    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted || !mapInstanceRef.current || !layersGroupRef.current) return;
      renderMarkers(L, layersGroupRef.current);
      fitToVillages(L, mapInstanceRef.current);
    });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [villages]);

  // 4. Đồng bộ hiệu ứng hover từ bên ngoài (khi người dùng rê chuột vào thẻ danh sách làng)
  useEffect(() => {
    if (!markersRef.current) return;

    villages.forEach((village) => {
      const marker = markersRef.current[village.slug];
      if (!marker) return;
      const color = getCategoryColor(village.categorySlug);
      const active = hoveredVillageId === village.slug;

      try {
        marker.setZIndexOffset(active ? 1000 : 50);
        setPinActive(marker, active, color);
      } catch (e) {}
    });

    scheduleDeclutter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredVillageId, villages]);

  /** Mở đúng khung nhìn đang xem trên Google Maps để người dùng tự đối chiếu. */
  const openMapOnGoogle = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const center = map.getCenter();
    const zoom = Math.round(map.getZoom());
    const url = `https://www.google.com/maps/@${center.lat.toFixed(5)},${center.lng.toFixed(5)},${zoom}z`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative isolate z-10 w-full h-full min-h-[600px] rounded-3xl overflow-hidden shadow-inner border border-terracotta-200">
      {/* Khung bản đồ Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[600px]" />

      {/* Bộ chuyển đổi nền bản đồ (Góc dưới bên trái) */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-[#FAF5ED]/95 p-1 rounded-2xl border border-[#b89b78]/60 shadow-md pointer-events-auto">
        {(
          [
            { id: 'street', label: '🗺️ Bản đồ', title: 'OpenStreetMap — tên xã/phường theo đơn vị hành chính mới nhất sau sáp nhập 2025' },
            { id: 'satellite', label: '🛰️ Vệ tinh', title: 'Ảnh vệ tinh Esri — nhìn rõ làng nghề từ trên cao (không có nhãn địa giới)' },
          ] as { id: MapStyle; label: string; title: string }[]
        ).map((option) => (
          <button
            key={option.id}
            onClick={() => setMapStyle(option.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              mapStyle === option.id
                ? 'bg-[#33455E] text-white shadow-sm'
                : 'text-[#5A5348] hover:text-[#1E293B]'
            }`}
            title={option.title}
          >
            {option.label}
          </button>
        ))}

        <button
          onClick={openMapOnGoogle}
          className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#0F766E] hover:bg-emerald-50 transition-all"
          title="Mở đúng khung nhìn này trên Google Maps (không cần khoá API) để đối chiếu vị trí từng làng"
        >
          🌐 Đối chiếu Google Maps
        </button>
      </div>
    </div>
  );
}
