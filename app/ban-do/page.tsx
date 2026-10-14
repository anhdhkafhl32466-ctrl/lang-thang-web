'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { CRAFT_VILLAGES, CATEGORIES, CraftVillage } from '@/data/craftVillages';
import { useRoutePlanner } from '@/lib/useRoutePlanner';
import {
  Search,
  MapPin,
  Compass,
  ArrowRight,
  Navigation,
  LocateFixed,
  Crosshair,
  X,
} from 'lucide-react';

import type { CraftMapHandle } from '@/components/map/CraftMapLeaflet';

const CraftMapLeaflet = dynamic(() => import('@/components/map/CraftMapLeaflet'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center bg-dopaper-200/60 rounded-3xl animate-pulse">
      <div className="text-center space-y-2">
        <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-lacquer-800/70">Đang tải bản đồ Hà Nội...</p>
      </div>
    </div>
  )
});

const RoutePlannerPanel = dynamic(() => import('@/components/map/RoutePlannerPanel'), {
  ssr: false,
});

export default function CraftMapPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedVillage, setSelectedVillage] = useState<CraftVillage | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const planner = useRoutePlanner();
  const mapRef = useRef<CraftMapHandle | null>(null);

  const filteredVillages = CRAFT_VILLAGES.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.location.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || v.categorySlug === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Liên kết sâu /ban-do?to=<slug> (ví dụ từ popup bản đồ hoặc trang chi tiết làng nghề).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('to') || params.get('den');
    if (!slug) return;
    const village = CRAFT_VILLAGES.find((v) => v.slug === slug);
    if (!village) return;
    planner.setDestinationFromVillage(village);
    setSelectedVillage(village);
    setPanelOpen(true);
    // Chỉ chạy một lần khi vào trang bằng liên kết sâu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const planRouteTo = (village: CraftVillage) => {
    planner.setDestinationFromVillage(village);
    setSelectedVillage(village);
    setPanelOpen(true);
  };

  const handleMarkerSelect = (village: CraftVillage) => {
    setSelectedVillage(village);
    // Nếu bảng chỉ đường đang mở, tuyến sẽ tự tính lại theo điểm đến vừa chọn.
    if (panelOpen) planner.setDestinationFromVillage(village);
  };

  const gpsPosition = planner.geo.position;

  return (
    <div className="min-h-screen bg-dopaper-50 py-6 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold mb-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Bản Đồ Di Sản Địa Lý</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-lacquer-900">
              Bản đồ làng nghề Hà Nội
            </h1>
            <p className="text-xs text-lacquer-800/60 mt-1">
              Định vị GPS thật và tính lộ trình theo mạng lưới đường bộ OpenStreetMap (OSRM).
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm làng nghề hoặc quận huyện..."
              className="w-full bg-white text-lacquer-900 pl-10 pr-4 py-2.5 rounded-xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500 shadow-sm"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-4 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-terracotta-500 text-white shadow-sm'
                  : 'bg-white text-lacquer-800/80 hover:bg-terracotta-50 border border-terracotta-200/80'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Map & Sidebar Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[72vh] min-h-[600px]">
          {/* Sidebar Village List (Hidden on mobile or drawer) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-terracotta-200/90 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="p-4 bg-dopaper-100/70 border-b border-terracotta-200/80 flex items-center justify-between">
              <span className="text-xs font-bold text-lacquer-900">
                Tìm thấy {filteredVillages.length} làng nghề
              </span>
              <span className="text-[11px] text-lacquer-800/60">
                Nhấp để định vị trên bản đồ
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {filteredVillages.map((v) => {
                const isSelected = selectedVillage?.id === v.id;
                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVillage(v)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-terracotta-50/90 border-terracotta-400 shadow-sm'
                        : 'bg-white border-terracotta-100 hover:border-terracotta-300 hover:bg-dopaper-50'
                    }`}
                  >
                    <img
                      src={v.heroImage}
                      alt={v.name}
                      className="w-14 h-14 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-terracotta-600 uppercase">
                          {v.category}
                        </span>
                        <span className="text-[10px] text-lacquer-800/50">
                          {v.location.distanceFromCenter.split('về')[0]}
                        </span>
                      </div>
                      <h4 className="font-serif text-sm font-bold text-lacquer-900 truncate mt-0.5">
                        {v.name}
                      </h4>
                      <p className="text-xs text-lacquer-800/60 truncate">
                        {v.location.address}
                      </p>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-gold-600 font-medium truncate">
                          {v.history.originPeriod}
                        </span>
                        <span className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              planRouteTo(v);
                            }}
                            className="text-[11px] text-lacquer-900 hover:text-terracotta-700 font-bold flex items-center gap-0.5"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Chỉ đường</span>
                          </button>
                          <Link
                            href={`/lang-nghe/${v.slug}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[11px] text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center gap-0.5"
                          >
                            <span>Xem chi tiết</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaflet Map Interactive Canvas */}
          <div className="lg:col-span-8 h-full relative">
            <CraftMapLeaflet
              ref={mapRef}
              villages={filteredVillages}
              selectedVillageId={selectedVillage?.id}
              onSelectVillage={handleMarkerSelect}
              userLocation={gpsPosition}
              route={planner.routeOverlay}
            />

            {/* Nút điều khiển nổi (góc dưới trái, tránh vùng zoom control của Leaflet) */}
            <div className="absolute left-3 bottom-3 z-[500] flex flex-col items-start gap-2">
              <button
                type="button"
                onClick={() => setPanelOpen((open) => !open)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow-lg transition-all"
              >
                {panelOpen ? <X className="w-4 h-4" /> : <Navigation className="w-4 h-4" />}
                <span>{panelOpen ? 'Đóng bảng chỉ đường' : 'Chỉ đường tới làng nghề'}</span>
              </button>

              {gpsPosition && (
                <button
                  type="button"
                  onClick={() => mapRef.current?.centerOnUser?.()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-terracotta-200 text-lacquer-900 text-[11px] font-bold shadow-md hover:border-terracotta-400 transition-all"
                >
                  <Crosshair className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    Vị trí của tôi · sai số ±{Math.round(gpsPosition.accuracy || 0)} m
                  </span>
                </button>
              )}

              {planner.routeOverlay && (
                <button
                  type="button"
                  onClick={() => mapRef.current?.fitRoute?.()}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-terracotta-200 text-lacquer-900 text-[11px] font-bold shadow-md hover:border-terracotta-400 transition-all"
                >
                  <LocateFixed className="w-3.5 h-3.5 text-terracotta-600" />
                  <span>Xem toàn bộ tuyến đường</span>
                </button>
              )}
            </div>

            {/*
              Bảng chỉ đường: nổi bên phải trên desktop, phủ toàn bộ khung bản đồ trên di động.
              Khung bao phải có cả `top` và `bottom` để chiều cao xác định — nhờ đó
              `max-h-full` của panel mới giới hạn được chiều cao và nội dung tự cuộn.
            */}
            {panelOpen && (
              <div className="absolute inset-x-2 top-2 bottom-2 lg:inset-x-auto lg:top-3 lg:right-3 lg:bottom-3 z-[600] flex justify-end pointer-events-none">
                <div className="w-full lg:w-[380px] max-h-full pointer-events-auto flex">
                  <RoutePlannerPanel
                    planner={planner}
                    villages={CRAFT_VILLAGES}
                    onClose={() => setPanelOpen(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ghi chú nguồn dữ liệu */}
        <p className="text-[11px] text-lacquer-800/60 mt-4 leading-relaxed">
          <MapPin className="w-3 h-3 inline mr-1 text-terracotta-500" />
          Lộ trình và hướng dẫn từng chặng do dịch vụ định tuyến OSRM tính trên mạng lưới đường bộ OpenStreetMap.
          Toạ độ GPS chỉ được lấy khi bạn bấm nút định vị và cho phép quyền vị trí — website không dùng toạ độ mặc định
          thay cho vị trí thật của bạn.
        </p>
      </div>
    </div>
  );
}
