/**
 * Lớp tiện ích địa lý dùng chung cho cả client và server.
 *
 * Nguyên tắc: MỌI giá trị hiển thị cho người dùng (tên đường, số hiệu quốc lộ / tỉnh lộ,
 * khoảng cách, thời gian, hướng rẽ) đều phải bắt nguồn từ dữ liệu dịch vụ định tuyến trả về.
 * File này KHÔNG chứa tọa độ mẫu, không suy diễn tên đường, không tạo dữ liệu giả.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export type TravelProfile = 'driving' | 'foot' | 'bike';

/** Một chặng (step) của tuyến đường, chuyển hoá từ dữ liệu OSRM. */
export interface RouteStep {
  /** Câu hướng dẫn tiếng Việt đã dựng từ dữ liệu thật. */
  instruction: string;
  /** Loại thao tác gốc từ OSRM: depart | turn | continue | merge | roundabout | arrive ... */
  maneuver: string;
  /** Hướng rẽ gốc từ OSRM: left | slight left | sharp right | uturn ... */
  modifier?: string;
  /** Tên đường theo dữ liệu OpenStreetMap (có thể không có). */
  roadName?: string;
  /** Số hiệu tuyến theo OpenStreetMap, ví dụ "QL.21C", "ĐT.428" (có thể không có). */
  roadRef?: string;
  /** Khoảng cách chặng, đơn vị mét. */
  distance: number;
  /** Thời gian ước tính chặng, đơn vị giây. */
  duration: number;
  /** Toạ độ nút giao nơi xảy ra thao tác. */
  location: LatLng;
  bearingAfter?: number;
}

export interface RouteResult {
  profile: TravelProfile;
  /** Tổng khoảng cách, đơn vị mét. */
  distance: number;
  /** Tổng thời gian ước tính, đơn vị giây. */
  duration: number;
  /** Hình học tuyến đường đầy đủ theo mạng lưới đường bộ thực tế. */
  geometry: LatLng[];
  steps: RouteStep[];
  /** Nhãn dịch vụ định tuyến đã trả về dữ liệu này. */
  provider: string;
  originLabel?: string;
  destinationLabel?: string;
}

export interface GeoPoint extends LatLng {
  label?: string;
  /** Nguồn gốc điểm: GPS thiết bị, làng nghề trong dữ liệu, hay kết quả tìm kiếm địa chỉ. */
  source?: 'gps' | 'village' | 'place';
  accuracy?: number;
}

export interface PlaceSuggestion {
  id: string;
  label: string;
  name: string;
  lat: number;
  lng: number;
  kind?: string;
}

export interface BusStop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  /** Số hiệu tuyến ghi trực tiếp trên điểm dừng trong OSM (nếu có). */
  routeRefs: string[];
  /** Khoảng cách đường chim bay từ mốc so sánh, đơn vị mét. */
  straightLineDistance: number;
  /**
   * true khi node thành viên của tuyến không có tên trong OSM và tên hiển thị
   * được lấy từ nhà chờ có tên nằm sát ngay đó (xem resolveMemberStop).
   */
  nameFromPairedStop?: boolean;
}

export interface BusLine {
  id: string;
  ref?: string;
  name?: string;
  from?: string;
  to?: string;
  operator?: string;
}

export interface TransitPlan {
  originStops: BusStop[];
  destinationStops: BusStop[];
  /**
   * Tuyến buýt (theo quan hệ route trong OSM) có điểm dừng ở CẢ khu vực xuất phát và khu vực đích.
   * boardStop / alightStop là null khi dữ liệu OSM không đủ để xác định điểm dừng cụ thể —
   * hệ thống báo rõ thay vì tự đoán một điểm dừng.
   */
  directLines: {
    line: BusLine;
    boardStop: BusStop | null;
    alightStop: BusStop | null;
    boardWalkStraightLine: number | null;
    alightWalkStraightLine: number | null;
  }[];
  /** Đoạn đi bộ thật (định tuyến đi bộ theo mạng đường bộ) cho phương án tốt nhất. */
  walking: {
    toBoard: RouteResult | null;
    fromAlight: RouteResult | null;
    boardStopId?: string;
    alightStopId?: string;
  };
  /** Giới hạn dữ liệu – hiển thị thẳng thắn cho người dùng. */
  notes: string[];
  dataSource: string;
}

/** Toạ độ hợp lệ và nằm trong dải hợp lệ của GPS. */
export function isValidLatLng(v: unknown): v is LatLng {
  if (!v || typeof v !== 'object') return false;
  const p = v as LatLng;
  return (
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180
  );
}

