'use client';

/**
 * Đăng nhập khu vực người bán bằng EMAIL + MẬT KHẨU riêng của tài khoản bán hàng.
 *
 * Đây là đường đăng nhập tách biệt với tài khoản Gmail của khách và với quyền quản trị sàn:
 * mật khẩu người bán do chính người đăng ký đặt, được máy chủ băm bằng scrypt và đối chiếu ở máy chủ.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowRight, Loader2, LockKeyhole, LogIn, Store as StoreIcon } from 'lucide-react';
import { fetchSellerState, loginSeller } from '@/lib/client/sellerApi';
import { logout as clearDisplayedAccount, recordLogin } from '@/lib/authStorage';

export default function SellerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alreadySeller, setAlreadySeller] = useState<string | null>(null);

  useEffect(() => {
    fetchSellerState()
      .then((state) => {
        if (state.isSeller) setAlreadySeller(state.store?.name || 'cửa hàng của bạn');
      })
      .catch(() => {
        /* chưa đăng nhập là bình thường */
      });
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      setSubmitting(true);
      const cleanEmail = email.trim().toLowerCase();
      const result = await loginSeller(cleanEmail, password);

      // Ghi danh tính hiển thị ở thanh điều hướng (avatar/tên) theo TÀI KHOẢN NGƯỜI BÁN vừa đăng nhập.
      // Nếu trước đó trình duyệt còn tài khoản khác (ví dụ tài khoản quản trị), xoá trước để giao diện
      // không hiển thị sai người — quyền vẫn luôn do phiên máy chủ quyết định.
      clearDisplayedAccount();
      recordLogin(
        {
          id: `seller-${cleanEmail}`,
          email: cleanEmail,
          name: result.store?.contactName || result.store?.name || cleanEmail,
          avatar:
            result.store?.logoUrl ||
            `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.store?.name || cleanEmail)}`,
        },
        { method: 'Tài khoản người bán (email + mật khẩu)' }
      );

      router.push('/ban-hang');
      router.refresh();
    } catch (err: any) {
      // Đăng nhập thất bại: giữ nguyên danh tính đang hiển thị, chỉ hiện lỗi cho người dùng.
      setError(err?.message || 'Không đăng nhập được.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full bg-white rounded-3xl border border-terracotta-200 p-7 space-y-5 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-terracotta-50 text-terracotta-600 flex items-center justify-center mx-auto">
            <LockKeyhole className="w-7 h-7" />
          </div>
          <h1 className="font-serif text-xl font-bold text-lacquer-900">Đăng nhập người bán</h1>
          <p className="text-[11px] text-lacquer-800/70 leading-relaxed">
            Dành cho tài khoản cửa hàng đã đăng ký bán hàng trên sàn. Tài khoản Gmail của khách hàng không
            dùng được ở đây.
          </p>
        </div>

        {alreadySeller && (
          <p className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px]">
            Bạn đang có phiên đăng nhập của “{alreadySeller}”.{' '}
            <Link href="/ban-hang" className="font-bold underline">
              Vào Trung tâm người bán
            </Link>
          </p>
        )}

        <form onSubmit={submit} className="space-y-4">
          <label className="space-y-1.5 text-xs block">
            <span className="font-bold text-lacquer-900">Email đã đăng ký</span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="cua-hang@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
            />
          </label>

          <label className="space-y-1.5 text-xs block">
            <span className="font-bold text-lacquer-900">Mật khẩu</span>
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu đã đặt khi đăng ký"
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 text-sm focus:outline-none focus:border-terracotta-500"
            />
          </label>

          {error && (
            <p className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5" />
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 disabled:opacity-50 text-white text-sm font-bold"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Đăng nhập
          </button>
        </form>

        <div className="pt-3 border-t border-terracotta-100 space-y-2 text-center">
          <p className="text-[11px] text-lacquer-800/70">Chưa có tài khoản bán hàng?</p>
          <Link
            href="/dang-ky-nguoi-ban"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-terracotta-200 text-xs font-bold text-lacquer-900"
          >
            <StoreIcon className="w-3.5 h-3.5" />
            Đăng ký bán hàng
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
