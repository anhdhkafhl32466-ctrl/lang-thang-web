'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CraftVillage } from '@/data/craftVillages';
import { GeoPoint, haversineMeters, LatLng, RouteResult, TransitPlan, TravelProfile } from './geo';
import { useGeolocation, UseGeolocationResult } from './useGeolocation';

export type PlannerVehicle = 'driving' | 'foot' | 'transit';

export interface PlannerEndpoint extends GeoPoint {
  /** Nếu điểm này là một làng nghề trong dữ liệu thì lưu slug để hiển thị thêm thông tin. */
  villageSlug?: string;
}

export interface RouteOverlay {
  geometry: LatLng[];
  origin: LatLng;
  destination: LatLng;
  originLabel?: string;
  destinationLabel?: string;
}

export interface UseRoutePlannerResult {
  geo: UseGeolocationResult;
  origin: PlannerEndpoint | null;
  destination: PlannerEndpoint | null;
  vehicle: PlannerVehicle;
  effectiveProfile: TravelProfile;
  route: RouteResult | null;
  routeError: string | null;
  computing: boolean;
  transit: TransitPlan | null;
  transitError: string | null;
  transitLoading: boolean;
  searchResults: GeoPoint[];
  searchLoading: boolean;
  searchError: string | null;
  routeOverlay: RouteOverlay | null;
  attribution: string | null;
  setVehicle: (vehicle: PlannerVehicle) => void;
  useMyLocationAsOrigin: () => void;
  useMyLocationAsDestination: () => void;
  setOriginFromVillage: (village: CraftVillage) => void;
  setDestinationFromVillage: (village: CraftVillage) => void;
  setOriginFromPlace: (place: GeoPoint) => void;
  setDestinationFromPlace: (place: GeoPoint) => void;
  swapEndpoints: () => void;
  clearOrigin: () => void;
  clearDestination: () => void;
  reset: () => void;
  search: (query: string) => void;
  clearSearch: () => void;
  /** Buộc tính lại lộ trình / tìm lại điểm dừng xe buýt (dùng khi lần gọi trước gặp lỗi mạng). */
  retry: () => void;
}

const ATTRIBUTION = 'Dữ liệu bản đồ © OpenStreetMap contributors';

function endpointFromVillage(village: CraftVillage): PlannerEndpoint {
  return {
    lat: village.location.coordinates[0],
    lng: village.location.coordinates[1],
    label: village.name,
    villageSlug: village.slug,
    source: 'village',
  };
}

/**
 * Quản lý toàn bộ luồng: GPS → chọn điểm đến → gọi dịch vụ định tuyến → hiển thị lộ trình.
 *
 * Lộ trình chỉ được tạo từ phản hồi THẬT của dịch vụ định tuyến. Khi dịch vụ lỗi,
 * hook trả về route = null kèm routeError để giao diện báo rõ nguyên nhân,
 * không vẽ đường thẳng thay thế và không nội suy khoảng cách/thời gian.
 */
