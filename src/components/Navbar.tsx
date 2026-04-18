import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Database, BarChart3, Settings } from 'lucide-react';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center glass-card m-4">
      <Link href="/" className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <Database className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight">Data<span className="text-indigo-500">Struct</span></span>
      </Link>
      
      <div className="flex items-center space-x-8 text-sm font-medium text-slate-300">
        <Link href="/processor/events" className="hover:text-white transition-colors">Eventos</Link>
        <Link href="/processor/survey" className="hover:text-white transition-colors">Pesquisa</Link>
        <Link href="/processor/transactions" className="hover:text-white transition-colors">Transações</Link>
      </div>

      <div className="flex items-center space-x-4">
        <button className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <Settings className="w-5 h-5 text-slate-400" />
        </button>
      </div>
    </nav>
  );
};
