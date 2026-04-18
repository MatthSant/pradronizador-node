'use client';

import React, { useState } from 'react';
import { FIELD_DESCRIPTIONS } from '@/lib/constants';
import { X, Tag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FixedValueInjectorProps {
  unmappedTargets: string[];
  onChange: (values: Record<string, string>) => void;
}

export const FixedValueInjector: React.FC<FixedValueInjectorProps> = ({ unmappedTargets, onChange }) => {
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});

  const handleAdd = (target: string) => {
    const next = { ...fixedValues, [target]: '' };
    setFixedValues(next);
    onChange(next);
  };

  const handleRemove = (target: string) => {
    const next = { ...fixedValues };
    delete next[target];
    setFixedValues(next);
    onChange(next);
  };

  const handleValueChange = (target: string, value: string) => {
    const next = { ...fixedValues, [target]: value };
    setFixedValues(next);
    onChange(next);
  };

  const availableOptions = unmappedTargets.filter(t => !fixedValues[t]);

  return (
    <div className="glass-card p-10 border-black/[0.12] bg-white space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-8">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Tag className="w-4 h-4 text-purple-700" />
            <h3 className="text-xl font-black tracking-tight text-slate-900">Injeção Paramétrica</h3>
          </div>
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Inclusão de Metadados Estáticos (Acessível)</p>
        </div>
        
        <div className="flex-shrink-0">
          <select 
            className="w-full md:w-64 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider px-4 py-3 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none cursor-pointer hover:border-purple-400 shadow-xl shadow-purple-700/5 text-slate-800"
            onChange={(e) => e.target.value !== "" && handleAdd(e.target.value)}
            value=""
          >
            <option value="">+ Adicionar Parâmetro</option>
            {availableOptions.map(opt => (
              <option key={opt} value={opt} className="text-slate-900">
                {FIELD_DESCRIPTIONS[opt]?.name || opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {Object.entries(fixedValues).length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30"
            >
              <Sparkles className="w-8 h-8 text-slate-900" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Nenhum parâmetro injetado</p>
            </motion.div>
          )}

          {Object.entries(fixedValues).map(([target, val], idx) => (
            <motion.div 
              key={target}
              layout
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center space-x-6 bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:bg-white hover:border-purple-300 hover:shadow-lg hover:shadow-purple-700/5 transition-all group"
            >
              <div className="w-48">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block">Campo Alvo</span>
                <p className="text-[10px] font-black text-purple-800 uppercase tracking-widest truncate">
                  {FIELD_DESCRIPTIONS[target]?.name || target}
                </p>
              </div>

              <div className="flex-1">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block">Valor de Injeção</span>
                <input 
                  autoFocus
                  type="text"
                  placeholder="Defina o valor..."
                  value={val}
                  onChange={(e) => handleValueChange(target, e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 font-bold focus:ring-2 focus:ring-purple-300 outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <button 
                onClick={() => handleRemove(target)}
                className="p-2.5 bg-red-50 hover:bg-red-100 text-slate-500 hover:text-red-700 rounded-xl transition-all self-end mb-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
