'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CRAFT_VILLAGES, CATEGORIES, CraftVillage } from '@/data/craftVillages';
import { VILLAGE_BOUNDARIES } from '@/data/villageBoundaries';
import {
  HANOI_CRAFT_OVERVIEW,
  RECOGNIZED_CRAFT_DIRECTORY,
  RecognizedVillageItem,
  DistrictCraftStats
} from '@/data/recognizedVillagesDirectory';
import {
  Search, MapPin, Compass, ArrowRight, Sparkles, Map,
  LayoutGrid, Clock, Eye, Info, CheckCircle2, Award,
  ChevronDown, ChevronUp, BookOpen, Filter, ExternalLink,
  Flame, X, Building2, MapPinned, Star, Share2
} from 'lucide-react';

const VillageBoundaryMap = dynamic(
  () => import('@/components/map/VillageBoundaryMap'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[620px] flex items-center justify-center bg-dopaper-200/60 rounded-3xl animate-pulse">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-terracotta-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-lacquer-800/70">
            Đang tải bản đồ phân vùng ranh giới làng nghề Hà Nội...
          </p>
        </div>
      </div>
    )
  }
);

export default function CraftVillagesDirectoryPage() {
  const router = useRouter();

  // Top-level Navigation Mode: 'map' (Bản đồ phân vùng), 'directory' (Tra cứu 327 làng nghề), 'featured' (16 làng nghề tiêu biểu)
  const [activeTab, setActiveTab] = useState<'map' | 'directory' | 'featured'>('map');

  // Directory filter states
  const [directorySearch, setDirectorySearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [expandedDistricts, setExpandedDistricts] = useState<Record<string, boolean>>({
    'thuong-tin': true,
    'phu-xuyen': true,
    'thach-that': true
  });
  const [selectedModalVillage, setSelectedModalVillage] = useState<RecognizedVillageItem | null>(null);

  // Map view states
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSelectedCategory, setMapSelectedCategory] = useState('all');
  const [hoveredVillage, setHoveredVillage] = useState<CraftVillage | null>(null);

  // Filtered villages for Map & Featured Tabs
  const filteredMapVillages = useMemo(() => {
    return CRAFT_VILLAGES.filter((v) => {
      const matchesSearch =
        v.name.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
        v.location.district.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
        v.shortDescription.toLowerCase().includes(mapSearchQuery.toLowerCase()) ||
        v.tags.some((t) => t.toLowerCase().includes(mapSearchQuery.toLowerCase()));

      const matchesCategory =
        mapSelectedCategory === 'all' || v.categorySlug === mapSelectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [mapSearchQuery, mapSelectedCategory]);

  // Filtered Directory Data (327 villages across districts)
  const filteredDirectory = useMemo(() => {
    return RECOGNIZED_CRAFT_DIRECTORY.map((district) => {
      // Check district filter
      if (selectedDistrict !== 'all' && district.districtSlug !== selectedDistrict) {
        return null;
      }

      // Filter villages within district
      const matchedVillages = district.villages.filter((v) => {
        const q = directorySearch.toLowerCase().trim();
        const matchesQuery =
          !q ||
          v.name.toLowerCase().includes(q) ||
          v.craftName.toLowerCase().includes(q) ||
          v.commune.toLowerCase().includes(q) ||
          district.districtName.toLowerCase().includes(q);

        let matchesType = true;
        if (selectedTypeFilter === 'traditional') {
          matchesType = v.type === 'Làng nghề truyền thống';
        } else if (selectedTypeFilter === 'regular') {
          matchesType = v.type === 'Làng nghề';
        } else if (selectedTypeFilter === 'heritage') {
          matchesType = !!v.isNationalHeritage;
        }

        return matchesQuery && matchesType;
      });

      if (matchedVillages.length === 0 && directorySearch.trim()) {
        return null;
      }

      return {
        ...district,
        villages: matchedVillages
      };
    }).filter(Boolean) as DistrictCraftStats[];
  }, [directorySearch, selectedDistrict, selectedTypeFilter]);

  // Total matching villages in directory
  const totalMatchingVillages = useMemo(() => {
    return filteredDirectory.reduce((sum, d) => sum + d.villages.length, 0);
  }, [filteredDirectory]);

  const toggleDistrictAccordion = (slug: string) => {
    setExpandedDistricts((prev) => ({
      ...prev,
      [slug]: !prev[slug]
    }));
  };

  const handleVillageClick = (village: CraftVillage) => {
    router.push(`/lang-nghe/${village.slug}`);
  };

  return (
    <div className="min-h-screen py-6 sm:py-10 bg-dopaper-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header & Context */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-800 text-xs font-bold border border-terracotta-200">
              <Compass className="w-3.5 h-3.5 text-terracotta-600" />
              Di Sản Đất Trăm Nghề Thăng Long
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-xs font-bold border border-gold-300">
              <Award className="w-3.5 h-3.5 text-gold-600" />
              Chính Thức Công Nhận bởi UBND TP. Hà Nội
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-extrabold text-lacquer-900 tracking-tight">
                Bản đồ làng nghề truyền thống Hà Nội
              </h1>
              <p className="text-xs sm:text-sm text-lacquer-800/80 mt-2 max-w-3xl leading-relaxed">
                Hà Nội là thủ phủ làng nghề lớn nhất cả nước, chiếm 1/3 tổng số làng nghề toàn quốc với <strong>1.350 làng có nghề</strong> và <strong>{HANOI_CRAFT_OVERVIEW.recognizedCraftVillages} làng nghề được công nhận chính thức</strong>. Khám phá bản đồ ranh giới địa lý, tra cứu danh bạ 24 quận huyện và trải nghiệm câu chuyện di sản nghìn năm.
              </p>
            </div>
          </div>

          {/* Quick Stats Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="bg-white p-3.5 rounded-2xl border border-terracotta-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-lacquer-800/70">Làng có nghề</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-black text-terracotta-600">1.350</span>
                <span className="text-[10px] text-terracotta-500 font-bold">(1/3 cả nước)</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-terracotta-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-lacquer-800/70">Làng nghề công nhận</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-black text-lacquer-900">327</span>
                <span className="text-[10px] text-lacquer-700 font-bold">làng nghề</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-terracotta-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-lacquer-800/70">Nghề truyền thống</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-black text-emerald-600">59</span>
                <span className="text-[10px] text-emerald-700 font-bold">tiêu biểu</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-terracotta-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-lacquer-800/70">Quận/Huyện có nghề</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-black text-blue-600">24/30</span>
                <span className="text-[10px] text-blue-700 font-bold">địa phương</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-terracotta-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-lacquer-800/70">Di sản Quốc Gia</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-black text-gold-600">8</span>
                <span className="text-[10px] text-gold-700 font-bold">di sản ghi danh</span>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-terracotta-200 shadow-sm flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-lacquer-800/70">Nghề thủ công hội tụ</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="font-serif text-2xl font-black text-purple-600">47/52</span>
                <span className="text-[10px] text-purple-700 font-bold">nghề toàn quốc</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-terracotta-200 pb-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('map')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'map'
                  ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20'
                  : 'bg-white text-lacquer-800/80 hover:bg-terracotta-50 border border-terracotta-200'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>Bản đồ phân vùng ranh giới</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 font-mono">
                {CRAFT_VILLAGES.length} vùng
              </span>
            </button>

            <button
              onClick={() => setActiveTab('directory')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20'
                  : 'bg-white text-lacquer-800/80 hover:bg-terracotta-50 border border-terracotta-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Tra cứu 327 Làng nghề được công nhận</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-gold-400 text-lacquer-900 font-bold">
                Mới
              </span>
            </button>

            <button
              onClick={() => setActiveTab('featured')}
              className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'featured'
                  ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/20'
                  : 'bg-white text-lacquer-800/80 hover:bg-terracotta-50 border border-terracotta-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>16 Làng nghề tiêu biểu (Hồ sơ 360°)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: INTERACTIVE BOUNDARY MAP */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Search & Category Filter Controls */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-terracotta-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
                <input
                  type="text"
                  value={mapSearchQuery}
                  onChange={(e) => setMapSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm trong 16 làng nghề tiêu biểu (ví dụ: Bát Tràng, Quảng Phú Cầu, khảm trai, lụa, cốm...)"
                  className="w-full bg-dopaper-50 text-lacquer-900 pl-11 pr-4 py-2.5 rounded-2xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setMapSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      mapSelectedCategory === cat.id
                        ? 'bg-terracotta-500 text-white shadow'
                        : 'bg-dopaper-100 text-lacquer-800/80 hover:bg-terracotta-50 border border-terracotta-200/60'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* MAP CONTAINER */}
            <div className="relative h-[620px] w-full rounded-3xl overflow-hidden shadow-xl border border-terracotta-300">
              <VillageBoundaryMap
                villages={filteredMapVillages}
                hoveredVillageId={hoveredVillage?.slug}
                onHoverVillage={(v) => setHoveredVillage(v)}
                onSelectVillage={(v) => handleVillageClick(v)}
              />

              {/* Map Guide Overlay Banner (Top-Left) */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none">
                <div className="bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-terracotta-200/90 shadow-md flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-lacquer-900">
                    Chọn hoặc rê chuột vào biểu tượng làng nghề để xem thông tin
                  </span>
                </div>
              </div>

              {/* FLOATING HOVER CARD PREVIEW (TOP-RIGHT) */}
              {hoveredVillage && (
                <div
                  onClick={() => handleVillageClick(hoveredVillage)}
                  className="absolute top-4 right-4 z-30 w-80 sm:w-96 bg-white/98 backdrop-blur-xl rounded-3xl p-4 shadow-2xl border-2 border-terracotta-400 cursor-pointer animate-fadeIn hover:scale-[1.02] transition-transform"
                >
                  <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-gray-100 mb-3">
                    <img
                      src={hoveredVillage.heroImage}
                      alt={hoveredVillage.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-terracotta-600 text-white text-[10px] font-bold shadow">
                      {hoveredVillage.category}
                    </div>
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[11px] font-medium drop-shadow bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">
                      <MapPin className="w-3 h-3 text-gold-400" />
                      <span>{hoveredVillage.location.district}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif text-lg font-bold text-lacquer-900">
                        {hoveredVillage.name}
                      </h3>
                      <span className="text-[11px] font-semibold text-terracotta-600">
                        {hoveredVillage.history.originPeriod}
                      </span>
                    </div>

                    <p className="text-xs italic text-gold-600 line-clamp-1 font-serif">
                      "{hoveredVillage.tagline}"
                    </p>

                    <p className="text-xs text-lacquer-800/70 line-clamp-2 leading-relaxed">
                      {hoveredVillage.shortDescription}
                    </p>

                    <div className="pt-2 border-t border-terracotta-100 flex items-center justify-between">
                      <span className="text-[11px] text-lacquer-800/60 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {hoveredVillage.location.travelTime.split('bằng')[0]}
                      </span>
                      <span className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1">
                        <span>Nhấp để mở hồ sơ 360°</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Interactive Village Strip below the map */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-lacquer-900">
                  16 Vùng ranh giới làng nghề tiêu biểu hiển thị trên bản đồ
                </h3>
                <span className="text-xs text-lacquer-800/60 hidden sm:inline">
                  Rê chuột vào thẻ để làm sáng vùng ranh giới tương ứng trên bản đồ
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
                {filteredMapVillages.map((v) => {
                  const bInfo = VILLAGE_BOUNDARIES[v.slug];
                  const isHovered = hoveredVillage?.slug === v.slug;
                  return (
                    <div
                      key={v.id}
                      onMouseEnter={() => setHoveredVillage(v)}
                      onMouseLeave={() => setHoveredVillage(null)}
                      onClick={() => handleVillageClick(v)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                        isHovered
                          ? 'bg-white border-terracotta-500 shadow-lg scale-[1.03]'
                          : 'bg-white border-terracotta-200/80 hover:border-terracotta-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: bInfo?.color || '#C85A32' }}
                        />
                        <span className="font-serif text-xs font-bold text-lacquer-900 truncate">
                          {v.name}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-lacquer-800/60">
                        <span className="truncate">{v.location.district.replace('Huyện ', '').replace('Quận ', 'Q. ')}</span>
                        <span className="text-terracotta-600 font-bold shrink-0">Khám phá →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: 327 RECOGNIZED VILLAGES SEARCHABLE DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {/* Search & Filter Header Box */}
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-terracotta-200 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900">
                    Kho dữ liệu 327 Làng nghề truyền thống Hà Nội
                  </h2>
                  <p className="text-xs text-lacquer-800/70 mt-0.5">
                    Hệ thống tra cứu đầy đủ danh mục làng nghề được UBND TP. Hà Nội công nhận theo từng quận, huyện
                  </p>
                </div>

                <div className="px-3.5 py-1.5 rounded-xl bg-terracotta-50 border border-terracotta-200 text-xs font-bold text-terracotta-700 shrink-0 self-start md:self-auto">
                  Hiển thị: <strong>{totalMatchingVillages}</strong> làng nghề phù hợp
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-lacquer-800/40" />
                <input
                  type="text"
                  value={directorySearch}
                  onChange={(e) => setDirectorySearch(e.target.value)}
                  placeholder="Tìm kiếm theo tên làng, nghề, xã hoặc quận huyện (ví dụ: Chuôn Ngọ, Quảng Phú Cầu, may áo dài, khảm trai, Thường Tín...)"
                  className="w-full bg-dopaper-50 text-lacquer-900 pl-11 pr-4 py-3 rounded-2xl border border-terracotta-200 text-xs sm:text-sm focus:outline-none focus:border-terracotta-500 shadow-inner"
                />
              </div>

              {/* Recognition Type Filter */}
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-terracotta-100">
                <span className="text-xs font-bold text-lacquer-800/70 mr-1 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Phân loại:
                </span>
                <button
                  onClick={() => setSelectedTypeFilter('all')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedTypeFilter === 'all'
                      ? 'bg-lacquer-900 text-white'
                      : 'bg-dopaper-100 text-lacquer-800/80 hover:bg-terracotta-50'
                  }`}
                >
                  Tất cả ({HANOI_CRAFT_OVERVIEW.recognizedCraftVillages})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('traditional')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedTypeFilter === 'traditional'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Làng nghề truyền thống ({HANOI_CRAFT_OVERVIEW.traditionalCraftVillages})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('regular')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedTypeFilter === 'regular'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-800 border border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  Làng nghề đạt chuẩn ({HANOI_CRAFT_OVERVIEW.regularCraftVillages})
                </button>
                <button
                  onClick={() => setSelectedTypeFilter('heritage')}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                    selectedTypeFilter === 'heritage'
                      ? 'bg-gold-500 text-white'
                      : 'bg-gold-50 text-gold-900 border border-gold-200 hover:bg-gold-100'
                  }`}
                >
                  Di sản văn hóa Quốc gia ({HANOI_CRAFT_OVERVIEW.nationalIntangibleHeritages})
                </button>
              </div>

              {/* District Filter Selector Pills */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-lacquer-800/70 block">
                  Lọc theo quận / huyện:
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    onClick={() => setSelectedDistrict('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedDistrict === 'all'
                        ? 'bg-terracotta-600 text-white shadow'
                        : 'bg-white text-lacquer-800/70 border border-terracotta-200 hover:bg-terracotta-50'
                    }`}
                  >
                    Toàn thành phố ({HANOI_CRAFT_OVERVIEW.recognizedCraftVillages})
                  </button>
                  {RECOGNIZED_CRAFT_DIRECTORY.map((d) => (
                    <button
                      key={d.districtSlug}
                      onClick={() => setSelectedDistrict(d.districtSlug)}
                      className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedDistrict === d.districtSlug
                          ? 'bg-terracotta-600 text-white shadow'
                          : 'bg-white text-lacquer-800/70 border border-terracotta-200 hover:bg-terracotta-50'
                      }`}
                    >
                      {d.districtName.replace('Huyện ', '').replace('Quận ', '')} ({d.recognizedCount})
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* DIRECTORY DISTRICT GROUPS */}
            <div className="space-y-6">
              {filteredDirectory.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-terracotta-200 p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto text-xl font-bold">
                    ?
                  </div>
                  <h3 className="font-serif text-lg font-bold text-lacquer-900">
                    Không tìm thấy làng nghề phù hợp
                  </h3>
                  <p className="text-xs text-lacquer-800/70 max-w-md mx-auto">
                    Thử thay đổi từ khóa tìm kiếm hoặc bấm "Toàn thành phố" để xem toàn bộ danh mục 327 làng nghề Hà Nội.
                  </p>
                  <button
                    onClick={() => {
                      setDirectorySearch('');
                      setSelectedDistrict('all');
                      setSelectedTypeFilter('all');
                    }}
                    className="px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold"
                  >
                    Đặt lại bộ lọc
                  </button>
                </div>
              ) : (
                filteredDirectory.map((district) => {
                  const isExpanded = !!expandedDistricts[district.districtSlug];
                  return (
                    <div
                      key={district.districtSlug}
                      className="bg-white rounded-3xl border border-terracotta-200/90 shadow-sm overflow-hidden transition-all"
                    >
                      {/* District Accordion Header */}
                      <div
                        onClick={() => toggleDistrictAccordion(district.districtSlug)}
                        className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-dopaper-50/70 transition-colors border-b border-terracotta-100"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900">
                              {district.districtName}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-terracotta-100 text-terracotta-800 border border-terracotta-200">
                              {district.recognizedCount} làng nghề công nhận
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {district.traditionalCount} truyền thống tiêu biểu
                            </span>
                            <span className="text-xs text-lacquer-800/60">
                              (Tổng {district.totalVillages} làng có nghề)
                            </span>
                          </div>

                          <p className="text-xs text-lacquer-800/70 line-clamp-2 leading-relaxed">
                            {district.description}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[11px] font-semibold text-lacquer-800/60">Nghề nổi bật:</span>
                            {district.featuredCrafts.map((craft, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-dopaper-100 text-lacquer-800 text-[11px] font-medium"
                              >
                                {craft}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                          <span className="text-xs font-bold text-terracotta-600">
                            {isExpanded ? 'Thu gọn' : `Xem chi tiết (${district.villages.length})`}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-dopaper-100 flex items-center justify-center text-lacquer-800">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* District Village List (Expanded) */}
                      {isExpanded && (
                        <div className="p-4 sm:p-6 bg-dopaper-50/50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                            {district.villages.map((village, vIdx) => {
                              const hasFeaturedProfile = !!village.featuredSlug;
                              return (
                                <div
                                  key={vIdx}
                                  className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between space-y-3 ${
                                    hasFeaturedProfile
                                      ? 'border-terracotta-300 shadow-sm hover:border-terracotta-500 hover:shadow-md'
                                      : 'border-terracotta-200/80 hover:border-terracotta-300'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-start justify-between gap-2 mb-1.5">
                                      <span className="font-serif text-sm font-bold text-lacquer-900 leading-snug">
                                        {village.name}
                                      </span>
                                      {village.isNationalHeritage && (
                                        <span
                                          title="Di sản văn hóa phi vật thể Quốc Gia"
                                          className="shrink-0 px-2 py-0.5 rounded-md bg-gold-100 text-gold-900 text-[10px] font-bold border border-gold-300 flex items-center gap-1"
                                        >
                                          <Award className="w-3 h-3 text-gold-600" />
                                          Di sản QG
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-xs text-lacquer-800/70 mb-2 flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-terracotta-500 shrink-0" />
                                      <span>{village.commune}, {district.districtName}</span>
                                    </div>

                                    <p className="text-xs text-lacquer-800/80 line-clamp-2 leading-relaxed bg-dopaper-50 p-2 rounded-xl">
                                      <strong>Nghề:</strong> {village.craftName}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-terracotta-100 flex items-center justify-between">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        village.type === 'Làng nghề truyền thống'
                                          ? 'bg-emerald-100 text-emerald-800'
                                          : 'bg-blue-100 text-blue-800'
                                      }`}
                                    >
                                      {village.type}
                                    </span>

                                    {hasFeaturedProfile ? (
                                      <Link
                                        href={`/lang-nghe/${village.featuredSlug}`}
                                        className="inline-flex items-center gap-1 text-xs font-bold text-terracotta-600 hover:text-terracotta-700 bg-terracotta-50 px-2.5 py-1 rounded-lg hover:bg-terracotta-100 transition-colors"
                                      >
                                        <span>Xem hồ sơ 360°</span>
                                        <ArrowRight className="w-3 h-3" />
                                      </Link>
                                    ) : (
                                      <button
                                        onClick={() => setSelectedModalVillage(village)}
                                        className="text-[11px] font-medium text-lacquer-800/70 hover:text-terracotta-600"
                                      >
                                        Chi tiết →
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: 16 FEATURED VILLAGES WITH FULL 360° & MINI-GAMES */}
        {activeTab === 'featured' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-terracotta-200">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900">
                  16 Làng nghề tiêu biểu có hồ sơ khám phá 360° & Mini-game
                </h2>
                <p className="text-xs text-lacquer-800/70 mt-0.5">
                  Mỗi làng nghề có đầy đủ câu chuyện nguồn gốc, nghệ nhân, quy trình quay video/ảnh chi tiết và liên kết sản phẩm
                </p>
              </div>
              <span className="text-xs font-bold text-terracotta-600 shrink-0">
                16 / 327 làng nghề đã số hóa toàn diện
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {CRAFT_VILLAGES.map((village) => (
                <div
                  key={village.id}
                  onClick={() => handleVillageClick(village)}
                  className="bg-white rounded-3xl border border-terracotta-200/80 shadow-sm hover:shadow-xl hover:border-terracotta-400 transition-all duration-300 flex flex-col overflow-hidden group cursor-pointer"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
                    <img
                      src={village.heroImage}
                      alt={village.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-terracotta-700 shadow">
                      {village.category}
                    </div>

                    {village.gameUrl && (
                      <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-gold-500 text-white text-[11px] font-bold shadow flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Mini-game</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-white text-xs font-medium drop-shadow">
                      <MapPin className="w-3.5 h-3.5 text-gold-400" />
                      <span>{village.location.address}</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-xl font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                          {village.name}
                        </h3>
                      </div>
                      <p className="text-xs font-semibold text-terracotta-600 mt-0.5">
                        {village.history.originPeriod}
                      </p>

                      <p className="text-xs italic text-gold-600 line-clamp-1 font-serif mt-1">
                        "{village.tagline}"
                      </p>

                      <p className="text-xs text-lacquer-800/70 mt-2 line-clamp-3 leading-relaxed">
                        {village.shortDescription}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-terracotta-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-lacquer-800/60">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{village.location.travelTime.split('bằng')[0]}</span>
                      </div>

                      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold shadow">
                        <span>Khám phá 360°</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Modal for Recognized Village Details */}
        {selectedModalVillage && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-terracotta-300 animate-fadeIn space-y-4 relative">
              <button
                onClick={() => setSelectedModalVillage(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-dopaper-100 flex items-center justify-center text-lacquer-800 hover:bg-terracotta-100"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  {selectedModalVillage.type}
                </span>
                <h3 className="font-serif text-xl font-bold text-lacquer-900 mt-2">
                  {selectedModalVillage.name}
                </h3>
                <p className="text-xs text-lacquer-800/70 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-terracotta-500" />
                  {selectedModalVillage.commune}, Hà Nội
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-dopaper-50 border border-terracotta-200/80 space-y-2">
                <span className="text-xs font-bold text-lacquer-900 block">
                  Đặc trưng sản phẩm làng nghề:
                </span>
                <p className="text-xs text-lacquer-800 leading-relaxed">
                  {selectedModalVillage.craftName}
                </p>
              </div>

              <div className="text-xs text-lacquer-800/70 leading-relaxed">
                Nằm trong danh mục 327 làng nghề truyền thống được UBND Thành phố Hà Nội chính thức công nhận và bảo tồn phát triển theo định hướng du lịch văn hóa bền vững.
              </div>

              <div className="pt-3 border-t border-terracotta-100 flex items-center gap-3">
                <Link
                  href="/chia-se-lang-nghe"
                  className="flex-1 py-2.5 rounded-xl bg-terracotta-500 text-white text-xs font-bold text-center hover:bg-terracotta-600 transition-colors"
                >
                  Đóng góp thêm thông tin làng nghề
                </Link>
                <button
                  onClick={() => setSelectedModalVillage(null)}
                  className="px-4 py-2.5 rounded-xl bg-dopaper-100 text-lacquer-800 text-xs font-bold"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
