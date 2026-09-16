'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser, getLoginHistory, logout, clearLoginHistory,
  updateUserProfile, UserAccount, LoginHistoryItem
} from '@/lib/authStorage';
import { getPassport } from '@/lib/passportStorage';
import GoogleLoginModal from '@/components/auth/GoogleLoginModal';
import {
  User, ShieldCheck, Mail, Calendar, Clock, Laptop, Smartphone,
  Globe, LogOut, Trash2, Award, Sparkles, ArrowRight, CheckCircle2,
  AlertCircle, History, Edit3, Save, RefreshCw
} from 'lucide-react';

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserAccount | null>(null);
  const [history, setHistory] = useState<LoginHistoryItem[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'passport'>('history');

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Passport stats
  const [passportStats, setPassportStats] = useState({
    badgeCount: 0,
    creationsCount: 0,
    points: 0
  });

  const loadData = () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    if (currentUser) {
      setEditName(currentUser.name);
      setEditPhone(currentUser.phone || '');
      setEditBio(currentUser.bio || '');
    }

    const loginLogs = getLoginHistory();
    setHistory(loginLogs);

    const passport = getPassport();
    setPassportStats({
      badgeCount: Object.keys(passport.badges).length,
      creationsCount: passport.creations.length,
      points: passport.points
    });
  };

  useEffect(() => {
    loadData();

    const handleAuthChange = () => {
      loadData();
    };

    window.addEventListener('auth_state_changed', handleAuthChange);
    window.addEventListener('passport_updated', loadData);

    return () => {
      window.removeEventListener('auth_state_changed', handleAuthChange);
      window.removeEventListener('passport_updated', loadData);
    };
  }, []);

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc chắn muốn đăng xuất khỏi tài khoản này?')) {
      logout();
      router.push('/');
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử đăng nhập trên thiết bị này?')) {
      clearLoginHistory();
      setHistory([]);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const updated = updateUserProfile({
      name: editName.trim() || user.name,
      phone: editPhone.trim(),
      bio: editBio.trim()
    });

    if (updated) {
      setUser(updated);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-lacquer-800/60 font-medium">
            <Link href="/" className="hover:text-terracotta-600 transition-colors">
              Trang chủ
            </Link>
            <span>/</span>
            <span className="text-lacquer-900 font-bold">Tài khoản & Lịch sử đăng nhập</span>
          </div>

          {user && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Đăng xuất</span>
            </button>
          )}
        </div>

        {/* NOT LOGGED IN BANNER */}
        {!user ? (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-terracotta-200 text-center space-y-6 shadow-xl">
            <div className="w-20 h-20 rounded-full bg-gold-400/20 text-gold-600 flex items-center justify-center mx-auto border-2 border-gold-300">
              <User className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                Đăng nhập để xem lịch sử tài khoản
              </h2>
              <p className="text-xs sm:text-sm text-lacquer-800/70 leading-relaxed">
                Đăng nhập bằng Gmail thật để đồng bộ hóa tác phẩm gốm, nón lá, theo dõi tiến độ huy hiệu và bảo mật lịch sử đăng nhập của bạn.
              </p>
            </div>

            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-terracotta-500 to-gold-500 hover:from-terracotta-600 hover:to-gold-600 text-white font-bold text-sm shadow-xl hover:scale-105 transition-all"
            >
              {/* Google G logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#fff" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#fff" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                <path fill="#fff" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#fff" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Đăng nhập bằng Gmail ngay</span>
            </button>
          </div>
        ) : (
          /* LOGGED IN USER PROFILE & STATS */
          <div className="space-y-8 animate-fadeIn">
            {/* User Profile Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-terracotta-200/90 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-gold-400/20 to-terracotta-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
                {/* Avatar */}
                <div className="relative">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-xl bg-terracotta-100"
                  />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center border-2 border-white shadow">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                {/* Profile Information */}
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                      {user.name}
                    </h1>
                    <span className="px-3 py-0.5 rounded-full bg-terracotta-100 text-terracotta-700 font-bold text-xs border border-terracotta-200 self-center sm:self-auto">
                      {user.role === 'admin' ? 'Quản trị viên' : 'Lữ khách Di sản'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-lacquer-800/80">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-terracotta-600" />
                      <span>{user.email}</span>
                      <span className="text-emerald-600 font-semibold">(Đã xác thực)</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-gold-600" />
                      <span>Tham gia từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                  </div>

                  {user.bio && (
                    <p className="text-xs text-lacquer-800/70 italic mt-1">
                      "{user.bio}"
                    </p>
                  )}

                  {/* Summary Stats Badges */}
                  <div className="pt-3 grid grid-cols-3 gap-2 max-w-sm mx-auto sm:mx-0">
                    <div className="p-2.5 rounded-2xl bg-dopaper-100/70 border border-terracotta-100 text-center">
                      <span className="block text-base sm:text-lg font-bold text-terracotta-600">{passportStats.badgeCount}</span>
                      <span className="text-[10px] text-lacquer-800/70">Huy hiệu</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-dopaper-100/70 border border-terracotta-100 text-center">
                      <span className="block text-base sm:text-lg font-bold text-gold-600">{passportStats.creationsCount}</span>
                      <span className="text-[10px] text-lacquer-800/70">Tác phẩm</span>
                    </div>
                    <div className="p-2.5 rounded-2xl bg-dopaper-100/70 border border-terracotta-100 text-center">
                      <span className="block text-base sm:text-lg font-bold text-emerald-600">{history.length}</span>
                      <span className="text-[10px] text-lacquer-800/70">Lần đăng nhập</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-b border-terracotta-200">
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'history'
                    ? 'border-terracotta-500 text-terracotta-600 bg-white rounded-t-2xl shadow-sm'
                    : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Lịch sử đăng nhập ({history.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${
                  activeTab === 'profile'
                    ? 'border-terracotta-500 text-terracotta-600 bg-white rounded-t-2xl shadow-sm'
                    : 'border-transparent text-lacquer-800/70 hover:text-lacquer-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Thông tin cá nhân</span>
              </button>
            </div>

            {/* TAB CONTENT 1: LOGIN HISTORY */}
            {activeTab === 'history' && (
              <div className="bg-white rounded-3xl p-6 border border-terracotta-200 shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-terracotta-100">
                  <div>
                    <h3 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Nhật ký bảo mật & Lịch sử các phiên đăng nhập</span>
                    </h3>
                    <p className="text-xs text-lacquer-800/60">
                      Ghi nhận chi tiết mọi phiên đăng nhập bằng Gmail của bạn với mốc thời gian, thiết bị, trình duyệt và địa chỉ IP.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={loadData}
                      className="p-2 rounded-xl border border-terracotta-200 text-lacquer-800 hover:bg-terracotta-50 text-xs font-semibold flex items-center gap-1"
                      title="Làm mới lịch sử"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    {history.length > 0 && (
                      <button
                        onClick={handleClearHistory}
                        className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa lịch sử</span>
                      </button>
                    )}
                  </div>
                </div>

                {history.length === 0 ? (
                  <div className="p-8 text-center text-xs text-lacquer-800/60">
                    Chưa có bản ghi lịch sử nào trên thiết bị này.
                  </div>
                ) : (
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-terracotta-100 bg-dopaper-50/70 text-lacquer-900 font-bold">
                          <th className="py-3 px-3">Thời gian</th>
                          <th className="py-3 px-3">Thiết bị & Hệ điều hành</th>
                          <th className="py-3 px-3">Trình duyệt</th>
                          <th className="py-3 px-3">Phương thức</th>
                          <th className="py-3 px-3">Địa chỉ IP / Vị trí</th>
                          <th className="py-3 px-3 text-right">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-terracotta-100 text-lacquer-800/80">
                        {history.map((log, idx) => (
                          <tr key={log.id || idx} className="hover:bg-dopaper-50/50 transition-colors">
                            <td className="py-3 px-3 font-semibold text-lacquer-900 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-terracotta-600" />
                                <span>{log.formattedDate}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {log.device.includes('PC') || log.device.includes('Mac') || log.device.includes('Linux') ? (
                                  <Laptop className="w-3.5 h-3.5 text-lacquer-700" />
                                ) : (
                                  <Smartphone className="w-3.5 h-3.5 text-lacquer-700" />
                                )}
                                <span>{log.device}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap font-medium">
                              {log.browser}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded-full bg-gold-400/20 text-lacquer-950 font-semibold text-[11px] border border-gold-400/40">
                                {log.method}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <div className="flex items-center gap-1 text-[11px]">
                                <Globe className="w-3 h-3 text-lacquer-800/50" />
                                <span className="font-mono text-lacquer-900">{log.ip}</span>
                                <span className="text-lacquer-800/60">({log.location})</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right whitespace-nowrap">
                              {log.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Đang hoạt động</span>
                                </span>
                              ) : (
                                <span className="text-lacquer-800/50 text-[11px]">
                                  Đã kết thúc
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT 2: PROFILE EDIT */}
            {activeTab === 'profile' && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-terracotta-200 shadow-md space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-terracotta-100">
                  <h3 className="font-serif text-lg font-bold text-lacquer-900">
                    Cập nhật thông tin tài khoản
                  </h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 rounded-xl bg-terracotta-50 text-terracotta-700 hover:bg-terracotta-100 border border-terracotta-200 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Chỉnh sửa hồ sơ</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 rounded-xl border border-terracotta-200 text-lacquer-800 text-xs font-semibold"
                    >
                      Hủy bỏ
                    </button>
                  )}
                </div>

                {saveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hồ sơ đã được lưu thành công!</span>
                  </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-lacquer-900">Địa chỉ Gmail</label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-dopaper-100 border border-terracotta-200 text-xs text-lacquer-800/70 cursor-not-allowed"
                    />
                    <span className="text-[11px] text-lacquer-800/50 block">Email xác thực từ Google không thể thay đổi.</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-lacquer-900">Họ và tên hiển thị</label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-lacquer-900 border ${
                        isEditing
                          ? 'bg-white border-terracotta-500 focus:outline-none'
                          : 'bg-dopaper-50 border-terracotta-200'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-lacquer-900">Số điện thoại liên hệ (Tùy chọn)</label>
                    <input
                      type="tel"
                      disabled={!isEditing}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="09xx xxx xxx"
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm text-lacquer-900 border ${
                        isEditing
                          ? 'bg-white border-terracotta-500 focus:outline-none'
                          : 'bg-dopaper-50 border-terracotta-200'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-lacquer-900">Giới thiệu ngắn / Châm ngôn</label>
                    <textarea
                      rows={3}
                      disabled={!isEditing}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      placeholder="Chia sẻ đôi nét về niềm đam mê văn hóa làng nghề của bạn..."
                      className={`w-full p-3 rounded-xl text-xs sm:text-sm text-lacquer-900 border ${
                        isEditing
                          ? 'bg-white border-terracotta-500 focus:outline-none'
                          : 'bg-dopaper-50 border-terracotta-200'
                      }`}
                    />
                  </div>

                  {isEditing && (
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu thay đổi</span>
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      <GoogleLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={(u) => {
          setUser(u);
          loadData();
        }}
      />
    </div>
  );
}
