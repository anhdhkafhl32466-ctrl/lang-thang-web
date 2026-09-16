'use client';

import React, { useEffect, useRef } from 'react';
import Link from 'next/link';
import { CraftVillage } from '@/data/craftVillages';

interface CraftMapLeafletProps {
  villages: CraftVillage[];
  selectedVillageId?: string | null;
  onSelectVillage?: (village: CraftVillage) => void;
}

export default function CraftMapLeaflet({
  villages,
  selectedVillageId,
  onSelectVillage
}: CraftMapLeafletProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const layersGroupRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

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

      // Hanoi center coordinates: [21.0285, 105.8542]
      const map = L.map(mapContainerRef.current, {
        center: [20.985, 105.82],
        zoom: 11,
        zoomControl: true,
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

      renderMarkers(L, map, layersGroup);
    }

    function renderMarkers(L: any, map: any, layersGroup: any) {
      if (!isMounted) return;
      layersGroup.clearLayers();
      markersRef.current = {};

      villages.forEach((v) => {
        const getEmoji = () => {
          switch (v.categorySlug) {
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

        const customIcon = L.divIcon({
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
              <span style="transform: rotate(45deg); font-size: 16px;">${getEmoji()}</span>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38]
        });

        const marker = L.marker(v.location.coordinates, { icon: customIcon });
        marker.addTo(layersGroup);

        const popupContent = `
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
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 6px;">
                <span style="font-size: 11px; color: #C85A32; font-weight: bold;">
                  ${v.location.district}
                </span>
                <a href="/lang-nghe/${v.slug}" style="background: #C85A32; color: white; text-decoration: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">
                  Khám phá →
                </a>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280, className: 'custom-leaflet-popup' });

        marker.on('click', () => {
          onSelectRef.current?.(v);
        });

        markersRef.current[v.id] = marker;
      });
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

  // 2. Update markers when villages change
  useEffect(() => {
    if (!mapInstanceRef.current || !layersGroupRef.current) return;

    let isMounted = true;
    import('leaflet').then((L) => {
      if (!isMounted || !layersGroupRef.current) return;
      const layersGroup = layersGroupRef.current;
      layersGroup.clearLayers();
      markersRef.current = {};

      villages.forEach((v) => {
        const getEmoji = () => {
          switch (v.categorySlug) {
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

        const customIcon = L.divIcon({
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
              <span style="transform: rotate(45deg); font-size: 16px;">${getEmoji()}</span>
            </div>
          `,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -38]
        });

        const marker = L.marker(v.location.coordinates, { icon: customIcon });
        marker.addTo(layersGroup);

        const popupContent = `
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
              <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E2E8F0; padding-top: 6px;">
                <span style="font-size: 11px; color: #C85A32; font-weight: bold;">
                  ${v.location.district}
                </span>
                <a href="/lang-nghe/${v.slug}" style="background: #C85A32; color: white; text-decoration: none; padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: bold;">
                  Khám phá →
                </a>
              </div>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, { maxWidth: 280, className: 'custom-leaflet-popup' });

        marker.on('click', () => {
          onSelectRef.current?.(v);
        });

        markersRef.current[v.id] = marker;
      });
    });

    return () => {
      isMounted = false;
    };
  }, [villages]);

  // 3. Highlight selected marker
  useEffect(() => {
    if (!selectedVillageId || !mapInstanceRef.current) return;
    const targetMarker = markersRef.current[selectedVillageId];
    if (targetMarker) {
      try {
        targetMarker.openPopup();
        mapInstanceRef.current.setView(targetMarker.getLatLng(), 13, { animate: true });
      } catch (e) {}
    }
  }, [selectedVillageId]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden shadow-inner border border-terracotta-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px]" />
    </div>
  );
}
