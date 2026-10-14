/**
 * Tầng kết nối dịch vụ bản đồ/định tuyến – CHỈ chạy phía server (Next.js Route Handlers).
 *
 * Dịch vụ đang dùng (đều dựa trên dữ liệu OpenStreetMap, không cần API key):
 *  - Định tuyến đường bộ + hướng dẫn từng chặng : OSRM (FOSSGIS, dự phòng OSRM demo)
 *  - Định tuyến đi bộ                            : OSRM profile foot
 *  - Geocoding / reverse geocoding               : Nominatim
 *  - Điểm dừng xe buýt & tuyến buýt              : Overpass API
 *
 * Mọi URL đều có thể ghi đè bằng biến môi trường (xem .env.example) để chuyển sang
 * hạ tầng tự vận hành (self-hosted) mà không phải sửa mã nguồn.
 */

import {
  buildInstruction,
  BusLine,
  BusStop,
  GeoPoint,
  haversineMeters,
  isValidLatLng,
  LatLng,
  RouteResult,
  RouteStep,
  toRouteStep,
  TravelProfile,
} from './geo';

const DEFAULT_USER_AGENT =
  process.env.GEO_USER_AGENT ||
  'LangThangCraftVillages/1.0 (ung dung ban do lang nghe Ha Noi; lien he: chua cau hinh)';

export const GEO_PROVIDERS = {
  car: process.env.OSRM_CAR_URL || 'https://routing.openstreetmap.de/routed-car',
  foot: process.env.OSRM_FOOT_URL || 'https://routing.openstreetmap.de/routed-foot',
  bike: process.env.OSRM_BIKE_URL || 'https://routing.openstreetmap.de/routed-bike',
  fallbackCar: process.env.OSRM_FALLBACK_URL || 'https://router.project-osrm.org',
  nominatim: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
  overpass: process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter',
};

/**
 * Khoảng cách tối đa cho phép giữa toạ độ người dùng gửi và điểm giao thông gần nhất
 * mà dịch vụ định tuyến “bám” vào. Vượt ngưỡng này nghĩa là toạ độ nằm xa mọi con
 * đường trong dữ liệu (ví dụ giữa biển) — phải báo lỗi chứ không trả về tuyến đường vô nghĩa.
 */
const MAX_SNAP_DISTANCE_METERS = 3000;

const CAR_PROVIDER_LABEL = 'OSRM · FOSSGIS (dữ liệu OpenStreetMap)';
const FOOT_PROVIDER_LABEL = 'OSRM đi bộ · FOSSGIS (dữ liệu OpenStreetMap)';
const FALLBACK_PROVIDER_LABEL = 'OSRM demo (dữ liệu OpenStreetMap)';

export type GeoErrorKind =
  | 'bad-input'
  | 'network'
  | 'provider'
  | 'no-route'
  | 'unsupported';

export class GeoServiceError extends Error {
  kind: GeoErrorKind;
  upstreamStatus?: number;

  constructor(message: string, kind: GeoErrorKind, upstreamStatus?: number) {
    super(message);
    this.name = 'GeoServiceError';
    this.kind = kind;
    this.upstreamStatus = upstreamStatus;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

interface FetchOptions {
  timeoutMs?: number;
  method?: 'GET' | 'POST';
  body?: string;
  retries?: number;
  accept?: string;
}

async function fetchJson(url: string, options: FetchOptions = {}): Promise<any> {
  const { timeoutMs = 15000, method = 'GET', body, retries = 1, accept = 'application/json' } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, {
        method,
        body,
        signal: controller.signal,
        cache: 'no-store',
        headers: {
          'User-Agent': DEFAULT_USER_AGENT,
          Accept: accept,
          ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}),
        },
      });
      clearTimeout(timer);

      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500;
        const error = new GeoServiceError(
          `Dịch vụ bản đồ phản hồi mã lỗi ${response.status}.`,
          'provider',
          response.status
        );
        if (retryable && attempt < retries) {
          lastError = error;
          await sleep(600 * (attempt + 1));
          continue;
        }
        throw error;
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timer);
      const aborted = error?.name === 'AbortError';
      lastError = aborted
        ? new GeoServiceError(
            `Dịch vụ bản đồ không phản hồi trong ${Math.round(timeoutMs / 1000)} giây.`,
            'network'
          )
        : error instanceof GeoServiceError
          ? error
          : new GeoServiceError('Không kết nối được tới dịch vụ bản đồ.', 'network');

      if (attempt < retries) {
        await sleep(600 * (attempt + 1));
        continue;
      }
      throw lastError;
    }
  }

  throw lastError instanceof GeoServiceError
    ? lastError
    : new GeoServiceError('Không kết nối được tới dịch vụ bản đồ.', 'network');
}

