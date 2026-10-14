import { NextRequest, NextResponse } from 'next/server';
import { geoErrorResponse, OPENSTREETMAP_ATTRIBUTION, readLatLng } from '@/lib/geoApi';
import {
  fetchLineMemberNodeIds,
  findTransitArea,
  GeoServiceError,
  getRoute,
  sumUpTransitLimitations,
  TransitArea,
} from '@/lib/geoServer';
import { BusStop, haversineMeters, LatLng, TransitPlan } from '@/lib/geo';

/** Hai điểm gần hơn mức này thì việc tra tuyến xe buýt không còn ý nghĩa. */
const MIN_SEPARATION_METERS = 1000;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/** Số điểm dừng hiển thị ở mỗi đầu (dữ liệu vẫn dùng toàn bộ để đối chiếu tuyến). */
const STOPS_PER_END = 8;
const DEFAULT_RADIUS_METERS = 1500;

/** Số tuyến tối đa được tra thành viên để gán bến lên/xuống (giới hạn chi phí gọi Overpass). */
const MAX_LINES_WITH_STOPS = 5;

/** Khoảng cách tối đa để coi một điểm dừng có tên là “cặp” của node thành viên cùng chỗ. */
const PAIRED_STOP_NAME_METERS = 120;

/** Tên thay thế khi điểm dừng trong OSM không có thẻ name. */
const UNNAMED_STOP_LABEL = 'Điểm dừng chưa có tên trong OSM';

interface LineOption {
  line: TransitPlan['directLines'][number]['line'];
  boardStop: BusStop | null;
  alightStop: BusStop | null;
  boardWalkStraightLine: number | null;
  alightWalkStraightLine: number | null;
}

/**
 * Xác định bến lên / bến xuống xe từ dữ liệu thật:
 * điểm dừng phải là node THÀNH VIÊN của chính quan hệ tuyến đó (theo OSM)
 * đồng thời nằm trong danh sách điểm dừng tìm được quanh điểm mốc.
 *
 * Không đoán: nếu không đối chiếu được thì trả về null và giao diện để trống.
 */
function resolveMemberStop(
  memberIds: string[] | undefined,
  stops: BusStop[],
  reference: LatLng
): BusStop | null {
  if (!memberIds || memberIds.length === 0) return null;

  const memberSet = new Set(memberIds);
  const candidates = stops
    .filter((stop) => memberSet.has(stop.id))
    .map((stop) => ({
      ...stop,
      straightLineDistance: Math.round(haversineMeters(reference, stop)),
    }))
    .sort((a, b) => a.straightLineDistance - b.straightLineDistance);

  const nearest = candidates[0];
  if (!nearest) return null;

  // Node `public_transport=stop_position` đúng là thành viên của tuyến nhưng trong
  // OSM Việt Nam thường KHÔNG có tên, trong khi nhà chờ `highway=bus_stop` cách đó vài
  // mét thì có tên. Chỉ mượn tên khi điểm có tên nằm sát ngay đó, và ghi rõ nguồn tên.
  if (nearest.name === UNNAMED_STOP_LABEL) {
    const named = stops
      .filter((stop) => stop.name !== UNNAMED_STOP_LABEL)
      .map((stop) => ({ stop, distance: haversineMeters(nearest, stop) }))
      .filter((entry) => entry.distance <= PAIRED_STOP_NAME_METERS)
      .sort((a, b) => a.distance - b.distance)[0];
    if (named) {
      return { ...nearest, name: named.stop.name, nameFromPairedStop: true };
    }
  }

  return nearest;
}

