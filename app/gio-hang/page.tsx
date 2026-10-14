'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/client/cart';
import { formatCurrencyVND } from '@/lib/utils';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Loader2, AlertTriangle } from 'lucide-react';

export default function CartPage() {
  const cart = useCart();

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-terracotta-600" />
            <span>Giỏ hàng của bạn</span>
          </h1>
          <Link href="/san-pham" className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700">
            Tiếp tục chọn sản phẩm
          </Link>
        </div>

        {!cart.ready || (cart.loadingCatalog && cart.lines.length > 0 && Object.keys(cart.products).length === 0) ? (
          <div className="p-16 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải giỏ hàng...</span>
          </div>
        ) : cart.lines.length === 0 ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-4">
            <p className="text-sm text-lacquer-800/70">Giỏ hàng đang trống.</p>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-bold shadow"
            >
              <span>Khám phá sản phẩm làng nghề</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {cart.lines.map((line) => {
                const product = cart.products[line.productId];
                if (!product) {
                  return (
                    <div key={line.productId} className="bg-white rounded-2xl border border-rose-200 p-4 text-xs text-rose-700 flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Sản phẩm <span className="font-mono">{line.productId}</span> không còn bán.</span>
                      </span>
                      <button onClick={() => cart.removeLine(line.productId)} className="font-bold text-rose-600">
                        Xoá
                      </button>
                    </div>
                  );
                }

                const lineTotal = product.price * line.quantity;
                const exceedsStock = line.quantity > product.stock;

                return (
                  <div key={line.productId} className="bg-white rounded-2xl border border-terracotta-200 p-4 flex flex-col sm:flex-row gap-4">
                    <img src={product.image} alt={product.name} className="w-full sm:w-28 h-28 object-cover rounded-xl border border-terracotta-100" />

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/san-pham/${product.id}`} className="font-serif text-base font-bold text-lacquer-900 hover:text-terracotta-600">
                            {product.name}
                          </Link>
                          <p className="text-[11px] text-lacquer-800/60">{product.villageName} · {product.artisanName}</p>
                        </div>
                        <button
                          onClick={() => cart.removeLine(product.id)}
                          className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                          title="Xoá khỏi giỏ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="inline-flex items-center border border-terracotta-200 rounded-xl overflow-hidden">
                          <button
                            type="button"
                            onClick={() => cart.setQuantity(product.id, line.quantity - 1)}
                            className="px-2.5 py-1.5 hover:bg-dopaper-100"
                            disabled={line.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={Math.min(product.stock, 99)}
                            value={line.quantity}
                            onChange={(event) => cart.setQuantity(product.id, Number(event.target.value))}
                            className="w-14 text-center text-sm py-1.5 border-x border-terracotta-200 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => cart.setQuantity(product.id, line.quantity + 1)}
                            className="px-2.5 py-1.5 hover:bg-dopaper-100"
                            disabled={line.quantity >= Math.min(product.stock, 99)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="text-right">
                          <span className="block text-sm font-bold text-terracotta-600">{formatCurrencyVND(lineTotal)}</span>
                          <span className="block text-[11px] text-lacquer-800/60">{formatCurrencyVND(product.price)} / sản phẩm</span>
                        </div>
                      </div>

                      {exceedsStock && (
                        <p className="text-[11px] text-amber-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Kho hiện chỉ còn {product.stock} sản phẩm. Vui lòng giảm số lượng.</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 lg:sticky lg:top-28">
                <h2 className="font-serif text-lg font-bold text-lacquer-900">Tóm tắt đơn hàng</h2>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-lacquer-800/70">Số sản phẩm</span>
                    <strong className="text-lacquer-900">{cart.totalCount}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lacquer-800/70">Tạm tính</span>
                    <strong className="text-lacquer-900">{formatCurrencyVND(cart.subtotal)}</strong>
                  </div>
                  <p className="text-[11px] text-lacquer-800/60 pt-1 border-t border-terracotta-100">
                    Phí vận chuyển được tính ở bước thanh toán dựa trên tuyến đường thật từ kho tới địa chỉ bạn xác nhận.
                  </p>
                </div>

                <Link
                  href="/thanh-toan"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-bold shadow"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={cart.clearCart}
                  className="w-full text-[11px] font-semibold text-lacquer-800/60 hover:text-rose-600"
                >
                  Xoá toàn bộ giỏ hàng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
