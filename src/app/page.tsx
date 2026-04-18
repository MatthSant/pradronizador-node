'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MousePointer2, ClipboardList, TrendingUp, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

const options = [
  {
    title: "wtl_events",
    desc: "Processamento e rastreio de leads, visualizações e cadastros em tempo real.",
    icon: MousePointer2,
    accent: "text-blue-600",
    href: "/processor/events",
    delay: 0.1
  },
  {
    title: "wtl_survey",
    desc: "Análise profunda de pesquisas de censo e satisfação com dicionário dinâmico.",
    icon: ClipboardList,
    accent: "text-purple-600",
    href: "/processor/survey",
    delay: 0.2
  },
  {
    title: "wtl_transactions",
    desc: "Estruturação de vendas e histórico financeiro com de/para inteligente.",
    icon: TrendingUp,
    accent: "text-emerald-600",
    href: "/processor/transactions",
    delay: 0.3
  }
];

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-[85vh] py-16">
      {/* HERO SECTION */}
      <div className="relative mb-24 px-4 w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center space-y-10"
        >
          <div className="inline-flex items-center space-x-3 px-4 py-1.5 bg-white border border-slate-100 rounded-full shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-technical text-slate-500">Workspace Operacional v1.0</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] text-slate-900">
            Estruture seus <br />
            <span className="text-purple-600 italic pb-2 inline-block">Dados Históricos</span>
          </h1>
          
          <div className="space-y-10">
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
              A infraestrutura definitiva para normalização de tabelas e limpeza de dados. 
              Processamento <span className="text-slate-900 border-b-2 border-purple-200">100% isolado</span> no browser.
            </p>

            <button 
              onClick={() => document.getElementById('services')?.scrollIntoView()}
              className="premium-button px-12 py-5 rounded-3xl inline-flex items-center space-x-3 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Começar Agora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* SERVICE GRID */}
      <div id="services" className="grid md:grid-cols-3 gap-8 w-full max-w-6xl px-4 pt-16">
        {options.map((opt) => (
          <motion.div
            key={opt.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: opt.delay, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link 
              href={opt.href} 
              className="group flex flex-col h-full glass-card p-12 hover:bg-white transition-all duration-500 border border-slate-100/50 hover:shadow-2xl hover:shadow-purple-500/5 hover:-translate-y-2"
            >
              <div className="flex-grow space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-technical text-slate-400 group-hover:text-purple-600 transition-colors">
                    Pipeline AT-0{options.indexOf(opt) + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center group-hover:bg-purple-600 group-hover:border-purple-600 transition-all duration-500">
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>

                <h3 className="text-3xl font-black tracking-tighter text-slate-900 leading-none">
                  {opt.title}
                </h3>
                
                <p className="text-slate-500 text-sm leading-relaxed font-medium">
                  {opt.desc}
                </p>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-50 flex items-center space-x-12">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Motor</span>
                  <span className="text-[11px] font-bold text-slate-900 uppercase">Universal Engine</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase text-slate-400">Status</span>
                  <span className="text-[11px] font-bold text-emerald-600 uppercase">Operacional</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* SECURITY FOOTER */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.6 }}
        className="mt-32 w-full max-w-4xl px-4"
      >
        <div className="bg-emerald-50/50 border border-emerald-100/50 p-10 rounded-[3rem] flex flex-col md:flex-row items-center space-y-8 md:space-y-0 md:space-x-12 backdrop-blur-md">
          <div className="w-20 h-20 bg-white border border-emerald-200 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-900/5">
            <ShieldCheck className="w-10 h-10 text-emerald-600" />
          </div>
          <div className="space-y-3 text-center md:text-left">
            <h4 className="text-xl font-black tracking-tight text-emerald-900 uppercase">Privacidade por Design (PBD)</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed italic max-w-xl">
              Nossa arquitetura técnica assegura que <span className="text-emerald-800 font-black">nenhum dado sensível</span> toque nossos servidores. 
              O processamento ocorre integralmente no seu navegador, garantindo conformidade absoluta com normas globais de privacidade.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
