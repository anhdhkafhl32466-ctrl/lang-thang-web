'use client';

/**
 * Chọn địa chỉ nhận hàng trên bản đồ.
 *
 * - Lấy GPS THẬT của thiết bị đang dùng (useGeolocation) khi người dùng bấm nút định vị.
 * - Tìm địa chỉ bằng dịch vụ geocoding của máy chủ (Nominatim/OpenStreetMap).
 * - Người dùng có thể kéo marker hoặc bấm lên bản đồ để tự chỉnh vị trí, rồi bấm "Xác nhận".
 *
 * Không có toạ độ mặc định: nếu chưa lấy được vị trí, bản đồ chỉ hiển thị kho xuất hàng và
 * yêu cầu người dùng tự chọn.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGeolocation } from '@/lib/useGeolocation';
import { formatCoords, formatDistance, formatDuration, LatLng } from '@/lib/geo';
import { Loader2, LocateFixed, MapPin, Search, AlertTriangle, CheckCircle2, X } from 'lucide-react';

export interface AddressSelection {
  text: string;
  lat: number;
  lng: number;
  source: 'gps' | 'search' | 'manual';
  placeId?: string | null;
}

interface WarehousePoint {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

interface AddressPickerMapProps {
  value: AddressSelection | null;
  onChange: (selection: AddressSelection) => void;
  warehouse: WarehousePoint | null;
  routeGeometry?: LatLng[] | null;
  routeSummary?: { distanceM: number | null; durationS: number | null } | null;
  /** Chế độ chỉ xem (trang theo dõi đơn hàng): không cho kéo/bấm chọn vị trí mới. */
  readOnly?: boolean;
}

interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

