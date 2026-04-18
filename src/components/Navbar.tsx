'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Settings as SettingsIcon } from 'lucide-react';
import { SettingsDrawer } from './SettingsDrawer';

export const Navbar = () => {
  const pathname = usePathname();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const navLinks = [
    { name: 'Eventos', href: '/processor/events' },
    { name: 'Pesquisa', href: '/processor/survey' },
    { name: 'Transações', href: '/processor/transactions' }
  ];

  return (
    <>
      <nav className="!fixed top-0 left-4 right-4 z-50 py-4 flex justify-between items-center glass-card mt-4 px-8 border-black/[0.1]">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 bg-purple-100 border border-purple-300 rounded-xl flex items-center justify-center group-hover:bg-purple-200 transition-all duration-300">
            <Activity className="text-purple-700 w-5 h-5 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-[0.2em] leading-none uppercase text-slate-900">DataStruct</span>
            <span className="text-[10px] font-bold text-purple-700 tracking-tighter uppercase">Frost Edition 2.1</span>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center space-x-10">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`relative py-1 text-xs font-black uppercase tracking-widest transition-all ${
                  isActive ? 'text-purple-800' : 'text-slate-600 hover:text-purple-700'
                }`}
              >
                {link.name}
                {isActive && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-purple-700 rounded-full animate-in fade-in zoom-in duration-300" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-4">
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 hover:bg-black/5 rounded-xl transition-all border border-transparent hover:border-black/5 group focus:ring-2 focus:ring-purple-600 outline-none"
            title="Abrir Frost Control Center"
          >
            <SettingsIcon className="w-4 h-4 text-slate-600 group-hover:rotate-45 transition-transform" />
          </button>
        </div>
      </nav>

      <SettingsDrawer 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
      />
    </>
  );
};
