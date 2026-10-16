'use client';

import React, { useState } from 'react';
import { Sparkles, ArrowRight, Layers, Hand, UserCheck, Package, Heart, Gamepad2, Compass, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function StorytellingTimeline() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: 'dat',
      title: '1. Đất mẹ',
      sub: 'Cội nguồn nguyên bản',
      icon: Layers,
      description: 'Phù sa sông Hồng, đất sét trắng cao lanh, tre nứa ngàn năm xứ Đoài – tất cả bắt đầu từ món quà hào phóng của đất trời Thăng Long.',
      quote: 'Mỗi nắm đất, mỗi gióng tre đều mang theo hơi thở của ngàn năm lịch sử.',
      image: '/images/villages/bat-trang/market.jpg'
    },
    {
      id: 'tay',
      title: '2. Đôi tay',
      sub: 'Kỹ nghệ thủ công',
      icon: Hand,
      description: 'Bàn tay chai sần qua năm tháng chuốt từng đường cong trên bàn xoay, se từng sợi tơ tằm óng ả, vuốt từng vành nón lá bài thơ.',
      quote: 'Không máy móc nào thay thế được sự nhạy cảm của những đầu ngón tay nghệ nhân.',
      image: '/images/villages/bat-trang/artisan_wheel.jpg'
    },
    {
      id: 'nghe-nhan',
      title: '3. Nghệ nhân',
      sub: 'Linh hồn di sản',
      icon: UserCheck,
      description: 'Những người cả đời giữ lửa trong lò nung, thức trọn đêm cùng tiếng kén tằm và gìn giữ bí quyết gia truyền qua bao thế hệ.',
      quote: 'Giữ nghề không chỉ để mưu sinh, mà để dòng chảy tổ tiên không bao giờ ngắt đoạn.',
      image: '/images/villages/van-phuc/weaver.jpg'
    },
    {
      id: 'san-pham',
      title: '4. Tác phẩm',
      sub: 'Đỉnh cao thẩm mỹ',
      icon: Package,
      description: 'Bình hoa men rạn, tơ lụa vạn hoa, quạt lông vũ, tranh Hàng Trống – những tuyệt tác định hình bản sắc văn hóa kinh kỳ.',
      quote: 'Mỗi sản phẩm là một tác phẩm nghệ thuật mang tâm hồn người sáng tạo.',
      image: '/images/villages/chuong/non_la_museum.jpg'
    },
    {
      id: 'van-hoa',
      title: '5. Văn hóa',
      sub: 'Ký ức Thăng Long',
      icon: Heart,
      description: 'Lễ hội đình làng, tục rước lửa, câu ca dao truyền miệng và những câu chuyện về các vị tổ nghề được lưu truyền qua hàng thế kỷ.',
      quote: 'Văn hóa làng nghề là cội nguồn của tinh hoa văn hóa Thăng Long nghìn năm.',
      image: '/images/villages/bat-trang/hero.jpg'
    },
    {
      id: 'trai-nghiem',
      title: '6. Trải nghiệm',
      sub: 'Tương tác sống động',
      icon: Gamepad2,
      description: 'Bước vào xưởng nghề ảo trên website: vuốt gốm trên bàn xoay điện, chọn men, nung lò và khâu nón bài thơ ngay trên màn hình.',
      quote: 'Chỉ khi tự tay thử làm, ta mới thấu cảm được sự kỳ công của người thợ thủ công.',
      image: '/images/villages/dao-thuc/puppet_show.jpg'
    },
    {
      id: 'du-lich',
      title: '7. Du lịch',
      sub: 'Hành trình thực tế',
      icon: Compass,
      description: 'Rời màn hình để lên tàu điện đến Vạn Phúc, đạp xe ngắm đê sông Đáy làng Chuông và nghe tiếng cười rộn rã tại thủy đình Đào Thục.',
      quote: 'Mỗi chuyến đi là một lần chạm vào ký ức sống của tiền nhân.',
      image: '/images/villages/quang-phu-cau/hero.jpg'
    },
    {
      id: 'thuong-mai',
      title: '8. Thương mại',
      sub: 'Kinh tế bền vững',
      icon: ShoppingBag,
      description: 'Kết nối sản phẩm làng nghề trực tiếp tới người tiêu dùng trẻ và du khách, giúp các nghệ nhân sống thịnh vượng với di sản của mình.',
      quote: 'Di sản chỉ thực sự trường tồn khi nó tạo ra giá trị kinh tế cho cộng đồng nuôi dưỡng nó.',
      image: '/images/villages/chuyen-my/inlay_screen.jpg'
    }
  ];

  return (
    <section className="py-20 texture-paper texture-paper--pottery relative overflow-hidden isolate border-y border-[#b89b78]/40">
      {/* Seamless Section Top & Bottom Gradient Blends */}
      <div className="section-blend-top" />
      <div className="section-blend-bottom" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/25 text-lacquer-950 text-xs font-semibold mb-3 border border-gold-400/40">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Dòng Chảy Tinh Hoa</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-lacquer-900">
            Câu chuyện từ hạt đất đến sản phẩm văn hóa
          </h2>
          <p className="text-sm sm:text-base text-lacquer-800/70 mt-2">
            Hành trình chuyển hóa di sản từ đôi bàn tay nghệ nhân đến trải nghiệm số và kinh tế bền vững cho các làng nghề Thủ đô.
          </p>
        </motion.div>

        {/* Step Selector Badges */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-10"
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={step.id}
                onClick={() => setActiveStep(idx)}
                className={`btn-elastic p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  isSelected
                    ? 'bg-terracotta-500 text-white border-terracotta-500 shadow-md shadow-terracotta-500/30 scale-105'
                    : 'bg-[#FAF5ED] text-lacquer-800/80 border-[#d6c4ac] hover:bg-[#F2EAE0]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-terracotta-600'}`} />
                <span className="text-xs font-bold whitespace-nowrap">{step.title}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Active Step Showcase Card with AnimatePresence */}
        <div className="bg-[#FAF5ED] rounded-3xl border border-[#b89b78]/60 shadow-xl overflow-hidden card-craft">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-0"
            >
              {/* Image visual */}
              <div className="lg:col-span-6 relative aspect-[16/10] lg:aspect-auto min-h-[320px] card-sheen">
                <img
                  src={steps[activeStep].image}
                  alt={steps[activeStep].title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent lg:hidden" />
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-xs font-medium text-gold-300">
                  {steps[activeStep].sub}
                </div>
              </div>

              {/* Copy description */}
              <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-terracotta-600 bg-terracotta-100 px-3 py-1 rounded-full">
                      Bước {activeStep + 1} / 8 trong chuỗi giá trị
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-lacquer-900">
                    {steps[activeStep].title}: {steps[activeStep].sub}
                  </h3>

                  <p className="text-sm sm:text-base text-lacquer-800/80 leading-relaxed">
                    {steps[activeStep].description}
                  </p>

                  <blockquote className="border-l-4 border-gold-500 pl-4 py-1.5 italic text-xs sm:text-sm text-lacquer-800/80 bg-dopaper-100/70 rounded-r-xl">
                    "{steps[activeStep].quote}"
                  </blockquote>
                </div>

                {/* Stepper controls & quick link */}
                <div className="pt-4 border-t border-terracotta-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveStep(prev => (prev > 0 ? prev - 1 : steps.length - 1))}
                      className="btn-elastic px-3.5 py-1.5 rounded-lg border border-terracotta-200 text-xs font-medium hover:bg-terracotta-50 text-lacquer-800"
                    >
                      ← Trước
                    </button>
                    <button
                      onClick={() => setActiveStep(prev => (prev < steps.length - 1 ? prev + 1 : 0))}
                      className="btn-elastic px-3.5 py-1.5 rounded-lg bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-semibold shadow-sm"
                    >
                      Tiếp theo →
                    </button>
                  </div>

                  <Link
                    href={activeStep >= 5 ? (activeStep === 5 ? '/trai-nghiem' : activeStep === 6 ? '/du-lich' : '/san-pham') : '/lang-nghe'}
                    className="btn-elastic text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
                  >
                    <span>Khám phá ngay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
