'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, XCircle, RotateCcw, ArrowRight, ShieldCheck, CreditCard, Ban, Undo2 } from 'lucide-react';

interface StatusNormalizerProps {
  discoveredStatuses: string[];
  mappings: Record<string, string>;
  onChange: (mappings: Record<string, string>) => void;
}

const TARGET_STATUSES = [
  { id: 'approved', label: 'Aprovada', desc: 'Pedido pago e entregue.', color: 'emerald', icon: ShieldCheck },
  { id: 'pending', label: 'Pendente', desc: 'Aguardando compensação ou boleto.', color: 'amber', icon: CreditCard },
  { id: 'cancelled', label: 'Cancelada', desc: 'Compra recusada, falha ou expirada.', color: 'red', icon: Ban },
  { id: 'refunded', label: 'Reembolsada', desc: 'Estorno ou Chargeback solicitado.', color: 'slate', icon: Undo2 },
];

export const StatusNormalizer: React.FC<StatusNormalizerProps> = ({ 
  discoveredStatuses, 
  mappings, 
  onChange 
}) => {
  const handleSelect = (source: string, target: string) => {
    onChange({ ...mappings, [source]: target });
  };

  const getTargetMeta = (id: string) => TARGET_STATUSES.find(t => t.id === id);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <div className="glass-card p-10 bg-slate-900 border-white/[0.05] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
          <ShieldCheck className="w-56 h-56 text-white" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="px-3.5 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full backdrop-blur-md">
              <span className="text-[10px] font-black uppercase text-emerald-200 tracking-[0.2em]">Etapa de Inteligência</span>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
              Normalização de <span className="text-emerald-400 italic">Status</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium max-w-2xl leading-relaxed">
              Encontramos <span className="text-white font-bold">{discoveredStatuses.length} variações</span> de status nos seus arquivos. 
              Sincronize cada uma com nossos padrões globais para garantir a precisão dos KPIs de faturamento.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {discoveredStatuses.map((source, idx) => {
            const currentTarget = mappings[source];
            const meta = currentTarget ? getTargetMeta(currentTarget) : null;

            return (
              <motion.div
                key={source}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`group flex flex-col md:flex-row items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 ${
                  currentTarget 
                    ? 'bg-white border-emerald-100 shadow-xl shadow-emerald-900/5' 
                    : 'bg-slate-50 border-slate-200 hover:border-purple-300 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-6 mb-6 md:mb-0 w-full md:w-auto">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-xs ${
                    currentTarget ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status no Arquivo</span>
                    <h4 className="text-lg font-black text-slate-900 truncate tracking-tight">{source}</h4>
                  </div>
                </div>

                <div className="flex items-center space-x-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
                  {TARGET_STATUSES.map((target) => {
                    const isActive = mappings[source] === target.id;
                    const Icon = target.icon;

                    return (
                      <button
                        key={target.id}
                        onClick={() => handleSelect(source, target.id)}
                        className={`flex flex-col items-center justify-center w-28 h-28 rounded-[1.75rem] border-2 transition-all duration-300 p-3 space-y-2 group/btn ${
                          isActive 
                            ? `bg-${target.color}-600 border-${target.color}-500 text-white shadow-lg scale-105 z-10` 
                            : `bg-white border-slate-100 text-slate-400 hover:border-${target.color}-200 hover:text-${target.color}-600`
                        }`}
                      >
                        <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'group-hover/btn:scale-110 transition-transform'}`} />
                        <div className="text-center">
                          <span className="text-[10px] font-black uppercase tracking-tighter block leading-none">{target.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden lg:flex items-center justify-center w-32 border-l border-slate-100 pl-6 ml-6">
                  {currentTarget ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex flex-col items-center space-y-1">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Sincronizado</span>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center space-y-1 opacity-30">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-slate-400" />
                      </div>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pendente</span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="p-8 bg-purple-50 rounded-[2.5rem] border border-purple-100 border-dashed flex items-start space-x-4">
        <ShieldCheck className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
        <div>
          <h5 className="text-sm font-black text-purple-900 uppercase tracking-tight">Compromisso com a Integridade</h5>
          <p className="text-xs text-purple-800/70 font-medium leading-relaxed mt-1">
            Recomendamos mapear todos os status antes de prosseguir. Status não mapeados serão submetidos à inteligência de fallback <b>mapStatus</b>, que tentará uma associação automática baseada em palavras-chave comuns.
          </p>
        </div>
      </div>
    </div>
  );
};
