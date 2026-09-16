'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass, Sparkles, Map, BookOpen, ShoppingBag, Award, Menu, X,
  ChevronRight, Palette, ChevronDown, User as UserIcon, History, LogOut, ShieldCheck
} from 'lucide-react';
import { getPassport } from '@/lib/passportStorage';
import { getCurrentUser, logout, UserAccount } from '@/lib/authStorage';
import GoogleLoginModal from '@/components/auth/GoogleLoginModal';

interface NavbarProps {
  onOpenPassport?: () => void;
}

export default function Navbar({ onOpenPassport }: NavbarProps) {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badgeCount, setBadgeCount] = useState(1);
  const [user, setUser] = useState<UserAccount | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    const updateUser = () => {
      setUser(getCurrentUser());
    };
    updateUser();

    window.addEventListener('passport_updated', updateBadgeCount);
    window.addEventListener('auth_state_changed', updateUser);

    // Close dropdown on outside click
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('passport_updated', updateBadgeCount);
      window.removeEventListener('auth_state_changed', updateUser);
      document.removeEventListener('mousedown', handleOutsideClick);
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

  const handleLogoutClick = () => {
    setUserDropdownOpen(false);
    logout();
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

          {/* Right Action Icons, Login & Passport */}
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

            {/* GMAIL LOGIN / USER AVATAR BUTTON */}
            {!user ? (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white hover:bg-dopaper-50 border border-terracotta-200 text-lacquer-900 text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow"
                title="Đăng nhập Gmail"
              >
                {/* Google G logo SVG */}
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Đăng nhập Gmail</span>
              </button>
            ) : (
              /* User Avatar Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white hover:bg-dopaper-100 border border-terracotta-200 shadow-sm transition-all"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-terracotta-200"
                  />
                  <span className="text-xs font-bold text-lacquer-900 max-w-[100px] truncate hidden sm:inline-block">
                    {user.name.split(' ')[user.name.split(' ').length - 1]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-lacquer-800/60" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-terracotta-200 shadow-2xl py-2 z-50 animate-fadeIn text-xs">
                    <div className="px-4 py-2.5 border-b border-terracotta-100">
                      <span className="font-bold text-lacquer-900 block truncate">{user.name}</span>
                      <span className="text-[11px] text-lacquer-800/60 block truncate">{user.email}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-semibold mt-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Tài khoản Google đã xác thực</span>
                      </span>
                    </div>

                    <Link
                      href="/tai-khoan"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-terracotta-50 text-lacquer-900 font-semibold transition-colors"
                    >
                      <UserIcon className="w-4 h-4 text-terracotta-600" />
                      <span>Hồ sơ & Tài khoản</span>
                    </Link>

                    <Link
                      href="/tai-khoan#lich-su"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 hover:bg-terracotta-50 text-lacquer-900 font-semibold transition-colors"
                    >
                      <History className="w-4 h-4 text-gold-600" />
                      <span>Lịch sử đăng nhập</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onOpenPassport?.();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-terracotta-50 text-lacquer-900 font-semibold transition-colors text-left"
                    >
                      <Award className="w-4 h-4 text-terracotta-600" />
                      <span>Hộ chiếu ({badgeCount} huy hiệu)</span>
                    </button>

                    <div className="pt-1 border-t border-terracotta-100">
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-2 px-4 py-2 text-rose-600 hover:bg-rose-50 font-semibold transition-colors text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
            {/* User info banner if logged in */}
            {user ? (
              <div className="p-3 bg-white rounded-2xl border border-terracotta-200 flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <img src={user.avatar} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-terracotta-200" />
                  <div>
                    <span className="text-xs font-bold text-lacquer-900 block">{user.name}</span>
                    <span className="text-[10px] text-lacquer-800/60 block truncate max-w-[180px]">{user.email}</span>
                  </div>
                </div>
                <Link
                  href="/tai-khoan"
                  onClick={() => setMobileMenuOpen(false)}
                  className="px-2.5 py-1 rounded-lg bg-terracotta-50 text-terracotta-700 text-xs font-bold border border-terracotta-200"
                >
                  Hồ sơ
                </Link>
              </div>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-terracotta-200 text-lacquer-900 font-bold text-xs flex items-center justify-center gap-2 shadow-sm mb-2"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Đăng nhập Gmail</span>
              </button>
            )}

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
              {user && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-2 px-4 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold text-center"
                >
                  Đăng xuất tài khoản
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Global Google Login Modal */}
      <GoogleLoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
        }}
      />
    </>
  );
}
