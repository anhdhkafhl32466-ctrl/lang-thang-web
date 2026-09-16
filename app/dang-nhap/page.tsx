'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/authStorage';
import GoogleLoginModal from '@/components/auth/GoogleLoginModal';
import { Sparkles, ShieldCheck, ArrowRight, User } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.push('/tai-khoan');
    }
  }, [router]);

  return (
    <div className="min-h-screen py-16 bg-dopaper-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-terracotta-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta-500 to-gold-500 text-white flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
            Đăng Nhập Gmail
          </h1>
          <p className="text-xs text-lacquer-800/70">
            Cổng đăng nhập và quản lý tài khoản lữ khách làng nghề Hà Nội
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <span>Mở hộp thoại Đăng nhập</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-4 border-t border-terracotta-100 flex justify-between text-xs text-lacquer-800/60">
          <Link href="/" className="hover:text-terracotta-600 font-semibold">
            ← Về trang chủ
          </Link>
          <Link href="/tai-khoan" className="hover:text-terracotta-600 font-semibold">
            Xem tài khoản cá nhân →
          </Link>
        </div>
      </div>

      <GoogleLoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          router.push('/tai-khoan');
        }}
      />
    </div>
  );
}
