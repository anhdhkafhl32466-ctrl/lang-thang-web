'use client';

import React, { useEffect, useRef } from 'react';
import { CraftVillage } from '@/data/craftVillages';
import { VILLAGE_BOUNDARIES } from '@/data/villageBoundaries';

interface VillageBoundaryMapProps {
  villages: CraftVillage[];
  hoveredVillageId?: string | null;
  onHoverVillage?: (village: CraftVillage | null) => void;
  onSelectVillage?: (village: CraftVillage) => void;
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

  // Use refs for callbacks so changing them NEVER triggers re-initialization
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

      // If already initialized on this DOM container, do not re-create
      if (mapInstanceRef.current) return;

      // Clean up any stale leaflet ID on container
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [20.95, 105.78],
        zoom: 10,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      // Create a layer group to hold all polygons & markers
      const layersGroup = L.layerGroup().addTo(map);
      layersGroupRef.current = layersGroup;
      mapInstanceRef.current = map;

      // Render initial layers
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

        const defaultStyle = {
          color: boundaryInfo.color,
          weight: 2,
          opacity: 0.85,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.2,
          dashArray: '4, 4'
        };

        const highlightStyle = {
          color: boundaryInfo.color,
          weight: 4,
          opacity: 1,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.45,
          dashArray: ''
        };

        const polygon = L.polygon(boundaryInfo.boundary, defaultStyle);
        polygon.addTo(layersGroup);

        boundaryInfo.boundary.forEach((pt) => allPoints.push(pt));

        // Hover events
        polygon.on('mouseover', () => {
          try {
            polygon.setStyle(highlightStyle);
            polygon.bringToFront();
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        polygon.on('mouseout', () => {
          try {
            polygon.setStyle(defaultStyle);
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        polygon.on('click', () => {
          onSelectRef.current?.(village);
        });

        polygonsRef.current[village.slug] = polygon;

        // Custom center pin
        const getEmoji = () => {
          switch (village.categorySlug) {
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

        const pinIcon = L.divIcon({
          className: 'custom-boundary-pin',
          html: `
            <div style="
              background: ${boundaryInfo.color};
              color: white;
              padding: 4px 8px;
              border-radius: 99px;
              display: flex;
              align-items: center;
              gap: 4px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.25);
              border: 2px solid white;
              font-family: inherit;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <span style="font-size: 13px;">${getEmoji()}</span>
              <span>${village.name}</span>
            </div>
          `,
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        });

        const marker = L.marker(village.location.coordinates, { icon: pinIcon });
        marker.addTo(layersGroup);

        marker.on('mouseover', () => {
          try {
            polygon.setStyle(highlightStyle);
            polygon.bringToFront();
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            polygon.setStyle(defaultStyle);
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
          map.fitBounds(bounds, { padding: [35, 35] });
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
        } catch (e) {
          // ignore cleanup errors during unmount
        }
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run ONCE on mount!

  // 2. Update layers when villages array changes (without destroying the map!)
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

        const defaultStyle = {
          color: boundaryInfo.color,
          weight: 2,
          opacity: 0.85,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.2,
          dashArray: '4, 4'
        };

        const highlightStyle = {
          color: boundaryInfo.color,
          weight: 4,
          opacity: 1,
          fillColor: boundaryInfo.fillColor,
          fillOpacity: 0.45,
          dashArray: ''
        };

        const polygon = L.polygon(boundaryInfo.boundary, defaultStyle);
        polygon.addTo(layersGroup);

        boundaryInfo.boundary.forEach((pt) => allPoints.push(pt));

        polygon.on('mouseover', () => {
          try {
            polygon.setStyle(highlightStyle);
            polygon.bringToFront();
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        polygon.on('mouseout', () => {
          try {
            polygon.setStyle(defaultStyle);
          } catch (e) {}
          onHoverRef.current?.(null);
        });

        polygon.on('click', () => {
          onSelectRef.current?.(village);
        });

        polygonsRef.current[village.slug] = polygon;

        const getEmoji = () => {
          switch (village.categorySlug) {
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

        const pinIcon = L.divIcon({
          className: 'custom-boundary-pin',
          html: `
            <div style="
              background: ${boundaryInfo.color};
              color: white;
              padding: 4px 8px;
              border-radius: 99px;
              display: flex;
              align-items: center;
              gap: 4px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.25);
              border: 2px solid white;
              font-family: inherit;
              font-size: 11px;
              font-weight: bold;
              white-space: nowrap;
              cursor: pointer;
              transform: translate(-50%, -50%);
            ">
              <span style="font-size: 13px;">${getEmoji()}</span>
              <span>${village.name}</span>
            </div>
          `,
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        });

        const marker = L.marker(village.location.coordinates, { icon: pinIcon });
        marker.addTo(layersGroup);

        marker.on('mouseover', () => {
          try {
            polygon.setStyle(highlightStyle);
            polygon.bringToFront();
          } catch (e) {}
          onHoverRef.current?.(village);
        });

        marker.on('mouseout', () => {
          try {
            polygon.setStyle(defaultStyle);
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

  // 3. React to programmatic hover from outside (lightweight style toggle only)
  useEffect(() => {
    if (!polygonsRef.current) return;

    Object.keys(polygonsRef.current).forEach((slug) => {
      const poly = polygonsRef.current[slug];
      const boundaryInfo = VILLAGE_BOUNDARIES[slug];
      if (!poly || !boundaryInfo) return;

      if (hoveredVillageId === slug) {
        try {
          poly.setStyle({
            color: boundaryInfo.color,
            weight: 4,
            opacity: 1,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: 0.5,
            dashArray: ''
          });
          poly.bringToFront();
        } catch (e) {}
      } else {
        try {
          poly.setStyle({
            color: boundaryInfo.color,
            weight: 2,
            opacity: 0.85,
            fillColor: boundaryInfo.fillColor,
            fillOpacity: 0.2,
            dashArray: '4, 4'
          });
        } catch (e) {}
      }
    });
  }, [hoveredVillageId]);

  return (
    <div className="relative w-full h-full min-h-[620px] rounded-3xl overflow-hidden shadow-inner border border-terracotta-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[620px]" />
    </div>
  );
}
