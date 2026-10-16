import type { Metadata } from 'next';
import Link from 'next/link';
import { Hammer, Palette, Ruler, Sparkles } from 'lucide-react';
import BespokeStudio from '@/components/ai/BespokeStudio';
import { CRAFT_BLANKS } from '@/lib/craftBlanks';

export const metadata: Metadata = {
  title: 'Sáng tạo tác phẩm cùng AI | Lang Thang — Làng Nghề Hà Nội',
  description:
    'Cùng trí tuệ nhân tạo sáng tạo tác phẩm nghệ thuật chân thực lên phôi gốm Bát Tràng, lụa Vạn Phúc, nón làng Chuông và tranh khắc gỗ Hạ Thái, rồi đặt nghệ nhân của chính làng nghề đó chế tác thành sản phẩm độc bản.',
};

const STEPS = [
  {
    icon: Ruler,
    title: 'Chọn phôi của một làng nghề',
    body: 'Mỗi phôi gắn với một làng: gốm Bát Tràng, lụa Vạn Phúc, nón làng Chuông, tranh khắc gỗ Hạ Thái.',
  },
  {
    icon: Sparkles,
    title: 'Kể ý tưởng, AI vẽ tác phẩm chân thực',
    body: 'Mô hình AI tạo ảnh nghệ thuật chân thực chuẩn 8K sống động, dựng bản phác hoa văn và bảng màu ngay trước mắt bạn.',
  },
  {
    icon: Palette,
    title: 'Duyệt ảnh AI & phiếu kỹ thuật',
    body: 'Bản thiết kế gồm ảnh mô phỏng nghệ thuật sắc nét và phiếu kỹ thuật ghi rõ màu sắc, hoạ tiết để nghệ nhân chép lại.',
  },
  {
    icon: Hammer,
    title: 'Nghệ nhân báo giá và chế tác',
    body: 'Yêu cầu tới đúng xưởng của làng nghề tương ứng. Nghệ nhân báo giá, bạn đồng ý rồi mới bắt đầu làm.',
  },
];

export default function DongSangTaoPage() {
  return (
    <div className="min-h-screen bg-dopaper-50">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        {/* ---------------------------------- mở đầu --------------------------------- */}
        <header className="max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-terracotta-700 bg-terracotta-50 border border-terracotta-200 rounded-full px-3 py-1.5">
            <Sparkles className="w-3.5 h-3.5" /> Sáng tạo & đặt làm theo yêu cầu
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight font-bold text-lacquer-900 mt-4">
            Bạn và AI cùng sáng tạo, nghệ nhân làng nghề làm ra tác phẩm độc bản
          </h1>
          <p className="text-lacquer-800/80 leading-relaxed mt-4">
            Mô tả ý tưởng bằng lời, AI sẽ tạo nên bức tranh nghệ thuật chân thực tuyệt mỹ mô phỏng trực tiếp trên phôi làng nghề bạn chọn. Bản thiết kế đi kèm ảnh tác phẩm độ nét cao và phiếu kỹ thuật chi tiết để chuyển tới tận tay nghệ nhân làng nghề chế tác thủ công.
          </p>
        </header>

        {/* --------------------------------- các bước -------------------------------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
          {STEPS.map((step, index) => (
            <div key={step.title} className="bg-white rounded-3xl border border-terracotta-200 shadow-warm p-5">
              <span className="w-9 h-9 rounded-2xl bg-dopaper-100 border border-dopaper-300 flex items-center justify-center">
                <step.icon className="w-4 h-4 text-terracotta-600" />
              </span>
              <p className="text-[11px] font-bold text-terracotta-600 mt-3">Bước {index + 1}</p>
              <p className="font-bold text-sm text-lacquer-900 mt-1">{step.title}</p>
              <p className="text-[12px] text-lacquer-800/70 leading-relaxed mt-1.5">{step.body}</p>
            </div>
          ))}
        </div>

        {/* --------------------------------- bốn phôi -------------------------------- */}
        <div className="flex flex-wrap items-center gap-2 mt-8">
          <span className="text-[11px] font-bold uppercase tracking-wider text-lacquer-800/60">Phôi đang mở:</span>
          {CRAFT_BLANKS.map((blank) => (
            <Link
              key={blank.id}
              href={`/lang-nghe/${blank.villageSlug}`}
              className="text-[11px] font-semibold text-lacquer-900 bg-white border border-terracotta-200 rounded-full px-3 py-1.5 hover:bg-terracotta-50 transition-colors"
            >
              {blank.shortName} · {blank.villageName}
            </Link>
          ))}
        </div>

        {/* -------------------------------- xưởng làm việc ------------------------------- */}
        <div className="mt-10">
          <BespokeStudio />
        </div>
      </div>
    </div>
  );
}
