'use client';

import React from 'react';
import { SILK_PRODUCTS, SilkProduct, SILK_BASE_COLORS, SILK_THREAD_COLORS } from './silkConstants';
import SilkCanvasPreview from './SilkCanvasPreview';
import { silkSound } from './SilkSoundEffects';
import { Sparkles, ArrowRight, Check, Compass, Award } from 'lucide-react';

interface Step1ProductSelectProps {
  selectedProduct: SilkProduct;
  onSelectProduct: (product: SilkProduct) => void;
  onNext: () => void;
}

export default function Step1ProductSelect({
  selectedProduct,
  onSelectProduct,
  onNext
}: Step1ProductSelectProps) {
  const sampleBase = SILK_BASE_COLORS[1]; // Đỏ trầm
  const sampleThread = SILK_THREAD_COLORS[0]; // Vàng kim tuyến

  const handleChoose = (p: SilkProduct) => {
    silkSound.playPop();
    onSelectProduct(p);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Intro Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/20 text-lacquer-950 text-xs font-bold border border-gold-500/30">
          <Sparkles className="w-3.5 h-3.5 text-gold-600" />
          <span>Bước 1: Chọn Sản Phẩm Khởi Đầu</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
          Bạn muốn dệt nên tuyệt tác lụa nào hôm nay?
        </h2>
        <p className="text-sm text-lacquer-800/70 leading-relaxed">
          Mỗi sản phẩm đều mang một cốt cách riêng của lụa Vạn Phúc: từ tấm khăn vuông đoan trang, khăn quàng thướt tha đến chiếc túi lụa quai tre tiện dụng.
        </p>
      </div>

      {/* Product Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SILK_PRODUCTS.map((prod) => {
          const isSelected = selectedProduct.id === prod.id;

          return (
            <div
              key={prod.id}
              onClick={() => handleChoose(prod)}
              className={`group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 flex flex-col justify-between border-2 bg-white/80 backdrop-blur-sm ${
                isSelected
                  ? 'border-gold-500 shadow-xl ring-2 ring-gold-400/30 -translate-y-1 bg-gradient-to-b from-dopaper-50 to-white'
                  : 'border-dopaper-300/70 hover:border-gold-400/60 hover:shadow-lg hover:-translate-y-0.5'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-4 right-4 bg-gold-500 text-white rounded-full p-1 shadow-md">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}

              {/* Tag */}
              <div className="mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-800 border border-gold-300/50">
                  {prod.tag}
                </span>
              </div>

              {/* Visual Preview */}
              <div className="w-full h-48 sm:h-52 flex items-center justify-center p-3 rounded-xl bg-dopaper-100/60 border border-dopaper-200/50 mb-4 overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                <div className="max-w-[210px] max-h-[170px] w-full flex items-center justify-center">
                  <SilkCanvasPreview
                    product={prod}
                    baseColor={sampleBase}
                    weaveTexture="brocade"
                    threadColor={sampleThread}
                    motifs={[]}
                    interactive={false}
                    showDrapeShadows={true}
                  />
                </div>
              </div>

              {/* Text Info */}
              <div className="space-y-2 flex-grow">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-serif text-lg font-bold text-lacquer-900 group-hover:text-terracotta-600 transition-colors">
                    {prod.name}
                  </h3>
                  <span className="text-xs font-mono text-lacquer-800/60 font-semibold">
                    {prod.realDimensions}
                  </span>
                </div>
                <p className="text-xs text-lacquer-800/70 leading-relaxed line-clamp-3">
                  {prod.description}
                </p>
              </div>

              {/* Finishing Info Note */}
              <div className="mt-4 pt-3 border-t border-dopaper-200/70 text-[11px] text-lacquer-800/60 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gold-600 shrink-0" />
                <span>Hoàn thiện: <strong className="text-lacquer-900 font-medium">{prod.finishingMethod}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-gradient-to-r from-lacquer-900 via-lacquer-800 to-lacquer-900 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-11 h-11 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center shrink-0 border border-gold-400/30">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif text-base font-bold text-gold-200">
              Đã chọn: {selectedProduct.name}
            </h4>
            <p className="text-xs text-dopaper-200/80">
              Quy chuẩn tơ lụa làng Vạn Phúc • Khổ vải {selectedProduct.realDimensions}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            silkSound.playChime(1);
            onNext();
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-lacquer-950 font-bold text-sm shadow-lg hover:shadow-gold-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <span>Bước 2: Sáng Tạo Thiết Kế</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
