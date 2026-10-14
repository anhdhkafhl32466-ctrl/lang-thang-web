'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Award, CheckCircle2, Lock, Sparkles, Compass, Palette, Calendar,
  Camera, Upload, Trash2, ZoomIn, Plus, ArrowRight, ChevronRight, X,
  MapPin, Check, Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getPassport, ALL_BADGES, PassportData, recordVillageVisit,
  addSouvenirPhoto, deleteSouvenirPhoto, compressImage, SouvenirPhoto
} from '@/lib/passportStorage';
import { CRAFT_VILLAGES } from '@/data/craftVillages';

export default function PassportPage() {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [activeTab, setActiveTab] = useState<'photos' | 'villages' | 'badges' | 'creations'>('photos');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [uploadingVillageSlug, setUploadingVillageSlug] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<SouvenirPhoto | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setPassport(getPassport());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('passport_updated', handleUpdate);
    return () => window.removeEventListener('passport_updated', handleUpdate);
  }, []);

  if (!passport) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin text-terracotta-500 text-3xl">🏮</div>
      </div>
    );
  }

  const unlockedBadgeCount = Object.keys(passport.badges).length;
  const visitedCount = passport.visitedVillages.length;
  const totalPhotos = (passport.souvenirPhotos || []).length;

  let explorerRank = 'Tập sự Di sản';
  if (passport.points >= 200) explorerRank = 'Đại sứ Văn hóa';
  else if (passport.points >= 100) explorerRank = 'Lữ khách Làng nghề';

  const visitedVillageObjs = CRAFT_VILLAGES.filter(v => passport.visitedVillages.includes(v.slug));

  const handleManualCheckIn = (slug: string, name: string) => {
    const res = recordVillageVisit(slug);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    if (res.isNew) {
      setToastMessage(`Đã đóng dấu mộc: ${name}! (+20 điểm di sản)`);
    } else {
      setToastMessage(`Làng nghề ${name} đã được ghi nhận trong Hộ chiếu.`);
    }
    loadData();
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTriggerUpload = (villageSlug: string) => {
    setUploadingVillageSlug(villageSlug);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !uploadingVillageSlug) return;

    const targetVillage = CRAFT_VILLAGES.find(v => v.slug === uploadingVillageSlug);
    const villageName = targetVillage ? targetVillage.name : 'Làng nghề';

    try {
      let count = 0;
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1000, 0.75);
        addSouvenirPhoto({
          villageSlug: uploadingVillageSlug,
          villageName,
          url: compressed,
          caption: `Kỷ niệm chuyến đi ${villageName}`
        });
        count++;
      }
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
      setToastMessage(`Đã tải lên thành công ${count} ảnh lưu niệm cho làng ${villageName}!`);
      setTimeout(() => setToastMessage(null), 4000);
      loadData();
    } catch (err) {
      console.error('Lỗi khi nạp ảnh:', err);
      alert('Không thể lưu ảnh. Vui lòng thử lại với ảnh nhỏ hơn.');
    } finally {
      setUploadingVillageSlug(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bức ảnh lưu niệm này?')) {
      deleteSouvenirPhoto(photoId);
      loadData();
    }
  };

  return (
    <div className="min-h-screen bg-dopaper-50 pb-20">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-24 right-4 z-50 bg-white border-2 border-gold-400 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-gold-400 flex items-center justify-center text-xl shadow shrink-0">
            🏮
          </div>
          <div>
            <span className="text-xs font-bold text-terracotta-700 block uppercase">
              Hộ Chiếu Làng Nghề
            </span>
            <p className="text-xs font-semibold text-lacquer-900 leading-snug">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-r from-terracotta-800 via-terracotta-700 to-terracotta-900 text-white pt-24 pb-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto space-y-6 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-dopaper-200/80">
            <Link href="/" className="hover:text-white">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gold-300 font-semibold">Hộ chiếu làng nghề</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-3xl bg-gold-500 flex items-center justify-center text-white shadow-xl text-3xl shrink-0">
                🏮
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold tracking-wider uppercase text-gold-300 block">
                  Sổ Tay Du Lịch Di Sản Thăng Long — Hà Nội
                </span>
                <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                  Hộ Chiếu Làng Nghề Điện Tử
                </h1>
                <p className="text-xs sm:text-sm text-dopaper-200/90 max-w-xl">
                  Ghi dấu từng bước chân qua 16 ngôi làng truyền thống, lưu giữ trọn vẹn ảnh lưu niệm thực tế và mở khóa các huy hiệu du khách văn hóa.
                </p>
              </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 bg-black/20 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-white/20 text-center shrink-0">
              <div className="p-2">
                <span className="text-[11px] text-dopaper-300 block">Cấp bậc</span>
                <span className="font-bold text-sm text-gold-300 block truncate">{explorerRank}</span>
              </div>
              <div className="p-2">
                <span className="text-[11px] text-dopaper-300 block">Điểm di sản</span>
                <span className="font-bold text-base text-white block">{passport.points} pts</span>
              </div>
              <div className="p-2">
                <span className="text-[11px] text-dopaper-300 block">Đã tham quan</span>
                <span className="font-bold text-base text-white block">{visitedCount}/16</span>
              </div>
              <div className="p-2">
                <span className="text-[11px] text-dopaper-300 block">Ảnh lưu niệm</span>
                <span className="font-bold text-base text-gold-300 block">{totalPhotos} ảnh</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Navigation Tabs Bar */}
        <div className="bg-white rounded-2xl p-1.5 shadow-md border border-terracotta-200/80 flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'photos'
                ? 'bg-terracotta-500 text-white shadow-sm'
                : 'text-lacquer-800 hover:bg-dopaper-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Kho Ảnh Lưu Niệm ({totalPhotos})</span>
          </button>

          <button
            onClick={() => setActiveTab('villages')}
            className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'villages'
                ? 'bg-terracotta-500 text-white shadow-sm'
                : 'text-lacquer-800 hover:bg-dopaper-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Dấu Ấn 16 Làng Nghề ({visitedCount}/16)</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'badges'
                ? 'bg-terracotta-500 text-white shadow-sm'
                : 'text-lacquer-800 hover:bg-dopaper-100'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Huy Hiệu ({unlockedBadgeCount}/8)</span>
          </button>

          <button
            onClick={() => setActiveTab('creations')}
            className={`flex-1 min-w-[130px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'creations'
                ? 'bg-terracotta-500 text-white shadow-sm'
                : 'text-lacquer-800 hover:bg-dopaper-100'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Tác Phẩm Ảo ({passport.creations.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="mt-8 space-y-6">
          {/* TAB 1: SOUVENIR PHOTOS (PHÂN LOẠI THEO TỪNG LÀNG NGHỀ) */}
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-terracotta-200/80 shadow-sm space-y-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-xs font-bold uppercase tracking-wider mb-2 border border-gold-300">
                    <Camera className="w-3.5 h-3.5 text-gold-600" />
                    <span>Bộ Sưu Tập Kỷ Niệm Thực Tế</span>
                  </div>
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                    Ảnh lưu niệm phân loại theo từng làng nghề
                  </h2>
                  <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1">
                    Mỗi bức ảnh bạn chụp khi tham quan sẽ được sắp xếp riêng theo từng ngôi làng, lưu giữ khoảnh khắc thanh xuân cùng di sản.
                  </p>
                </div>

                {visitedVillageObjs.length === 0 ? (
                  <div className="text-center py-12 bg-dopaper-50 rounded-2xl border-2 border-dashed border-terracotta-200 p-8 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-gold-100 text-gold-700 flex items-center justify-center mx-auto text-3xl shadow-sm">
                      📸
                    </div>
                    <div className="space-y-1.5 max-w-md mx-auto">
                      <h3 className="font-serif text-lg font-bold text-lacquer-900">
                        Bạn chưa ghi nhận tham quan làng nghề nào
                      </h3>
                      <p className="text-xs sm:text-sm text-lacquer-800/70 leading-relaxed">
                        Hãy chuyển qua mục <strong>"Dấu Ấn 16 Làng Nghề"</strong> để bấm xác nhận những ngôi làng bạn đã tới, hoặc truy cập trang chi tiết từng làng nghề để bấm <strong>"Đánh dấu đã tham quan"</strong>.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('villages')}
                      className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow-md transition-all"
                    >
                      Đến danh sách 16 làng nghề để check-in
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-terracotta-100 pb-3">
                      <button
                        onClick={() => setSelectedVillageFilter('all')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          selectedVillageFilter === 'all'
                            ? 'bg-terracotta-500 text-white shadow'
                            : 'bg-dopaper-100 hover:bg-dopaper-200 text-lacquer-800'
                        }`}
                      >
                        Tất cả các làng ({totalPhotos} ảnh)
                      </button>
                      {visitedVillageObjs.map(v => {
                        const count = (passport.souvenirPhotos || []).filter(p => p.villageSlug === v.slug).length;
                        return (
                          <button
                            key={v.slug}
                            onClick={() => setSelectedVillageFilter(v.slug)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                              selectedVillageFilter === v.slug
                                ? 'bg-terracotta-500 text-white shadow'
                                : 'bg-dopaper-100 hover:bg-dopaper-200 text-lacquer-800'
                            }`}
                          >
                            {v.name} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Grouped village sections */}
                    <div className="space-y-8">
                      {visitedVillageObjs
                        .filter(v => selectedVillageFilter === 'all' || selectedVillageFilter === v.slug)
                        .map(v => {
                          const villagePhotos = (passport.souvenirPhotos || []).filter(p => p.villageSlug === v.slug);
                          const visitDate = passport.visitedDates?.[v.slug];

                          return (
                            <div
                              key={v.slug}
                              className="rounded-3xl border border-terracotta-200/90 bg-white p-6 shadow-sm space-y-4"
                            >
                              {/* Header for this village */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terracotta-100 pb-3">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-serif text-xl font-bold text-lacquer-900">
                                      {v.name}
                                    </h3>
                                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-900 border border-gold-300">
                                      {villagePhotos.length} ảnh
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-lacquer-800/60 mt-1">
                                    <span>Nghề: {v.category}</span>
                                    {visitDate && (
                                      <>
                                        <span>•</span>
                                        <span>Ghé thăm: {new Date(visitDate).toLocaleDateString('vi-VN')}</span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleTriggerUpload(v.slug)}
                                    className="px-3.5 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <span>+ Thêm ảnh lưu niệm</span>
                                  </button>
                                  <Link
                                    href={`/lang-nghe/${v.slug}`}
                                    className="px-3 py-2 rounded-xl border border-terracotta-200 text-lacquer-800 hover:bg-dopaper-100 text-xs font-semibold"
                                  >
                                    Xem làng nghề
                                  </Link>
                                </div>
                              </div>

                              {/* Photo Grid */}
                              {villagePhotos.length === 0 ? (
                                <div className="p-6 rounded-2xl border-2 border-dashed border-terracotta-200 bg-dopaper-50/50 text-center space-y-2">
                                  <p className="text-xs sm:text-sm text-lacquer-800/70">
                                    Chưa có bức ảnh lưu niệm nào cho {v.name}.
                                  </p>
                                  <button
                                    onClick={() => handleTriggerUpload(v.slug)}
                                    className="text-xs text-terracotta-600 hover:text-terracotta-700 font-bold underline"
                                  >
                                    + Tải lên những bức ảnh bạn đã chụp tại {v.name}
                                  </button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                  {villagePhotos.map((photo) => (
                                    <div
                                      key={photo.id}
                                      className="group relative rounded-2xl overflow-hidden border border-terracotta-200 aspect-[4/3] bg-black/5 shadow-sm hover:shadow-md transition-all"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.caption || 'Ảnh lưu niệm'}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      {/* Overlay */}
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex flex-col justify-between text-white">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] bg-black/60 px-2 py-0.5 rounded-full text-gold-300">
                                            {new Date(photo.date).toLocaleDateString('vi-VN')}
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeletePhoto(photo.id);
                                            }}
                                            className="p-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white"
                                            title="Xóa ảnh này"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                        <div
                                          onClick={() => setLightboxPhoto(photo)}
                                          className="cursor-pointer space-y-0.5"
                                        >
                                          <p className="text-xs font-semibold line-clamp-1">{photo.caption}</p>
                                          <span className="text-[10px] text-dopaper-200 flex items-center gap-1">
                                            <ZoomIn className="w-3 h-3" /> Bấm để xem lớn
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: VILLAGES CHECK-IN (DẤU ẤN 16 LÀNG NGHỀ) */}
          {activeTab === 'villages' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-terracotta-200/80 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terracotta-100 pb-4">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-lacquer-900">
                    Dấu ấn 16 Làng nghề truyền thống
                  </h2>
                  <p className="text-xs sm:text-sm text-lacquer-800/70 mt-0.5">
                    Chỉ cần bấm nút "Đánh dấu đã tham quan", ngôi làng sẽ lập tức được đóng dấu mộc đỏ vào Hộ Chiếu của bạn.
                  </p>
                </div>
                <div className="px-3.5 py-1.5 rounded-full bg-gold-100 text-gold-900 border border-gold-300 text-xs font-bold shrink-0">
                  Tiến độ: {visitedCount}/16 làng nghề
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {CRAFT_VILLAGES.map((v) => {
                  const isVisited = passport.visitedVillages.includes(v.slug);
                  const visitDate = passport.visitedDates?.[v.slug];
                  const photosCount = (passport.souvenirPhotos || []).filter(p => p.villageSlug === v.slug).length;

                  return (
                    <div
                      key={v.id}
                      className={`rounded-2xl p-4 border transition-all flex flex-col justify-between ${
                        isVisited
                          ? 'bg-gradient-to-br from-white to-dopaper-100/60 border-terracotta-400 shadow-md'
                          : 'bg-dopaper-50/70 border-terracotta-200/60 opacity-90'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-terracotta-600 uppercase">
                            {v.category}
                          </span>
                          {isVisited ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Đã đóng dấu</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-lacquer-800/50">Chưa ghé thăm</span>
                          )}
                        </div>

                        <h3 className="font-serif text-base font-bold text-lacquer-900">
                          {v.name}
                        </h3>

                        <p className="text-xs text-lacquer-800/70 line-clamp-2">
                          {v.shortDescription}
                        </p>

                        {isVisited && (
                          <div className="pt-1 text-[11px] text-lacquer-800/60 flex items-center justify-between">
                            <span>Ngày đến: {visitDate ? new Date(visitDate).toLocaleDateString('vi-VN') : 'Ghi nhận'}</span>
                            <span className="font-bold text-terracotta-600">{photosCount} ảnh</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-terracotta-100 flex items-center justify-between gap-2 mt-3">
                        {!isVisited ? (
                          <button
                            onClick={() => handleManualCheckIn(v.slug, v.name)}
                            className="w-full py-2 px-3 rounded-xl bg-gold-400 hover:bg-gold-300 text-lacquer-950 font-bold text-xs shadow-sm hover:scale-102 transition-all flex items-center justify-center gap-1.5"
                          >
                            <span>🏮</span>
                            <span>Đánh dấu đã tham quan (+20đ)</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setSelectedVillageFilter(v.slug);
                                setActiveTab('photos');
                              }}
                              className="text-xs text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center gap-1"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Xem {photosCount} ảnh</span>
                            </button>
                            <Link
                              href={`/lang-nghe/${v.slug}`}
                              className="text-xs text-lacquer-800 hover:text-lacquer-950 font-semibold underline"
                            >
                              Xem trang →
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BADGES (HUY HIỆU DI SẢN) */}
          {activeTab === 'badges' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-terracotta-200/80 shadow-sm space-y-6">
              <div className="border-b border-terracotta-100 pb-4">
                <h2 className="font-serif text-2xl font-bold text-lacquer-900">
                  Hệ thống 8 Huy hiệu Di sản Văn hóa
                </h2>
                <p className="text-xs sm:text-sm text-lacquer-800/70 mt-0.5">
                  Mỗi hành động trải nghiệm thực tế, làm sản phẩm thủ công ảo hoặc lưu ảnh kỷ niệm đều giúp bạn mở khóa các huy hiệu danh giá.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_BADGES.map((badge) => {
                  const isUnlocked = Boolean(passport.badges[badge.id]);
                  const dateUnlocked = passport.badges[badge.id];

                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isUnlocked
                          ? 'bg-white border-terracotta-400 shadow-sm'
                          : 'bg-dopaper-100/50 border-terracotta-200/50 opacity-60'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-gold-300 to-terracotta-100 shadow-inner'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {isUnlocked ? badge.icon : <Lock className="w-5 h-5 text-gray-400" />}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-lacquer-900 truncate">
                            {badge.name}
                          </h4>
                          {isUnlocked && (
                            <span className="text-[10px] bg-bamboo-50 text-bamboo-700 font-semibold px-2 py-0.5 rounded-full flex items-center gap-0.5 shrink-0">
                              <CheckCircle2 className="w-3 h-3" /> Mở khóa
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-lacquer-800/70 leading-relaxed">
                          {badge.description}
                        </p>

                        {isUnlocked && dateUnlocked && (
                          <span className="text-[10px] text-lacquer-800/50 block pt-1">
                            Ngày đạt: {new Date(dateUnlocked).toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: VIRTUAL CREATIONS (TÁC PHẨM ẢO) */}
          {activeTab === 'creations' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-terracotta-200/80 shadow-sm space-y-6">
              <div className="border-b border-terracotta-100 pb-4">
                <h2 className="font-serif text-2xl font-bold text-lacquer-900">
                  Tác phẩm thủ công nghệ thuật ảo
                </h2>
                <p className="text-xs sm:text-sm text-lacquer-800/70 mt-0.5">
                  Những sản phẩm bạn tự tay vuốt gốm Bát Tràng hoặc đan nón làng Chuông trên nền tảng số.
                </p>
              </div>

              {passport.creations.length === 0 ? (
                <div className="text-center py-12 text-lacquer-800/60 space-y-3 bg-dopaper-50 rounded-2xl p-6 border-2 border-dashed border-terracotta-200">
                  <div className="text-4xl">🎨</div>
                  <h4 className="font-serif text-base font-bold text-lacquer-900">
                    Bạn chưa tạo tác phẩm thủ công ảo nào
                  </h4>
                  <p className="text-xs max-w-md mx-auto">
                    Hãy tham gia trải nghiệm làm gốm Bát Tràng ngay trên bàn xoay trực tuyến để thêm tác phẩm vào Hộ Chiếu của bạn!
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/trai-nghiem/gom"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow"
                    >
                      <span>Vào xưởng gốm ảo Bát Tràng</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {passport.creations.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-white rounded-2xl border border-terracotta-200 shadow-sm flex items-center gap-3.5"
                    >
                      <div className="w-12 h-12 rounded-xl bg-terracotta-50 flex items-center justify-center text-2xl shrink-0">
                        {c.type === 'pottery' ? '🏺' : '👒'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-lacquer-900 truncate">{c.title}</h4>
                        <p className="text-xs text-lacquer-800/70">{c.villageName}</p>
                        <span className="text-[10px] text-lacquer-800/50 flex items-center gap-1 mt-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(c.date).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxPhoto(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxPhoto.url}
              alt={lightboxPhoto.caption || 'Ảnh lưu niệm'}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <div className="mt-3 text-center text-white space-y-1">
              <span className="px-3 py-1 rounded-full bg-gold-500 text-lacquer-950 text-xs font-bold inline-block">
                {lightboxPhoto.villageName}
              </span>
              <p className="text-sm font-medium text-dopaper-100">{lightboxPhoto.caption}</p>
              <span className="text-xs text-dopaper-300 block">
                {new Date(lightboxPhoto.date).toLocaleDateString('vi-VN')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
