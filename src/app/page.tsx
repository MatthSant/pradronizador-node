'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MousePointer2, ClipboardList, TrendingUp, ArrowRight, Sparkles } from 'lucide-react';

const options = [
  {
    title: "wtl_events",
    desc: "Processamento de leads, visualizações e cadastros em tempo real.",
    icon: MousePointer2,
    accent: "text-blue-700",
    bg: "bg-blue-100/50",
    border: "border-blue-200",
    href: "/processor/events"
  },
  {
    title: "wtl_survey",
    desc: "Análise de pesquisas de censo e satisfação com dicionário dinâmico.",
    icon: ClipboardList,
    accent: "text-purple-700",
    bg: "bg-purple-100/50",
    border: "border-purple-200",
    href: "/processor/survey"
  },
  {
    title: "wtl_transactions",
    desc: "Estruturação de vendas e histórico financeiro com de/para inteligente.",
    icon: TrendingUp,
    accent: "text-emerald-700",
    bg: "bg-emerald-100/50",
    border: "border-emerald-200",
    href: "/processor/transactions"
  }
];

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12">
      <div className="relative mb-16 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-purple-100/50 border border-purple-200 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-purple-700" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-800">DataStruct v1.0</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
            Estruture seus <br />
            <span className="heading-accent">Dados Históricos</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed pt-4">
            Transforme arquivos brutos em tabelas normalizadas prontas para análise. 
            Processamento <span className="text-slate-900 border-b-2 border-purple-300">100% privado</span> no seu navegador.
          </p>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
        {options.map((opt, idx) => (
          <motion.div
            key={opt.title}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.8, 
              delay: idx * 0.12,
              ease: [0.16, 1, 0.3, 1] 
            }}
          >
            <Link 
              href={opt.href} 
              className={`flex flex-col h-full glass-card p-10 group transition-all duration-500 hover:shadow-2xl hover:shadow-purple-700/10 hover:-translate-y-2`}
            >
              <div className={`w-14 h-14 ${opt.bg} ${opt.border} border-2 rounded-2xl flex items-center justify-center mb-8 transition-all group-hover:scale-110 duration-500`}>
                <opt.icon className={`${opt.accent} w-6 h-6`} />
              </div>
              
              <div className="flex-grow space-y-3">
                <h3 className="text-2xl font-black tracking-tight text-slate-900 group-hover:text-purple-800 transition-colors">
                  {opt.title}
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed font-medium">
                  {opt.desc}
                </p>
              </div>

              <div className="mt-10 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-purple-800 transition-all">
                Iniciar Operação 
                <div className="ml-auto w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center group-hover:bg-purple-700 group-hover:border-purple-700 transition-all">
                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* SECURITY NOTICE */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-20 w-full max-w-4xl px-4"
      >
        <div className="bg-emerald-50/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-emerald-200 flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8 shadow-xl shadow-emerald-900/5">
          <div className="w-16 h-16 bg-white border border-emerald-200 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-emerald-600">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div className="space-y-2 text-center md:text-left">
            <h4 className="text-lg font-black uppercase tracking-tighter text-emerald-800">Segurança & Privacidade Prioritária</h4>
            <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
              Seus dados sensíveis <span className="text-emerald-900 font-black border-b-2 border-emerald-400/30">nunca tocam nossos servidores</span>. 
              Todo o processamento acontece localmente no seu navegador. Nenhuma informação é armazenada ou enviada para a nuvem, 
              garantindo conformidade e privacidade total.
            </p>
            <div className="flex items-center justify-center md:justify-start space-x-4 pt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/60">Processamento Client-Side</span>
              <div className="w-1 h-1 bg-emerald-200 rounded-full" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/60">Sem Coleta de Metadados</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
