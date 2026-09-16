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

function setPinActive(marker: any, active: boolean) {
  if (!marker) return;
  const el: HTMLElement | null = marker.getElement ? marker.getElement() : (marker as any)._icon;
  if (!el) return;

  const avatar = el.querySelector('.pin-avatar') as HTMLElement | null;

  if (active) {
    if (avatar) {
      avatar.style.transform = 'scale(1.3)';
      avatar.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45)';
      avatar.style.zIndex = '9999';
    }
  } else {
    if (avatar) {
      avatar.style.transform = 'none';
      avatar.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.22)';
      avatar.style.zIndex = '1';
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

      // Standard OpenStreetMap tiles: 100% free, NO API KEY required, NO watermarks!
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
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

        // Clean subtle polygon style: hidden by default or ultra-subtle
        const defaultPolyStyle = {
          color: boundaryInfo.color,
          weight: showBoundariesRef.current ? 1.5 : 1,
          opacity: showBoundariesRef.current ? 0.5 : 0,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: showBoundariesRef.current ? 0.1 : 0,
          dashArray: ''
        };

        const highlightPolyStyle = {
          color: boundaryInfo.color,
          weight: 3.5,
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
            if (m) {
              setPinActive(m, true);
              m.openTooltip();
            }
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        polygon.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            const m = markersRef.current[village.slug];
            if (m) {
              setPinActive(m, false);
              m.closeTooltip();
            }
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        polygon.on('click', () => {
          onSelectRef.current?.(village);
        });

        polygonsRef.current[village.slug] = polygon;

        // Clean, compact circular pin without permanent overlapping text labels
        const emoji = getEmojiForCategory(village.categorySlug);

        const pinIcon = L.divIcon({
          className: 'clean-village-marker',
          html: `
            <div class="village-pin-wrapper" id="pin-${village.slug}" style="
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <div class="pin-avatar" style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${boundaryInfo.color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
                border: 2.5px solid white;
                font-size: 17px;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
              ">
                ${emoji}
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker: any = L.marker(village.location.coordinates, { icon: pinIcon });
        marker.addTo(layersGroup);

        // Rich tooltip on hover only — zero visual clutter in default state
        marker.bindTooltip(`
          <div style="font-family: inherit; padding: 3px 6px; font-weight: 700; font-size: 12px; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
            <span style="font-size: 14px;">${emoji}</span>
            <span style="color: #1E293B;">${village.name}</span>
            <span style="color: #64748B; font-weight: 500; font-size: 11px;">(${village.location.district})</span>
          </div>
        `, {
          direction: 'top',
          offset: [0, -18],
          opacity: 0.98,
          className: 'custom-clean-tooltip'
        });

        marker.on('mouseover', () => {
          try {
            polygon.setStyle(highlightPolyStyle);
            polygon.bringToFront();
            setPinActive(marker, true);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            setPinActive(marker, false);
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
          opacity: showBoundaries ? 0.5 : 0,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: showBoundaries ? 0.1 : 0,
          dashArray: ''
        };

        const highlightPolyStyle = {
          color: boundaryInfo.color,
          weight: 3.5,
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
            if (m) {
              setPinActive(m, true);
              m.openTooltip();
            }
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        polygon.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            const m = markersRef.current[village.slug];
            if (m) {
              setPinActive(m, false);
              m.closeTooltip();
            }
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        polygon.on('click', () => {
          onSelectRef.current?.(village);
        });

        polygonsRef.current[village.slug] = polygon;

        const emoji = getEmojiForCategory(village.categorySlug);

        const pinIcon = L.divIcon({
          className: 'clean-village-marker',
          html: `
            <div class="village-pin-wrapper" id="pin-${village.slug}" style="
              width: 36px;
              height: 36px;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <div class="pin-avatar" style="
                width: 36px;
                height: 36px;
                border-radius: 50%;
                background: ${boundaryInfo.color};
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
                border: 2.5px solid white;
                font-size: 17px;
                transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
              ">
                ${emoji}
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        const marker: any = L.marker(village.location.coordinates, { icon: pinIcon });
        marker.addTo(layersGroup);

        marker.bindTooltip(`
          <div style="font-family: inherit; padding: 3px 6px; font-weight: 700; font-size: 12px; display: flex; align-items: center; gap: 6px; white-space: nowrap;">
            <span style="font-size: 14px;">${emoji}</span>
            <span style="color: #1E293B;">${village.name}</span>
            <span style="color: #64748B; font-weight: 500; font-size: 11px;">(${village.location.district})</span>
          </div>
        `, {
          direction: 'top',
          offset: [0, -18],
          opacity: 0.98,
          className: 'custom-clean-tooltip'
        });

        marker.on('mouseover', () => {
          try {
            polygon.setStyle(highlightPolyStyle);
            polygon.bringToFront();
            setPinActive(marker, true);
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            polygon.setStyle(defaultPolyStyle);
            setPinActive(marker, false);
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
            weight: 3.5,
            opacity: 1,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: 0.35,
            dashArray: ''
          });
          poly.bringToFront();
          if (marker) {
            setPinActive(marker, true);
            marker.openTooltip();
          }
        } catch (e) {}
      } else {
        try {
          poly.setStyle({
            color: boundaryInfo.color,
            weight: showBoundaries ? 1.5 : 1,
            opacity: showBoundaries ? 0.5 : 0,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: showBoundaries ? 0.1 : 0,
            dashArray: ''
          });
          if (marker) {
            setPinActive(marker, false);
            marker.closeTooltip();
          }
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
