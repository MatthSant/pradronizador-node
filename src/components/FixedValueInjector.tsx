'use client';

import React, { useState } from 'react';
import { FIELD_DESCRIPTIONS } from '@/lib/constants';
import { getFileKey } from '@/lib/files';
import { X, Tag, Sparkles, FileStack, ChevronRight, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FixedValueInjectorProps {
  files: File[];
  unmappedTargets: string[];
  initialValues: Record<string, Record<string, string>>;
  onChange: (values: Record<string, Record<string, string>>) => void;
}

export const FixedValueInjector: React.FC<FixedValueInjectorProps> = ({ 
  files, 
  unmappedTargets, 
  initialValues, 
  onChange 
}) => {
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const activeFile = files[activeFileIdx];
  const activeFileKey = activeFile ? getFileKey(activeFile) : null;

  if (!activeFile || !activeFileKey) {
    return null;
  }

  const activeValues = initialValues[activeFileKey] || {};

  const updateFileValues = (newValues: Record<string, string>) => {
    if (!activeFileKey) return;

    const next = {
      ...initialValues,
      [activeFileKey]: newValues
    };
    onChange(next);
  };

  const handleAdd = (target: string) => {
    updateFileValues({ ...activeValues, [target]: '' });
  };

  const handleRemove = (target: string) => {
    const next = { ...activeValues };
    delete next[target];
    updateFileValues(next);
  };

  const handleValueChange = (target: string, value: string) => {
    updateFileValues({ ...activeValues, [target]: value });
  };

  const availableOptions = unmappedTargets.filter(t => !activeValues[t]);

  return (
    <div className="grid lg:grid-cols-[400px_1fr] gap-12 animate-in fade-in duration-1000">
      {/* LEFT SIDEBAR: DOCUMENT INDEX */}
      <div className="space-y-6">
        <div className="flex items-center space-x-3 text-slate-400 mb-2">
          <FileStack className="w-5 h-5" />
          <h4 className="text-technical">Índice de Documentos</h4>
        </div>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {files.map((file, idx) => {
            const fileKey = getFileKey(file);
            const tagCount = Object.keys(initialValues[fileKey] || {}).length;
            const isActive = activeFileIdx === idx;
            
            return (
              <button
                key={fileKey}
                onClick={() => setActiveFileIdx(idx)}
                className={`w-full text-left p-6 rounded-[2rem] border transition-all duration-500 group relative overflow-hidden ${
                  isActive 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/10' 
                    : 'bg-white border-slate-100 hover:border-purple-200'
                }`}
              >
                <div className="flex items-center justify-between relative z-10">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-bold truncate leading-tight mb-1">{file.name}</p>
                    <span className={`text-technical ${isActive ? 'text-slate-400' : 'text-slate-300'}`}>
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  
                  {tagCount > 0 ? (
                    <div className={`px-3 py-1 rounded-lg text-technical flex items-center space-x-1.5 ${
                      isActive ? 'bg-white/10 text-emerald-400 border border-white/10' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                      <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-600'}`} />
                      <span>{tagCount} tags</span>
                    </div>
                  ) : (
                    <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-200'} transition-transform group-hover:translate-x-1`} />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT CONTENT: PARAMETER INJECTOR */}
      <div className="glass-card p-12 border-slate-100 bg-white space-y-10 flex flex-col h-[700px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 pb-10">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-100">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900">Injeção Inteligente</h3>
            </div>
            <p className="text-technical text-slate-400 mt-2">
              Adicionando metadados ao documento: <span className="text-slate-900 font-bold">{activeFile?.name}</span>
            </p>
          </div>
          
          <div className="relative group">
            <select 
              className="w-full md:w-72 bg-slate-50 border border-slate-100 rounded-2xl text-technical text-slate-600 px-6 py-4 focus:ring-4 focus:ring-purple-50 focus:border-purple-300 outline-none transition-all appearance-none cursor-pointer pr-12 font-bold"
              onChange={(e) => e.target.value !== "" && handleAdd(e.target.value)}
              value=""
            >
              <option value="">+ Injetar Novo Campo</option>
              {availableOptions.map(opt => (
                <option key={opt} value={opt} className="text-slate-900">
                  {FIELD_DESCRIPTIONS[opt]?.name.split('(')[0] || opt}
                </option>
              ))}
            </select>
            <Plus className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:rotate-90 transition-transform duration-500" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
          <div className="grid gap-6">
            <AnimatePresence mode="popLayout">
              {Object.entries(activeValues).length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="py-24 flex flex-col items-center justify-center text-center space-y-4 text-slate-300"
                >
                  <Tag className="w-16 h-16 opacity-10" />
                  <div className="space-y-1">
                    <p className="text-technical">Configuração Limpa</p>
                    <p className="text-xs font-medium max-w-[280px] leading-relaxed">
                      Use o menu superior para injetar campos globais que não constam na fonte original.
                    </p>
                  </div>
                </motion.div>
              )}

              {Object.entries(activeValues).map(([target, val]) => (
                <motion.div 
                  key={`${activeFileKey}-${target}`}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col md:flex-row items-center space-x-0 md:space-x-8 space-y-6 md:space-y-0 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:border-purple-200 transition-all duration-500 group shadow-sm hover:shadow-xl hover:shadow-purple-900/5"
                >
                  <div className="w-full md:w-56 space-y-1">
                    <span className="text-technical text-slate-400 block">Atributo de Destino</span>
                    <p className="text-base font-bold text-slate-900 truncate">
                      {FIELD_DESCRIPTIONS[target]?.name.split('(')[0] || target}
                    </p>
                  </div>

                  <div className="flex-1 w-full">
                    <span className="text-technical text-slate-400 mb-3 block">Conteúdo Fixo</span>
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Valor que se repetirá em todas as linhas..."
                      value={val}
                      onChange={(e) => handleValueChange(target, e.target.value)}
                      className="w-full bg-white border border-slate-100 rounded-[1.5rem] px-6 py-4 text-sm text-slate-900 font-bold focus:ring-4 focus:ring-purple-50 focus:border-purple-300 outline-none transition-all placeholder:text-slate-200"
                    />
                  </div>

                  <button 
                    onClick={() => handleRemove(target)}
                    className="p-4 bg-white border border-slate-100 hover:bg-rose-50 hover:border-rose-100 text-slate-300 hover:text-rose-500 rounded-2xl transition-all self-end md:self-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
