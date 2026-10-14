'use client';

/**
 * Giỏ hàng phía trình duyệt.
 *
 * Lưu ý quan trọng về kiến trúc: localStorage ở đây CHỈ là bản nháp (draft) giỏ hàng đang chọn.
 * Giá, tồn kho và tổng tiền CHÍNH THỨC đều do máy chủ tính lại từ cơ sở dữ liệu khi tạo đơn —
 * client không thể gửi giá lên để quyết định số tiền phải trả.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CartLine, CatalogProduct } from '@/lib/orders/types';

const STORAGE_KEY = 'lt_cart_v1';

interface CartContextValue {
  lines: CartLine[];
  products: Record<string, CatalogProduct>;
  loadingCatalog: boolean;
  catalogError: string | null;
  addToCart: (productId: string, quantity?: number) => { ok: boolean; message: string };
  setQuantity: (productId: string, quantity: number) => void;
  removeLine: (productId: string) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  ready: boolean;
  lastAddedAt: number;
  refreshCatalog: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function readDraft(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((line: any) => ({ productId: String(line?.productId || ''), quantity: Number(line?.quantity) || 0 }))
      .filter((line: CartLine) => line.productId && line.quantity > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Record<string, CatalogProduct>>({});
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [lastAddedAt, setLastAddedAt] = useState(0);

  // Nạp bản nháp giỏ hàng sau khi mount để tránh lệch giữa server-render và client-render.
  useEffect(() => {
    setLines(readDraft());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      /* trình duyệt chặn lưu trữ — giỏ hàng vẫn dùng được trong phiên hiện tại */
    }
  }, [lines, ready]);

  const refreshCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      const res = await fetch('/api/catalog', { cache: 'no-store' });
      if (!res.ok) throw new Error('Không tải được danh mục sản phẩm.');
      const data = await res.json();
      const map: Record<string, CatalogProduct> = {};
      for (const product of (data.products || []) as CatalogProduct[]) {
        map[product.id] = product;
      }
      setProducts(map);
      setCatalogError(null);
    } catch (error: any) {
      setCatalogError(error?.message || 'Không tải được danh mục sản phẩm.');
    } finally {
      setLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const addToCart = useCallback(
    (productId: string, quantity = 1) => {
      const product = products[productId];
      if (!product) {
        return { ok: false, message: 'Sản phẩm chưa tải xong, vui lòng thử lại sau giây lát.' };
      }
      if (product.stock <= 0) {
        return { ok: false, message: `"${product.name}" đã hết hàng.` };
      }

      const current = lines.find((line) => line.productId === productId)?.quantity || 0;
      const next = current + quantity;
      if (next > product.stock) {
        return {
          ok: false,
          message: `Chỉ còn ${product.stock} sản phẩm "${product.name}" trong kho.`,
        };
      }

      setLines((prev) => {
        const existing = prev.find((line) => line.productId === productId);
        if (existing) {
          return prev.map((line) => (line.productId === productId ? { ...line, quantity: next } : line));
        }
        return [...prev, { productId, quantity: next }];
      });
      setLastAddedAt(Date.now());
      return { ok: true, message: `Đã thêm "${product.name}" vào giỏ hàng.` };
    },
    [lines, products]
  );

  const setQuantity = useCallback(
    (productId: string, quantity: number) => {
      const product = products[productId];
      const max = product?.stock ?? 99;
      const value = Math.max(1, Math.min(Math.round(quantity), max, 99));
      setLines((prev) => prev.map((line) => (line.productId === productId ? { ...line, quantity: value } : line)));
    },
    [products]
  );

  const removeLine = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const totalCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);

  const subtotal = useMemo(
    () =>
      lines.reduce((sum, line) => {
        const product = products[line.productId];
        return sum + (product ? product.price * line.quantity : 0);
      }, 0),
    [lines, products]
  );

  const value: CartContextValue = {
    lines,
    products,
    loadingCatalog,
    catalogError,
    addToCart,
    setQuantity,
    removeLine,
    clearCart,
    totalCount,
    subtotal,
    ready,
    lastAddedAt,
    refreshCatalog,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được dùng bên trong <CartProvider>.');
  return context;
}