/**
 * Thông tin xe buýt tới làng nghề, dựng HOÀN TOÀN từ dữ liệu OpenStreetMap:
 *  - điểm dừng thật gần điểm xuất phát và gần điểm đến (Overpass API)
 *  - tuyến buýt (quan hệ route=bus trong OSM) có điểm dừng ở cả hai khu vực
 *  - đoạn đi bộ tính bằng định tuyến đi bộ thật trên mạng lưới đường bộ (OSRM profile foot)
 *
 * KHÔNG suy đoán số hiệu tuyến, KHÔNG bịa giờ chạy / tần suất / giá vé.
 * Giới hạn này được trả về trong `plan.notes` và hiển thị nguyên văn cho người dùng.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const from = readLatLng(params, 'fromLat', 'fromLon');
    const to = readLatLng(params, 'toLat', 'toLon');

    if (!from || !to) {
      throw new GeoServiceError(
        'Thiếu hoặc sai toạ độ điểm xuất phát / điểm đến để tìm xe buýt.',
        'bad-input'
      );
    }

    const radius = Math.min(
      Math.max(Number(params.get('radius')) || DEFAULT_RADIUS_METERS, 400),
      3000
    );

    // Điểm đi và điểm đến quá gần nhau: tra tuyến buýt sẽ cho kết quả vô nghĩa
    // (cùng một bến cho cả hai đầu), nên dừng lại và báo rõ thay vì hiển thị sai.
    const separation = haversineMeters(from, to);
    if (separation < MIN_SEPARATION_METERS) {
      const plan: TransitPlan = {
        originStops: [],
        destinationStops: [],
        directLines: [],
        walking: { toBoard: null, fromAlight: null },
        notes: [
          `Điểm xuất phát và điểm đến chỉ cách nhau khoảng ${Math.round(separation)} m, ` +
            'quá gần để xác định một chuyến xe buýt có ý nghĩa. Hãy chọn điểm đến khác hoặc đi bộ.',
          ...sumUpTransitLimitations(),
        ],
        dataSource: 'OpenStreetMap (Overpass API) + OSRM foot',
      };
      return NextResponse.json({
        ok: true,
        plan,
        attribution: OPENSTREETMAP_ATTRIBUTION,
        counts: { originStops: 0, destinationStops: 0, directLines: 0 },
      });
    }

    // Hai truy vấn độc lập: một đầu lỗi vẫn còn dữ liệu thật của đầu còn lại
    // kèm ghi chú rõ ràng, thay vì làm hỏng toàn bộ chức năng.
    const [originResult, destinationResult] = await Promise.allSettled([
      findTransitArea(from, radius),
      findTransitArea(to, radius),
    ]);

    if (originResult.status === 'rejected' && destinationResult.status === 'rejected') {
      throw originResult.reason;
    }

    const emptyArea: TransitArea = { stops: [], lines: [] };
    const originArea: TransitArea =
      originResult.status === 'fulfilled' ? originResult.value : emptyArea;
    const destinationArea: TransitArea =
      destinationResult.status === 'fulfilled' ? destinationResult.value : emptyArea;
    const areaQueryFailed =
      originResult.status === 'rejected' || destinationResult.status === 'rejected';

    // Tuyến buýt có mặt ở CẢ hai khu vực (đối chiếu theo ID quan hệ OSM).
    const destinationLinesById = new Map(
      destinationArea.lines.map((entry) => [entry.line.id, entry] as const)
    );

    const sharedLines = originArea.lines.filter((entry) => destinationLinesById.has(entry.line.id));

    // Danh sách thành viên (node) của tuyến KHÔNG có trong phản hồi tìm khu vực
    // (đã lượt bỏ thành viên để truy vấn nhẹ và đỡ bị 504). Tra riêng — MỘT lần gọi
    // Overpass cho tất cả tuyến sẽ dùng tời — và chỉ cho các tuyến thực sự hiển thị.
    // Đây là bước phụ: lỗi mạng chỉ làm mất thông tin bến, không làm hỏng chức năng.
    const memberIdsByLine = await fetchLineMemberNodeIds(
      sharedLines.slice(0, MAX_LINES_WITH_STOPS).map((entry) => entry.line.id)
    ).catch(() => new Map<string, string[]>());

    const options: LineOption[] = sharedLines
      .map((entry) => {
        const memberIds = memberIdsByLine.get(entry.line.id);
        const boardStop = resolveMemberStop(memberIds, originArea.stops, from);
        const alightStop = resolveMemberStop(memberIds, destinationArea.stops, to);
        return {
          line: entry.line,
          boardStop,
          alightStop,
          boardWalkStraightLine: boardStop ? boardStop.straightLineDistance : null,
          alightWalkStraightLine: alightStop ? alightStop.straightLineDistance : null,
        };
      })
      // Bỏ phương án mà bến lên và bến xuống lại là CÙNG một điểm dừng —
      // dấu hiệu dữ liệu/hai khu vực chồng lấn, không phải một chuyến đi thật.
      .filter((option) => !option.boardStop || !option.alightStop || option.boardStop.id !== option.alightStop.id)
      .sort((a, b) => {
        // Ưu tiên tuyến xác định được cả điểm lên và điểm xuống, rồi tới tổng quãng đi bộ.
        const aComplete = a.boardStop && a.alightStop ? 1 : 0;
        const bComplete = b.boardStop && b.alightStop ? 1 : 0;
        if (aComplete !== bComplete) return bComplete - aComplete;
        const aWalk = (a.boardWalkStraightLine ?? 0) + (a.alightWalkStraightLine ?? 0);
        const bWalk = (b.boardWalkStraightLine ?? 0) + (b.alightWalkStraightLine ?? 0);
        return aWalk - bWalk;
      });

    const directLines = options.slice(0, 5);

    // Đoạn đi bộ thật cho phương án tốt nhất (định tuyến đi bộ, không phải đường thẳng).
    let walking: TransitPlan['walking'] = { toBoard: null, fromAlight: null };
    const best = directLines[0];
    if (best?.boardStop && best?.alightStop) {
      const [toBoard, fromAlight] = await Promise.all([
        best.boardStop.straightLineDistance > 40
          ? getRoute(from, { lat: best.boardStop.lat, lng: best.boardStop.lng }, 'foot', {
              destinationLabel: best.boardStop.name,
            }).catch(() => null)
          : Promise.resolve(null),
        best.alightStop.straightLineDistance > 40
          ? getRoute({ lat: best.alightStop.lat, lng: best.alightStop.lng }, to, 'foot', {
              originLabel: best.alightStop.name,
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

      walking = {
        toBoard,
        fromAlight,
        boardStopId: best.boardStop.id,
        alightStopId: best.alightStop.id,
      };
    }

    const plan: TransitPlan = {
      originStops: originArea.stops.slice(0, STOPS_PER_END),
      destinationStops: destinationArea.stops.slice(0, STOPS_PER_END),
      directLines,
      walking,
      notes: [
        ...sumUpTransitLimitations(),
        ...(areaQueryFailed
          ? [
              'Máy chủ Overpass đang quá tải nên chỉ tra được dữ liệu ở một đầu hành trình. Vui lòng bấm “Tính lại” sau vài giây để lấy đủ dữ liệu.',
            ]
          : []),
        ...(!areaQueryFailed && originArea.stops.length === 0
          ? [
              `Không có điểm dừng xe buýt nào trong bán kính ${radius} m quanh điểm xuất phát trong dữ liệu OpenStreetMap.`,
            ]
          : []),
        ...(!areaQueryFailed && destinationArea.stops.length === 0
          ? [
              `Không có điểm dừng xe buýt nào trong bán kính ${radius} m quanh điểm đến trong dữ liệu OpenStreetMap.`,
            ]
          : []),
        ...(!areaQueryFailed && directLines.length === 0
          ? [
              'Dữ liệu OpenStreetMap chưa ghi nhận tuyến buýt nào có điểm dừng ở cả hai khu vực này, nên hệ thống không đề xuất tuyến trực tiếp.',
            ]
          : []),
        ...(directLines.some((option) => !option.boardStop || !option.alightStop)
          ? [
              'Một số tuyến có điểm dừng trong dữ liệu OSM nhưng không đối chiếu được đúng bến lên/xuống xe, nên hệ thống để trống thay vì tự đoán bến.',
            ]
          : []),
        ...(directLines.some((option) => option.boardStop?.nameFromPairedStop || option.alightStop?.nameFromPairedStop)
          ? [
              'Khi node thành viên của tuyến (điểm dừng kỹ thuật) chưa có tên trong OSM, tên hiển thị được lấy từ nhà chờ có tên nằm sát ngay đó (trong bán kính 120 m); vị trí hiển thị vẫn là node mà tuyến thực sự đi qua.',
            ]
          : []),
      ],
      dataSource:
        'OpenStreetMap: điểm dừng xe buýt & quan hệ tuyến qua Overpass API; đoạn đi bộ qua OSRM profile foot',
    };

    return NextResponse.json({
      ok: true,
      plan,
      attribution: OPENSTREETMAP_ATTRIBUTION,
      counts: {
        originStops: originArea.stops.length,
        destinationStops: destinationArea.stops.length,
        directLines: directLines.length,
      },
    });
  } catch (error) {
    return geoErrorResponse(error);
  }
}
