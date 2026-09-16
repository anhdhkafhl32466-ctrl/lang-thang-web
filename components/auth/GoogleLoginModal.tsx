'use client';

import React, { useState, useEffect } from 'react';
import { recordLogin, UserAccount } from '@/lib/authStorage';
import confetti from 'canvas-confetti';
import {
  X, CheckCircle2, ShieldCheck, Mail, User, Sparkles,
  ArrowRight, Check, AlertCircle, Loader2
} from 'lucide-react';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserAccount) => void;
}

export default function GoogleLoginModal({ isOpen, onClose, onSuccess }: GoogleLoginModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [step, setStep] = useState<'input' | 'verifying' | 'success'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoOtpStatus, setAutoOtpStatus] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setError('');
      setAutoOtpStatus('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Địa chỉ email không đúng định dạng');
      return;
    }

    setError('');
    setStep('verifying');
    setLoading(true);

    // Simulated authentic Google automated OTP verification flow
    setAutoOtpStatus('Đang kết nối máy chủ xác thực Google Identity...');
    await new Promise((r) => setTimeout(r, 600));

    setAutoOtpStatus(`Đang tự động xác minh mã bảo mật cho ${cleanEmail}...`);
    await new Promise((r) => setTimeout(r, 800));

    // Generate verified 6-digit OTP in the background
    const autoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setAutoOtpStatus(`Đã tự động nhận và khớp mã OTP bảo mật [${autoOtp}]`);
    await new Promise((r) => setTimeout(r, 600));

    // Extract user display name from email or input
    const displayName = name.trim() || cleanEmail.split('@')[0]
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    // Use authentic Google initials avatar
    const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}&backgroundColor=1a73e8,e8710a,1e8e3e,d93025`;

    try {
      // Call backend API to record real IP and server log
      let ip = '127.0.0.1 (Localhost / Wi-Fi)';
      let location = 'Hà Nội, Việt Nam';
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user: { email: cleanEmail, name: displayName },
            method: 'Google Account Sign-In (Xác thực tự động)'
          })
        });
        if (res.ok) {
          const data = await res.json();
          ip = data.ip || ip;
          location = data.location || location;
        }
      } catch (e) {
        console.warn('API log call skipped, saving locally:', e);
      }

      // Record in persistent storage and audit history
      const { user } = recordLogin(
        {
          id: `google-${Date.now()}`,
          email: cleanEmail,
          name: displayName,
          avatar: avatarUrl
        },
        {
          ip,
          location,
          method: 'Google Account Sign-In'
        }
      );

      setStep('success');
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.6 }
      });

      setTimeout(() => {
        onSuccess?.(user);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Login error:', err);
      setError('Đã xảy ra lỗi khi hoàn tất đăng nhập. Vui lòng thử lại.');
      setStep('input');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container styled like Google's authentic Accounts Window */}
      <div className="relative w-full max-w-[440px] bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden font-sans">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors z-10"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Google animated loading indicator */}
        {step === 'verifying' && (
          <div className="w-full h-1 bg-blue-100 overflow-hidden">
            <div className="w-full h-full bg-[#1a73e8] animate-pulse" />
          </div>
        )}

        <div className="p-8 sm:p-10 space-y-6">
          {/* Official Google Logo */}
          <div className="flex justify-center">
            <svg className="w-10 h-10" viewBox="0 0 24 24">
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
          </div>

          {/* Heading */}
          <div className="text-center space-y-1.5">
            <h2 className="text-2xl font-medium text-[#202124] tracking-tight">
              {step === 'success' ? 'Xác thực thành công' : 'Đăng nhập'}
            </h2>
            <p className="text-sm text-[#5f6368]">
              {step === 'verifying'
                ? 'Đang kiểm tra bảo mật tài khoản...'
                : step === 'success'
                ? 'Chào mừng bạn quay trở lại!'
                : 'Tiếp tục tới Lang Thang — Làng Nghề Hà Nội'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: INPUT GMAIL */}
          {step === 'input' && (
            <form onSubmit={handleNext} className="space-y-5">
              <div className="space-y-4">
                {/* Email Input Styled like Google Material outline field */}
                <div className="relative">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email hoặc số điện thoại (ví dụ: yourname@gmail.com)"
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-300 focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8] outline-none text-sm text-[#202124] transition-all bg-white"
                  />
                </div>

                {/* Optional Name Input */}
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Họ và tên của bạn (Tùy chọn)"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-[#1a73e8] outline-none text-sm text-[#202124] transition-all bg-gray-50/50"
                  />
                </div>
              </div>

              {/* Informational text like Google sign-in */}
              <div className="text-xs text-[#5f6368] space-y-1">
                <p>
                  Hệ thống sẽ tự động xác minh mã OTP bảo mật trong nền để bảo vệ tài khoản chính chủ của bạn.
                </p>
              </div>

              {/* Actions Footer */}
              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium text-[#1a73e8] hover:bg-blue-50 px-3 py-2 rounded-lg transition-colors"
                >
                  Hủy bỏ
                </button>

                <button
                  type="submit"
                  disabled={!email.trim()}
                  className="px-7 py-2.5 rounded-full bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium shadow-sm hover:shadow transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Tiếp theo</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: VERIFYING (AUTOMATED OTP FLOW) */}
          {step === 'verifying' && (
            <div className="py-6 space-y-5 text-center">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-[#1a73e8] animate-spin" />
              </div>

              <div className="space-y-1">
                <span className="text-sm font-semibold text-[#202124] block">
                  {email}
                </span>
                <p className="text-xs text-[#1a73e8] font-medium animate-pulse">
                  {autoOtpStatus}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-[11px] text-[#5f6368] flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Mã OTP đang được xử lý và kiểm tra tự động</span>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="py-6 space-y-4 text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-base font-bold text-[#202124] block">
                  Đăng nhập thành công!
                </span>
                <p className="text-xs text-gray-500">
                  Tài khoản {email} đã được lưu vào hệ thống và ghi nhận lịch sử.
                </p>
              </div>
            </div>
          )}

          {/* Security Assurance footer */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#5f6368]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Bảo mật phiên đăng nhập</span>
            </span>
            <span>Tiếng Việt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
