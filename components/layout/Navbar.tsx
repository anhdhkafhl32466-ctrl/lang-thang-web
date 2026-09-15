'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Sparkles, Map, BookOpen, ShoppingBag, Award, Menu, X, ChevronRight, Palette } from 'lucide-react';
import { getPassport } from '@/lib/passportStorage';

interface NavbarProps {
  onOpenPassport?: () => void;
}

export default function Navbar({ onOpenPassport }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(1);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);

    const updateBadgeCount = () => {
      const p = getPassport();
      setBadgeCount(Object.keys(p.badges).length);
    };
    updateBadgeCount();
    window.addEventListener('passport_updated', updateBadgeCount);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('passport_updated', updateBadgeCount);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Trang chủ' },
    { href: '/lang-nghe', label: 'Làng nghề' },
    { href: '/ban-do', label: 'Bản đồ' },
    { href: '/trai-nghiem', label: 'Trải nghiệm' },
    { href: '/du-lich', label: 'Du lịch' },
    { href: '/san-pham', label: 'Sản phẩm' },
    { href: '/ai-goi-y', label: 'AI Gợi ý', isSpecial: true },
  ];

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-dopaper-50/95 backdrop-blur-md shadow-md border-b border-terracotta-200/50 py-3'
            : 'bg-gradient-to-b from-dopaper-100/90 via-dopaper-50/80 to-transparent py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-terracotta-500 to-terracotta-700 flex items-center justify-center text-white shadow-md shadow-terracotta-500/20 group-hover:scale-105 transition-transform overflow-hidden p-0.5 bg-white border border-terracotta-200">
              <img
                src="/images/lang-thang-banner.png"
                alt="Lang Thang"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-serif text-lg md:text-xl font-bold text-lacquer-900 tracking-tight group-hover:text-terracotta-600 transition-colors">
                  Lang Thang
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-terracotta-100 text-terracotta-700 font-semibold border border-terracotta-300/60 hidden sm:inline-block">
                  Làng Nghề Hà Nội
                </span>
              </div>
              <p className="text-[11px] text-lacquer-800/80 hidden md:block italic">
                Lang Thang ghé một ngôi làng • Theo chân văn hóa, mở ngàn điều hay
              </p>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    active
                      ? 'text-terracotta-600 bg-terracotta-50 font-semibold shadow-sm'
                      : link.isSpecial
                      ? 'text-lacquer-900 hover:text-terracotta-600 bg-gold-300/30 hover:bg-gold-300/50 border border-gold-400/40'
                      : 'text-lacquer-800/80 hover:text-terracotta-600 hover:bg-terracotta-50/50'
                  }`}
                >
                  {link.isSpecial && <Sparkles className="w-3.5 h-3.5 text-gold-600" />}
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Passport Button */}
            <button
              onClick={onOpenPassport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-dopaper-100 hover:bg-terracotta-100/70 border border-terracotta-200 text-lacquer-900 text-xs sm:text-sm font-medium transition-colors shadow-sm"
              title="Hộ chiếu Làng nghề của bạn"
            >
              <Award className="w-4 h-4 text-gold-600" />
              <span className="hidden sm:inline">Hộ chiếu</span>
              <span className="px-1.5 py-0.2 bg-terracotta-500 text-white rounded-full text-[11px] font-bold">
                {badgeCount}
              </span>
            </button>

            {/* Main CTA button */}
            <Link
              href="/lang-nghe"
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-medium shadow-md shadow-terracotta-500/20 hover:shadow-lg transition-all"
            >
              <span>Khám phá</span>
              <ChevronRight className="w-4 h-4" />
            </Link>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-lacquer-900 hover:bg-terracotta-50 border border-terracotta-200/60"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-dopaper-50/98 border-b border-terracotta-200 px-4 pt-3 pb-6 space-y-2 animate-fadeIn shadow-xl">
            <div className="px-3 py-2.5 bg-terracotta-50 rounded-2xl border border-terracotta-200/80 mb-2">
              <span className="font-serif text-sm font-bold text-terracotta-700 block">
                Lang Thang — Làng Nghề Hà Nội
              </span>
              <p className="text-[11px] text-lacquer-800/80 italic mt-0.5">
                "Lang Thang ghé một ngôi làng — Theo chân văn hóa, mở ngàn điều hay"
              </p>
            </div>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${
                  isActive(link.href)
                    ? 'text-terracotta-600 bg-terracotta-100/70 font-semibold'
                    : 'text-lacquer-900 hover:bg-terracotta-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{link.label}</span>
                  {link.isSpecial && (
                    <span className="text-xs px-2 py-0.5 rounded bg-gold-400/30 text-lacquer-900 border border-gold-500/40">
                      Gợi ý thông minh
                    </span>
                  )}
                </div>
              </Link>
            ))}

            <div className="pt-3 border-t border-terracotta-200/60 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPassport?.();
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-dopaper-200 text-lacquer-900 font-medium text-sm flex items-center justify-center gap-2"
              >
                <Award className="w-4 h-4 text-gold-600" />
                <span>Xem Hộ chiếu Làng nghề ({badgeCount} huy hiệu)</span>
              </button>
              <Link
                href="/ai-goi-y"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-terracotta-500 text-white font-medium text-sm text-center shadow"
              >
                Tìm làng nghề cho riêng bạn (AI)
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