const OSRM_CODE_MESSAGES: Record<string, string> = {
  NoRoute: 'Không tìm được tuyến đường bộ thực tế giữa hai điểm này.',
  NoSegment: 'Không có đường bộ nào gần điểm xuất phát hoặc điểm đến trong dữ liệu bản đồ.',
  InvalidValue: 'Toạ độ gửi tới dịch vụ định tuyến không hợp lệ.',
  InvalidQuery: 'Yêu cầu định tuyến không hợp lệ.',
  TooBig: 'Tuyến đường quá dài để dịch vụ định tuyến xử lý.',
};

function providerFor(profile: TravelProfile): { base: string; label: string; fallback?: string; fallbackLabel?: string } {
  if (profile === 'foot') return { base: GEO_PROVIDERS.foot, label: FOOT_PROVIDER_LABEL };
  if (profile === 'bike') return { base: GEO_PROVIDERS.bike, label: FOOT_PROVIDER_LABEL.replace('đi bộ', 'xe đạp') };
  return {
    base: GEO_PROVIDERS.car,
    label: CAR_PROVIDER_LABEL,
    fallback: GEO_PROVIDERS.fallbackCar,
    fallbackLabel: FALLBACK_PROVIDER_LABEL,
  };
}

async function requestRoute(
  base: string,
  label: string,
  from: LatLng,
  to: LatLng,
  profile: TravelProfile
): Promise<RouteResult> {
  // OSRM yêu cầu toạ độ theo thứ tự longitude,latitude.
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url =
    `${base}/route/v1/${profile}/${coords}` +
    `?overview=full&geometries=geojson&steps=true&alternatives=false&annotations=false`;

  const data = await fetchJson(url, { timeoutMs: 15000 });
  const code = String(data?.code ?? '');
  if (code !== 'Ok') {
    throw new GeoServiceError(
      OSRM_CODE_MESSAGES[code] || `Dịch vụ định tuyến không trả về tuyến đường (mã ${code || 'không xác định'}).`,
      'no-route'
    );
  }

  const route = data?.routes?.[0];
  if (!route) {
    throw new GeoServiceError('Dịch vụ định tuyến trả về dữ liệu rỗng.', 'no-route');
  }

  // Kiểm tra dịch vụ có “bám” đúng vào hai toạ độ yêu cầu hay không.
  // OSRM trả về "waypoints" kèm khoảng cách từ toạ độ gốc tới điểm đường bộ gần nhất.
  const waypoints: any[] = Array.isArray(data?.waypoints) ? data.waypoints : [];
  const snapDistances = waypoints.map((w) => Number(w?.distance));
  const tooFarIndexes = snapDistances
    .map((distance, index) => ({ distance, index }))
    .filter((item) => Number.isFinite(item.distance) && item.distance > MAX_SNAP_DISTANCE_METERS);

  if (tooFarIndexes.length > 0) {
    const labelsForMessage = tooFarIndexes
      .map((item) => (item.index === 0 ? 'điểm xuất phát' : 'điểm đến'))
      .join(' và ');
    const farthest = Math.max(...tooFarIndexes.map((item) => item.distance));
    throw new GeoServiceError(
      `Không có đường bộ nào đủ gần ${labelsForMessage} trong dữ liệu bản đồ ` +
        `(điểm đường gần nhất cách khoảng ${Math.round(farthest / 1000)} km). ` +
        'Vui lòng kiểm tra lại toạ độ hoặc chọn địa điểm khác.',
      'no-route'
    );
  }

  const rawCoordinates: any[] = route?.geometry?.coordinates ?? [];
  const geometry: LatLng[] = rawCoordinates
    .filter((c) => Array.isArray(c) && c.length >= 2)
    .map((c) => ({ lat: Number(c[1]), lng: Number(c[0]) }))
    .filter(isValidLatLng);

  const rawSteps: any[] = route?.legs?.[0]?.steps ?? [];
  const steps: RouteStep[] = rawSteps.map((raw, index) =>
    toRouteStep(raw, { isFirst: index === 0, isLast: index === rawSteps.length - 1 })
  );

  return {
    profile,
    distance: Number(route.distance ?? 0),
    duration: Number(route.duration ?? 0),
    geometry,
    steps,
    provider: label,
  };
}

