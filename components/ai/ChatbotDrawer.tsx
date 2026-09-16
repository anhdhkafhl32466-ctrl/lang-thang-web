'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, ArrowRight, CornerDownLeft } from 'lucide-react';
import { askCraftAssistant } from '@/lib/aiService';

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
}

export default function ChatbotDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'bot',
      text: 'Xin chào! Tôi là **Trợ lý Khám phá Làng nghề Hà Nội**. Tôi có thể gợi ý làng nghề phù hợp với thời gian, sở thích, ngân sách hoặc lịch trình cho chuyến đi của bạn. Bạn muốn khám phá điều gì hôm nay?',
      timestamp: 'Vừa xong'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Thèm ăn cốm tươi và đặc sản ẩm thực?',
    'Chỉ rảnh 2-3 tiếng gần trung tâm?',
    'Gia đình có trẻ nhỏ nên đi làng nào?',
    'Tọa độ chụp ảnh sống ảo triệu view?',
    'Đi đâu chơi cuối tuần 1 ngày?',
    'Có 300k thì nên trải nghiệm gì?',
    'Mua quà lưu niệm nào ý nghĩa?'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
      // First attempt to call backend API if available, fallback to client service
      let reply = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: textToSend })
        });
        if (res.ok) {
          const data = await res.json();
          reply = data.reply;
        }
      } catch {
        // Fallback to client service
      }

      if (!reply) {
        reply = await askCraftAssistant(textToSend);
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: reply,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: 'Xin lỗi, có lỗi kết nối nhẹ. Bạn có thể thử chọn các câu hỏi gợi ý bên dưới nhé!',
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
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center justify-center border-2 border-white/80"
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
              Hỏi AI về Làng nghề Hà Nội ✨
            </span>
          )}
        </button>
      </div>

      {/* Slide-over Chat Box */}
      {isOpen && (
        <div className="fixed bottom-24 lg:bottom-20 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] h-[550px] max-h-[82vh] bg-dopaper-50 rounded-2xl shadow-2xl border-2 border-terracotta-300 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header */}
          <div className="bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-terracotta-700 text-white p-4 flex items-center justify-between shrink-0 shadow">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold-400 text-lacquer-900 flex items-center justify-center font-bold text-lg shadow">
                <Sparkles className="w-5 h-5 text-lacquer-900" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-white">
                  Trợ Lý Làng Nghề AI
                </h3>
                <span className="text-[11px] text-dopaper-200 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Sẵn sàng tư vấn lịch trình & trải nghiệm
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Questions Pills */}
          <div className="bg-dopaper-100/90 border-b border-terracotta-200/60 p-2.5 overflow-x-auto flex gap-1.5 no-scrollbar shrink-0">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white text-lacquer-900 text-xs border border-terracotta-200/80 hover:border-terracotta-400 hover:bg-terracotta-50 transition-colors shrink-0 disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-terracotta-500 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 shadow-sm text-xs sm:text-sm leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-terracotta-500 text-white rounded-br-none'
                      : 'bg-white text-lacquer-900 border border-terracotta-200/70 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line">{m.text}</div>
                  <div
                    className={`text-[10px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-white/70' : 'text-lacquer-800/50'
                    }`}
                  >
                    {m.timestamp}
                  </div>
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-gold-500 text-white flex items-center justify-center shrink-0 text-xs shadow-sm mt-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-lacquer-800/60 pl-9">
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta-500 animate-bounce" />
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta-500 animate-bounce [animation-delay:0.2s]" />
                <span className="inline-block w-2 h-2 rounded-full bg-terracotta-500 animate-bounce [animation-delay:0.4s]" />
                <span>AI đang tìm kiếm dữ liệu làng nghề...</span>
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
                placeholder="Hỏi về lịch trình, món ăn, ngân sách..."
                className="flex-1 bg-dopaper-100 text-lacquer-900 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-terracotta-200 focus:outline-none focus:border-terracotta-500"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-2.5 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white disabled:opacity-40 transition-colors shadow-sm"
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
