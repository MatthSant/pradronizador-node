'use client';

import React, { useState } from 'react';
import { FIELD_DESCRIPTIONS } from '@/lib/constants';
import { X, Tag, Sparkles, FileStack } from 'lucide-react';
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
  const activeValues = initialValues[activeFile?.name] || {};

  const updateFileValues = (newValues: Record<string, string>) => {
    const next = {
      ...initialValues,
      [activeFile.name]: newValues
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
    <div className="grid lg:grid-cols-[380px_1fr] gap-8 animate-in fade-in duration-700">
      {/* LEFT SIDEBAR: FILE SELECTOR */}
      <div className="glass-card overflow-hidden border-slate-200 bg-white flex flex-col h-[600px]">
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center space-x-2 mb-1">
            <FileStack className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Document Deck</span>
          </div>
          <h4 className="text-lg font-black text-slate-900 tracking-tight">Arquivos do Lote</h4>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {files.map((file, idx) => {
            const tagCount = Object.keys(initialValues[file.name] || {}).length;
            const isActive = activeFileIdx === idx;
            
            return (
              <button
                key={file.name}
                onClick={() => setActiveFileIdx(idx)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                  isActive 
                    ? 'bg-purple-700 border-purple-800 text-white shadow-lg shadow-purple-900/20' 
                    : 'bg-white border-slate-100 hover:border-purple-200 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-purple-100'
                  }`}>
                    <Tag className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-purple-600'}`} />
                  </div>
                  <div className="truncate">
                    <p className={`text-[11px] font-black truncate ${isActive ? 'text-white' : 'text-slate-700'}`}>
                      {file.name}
                    </p>
                    <p className={`text-[9px] font-medium ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                      {Math.round(file.size / 1024)} KB
                    </p>
                  </div>
                </div>
                
                {tagCount > 0 && (
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${
                    isActive ? 'bg-white text-purple-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {tagCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT CONTENT: PARAMETER INJECTOR */}
      <div className="glass-card p-10 border-black/[0.12] bg-white space-y-8 flex flex-col h-[600px]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-100 pb-8">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-purple-700 animate-pulse" />
              <h3 className="text-xl font-black tracking-tight text-slate-900">Configuração de Tags</h3>
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
              Injetando dados em: <span className="text-purple-700">{activeFile?.name}</span>
            </p>
          </div>
          
          <div className="flex-shrink-0">
            <select 
              className="w-full md:w-64 bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider px-4 py-3 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none cursor-pointer hover:border-purple-400 shadow-xl shadow-purple-700/5 text-slate-800"
              onChange={(e) => e.target.value !== "" && handleAdd(e.target.value)}
              value=""
            >
              <option value="">+ Injetar Novo Campo</option>
              {availableOptions.map(opt => (
                <option key={opt} value={opt} className="text-slate-900">
                  {FIELD_DESCRIPTIONS[opt]?.name || opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
          <div className="grid gap-4">
            <AnimatePresence mode="popLayout">
              {Object.entries(activeValues).length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="py-12 flex flex-col items-center justify-center text-center space-y-3 opacity-30"
                >
                  <Tag className="w-12 h-12 text-slate-900 mb-2" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Sem tags para este arquivo</p>
                  <p className="text-[9px] font-medium text-slate-500 max-w-[200px]">
                    Use o seletor acima para injetar campos fixos que não existem neste documento.
                  </p>
                </motion.div>
              )}

              {Object.entries(activeValues).map(([target, val], idx) => (
                <motion.div 
                  key={`${activeFile.name}-${target}`}
                  layout
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center space-x-6 bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:bg-white hover:border-purple-300 hover:shadow-xl hover:shadow-purple-700/5 transition-all group"
                >
                  <div className="w-48">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block">Atributo Alvo</span>
                    <p className="text-[11px] font-black text-purple-800 uppercase tracking-widest truncate">
                      {FIELD_DESCRIPTIONS[target]?.name.split('(')[0] || target}
                    </p>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Destino Final</span>
                  </div>

                  <div className="flex-1">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block">Valor Gravado</span>
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Ex: Campanha XPTO..."
                      value={val}
                      onChange={(e) => handleValueChange(target, e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-2xl px-5 py-3.5 text-xs text-slate-800 font-bold focus:ring-4 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all placeholder:text-slate-400 shadow-sm"
                    />
                  </div>

                  <button 
                    onClick={() => handleRemove(target)}
                    className="p-3 bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600 rounded-2xl transition-all self-end mb-1"
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