/** Tính tuyến đường theo mạng lưới đường bộ thực tế (OSRM). Không nội suy, không vẽ đường thẳng. */
export async function getRoute(
  from: LatLng,
  to: LatLng,
  profile: TravelProfile = 'driving',
  labels: { originLabel?: string; destinationLabel?: string } = {}
): Promise<RouteResult> {
  if (!isValidLatLng(from) || !isValidLatLng(to)) {
    throw new GeoServiceError('Toạ độ điểm xuất phát hoặc điểm đến không hợp lệ.', 'bad-input');
  }

  const { base, label, fallback, fallbackLabel } = providerFor(profile);

  let result: RouteResult;
  try {
    result = await requestRoute(base, label, from, to, profile);
  } catch (error) {
    const canFallback =
      fallback && (error as GeoServiceError)?.kind !== 'no-route' && (error as GeoServiceError)?.kind !== 'bad-input';
    if (!canFallback) throw error;
    result = await requestRoute(fallback as string, fallbackLabel as string, from, to, profile);
  }

  // Gắn nhãn điểm đầu/cuối (tên làng nghề hoặc địa chỉ) để câu hướng dẫn chặng cuối rõ ràng.
  if (labels.originLabel || labels.destinationLabel) {
    result.originLabel = labels.originLabel;
    result.destinationLabel = labels.destinationLabel;
    const lastIndex = result.steps.length - 1;
    if (lastIndex >= 0 && result.steps[lastIndex].maneuver === 'arrive') {
      result.steps[lastIndex] = {
        ...result.steps[lastIndex],
        instruction: buildInstruction(
          { ...result.steps[lastIndex], maneuver: 'arrive' },
          { destinationLabel: labels.destinationLabel }
        ),
      };
    }
    const first = result.steps[0];
    if (first && labels.originLabel) {
      result.steps[0] = {
        ...first,
        instruction: `${first.instruction} (từ ${labels.originLabel})`,
      };
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Nominatim: geocoding. Chính sách của Nominatim giới hạn 1 request/giây,
// nên mọi truy vấn ở đây được xếp hàng tuần tự và cache lại trong bộ nhớ.
// ---------------------------------------------------------------------------

let nominatimQueue: Promise<unknown> = Promise.resolve();
let lastNominatimCall = 0;

const geocodeCache = new Map<string, { at: number; value: any }>();
const GEOCODE_TTL_MS = 10 * 60 * 1000;

function cacheGet(key: string): any | undefined {
  const hit = geocodeCache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > GEOCODE_TTL_MS) {
    geocodeCache.delete(key);
    return undefined;
  }
  return hit.value;
}

function cacheSet(key: string, value: any) {
  if (geocodeCache.size > 300) geocodeCache.clear();
  geocodeCache.set(key, { at: Date.now(), value });
}

function scheduleNominatim<T>(task: () => Promise<T>): Promise<T> {
  const run = nominatimQueue.then(async () => {
    const wait = Math.max(0, 1100 - (Date.now() - lastNominatimCall));
    if (wait > 0) await sleep(wait);
    try {
      return await task();
    } finally {
      lastNominatimCall = Date.now();
    }
  });
  // Giữ hàng đợi không bị vỡ khi một tác vụ lỗi.
  nominatimQueue = run.catch(() => undefined);
  return run as Promise<T>;
}

function buildAddressLabel(address: Record<string, string> | undefined, fallbackName: string): string {
  if (!address) return fallbackName;
  const parts = [
    address.house_number && address.road ? `${address.house_number} ${address.road}` : address.road,
    address.hamlet,
    address.village || address.suburb || address.quarter,
    address.town || address.city_district || address.city || address.county,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : fallbackName;
}

/** Đổi toạ độ GPS thành địa chỉ thật gần nhất (Nominatim reverse). */
export async function reverseGeocode(point: LatLng): Promise<GeoPoint> {
  if (!isValidLatLng(point)) {
    throw new GeoServiceError('Toạ độ GPS không hợp lệ.', 'bad-input');
  }
  const key = `rev:${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url =
    `${GEO_PROVIDERS.nominatim}/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}` +
    `&zoom=18&addressdetails=1&accept-language=vi`;
  const data = await scheduleNominatim(() => fetchJson(url, { timeoutMs: 12000 }));

  const result: GeoPoint = {
    lat: point.lat,
    lng: point.lng,
    accuracy: undefined,
    label: buildAddressLabel(data?.address, String(data?.display_name ?? '')).trim() || undefined,
    source: 'gps',
  };
  cacheSet(key, result);
  return result;
}

/** Tìm địa điểm theo từ khoá do người dùng nhập (Nominatim search, ưu tiên khu vực Hà Nội). */
export async function searchPlaces(query: string, limit = 6): Promise<GeoPoint[]> {
  const text = query.trim();
  if (text.length < 3) {
    throw new GeoServiceError('Vui lòng nhập ít nhất 3 ký tự để tìm địa điểm.', 'bad-input');
  }
  const key = `search:${text.toLowerCase()}:${limit}`;
  const cached = cacheGet(key);
  if (cached) return cached;

  const url =
    `${GEO_PROVIDERS.nominatim}/search?format=jsonv2&q=${encodeURIComponent(text)}` +
    `&limit=${limit}&addressdetails=1&accept-language=vi&countrycodes=vn` +
    // Khung nhìn bao quanh Hà Nội để ưu tiên kết quả địa phương (không giới hạn cứng).
    `&viewbox=105.20,21.40,106.10,20.55&bounded=0`;

  const data = await scheduleNominatim(() => fetchJson(url, { timeoutMs: 12000 }));
  const results: GeoPoint[] = (Array.isArray(data) ? data : [])
    .map((item: any) => {
      const lat = Number(item?.lat);
      const lng = Number(item?.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      const name = String(item?.name ?? '').trim();
      const label = buildAddressLabel(item?.address, String(item?.display_name ?? ''));
      return {
        lat,
        lng,
        label: label || name || String(item?.display_name ?? ''),
        source: 'place' as const,
        kind: item?.type ? String(item.type) : undefined,
        name,
      } as GeoPoint & { name?: string };
    })
    .filter(Boolean) as GeoPoint[];

  cacheSet(key, results);
  return results;
}

// ---------------------------------------------------------------------------
// Overpass: điểm dừng xe buýt & tuyến buýt theo dữ liệu OpenStreetMap.
// ---------------------------------------------------------------------------

/**
 * Danh sách máy chủ Overpass theo thứ tự ưu tiên.
 *
 * Đo thực tế ngày 14/10/2026 (query điểm dừng xe buýt khu vực Hà Nội):
 *  - overpass-api.de      : nhanh khi rảnh (1,5–2,5 s) nhưng hay trả 504 khi quá tải,
 *                           và tình trạng quá tải diễn ra từng lúc → cần thử lại nhiều lần.
 *  - kumi.systems / private.coffee : treo quá 20 s, không dùng làm mặc định.
 *  - osm.ch               : nhanh nhưng là extract khu vực Thụy Sĩ (không có dữ liệu Việt Nam).
 *  - maps.mail.ru         : chậm (10–17 s) nhưng trả dữ liệu Việt Nam → dùng làm dự phòng.
 */
const OVERPASS_ENDPOINTS = (() => {
  const primary = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
  const fallbacks = (
    process.env.OVERPASS_FALLBACK_URLS ||
    'https://overpass-api.de/api/interpreter,https://maps.mail.ru/osm/tools/overpass/api/interpreter'
  )
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean);
  return [primary, ...fallbacks].filter((url, index, all) => all.indexOf(url) === index);
})();

const OVERPASS_TTL_MS = 15 * 60 * 1000;
const overpassCache = new Map<string, { at: number; value: any }>();

/** Tổng thời gian tối đa cho toàn bộ các lần thử một truy vấn Overpass. */
const OVERPASS_TOTAL_BUDGET_MS = 34000;

/**
 * Thời gian chờ mỗi lần thử. Đo thực tế: máy chủ quá tải thường trả 504 sau ~1–9 s,
 * còn khi trả kết quả thành công thì mất 1,5–25 s. Giới hạn này giữ cho một lần
 * thất bại không “ăn” hết ngân sách thử lại.
 */
const OVERPASS_ATTEMPT_TIMEOUT_MS = 12000;
const OVERPASS_MAX_ATTEMPTS_PER_ENDPOINT = 3;

async function runOverpass(query: string, cacheKey?: string): Promise<any> {
  const key = cacheKey || query;
  const cached = overpassCache.get(key);
  if (cached && Date.now() - cached.at < OVERPASS_TTL_MS) return cached.value;

  const body = `data=${encodeURIComponent(query)}`;
  const deadline = Date.now() + OVERPASS_TOTAL_BUDGET_MS;
  let lastError: unknown = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < OVERPASS_MAX_ATTEMPTS_PER_ENDPOINT; attempt++) {
      const remaining = deadline - Date.now();
      if (remaining < 1500) break;

      try {
        const value = await fetchJson(endpoint, {
          method: 'POST',
          body,
          // Overpass hay trả 504 nhất thời khi quá tải rồi thành công ngay sau đó,
          // nên thời gian chờ mỗi lần được giới hạn để còn ngân sách thử lại.
          timeoutMs: Math.min(OVERPASS_ATTEMPT_TIMEOUT_MS, remaining),
          retries: 0,
        });

        // Overpass có thể trả HTTP 200 kèm trường `remark` khi truy vấn bị thời gian
        // chờ cắt ngang: dữ liệu khi đó THIẾU nhưng vẻ ngoài vẫn là thành công.
        // Nếu bỏ qua, hệ thống sẽ báo "không có điểm dừng nào" một cách sai lệch.
        if (value && typeof value === 'object' && typeof value.remark === 'string' && value.remark) {
          throw new GeoServiceError(
            `Overpass báo truy vấn chưa hoàn tất: ${String(value.remark).slice(0, 200)}`,
            'provider',
            200
          );
        }

        if (overpassCache.size > 40) overpassCache.clear();
        overpassCache.set(key, { at: Date.now(), value });
        return value;
      } catch (error) {
        lastError = error;
        const status = (error as GeoServiceError)?.upstreamStatus;
        // Chờ một nhịp ngắn (có ngẫu nhiên để khỏi “đồng loạt” đập server) rồi thử lại;
        // lỗi 4xx (khác 429) là lỗi truy vấn nên dừng lại, không thử vô ích.
        await sleep(400 + 500 * attempt + Math.round(Math.random() * 400));
        if (status && status !== 429 && status < 500) return Promise.reject(error);
      }
    }
  }

  const failure = lastError instanceof GeoServiceError ? lastError : null;
  throw new GeoServiceError(
    failure?.kind === 'bad-input'
      ? failure.message
      : 'Dịch vụ dữ liệu OpenStreetMap (Overpass API) đang quá tải hoặc không phản hồi. Vui lòng thử lại sau vài giây.',
    failure?.kind === 'bad-input' ? 'bad-input' : 'provider',
    failure?.upstreamStatus
  );
}

function parseRouteRefs(tags: Record<string, string> | undefined): string[] {
  if (!tags) return [];
  const raw = tags.route_ref || tags.ref || '';
  return raw
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
}

export interface TransitLineEntry {
  line: BusLine;
  /**
   * ID các node là thành viên của quan hệ tuyến. Dùng để đối chiếu với danh sách
   * điểm dừng gần điểm đi / điểm đến, từ đó xác định điểm lên và điểm xuống xe.
   */
  nodeMemberIds: string[];
}

export interface TransitArea {
  /** Điểm dừng xe buýt thật trong bán kính, sắp xếp theo khoảng cách tăng dần. */
  stops: BusStop[];
  /** Tuyến buýt có ít nhất một điểm dừng nằm trong bán kính quanh toạ độ này. */
  lines: TransitLineEntry[];
}

/**
 * Lấy TOÀN BỘ dữ liệu xe buýt quanh một toạ độ bằng MỘT truy vấn Overpass:
 * điểm dừng (node) và tuyến buýt (quan hệ route=bus) có điểm dừng trong bán kính.
 *
 * Gộp chung một truy vấn là quyết định thiết kế quan trọng: máy chủ Overpass công cộng
 * thường xuyên trả 504 khi quá tải, nên mỗi yêu cầu tới người dùng chỉ nên tốn
 * tối thiểu số lần gọi (nhờ đó vẫn có cơ hội thành công và vẫn thử lại được).
 *
 * Lưu ý dữ liệu: trong OSM Việt Nam, các node `highway=bus_stop` KHÔNG phải thành viên
 * của quan hệ tuyến (quan hệ dùng node `public_transport=stop_position` khác).
 * Vì vậy điểm dừng và tuyến được trả về riêng, phần ghép nối được thực hiện bằng
 * việc đối chiếu ID node ở tầng gọi hàm.
 */
export async function findTransitArea(point: LatLng, radiusMeters = 1500): Promise<TransitArea> {
  if (!isValidLatLng(point)) {
    throw new GeoServiceError('Toạ độ tìm điểm dừng xe buýt không hợp lệ.', 'bad-input');
  }

  const radius = Math.min(Math.max(Math.round(radiusMeters), 200), 5000);
  const around = `around:${radius},${point.lat},${point.lng}`;

  // LƯU Ý QUAN TRỌNG: các câu lệnh node phải nằm trong KHỐI HỢP ( ... ) rồi mới gán
  // vào tập .s. Nếu viết nối tiếp từng câu `node(...)->.s;` thì mỗi câu sẽ GHI ĐÈ tập .s,
  // và câu cuối cùng không khớp gì sẽ làm tập điểm dừng rỗng (đã kiểm chứng thực tế).
    // Dùng `.r out tags;` (KHÔNG kèm thành viên) thay vì `.r out body;`: body của một
  // quan hệ tuyến buýt chứa toàn bộ way + node thành viên (hàng nghìn phần tử), là
  // phần khiến Overpass công cộng phản hồi chậm và trả 504. Danh sách thành viên
  // được lấy riêng, chỉ cho các tuyến thực sự dùng tới (xem fetchLineMemberNodeIds).
  const query = `[out:json][timeout:30];
(
  node(${around})[highway=bus_stop];
  node(${around})[public_transport=platform];
  node(${around})[public_transport=stop_position][bus=yes];
)->.s;
rel(${around})[type=route][route~"^(bus|trolleybus)$"]->.r;
.s out body;
.r out tags;`;

  const cacheKey = `transit-area:${radius}:${point.lat.toFixed(4)},${point.lng.toFixed(4)}`;
  const data = await runOverpass(query, cacheKey);
  const elements: any[] = Array.isArray(data?.elements) ? data.elements : [];

  const stops: BusStop[] = [];
  const lines: TransitLineEntry[] = [];
  const seenStops = new Set<string>();
  const seenLines = new Set<string>();

  for (const element of elements) {
    if (element?.type === 'node') {
      const lat = Number(element.lat);
      const lng = Number(element.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      const id = `node/${element.id}`;
      if (seenStops.has(id)) continue;
      seenStops.add(id);
      const tags: Record<string, string> = element.tags ?? {};
      stops.push({
        id,
        name: String(tags.name || tags['name:vi'] || 'Điểm dừng chưa có tên trong OSM'),
        lat,
        lng,
        routeRefs: parseRouteRefs(tags),
        straightLineDistance: Math.round(haversineMeters(point, { lat, lng })),
      });
      continue;
    }

    if (element?.type === 'relation') {
      const id = `relation/${element.id}`;
      if (seenLines.has(id)) continue;
      seenLines.add(id);
      const tags: Record<string, string> = element.tags ?? {};
      lines.push({
        line: {
          id,
          ref: tags.ref || undefined,
          name: tags.name || undefined,
          from: tags.from || undefined,
          to: tags.to || undefined,
          operator: tags.operator || undefined,
        },
        // Thành viên của quan hệ KHÔNG có trong phản hồi `out tags`;
        // chúng được tra riêng bằng fetchLineMemberNodeIds() khi cần gán bến lên/xuống.
        nodeMemberIds: [],
      });
    }
  }

  stops.sort((a, b) => a.straightLineDistance - b.straightLineDistance);
  return { stops, lines };
}

/**
 * Lấy ID các node là THÀNH VIÊN THẬT của từng quan hệ tuyến buýt.
 *
 * Vì sao không dùng `rel(...); out body;`: phản hồi body của tuyến buýt rất lớn
 * (mọi way và node), đo thực tế 8–12 s và thường bị Overpass trả 504. Truy vấn
 * dưới đây chỉ xuất `out ids` cho các node thành viên (~1–3 s, ~1–4 KB) và gộp
 * NHIỀU tuyến vào MỘT lần gọi.
 *
 * Để tách kết quả của từng tuyến trong một phản hồi duy nhất, mỗi khối được kết
 * thúc bằng `.aN out count;` — Overpass chèn một phần tử `type: "count"` làm mốc
 * phân cách. Mốc này còn dùng để kiểm tra tính toàn vẹn: nếu số phần tử node của
 * một khối không khớp hoặc mốc không đúng 1 quan hệ thì TOÀN BỘ kết quả bị bỏ,
 * vì khi đó thứ tự khối không còn đáng tin để gán bến lên/xuống cho tuyến.
 */
export async function fetchLineMemberNodeIds(
  lineIds: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  const numericIds = Array.from(
    new Set(
      lineIds
        .map((id) => Number(id.split('/')[1]))
        .filter((value) => Number.isFinite(value))
    )
  );
  if (numericIds.length === 0) return result;

  const blocks = numericIds
    .map(
      (id) =>
        `rel(${id})->.a${id};\n` +
        `node(r.a${id})->.n${id};\n` +
        `.n${id} out ids;\n` +
        `.a${id} out count;`
    )
    .join('\n');

  const query = `[out:json][timeout:25];\n${blocks}`;
  const data = await runOverpass(
    query,
    `transit-members:${numericIds.slice().sort((a, b) => a - b).join(',')}`
  );
  const elements: any[] = Array.isArray(data?.elements) ? data.elements : [];

  const groups: string[][] = [];
  let current: string[] = [];
  let integrityOk = true;

  for (const element of elements) {
    if (element?.type === 'count') {
      // Mốc phải tương ứng đúng một quan hệ tuyến, nếu không thì không thể biết
      // khối node phía trên thuộc tuyến nào.
      if (Number(element?.tags?.relations ?? '0') !== 1) integrityOk = false;
      groups.push(current);
      current = [];
      continue;
    }
    if (element?.type === 'node' && Number.isFinite(Number(element?.id))) {
      current.push(`node/${element.id}`);
    }
  }
  if (current.length > 0) groups.push(current);

  if (!integrityOk || groups.length !== numericIds.length) return result;

  numericIds.forEach((id, index) => result.set(`relation/${id}`, groups[index]));
  return result;
}

/** Giới hạn dữ liệu giao thông công cộng — hiển thị thẳng thắn cho người dùng. */
export function sumUpTransitLimitations(): string[] {
  return [
    'Dữ liệu điểm dừng và tuyến buýt lấy từ OpenStreetMap (qua Overpass API) — đây là dữ liệu bản đồ mở, có thể thiếu hoặc chưa cập nhật so với thực tế.',
    'OpenStreetMap không chứa giờ chạy, tần suất và giá vé, nên hệ thống KHÔNG hiển thị thời gian chờ hay giờ khởi hành.',
    'Chưa có dịch vụ định tuyến giao thông công cộng (transit routing) nên hệ thống không tự ghép chuyến trung chuyển; chỉ hiển thị tuyến buýt thực sự đi qua cả khu vực đi và khu vực đến.',
    'Khoảng cách đi bộ tới điểm dừng được tính bằng định tuyến đi bộ thật trên mạng lưới đường bộ; khoảng cách hiển thị kèm nhãn "đường chim bay" là khoảng cách thẳng giữa hai toạ độ.',
  ];
}
