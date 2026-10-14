'use client';

import React from 'react';
import { Check, Clock, PackageCheck, Truck, XCircle, Home, CircleDot } from 'lucide-react';
import { ORDER_STATUS_META, PROGRESS_STEPS, type OrderStatus } from '@/lib/orders/workflow';

interface OrderProgressProps {
  status: OrderStatus;
  /** Đã có sự kiện vận chuyển thật hay chưa (để nói rõ nguồn cập nhật). */
  hasCarrierEvent?: boolean;
}

const STEP_ICONS = [Clock, Check, PackageCheck, PackageCheck, Truck, Home, Check];

/**
 * Thanh tiến trình đơn hàng.
 * Chỉ hiển thị bước đã thực sự xảy ra theo trạng thái hiện tại — không tự suy diễn "đang giao"
 * khi chưa có sự kiện tương ứng.
 */
export default function OrderProgress({ status, hasCarrierEvent = false }: OrderProgressProps) {
  const meta = ORDER_STATUS_META[status];
  const isDanger = meta.tone === 'danger';
  const currentStep = meta.step;

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border p-4 ${
          isDanger ? 'border-rose-200 bg-rose-50' : meta.tone === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-terracotta-200 bg-dopaper-50'
        }`}
      >
        <div className="flex items-start gap-3">
          {isDanger ? (
            <XCircle className="w-5 h-5 text-rose-600 mt-0.5" />
          ) : meta.tone === 'success' ? (
            <Check className="w-5 h-5 text-emerald-600 mt-0.5" />
          ) : (
            <CircleDot className="w-5 h-5 text-terracotta-600 mt-0.5 animate-pulse" />
          )}
          <div>
            <span className="block text-sm font-bold text-lacquer-900">{meta.label}</span>
            <span className="block text-xs text-lacquer-800/75">{meta.description}</span>
            {['in_transit', 'out_for_delivery', 'delivered'].includes(status) && (
              <span className="block text-[11px] text-lacquer-800/60 mt-1">
                Nguồn cập nhật: {hasCarrierEvent ? 'sự kiện từ đơn vị vận chuyển' : 'quản trị viên cập nhật thủ công'}.
              </span>
            )}
          </div>
        </div>
      </div>

      <ol className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {PROGRESS_STEPS.map((step, index) => {
          const stepMeta = ORDER_STATUS_META[step.status];
          const done = !isDanger && currentStep > 0 && stepMeta.step <= currentStep;
          const active = !isDanger && stepMeta.step === currentStep;
          const Icon = STEP_ICONS[index] || Check;
          return (
            <li
              key={step.status}
              className={`p-3 rounded-xl border text-center space-y-1.5 ${
                done
                  ? 'border-terracotta-300 bg-white'
                  : 'border-terracotta-100 bg-dopaper-50/60 opacity-70'
              }`}
            >
              <div
                className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center ${
                  done ? 'bg-terracotta-500 text-white' : 'bg-dopaper-200 text-lacquer-800/50'
                } ${active ? 'ring-4 ring-terracotta-200' : ''}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className={`block text-[11px] font-semibold ${done ? 'text-lacquer-900' : 'text-lacquer-800/60'}`}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
