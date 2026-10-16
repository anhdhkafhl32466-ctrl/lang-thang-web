'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import Footer from './Footer';
import MobileNav from './MobileNav';
import PassportModal from './PassportModal';
import ChatbotDrawer from '../ai/ChatbotDrawer';
import SplashScreen from './SplashScreen';
import { CartProvider } from '@/lib/client/cart';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [passportOpen, setPassportOpen] = useState(false);
  const pathname = usePathname();

  return (
    <CartProvider>
    <div className="min-h-screen flex flex-col bg-transparent text-lacquer-900 selection:bg-terracotta-200 selection:text-terracotta-900">
      {/* Màn hình Splash Screen màu nước Lang Thang nghệ thuật */}
      <SplashScreen />

      <Navbar onOpenPassport={() => setPassportOpen(true)} />

      <main className="flex-grow pt-16 sm:pt-20 lg:pt-24 pb-16 md:pb-0 overflow-x-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
      <MobileNav onOpenPassport={() => setPassportOpen(true)} />
      <ChatbotDrawer />
      <PassportModal isOpen={passportOpen} onClose={() => setPassportOpen(false)} />
    </div>
    </CartProvider>
  );
}
