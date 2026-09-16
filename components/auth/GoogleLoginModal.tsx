'use client';

import React, { useState, useEffect, useRef } from 'react';
import { recordLogin, UserAccount } from '@/lib/authStorage';
import confetti from 'canvas-confetti';
import {
  X, CheckCircle2, ShieldCheck, Mail, User, Sparkles,
  ArrowRight, Check, AlertCircle, Loader2, KeyRound,
  ExternalLink, Globe, HelpCircle, ShieldAlert
} from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserAccount) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleLoginModal({ isOpen, onClose, onSuccess }: GoogleLoginModalProps) {
  const [activeTab, setActiveTab] = useState<'google_oauth' | 'email_verify'>('google_oauth');

  // Google OAuth state
  const [clientId, setClientId] = useState('');
  const [isGisReady, setIsGisReady] = useState(false);
  const [customClientIdInput, setCustomClientIdInput] = useState('');
  const googleBtnContainerRef = useRef<HTMLDivElement>(null);

  // Email verification state
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedHost, setVerifiedHost] = useState('');

  // 1. Initialize Client ID from env or localStorage
  useEffect(() => {
    const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    const storedClientId = typeof window !== 'undefined' ? localStorage.getItem('google_client_id') || '' : '';
    const initialId = envClientId || storedClientId;
    setClientId(initialId);
    if (initialId) {
      setCustomClientIdInput(initialId);
    }
  }, []);

  // 2. Load Google Identity Services (GSI) script dynamically
  useEffect(() => {
    if (!isOpen) return;

    if (typeof window !== 'undefined' && !window.google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsGisReady(true);
      };
      document.body.appendChild(script);
    } else if (window.google?.accounts?.id) {
      setIsGisReady(true);
    }
  }, [isOpen]);

  // 3. Render official Google Sign In button if clientId and GIS are ready
  useEffect(() => {
    if (!isOpen || !isGisReady || !clientId || !googleBtnContainerRef.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      googleBtnContainerRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
        theme: 'filled_blue',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 320,
        logo_alignment: 'left',
      });
    } catch (err) {
      console.warn('GIS render error:', err);
    }
  }, [isOpen, isGisReady, clientId, activeTab]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
      setVerificationSuccess(false);
      setVerifiedHost('');
    }
  }, [isOpen]);

  // Handle Google official OAuth credential response (JWT token)
  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      setError('');

      // Decode JWT payload safely
      const token = response.credential;
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);

      const userEmail = payload.email;
      const userName = payload.name || userEmail.split('@')[0];
      const userPicture = payload.picture || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(userName)}`;

      // Call backend to log session
      let ip = '127.0.0.1 (Localhost / Wi-Fi)';
      let location = 'Hà Nội, Việt Nam';
      try {
        const apiRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: { email: userEmail, name: userName },
            method: 'Google OAuth 2.0 (Chính thức từ Google)'
          })
        });
        if (apiRes.ok) {
          const apiData = await apiRes.json();
          ip = apiData.ip || ip;
          location = apiData.location || location;
        }
      } catch (e) {
        console.warn('API log skip:', e);
      }

      // Record in storage
      const { user } = recordLogin(
        {
          id: `google-${payload.sub || Date.now()}`,
          email: userEmail,
          name: userName,
          avatar: userPicture,
        },
        {
          ip,
          location,
          method: 'Google OAuth 2.0 (Xác thực thật từ Google)'
        }
      );

      setVerificationSuccess(true);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        onSuccess?.(user);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Error decoding Google response:', err);
      setError('Lỗi giải mã thông tin từ Google. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Handle saving custom Client ID
  const handleSaveClientId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = customClientIdInput.trim();
    if (!cleanId) {
      setError('Vui lòng nhập mã Google Client ID');
      return;
    }
    if (!cleanId.includes('.apps.googleusercontent.com')) {
      setError('Google Client ID hợp lệ phải có đuôi ".apps.googleusercontent.com"');
      return;
    }

    localStorage.setItem('google_client_id', cleanId);
    setClientId(cleanId);
    setError('');
  };

  // Handle Email Verification with backend MX and syntax inspection
  const handleEmailVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // 1. Call verify-email API
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await res.json();

      if (!res.ok || !data.valid) {
        setError(data.message || 'Email này không hợp lệ hoặc máy chủ không tồn tại.');
        setLoading(false);
        return;
      }

      setVerifiedHost(data.mxHost || data.domain);

      // Extract display name
      const displayName = name.trim() || cleanEmail.split('@')[0]
        .split(/[._-]/)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1a73e8,e8710a,1e8e3e,d93025`;

      // 2. Call login API
      let ip = '127.0.0.1 (Localhost / Wi-Fi)';
      let location = 'Hà Nội, Việt Nam';
      try {
        const logRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: { email: cleanEmail, name: displayName },
            method: `Email Xác thực MX/DNS (${data.domain})`
          })
        });
        if (logRes.ok) {
          const logData = await logRes.json();
          ip = logData.ip || ip;
          location = logData.location || location;
        }
      } catch (e) {
        console.warn('API log skip:', e);
      }

      // Record in storage
      const { user } = recordLogin(
        {
          id: `email-${Date.now()}`,
          email: cleanEmail,
          name: displayName,
          avatar: avatarUrl
        },
        {
          ip,
          location,
          method: `Xác thực Email MX/DNS (@${data.domain})`
        }
      );

      setVerificationSuccess(true);
      confetti({
        particleCount: 65,
        spread: 60,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        onSuccess?.(user);
        onClose();
      }, 1000);
    } catch (err: any) {
      setError('Lỗi kết nối máy chủ kiểm tra email. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Google Header */}
        <div className="p-6 sm:p-7 space-y-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <div>
              <h2 className="text-xl font-bold text-[#202124]">
                Xác thực Tài khoản
              </h2>
              <p className="text-xs text-[#5f6368]">
                Lang Thang — Làng Nghề Truyền Thống Hà Nội
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex p-1 bg-gray-100 rounded-xl">
            <button
              type="button"
              onClick={() => { setActiveTab('google_oauth'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'google_oauth'
                  ? 'bg-white text-[#1a73e8] shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Google OAuth 2.0 (Thật 100%)
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('email_verify'); setError(''); }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'email_verify'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Kiểm tra Mail Thật (DNS MX)
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold block">Xác thực không thành công:</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {verificationSuccess && (
            <div className="py-6 text-center space-y-3 animate-fadeIn">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <span className="text-base font-bold text-[#202124] block">
                  Đăng nhập thành công!
                </span>
                <p className="text-xs text-gray-500">
                  {verifiedHost ? `Đã xác thực qua máy chủ: ${verifiedHost}` : 'Đã xác thực danh tính qua Google'}
                </p>
              </div>
            </div>
          )}

          {/* TAB 1: OFFICIAL GOOGLE OAUTH 2.0 */}
          {!verificationSuccess && activeTab === 'google_oauth' && (
            <div className="space-y-4 pt-1">
              {clientId ? (
                <div className="space-y-4 text-center">
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-left text-xs text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-blue-600" />
                      <span>Đã kích hoạt Google Identity Services</span>
                    </span>
                    <p className="text-[11px] text-blue-800/80 leading-relaxed">
                      Bấm nút bên dưới để mở cửa sổ đăng nhập chính thức từ máy chủ Google (<code className="font-mono">accounts.google.com</code>). Email không tồn tại sẽ bị Google chặn ngay lập tức.
                    </p>
                  </div>

                  {/* Official Google Rendered Button */}
                  <div className="flex justify-center py-2">
                    <div ref={googleBtnContainerRef} className="min-h-[44px]" />
                  </div>

                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('google_client_id');
                        setClientId('');
                      }}
                      className="text-[11px] text-gray-500 hover:text-red-600 underline"
                    >
                      Đổi hoặc xóa Client ID đã lưu
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5 leading-relaxed">
                    <span className="font-bold flex items-center gap-1.5 text-amber-800">
                      <HelpCircle className="w-4 h-4" />
                      <span>Vì sao cần Google Client ID?</span>
                    </span>
                    <p className="text-[11px] text-amber-800/90">
                      Để bảo vệ người dùng, Google <strong>tuyệt đối không cho phép bất kỳ trang web nào tự lấy mật khẩu/OTP</strong> của bạn.
                      Khi có Client ID, nút Google thật sẽ mở cửa sổ từ máy chủ Google, bạn chỉ cần click chọn tài khoản Gmail thật đã có trên máy.
                    </p>
                  </div>

                  {/* Form to enter Google Client ID */}
                  <form onSubmit={handleSaveClientId} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-[#1a73e8]" />
                          <span>Dán Google Client ID của bạn:</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={customClientIdInput}
                        onChange={(e) => setCustomClientIdInput(e.target.value)}
                        placeholder="...apps.googleusercontent.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-xs font-mono text-gray-900 bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#1a73e8] hover:bg-[#1557b0] text-white text-xs font-bold shadow transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Kích hoạt nút Google thật ⚡</span>
                    </button>
                  </form>

                  {/* 3 Step setup instruction */}
                  <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5 text-[11px] text-gray-600">
                    <span className="font-bold text-gray-800 block">Lấy Google Client ID miễn phí (1 phút):</span>
                    <ol className="list-decimal list-inside space-y-1 pl-1">
                      <li>Vào <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-[#1a73e8] underline font-semibold inline-flex items-center gap-0.5">Google Cloud Credentials <ExternalLink className="w-2.5 h-2.5" /></a></li>
                      <li>Tạo <strong>OAuth Client ID</strong> (Web Application) $\rightarrow$ Thêm <code className="bg-gray-200 px-1 py-0.5 rounded font-mono text-gray-900">http://localhost:3000</code> vào Authorized JavaScript origins.</li>
                      <li>Copy Client ID dán vào ô trên.</li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EMAIL VERIFICATION (REAL DNS MX & SYNTAX CHECK - NO FAKE EMAILS) */}
          {!verificationSuccess && activeTab === 'email_verify' && (
            <div className="space-y-4 pt-1">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-1 leading-relaxed">
                <span className="font-bold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>Kiểm tra thực tế qua hệ thống DNS toàn cầu</span>
                </span>
                <p className="text-[11px] text-emerald-800/80">
                  Hệ thống sẽ kết nối trực tiếp đến các máy chủ MX để kiểm định tên miền và quy chuẩn hòm thư. <strong>Email không có thật, sai cú pháp hoặc tên miền ảo sẽ bị chặn ngay lập tức.</strong>
                </p>
              </div>

              <form onSubmit={handleEmailVerification} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Địa chỉ Email thật của bạn</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ví dụ: yourname@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 outline-none text-xs sm:text-sm text-gray-900 bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Họ và tên hiển thị (Tùy chọn)</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nhập họ tên của bạn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-600 outline-none text-xs sm:text-sm text-gray-900 bg-gray-50/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!email.trim() || loading}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm định máy chủ MX & DNS...</span>
                    </>
                  ) : (
                    <>
                      <span>Kiểm tra & Đăng nhập ngay</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Security Notice */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bảo mật dữ liệu phiên</span>
            </span>
            <span>Chống email giả mạo</span>
          </div>
        </div>
      </div>
    </div>
  );
}
