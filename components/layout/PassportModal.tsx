'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Award, CheckCircle2, Lock, Sparkles, Compass, Palette, Calendar } from 'lucide-react';
import { getPassport, ALL_BADGES, PassportData } from '@/lib/passportStorage';
import { CRAFT_VILLAGES } from '@/data/craftVillages';

interface PassportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PassportModal({ isOpen, onClose }: PassportModalProps) {
  const [passport, setPassport] = useState<PassportData | null>(null);
  const [activeTab, setActiveTab] = useState<'badges' | 'villages' | 'creations'>('badges');

  useEffect(() => {
    if (isOpen) {
      setPassport(getPassport());
    }
  }, [isOpen]);

  if (!isOpen || !passport) return null;

  const unlockedBadgeCount = Object.keys(passport.badges).length;
  const visitedCount = passport.visitedVillages.length;

  let explorerRank = 'Tập sự Di sản';
  if (passport.points >= 200) explorerRank = 'Đại sứ Văn hóa';
  else if (passport.points >= 100) explorerRank = 'Lữ khách Làng nghề';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-lacquer-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-dopaper-50 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border-2 border-terracotta-300/80 overflow-hidden">
        {/* Header with warm cultural aesthetic */}
        <div className="bg-gradient-to-r from-terracotta-700 via-terracotta-600 to-terracotta-800 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-gold-500 flex items-center justify-center text-white shadow-lg text-2xl">
              🏮
            </div>
            <div>
              <span className="text-xs font-semibold tracking-wider uppercase text-gold-300">
                Hệ Thống Trải Nghiệm Khởi Nghiệp
              </span>
              <h2 className="font-serif text-2xl font-bold text-white">
                Hộ Chiếu Làng Nghề Hà Nội
              </h2>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-3 gap-2 text-center">
            <div className="bg-black/15 rounded-xl p-2">
              <span className="text-xs text-dopaper-200 block">Cấp bậc</span>
              <span className="font-semibold text-sm text-gold-300">{explorerRank}</span>
            </div>
            <div className="bg-black/15 rounded-xl p-2">
              <span className="text-xs text-dopaper-200 block">Điểm di sản</span>
              <span className="font-bold text-base text-white">{passport.points} pts</span>
            </div>
            <div className="bg-black/15 rounded-xl p-2">
              <span className="text-xs text-dopaper-200 block">Huy hiệu</span>
              <span className="font-bold text-base text-white">
                {unlockedBadgeCount}/{ALL_BADGES.length}
              </span>
            </div>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-terracotta-200 bg-dopaper-100/60 px-4">
          <button
            onClick={() => setActiveTab('badges')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'badges'
                ? 'border-terracotta-500 text-terracotta-600'
                : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Huy hiệu đạt được ({unlockedBadgeCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('villages')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'villages'
                ? 'border-terracotta-500 text-terracotta-600'
                : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Dấu ấn ghé thăm ({visitedCount}/{CRAFT_VILLAGES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('creations')}
            className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
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

          {activeTab === 'villages' && (
            <div className="space-y-3">
              <p className="text-xs text-lacquer-800/70 italic">
                Khám phá trang chi tiết của các làng nghề để đóng dấu mộc vào hộ chiếu di sản của bạn.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CRAFT_VILLAGES.map((v) => {
                  const isVisited = passport.visitedVillages.includes(v.slug);
                  return (
                    <div
                      key={v.id}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isVisited
                          ? 'bg-white border-terracotta-400/80 shadow-sm'
                          : 'bg-dopaper-100/50 border-terracotta-200/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                            isVisited
                              ? 'bg-terracotta-500 text-white shadow'
                              : 'bg-dopaper-200 text-lacquer-800/50'
                          }`}
                        >
                          {isVisited ? '✓' : '○'}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-lacquer-900">{v.name}</h4>
                          <span className="text-xs text-lacquer-800/60">{v.category}</span>
                        </div>
                      </div>
                      <Link
                        href={`/lang-nghe/${v.slug}`}
                        onClick={onClose}
                        className="text-xs text-terracotta-600 hover:text-terracotta-700 font-semibold underline underline-offset-2"
                      >
                        {isVisited ? 'Xem lại' : 'Ghé thăm'}
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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

        {/* Footer CTA */}
        <div className="p-4 bg-dopaper-100/90 border-t border-terracotta-200 flex items-center justify-between">
          <div className="text-xs text-lacquer-800/70">
            Mỗi trải nghiệm giúp tích lũy điểm và mở khóa đặc quyền tour!
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
