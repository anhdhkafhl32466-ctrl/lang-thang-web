'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { CRAFT_VILLAGES } from '@/data/craftVillages';
import { PRODUCTS } from '@/data/products';
import { TOURS } from '@/data/tours';
import {
  TrendingUp, Users, ShoppingCart, Compass, CheckCircle2,
  XCircle, Sparkles, Award, Eye, Trash2, ArrowRight
} from 'lucide-react';

interface SubmissionItem {
  id: string;
  senderName: string;
  villageName: string;
  location: string;
  category: string;
  date: string;
  status: string;
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'villages' | 'products'>('overview');
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([
    {
      id: 'sub-01',
      senderName: 'Cụ Nguyễn Văn Hòa (Nghệ nhân)',
      villageName: 'Làng chuồn chuồn tre Thạch Xá',
      location: 'Huyện Thạch Thất, Hà Nội',
      category: 'Mây tre đan & Chuồn chuồn tre',
      date: '10/09/2026',
      status: 'Chờ duyệt'
    },
    {
      id: 'sub-02',
      senderName: 'Trần Thu Hằng (Hướng dẫn viên)',
      villageName: 'Làng quạt Chàng Sơn',
      location: 'Huyện Thạch Thất, Hà Nội',
      category: 'Nghệ thuật dân gian',
      date: '08/09/2026',
      status: 'Đã duyệt'
    }
  ]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('hanoi_village_submissions');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSubmissions((prev) => [...parsed, ...prev]);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleApprove = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Đã duyệt' } : s))
    );
  };

  const handleReject = (id: string) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Đã từ chối' } : s))
    );
  };

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-dopaper-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-terracotta-200 pb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold mb-1">
              <span>Bảng Quản Trị Khởi Nghiệp Di Sản</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
              Hanoi Craft Villages Admin Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-bamboo-100 text-bamboo-800 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-bamboo-600 animate-pulse" />
              Hệ thống hoạt động ổn định
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 border-b border-terracotta-200 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'overview', label: 'Tổng quan & Chỉ số tăng trưởng' },
            { id: 'submissions', label: `Bài nộp từ cộng đồng (${submissions.length})` },
            { id: 'villages', label: `Quản lý làng nghề (${CRAFT_VILLAGES.length})` },
            { id: 'products', label: `Sản phẩm & Tour (${PRODUCTS.length + TOURS.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-terracotta-500 text-white shadow'
                  : 'bg-white text-lacquer-800/70 hover:bg-terracotta-50 border border-terracotta-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white rounded-3xl border border-terracotta-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-lacquer-800/60 uppercase">
                    Lượt khách truy cập
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-3xl font-bold text-lacquer-900">
                  24.850+
                </div>
                <span className="text-[11px] text-bamboo-600 font-semibold block">
                  ↑ +18.4% so với tháng trước
                </span>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-terracotta-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-lacquer-800/60 uppercase">
                    Lượt chơi mini-game
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-terracotta-50 text-terracotta-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-3xl font-bold text-lacquer-900">
                  1.842
                </div>
                <span className="text-[11px] text-bamboo-600 font-semibold block">
                  Tỷ lệ chuyển đổi xem tour: 31%
                </span>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-terracotta-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-lacquer-800/60 uppercase">
                    Lượt giữ chỗ tour/workshop
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-600 flex items-center justify-center">
                    <Compass className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-3xl font-bold text-lacquer-900">
                  342
                </div>
                <span className="text-[11px] text-bamboo-600 font-semibold block">
                  Doanh thu liên kết: ~128.5 tr đ
                </span>
              </div>

              <div className="p-6 bg-white rounded-3xl border border-terracotta-200 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-lacquer-800/60 uppercase">
                    Làng nghề số hóa
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-bamboo-50 text-bamboo-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="font-serif text-3xl font-bold text-lacquer-900">
                  8 / 1.350
                </div>
                <span className="text-[11px] text-terracotta-600 font-semibold block">
                  Đang mở rộng tiếp nhận
                </span>
              </div>
            </div>

            {/* Platform Revenue Flow & Mission */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-terracotta-200 shadow-sm space-y-4">
              <h3 className="font-serif text-lg font-bold text-lacquer-900">
                Mô hình kinh tế chia sẻ giá trị cho làng nghề (Flywheel)
              </h3>
              <p className="text-xs sm:text-sm text-lacquer-800/70 leading-relaxed">
                Nền tảng kết nối 3 dòng doanh thu: (1) Phí hoa hồng tour & workshop trải nghiệm (10%), (2) Tiếp thị liên kết Affiliate sàn Shopee/TikTok Shop của các cơ sở sản xuất đạt chuẩn OCOP (5-8%), (3) Gói tài trợ quảng bá số hóa di sản từ các doanh nghiệp văn hóa du lịch.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SUBMISSIONS */}
        {activeTab === 'submissions' && (
          <div className="bg-white rounded-3xl border border-terracotta-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-dopaper-100 border-b border-terracotta-200 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-lacquer-900">
                Danh sách làng nghề được gửi từ nghệ nhân & người dân
              </h3>
              <span className="text-xs text-lacquer-800/60">
                Cần đối chiếu thông tin trước khi duyệt lên Bản đồ
              </span>
            </div>

            <div className="divide-y divide-terracotta-100">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-terracotta-600 uppercase bg-terracotta-50 px-2 py-0.5 rounded">
                        {sub.category}
                      </span>
                      <span className="text-xs text-lacquer-800/50">{sub.date}</span>
                    </div>
                    <h4 className="font-serif text-base font-bold text-lacquer-900">
                      {sub.villageName}
                    </h4>
                    <p className="text-xs text-lacquer-800/70">
                      {sub.location} • Người gửi: <strong>{sub.senderName}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        sub.status === 'Đã duyệt'
                          ? 'bg-bamboo-100 text-bamboo-800'
                          : sub.status === 'Đã từ chối'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gold-100 text-gold-800'
                      }`}
                    >
                      {sub.status}
                    </span>

                    {sub.status === 'Chờ duyệt' && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleApprove(sub.id)}
                          className="p-2 rounded-xl bg-bamboo-600 hover:bg-bamboo-700 text-white text-xs font-semibold shadow flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Duyệt</span>
                        </button>
                        <button
                          onClick={() => handleReject(sub.id)}
                          className="p-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Từ chối</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CRAFT VILLAGES LIST */}
        {activeTab === 'villages' && (
          <div className="bg-white rounded-3xl border border-terracotta-200 overflow-hidden shadow-sm">
            <div className="p-4 bg-dopaper-100 border-b border-terracotta-200 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold text-lacquer-900">
                Danh sách làng nghề hiện đang hiển thị trên nền tảng ({CRAFT_VILLAGES.length})
              </h3>
            </div>
            <div className="divide-y divide-terracotta-100">
              {CRAFT_VILLAGES.map((v) => (
                <div key={v.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={v.heroImage}
                      alt={v.name}
                      className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
                    />
                    <div>
                      <h4 className="font-serif text-sm font-bold text-lacquer-900">{v.name}</h4>
                      <p className="text-xs text-lacquer-800/60">{v.category} • {v.location.district}</p>
                    </div>
                  </div>

                  <Link
                    href={`/lang-nghe/${v.slug}`}
                    className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
                  >
                    <span>Xem trang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: PRODUCTS & TOURS */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-terracotta-200 p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-lacquer-900">
                Sản phẩm thủ công kết nối ({PRODUCTS.length})
              </h3>
              <div className="space-y-3">
                {PRODUCTS.slice(0, 5).map((p) => (
                  <div key={p.id} className="p-3 bg-dopaper-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-lacquer-900 truncate max-w-[200px]">{p.name}</span>
                    <span className="text-terracotta-600 font-semibold">{p.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-terracotta-200 p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-lacquer-900">
                Tour & Workshop trải nghiệm ({TOURS.length})
              </h3>
              <div className="space-y-3">
                {TOURS.map((t) => (
                  <div key={t.id} className="p-3 bg-dopaper-50 rounded-xl flex items-center justify-between text-xs">
                    <span className="font-bold text-lacquer-900 truncate max-w-[200px]">{t.name}</span>
                    <span className="text-gold-600 font-semibold">{t.price.toLocaleString('vi-VN')}đ</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
