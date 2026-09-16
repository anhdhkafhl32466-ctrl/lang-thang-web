'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { generateRecommendations, QuizAnswers, RecommendationResult } from '@/lib/aiService';
import { unlockBadge } from '@/lib/passportStorage';
import confetti from 'canvas-confetti';
import {
  Sparkles, CheckCircle2, ArrowRight, RotateCcw, Clock, Compass,
  MapPin, Heart, Calendar, Utensils, Star, Award, MessageSquare, Send, Tag, Lightbulb, Info
} from 'lucide-react';

export default function AiRecommendationPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({
    interests: [],
    tripStyle: '',
    timeAvailable: '',
    priority: '',
    customDescription: ''
  });

  // Quick Chat Bar state (for users who want to describe in 1 step)
  const [quickInput, setQuickInput] = useState('');
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
    },
    {
      id: 'customDescription',
      question: '5. Thông tin khác: Mô tả tự do mong muốn & sở thích của bạn',
      subtitle: 'Gõ bất kỳ chi tiết nào (món muốn ăn, ngân sách, phương tiện, trẻ nhỏ...) để AI tư vấn chuẩn xác nhất',
      isCustomInput: true
    }
  ];

  const quickSuggestions = [
    '🍲 Thèm ăn cốm tươi gói lá sen và chả cốm nóng giòn',
    '📸 Muốn chụp ảnh sống ảo giữa những bó chân hương đỏ rực rỡ',
    '🌸 Đi cùng người yêu ngắm cánh đồng hoa và uống cà phê',
    '👨‍👩‍👧‍👦 Dẫn trẻ nhỏ xem múa rối nước và nặn tò he bột nếp',
    '🚆 Muốn đi bằng tàu điện trên cao Cát Linh mua khăn lụa',
    '🌿 Tìm nơi yên bình tĩnh lặng ven đê sông để nghỉ ngơi',
    '🏺 Muốn ngồi bàn xoay tự tay nặn cốc gốm và xem bảo tàng',
    '🎋 Chuồn chuồn tre thăng bằng và vãn cảnh Chùa Tây Phương',
    '🪡 Tìm hiểu kỹ thuật may áo dài khâu tay giấu chỉ hơn 1.000 năm'
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

  const handleCalculateRecommendations = (customAnswers?: QuizAnswers) => {
    const finalAnswers = customAnswers || answers;
    const recs = generateRecommendations(finalAnswers);
    setResults(recs);

    confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } });
    unlockBadge('badge-ai-matched');
  };

  const handleQuickChatSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickInput.trim()) return;

    const quickAnswers: QuizAnswers = {
      interests: [],
      tripStyle: '',
      timeAvailable: '',
      priority: '',
      customDescription: quickInput.trim()
    };
    setAnswers(quickAnswers);
    handleCalculateRecommendations(quickAnswers);
  };

  const handleSelectQuickSuggestion = (text: string) => {
    setQuickInput(text);
    const quickAnswers: QuizAnswers = {
      interests: [],
      tripStyle: '',
      timeAvailable: '',
      priority: '',
      customDescription: text
    };
    setAnswers(quickAnswers);
    handleCalculateRecommendations(quickAnswers);
  };

  const handleReset = () => {
    setCurrentQuestion(0);
    setAnswers({ interests: [], tripStyle: '', timeAvailable: '', priority: '', customDescription: '' });
    setQuickInput('');
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
            <span>Thuật Toán Khuyến Nghị AI Cá Nhân Hóa</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold text-lacquer-900 tracking-tight">
            Tìm làng nghề dành riêng cho bạn
          </h1>
          <p className="text-xs sm:text-sm text-lacquer-800/70 max-w-xl mx-auto leading-relaxed">
            Thuật toán AI phân tích đa chiều giữa sở thích, thời gian, cự ly và mô tả tự do của bạn để chọn ra điểm đến văn hóa Hà Nội tương thích nhất trong 16 làng nghề.
          </p>
        </div>

        {/* QUICK NATURAL LANGUAGE SEARCH / CHAT BAR (Option to skip quiz and describe directly) */}
        {!results && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-gold-300 shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-lacquer-900">
              <MessageSquare className="w-4 h-4 text-terracotta-600" />
              <span>Hoặc tự mô tả chuyến đi mơ ước của bạn (Chat với AI):</span>
            </div>

            <form onSubmit={handleQuickChatSubmit} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Ví dụ: 'Thèm ăn cốm tươi và đi nhanh 2 tiếng', 'Chụp ảnh chân hương với bạn bè'..."
                  className="w-full bg-dopaper-50/80 text-lacquer-900 text-xs sm:text-sm px-4 py-3 rounded-2xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500 focus:ring-1 focus:ring-terracotta-500"
                />
              </div>
              <button
                type="submit"
                disabled={!quickInput.trim()}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-terracotta-500 to-gold-500 hover:from-terracotta-600 hover:to-gold-600 text-white text-xs sm:text-sm font-bold shadow-md hover:shadow-lg disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Đề xuất ngay</span>
              </button>
            </form>

            {/* Quick Clickable Suggestions */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-lacquer-800/60 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-gold-600" />
                <span>Gợi ý nhanh (nhấn để AI tìm ngay):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickSuggestions.slice(0, 5).map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectQuickSuggestion(sug)}
                    className="text-[11px] bg-dopaper-100 hover:bg-terracotta-50 hover:border-terracotta-400 text-lacquer-900 border border-terracotta-200/80 px-2.5 py-1 rounded-full transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

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

            {/* Step 5: Custom Natural Language Input (Thanh chat / Tự mô tả) */}
            {currentQ.isCustomInput ? (
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    rows={4}
                    value={answers.customDescription || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, customDescription: e.target.value }))}
                    placeholder="Nhập tự do mong muốn của bạn tại đây... Ví dụ:&#10;• 'Mình muốn dẫn người yêu đi ngắm hoa và thưởng trà vào sáng sớm'&#10;• 'Thèm ăn cốm mộc Mễ Trì, muốn đi gần trong 2 tiếng'&#10;• 'Dẫn 2 bé đi xem múa rối nước và nặn tò he'&#10;• 'Muốn mua khăn lụa tơ tằm đi bằng tàu điện trên cao'..."
                    className="w-full p-4 rounded-2xl bg-dopaper-50/70 border-2 border-terracotta-200 focus:border-terracotta-500 focus:bg-white text-xs sm:text-sm text-lacquer-900 leading-relaxed outline-none transition-all"
                  />
                  <div className="absolute bottom-3 right-3 text-[11px] text-lacquer-800/50">
                    AI sẽ đọc hiểu và cộng điểm chính xác
                  </div>
                </div>

                {/* Suggestions click-to-add */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-lacquer-900 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-terracotta-600" />
                    <span>Chạm để thêm nhanh vào mô tả của bạn:</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {quickSuggestions.map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setAnswers(prev => {
                            const cur = prev.customDescription ? prev.customDescription + '; ' : '';
                            return { ...prev, customDescription: cur + sug };
                          });
                        }}
                        className="text-xs px-3 py-1.5 rounded-xl bg-dopaper-100 hover:bg-terracotta-50 text-lacquer-900 border border-terracotta-200 hover:border-terracotta-400 transition-colors"
                      >
                        + {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Options Grid for Questions 1-4 */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQ.options?.map((opt) => {
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
            )}

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
                  onClick={() => handleCalculateRecommendations()}
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-terracotta-200">
              <div className="flex items-center gap-2 text-xs font-bold text-terracotta-700">
                <CheckCircle2 className="w-4 h-4 text-bamboo-600" />
                <span>
                  {answers.customDescription
                    ? `Đã phân tích yêu cầu: "${answers.customDescription.slice(0, 50)}${answers.customDescription.length > 50 ? '...' : ''}"`
                    : 'Đã phân tích toàn diện 16 làng nghề dựa trên hồ sơ của bạn'}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-terracotta-600 hover:underline flex items-center gap-1 font-semibold self-end sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Làm lại / Thay đổi mô tả</span>
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

                    <div className="absolute top-4 left-4 px-3.5 py-1 rounded-full bg-gold-400 text-lacquer-950 text-xs font-bold shadow flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>Đề xuất số 1 dành riêng cho bạn</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row sm:items-end justify-between gap-2 text-white">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs text-gold-300 font-semibold uppercase tracking-wider">
                            {top1.village.category} • {top1.village.location.district}
                          </span>
                          <span className="text-xs bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-white/90">
                            Cách trung tâm {top1.village.location.distanceFromCenter}
                          </span>
                        </div>
                        <h2 className="font-serif text-2xl sm:text-4xl font-bold text-white drop-shadow">
                          {top1.village.name}
                        </h2>
                      </div>
                      <div className="px-4 py-2 rounded-2xl bg-terracotta-500/90 backdrop-blur-md text-white font-bold text-base sm:text-xl shadow">
                        {top1.matchScore}% Phù hợp
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-10 space-y-6">
                    {/* Match Tags Pills */}
                    {top1.matchTags && top1.matchTags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {top1.matchTags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-gold-400/20 text-lacquer-900 border border-gold-400/50 text-xs font-bold flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 text-gold-600" />
                            <span>{tag}</span>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Why this village was chosen */}
                    <div className="space-y-2.5">
                      <h3 className="font-serif text-lg font-bold text-lacquer-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-gold-600" />
                        <span>Tại sao AI đề xuất {top1.village.name}?</span>
                      </h3>
                      <div className="space-y-2">
                        {top1.reasons.map((r, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-lacquer-800/85">
                            <span className="w-2 h-2 rounded-full bg-terracotta-500 mt-1.5 shrink-0" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggested Itinerary */}
                    <div className="p-5 rounded-2xl bg-dopaper-100/80 border border-terracotta-200 space-y-3">
                      <h4 className="font-serif text-base font-bold text-lacquer-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-terracotta-600" />
                        <span>Lịch trình trải nghiệm gợi ý</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {top1.itinerary.map((item, idx) => (
                          <div key={idx} className="p-3.5 rounded-xl bg-white border border-terracotta-100 shadow-sm text-xs">
                            <span className="font-bold text-terracotta-600 block">{item.time}</span>
                            <span className="text-lacquer-800/85 mt-1 block leading-relaxed">{item.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Local Food Tip */}
                    <div className="p-4 rounded-2xl bg-amber-50/90 border border-gold-300 flex items-start gap-3">
                      <Utensils className="w-5 h-5 text-gold-600 shrink-0 mt-0.5" />
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-lacquer-900 block">Ẩm thực & Đặc sản địa phương nên thử:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-lacquer-800/85">
                          {top1.foodTips.map((tip, idx) => (
                            <li key={idx}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Travel Tip */}
                    <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 flex items-start gap-3">
                      <Compass className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-lacquer-900 block">Chỉ dẫn đường đi & Kinh nghiệm:</span>
                        <span className="text-lacquer-800/85 mt-0.5 block leading-relaxed">{top1.travelTip}</span>
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
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-xl font-bold text-lacquer-900">
                  Các lựa chọn phù hợp tiếp theo
                </h3>
                <span className="text-xs text-lacquer-800/60 font-semibold">
                  Tương thích cao từ thuật toán
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {results.slice(1, 3).map((res, rankIdx) => (
                  <div
                    key={res.village.id}
                    className="bg-white rounded-3xl border border-terracotta-200 p-5 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-gray-100">
                        <img
                          src={res.village.heroImage}
                          alt={res.village.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-lacquer-950/80 backdrop-blur-sm text-gold-400 text-[11px] font-bold">
                          # {rankIdx + 2} Đề cử
                        </div>
                        <div className="absolute top-2.5 right-2.5 px-3 py-1 rounded-full bg-terracotta-600/90 backdrop-blur-sm text-white text-xs font-bold">
                          {res.matchScore}% Phù hợp
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-terracotta-600 uppercase">
                          {res.village.category}
                        </span>
                        <span className="text-[11px] text-lacquer-800/60">
                          {res.village.location.distanceFromCenter}
                        </span>
                      </div>

                      <h4 className="font-serif text-lg font-bold text-lacquer-900">
                        {res.village.name}
                      </h4>

                      <p className="text-xs text-lacquer-800/75 line-clamp-2 leading-relaxed">
                        {res.reasons[0]}
                      </p>

                      {/* Small food preview */}
                      <div className="text-[11px] text-lacquer-800/70 flex items-center gap-1.5 pt-1 border-t border-terracotta-100">
                        <Utensils className="w-3 h-3 text-gold-600 shrink-0" />
                        <span className="truncate">{res.foodTips[0]}</span>
                      </div>
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