export function useRoutePlanner(): UseRoutePlannerResult {
  const geo = useGeolocation();
  const [origin, setOrigin] = useState<PlannerEndpoint | null>(null);
  const [destination, setDestination] = useState<PlannerEndpoint | null>(null);
  const [vehicle, setVehicle] = useState<PlannerVehicle>('driving');
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [computing, setComputing] = useState(false);
  const [transit, setTransit] = useState<TransitPlan | null>(null);
  const [transitError, setTransitError] = useState<string | null>(null);
  const [transitLoading, setTransitLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<GeoPoint[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Ghi nhớ người dùng muốn gán vị trí GPS thật cho điểm nào, để khi watchPosition
  // cập nhật toạ độ mới thì điểm đó cũng được cập nhật theo.
  const gpsTargetRef = useRef<'origin' | 'destination' | null>(null);
  const lastGeocodeKeyRef = useRef<string | null>(null);

  const effectiveProfile: TravelProfile = vehicle === 'foot' ? 'foot' : 'driving';

  const useMyLocationAsOrigin = useCallback(() => {
    gpsTargetRef.current = 'origin';
    geo.locate({ watch: true });
  }, [geo]);

  const useMyLocationAsDestination = useCallback(() => {
    gpsTargetRef.current = 'destination';
    geo.locate({ watch: false });
  }, [geo]);

  const setOriginFromVillage = useCallback((village: CraftVillage) => {
    gpsTargetRef.current = null;
    setOrigin(endpointFromVillage(village));
  }, []);

  const setDestinationFromVillage = useCallback((village: CraftVillage) => {
    setDestination(endpointFromVillage(village));
  }, []);

  const setOriginFromPlace = useCallback((place: GeoPoint) => {
    gpsTargetRef.current = null;
    setOrigin({ ...place, label: place.label, source: place.source || 'place' });
  }, []);

  const setDestinationFromPlace = useCallback((place: GeoPoint) => {
    setDestination({ ...place, label: place.label, source: place.source || 'place' });
  }, []);

  const swapEndpoints = useCallback(() => {
    // Điểm xuất phát đổi thành điểm đến và ngược lại, giữ nguyên nhãn và toạ độ thật.
    gpsTargetRef.current = null;
    setOrigin(destination);
    setDestination(origin);
    setRoute(null);
  }, [origin, destination]);

  const clearOrigin = useCallback(() => {
    if (gpsTargetRef.current === 'origin') gpsTargetRef.current = null;
    setOrigin(null);
    setRoute(null);
    setRouteError(null);
  }, []);

  const clearDestination = useCallback(() => {
    setDestination(null);
    setRoute(null);
    setRouteError(null);
  }, []);

  const reset = useCallback(() => {
    gpsTargetRef.current = null;
    setOrigin(null);
    setDestination(null);
    setRoute(null);
    setRouteError(null);
    setTransit(null);
    setTransitError(null);
  }, []);

  // Vị trí GPS thật cập nhật vào điểm xuất phát (khi người dùng đã yêu cầu dùng GPS).
  useEffect(() => {
    const target = gpsTargetRef.current;
    if (!target || !geo.position) return;
    const next = geo.position;
    // Khi người dùng di chuyển đáng kể, bỏ nhãn địa chỉ cũ để tra lại địa chỉ mới.
    const merge = (prev: PlannerEndpoint | null): PlannerEndpoint => {
      const movedFar = !prev || haversineMeters(prev, next) > 60;
      return {
        ...next,
        label: movedFar ? undefined : prev?.label,
        villageSlug: undefined,
        source: 'gps',
      };
    };
    if (target === 'origin') setOrigin(merge);
    else setDestination(merge);
  }, [geo.position]);

  // Đổi toạ độ GPS thành địa chỉ thật (chỉ để hiển thị, không ảnh hưởng định tuyến).
  useEffect(() => {
    if (!origin || origin.source !== 'gps' || origin.label) return;
    const key = `${origin.lat.toFixed(5)},${origin.lng.toFixed(5)}`;
    if (lastGeocodeKeyRef.current === key) return;
    lastGeocodeKeyRef.current = key;

    const controller = new AbortController();
    fetch(
      `/api/geo/geocode?mode=reverse&lat=${origin.lat}&lon=${origin.lng}`,
      { signal: controller.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data?.ok || !data?.place?.label) return;
        setOrigin((prev) =>
          prev && prev.source === 'gps' ? { ...prev, label: data.place.label } : prev
        );
      })
      .catch(() => {
        /* Không lấy được địa chỉ thì vẫn giữ toạ độ GPS thật để hiển thị. */
      });

    return () => controller.abort();
  }, [origin]);

  // Tự động tính lại lộ trình mỗi khi đổi điểm xuất phát, điểm đến hoặc phương tiện.
  const routeKey = useMemo(() => {
    if (!origin || !destination || vehicle === 'transit') return null;
    return [
      origin.lat.toFixed(6),
      origin.lng.toFixed(6),
      destination.lat.toFixed(6),
      destination.lng.toFixed(6),
      effectiveProfile,
      reloadToken,
    ].join('|');
  }, [origin, destination, vehicle, effectiveProfile, reloadToken]);

  useEffect(() => {
    if (!routeKey || !origin || !destination) return;
    const controller = new AbortController();
    setComputing(true);
    setRouteError(null);

    const params = new URLSearchParams({
      fromLat: String(origin.lat),
      fromLon: String(origin.lng),
      toLat: String(destination.lat),
      toLon: String(destination.lng),
      profile: effectiveProfile,
    });
    if (origin.label) params.set('fromLabel', origin.label);
    if (destination.label) params.set('toLabel', destination.label);

    fetch(`/api/geo/directions?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(
            data?.error?.message || `Dịch vụ định tuyến trả về mã lỗi ${res.status}.`
          );
        }
        return data.route as RouteResult;
      })
      .then((result) => {
        setRoute(result);
        setRouteError(null);
      })
      .catch((error: any) => {
        if (error?.name === 'AbortError') return;
        setRoute(null);
        setRouteError(
          error?.message ||
            'Không thể tính được tuyến đường. Vui lòng kiểm tra kết nối mạng và thử lại.'
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setComputing(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeKey]);

  // Tìm điểm dừng xe buýt + tuyến buýt thật khi người dùng chọn phương tiện công cộng.
  const transitKey = useMemo(() => {
    if (!origin || !destination || vehicle !== 'transit') return null;
    return [
      origin.lat.toFixed(6),
      origin.lng.toFixed(6),
      destination.lat.toFixed(6),
      destination.lng.toFixed(6),
      reloadToken,
    ].join('|');
  }, [origin, destination, vehicle, reloadToken]);

  useEffect(() => {
    if (!transitKey || !origin || !destination) return;
    const controller = new AbortController();
    setTransitLoading(true);
    setTransitError(null);
    setTransit(null);

    const params = new URLSearchParams({
      fromLat: String(origin.lat),
      fromLon: String(origin.lng),
      toLat: String(destination.lat),
      toLon: String(destination.lng),
    });

    fetch(`/api/geo/transit?${params.toString()}`, { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(
            data?.error?.message || `Dịch vụ dữ liệu xe buýt trả về mã lỗi ${res.status}.`
          );
        }
        return data.plan as TransitPlan;
      })
      .then((plan) => {
        setTransit(plan);
        setTransitError(null);
      })
      .catch((error: any) => {
        if (error?.name === 'AbortError') return;
        setTransit(null);
        setTransitError(
          error?.message || 'Không lấy được dữ liệu điểm dừng xe buýt. Vui lòng thử lại.'
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setTransitLoading(false);
      });

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transitKey]);

  const search = useCallback((query: string) => {
    const text = query.trim();
    if (text.length < 3) {
      setSearchResults([]);
      setSearchError(null);
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    fetch(`/api/geo/geocode?mode=search&q=${encodeURIComponent(text)}&limit=6`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.ok) {
          throw new Error(data?.error?.message || 'Không tìm được địa điểm.');
        }
        return (data.places || []) as GeoPoint[];
      })
      .then((places) => {
        setSearchResults(places);
        setSearchError(places.length === 0 ? 'Không tìm thấy địa điểm phù hợp trong dữ liệu OpenStreetMap.' : null);
      })
      .catch((error: any) => {
        setSearchResults([]);
        setSearchError(error?.message || 'Không tìm được địa điểm.');
      })
      .finally(() => setSearchLoading(false));
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    setSearchLoading(false);
  }, []);

  const routeOverlay = useMemo<RouteOverlay | null>(() => {
    if (!route || !origin || !destination) return null;
    if (route.geometry.length < 2) return null;
    return {
      geometry: route.geometry,
      origin: { lat: origin.lat, lng: origin.lng },
      destination: { lat: destination.lat, lng: destination.lng },
      originLabel: origin.label,
      destinationLabel: destination.label,
    };
  }, [route, origin, destination]);

  return {
    geo,
    origin,
    destination,
    vehicle,
    effectiveProfile,
    route,
    routeError,
    computing,
    transit,
    transitError,
    transitLoading,
    searchResults,
    searchLoading,
    searchError,
    routeOverlay,
    attribution: ATTRIBUTION,
    setVehicle,
    useMyLocationAsOrigin,
    useMyLocationAsDestination,
    setOriginFromVillage,
    setDestinationFromVillage,
    setOriginFromPlace,
    setDestinationFromPlace,
    swapEndpoints,
    clearOrigin,
    clearDestination,
    reset,
    search,
    clearSearch,
    retry: () => setReloadToken((token) => token + 1),
  };
}
