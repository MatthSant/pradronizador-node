'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MousePointer2, ClipboardList, TrendingUp, ArrowRight } from 'lucide-react';

const options = [
  {
    title: "wtl_events",
    desc: "Processamento de leads, visualizações e cadastros.",
    icon: MousePointer2,
    color: "bg-blue-500",
    href: "/processor/events"
  },
  {
    title: "wtl_survey",
    desc: "Análise de pesquisas de censo e satisfação.",
    icon: ClipboardList,
    color: "bg-amber-500",
    href: "/processor/survey"
  },
  {
    title: "wtl_transactions",
    desc: "Estruturação de vendas e histórico financeiro.",
    icon: TrendingUp,
    color: "bg-emerald-500",
    href: "/processor/transactions"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6">
          Estruture seus <span className="gradient-text">Dados Históricos</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-12">
          Transforme arquivos brutos em tabelas estruturadas e prontas para análise em segundos, com processamento 100% no navegador.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-8 w-full">
        {options.map((opt, idx) => (
          <motion.div
            key={opt.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 + 0.3 }}
          >
            <Link href={opt.href} className="flex flex-col h-full glass-card p-8 hover:bg-slate-800/60 transition-all group">
              <div className={`w-12 h-12 ${opt.color} rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-black/20`}>
                <opt.icon className="text-white w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{opt.title}</h3>
              <p className="text-slate-400 mb-8 flex-grow">{opt.desc}</p>
              <div className="flex items-center text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                Começar <ArrowRight className="ml-2 w-4 h-4" />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