/** Khoảng cách đường chim bay (haversine), đơn vị mét. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  const km = meters / 1000;
  const value = km >= 10 ? Math.round(km).toString() : km.toFixed(1).replace('.', ',');
  return `${value} km`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 60) return `${Math.round(seconds)} giây`;
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} phút`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes === 0 ? `${hours} giờ` : `${hours} giờ ${minutes} phút`;
}

/** Hiển thị toạ độ GPS thật đang dùng (5 chữ số thập phân ~ 1 m). */
export function formatCoords(p: LatLng): string {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

const CARDINALS = [
  'Bắc',
  'Đông Bắc',
  'Đông',
  'Đông Nam',
  'Nam',
  'Tây Nam',
  'Tây',
  'Tây Bắc',
] as const;

export function cardinalFromBearing(bearing?: number): string | null {
  if (typeof bearing !== 'number' || !Number.isFinite(bearing)) return null;
  const normalized = ((bearing % 360) + 360) % 360;
  return CARDINALS[Math.round(normalized / 45) % 8];
}

const MODIFIER_VI: Record<string, string> = {
  left: 'Rẽ trái',
  'slight left': 'Chếch sang trái',
  'sharp left': 'Rẽ gắt sang trái',
  right: 'Rẽ phải',
  'slight right': 'Chếch sang phải',
  'sharp right': 'Rẽ gắt sang phải',
  straight: 'Đi thẳng',
  uturn: 'Quay đầu',
};

/** Nhãn đường chỉ lấy từ dữ liệu OSM: ưu tiên tên đường, bổ sung số hiệu tuyến nếu có. */
function roadLabelOf(step: Pick<RouteStep, 'roadName' | 'roadRef'>): string {
  const name = step.roadName?.trim();
  const ref = step.roadRef?.trim();
  if (name && ref) return `${name} (${ref})`;
  if (name) return name;
  if (ref) return `tuyến ${ref}`;
  return '';
}

/**
 * Dựng câu hướng dẫn tiếng Việt từ dữ liệu định tuyến.
 * Khi dữ liệu không có tên đường / số hiệu tuyến, câu hướng dẫn vẫn đúng
 * nhưng tuyệt đối không tự đặt tên đường.
 */
export function buildInstruction(
  step: Pick<RouteStep, 'maneuver' | 'modifier' | 'roadName' | 'roadRef' | 'bearingAfter'>,
  opts: { isFirst?: boolean; isLast?: boolean; destinationLabel?: string } = {}
): string {
  const target = roadLabelOf(step);
  const modifier = step.modifier ? MODIFIER_VI[step.modifier] : undefined;

  if (step.maneuver === 'depart') {
    if (target) return `Xuất phát và đi theo ${target}`;
    const direction = cardinalFromBearing(step.bearingAfter);
    return direction
      ? `Xuất phát từ điểm đầu và đi về hướng ${direction}`
      : 'Xuất phát từ điểm đầu của lộ trình';
  }

  if (step.maneuver === 'arrive') {
    return opts.destinationLabel ? `Đã đến ${opts.destinationLabel}` : 'Đã đến điểm đích';
  }

  if (step.maneuver === 'roundabout' || step.maneuver === 'rotary') {
    return target ? `Đi vào vòng xuyến và đi theo ${target}` : 'Đi vào vòng xuyến';
  }

  if (step.maneuver === 'exit roundabout' || step.maneuver === 'exit rotary') {
    return target ? `Ra khỏi vòng xuyến vào ${target}` : 'Ra khỏi vòng xuyến';
  }

  if (step.maneuver === 'merge') {
    return target ? `Nhập vào làn đường ${target}` : 'Nhập vào làn đường chính';
  }

  if (step.maneuver === 'on ramp') {
    return target ? `Đi lên đường dẫn vào ${target}` : 'Đi lên đường dẫn';
  }

  if (step.maneuver === 'off ramp') {
    return target ? `Đi theo lối ra về ${target}` : 'Đi theo lối ra';
  }

  if (step.maneuver === 'fork') {
    if (modifier) return target ? `${modifier} vào ${target}` : modifier;
    return target ? `Đi theo nhánh đường ${target}` : 'Đi theo nhánh đường phía trước';
  }

  if (step.maneuver === 'turn' || step.maneuver === 'end of road') {
    if (modifier) return target ? `${modifier} vào ${target}` : modifier;
    return target ? `Chuyển sang ${target}` : 'Chuyển sang đoạn đường tiếp theo';
  }

  if (step.maneuver === 'notification') {
    return target ? `Tiếp tục theo ${target}` : 'Tiếp tục di chuyển';
  }

  // continue | new name | straight | các trường hợp còn lại
  if (modifier && modifier !== 'Đi thẳng') {
    return target ? `${modifier} và tiếp tục theo ${target}` : modifier;
  }
  return target ? `Tiếp tục đi theo ${target}` : 'Tiếp tục đi thẳng';
}

/** Chuyển step thô từ OSRM thành RouteStep đã có câu hướng dẫn tiếng Việt. */
export function toRouteStep(
  raw: any,
  opts: { isFirst?: boolean; isLast?: boolean; destinationLabel?: string } = {}
): RouteStep {
  const loc = raw?.maneuver?.location;
  const step: RouteStep = {
    instruction: '',
    maneuver: String(raw?.maneuver?.type ?? 'continue'),
    modifier: raw?.maneuver?.modifier,
    roadName: raw?.name || undefined,
    // OSRM để trống chuỗi khi đoạn đường không có số hiệu.
    roadRef: raw?.ref || undefined,
    distance: Number(raw?.distance ?? 0),
    duration: Number(raw?.duration ?? 0),
    location: {
      lat: Array.isArray(loc) ? Number(loc[1]) : NaN,
      lng: Array.isArray(loc) ? Number(loc[0]) : NaN,
    },
    bearingAfter:
      typeof raw?.maneuver?.bearing_after === 'number' ? raw.maneuver.bearing_after : undefined,
  };
  step.instruction = buildInstruction(step, opts);
  return step;
}
