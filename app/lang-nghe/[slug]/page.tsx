'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound, useParams } from 'next/navigation';
import { CRAFT_VILLAGES, CraftVillage } from '@/data/craftVillages';
import { PRODUCTS } from '@/data/products';
import { TOURS } from '@/data/tours';
import {
  recordVillageVisit, getPassport, addSouvenirPhoto, deleteSouvenirPhoto,
  compressImage, SouvenirPhoto
} from '@/lib/passportStorage';
import confetti from 'canvas-confetti';
import { formatCurrencyVND } from '@/lib/utils';
import {
  MapPin, Clock, Calendar, Compass, Sparkles, ArrowRight, CheckCircle2,
  Share2, Award, ChevronRight, Eye, ExternalLink, Info, Play, X, Palette, Shield,
  Camera, Upload, Trash2, ZoomIn, Check, Plus, Image as ImageIcon, Navigation
} from 'lucide-react';
import BatTrangPotteryGame from '@/components/craft/BatTrangPotteryGame';
import VanPhucSilkGame from '@/components/craft/VanPhucSilkGame';

export default function CraftVillageDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const village = CRAFT_VILLAGES.find((v) => v.slug === slug);
  const [selectedImage, setSelectedImage] = useState<{ url: string; caption: string; credit?: string } | null>(null);
  const [activeStep, setActiveStep] = useState<number>(1);
  const [stampNotification, setStampNotification] = useState<string | null>(null);

  // Passport & Souvenir Photos state
  const [isVisited, setIsVisited] = useState<boolean>(false);
  const [visitedDate, setVisitedDate] = useState<string | null>(null);
  const [souvenirPhotos, setSouvenirPhotos] = useState<SouvenirPhoto[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [lightboxSouvenir, setLightboxSouvenir] = useState<SouvenirPhoto | null>(null);
  const [newPhotoCaption, setNewPhotoCaption] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const refreshPassportData = React.useCallback(() => {
    if (!village) return;
    const p = getPassport();
    const visited = p.visitedVillages.includes(village.slug);
    setIsVisited(visited);
    setVisitedDate(p.visitedDates?.[village.slug] || null);
    setSouvenirPhotos((p.souvenirPhotos || []).filter(item => item.villageSlug === village.slug));
  }, [village]);

  useEffect(() => {
    refreshPassportData();
    window.addEventListener('passport_updated', refreshPassportData);
    return () => window.removeEventListener('passport_updated', refreshPassportData);
  }, [refreshPassportData]);

  const handleManualCheckIn = () => {
    if (!village) return;
    const result = recordVillageVisit(village.slug);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    if (result.isNew) {
      let msg = `Đã đóng dấu mộc: ${village.name}! (+20 điểm di sản)`;
      if (result.newBadge) {
        msg += ` • Nhận huy hiệu: ${result.newBadge.name}!`;
      }
      setStampNotification(msg);
    } else {
      setStampNotification(`Làng nghề ${village.name} đã được đóng dấu trong Hộ chiếu!`);
    }
    refreshPassportData();
    setTimeout(() => setStampNotification(null), 4500);
  };

  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !village) return;

    setIsUploading(true);
    try {
      let count = 0;
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressed = await compressImage(file, 1000, 0.75);
        const res = addSouvenirPhoto({
          villageSlug: village.slug,
          villageName: village.name,
          url: compressed,
          caption: newPhotoCaption.trim() || `Kỷ niệm chuyến đi ${village.name}`
        });
        count++;
        if (res.newBadge) {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
          setStampNotification(`Mở khóa huy hiệu mới: ${res.newBadge.name}! 📸`);
          setTimeout(() => setStampNotification(null), 4500);
        }
      }
      setNewPhotoCaption('');
      refreshPassportData();
      if (!stampNotification) {
        setStampNotification(`Đã thêm thành công ${count} ảnh lưu niệm cho làng ${village.name}!`);
        setTimeout(() => setStampNotification(null), 4000);
      }
    } catch (err) {
      console.error('Lỗi tải ảnh:', err);
      alert('Có lỗi xảy ra khi nạp ảnh. Vui lòng thử lại với ảnh nhỏ hơn.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = (photoId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ảnh lưu niệm này khỏi Hộ chiếu không?')) {
      deleteSouvenirPhoto(photoId);
      refreshPassportData();
    }
  };

  if (!village) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <h2 className="font-serif text-2xl font-bold text-lacquer-900 mb-2">
          Không tìm thấy làng nghề
        </h2>
        <p className="text-sm text-lacquer-800/70 mb-4">
          Làng nghề bạn đang tìm kiếm có thể chưa được cập nhật dữ liệu.
        </p>
        <Link
          href="/lang-nghe"
          className="px-5 py-2.5 rounded-xl bg-terracotta-500 text-white font-semibold text-sm"
        >
          Quay lại danh mục làng nghề
        </Link>
      </div>
    );
  }

  const villageProducts = PRODUCTS.filter((p) => p.villageId === village.id);
  const villageTours = TOURS.filter((t) => t.villageId === village.id);

  return (
    <div className="min-h-screen bg-dopaper-50 pb-20">
      {/* Stamp Notification Popup */}
      {stampNotification && (
        <div className="fixed top-24 right-4 z-50 bg-white border-2 border-gold-400 p-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce max-w-sm">
          <div className="w-10 h-10 rounded-xl bg-gold-400 flex items-center justify-center text-xl shadow shrink-0">
            🏮
          </div>
          <div>
            <span className="text-xs font-bold text-terracotta-700 block uppercase">
              Hộ Chiếu Làng Nghề
            </span>
            <p className="text-xs font-semibold text-lacquer-900 leading-snug">
              {stampNotification}
            </p>
          </div>
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative min-h-[60vh] lg:min-h-[70vh] flex items-end overflow-hidden pb-12 pt-20">
        <div className="absolute inset-0 z-0">
          <img
            src={village.heroImage}
            alt={village.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-lacquer-950 via-lacquer-950/60 to-black/30" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-white">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-xs text-dopaper-200/80 mb-4">
            <Link href="/" className="hover:text-white">Trang chủ</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/lang-nghe" className="hover:text-white">Làng nghề</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gold-300 font-semibold">{village.name}</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-terracotta-500 text-white text-xs font-bold shadow">
                  {village.category}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-medium text-gold-300">
                  {village.history.originPeriod}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white">
                {village.name}
              </h1>

              <p className="font-serif italic text-base sm:text-xl text-gold-200/95 font-light">
                "{village.tagline}"
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-dopaper-200/80 pt-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gold-400" />
                  {village.location.address}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-gold-400" />
                  {village.location.travelTime}
                </span>
              </div>
            </div>

            {/* Action buttons: Check-in, Mini-game, and Chỉ đường GPS */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Manual Check-in Button */}
              {!isVisited ? (
                <button
                  onClick={handleManualCheckIn}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-terracotta-500 via-gold-500 to-terracotta-600 hover:from-terracotta-600 hover:to-gold-600 text-white font-bold text-sm shadow-xl hover:scale-105 transition-all border border-gold-300/40"
                  title="Bấm để ghi nhận bạn đã trực tiếp ghé thăm làng nghề này"
                >
                  <span className="text-base">🏮</span>
                  <span>Đánh dấu đã tham quan</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-950/80 backdrop-blur-md border border-emerald-400/60 text-emerald-300 font-semibold text-xs sm:text-sm shadow-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Đã ghé thăm & đóng dấu</span>
                  {visitedDate && (
                    <span className="text-[11px] text-emerald-300/80">
                      ({new Date(visitedDate).toLocaleDateString('vi-VN')})
                    </span>
                  )}
                  {souvenirPhotos.length > 0 && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-[11px] text-emerald-200">
                      {souvenirPhotos.length} ảnh
                    </span>
                  )}
                </div>
              )}

              {/* Quick action button for mini-game */}
              {village.slug === 'bat-trang' ? (
                <a
                  href="#tro-choi-nan-gom"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gold-400 hover:bg-gold-300 text-lacquer-950 font-bold text-sm shadow-xl hover:scale-105 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-lacquer-950" />
                  <span>Chơi mini game nặn gốm</span>
                </a>
              ) : village.slug === 'van-phuc' ? (
                <a
                  href="#tro-choi-det-lua"
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-sm shadow-xl hover:scale-105 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Chơi mini game dệt lụa</span>
                </a>
              ) : village.gameUrl ? (
                <Link
                  href={village.gameUrl}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-gold-400 hover:bg-gold-300 text-lacquer-950 font-bold text-sm shadow-xl hover:scale-105 transition-all"
                >
                  <Sparkles className="w-4 h-4 text-lacquer-950" />
                  <span>Trải nghiệm làm nghề ảo</span>
                </Link>
              ) : null}

              {/* Chỉ đường tới làng nghề qua Bản đồ tương tác */}
              <Link
                href={`/ban-do?to=${village.slug}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 hover:bg-white/25 text-white font-bold text-sm shadow-xl transition-all hover:scale-105"
              >
                <Navigation className="w-4 h-4" />
                <span>Chỉ đường tới làng nghề</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Main Content Tabs & Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        {/* Quick Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded-2xl border border-terracotta-200 shadow-sm">
            <span className="text-xs text-lacquer-800/60 block">Thời gian tham quan tốt nhất</span>
            <span className="text-sm font-bold text-lacquer-900 mt-1 block">
              {village.bestTimeToVisit}
            </span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-terracotta-200 shadow-sm">
            <span className="text-xs text-lacquer-800/60 block">Giờ mở cửa</span>
            <span className="text-sm font-bold text-lacquer-900 mt-1 block">
              {village.openingHours}
            </span>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-terracotta-200 shadow-sm">
            <span className="text-xs text-lacquer-800/60 block">Chi phí tham khảo</span>
            <span className="text-sm font-bold text-lacquer-900 mt-1 block">
              {village.ticketPrice}
            </span>
          </div>
        </div>

        {/* 2.2 Mục Ảnh Lưu Niệm Cá Nhân Hóa (Phân loại theo làng nghề này) */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-terracotta-200/90 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-terracotta-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-xs font-bold uppercase tracking-wider mb-2 border border-gold-300">
                <Camera className="w-3.5 h-3.5 text-gold-600" />
                <span>Hộ Chiếu Di Sản • Kỷ Niệm Chuyến Đi</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 flex items-center gap-2">
                <span>Ảnh lưu niệm tại {village.name}</span>
                {souvenirPhotos.length > 0 && (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-terracotta-100 text-terracotta-700">
                    {souvenirPhotos.length} ảnh
                  </span>
                )}
              </h2>
              <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1">
                Lưu giữ những khoảnh khắc, góc check-in và sản phẩm bạn tự làm khi đặt chân tới {village.name}.
              </p>
            </div>

            {/* Upload Button (only if visited) */}
            {isVisited ? (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  onChange={handleUploadPhotos}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow hover:scale-105 transition-all disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploading ? 'Đang nén & lưu...' : '+ Tải ảnh lưu niệm lên'}</span>
                </button>
              </div>
            ) : null}
          </div>

          {/* If NOT visited yet */}
          {!isVisited ? (
            <div className="bg-gradient-to-r from-dopaper-100/90 to-amber-50/60 rounded-2xl p-6 sm:p-8 border border-terracotta-200 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-terracotta-100 text-terracotta-600 flex items-center justify-center mx-auto text-2xl shadow-sm">
                🏮
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <h3 className="font-serif text-lg sm:text-xl font-bold text-lacquer-900">
                  Bạn đã ghé thăm {village.name} chưa?
                </h3>
                <p className="text-xs sm:text-sm text-lacquer-800/70 leading-relaxed">
                  Để đảm bảo tính xác thực của Hộ chiếu di sản, tính năng đăng ảnh lưu niệm sẽ được mở khóa ngay khi bạn bấm nút xác nhận đã trực tiếp tham quan làng nghề này.
                </p>
              </div>
              <div className="pt-2">
                <button
                  onClick={handleManualCheckIn}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-terracotta-500 to-gold-500 hover:from-terracotta-600 hover:to-gold-600 text-white font-bold text-xs sm:text-sm shadow-md hover:scale-105 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tôi đã tham quan {village.name}! Đóng dấu & Mở khóa</span>
                </button>
              </div>
            </div>
          ) : souvenirPhotos.length === 0 ? (
            /* If visited but no photos yet */
            <div className="border-2 border-dashed border-terracotta-200 rounded-2xl p-8 text-center space-y-3 bg-dopaper-50/50">
              <div className="w-12 h-12 rounded-xl bg-gold-100 text-gold-700 flex items-center justify-center mx-auto">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-lacquer-900">
                  Chưa có ảnh lưu niệm nào cho làng nghề này
                </p>
                <p className="text-xs text-lacquer-800/70 max-w-md mx-auto">
                  Bạn đã đóng dấu mộc ghé thăm {village.name}. Hãy tải lên những bức ảnh chụp cổng làng, góc sống ảo triệu view hoặc sản phẩm tự làm để lưu giữ vào Hộ Chiếu!
                </p>
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs shadow hover:scale-105 transition-all disabled:opacity-50"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Đang nén & lưu ảnh...' : 'Tải bức ảnh lưu niệm đầu tiên lên (+15 điểm)'}</span>
              </button>
            </div>
          ) : (
            /* If visited and has photos */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {souvenirPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative rounded-2xl overflow-hidden border border-terracotta-200 bg-black/5 aspect-[4/3] shadow-sm hover:shadow-md transition-all"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Ảnh lưu niệm'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Overlay controls on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex flex-col justify-between text-white">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-full text-gold-300">
                          {new Date(photo.date).toLocaleDateString('vi-VN')}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePhoto(photo.id);
                          }}
                          className="p-1 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                          title="Xóa ảnh này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div
                        onClick={() => setLightboxSouvenir(photo)}
                        className="cursor-pointer space-y-1"
                      >
                        <p className="text-xs font-semibold line-clamp-2 leading-tight">
                          {photo.caption || `Kỷ niệm ${village.name}`}
                        </p>
                        <span className="text-[10px] text-dopaper-200 flex items-center gap-1 font-medium">
                          <ZoomIn className="w-3 h-3" /> Nhấp để xem lớn
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom footer bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-lacquer-800/70 border-t border-terracotta-100">
                <div className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ảnh được tự động nén tối ưu và phân loại riêng vào mục {village.name} trong Hộ chiếu.</span>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-terracotta-600 hover:text-terracotta-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm ảnh khác</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 3. Lịch sử & Dòng thời gian */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/80 shadow-sm space-y-6">
          <div className="border-b border-terracotta-100 pb-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-wider mb-1">
              <Compass className="w-4 h-4" />
              <span>Cội Nguồn Di Sản</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
              Lịch sử hình thành & Giá trị văn hóa
            </h2>
          </div>

          <p className="text-sm sm:text-base text-lacquer-800/80 leading-relaxed">
            {village.history.culturalSignificance}
          </p>

          {/* Trích dẫn lịch sử Dư địa chí */}
          {village.historicalQuote && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-dopaper-100 via-white to-dopaper-100 border-l-4 border-terracotta-500 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-terracotta-600 uppercase tracking-wider block">
                Ghi chép lịch sử tiền nhân ({village.historicalQuote.source})
              </span>
              <blockquote className="font-serif text-xl sm:text-2xl font-bold text-terracotta-800 italic">
                {village.historicalQuote.quote}
              </blockquote>
            </div>
          )}

          {village.history.founder && (
            <div className="p-4 rounded-2xl bg-dopaper-100/80 border-l-4 border-gold-500 text-xs sm:text-sm text-lacquer-800/90 italic">
              <strong>Tổ nghề / Tiền nhân:</strong> {village.history.founder}
            </div>
          )}

          {/* Timeline Milestones */}
          <div className="mt-8 relative border-l-2 border-terracotta-300 ml-4 space-y-8 pb-4">
            {village.history.milestones.map((milestone, idx) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-terracotta-500 border-2 border-white shadow" />
                <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wide">
                  {milestone.period}
                </span>
                <h3 className="font-serif text-lg font-bold text-lacquer-900 mt-0.5">
                  {milestone.title}
                </h3>
                <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1 leading-relaxed">
                  {milestone.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 3.1 Đặc điểm nổi bật của làng nghề */}
        {village.specialHighlights && village.specialHighlights.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/80 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Giá Trị Tinh Hoa</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                Đặc điểm nổi bật của {village.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {village.specialHighlights.map((hl, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl bg-dopaper-50/80 border border-terracotta-200/90 overflow-hidden hover:border-terracotta-400 transition-all shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  {hl.image && (
                    <div className="aspect-[16/10] overflow-hidden bg-dopaper-200">
                      <img
                        src={hl.image}
                        alt={hl.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[11px] font-bold text-terracotta-600 uppercase mb-1">
                        Đặc trưng 0{idx + 1}
                      </div>
                      <h3 className="font-serif text-lg font-bold text-lacquer-900 leading-snug">
                        {hl.title}
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-lacquer-800/80 leading-relaxed pt-2 border-t border-terracotta-100">
                      {hl.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3.2 Bảng 4 dòng sản phẩm gốm sứ đặc trưng kèm hình ảnh */}
        {village.productCategoriesTable && village.productCategoriesTable.length > 0 && (
          <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/80 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-wider mb-1">
                <Award className="w-4 h-4" />
                <span>Hệ Thống Sản Phẩm</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                Các dòng sản phẩm gốm sứ đặc trưng
              </h2>
              <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1">
                Phân loại 4 nhóm mặt hàng truyền thống và ứng dụng tiêu biểu theo tài liệu chính thức của làng nghề
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {village.productCategoriesTable.map((row, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-terracotta-200 bg-dopaper-50/50 overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
                >
                  {row.image && (
                    <div className="aspect-[4/3] overflow-hidden bg-dopaper-200">
                      <img
                        src={row.image}
                        alt={row.category}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                    <h3 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-terracotta-500 shrink-0" />
                      <span>{row.category}</span>
                    </h3>
                    <p className="text-xs text-lacquer-800/80 leading-relaxed">
                      {row.features}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 3.3 MỤC TRÒ CHƠI MÔ PHỎNG NẶN GỐM BÁT TRÀNG (Nhúng trực tiếp) */}
        {village.slug === 'bat-trang' && (
          <section id="tro-choi-nan-gom" className="space-y-6 pt-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-terracotta-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-100 text-gold-900 text-xs font-bold uppercase tracking-wider mb-2 border border-gold-300">
                  <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                  <span>Trải Nghiệm Trực Tuyến Tương Tác</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-lacquer-900">
                  Trò chơi mô phỏng: Nặn Gốm Bát Tràng
                </h2>
                <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1">
                  Tự tay nặn gốm 5 bước: Thấu đất → Chuốt bàn xoay → Vẽ hoa văn → Tráng men cổ → Canh nhiệt nung lò 1.200°C
                </p>
              </div>

              <div className="text-xs text-lacquer-800/60 italic hidden sm:block">
                Có thể lưu ảnh thành phẩm về máy sau khi hoàn thành
              </div>
            </div>

            {/* Embed BatTrangPotteryGame directly */}
            <BatTrangPotteryGame />
          </section>
        )}

        {/* 3.4 MỤC TRÒ CHƠI MÔ PHỎNG DỆT LỤA VẠN PHÚC (Nhúng trực tiếp) */}
        {village.slug === 'van-phuc' && (
          <section id="tro-choi-det-lua" className="space-y-6 pt-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-terracotta-100 pb-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-100 text-rose-900 text-xs font-bold uppercase tracking-wider mb-2 border border-rose-300">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                  <span>Trải Nghiệm Trực Tuyến Tương Tác</span>
                </div>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-lacquer-900">
                  Trò chơi mô phỏng: Sắc Lụa Vạn Phúc
                </h2>
                <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1">
                  Khám phá 4 công đoạn: Chọn dáng sản phẩm → Sáng tạo hoa văn gấm vóc → Thoi đưa canh cửi → Chuội lụa & Triện bảo
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <a
                  href="/trai-nghiem/det-lua"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dopaper-200 text-lacquer-900 hover:bg-gold-200 font-semibold transition-colors border border-terracotta-200"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                  <span>Mở toàn màn hình</span>
                </a>
              </div>
            </div>

            {/* Embed VanPhucSilkGame directly */}
            <VanPhucSilkGame />
          </section>
        )}

        {/* 4. Quy trình làm nghề (Step-by-step Interactive) */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-terracotta-100 pb-4 gap-2">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-wider mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Kỹ Nghệ Gia Truyền</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                Quy trình chế tác thủ công
              </h2>
            </div>
            <span className="text-xs text-lacquer-800/60">
              Tổng cộng {village.process.length} công đoạn kỳ công
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar">
            {village.process.map((step) => (
              <button
                key={step.step}
                onClick={() => setActiveStep(step.step)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeStep === step.step
                    ? 'bg-terracotta-500 text-white shadow-md'
                    : 'bg-dopaper-100 text-lacquer-800/70 hover:bg-terracotta-50 border border-terracotta-200'
                }`}
              >
                <span>Bước {step.step}</span>
                <span className="hidden md:inline">• {step.title}</span>
              </button>
            ))}
          </div>

          {/* Active Step Content */}
          {(() => {
            const current = village.process.find((p) => p.step === activeStep) || village.process[0];
            return (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4 items-center">
                <div className="lg:col-span-6 rounded-2xl overflow-hidden aspect-[16/10] bg-dopaper-200 shadow-md">
                  <img
                    src={current.image}
                    alt={current.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="lg:col-span-6 space-y-4">
                  <span className="px-3 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold">
                    Công đoạn {current.step} / {village.process.length}
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-lacquer-900">
                    {current.title}
                  </h3>
                  <p className="text-sm font-semibold text-terracotta-600">
                    {current.summary}
                  </p>
                  <p className="text-xs sm:text-sm text-lacquer-800/80 leading-relaxed">
                    {current.description}
                  </p>
                  {current.duration && (
                    <div className="text-xs text-lacquer-800/60 flex items-center gap-1.5 pt-2">
                      <Clock className="w-3.5 h-3.5 text-gold-600" />
                      <span>Thời gian: {current.duration}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </section>

        {/* 5. Bộ sưu tập hình ảnh & Lightbox */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-terracotta-100 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-wider mb-1">
                <ImageIcon className="w-4 h-4" />
                <span>Khoảnh Khắc Di Sản</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                Hình ảnh & Không gian làng nghề
                <span className="text-terracotta-600 text-lg font-sans font-semibold ml-2.5">
                  ({village.gallery.length} ảnh)
                </span>
              </h2>
            </div>
            <span className="text-xs text-lacquer-800/60 hidden sm:inline flex items-center gap-1.5">
              <ZoomIn className="w-3.5 h-3.5 text-terracotta-500" />
              <span>Nhấp vào ảnh để xem kích thước lớn</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {village.gallery.map((img, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedImage(img)}
                className="group relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all border border-terracotta-200/50 bg-dopaper-200"
              >
                <img
                  src={img.url}
                  alt={img.caption}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3.5">
                  <div className="self-end p-1.5 rounded-full bg-white/20 backdrop-blur-md text-white shadow-sm">
                    <ZoomIn className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed">
                      {img.caption}
                    </p>
                    {img.credit && (
                      <p className="text-white/70 text-[10px] mt-0.5 leading-tight">{img.credit}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Nghệ nhân tiêu biểu */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/80 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-terracotta-600 uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              <span>Người Thắp Lửa Di Sản</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
              Nghệ nhân tiêu biểu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {village.artisans.map((artisan, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-dopaper-50 border border-terracotta-200 flex flex-col sm:flex-row items-center sm:items-start gap-4"
              >
                <img
                  src={artisan.avatar}
                  alt={artisan.name}
                  className="w-20 h-20 rounded-2xl object-cover shadow border-2 border-terracotta-300 shrink-0"
                />
                <div className="space-y-1 text-center sm:text-left">
                  <h3 className="font-serif text-lg font-bold text-lacquer-900">
                    {artisan.name}
                  </h3>
                  <p className="text-xs font-semibold text-terracotta-600">
                    {artisan.title}
                  </p>
                  <p className="text-xs text-lacquer-800/60">{artisan.experience}</p>
                  <blockquote className="pt-2 text-xs italic text-lacquer-800/80">
                    "{artisan.quote}"
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Sản phẩm tinh hoa của làng nghề */}
        {villageProducts.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                  Sản phẩm tinh hoa {village.name}
                </h2>
                <p className="text-xs sm:text-sm text-lacquer-800/70 mt-1">
                  Được chế tác thủ công 100% bởi các nghệ nhân làng nghề
                </p>
              </div>
              <Link
                href="/san-pham"
                className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
              >
                <span>Xem tất cả sản phẩm</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {villageProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-3xl border border-terracotta-200 shadow-sm hover:shadow-lg transition-all p-5 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gold-600 uppercase">
                      {prod.category}
                    </span>
                    <h4 className="font-serif text-base font-bold text-lacquer-900 line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-lacquer-800/70 line-clamp-2">
                      {prod.description}
                    </p>
                    <div className="text-xs text-lacquer-800/60">
                      Nghệ nhân: <span className="font-semibold text-lacquer-900">{prod.artisanName}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-terracotta-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-terracotta-600">
                        {formatCurrencyVND(prod.price)}
                      </span>
                    </div>
                    <a
                      href={prod.shopeeUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow flex items-center gap-1"
                    >
                      <span>Mua sản phẩm</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Tour & Workshop trải nghiệm thực tế */}
        {villageTours.length > 0 && (
          <section className="bg-gradient-to-r from-terracotta-700 to-terracotta-800 rounded-3xl p-6 sm:p-10 text-white space-y-6 shadow-xl">
            <div>
              <span className="text-xs font-bold text-gold-300 uppercase tracking-wider">
                Sẵn Sàng Đi Thật?
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mt-1">
                Tour & Workshop thực tế tại {village.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {villageTours.map((tour) => (
                <div
                  key={tour.id}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold text-gold-300 uppercase">
                        {tour.category}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-white mt-0.5">
                        {tour.name}
                      </h4>
                    </div>
                    <span className="text-sm font-bold text-gold-400 shrink-0">
                      {formatCurrencyVND(tour.price)}/khách
                    </span>
                  </div>

                  <p className="text-xs text-dopaper-200/90 leading-relaxed">
                    {tour.shortDescription}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-dopaper-300">
                    <span>Thời lượng: {tour.duration}</span>
                    <span>•</span>
                    <span>Quy mô: {tour.groupSize}</span>
                  </div>

                  <div className="pt-2">
                    <Link
                      href="/du-lich"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-400 hover:bg-gold-300 text-lacquer-950 font-bold text-xs shadow"
                    >
                      <span>Xem chi tiết & Giữ chỗ</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="flex flex-col items-center gap-3 max-w-5xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage.url}
              alt={selectedImage.caption || 'Phóng to ảnh'}
              className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="text-center space-y-1 max-w-3xl px-2">
              <p className="text-white text-sm font-medium">{selectedImage.caption}</p>
              {selectedImage.credit && (
                <p className="text-white/60 text-xs">{selectedImage.credit}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Souvenir Photos */}
      {lightboxSouvenir && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setLightboxSouvenir(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxSouvenir(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightboxSouvenir.url}
              alt={lightboxSouvenir.caption || 'Ảnh lưu niệm'}
              className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/20"
            />
            <div className="mt-3 text-center text-white space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-gold-500 text-lacquer-950 text-xs font-bold">
                  {lightboxSouvenir.villageName}
                </span>
                <span className="text-xs text-dopaper-300">
                  {new Date(lightboxSouvenir.date).toLocaleDateString('vi-VN')}
                </span>
              </div>
              <p className="text-sm font-medium text-dopaper-100">
                {lightboxSouvenir.caption || 'Ảnh lưu niệm chuyến đi'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
