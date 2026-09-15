'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { generateRecommendations, QuizAnswers, RecommendationResult } from '@/lib/aiService';
import { unlockBadge } from '@/lib/passportStorage';
import confetti from 'canvas-confetti';
import {
  Sparkles, CheckCircle2, ArrowRight, RotateCcw, Clock, Compass,
  MapPin, Heart, Calendar, Utensils, Star, Award
} from 'lucide-react';

export default function AiRecommendationPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    interests: [],
    tripStyle: '',
    timeAvailable: '',
    priority: ''
  });

  const [results, setResults] = useState<RecommendationResult[] | null>(null);

  const questions = [
    {
      id: 'interests',
      question: '1. Bạn yêu thích điều gì nhất trong các chuyến đi văn hóa?',
      subtitle: 'Chọn những sở thích khiến bạn cảm thấy hào hứng nhất (có thể chọn nhiều)',
      options: [
        { label: 'Thủ công mỹ nghệ', value: 'thủ công', icon: '🎋' },
        { label: 'Chụp ảnh sống ảo', value: 'chụp ảnh', icon: '📸' },
        { label: 'Lịch sử & Cổ truyền', value: 'lịch sử', icon: '📜' },
        { label: 'Khám phá ẩm thực', value: 'ẩm thực', icon: '🍜' },
        { label: 'Tự tay làm nghề', value: 'tự tay làm', icon: '🏺' },
        { label: 'Mua sắm quà lưu niệm', value: 'mua sắm', icon: '🛍️' },
      ],
      isMulti: true
    },
    {
      id: 'tripStyle',
      question: '2. Bạn thích chuyến đi như thế nào?',
      subtitle: 'Chọn phong cách đồng hành lý tưởng cho chuyến đi sắp tới',
      options: [
        { label: 'Gia đình có trẻ em', value: 'gia đình', icon: '👨‍👩‍👧‍👦' },
        { label: 'Nhóm bạn bè sôi động', value: 'bạn bè', icon: '🎉' },
        { label: 'Cặp đôi lãng mạn', value: 'cặp đôi', icon: '💑' },
        { label: 'Đi một mình khám phá', value: 'một mình', icon: '🎒' },
        { label: 'Nghỉ ngơi thư giãn', value: 'thư giãn', icon: '🍃' },
      ],
      isMulti: false
    },
    {
      id: 'timeAvailable',
      question: '3. Bạn có bao nhiêu thời gian cho chuyến đi?',
      subtitle: 'Thời lượng bạn có thể dành ra để di chuyển và trải nghiệm',
      options: [
        { label: '2 – 3 giờ (Gần trung tâm)', value: '2-3h', icon: '⚡' },
        { label: 'Nửa ngày (Sáng hoặc chiều)', value: 'nửa ngày', icon: '🌤️' },
        { label: '1 ngày trọn vẹn', value: '1 ngày', icon: '☀️' },
        { label: 'Dịp cuối tuần thong thả', value: 'cuối tuần', icon: '🏕️' },
      ],
      isMulti: false
    },
    {
      id: 'priority',
      question: '4. Điều bạn quan tâm và mong muốn đạt được nhất là gì?',
      subtitle: 'Giá trị cốt lõi bạn tìm kiếm trong hành trình',
      options: [
        { label: 'Tự tay trải nghiệm làm nghề', value: 'trải nghiệm làm nghề', icon: '✨' },
        { label: 'Check-in phong cảnh đẹp', value: 'check-in sống ảo', icon: '🖼️' },
        { label: 'Tìm hiểu cội nguồn văn hóa', value: 'tìm hiểu văn hóa', icon: '🏛️' },
        { label: 'Mua quà thủ công độc bản', value: 'mua quà lưu niệm', icon: '🎁' },
      ],
      isMulti: false
    }
  ];

  const handleSelectOption = (questionId: string, value: string) => {
    if (questionId === 'interests') {
      setAnswers((prev) => {
        const current = prev.interests;
        const next = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, interests: next };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      }
    }
  };

  const handleCalculateRecommendations = () => {
    const recs = generateRecommendations(answers);
    setResults(recs);

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
    unlockBadge('badge-ai-matched');
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({ interests: [], tripStyle: '', timeAvailable: '', priority: '' });
    setResults(null);
  };

  const currentQ = questions[currentQuestion];

  return (
    <div className="min-h-screen py-10 sm:py-16 bg-dopaper-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-400/30 text-lacquer-950 text-xs font-bold border border-gold-400/40">
            <Sparkles className="w-3.5 h-3.5 text-gold-600" />
            <span>Thuật Toán Khuyến Nghị Cá Nhân Hóa</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
            Tìm làng nghề dành riêng cho bạn
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-xl mx-auto leading-relaxed">
            Thuật toán AI phân tích sở thích, ngân sách, thời gian và nhóm đồng hành để chọn ra điểm đến văn hóa Hà Nội tương thích nhất.
          </p>
        </div>

        {/* QUIZ INTERFACE */}
        {!results ? (
          <div className="bg-white rounded-3xl p-6 sm:p-10 border border-terracotta-200/90 shadow-xl space-y-8">
            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-lacquer-900">
                <span>Câu hỏi {currentQuestion + 1} / {questions.length}</span>
                <span>{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-dopaper-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-terracotta-500 h-full transition-all duration-300"
                  style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Current Question */}
            <div className="space-y-2">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-lacquer-900">
                {currentQ.question}
              </h2>
              <p className="text-xs text-lacquer-800/60">
                {currentQ.subtitle}
              </p>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.options.map((opt) => {
                const isSelected = currentQ.isMulti
                  ? answers.interests.includes(opt.value)
                  : (answers as any)[currentQ.id] === opt.value;

                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelectOption(currentQ.id, opt.value)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-terracotta-50 border-terracotta-500 shadow-sm'
                        : 'bg-dopaper-50/50 border-terracotta-200 hover:bg-dopaper-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{opt.icon}</span>
                      <span className="text-sm font-bold text-lacquer-900">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-terracotta-600 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Navigation buttons */}
            <div className="pt-4 border-t border-terracotta-100 flex items-center justify-between">
              <button
                disabled={currentQuestion === 0}
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl border border-terracotta-200 text-xs font-semibold text-lacquer-800 disabled:opacity-30"
              >
                ← Quay lại
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion((prev) => prev + 1)}
                  className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold shadow flex items-center gap-1.5"
                >
                  <span>Tiếp tục</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleCalculateRecommendations}
                  className="px-8 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-gold-500 hover:from-terracotta-600 hover:to-gold-600 text-white text-sm font-bold shadow-xl flex items-center gap-2 hover:scale-105 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Xem kết quả đề xuất AI</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* RECOMMENDATION RESULTS DISPLAY */
          <div className="space-y-10 animate-fadeIn">
            {/* Action Bar */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-terracotta-200">
              <div className="flex items-center gap-2 text-xs font-bold text-terracotta-700">
                <CheckCircle2 className="w-4 h-4 text-bamboo-600" />
                <span>Đã phân tích dựa trên hồ sơ sở thích của bạn</span>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-terracotta-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại trắc nghiệm</span>
              </button>
            </div>

            {/* TOP 1 MATCH (FEATURED HERO RESULT) */}
            {(() => {
              const top1 = results[0];
              return (
                <div className="bg-white rounded-3xl border-2 border-gold-400 shadow-2xl overflow-hidden">
                  <div className="relative aspect-[21/9] sm:aspect-[24/9] bg-gray-100">
                    <img
                      src={top1.village.heroImage}
                      alt={top1.village.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                    <div className="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-gold-400 text-lacquer-950 text-xs font-bold shadow flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Đề xuất số 1 dành riêng cho bạn</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
                      <div>
                        <span className="text-xs text-gold-300 font-semibold uppercase">
                          {top1.village.category} • {top1.village.location.district}
                        </span>
                        <h2 className="font-serif text-2xl sm:text-4xl font-bold">
                          {top1.village.name}
                        </h2>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-terracotta-500/90 backdrop-blur-md text-white font-bold text-base sm:text-xl shadow">
                        {top1.matchScore}% Phù hợp
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-10 space-y-6">
                    {/* Why this village was chosen */}
                    <div className="space-y-2">
                      <h3 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold-600" />
                        <span>Tại sao AI đề xuất {top1.village.name}?</span>
                      </h3>
                      <div className="space-y-1.5">
                        {top1.reasons.map((r, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-lacquer-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-terracotta-500 mt-2 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Itinerary */}
                    <div className="p-5 rounded-2xl bg-dopaper-100/70 border border-terracotta-200/80 space-y-3">
                      <h4 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-terracotta-600" />
                        <span>Lịch trình tham quan gợi ý</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {top1.itinerary.map((item, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-white border border-terracotta-100 text-xs">
                            <span className="font-bold text-terracotta-600 block">{item.time}</span>
                            <span className="text-lacquer-800/80 mt-0.5 block">{item.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Local Food Tip */}
                    <div className="p-4 rounded-2xl bg-amber-50/80 border border-gold-300 flex items-start gap-3">
                      <Utensils className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-lacquer-900 block">Ẩm thực địa phương nên thử:</span>
                        <span className="text-lacquer-800/80 mt-0.5 block">
                          {top1.foodTips.join(' • ')}
                        </span>
                      </div>
                    </div>

                    {/* CTAs */}
                    <div className="pt-4 border-t border-terracotta-100 flex flex-col sm:flex-row gap-3 justify-end">
                      {top1.village.gameUrl && (
                        <Link
                          href={top1.village.gameUrl}
                          className="px-5 py-2.5 rounded-xl bg-dopaper-100 hover:bg-terracotta-50 text-terracotta-700 text-xs font-bold border border-terracotta-300 text-center flex items-center justify-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Thử làm nghề ảo trước</span>
                        </Link>
                      )}
                      <Link
                        href={`/lang-nghe/${top1.village.slug}`}
                        className="px-6 py-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white text-xs font-bold text-center shadow flex items-center justify-center gap-1.5"
                      >
                        <span>Xem chi tiết làng nghề</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* TOP 2 & TOP 3 ALTERNATIVES */}
            <div className="space-y-4">
              <h3 className="font-serif text-xl font-bold text-lacquer-900">
                Các lựa chọn phù hợp tiếp theo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.slice(1, 3).map((res) => (
                  <div
                    key={res.village.id}
                    className="bg-white rounded-3xl border border-terracotta-200 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden">
                        <img
                          src={res.village.heroImage}
                          alt={res.village.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-lacquer-900/80 text-white text-xs font-bold">
                          {res.matchScore}% Phù hợp
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-terracotta-600 uppercase">
                        {res.village.category}
                      </span>
                      <h4 className="font-serif text-lg font-bold text-lacquer-900">
                        {res.village.name}
                      </h4>
                      <p className="text-xs text-lacquer-800/70 line-clamp-2">
                        {res.reasons[0]}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-terracotta-100 flex items-center justify-between">
                      <span className="text-xs text-lacquer-800/60">
                        {res.village.location.travelTime.split('bằng')[0]}
                      </span>
                      <Link
                        href={`/lang-nghe/${res.village.slug}`}
                        className="text-xs font-bold text-terracotta-600 hover:text-terracotta-700 flex items-center gap-1"
                      >
                        <span>Khám phá</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
