'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ProcessingIssue } from '@/lib/processor';
import { CheckCircle2, AlertCircle, ShieldCheck, CreditCard, Ban, Undo2 } from 'lucide-react';

interface StatusNormalizerProps {
  discoveredStatuses: string[];
  errors: ProcessingIssue[];
  warnings: ProcessingIssue[];
  mappings: Record<string, string>;
  onChange: (mappings: Record<string, string>) => void;
}

const TARGET_STATUSES = [
  { id: 'approved', label: 'Aprovada', color: 'emerald', icon: ShieldCheck, bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', active: 'bg-emerald-600' },
  { id: 'pending', label: 'Pendente', color: 'amber', icon: CreditCard, bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', active: 'bg-amber-500' },
  { id: 'cancelled', label: 'Cancelada', color: 'rose', icon: Ban, bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', active: 'bg-rose-600' },
  { id: 'refunded', label: 'Reembolsada', color: 'slate', icon: Undo2, bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700', active: 'bg-slate-700' },
];

export const StatusNormalizer: React.FC<StatusNormalizerProps> = ({ 
  discoveredStatuses, 
  errors,
  warnings,
  mappings, 
  onChange 
}) => {
  const handleSelect = (source: string, target: string) => {
    onChange({ ...mappings, [source]: target });
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="glass-card mb-12 p-10 bg-white/40 border-slate-100 relative overflow-hidden group shadow-xl shadow-emerald-900/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <ShieldCheck className="w-40 h-40 text-emerald-600" />
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="px-5 py-2 bg-emerald-600 border border-emerald-500 rounded-full shadow-lg shadow-emerald-600/10">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Inteligência de Venda</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
              Mapeamento de <span className="text-emerald-600 italic">Status</span>
            </h2>
            <p className="text-slate-500 text-sm font-medium max-w-2xl leading-relaxed">
              Detectamos <span className="text-slate-900 font-bold">{discoveredStatuses.length} variações</span> originais. 
              Conecte cada uma aos padrões do sistema para unificar suas métricas.
            </p>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="p-8 bg-rose-50/50 border border-rose-100 rounded-[2rem]">
          <div className="flex items-center space-x-3 text-rose-700 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h4 className="text-technical">Falhas na Leitura de Status</h4>
          </div>
          <div className="space-y-2">
            {errors.map((issue, index) => (
              <p key={`${issue.fileName}-${issue.code}-${index}`} className="text-sm text-rose-900 font-medium leading-relaxed">
                {issue.fileName}: {issue.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="p-8 bg-amber-50/50 border border-amber-100 rounded-[2rem]">
          <div className="flex items-center space-x-3 text-amber-700 mb-4">
            <AlertCircle className="w-5 h-5" />
            <h4 className="text-technical">Coleta de Status com Limites</h4>
          </div>
          <div className="space-y-2">
            {warnings.map((warning) => (
              <p key={`${warning.fileName}-${warning.code}`} className="text-sm text-amber-900 font-medium leading-relaxed">
                {warning.fileName}: {warning.message}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence mode="popLayout">
          {discoveredStatuses.map((source, idx) => {
            const currentTarget = mappings[source];

            return (
              <motion.div
                key={source}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group flex flex-col md:flex-row items-center justify-between p-8 rounded-[2.5rem] border transition-all duration-500 ${
                  currentTarget 
                    ? 'bg-white border-emerald-100 shadow-xl shadow-emerald-900/5' 
                    : 'bg-slate-50 border-slate-100/50 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center space-x-8 mb-8 md:mb-0 w-full md:w-auto">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xs transition-all duration-500 shadow-sm ${
                    currentTarget ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-white border border-slate-100 text-slate-300'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="text-technical text-slate-600 mb-2 block">Identificador Original</span>
                    <h4 className="text-xl font-bold text-slate-900 truncate tracking-tight">{source}</h4>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full md:w-auto py-2">
                  {TARGET_STATUSES.map((target) => {
                    const isActive = mappings[source] === target.id;
                    const Icon = target.icon;

                    return (
                      <button
                        key={target.id}
                        onClick={() => handleSelect(source, target.id)}
                        className={`flex flex-col items-center justify-center w-28 h-28 rounded-3xl border transition-all duration-500 p-4 space-y-3 group/btn relative ${
                          isActive 
                            ? `${target.active} border-transparent text-white shadow-xl scale-[1.05] z-10` 
                            : `bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600`
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'group-hover/btn:scale-110 transition-transform duration-500'}`} />
                        <span className="text-technical text-[8px] tracking-widest text-center leading-none">{target.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden lg:flex items-center justify-center w-32 border-l border-slate-100 pl-8 ml-8">
                  {currentTarget ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center space-y-2 text-emerald-600">
                      <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-technical text-[8px]">Mapeado</span>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center space-y-2 text-slate-300">
                      <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <span className="text-technical text-[8px]">Pendente</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-10 bg-white border border-slate-100 rounded-[3rem] shadow-sm flex items-start space-x-6">
        <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0 border border-purple-100">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
        </div>
        <div className="space-y-2">
          <h5 className="text-base font-bold text-slate-900 tracking-tight">Integridade da Normalização</h5>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            Mapeie todas as ocorrências detectadas para evitar status sem padronização. 
            Valores não mapeados continuarão sem normalização automática nesta etapa.
          </p>
        </div>
      </div>
    </div>
  );
};
