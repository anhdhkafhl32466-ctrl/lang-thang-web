'use client';

import React, { useState } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import PassportModal from './PassportModal';
import ChatbotDrawer from '../ai/ChatbotDrawer';
import SplashScreen from './SplashScreen';
import { CartProvider } from '@/lib/client/cart';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [passportOpen, setPassportOpen] = useState(false);

  return (
    <CartProvider>
    <div className="min-h-screen flex flex-col bg-transparent text-lacquer-900 selection:bg-terracotta-200 selection:text-terracotta-900">
      {/* Màn hình Splash Screen màu nước Lang Thang nghệ thuật */}
      <SplashScreen />

      <Navbar onOpenPassport={() => setPassportOpen(true)} />

      <main className="flex-grow pt-16 sm:pt-20 lg:pt-24 pb-16 md:pb-0">
        {children}
      </main>

      <Footer />
      <MobileNav onOpenPassport={() => setPassportOpen(true)} />
      <ChatbotDrawer />
      <PassportModal isOpen={passportOpen} onClose={() => setPassportOpen(false)} />
    </div>
    </CartProvider>
  );
}
