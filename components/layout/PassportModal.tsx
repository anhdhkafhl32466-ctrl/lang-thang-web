'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  X, Award, CheckCircle2, Lock, Sparkles, Compass, Palette, Calendar,
  Camera, Upload, Trash2, ZoomIn, Plus, ArrowRight, ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  getPassport, ALL_BADGES, PassportData, recordVillageVisit,
  addSouvenirPhoto, deleteSouvenirPhoto, compressImage, SouvenirPhoto
} from '@/lib/passportStorage';
import { CRAFT_VILLAGES } from '@/data/craftVillages';

interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PassportModal({ isOpen, onClose }: PassportModalProps) {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [activeTab, setActiveTab] = useState<'villages' | 'photos' | 'badges' | 'creations'>('villages');
  const [selectedVillageFilter, setSelectedVillageFilter] = useState<string>('all');
  const [uploadingVillageSlug, setUploadingVillageSlug] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<SouvenirPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    setPassport(getPassport());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener('passport_updated', handleUpdate);
    return () => window.removeEventListener('passport_updated', handleUpdate);
  }, []);

  if (!isOpen || !passport) return null;

  const unlockedBadgeCount = Object.keys(passport.badges).length;
  const visitedCount = passport.visitedVillages.length;
  const totalPhotos = (passport.souvenirPhotos || []).length;

  let explorerRank = 'Tập sự Di sản';
  if (passport.points >= 200) explorerRank = 'Đại sứ Văn hóa';
  else if (passport.points >= 100) explorerRank = 'Lữ khách Làng nghề';

  // Visited village objects
  const visitedVillageObjs = CRAFT_VILLAGES.filter(v => passport.visitedVillages.includes(v.slug));

  const handleManualCheckIn = (slug: string, name: string) => {
    const res = recordVillageVisit(slug);
    confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
    loadData();
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
      for (let i = 0; i < files.length; i++) {
        const compressed = await compressImage(files[i], 1000, 0.75);
        addSouvenirPhoto({
          villageSlug: uploadingVillageSlug,
          villageName,
          url: compressed,
          caption: `Kỷ niệm chuyến đi ${villageName}`
        });
      }
      confetti({ particleCount: 70, spread: 50, origin: { y: 0.6 } });
      loadData();
    } catch (err) {
      console.error('Lỗi khi nạp ảnh:', err);
      alert('Không thể nén hoặc lưu ảnh. Vui lòng thử lại.');
    } finally {
      setUploadingVillageSlug(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ảnh lưu niệm này?')) {
      deleteSouvenirPhoto(photoId);
      loadData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-lacquer-950/70 backdrop-blur-sm animate-fadeIn">
      {/* Hidden file input for quick uploads */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="bg-dopaper-50 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border-2 border-terracotta-300/80 overflow-hidden">
        {/* Header with warm cultural aesthetic */}
        <div className="bg-gradient-to-r from-terracotta-700 via-terracotta-600 to-terracotta-800 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 flex items-center justify-center text-white shadow-lg text-2xl shrink-0">
              🏮
            </div>
            <div>
              <span className="text-[11px] font-semibold tracking-wider uppercase text-gold-300 block">
                Sổ Tay Du Lịch Di Sản Thăng Long
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                Hộ Chiếu Làng Nghề Hà Nội
              </h2>
            </div>
          </div>

          {/* Stats Bar (4 columns) */}
          <div className="mt-3 pt-3 border-t border-white/20 grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
            <div className="bg-black/15 rounded-xl p-1.5 sm:p-2">
              <span className="text-[10px] sm:text-xs text-dopaper-200 block">Cấp bậc</span>
              <span className="font-semibold text-xs sm:text-sm text-gold-300 truncate block">{explorerRank}</span>
            </div>
            <div className="bg-black/15 rounded-xl p-1.5 sm:p-2">
              <span className="text-[10px] sm:text-xs text-dopaper-200 block">Điểm di sản</span>
              <span className="font-bold text-xs sm:text-base text-white">{passport.points} pts</span>
            </div>
            <div className="bg-black/15 rounded-xl p-1.5 sm:p-2">
              <span className="text-[10px] sm:text-xs text-dopaper-200 block">Đã ghé thăm</span>
              <span className="font-bold text-xs sm:text-base text-white">
                {visitedCount}/{CRAFT_VILLAGES.length}
              </span>
            </div>
            <div className="bg-black/15 rounded-xl p-1.5 sm:p-2">
              <span className="text-[10px] sm:text-xs text-dopaper-200 block">Ảnh lưu niệm</span>
              <span className="font-bold text-xs sm:text-base text-gold-300">
                {totalPhotos} ảnh
              </span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-terracotta-200 bg-dopaper-100/60 px-2 sm:px-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('villages')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'villages'
                ? 'border-terracotta-500 text-terracotta-600'
                : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Dấu ấn làng nghề ({visitedCount}/{CRAFT_VILLAGES.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'photos'
                ? 'border-terracotta-500 text-terracotta-600'
                : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Ảnh lưu niệm ({totalPhotos})</span>
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'border-terracotta-500 text-terracotta-600'
                : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Huy hiệu ({unlockedBadgeCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('creations')}
            className={`py-3 px-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'creations'
                ? 'border-terracotta-500 text-terracotta-600'
                : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Tác phẩm ảo ({passport.creations.length})</span>
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: VILLAGES (DẤU ẤN GHÉ THĂM) */}
          {activeTab === 'villages' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-lacquer-800/70">
                <span>Nhấn nút để đánh dấu làng nghề bạn đã thực tế đặt chân tới tham quan:</span>
                <span className="font-bold text-terracotta-600">Đã đi: {visitedCount}/16 làng</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CRAFT_VILLAGES.map((v) => {
                  const isVisited = passport.visitedVillages.includes(v.slug);
                  const photosForVillage = (passport.souvenirPhotos || []).filter(p => p.villageSlug === v.slug);
                  const visitDate = passport.visitedDates?.[v.slug];

                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        isVisited
                          ? 'bg-white border-terracotta-400 shadow-sm'
                          : 'bg-dopaper-100/50 border-terracotta-200/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                              isVisited
                                ? 'bg-terracotta-500 text-white shadow'
                                : 'bg-dopaper-200 text-lacquer-800/50'
                            }`}
                          >
                            {isVisited ? '✓' : '○'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-lacquer-900 leading-snug">{v.name}</h4>
                            <span className="text-[11px] text-lacquer-800/60 block">{v.category}</span>
                            {isVisited && visitDate && (
                              <span className="text-[10px] text-emerald-700 font-medium">
                                Ghé thăm: {new Date(visitDate).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        {isVisited ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full shrink-0">
                            Đã đóng dấu
                          </span>
                        ) : (
                          <button
                            onClick={() => handleManualCheckIn(v.slug, v.name)}
                            className="text-[11px] bg-gold-400 hover:bg-gold-300 text-lacquer-950 font-bold px-2.5 py-1 rounded-lg shadow-sm hover:scale-105 transition-all shrink-0"
                            title="Đánh dấu bạn đã tham quan làng nghề này"
                          >
                            + Đã đến
                          </button>
                        )}
                      </div>

                      {/* Actions below */}
                      <div className="mt-2.5 pt-2 border-t border-terracotta-100/80 flex items-center justify-between text-xs">
                        {isVisited ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedVillageFilter(v.slug);
                                setActiveTab('photos');
                              }}
                              className="text-[11px] font-semibold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
                            >
                              <Camera className="w-3 h-3" />
                              <span>{photosForVillage.length} ảnh lưu niệm</span>
                            </button>
                            <span>•</span>
                            <button
                              onClick={() => handleTriggerUpload(v.slug)}
                              className="text-[11px] font-semibold text-gold-700 hover:text-gold-800"
                            >
                              + Thêm ảnh
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-lacquer-800/50 italic">
                            Chưa ghi nhận tham quan
                          </span>
                        )}

                        <Link
                          href={`/lang-nghe/${v.slug}`}
                          onClick={onClose}
                          className="text-[11px] text-terracotta-600 hover:text-terracotta-700 font-bold underline underline-offset-2"
                        >
                          Chi tiết →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SOUVENIR PHOTOS (ẢNH LƯU NIỆM PHÂN LOẠI THEO LÀNG NGHỀ) */}
          {activeTab === 'photos' && (
            <div className="space-y-4">
              {/* Header note */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-lacquer-800/70 border-b border-terracotta-100 pb-2">
                <span>Kho ảnh lưu niệm được phân loại rõ theo từng làng nghề bạn đã tham quan:</span>
                <span className="font-bold text-terracotta-600">{totalPhotos} ảnh đã lưu</span>
              </div>

              {visitedVillageObjs.length === 0 ? (
                <div className="text-center py-10 text-lacquer-800/60 space-y-3 bg-dopaper-100/50 rounded-2xl p-6 border border-terracotta-200">
                  <div className="text-4xl">📸</div>
                  <h4 className="font-serif text-base font-bold text-lacquer-900">
                    Bạn chưa đánh dấu tham quan làng nghề nào
                  </h4>
                  <p className="text-xs max-w-md mx-auto leading-relaxed">
                    Hãy chuyển qua tab <strong>"Dấu ấn làng nghề"</strong> hoặc truy cập trang làng nghề để bấm <strong>"Đánh dấu đã tham quan"</strong>. Khi đó, mục tải ảnh lưu niệm của làng nghề đó sẽ sẵn sàng!
                  </p>
                  <button
                    onClick={() => setActiveTab('villages')}
                    className="px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-bold shadow hover:bg-terracotta-600"
                  >
                    Đến danh sách làng nghề để check-in
                  </button>
                </div>
              ) : (
                <>
                  {/* Village Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      onClick={() => setSelectedVillageFilter('all')}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                        selectedVillageFilter === 'all'
                          ? 'bg-terracotta-500 text-white shadow'
                          : 'bg-white border border-terracotta-200 text-lacquer-800 hover:bg-dopaper-100'
                      }`}
                    >
                      Tất cả ({totalPhotos})
                    </button>
                    {visitedVillageObjs.map(v => {
                      const count = (passport.souvenirPhotos || []).filter(p => p.villageSlug === v.slug).length;
                      return (
                        <button
                          key={v.slug}
                          onClick={() => setSelectedVillageFilter(v.slug)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                            selectedVillageFilter === v.slug
                              ? 'bg-terracotta-500 text-white shadow'
                              : 'bg-white border border-terracotta-200 text-lacquer-800 hover:bg-dopaper-100'
                          }`}
                        >
                          {v.name} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Grouped by Village Display */}
                  <div className="space-y-5">
                    {visitedVillageObjs
                      .filter(v => selectedVillageFilter === 'all' || selectedVillageFilter === v.slug)
                      .map(v => {
                        const villagePhotos = (passport.souvenirPhotos || []).filter(p => p.villageSlug === v.slug);
                        const visitDate = passport.visitedDates?.[v.slug];

                        return (
                          <div
                            key={v.slug}
                            className="bg-white rounded-2xl p-4 border border-terracotta-200/90 shadow-sm space-y-3"
                          >
                            {/* Village Group Header */}
                            <div className="flex items-center justify-between gap-2 border-b border-terracotta-100 pb-2.5">
                              <div>
                                <h4 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
                                  <span>{v.name}</span>
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-gold-100 text-gold-900 border border-gold-300">
                                    {villagePhotos.length} ảnh
                                  </span>
                                </h4>
                                {visitDate && (
                                  <span className="text-[10px] text-lacquer-800/60">
                                    Đã tham quan ngày: {new Date(visitDate).toLocaleDateString('vi-VN')}
                                  </span>
                                )}
                              </div>

                              <button
                                onClick={() => handleTriggerUpload(v.slug)}
                                className="px-3 py-1.5 rounded-xl bg-terracotta-50 hover:bg-terracotta-100 border border-terracotta-300 text-terracotta-700 font-bold text-xs flex items-center gap-1 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm ảnh cho làng này</span>
                              </button>
                            </div>

                            {/* Photo Grid for this Village */}
                            {villagePhotos.length === 0 ? (
                              <div className="p-4 rounded-xl border border-dashed border-terracotta-200 bg-dopaper-50/60 text-center space-y-1.5">
                                <p className="text-xs text-lacquer-800/60">
                                  Chưa có ảnh lưu niệm nào cho {v.name}.
                                </p>
                                <button
                                  onClick={() => handleTriggerUpload(v.slug)}
                                  className="text-xs text-terracotta-600 hover:text-terracotta-700 font-bold underline"
                                >
                                  + Tải ảnh bạn đã chụp lên ngay
                                </button>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                {villagePhotos.map((photo) => (
                                  <div
                                    key={photo.id}
                                    className="group relative rounded-xl overflow-hidden border border-terracotta-200 aspect-[4/3] bg-black/5"
                                  >
                                    <img
                                      src={photo.url}
                                      alt={photo.caption || 'Ảnh lưu niệm'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between text-white">
                                      <div className="flex justify-end">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePhoto(photo.id);
                                          }}
                                          className="p-1 rounded bg-red-600/80 hover:bg-red-600 text-white"
                                          title="Xóa ảnh"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                      <div
                                        onClick={() => setLightboxPhoto(photo)}
                                        className="cursor-pointer space-y-0.5"
                                      >
                                        <p className="text-[11px] font-semibold line-clamp-1">{photo.caption}</p>
                                        <span className="text-[9px] text-dopaper-200 flex items-center gap-0.5">
                                          <ZoomIn className="w-2.5 h-2.5" /> Xem lớn
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
                </>
              )}
            </div>
          )}

          {/* TAB 3: BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ALL_BADGES.map((badge) => {
                const isUnlocked = Boolean(passport.badges[badge.id]);
                return (
                  <div
                    key={badge.id}
                    className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                      isUnlocked
                        ? 'bg-white border-terracotta-300 shadow-sm'
                        : 'bg-dopaper-100/60 border-terracotta-200/50 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                        isUnlocked
                          ? 'bg-gradient-to-br from-gold-300 to-terracotta-100 shadow-inner'
                          : 'bg-gray-200 text-gray-400'
                      }`}
                    >
                      {isUnlocked ? badge.icon : <Lock className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-sm font-bold text-lacquer-900 truncate">
                          {badge.name}
                        </h4>
                        {isUnlocked && (
                          <span className="text-[10px] bg-bamboo-50 text-bamboo-700 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Mở khóa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-lacquer-800/70 mt-1 leading-snug">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: CREATIONS */}
          {activeTab === 'creations' && (
            <div className="space-y-3">
              {passport.creations.length === 0 ? (
                <div className="text-center py-8 text-lacquer-800/60 space-y-2">
                  <div className="text-4xl">🎨</div>
                  <p className="text-sm font-medium">Bạn chưa tạo tác phẩm thủ công ảo nào.</p>
                  <p className="text-xs">
                    Hãy tham gia trải nghiệm làm gốm Bát Tràng hoặc đan nón Chuông ngay!
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/trai-nghiem/gom"
                      onClick={onClose}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta-500 text-white text-xs font-semibold shadow hover:bg-terracotta-600"
                    >
                      <span>Vào xưởng gốm ảo Bát Tràng</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {passport.creations.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-white rounded-xl border border-terracotta-200 shadow-sm flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-lg bg-terracotta-50 flex items-center justify-center text-xl">
                        {c.type === 'pottery' ? '🏺' : '👒'}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-lacquer-900">{c.title}</h4>
                        <p className="text-xs text-lacquer-800/70">{c.villageName}</p>
                        <span className="text-[10px] text-lacquer-800/50 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-2.5 h-2.5" />
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

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-dopaper-100/90 border-t border-terracotta-200 flex items-center justify-between">
          <Link
            href="/ho-chieu"
            onClick={onClose}
            className="text-xs text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center gap-1"
          >
            <span>Mở trang Hộ chiếu toàn màn hình</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow"
          >
            Đóng
          </button>
        </div>
      </div>

      {/* Lightbox for Modal */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
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
            <div className="mt-2 text-center text-white space-y-1">
              <span className="px-2 py-0.5 rounded-full bg-gold-500 text-lacquer-950 text-xs font-bold inline-block">
                {lightboxPhoto.villageName}
              </span>
              <p className="text-xs text-dopaper-100">{lightboxPhoto.caption}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
