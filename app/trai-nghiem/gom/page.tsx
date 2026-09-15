'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import { PRODUCTS } from '@/data/products';
import BatTrangPotteryGame from '@/components/craft/BatTrangPotteryGame';

export default function PotteryGamePage() {
  const battrangProducts = PRODUCTS.filter((p) => p.villageId === 'bat-trang');

  return (
    <div className="min-h-screen py-8 sm:py-14 bg-dopaper-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/trai-nghiem"
            className="text-xs font-semibold text-lacquer-800/70 hover:text-terracotta-600 flex items-center gap-1"
          >
            ← Quay lại Trung tâm trải nghiệm
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/lang-nghe/bat-trang"
              className="text-xs bg-gold-100 text-gold-900 font-bold px-3 py-1 rounded-full border border-gold-300 hover:bg-gold-200 transition-colors"
            >
              Hồ sơ làng gốm Bát Tràng →
            </Link>
            <span className="text-xs bg-terracotta-100 text-terracotta-700 font-bold px-3 py-1 rounded-full">
              Workshop 5 Bước
            </span>
          </div>
        </div>

        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-terracotta-100 text-terracotta-700 text-xs font-bold uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xưởng Chế Tác Gốm Bát Tràng Ảo</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900">
            Tự tay nặn gốm Bát Tràng
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70">
            Trải nghiệm trọn vẹn 5 công đoạn gia truyền: Thấu đất → Chuốt gốm trên bàn xoay → Trang trí hoa văn → Tráng men cổ → Nung lò 1.200°C.
          </p>
        </div>

        {/* The 5-Step Interactive Pottery Workshop Game */}
        <BatTrangPotteryGame />

        {/* Featured Real Products from Artisans below game */}
        <section className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-terracotta-600 uppercase tracking-wider">
                Kết Nối Thương Mại Thực Tế
              </span>
              <h2 className="font-serif text-2xl font-bold text-lacquer-900 mt-1">
                Sản phẩm gốm Bát Tràng tinh tuyển từ nghệ nhân
              </h2>
              <p className="text-xs text-lacquer-800/60 mt-1">
                Gốm men lam, men rạn, ấm chén tử sa và bình hút lộc phong thủy được chế tác thủ công 100%
              </p>
            </div>
            <Link
              href="/san-pham"
              className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
            >
              <span>Xem tất cả gian hàng</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {battrangProducts.map((prod) => (
              <div
                key={prod.id}
                className="p-4 rounded-2xl border border-terracotta-200/80 bg-dopaper-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="w-full aspect-[4/3] rounded-xl object-cover mb-3"
                  />
                  <span className="text-[10px] font-bold text-gold-600 uppercase">
                    {prod.category}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-lacquer-900 line-clamp-1 mt-0.5">
                    {prod.name}
                  </h4>
                  <p className="text-xs text-lacquer-800/60 mt-1 line-clamp-2">
                    {prod.description}
                  </p>
                  <p className="text-[11px] text-lacquer-800/70 mt-1">
                    Nghệ nhân: <span className="font-semibold text-lacquer-900">{prod.artisanName}</span>
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-terracotta-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-terracotta-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(prod.price)}
                  </span>
                  <a
                    href={prod.shopeeUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-terracotta-500 text-white text-xs font-semibold hover:bg-terracotta-600 shadow-sm"
                  >
                    Mua sản phẩm
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Workshop & Travel CTA */}
          <div className="pt-4 border-t border-terracotta-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-semibold text-lacquer-800/80">
              Muốn đến tận xưởng nặn gốm cùng nghệ nhân tại làng Bát Tràng?
            </p>
            <div className="flex gap-2">
              <Link
                href="/du-lich"
                className="px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow transition-all"
              >
                Đặt tour trải nghiệm Bát Tràng
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
