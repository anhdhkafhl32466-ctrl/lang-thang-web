'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { getCurrentUser, UserAccount } from '@/lib/authStorage';
import { formatCurrencyVND } from '@/lib/utils';
import { ORDER_STATUS_META } from '@/lib/orders/workflow';
import type { Order } from '@/lib/orders/types';
import GoogleLoginModal from '@/components/auth/GoogleLoginModal';
import { PackageCheck, Loader2, RefreshCw, ArrowRight, ShoppingBag, Lock } from 'lucide-react';

const TONE_CLASS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  progress: 'bg-blue-100 text-blue-800 border-blue-200',
  success: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  danger: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function OrderHistoryPage() {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/orders', { cache: 'no-store' });
      const data = await res.json();
      if (res.status === 401) {
        setNeedsLogin(true);
        setOrders([]);
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data?.error?.message || 'Không tải được danh sách đơn hàng.');
        return;
      }
      setNeedsLogin(false);
      setOrders(data.orders || []);
    } catch {
      setError('Không kết nối được tới máy chủ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUser(getCurrentUser());
    load();
    const onAuthChange = () => {
      setUser(getCurrentUser());
      load();
    };
    window.addEventListener('auth_state_changed', onAuthChange);
    return () => window.removeEventListener('auth_state_changed', onAuthChange);
  }, [load]);

  return (
    <div className="min-h-screen py-10 sm:py-14 bg-dopaper-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 flex items-center gap-2">
              <PackageCheck className="w-6 h-6 text-terracotta-600" />
              <span>Đơn hàng của tôi</span>
            </h1>
            <p className="text-xs text-lacquer-800/70">
              Dữ liệu lấy từ cơ sở dữ liệu máy chủ nên vẫn còn sau khi tải lại trang hoặc xem trên thiết bị khác.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-terracotta-200 bg-white text-xs font-semibold text-lacquer-800 hover:bg-dopaper-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Mua sắm</span>
            </Link>
          </div>
        </div>

        {needsLogin ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-gold-400/20 text-gold-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl font-bold text-lacquer-900">Đăng nhập để xem lịch sử mua hàng</h2>
            <p className="text-xs text-lacquer-800/70 max-w-md mx-auto">
              Lịch sử đơn hàng gắn với tài khoản của bạn trên máy chủ, không dùng dữ liệu tạm trong trình duyệt.
            </p>
            <button
              onClick={() => setLoginOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-gold-500 text-white text-sm font-bold shadow"
            >
              <span>Đăng nhập bằng Gmail</span>
            </button>
            {user && (
              <p className="text-[11px] text-lacquer-800/60">
                Bạn đã đăng nhập ở giao diện với {user.email}, nhưng phiên máy chủ chưa được thiết lập. Hãy đăng nhập lại.
              </p>
            )}
          </div>
        ) : loading && orders.length === 0 ? (
          <div className="p-16 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải đơn hàng...</span>
          </div>
        ) : error ? (
          <p className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">{error}</p>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-3">
            <p className="text-sm text-lacquer-800/70">Bạn chưa có đơn hàng nào trong hệ thống.</p>
            <Link href="/san-pham" className="inline-flex items-center gap-1.5 text-xs font-bold text-terracotta-600">
              <span>Khám phá sản phẩm làng nghề</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const meta = ORDER_STATUS_META[order.status];
              return (
                <Link
                  key={order.id}
                  href={`/don-hang/${order.id}`}
                  className="block bg-white rounded-2xl border border-terracotta-200 p-5 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm font-bold text-lacquer-900">{order.code}</span>
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${TONE_CLASS[meta.tone]}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-lacquer-800/60">
                        Đặt lúc {new Date(order.createdAt).toLocaleString('vi-VN')} · {order.customerName} · {order.customerPhone}
                      </p>
                      <p className="text-[11px] text-lacquer-800/70 line-clamp-1">📍 {order.addressText}</p>
                      <p className="text-[11px] text-lacquer-800/60">
                        {(order.items || []).length} dòng sản phẩm
                        {order.routeDistanceM != null ? ` · tuyến từ kho ${(order.routeDistanceM / 1000).toFixed(1)} km` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-lg font-serif font-bold text-terracotta-600">{formatCurrencyVND(order.total)}</span>
                      <span className="text-[11px] text-lacquer-800/60 inline-flex items-center gap-1">
                        <span>Chi tiết & theo dõi</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <GoogleLoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setUser(getCurrentUser());
          load();
        }}
      />
    </div>
  );
}
