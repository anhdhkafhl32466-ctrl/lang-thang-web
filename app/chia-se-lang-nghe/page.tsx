'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { unlockBadge } from '@/lib/passportStorage';
import {
  Compass, Upload, CheckCircle2, ShieldCheck, ArrowRight,
  Sparkles, Camera, MapPin, Globe, User, Phone, Mail
} from 'lucide-react';

export default function SubmitVillagePage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    senderName: '',
    senderRole: 'Người dân địa phương',
    contactPhone: '',
    contactEmail: '',
    villageName: '',
    location: '',
    category: 'Gốm sứ',
    historyStory: '',
    socialLink: '',
    allowUsage: true,
  });

  const [imagePreview, setImagePreview] = useState<string | null>(
    '/images/villages/bat-trang/artisan_wheel.jpg'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store in local storage so Admin can review
    try {
      const existing = JSON.parse(localStorage.getItem('hanoi_village_submissions') || '[]');
      existing.unshift({
        id: `sub-${Date.now()}`,
        ...formData,
        date: new Date().toLocaleDateString('vi-VN'),
        status: 'Chờ duyệt'
      });
      localStorage.setItem('hanoi_village_submissions', JSON.stringify(existing));
    } catch {
      // ignore
    }

    setSubmitted(true);
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    unlockBadge('badge-contributor');
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Cổng Tiếp Nhận Dữ Liệu Cộng Đồng</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
            Bạn biết một làng nghề truyền thống?
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-xl mx-auto leading-relaxed">
            Hãy cùng chúng tôi số hóa và quảng bá vẻ đẹp của các làng nghề Hà Nội tới hàng triệu bạn trẻ và du khách quốc tế.
          </p>
        </div>

        {submitted ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-terracotta-200 text-center shadow-xl space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-bamboo-100 text-bamboo-600 flex items-center justify-center mx-auto text-3xl">
              ✓
            </div>
            <h2 className="font-serif text-2xl font-bold text-lacquer-900">
              Cảm ơn bạn đã đóng góp thông tin làng nghề!
            </h2>
            <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-md mx-auto">
              Thông tin về <strong>{formData.villageName}</strong> đã được gửi tới ban biên tập dự án. Sau khi đối chiếu xác thực di sản, thông tin sẽ chính thức xuất hiện trên Bản đồ Làng nghề Hà Nội.
            </p>

            <div className="p-4 bg-gold-100/70 rounded-2xl border border-gold-300 max-w-md mx-auto flex items-center gap-3">
              <span className="text-3xl">📜</span>
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-terracotta-700 block">
                  Huy hiệu mới mở khóa
                </span>
                <h4 className="text-sm font-bold text-lacquer-900">
                  Đại Sứ Làng Nghề (+50 điểm)
                </h4>
              </div>
            </div>

            <div className="pt-4 flex justify-center gap-3">
              <button
                onClick={() => setSubmitted(false)}
                className="px-5 py-2.5 rounded-xl border border-terracotta-200 text-xs font-semibold text-lacquer-800"
              >
                Gửi thêm làng nghề khác
              </button>
              <Link
                href="/ban-do"
                className="px-6 py-2.5 rounded-xl bg-terracotta-500 text-white text-xs font-bold shadow"
              >
                Xem Bản đồ làng nghề
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/90 shadow-xl space-y-8"
          >
            {/* Section 1: Thông tin người gửi */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-lacquer-900 border-b border-terracotta-100 pb-2">
                1. Thông tin người gửi
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-lacquer-900 block mb-1">
                    Họ và tên của bạn:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-lacquer-900 block mb-1">
                    Bạn là:
                  </label>
                  <select
                    value={formData.senderRole}
                    onChange={(e) => setFormData({ ...formData, senderRole: e.target.value })}
                    className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                  >
                    <option>Nghệ nhân làng nghề</option>
                    <option>Chủ cơ sở sản xuất / Hợp tác xã</option>
                    <option>Người dân địa phương</option>
                    <option>Hướng dẫn viên du lịch</option>
                    <option>Người yêu di sản / Du khách</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-lacquer-900 block mb-1">
                    Số điện thoại liên hệ:
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-lacquer-900 block mb-1">
                    Email:
                  </label>
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin làng nghề */}
            <div className="space-y-4">
              <h3 className="font-serif text-lg font-bold text-lacquer-900 border-b border-terracotta-100 pb-2">
                2. Thông tin về làng nghề
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-lacquer-900 block mb-1">
                    Tên làng nghề:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Làng quạt Chàng Sơn, Làng chuồn chuồn tre Thạch Xá..."
                    value={formData.villageName}
                    onChange={(e) => setFormData({ ...formData, villageName: e.target.value })}
                    className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-lacquer-900 block mb-1">
                    Loại nghề truyền thống:
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                  >
                    <option>Gốm sứ</option>
                    <option>Lụa & Dệt may</option>
                    <option>Mây tre đan & Chuồn chuồn tre</option>
                    <option>Nón lá</option>
                    <option>Dát vàng & Kim hoàn</option>
                    <option>Nghệ thuật dân gian & Điêu khắc</option>
                    <option>Thực phẩm truyền thống (Bánh tẻ, chè lam...)</option>
                    <option>Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-lacquer-900 block mb-1">
                  Địa điểm cụ thể (Xã/Phường, Huyện/Quận, Hà Nội):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Xã Chàng Sơn, Huyện Thạch Thất, Hà Nội"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-lacquer-900 block mb-1">
                  Mô tả lịch sử, nét đặc sắc hoặc quy trình làm nghề:
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Chia sẻ về nguồn gốc lịch sử, nghệ nhân tiêu biểu, những điểm thú vị du khách nên ghé thăm..."
                  value={formData.historyStory}
                  onChange={(e) => setFormData({ ...formData, historyStory: e.target.value })}
                  className="w-full bg-dopaper-50 text-xs p-3.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-lacquer-900 block mb-1">
                  Website / Fanpage Facebook / TikTok làng nghề (nếu có):
                </label>
                <input
                  type="url"
                  placeholder="https://facebook.com/langnghe..."
                  value={formData.socialLink}
                  onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                  className="w-full bg-dopaper-50 text-xs px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
                />
              </div>
            </div>

            {/* Checkbox Permission */}
            <div className="p-4 bg-dopaper-100 rounded-2xl flex items-start gap-3 border border-terracotta-200/80">
              <input
                type="checkbox"
                id="allowUsage"
                required
                checked={formData.allowUsage}
                onChange={(e) => setFormData({ ...formData, allowUsage: e.target.checked })}
                className="mt-0.5 accent-terracotta-500 w-4 h-4 rounded"
              />
              <label htmlFor="allowUsage" className="text-xs text-lacquer-800 leading-snug cursor-pointer">
                Cho phép dự án <strong>Làng Nghề Hà Nội</strong> sử dụng thông tin và hình ảnh được cung cấp nhằm mục đích quảng bá văn hóa và phát triển du lịch di sản phi lợi nhuận.
              </label>
            </div>

            {/* Submit CTA */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-8 py-3 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-sm shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
              >
                <span>Gửi thông tin làng nghề</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
