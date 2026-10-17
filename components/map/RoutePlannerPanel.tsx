'use client';

import React, { useEffect, useRef, useState } from 'react';
import { CraftVillage } from '@/data/craftVillages';
import { formatCoords, formatDistance, formatDuration, GeoPoint, RouteStep } from '@/lib/geo';
import { PlannerEndpoint, UseRoutePlannerResult } from '@/lib/useRoutePlanner';
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowUp,
  Bus,
  Car,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  Footprints,
  Info,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Undo2,
  X,
} from 'lucide-react';

type PickerTab = 'gps' | 'village' | 'address';

interface RoutePlannerPanelProps {
  planner: UseRoutePlannerResult;
  villages: CraftVillage[];
  onClose: () => void;
}

const ICON_CLASS = 'w-3.5 h-3.5 shrink-0';

function ManeuverIcon({ step }: { step: RouteStep }) {
  if (step.maneuver === 'arrive') return <Flag className={ICON_CLASS} />;
  if (step.maneuver === 'depart') return <Navigation className={ICON_CLASS} />;
  if (step.maneuver.startsWith('roundabout') || step.maneuver === 'rotary' || step.maneuver === 'exit roundabout') {
    return <RefreshCw className={ICON_CLASS} />;
  }
  const modifier = step.modifier || '';
  if (modifier === 'uturn') return <Undo2 className={ICON_CLASS} />;
  if (modifier.includes('left')) return <CornerUpLeft className={ICON_CLASS} />;
  if (modifier.includes('right')) return <CornerUpRight className={ICON_CLASS} />;
  return <ArrowUp className={ICON_CLASS} />;
}

function EndpointSummary({
  endpoint,
  fallback,
  onClear,
}: {
  endpoint: PlannerEndpoint | null;
  fallback: string;
  onClear: () => void;
}) {
  if (!endpoint) {
    return <p className="text-xs text-lacquer-800/60 italic">{fallback}</p>;
  }
  const sourceLabel =
    endpoint.source === 'gps'
      ? 'Vị trí GPS thật'
      : endpoint.source === 'village'
        ? 'Làng nghề trong dữ liệu'
        : 'Địa điểm tìm được';
  return (
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-lacquer-900 truncate">
          {endpoint.label || 'Toạ độ đã chọn'}
        </p>
        <p className="text-[10px] text-lacquer-800/60">
          {formatCoords(endpoint)} · {sourceLabel}
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="shrink-0 inline-flex items-center gap-1 text-[10px] font-bold text-terracotta-600 hover:text-terracotta-700"
      >
        <X className="w-3 h-3" /> Đổi
      </button>
    </div>
  );
}