export default function AddressPickerMap({
  value,
  onChange,
  warehouse,
  routeGeometry,
  routeSummary,
  readOnly = false,
}: AddressPickerMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const warehouseMarkerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);

  const { position, status: gpsStatus, error: gpsError, locate } = useGeolocation();

  const [draft, setDraft] = useState<LatLng | null>(value ? { lat: value.lat, lng: value.lng } : null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState<string | null>(value?.text ?? null);
  const [notice, setNotice] = useState<string | null>(null);

  // Khởi tạo bản đồ một lần.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current || mapRef.current) return;
      leafletRef.current = L;

      if ((containerRef.current as any)._leaflet_id) {
        delete (containerRef.current as any)._leaflet_id;
      }

      const center = value ? [value.lat, value.lng] : warehouse ? [warehouse.lat, warehouse.lng] : [21.0285, 105.8542];
      const map = L.map(containerRef.current, { center: center as [number, number], zoom: 13, scrollWheelZoom: true });
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      if (warehouse) {
        warehouseMarkerRef.current = L.marker([warehouse.lat, warehouse.lng], { title: warehouse.name })
          .addTo(map)
          .bindPopup(
            `<div style="font-family:inherit;font-size:12px;"><strong>${warehouse.name}</strong><br>${warehouse.address}</div>`
          );
      }

      if (draft) {
        markerRef.current = L.marker([draft.lat, draft.lng], { draggable: !readOnly }).addTo(map);
        if (!readOnly) {
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLatLng();
            setDraft({ lat: pos.lat, lng: pos.lng });
            setResolvedLabel(null);
          });
        }
      }

      if (readOnly) return;

      map.on('click', (event: any) => {
        const point = { lat: event.latlng.lat, lng: event.latlng.lng };
        setDraft(point);
        setResolvedLabel(null);
        if (markerRef.current) markerRef.current.setLatLng([point.lat, point.lng]);
        else if (leafletRef.current) {
          markerRef.current = leafletRef.current.marker([point.lat, point.lng], { draggable: true }).addTo(map);
          markerRef.current.on('dragend', () => {
            const pos = markerRef.current.getLatLng();
            setDraft({ lat: pos.lat, lng: pos.lng });
            setResolvedLabel(null);
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
        warehouseMarkerRef.current = null;
        routeLayerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GPS thật -> đưa lên bản đồ và lấy địa chỉ văn bản từ dịch vụ geocoding.
  useEffect(() => {
    if (!position) return;
    setDraft({ lat: position.lat, lng: position.lng });
    applyMarker(position.lat, position.lng);
    void resolveAddress(position.lat, position.lng, 'gps');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  // Vẽ tuyến đường thật từ kho tới điểm nhận hàng (nếu có).
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (!routeGeometry || routeGeometry.length < 2) return;

    routeLayerRef.current = L.polyline(
      routeGeometry.map((point) => [point.lat, point.lng]),
      { color: '#b45309', weight: 5, opacity: 0.8 }
    ).addTo(map);
    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [30, 30] });
  }, [routeGeometry]);

  function applyMarker(lat: number, lng: number) {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = L.marker([lat, lng], { draggable: !readOnly }).addTo(map);
      if (!readOnly) {
        markerRef.current.on('dragend', () => {
          const pos = markerRef.current.getLatLng();
          setDraft({ lat: pos.lat, lng: pos.lng });
          setResolvedLabel(null);
        });
      }
    }
    map.setView([lat, lng], Math.max(map.getZoom(), 15));
  }

  async function resolveAddress(lat: number, lng: number, source: 'gps' | 'search' | 'manual') {
    setResolving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/geo/geocode?mode=reverse&lat=${lat}&lon=${lng}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setNotice(data?.error?.message || 'Không tra được địa chỉ cho toạ độ này.');
        return;
      }
      const label = data.place?.label || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setResolvedLabel(label);
      onChange({ text: label, lat, lng, source, placeId: null });
      setNotice(null);
    } catch {
      setNotice('Không kết nối được tới dịch vụ tra cứu địa chỉ.');
    } finally {
      setResolving(false);
    }
  }

  // Tìm kiếm địa chỉ (debounce) qua API geocoding của máy chủ.
  useEffect(() => {
    const text = query.trim();
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/geo/geocode?mode=search&q=${encodeURIComponent(text)}&limit=6`, {
          cache: 'no-store',
        });
        const data = await res.json();
        if (res.ok && data.ok) {
          setSuggestions(
            (data.places || []).map((place: any) => ({
              label: place.label || place.name || `${place.lat}, ${place.lng}`,
              lat: Number(place.lat),
              lng: Number(place.lng),
            }))
          );
        }
      } catch {
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  function pickSuggestion(suggestion: Suggestion) {
    setSuggestions([]);
    setQuery(suggestion.label);
    setDraft({ lat: suggestion.lat, lng: suggestion.lng });
    setResolvedLabel(suggestion.label);
    applyMarker(suggestion.lat, suggestion.lng);
    onChange({ text: suggestion.label, lat: suggestion.lat, lng: suggestion.lng, source: 'search' });
  }

  const gpsHint = useMemo(() => {
    if (gpsError) return { tone: 'error' as const, text: `${gpsError.message} ${gpsError.hint}` };
    if (gpsStatus === 'locating') return { tone: 'info' as const, text: 'Đang lấy vị trí GPS thật từ thiết bị...' };
    if (position) {
      return {
        tone: 'ok' as const,
        text: `Đã lấy vị trí GPS thật: ${formatCoords(position)}${
          position.accuracy ? ` (±${Math.round(position.accuracy)} m)` : ''
        }`,
      };
    }
    return null;
  }, [gpsError, gpsStatus, position]);

  return (
    <div className="space-y-3">
      {!readOnly && (
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => locate({ highAccuracy: true })}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow"
        >
          {gpsStatus === 'locating' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
          <span>Lấy vị trí GPS của tôi</span>
        </button>

        {draft && (
          <button
            type="button"
            onClick={() => resolveAddress(draft.lat, draft.lng, value?.source === 'gps' ? 'gps' : 'manual')}
            disabled={resolving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-terracotta-300 paper-panel hover:bg-dopaper-50 text-lacquer-900 text-xs font-bold disabled:opacity-60"
          >
            {resolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            <span>Xác nhận điểm đã chọn</span>
          </button>
        )}
      </div>
      )}

      {!readOnly && gpsHint && (
        <p
          className={`text-[11px] leading-relaxed ${
            gpsHint.tone === 'error'
              ? 'text-rose-700'
              : gpsHint.tone === 'ok'
              ? 'text-emerald-700'
              : 'text-lacquer-800/70'
          }`}
        >
          {gpsHint.text}
        </p>
      )}

      {!readOnly && (
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm số nhà, đường, phường/xã... (hoặc bấm trực tiếp lên bản đồ)"
          className="w-full paper-panel border border-terracotta-200 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500"
        />
        {searching && <Loader2 className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-terracotta-500" />}

        {suggestions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full paper-panel border border-terracotta-200 rounded-xl shadow-xl max-h-56 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.lat}-${suggestion.lng}-${index}`}
                type="button"
                onClick={() => pickSuggestion(suggestion)}
                className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-terracotta-50 border-b border-terracotta-100 last:border-0 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-terracotta-500 mt-0.5 shrink-0" />
                <span className="text-lacquer-900">{suggestion.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      )}

      <div ref={containerRef} className="h-[300px] sm:h-[360px] w-full rounded-2xl border border-terracotta-200 overflow-hidden z-0" />

      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-lacquer-800/70">
        <span>
          🔶 điểm vàng: {warehouse ? warehouse.name : 'kho xuất hàng'} · 📍 điểm đỏ: địa chỉ nhận hàng do bạn chọn
        </span>
        {routeSummary && routeSummary.distanceM != null && (
          <span className="font-semibold text-terracotta-700">
            Tuyến từ kho: {formatDistance(routeSummary.distanceM)}
            {routeSummary.durationS != null ? ` · ${formatDuration(routeSummary.durationS)}` : ''}
          </span>
        )}
      </div>

      {!readOnly && (
      <div
        className={`rounded-xl border p-3 text-xs ${
          value
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : 'border-amber-200 bg-amber-50 text-amber-900'
        }`}
      >
        {value ? (
          <div className="space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Địa chỉ nhận hàng đã xác nhận</span>
            </span>
            <p>{value.text}</p>
            <p className="font-mono text-[11px]">
              {formatCoords({ lat: value.lat, lng: value.lng })} · nguồn: {value.source}
            </p>
          </div>
        ) : (
          <span className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Bạn cần chọn và xác nhận địa chỉ nhận hàng trước khi đặt.</span>
          </span>
        )}
      </div>
      )}

      {!readOnly && notice && (
        <p className="text-[11px] text-rose-700 flex items-start gap-1.5">
          <X className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{notice}</span>
        </p>
      )}
    </div>
  );
}
