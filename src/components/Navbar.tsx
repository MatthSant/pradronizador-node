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
      <nav className="!fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl py-3 px-8 glass-card flex justify-between items-center bg-white/40 border-white/20 backdrop-blur-xl">
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-8 h-8 bg-purple-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-500 shadow-lg shadow-purple-500/20">
            <Activity className="text-white w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black tracking-widest leading-none uppercase text-slate-900">DataStruct</span>
            <span className="text-technical text-purple-600 mt-0.5">Build v1.0</span>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href}
                href={link.href} 
                className={`relative py-1 text-[10px] font-bold uppercase tracking-widest transition-all ${
                  isActive ? 'text-purple-700' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {link.name}
                {isActive && (
                  <div className="absolute -bottom-1 left-1.5 right-1.5 h-0.5 bg-purple-600 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center space-x-2">
          <div className="h-4 w-[1px] bg-slate-200 mx-2" />
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all group outline-none"
            title="Configurações do Workspace"
          >
            <SettingsIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
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
