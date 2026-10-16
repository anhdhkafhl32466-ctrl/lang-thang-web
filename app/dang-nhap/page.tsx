'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GoogleLoginModal from '@/components/auth/GoogleLoginModal';
import { recordLogin } from '@/lib/authStorage';
import { establishAdminKeySession, fetchServerSession } from '@/lib/client/serverSession';
import { ADMIN_ORDERS_PATH, destinationAfterLogin, readSafeNext } from '@/lib/client/authRedirect';
import { Sparkles, ShieldCheck, ArrowRight, KeyRound, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Đăng nhập bằng khoá quản trị (dùng khi chưa cấu hình Google Client ID).
  const [adminKeyAvailable, setAdminKeyAvailable] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keyBusy, setKeyBusy] = useState(false);
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyOk, setKeyOk] = useState<string | null>(null);

  // Nếu đã có phiên MÁY CHỦ (cookie đã ký) thì đi thẳng tới đúng trang, không bắt đăng nhập lại.
  // Lưu ý: cố tình KHÔNG dựa vào localStorage — người dùng có thể đã "đăng nhập" ở giao diện
  // nhưng cookie phiên máy chủ đã mất, và đó chính là vòng lặp khiến trang đơn hàng không mở được.
  useEffect(() => {
    const target = readSafeNext(window.location.search);
    setNextPath(target);

    let cancelled = false;
    (async () => {
      const session = await fetchServerSession();
      if (cancelled) return;
      setAdminKeyAvailable(Boolean(session?.services?.adminAccessKey));
      if (session?.authenticated && session.user) {
        router.replace(destinationAfterLogin(session.user.isAdmin, target || '/tai-khoan'));
        return;
      }
      setChecking(false);
      setModalOpen(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleKeySubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      setKeyError(null);
      setKeyOk(null);
      setKeyBusy(true);
      const result = await establishAdminKeySession(keyInput.trim());
      setKeyBusy(false);
      if (!result.ok) {
        setKeyError(result.message);
        return;
      }

      // Ghi nhận hiển thị cho giao diện (avatar/tên, thanh điều hướng). Quyền quản trị KHÔNG dựa vào
      // giá trị này — nó đến từ cookie phiên đã ký ở máy chủ (isAdmin do /api/auth/session trả về).
      if (result.email) {
        recordLogin(
          {
            id: `admin-key-${result.email}`,
            email: result.email,
            name: result.name || 'Quản trị viên',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(result.name || result.email)}`,
          },
          { method: 'Khoá quản trị máy chủ (ADMIN_ACCESS_KEY)' }
        );
      }

      setKeyInput('');
      setKeyOk(result.message);
      setTimeout(() => router.replace(nextPath || ADMIN_ORDERS_PATH), 800);
    },
    [keyInput, nextPath, router]
  );

  return (
    <div className="min-h-screen py-16 texture-paper texture-paper--lotus flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">
        <div className="bg-white rounded-3xl p-8 border border-terracotta-200 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta-500 to-gold-500 text-white flex items-center justify-center mx-auto shadow-md">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">Đăng Nhập Gmail</h1>
            <p className="text-xs text-lacquer-800/70">
              Cổng đăng nhập và quản lý tài khoản lữ khách làng nghề Hà Nội
            </p>
            {nextPath && (
              <p className="text-[11px] text-terracotta-700 font-semibold">
                Sau khi xác thực, hệ thống sẽ đưa bạn tới <span className="font-mono">{nextPath}</span>.
              </p>
            )}
          </div>

          {checking ? (
            <p className="text-xs text-lacquer-800/70 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Đang kiểm tra phiên đăng nhập...</span>
            </p>
          ) : (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full py-3.5 rounded-2xl bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <span>Mở hộp thoại Đăng nhập</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <div className="pt-4 border-t border-terracotta-100 flex justify-between text-xs text-lacquer-800/60">
            <Link href="/" className="hover:text-terracotta-600 font-semibold">
              ← Về trang chủ
            </Link>
            <Link href="/tai-khoan" className="hover:text-terracotta-600 font-semibold">
              Xem tài khoản cá nhân →
            </Link>
          </div>
        </div>

        {/* Đăng nhập quản trị bằng khoá máy chủ (khi chưa có Google Client ID) */}
        <div className="bg-white rounded-3xl p-6 border border-terracotta-200 shadow-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-lacquer-900/5 text-lacquer-900 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h2 className="font-serif text-sm font-bold text-lacquer-900">Đăng nhập quản trị bằng khoá máy chủ</h2>
              <p className="text-[11px] text-lacquer-800/70 leading-relaxed">
                Dành cho chủ website khi chưa cấu hình được Google Client ID. Khoá nằm trong biến môi
                trường <code className="font-mono">ADMIN_ACCESS_KEY</code> ở máy chủ, không lưu trong trình duyệt.
              </p>
            </div>
          </div>

          {!adminKeyAvailable && !checking && (
            <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Máy chủ chưa cấu hình <code className="font-mono">ADMIN_ACCESS_KEY</code> (tối thiểu 24 ký tự) nên
                đường đăng nhập này đang tắt.
              </span>
            </p>
          )}

          <form onSubmit={handleKeySubmit} className="space-y-2">
            <input
              type="password"
              value={keyInput}
              onChange={(event) => setKeyInput(event.target.value)}
              placeholder="Dán khoá quản trị (ADMIN_ACCESS_KEY)"
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:border-terracotta-500 outline-none text-xs font-mono text-lacquer-900 bg-white"
            />
            <button
              type="submit"
              disabled={keyBusy || keyInput.trim().length === 0}
              className="w-full py-2.5 rounded-xl bg-lacquer-900 hover:bg-lacquer-800 text-white text-xs font-bold shadow disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {keyBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{keyBusy ? 'Đang xác minh với máy chủ...' : 'Vào trang quản trị đơn hàng'}</span>
            </button>
          </form>

          {keyError && (
            <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{keyError}</span>
            </p>
          )}
          {keyOk && (
            <p className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{keyOk} Đang chuyển tới trang quản trị đơn hàng...</span>
            </p>
          )}
        </div>
      </div>

      <GoogleLoginModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(_user, info) => {
          router.replace(destinationAfterLogin(info.isAdmin, nextPath || '/tai-khoan'));
        }}
      />
    </div>
  );
}
