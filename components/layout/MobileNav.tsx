'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Map, Sparkles, Compass, Award } from 'lucide-react';

interface MobileNavProps {
  onOpenPassport?: () => void;
}

export default function MobileNav({ onOpenPassport }: MobileNavProps) {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Trang chủ', icon: Home },
    { href: '/lang-nghe', label: 'Làng nghề', icon: Compass },
    { href: '/ban-do', label: 'Bản đồ', icon: Map },
    { href: '/trai-nghiem', label: 'Trải nghiệm', icon: Sparkles },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dopaper-50/95 backdrop-blur-lg border-t border-terracotta-200/80 px-2 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 rounded-lg transition-colors ${
                active ? 'text-terracotta-600' : 'text-lacquer-800/60 hover:text-lacquer-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[11px] mt-0.5 ${active ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={onOpenPassport}
          className="flex flex-col items-center py-1 px-3 rounded-lg text-lacquer-800/60 hover:text-lacquer-900 transition-colors"
        >
          <Award className="w-5 h-5 text-gold-600 stroke-2" />
          <span className="text-[11px] mt-0.5 font-medium">Hộ chiếu</span>
        </button>
      </div>
    </div>
  );
}
