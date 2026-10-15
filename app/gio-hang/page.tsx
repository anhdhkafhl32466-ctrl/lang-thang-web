'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/client/cart';
import { formatCurrencyVND } from '@/lib/utils';
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Store as StoreIcon,
  MapPin,
  Package,
} from 'lucide-react';
import type { CartLine, CatalogProduct } from '@/lib/orders/types';

export default function CartPage() {
  const cart = useCart();

  // Nhóm sản phẩm theo từng Cửa hàng (Nhiệm vụ 4.A — Giỏ hàng đa shop)
  const groupedByStore = useMemo(() => {
    const groups: {
      storeId: string;
      storeName: string;
      storeSlug?: string | null;
      lines: { line: CartLine; product: CatalogProduct }[];
      subtotal: number;
    }[] = [];
    const map = new Map<string, (typeof groups)[0]>();

    for (const line of cart.lines) {
      const product = cart.products[line.productId];
      if (!product) continue;
      const storeId = product.storeId || 'platform';
      const storeName = product.storeName || 'Lang Thang — Sàn di sản';
      const storeSlug = product.storeSlug || null;

      let group = map.get(storeId);
      if (!group) {
        group = { storeId, storeName, storeSlug, lines: [], subtotal: 0 };
        map.set(storeId, group);
        groups.push(group);
      }
      group.lines.push({ line, product });
      group.subtotal += product.price * line.quantity;
    }
    return groups;
  }, [cart.lines, cart.products]);

  const missingLines = useMemo(() => {
    return cart.lines.filter((line) => !cart.products[line.productId]);
  }, [cart.lines, cart.products]);

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900 flex items-center gap-2.5">
              <ShoppingBag className="w-6 h-6 text-terracotta-600" />
              <span>Giỏ hàng của bạn</span>
            </h1>
            <p className="text-xs text-lacquer-800/70 mt-1">
              Sản phẩm từ các xưởng thủ công mỹ nghệ và nghệ nhân làng nghề Hà Nội
            </p>
          </div>
          <Link href="/san-pham" className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700">
            Tiếp tục chọn sản phẩm &rarr;
          </Link>
        </div>

        {!cart.ready || (cart.loadingCatalog && cart.lines.length > 0 && Object.keys(cart.products).length === 0) ? (
          <div className="p-16 text-center text-xs text-lacquer-800/60 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Đang tải giỏ hàng...</span>
          </div>
        ) : cart.lines.length === 0 ? (
          <div className="bg-white rounded-3xl border border-terracotta-200 p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-dopaper-100 text-terracotta-600 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h2 className="font-serif text-lg font-bold text-lacquer-900">Giỏ hàng đang trống</h2>
            <p className="text-xs text-lacquer-800/70 max-w-md mx-auto">
              Hãy dạo quanh các xưởng gốm Bát Tràng, lụa Vạn Phúc, mây tre Phú Vinh để khám phá những tác phẩm di sản đặc sắc.
            </p>
            <Link
              href="/san-pham"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-bold shadow"
            >
              <span>Khám phá sản phẩm làng nghề</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Cảnh báo sản phẩm không còn tồn tại */}
              {missingLines.length > 0 && (
                <div className="bg-white rounded-2xl border border-rose-200 p-4 space-y-2">
                  <p className="text-xs font-bold text-rose-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Có {missingLines.length} sản phẩm không còn kinh doanh:</span>
                  </p>
                  {missingLines.map((line) => (
                    <div key={line.productId} className="text-xs text-rose-600 flex items-center justify-between">
                      <span className="font-mono">Mã: {line.productId}</span>
                      <button
                        onClick={() => cart.removeLine(line.productId)}
                        className="text-xs font-bold underline hover:text-rose-800"
                      >
                        Xoá khỏi giỏ
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Nhóm sản phẩm theo từng Shop */}
              {groupedByStore.map((group) => (
                <div
                  key={group.storeId}
                  className="bg-white rounded-3xl border border-terracotta-200 overflow-hidden shadow-sm"
                >
                  {/* Shop Header */}
                  <div className="px-5 py-3.5 bg-dopaper-100/70 border-b border-terracotta-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-terracotta-500 text-white flex items-center justify-center">
                        <StoreIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <Link
                          href={`/cua-hang/${group.storeSlug || group.storeId}`}
                          className="font-serif text-sm font-bold text-lacquer-900 hover:text-terracotta-600 transition-colors flex items-center gap-1.5"
                        >
                          <span>{group.storeName}</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-white border border-terracotta-200 text-terracotta-700">
                            Xem shop &rarr;
                          </span>
                        </Link>
                      </div>
                    </div>
                    <span className="text-xs text-lacquer-800/70">
                      Tạm tính shop: <strong className="text-terracotta-700">{formatCurrencyVND(group.subtotal)}</strong>
                    </span>
                  </div>

                  {/* Danh sách sản phẩm của Shop này */}
                  <div className="divide-y divide-terracotta-100 p-4 space-y-4">
                    {group.lines.map(({ line, product }) => {
                      const lineTotal = product.price * line.quantity;
                      const exceedsStock = line.quantity > product.stock;

                      return (
                        <div
                          key={line.productId}
                          className="pt-4 first:pt-0 flex flex-col sm:flex-row gap-4 items-start sm:items-center"
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-terracotta-100 flex-shrink-0"
                          />

                          <div className="flex-1 space-y-1.5 w-full">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <Link
                                  href={`/san-pham/${product.id}`}
                                  className="font-serif text-sm sm:text-base font-bold text-lacquer-900 hover:text-terracotta-600 line-clamp-1"
                                >
                                  {product.name}
                                </Link>
                                <p className="text-[11px] text-lacquer-800/60 flex flex-wrap items-center gap-2">
                                  <span>{product.villageName}</span>
                                  {product.material && <span>· Chất liệu: {product.material}</span>}
                                </p>
                                {product.warehouseName && (
                                  <p className="text-[10px] text-lacquer-800/50 flex items-center gap-1 mt-0.5">
                                    <MapPin className="w-3 h-3 text-terracotta-500" />
                                    <span>Xuất từ: {product.warehouseName}</span>
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => cart.removeLine(product.id)}
                                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50"
                                title="Xoá khỏi giỏ"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                              <div className="inline-flex items-center border border-terracotta-200 rounded-xl overflow-hidden bg-white">
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
                                  className="w-12 text-center text-xs py-1.5 border-x border-terracotta-200 focus:outline-none"
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
                                <span className="block text-sm font-bold text-terracotta-600">
                                  {formatCurrencyVND(lineTotal)}
                                </span>
                                <span className="block text-[10px] text-lacquer-800/60">
                                  {formatCurrencyVND(product.price)} / món
                                </span>
                              </div>
                            </div>

                            {exceedsStock && (
                              <p className="text-[11px] text-amber-700 flex items-center gap-1.5 pt-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Kho hiện chỉ còn {product.stock} sản phẩm. Vui lòng giảm số lượng.</span>
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar tóm tắt đơn hàng */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-3xl border border-terracotta-200 p-6 space-y-4 lg:sticky lg:top-28 shadow-sm">
                <h2 className="font-serif text-lg font-bold text-lacquer-900">Tóm tắt đơn hàng</h2>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-lacquer-800/70">Số lượng sản phẩm</span>
                    <strong className="text-lacquer-900">{cart.totalCount} món</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lacquer-800/70">Số cửa hàng xuất hàng</span>
                    <strong className="text-lacquer-900">{groupedByStore.length} xưởng/shop</strong>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-terracotta-100 text-sm">
                    <span className="font-bold text-lacquer-900">Tổng tiền hàng</span>
                    <strong className="font-bold text-terracotta-600 text-base">
                      {formatCurrencyVND(cart.subtotal)}
                    </strong>
                  </div>

                  <div className="p-3 rounded-2xl bg-dopaper-50 border border-terracotta-100 text-[11px] text-lacquer-800/75 space-y-1">
                    <p className="font-semibold text-lacquer-900 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-terracotta-600" />
                      <span>Đơn hàng đa người bán</span>
                    </p>
                    <p className="leading-relaxed">
                      Sản phẩm được chia thành <strong>{groupedByStore.length} kiện hàng</strong> tương ứng từng cửa hàng. Phí vận chuyển được tính riêng theo từng chặng đường ở bước thanh toán.
                    </p>
                  </div>
                </div>

                <Link
                  href="/thanh-toan"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-sm font-bold shadow transition-colors"
                >
                  <span>Tiến hành đặt hàng</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={cart.clearCart}
                  className="w-full text-center text-[11px] font-semibold text-lacquer-800/60 hover:text-rose-600 py-1"
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
