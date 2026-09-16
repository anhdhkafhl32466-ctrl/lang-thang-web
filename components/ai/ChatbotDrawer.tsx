'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  X, Send, Sparkles, Bot, User, ArrowRight,
  Settings, Key, Trash2, ExternalLink, Cpu,
  CheckCircle2, Compass, MapPin
} from 'lucide-react';
import { generateSmartLocalAnswer, AiResponseResult } from '@/lib/craftAiEngine';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  source?: string;
  suggestedFollowUps?: string[];
  relatedVillageSlug?: string;
}

export default function ChatbotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [activeApiKey, setActiveApiKey] = useState('');
  const [savedKeySuccess, setSavedKeySuccess] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Xin chào! Tôi là **Trợ lý Thông Minh Làng Nghề Hà Nội 2.0** 🏮.\n\nTôi nắm rõ toàn bộ dữ liệu chi tiết của **16 làng nghề truyền thống Thủ đô** (lịch trình, cách đi xe buýt, món ăn đặc sản, góc chụp ảnh sống ảo triệu view và chi phí chi tiết). Bạn muốn khám phá điều gì hôm nay?',
      timestamp: 'Vừa xong',
      source: 'local-expert-engine',
      suggestedFollowUps: [
        'Làng nghề nào gần trung tâm nhất?',
        'Tọa độ chụp ảnh sống ảo triệu view?',
        'Gia đình có trẻ nhỏ nên đi đâu?',
        'Có 300k thì nên trải nghiệm gì?'
      ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Quick initial prompts
  const quickPrompts = [
    'Thèm ăn cốm tươi và đặc sản?',
    'Chỉ rảnh 2-3 tiếng gần trung tâm?',
    'Gia đình có trẻ nhỏ nên đi đâu?',
    'Chụp ảnh sống ảo triệu view?',
    'Có 300k đi xe buýt thế nào?',
    'Tour 1 ngày kết hợp 2 làng nghề?'
  ];

  // Load user API key from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('gemini_user_api_key') || '';
      if (stored) {
        setActiveApiKey(stored);
        setApiKeyInput(stored);
      }
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, loading]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKey = apiKeyInput.trim();
    if (cleanKey) {
      localStorage.setItem('gemini_user_api_key', cleanKey);
      setActiveApiKey(cleanKey);
    } else {
      localStorage.removeItem('gemini_user_api_key');
      setActiveApiKey('');
    }
    setSavedKeySuccess(true);
    setTimeout(() => {
      setSavedKeySuccess(false);
      setShowSettings(false);
    }, 1200);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'bot',
        text: 'Cuộc trò chuyện đã được làm mới! Bạn muốn tôi tư vấn về làng nghề nào?',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestedFollowUps: [
          'Gợi ý lịch trình 1 ngày',
          'Đặc sản ẩm thực làng nghề',
          'Cách đi xe buýt đến Bát Tràng'
        ]
      }
    ]);
  };

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      let resData: AiResponseResult | null = null;

      // 1. Attempt call to backend /api/chat (passes apiKey if configured)
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: textToSend,
            apiKey: activeApiKey
          })
        });

        if (res.ok) {
          resData = await res.json();
        }
      } catch (e) {
        console.warn('API call failed, running local engine in browser:', e);
      }

      // 2. Client-side local engine fallback
      if (!resData || !resData.reply) {
        resData = generateSmartLocalAnswer(textToSend);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: resData.reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        source: resData.source,
        suggestedFollowUps: resData.suggestedFollowUps,
        relatedVillageSlug: resData.relatedVillageSlug
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'Xin lỗi, có gián đoạn nhẹ. Bạn có thể bấm vào các câu hỏi gợi ý bên dưới để nhận câu trả lời ngay nhé!',
        timestamp: 'Vừa xong'
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-terracotta-500 via-terracotta-600 to-amber-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center border-2 border-white/80"
          aria-label="Trợ lý AI Làng nghề"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <Bot className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-gold-400 rounded-full border-2 border-white animate-pulse" />
            </>
          )}
          {!isOpen && (
            <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-lacquer-900 text-white text-xs font-semibold shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden sm:inline-block">
              Hỏi Trợ lý AI Làng nghề Hà Nội ✨
            </span>
          )}
        </button>
      </div>

      {/* Slide-over Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 lg:bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[450px] h-[600px] max-h-[85vh] bg-dopaper-50 rounded-3xl shadow-2xl border-2 border-terracotta-300 flex flex-col overflow-hidden animate-fadeIn font-sans">
          {/* Header */}
          <div className="bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-terracotta-700 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-400 text-lacquer-900 flex items-center justify-center font-bold text-lg shadow-sm">
                <Sparkles className="w-5 h-5 text-lacquer-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-serif font-bold text-sm sm:text-base text-white">
                    Trợ Lý Làng Nghề AI 2.0
                  </h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold-400/30 text-gold-200 border border-gold-400/40 font-semibold">
                    Pro
                  </span>
                </div>
                <span className="text-[11px] text-dopaper-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeApiKey ? 'Đã bật Gemini 1.5 Flash Cloud LLM ⚡' : 'Engine Chuyên Gia 16 Làng Nghề 🧠'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors ${
                  showSettings ? 'bg-white/20' : ''
                }`}
                title="Cài đặt AI & API Key"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                title="Làm mới cuộc trò chuyện"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Settings Panel Drawer */}
          {showSettings && (
            <div className="p-3.5 bg-amber-50/95 border-b border-amber-200 text-xs space-y-2.5 animate-fadeIn shrink-0">
              <div className="flex items-center justify-between text-amber-900 font-bold">
                <span className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-amber-600" />
                  <span>Cấu hình Động cơ AI (Tùy chọn)</span>
                </span>
                <span className="text-[10px] text-amber-700 font-normal">
                  {activeApiKey ? 'Đang dùng Gemini API Key' : 'Mặc định: Offline Engine 2.0'}
                </span>
              </div>

              <p className="text-[11px] text-amber-800/80 leading-relaxed">
                Mặc định hệ thống chạy <strong>Engine Chuyên gia Làng nghề 2.0</strong> (phản hồi tức thì, không cần mạng).
                Nếu bạn muốn AI trò chuyện tự do bằng <strong>Google Gemini 1.5 Flash</strong>, hãy dán API key miễn phí từ <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-semibold text-terracotta-600">Google AI Studio</a>.
              </p>

              <form onSubmit={handleSaveApiKey} className="flex gap-1.5">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="Dán Gemini API Key (AIzaSy...)"
                  className="flex-1 px-3 py-1.5 rounded-lg border border-amber-300 text-xs bg-white text-gray-900 outline-none focus:border-terracotta-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold text-xs transition-colors shrink-0 flex items-center gap-1"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Lưu</span>
                </button>
              </form>

              {savedKeySuccess && (
                <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đã cập nhật cấu hình AI thành công!</span>
                </div>
              )}
            </div>
          )}

          {/* Quick Prompts Bar */}
          <div className="bg-dopaper-100/90 border-b border-terracotta-200/60 p-2 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white text-lacquer-900 text-[11px] font-medium border border-terracotta-200 hover:border-terracotta-400 hover:bg-terracotta-50 transition-colors shrink-0 disabled:opacity-50 shadow-xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
            {messages.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <div className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-terracotta-500 to-amber-600 text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-sm mt-0.5">
                      AI
                    </div>
                  )}

                  <div
                    className={`max-w-[86%] rounded-2xl px-3.5 py-3 shadow-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-terracotta-500 text-white rounded-br-none'
                        : 'bg-white text-lacquer-900 border border-terracotta-200/80 rounded-bl-none'
                    }`}
                  >
                    <div className="whitespace-pre-line leading-relaxed">{m.text}</div>

                    {/* Link to Village page if relevant */}
                    {m.relatedVillageSlug && (
                      <div className="mt-2 pt-2 border-t border-terracotta-100 flex items-center justify-end">
                        <Link
                          href={`/lang-nghe/${m.relatedVillageSlug}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-terracotta-600 hover:underline"
                        >
                          <span>Xem toàn bộ thông tin làng nghề này</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] mt-1.5">
                      {m.sender === 'bot' && (
                        <span className="text-lacquer-800/40">
                          {m.source === 'gemini-1.5-flash' ? '⚡ Gemini 1.5 Flash' : '🧠 Engine Làng Nghề 2.0'}
                        </span>
                      )}
                      <span className={m.sender === 'user' ? 'text-white/70 ml-auto' : 'text-lacquer-800/40 ml-auto'}>
                        {m.timestamp}
                      </span>
                    </div>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-xl bg-gold-500 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Contextual Follow-up Chips for this Bot message */}
                {m.sender === 'bot' && m.suggestedFollowUps && m.suggestedFollowUps.length > 0 && (
                  <div className="pl-9 pr-2 flex flex-wrap gap-1.5 pt-0.5">
                    {m.suggestedFollowUps.map((chip, chipIdx) => (
                      <button
                        key={chipIdx}
                        onClick={() => handleSend(chip)}
                        disabled={loading}
                        className="text-[11px] px-2.5 py-1 rounded-xl bg-dopaper-100 hover:bg-terracotta-100 border border-terracotta-200/90 text-terracotta-700 font-medium transition-colors flex items-center gap-1 shadow-xs disabled:opacity-50 text-left"
                      >
                        <span>{chip}</span>
                        <ArrowRight className="w-2.5 h-2.5 shrink-0 opacity-70" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-lacquer-800/70 pl-9 animate-pulse">
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta-500 animate-bounce" />
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta-500 animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta-500 animate-bounce [animation-delay:0.4s]" />
                <span className="font-medium">AI đang phân tích và chuẩn bị lộ trình chi tiết...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-terracotta-200 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi về lịch trình, món ăn, xe buýt, ngân sách..."
                className="flex-1 bg-dopaper-100 text-lacquer-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white disabled:opacity-40 transition-colors shadow-sm flex items-center justify-center"
                aria-label="Gửi câu hỏi"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
