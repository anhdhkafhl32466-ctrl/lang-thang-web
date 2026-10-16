'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Compass, Sparkles, Map, BookOpen, ShoppingBag, Award, Menu, X,
  ChevronRight, Palette, ChevronDown, User as UserIcon, History, LogOut, ShieldCheck, ShoppingCart, Store
} from 'lucide-react';
import { getPassport } from '@/lib/passportStorage';
import { getCurrentUser, logout, UserAccount } from '@/lib/authStorage';
import { endServerSession, fetchServerSession } from '@/lib/client/serverSession';
import { ADMIN_ORDERS_PATH } from '@/lib/client/authRedirect';
import { useCart } from '@/lib/client/cart';
import GoogleLoginModal from '@/components/auth/GoogleLoginModal';
import NotificationBell from '@/components/orders/NotificationBell';

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
  // Quyền quản trị đọc từ PHIÊN MÁY CHỦ (cookie đã ký), không phải từ localStorage.
  const [isAdmin, setIsAdmin] = useState(false);
  // Tài khoản người bán cũng xác định từ phiên máy chủ: chỉ hiện lối vào Trung tâm người bán khi
  // máy chủ xác nhận đây là tài khoản bán hàng.
  const [sellerStore, setSellerStore] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cart = useCart();

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

    const refreshServerSession = () => {
      fetchServerSession()
        .then((session) => setIsAdmin(Boolean(session?.user?.isAdmin)))
        .catch(() => setIsAdmin(false));

      fetch('/api/seller/session', { cache: 'no-store' })
        .then((res) => res.json())
        .then((data) => setSellerStore(data?.isSeller ? data?.store?.name || 'cửa hàng của bạn' : null))
        .catch(() => setSellerStore(null));
    };

    const updateUser = () => {
      setUser(getCurrentUser());
      refreshServerSession();
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
    { href: '/cua-hang', label: 'Cửa hàng' },
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

  const handleLogoutClick = async () => {
    setUserDropdownOpen(false);
    // Xoá phiên máy chủ (cookie đã ký) TRƯỚC khi xoá trạng thái giao diện, để quyền quản trị
    // biến mất cùng lúc với phiên thay vì vẫn còn sau khi "đăng xuất".
    await endServerSession();
    logout();
    setIsAdmin(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-lg shadow-sm border-b border-terracotta-200/60 py-2'
            : 'bg-dopaper-50/90 backdrop-blur-md border-b border-terracotta-200/40 py-2.5 sm:py-3'
        }`}
      >
        <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between gap-4">
          {/* KHỐI 1: LOGO BÊN TRÁI (shrink-0) */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 select-none">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white border border-terracotta-300/80 shadow-xs flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform shrink-0">
                <img
                  src="/images/lang-thang-logo.png"
                  alt="Lang Thang — Làng Nghề Hà Nội"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900 tracking-tight group-hover:text-terracotta-600 transition-colors whitespace-nowrap shrink-0">
                  Lang Thang
                </span>
                <span className="hidden 2xl:inline-block text-[11px] uppercase tracking-wider font-semibold text-terracotta-700/80 border-l border-terracotta-300/80 pl-2 whitespace-nowrap shrink-0">
                  Di Sản Làng Nghề
                </span>
              </div>
            </Link>
          </div>

          {/* KHỐI 2: MENU ĐIỀU HƯỚNG Ở GIỮA (shrink-0, ẩn dưới 1150px để dùng Hamburger) */}
          <nav className="hidden min-[1150px]:flex items-center justify-center gap-1 xl:gap-2 2xl:gap-3 shrink-0">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[13px] 2xl:text-sm font-semibold transition-all flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-terracotta-700 bg-terracotta-100/80 font-bold'
                      : link.isSpecial
                      ? 'text-gold-800 hover:text-gold-900 px-3 py-1.5 rounded-full bg-gold-400/20 border border-gold-400/40 hover:bg-gold-400/30'
                      : 'text-lacquer-800/80 hover:text-terracotta-600 hover:bg-terracotta-50/80'
                  }`}
                >
                  {link.isSpecial && <Sparkles className="w-3.5 h-3.5 text-gold-600 shrink-0" />}
                  <span className="whitespace-nowrap shrink-0">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* KHỐI 3: CÁC NÚT HÀNH ĐỘNG BÊN PHẢI (shrink-0, phân tách rõ ràng) */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2 xl:gap-2.5 shrink-0 pl-3 xl:pl-4 border-l border-terracotta-200/60 ml-2 xl:ml-3">
            {/* Shopping Cart */}
            <Link
              href="/gio-hang"
              className="relative p-2 text-lacquer-800 hover:text-terracotta-600 hover:bg-terracotta-50 rounded-full transition-colors shrink-0"
              title="Giỏ hàng"
              aria-label="Giỏ hàng"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.totalCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 bg-terracotta-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {cart.totalCount}
                </span>
              )}
            </Link>

            {/* In-app notifications */}
            <NotificationBell userEmail={user?.email ?? null} />

            {/* Passport Button */}
            <button
              onClick={onOpenPassport}
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-full text-xs font-semibold text-lacquer-800 bg-gold-400/15 border border-gold-400/30 hover:bg-gold-400/25 transition-colors shrink-0 whitespace-nowrap"
              title="Hộ chiếu Làng nghề của bạn"
            >
              <Award className="w-3.5 h-3.5 text-gold-600 shrink-0" />
              <span className="whitespace-nowrap">Hộ chiếu</span>
              <span className="text-[10px] font-bold text-gold-900 bg-gold-400/30 px-1.5 py-0.5 rounded-full leading-none">
                {badgeCount}
              </span>
            </button>

            {/* Seller Portal Link (on 2xl screens or inside user dropdown) */}
            {!sellerStore && (
              <Link
                href="/dang-ky-nguoi-ban"
                className="hidden 2xl:inline-flex items-center gap-1 text-xs font-semibold text-terracotta-700 hover:text-terracotta-800 px-2.5 py-1.5 rounded-lg hover:bg-terracotta-50 transition-colors shrink-0 whitespace-nowrap"
                title="Đăng ký mở gian hàng trên Lang Thang"
              >
                <Store className="w-3.5 h-3.5 text-terracotta-600 shrink-0" />
                <span className="whitespace-nowrap">Mở gian hàng</span>
              </Link>
            )}

            {/* GMAIL LOGIN BUTTON - LUÔN HIỂN THỊ RÕ RÀNG VÀ ĐẸP MẮT */}
            {!user ? (
              <button
                onClick={() => setLoginModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-lacquer-900 hover:bg-terracotta-600 text-white text-xs font-bold transition-all shadow-xs shrink-0 whitespace-nowrap"
                title="Đăng nhập tài khoản"
              >
                {/* Google G logo SVG */}
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span className="whitespace-nowrap">Đăng nhập</span>
              </button>
            ) : (
              /* User Avatar Dropdown */
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-terracotta-50 transition-all shrink-0"
                >
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover border border-terracotta-200 shadow-xs"
                  />
                  <span className="text-xs font-bold text-lacquer-900 max-w-[90px] truncate hidden sm:inline-block">
                    {user.name.split(' ')[user.name.split(' ').length - 1]}
                  </span>
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
                  href="/don-hang"
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-terracotta-50 text-lacquer-900 font-semibold transition-colors"
                >
                  <ShoppingBag className="w-4 h-4 text-terracotta-600" />
                  <span>Đơn hàng của tôi</span>
                </Link>

                {isAdmin && (
                  <>
                    <Link
                      href={ADMIN_ORDERS_PATH}
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gold-400/10 hover:bg-gold-400/20 text-lacquer-900 font-bold transition-colors border-y border-gold-400/30"
                    >
                      <ShieldCheck className="w-4 h-4 text-gold-600" />
                      <span>Quản trị đơn hàng</span>
                    </Link>
                    <Link
                      href="/admin/cua-hang"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-gold-400/10 hover:bg-gold-400/20 text-lacquer-900 font-bold transition-colors border-b border-gold-400/30"
                    >
                      <Store className="w-4 h-4 text-gold-600" />
                      <span>Quản lý cửa hàng</span>
                    </Link>
                  </>
                )}

                <Link
                  href={sellerStore ? '/ban-hang' : '/dang-ky-nguoi-ban'}
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 hover:bg-terracotta-50 text-lacquer-900 font-semibold transition-colors"
                >
                  <Store className="w-4 h-4 text-terracotta-600" />
                  <span>{sellerStore ? `Trung tâm người bán (${sellerStore})` : 'Đăng ký bán hàng'}</span>
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

            {/* Mobile Hamburger (visible on tablet, mobile, and sub-1150px screens) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="min-[1150px]:hidden p-2 rounded-xl text-lacquer-900 hover:bg-terracotta-50 border border-terracotta-200/80 transition-colors shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (min-[1150px]:hidden) */}
        {mobileMenuOpen && (
          <div className="min-[1150px]:hidden bg-dopaper-50/98 border-b border-terracotta-200 px-4 pt-3 pb-6 space-y-2 animate-fadeIn shadow-xl max-h-[85vh] overflow-y-auto">
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
                <div className="flex items-center gap-1.5 shrink-0">
                  {isAdmin && (
                    <Link
                      href={ADMIN_ORDERS_PATH}
                      onClick={() => setMobileMenuOpen(false)}
                      className="px-2.5 py-1 rounded-lg bg-gold-400/20 text-lacquer-900 text-xs font-bold border border-gold-400/40"
                    >
                      Quản trị
                    </Link>
                  )}
                  <Link
                    href={sellerStore ? '/ban-hang' : '/dang-ky-nguoi-ban'}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-1 rounded-lg bg-terracotta-500 text-white text-xs font-bold border border-terracotta-600"
                  >
                    {sellerStore ? 'Bán hàng' : 'Đăng ký bán'}
                  </Link>
                  <Link
                    href="/tai-khoan"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-2.5 py-1 rounded-lg bg-terracotta-50 text-terracotta-700 text-xs font-bold border border-terracotta-200"
                  >
                    Hồ sơ
                  </Link>
                </div>
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

            <div className="px-3 py-2.5 bg-terracotta-50 rounded-2xl border border-terracotta-200/80 mb-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-terracotta-300 bg-white shadow-sm shrink-0">
                <img
                  src="/images/lang-thang-logo.png"
                  alt="Lang Thang"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <span className="font-serif text-sm font-bold text-terracotta-700 block truncate">
                  Lang Thang — Làng Nghề Hà Nội
                </span>
                <p className="text-[10px] text-lacquer-800/80 line-clamp-1">
                  Cổng thông tin & Khám phá di sản Thủ đô
                </p>
              </div>
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
