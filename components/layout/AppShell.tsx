'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import PassportModal from './PassportModal';
import ChatbotDrawer from '../ai/ChatbotDrawer';
import HeritageLoadingScreen from './HeritageLoadingScreen';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [passportOpen, setPassportOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-dopaper-50 text-lacquer-900 selection:bg-terracotta-200 selection:text-terracotta-900">
      {/* Màn hình khởi động di sản Thăng Long hoàng gia vàng đồng */}
      <HeritageLoadingScreen />

      <Navbar onOpenPassport={() => setPassportOpen(true)} />

      <main className="flex-grow pt-20 lg:pt-24">
        {children}
      </main>

      <Footer />
      <MobileNav onOpenPassport={() => setPassportOpen(true)} />
      <ChatbotDrawer />
      <PassportModal isOpen={passportOpen} onClose={() => setPassportOpen(false)} />
    </div>
  );
}