function AddressSearch({
  planner,
  onPick,
  placeholder,
}: {
  planner: UseRoutePlannerResult;
  onPick: (place: GeoPoint) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const text = query.trim();
    timerRef.current = setTimeout(() => {
      if (text.length >= 3) planner.search(text);
      else planner.clearSearch();
    }, 450);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-dopaper-50 text-lacquer-900 pl-8 pr-3 py-2 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
        />
        {planner.searchLoading && (
          <Loader2 className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-terracotta-500" />
        )}
      </div>
      {planner.searchError && (
        <p className="text-[10px] text-amber-700">{planner.searchError}</p>
      )}
      {planner.searchResults.length > 0 && (
        <ul className="max-h-40 overflow-y-auto rounded-xl border border-terracotta-100 divide-y divide-terracotta-100">
          {planner.searchResults.map((place, index) => (
            <li key={`${place.lat}-${place.lng}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  onPick(place);
                  setQuery('');
                  planner.clearSearch();
                }}
                className="w-full text-left px-2.5 py-2 hover:bg-terracotta-50 transition-colors"
              >
                <span className="block text-[11px] font-semibold text-lacquer-900 truncate">
                  {place.label || 'Địa điểm không tên'}
                </span>
                <span className="block text-[10px] text-lacquer-800/60">
                  {formatCoords(place)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EndpointPicker({
  planner,
  villages,
  title,
  accent,
  endpoint,
  fallbackText,
  onUseVillage,
  onUsePlace,
  onUseGps,
  onClear,
  gpsButtonLabel,
}: {
  planner: UseRoutePlannerResult;
  villages: CraftVillage[];
  title: string;
  accent: string;
  endpoint: PlannerEndpoint | null;
  fallbackText: string;
  onUseVillage: (village: CraftVillage) => void;
  onUsePlace: (place: GeoPoint) => void;
  onUseGps: () => void;
  onClear: () => void;
  gpsButtonLabel: string;
}) {
  const [tab, setTab] = useState<PickerTab>(endpoint ? 'village' : 'gps');

  if (endpoint) {
    return (
      <div className="rounded-2xl border border-terracotta-200 bg-dopaper-50/60 p-2.5">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
          <span className="text-[10px] font-bold uppercase tracking-wide text-lacquer-800/70">{title}</span>
        </div>
        <EndpointSummary endpoint={endpoint} fallback={fallbackText} onClear={onClear} />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-terracotta-200 bg-dopaper-50/60 p-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        <span className={`w-1.5 h-1.5 rounded-full ${accent}`} />
        <span className="text-[10px] font-bold uppercase tracking-wide text-lacquer-800/70">{title}</span>
      </div>

      <div className="flex items-center gap-1">
        {(
          [
            ['gps', 'GPS'],
            ['village', 'Làng nghề'],
            ['address', 'Địa chỉ'],
          ] as [PickerTab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
              tab === key
                ? 'bg-terracotta-500 text-white'
                : 'paper-panel text-lacquer-800/70 border border-terracotta-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'gps' && (
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={onUseGps}
            disabled={planner.geo.status === 'locating' || planner.geo.status === 'tracking'}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold transition-all"
          >
            {planner.geo.status === 'locating' || planner.geo.status === 'tracking' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LocateFixed className="w-3.5 h-3.5" />
            )}
            {gpsButtonLabel}
          </button>
          {(planner.geo.status === 'locating' || planner.geo.status === 'tracking') && (
            <p className="text-[10px] text-lacquer-800/75 leading-relaxed">
              {planner.geo.permission === 'prompt'
                ? 'Trình duyệt đang chờ bạn cấp quyền vị trí — hãy chọn “Cho phép (Allow)” trong hộp thoại vừa hiện ra.'
                : 'Đang lấy toạ độ GPS thật từ thiết bị của bạn...'}
            </p>
          )}
          {planner.geo.position && (
            <p className="text-[10px] text-emerald-700 font-semibold">
              Đã có vị trí GPS: {formatCoords(planner.geo.position)}
              {planner.geo.position.accuracy ? ` (sai số ±${Math.round(planner.geo.position.accuracy)} m)` : ''}
            </p>
          )}
          {planner.geo.error && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-2 space-y-1">
              <p className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {planner.geo.error.message}
              </p>
              <p className="text-[10px] text-amber-800/90 leading-relaxed">{planner.geo.error.hint}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'village' && (
        <select
          value=""
          onChange={(e) => {
            const village = villages.find((v) => v.slug === e.target.value);
            if (village) onUseVillage(village);
          }}
          className="w-full paper-panel text-lacquer-900 px-2.5 py-2 rounded-xl border border-terracotta-200 text-xs focus:outline-none focus:border-terracotta-500"
        >
          <option value="">— Chọn làng nghề —</option>
          {villages.map((village) => (
            <option key={village.slug} value={village.slug}>
              {village.name} · {village.location.district}
            </option>
          ))}
        </select>
      )}

      {tab === 'address' && (
        <AddressSearch planner={planner} onPick={onUsePlace} placeholder="Nhập số nhà, tên đường, địa danh..." />
      )}
    </div>
  );
}

export default function RoutePlannerPanel({ planner, villages, onClose }: RoutePlannerPanelProps) {
  const { route, routeError, computing, transit, transitError, transitLoading } = planner;
  const hasEndpoints = Boolean(planner.origin && planner.destination);

  return (
    <div className="w-full lg:w-[380px] bg-white/98 backdrop-blur-xl rounded-3xl border border-terracotta-200 shadow-2xl overflow-hidden flex flex-col max-h-full">
      {/* Header */}
      <div className="px-4 py-3 bg-dopaper-100/80 border-b border-terracotta-200/80 flex items-start justify-between gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-terracotta-100 text-terracotta-700 text-[10px] font-bold">
            <Navigation className="w-3 h-3" />
            <span>Chỉ đường thực tế</span>
          </div>
          <p className="text-[10px] text-lacquer-800/60 mt-1">
            Định tuyến OSRM · dữ liệu đường bộ OpenStreetMap
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 w-7 h-7 rounded-full paper-panel border border-terracotta-200 flex items-center justify-center text-lacquer-800/70 hover:text-terracotta-600"
          aria-label="Đóng bảng chỉ đường"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Điểm xuất phát */}
        <EndpointPicker
          planner={planner}
          villages={villages}
          title="Điểm xuất phát"
          accent="bg-emerald-500"
          endpoint={planner.origin}
          fallbackText="Chưa chọn điểm xuất phát"
          onUseVillage={planner.setOriginFromVillage}
          onUsePlace={planner.setOriginFromPlace}
          onUseGps={planner.useMyLocationAsOrigin}
          onClear={planner.clearOrigin}
          gpsButtonLabel="Dùng vị trí hiện tại của tôi"
        />

        {/* Điểm đến */}
        <EndpointPicker
          planner={planner}
          villages={villages}
          title="Điểm đến"
          accent="bg-terracotta-500"
          endpoint={planner.destination}
          fallbackText="Chưa chọn điểm đến (chọn làng nghề bạn muốn tới)"
          onUseVillage={planner.setDestinationFromVillage}
          onUsePlace={planner.setDestinationFromPlace}
          onUseGps={planner.useMyLocationAsDestination}
          onClear={planner.clearDestination}
          gpsButtonLabel="Đặt vị trí hiện tại làm điểm đến"
        />

        {/* Phương tiện */}
        <div className="flex items-center gap-1.5">
          {(
            [
              ['driving', 'Xe máy / Ô tô', <Car key="car" className={ICON_CLASS} />],
              ['foot', 'Đi bộ', <Footprints key="foot" className={ICON_CLASS} />],
              ['transit', 'Xe buýt', <Bus key="bus" className={ICON_CLASS} />],
            ] as [UseRoutePlannerResult['vehicle'], string, React.ReactNode][]
          ).map(([key, label, icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => planner.setVehicle(key)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold transition-all ${
                planner.vehicle === key
                  ? 'bg-terracotta-500 text-white shadow-sm'
                  : 'bg-dopaper-50 text-lacquer-800/75 border border-terracotta-200 hover:border-terracotta-300'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={planner.swapEndpoints}
            disabled={!planner.origin || !planner.destination}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-xl bg-dopaper-50 border border-terracotta-200 text-[11px] font-semibold text-lacquer-800/80 disabled:opacity-50"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" /> Đảo điểm đi / điểm đến
          </button>
          <button
            type="button"
            onClick={planner.retry}
            disabled={!hasEndpoints}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-dopaper-50 border border-terracotta-200 text-[11px] font-semibold text-lacquer-800/80 disabled:opacity-50"
            title="Tính lại lộ trình"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Tính lại
          </button>
        </div>

        {/* Kết quả: lộ trình đường bộ / đi bộ */}
        {(planner.vehicle === 'driving' || planner.vehicle === 'foot') && (
          <div className="space-y-2">
            {computing && (
              <div className="flex items-center gap-2 rounded-xl bg-dopaper-50 border border-terracotta-100 p-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-terracotta-500" />
                <span className="text-[11px] font-semibold text-lacquer-800/80">
                  Đang tính lộ trình trên mạng lưới đường bộ thực tế...
                </span>
              </div>
            )}

            {!computing && routeError && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-2.5 space-y-1">
                <p className="text-[11px] font-bold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Không thể tính được tuyến đường
                </p>
                <p className="text-[11px] text-red-700/90 leading-relaxed">{routeError}</p>
                <button
                  type="button"
                  onClick={planner.retry}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 underline"
                >
                  <RefreshCw className="w-3 h-3" /> Thử lại
                </button>
              </div>
            )}

            {!computing && route && (
              <>
                <div className="rounded-2xl bg-terracotta-50/80 border border-terracotta-200 p-3">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-2xl font-serif font-bold text-lacquer-900 leading-none">
                        {formatDistance(route.distance)}
                      </p>
                      <p className="text-[11px] text-lacquer-800/70 mt-1">
                        Khoảng {formatDuration(route.duration)} di chuyển
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-terracotta-700 text-right max-w-[45%]">
                      {route.provider}
                    </span>
                  </div>
                  {route.originLabel && route.destinationLabel && (
                    <p className="text-[10px] text-lacquer-800/70 mt-2 leading-relaxed">
                      {route.originLabel} → {route.destinationLabel}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-lacquer-800/60">
                    Hướng dẫn từng chặng ({route.steps.length})
                  </p>
                  <ol className="space-y-1.5">
                    {route.steps.map((step, index) => (
                      <li
                        key={`${index}-${step.instruction}`}
                        className="flex items-start gap-2 rounded-xl border border-terracotta-100 paper-panel p-2"
                      >
                        <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-dopaper-100 text-lacquer-900 text-[10px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-lacquer-900 leading-snug flex items-start gap-1.5">
                            <span className="text-terracotta-600 mt-0.5"><ManeuverIcon step={step} /></span>
                            <span>{step.instruction}</span>
                          </p>
                          {(step.distance > 0 || step.duration > 0) && (
                            <p className="text-[10px] text-lacquer-800/55 mt-0.5">
                              {step.distance > 0 ? formatDistance(step.distance) : ''}
                              {step.distance > 0 && step.duration > 0 ? ' · ' : ''}
                              {step.duration > 0 ? formatDuration(step.duration) : ''}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <p className="text-[10px] text-lacquer-800/50 leading-relaxed">
                  {planner.attribution}. Tên đường và số hiệu quốc lộ/tỉnh lộ hiển thị đúng như dữ liệu
                  bản đồ cung cấp; đoạn không có tên đường sẽ không được tự đặt tên.
                </p>
              </>
            )}

            {!computing && !route && !routeError && (
              <p className="text-[11px] text-lacquer-800/60 italic">
                Chọn điểm xuất phát và điểm đến để hệ thống tính lộ trình thật.
              </p>
            )}
          </div>
        )}

        {/* Kết quả: xe buýt */}
        {planner.vehicle === 'transit' && (
          <div className="space-y-2">
            {transitLoading && (
              <div className="flex items-center gap-2 rounded-xl bg-dopaper-50 border border-terracotta-100 p-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-terracotta-500" />
                <span className="text-[11px] font-semibold text-lacquer-800/80">
                  Đang tìm điểm dừng và tuyến buýt trong dữ liệu OpenStreetMap...
                </span>
              </div>
            )}

            {!transitLoading && transitError && (
              <div className="rounded-xl border border-red-300 bg-red-50 p-2.5 space-y-1">
                <p className="text-[11px] font-bold text-red-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Không lấy được dữ liệu xe buýt
                </p>
                <p className="text-[11px] text-red-700/90 leading-relaxed">{transitError}</p>
                <button
                  type="button"
                  onClick={planner.retry}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 underline"
                >
                  <RefreshCw className="w-3 h-3" /> Thử lại
                </button>
              </div>
            )}

            {!transitLoading && transit && (
              <>
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 space-y-1">
                  <p className="text-[10px] font-bold text-amber-900 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" /> Giới hạn dữ liệu giao thông công cộng
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    {transit.notes.map((note, index) => (
                      <li key={index} className="text-[10px] text-amber-900/90 leading-relaxed">
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>

                {transit.directLines.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-lacquer-800/60">
                      Tuyến buýt đi qua cả hai khu vực
                    </p>
                    {transit.directLines.map((option, index) => (
                      <div key={index} className="rounded-xl border border-terracotta-100 paper-panel p-2 space-y-1">
                        <p className="text-[11px] font-bold text-lacquer-900">
                          {option.line.ref ? `Tuyến ${option.line.ref}` : option.line.name || 'Tuyến không có số hiệu trong OSM'}
                        </p>
                        {option.line.name && (
                          <p className="text-[10px] text-lacquer-800/70">{option.line.name}</p>
                        )}
                        <p className="text-[10px] text-lacquer-800/70">
                          {option.boardStop ? (
                            <>
                              Lên xe: <span className="font-semibold">{option.boardStop.name}</span>
                              {option.boardWalkStraightLine !== null
                                ? ` (${formatDistance(option.boardWalkStraightLine)} đường chim bay)`
                                : ''}
                            </>
                          ) : (
                            <span className="italic">Chưa đối chiếu được bến lên xe cụ thể từ dữ liệu OSM.</span>
                          )}
                        </p>
                        <p className="text-[10px] text-lacquer-800/70">
                          {option.alightStop ? (
                            <>
                              Xuống xe: <span className="font-semibold">{option.alightStop.name}</span>
                              {option.alightWalkStraightLine !== null
                                ? ` (${formatDistance(option.alightWalkStraightLine)} đường chim bay)`
                                : ''}
                            </>
                          ) : (
                            <span className="italic">Chưa đối chiếu được bến xuống xe cụ thể từ dữ liệu OSM.</span>
                          )}
                        </p>
                        {(option.line.from || option.line.to) && (
                          <p className="text-[10px] text-lacquer-800/55">
                            Hướng tuyến: {option.line.from || '—'} → {option.line.to || '—'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {(transit.walking.toBoard || transit.walking.fromAlight) && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-lacquer-800/60">
                      Đoạn đi bộ (định tuyến đường bộ thật)
                    </p>
                    {transit.walking.toBoard && (
                      <p className="text-[10px] text-lacquer-800/80">
                        Tới điểm dừng: {formatDistance(transit.walking.toBoard.distance)} ·{' '}
                        {formatDuration(transit.walking.toBoard.duration)}
                      </p>
                    )}
                    {transit.walking.fromAlight && (
                      <p className="text-[10px] text-lacquer-800/80">
                        Từ điểm dừng tới đích: {formatDistance(transit.walking.fromAlight.distance)} ·{' '}
                        {formatDuration(transit.walking.fromAlight.duration)}
                      </p>
                    )}
                  </div>
                )}

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-lacquer-800/60">
                    Điểm dừng gần điểm xuất phát
                  </p>
                  <ul className="space-y-1">
                    {transit.originStops.map((stop) => (
                      <li key={stop.id} className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-terracotta-500" />
                        <span className="text-[10px] text-lacquer-800/80 leading-snug">
                          {stop.name} · {formatDistance(stop.straightLineDistance)}
                          {stop.routeRefs.length > 0 ? ` · tuyến OSM ghi: ${stop.routeRefs.join(', ')}` : ''}
                        </span>
                      </li>
                    ))}
                    {transit.originStops.length === 0 && (
                      <li className="text-[10px] text-lacquer-800/60 italic">Không có điểm dừng nào gần điểm xuất phát.</li>
                    )}
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-lacquer-800/60">
                    Điểm dừng gần điểm đến
                  </p>
                  <ul className="space-y-1">
                    {transit.destinationStops.map((stop) => (
                      <li key={stop.id} className="flex items-start gap-1.5">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-terracotta-500" />
                        <span className="text-[10px] text-lacquer-800/80 leading-snug">
                          {stop.name} · {formatDistance(stop.straightLineDistance)}
                          {stop.routeRefs.length > 0 ? ` · tuyến OSM ghi: ${stop.routeRefs.join(', ')}` : ''}
                        </span>
                      </li>
                    ))}
                    {transit.destinationStops.length === 0 && (
                      <li className="text-[10px] text-lacquer-800/60 italic">Không có điểm dừng nào gần điểm đến.</li>
                    )}
                  </ul>
                </div>

                <p className="text-[10px] text-lacquer-800/50 leading-relaxed">
                  Nguồn dữ liệu: {transit.dataSource}. {planner.attribution}.
                </p>
              </>
            )}

            {!transitLoading && !transit && !transitError && (
              <p className="text-[11px] text-lacquer-800/60 italic">
                Chọn điểm xuất phát và điểm đến để tra điểm dừng xe buýt thật.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
