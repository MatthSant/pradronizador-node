'use client';

import React, { useState, useEffect } from 'react';
import { FIELD_DESCRIPTIONS, HARD_MAPPINGS, UNIVERSAL_PRESETS, PLATFORM_PRESETS } from '@/lib/constants';
import { normalizeString } from '@/lib/normalization';
import { Check, AlertCircle, ChevronRight, Globe, FileStack, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MappingInterfaceProps {
  sourceColumns: string[];
  type: string;
  customFieldLabels?: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
  onAddCustomField?: (label: string) => string;
}

export const MappingInterface: React.FC<MappingInterfaceProps> = ({ 
  sourceColumns, 
  type, 
  customFieldLabels = {}, 
  onMappingChange,
  onAddCustomField
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [unifiedMode, setUnifiedMode] = useState(true);
  const [creatingForCol, setCreatingForCol] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  
  const targetOptions = [
    { id: '__NONE__', name: '(Não Mapear)' },
    { id: '__SKIP__', name: '(Pular Campo)' },
    ...(onAddCustomField ? [{ id: '__CREATE__', name: '+ Criar Novo Campo Customizado...' }] : []),
    ...Object.entries(FIELD_DESCRIPTIONS).map(([id, meta]) => ({
      id,
      name: `${meta.name}`
    })),
    ...Object.entries(customFieldLabels).map(([id, label]) => ({
      id,
      name: `🟡 ${label}`
    }))
  ];

  useEffect(() => {
    const initialMappings: Record<string, string> = {};
    const platformPreset = PLATFORM_PRESETS[type] || {};
    sourceColumns.forEach(col => {
      const norm = normalizeString(col);
      if (platformPreset[norm]) initialMappings[col] = platformPreset[norm];
      else if (HARD_MAPPINGS[col]) initialMappings[col] = HARD_MAPPINGS[col];
      else if (UNIVERSAL_PRESETS[norm]) initialMappings[col] = UNIVERSAL_PRESETS[norm];
      else {
        const found = Object.keys(FIELD_DESCRIPTIONS).find(target => 
          normalizeString(target) === norm || 
          normalizeString(FIELD_DESCRIPTIONS[target].name) === norm
        );
        initialMappings[col] = found || '__NONE__';
      }
    });
    setMappings(initialMappings);
  }, [sourceColumns, type]);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const handleSelect = (source: string, target: string) => {
    if (target === '__CREATE__') {
      setCreatingForCol(source);
      setNewLabel('');
      return;
    }
    setMappings(prev => ({ ...prev, [source]: target }));
  };

  const handleCreateConfirm = () => {
    if (onAddCustomField && creatingForCol && newLabel.trim()) {
      const newKey = onAddCustomField(newLabel.trim());
      setMappings(prev => ({ ...prev, [creatingForCol]: newKey }));
      setCreatingForCol(null);
    }
  };

  return (
    <div className="glass-card shadow-2xl overflow-hidden border-black/[0.12] bg-white">
      <div className="px-8 py-6 bg-purple-50 border-b border-purple-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-purple-700" />
            <h3 className="text-xl font-black tracking-tight text-slate-900">Mapeamento Inteligente</h3>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sincronização em Tempo Real (Acessível)</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-300">
          <button 
            onClick={() => setUnifiedMode(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${unifiedMode ? 'bg-purple-700 text-white shadow-lg shadow-purple-700/30' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <Globe className="w-3.5 h-3.5" /> <span>Unificado</span>
          </button>
          <button 
            onClick={() => setUnifiedMode(false)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${!unifiedMode ? 'bg-purple-700 text-white shadow-lg shadow-purple-700/30' : 'text-slate-600 hover:text-slate-800'}`}
          >
            <FileStack className="w-3.5 h-3.5" /> <span>Individual</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
        <AnimatePresence>
          {sourceColumns.map((col, idx) => (
            <motion.div 
              key={col} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="flex flex-col space-y-3 p-5 rounded-2xl bg-slate-50 border border-slate-200 hover:bg-white hover:border-purple-300 hover:shadow-lg hover:shadow-purple-700/5 transition-all group"
            >
              <div className="flex items-center space-x-6">
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block">Origem de Dados</span>
                  <p className="text-sm font-black text-slate-800 truncate" title={col}>{col}</p>
                </div>
                
                <div className="flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block">Atributo de Destino</span>
                  <select 
                    value={mappings[col] || '__NONE__'}
                    onChange={(e) => handleSelect(col, e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider px-3 py-2.5 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none cursor-pointer hover:border-purple-400 text-slate-800"
                  >
                    {targetOptions.map(opt => (
                      <option key={opt.id} value={opt.id} className="text-slate-900">{opt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="w-10 flex justify-center">
                  {mappings[col] !== '__NONE__' && mappings[col] !== '__SKIP__' ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-1.5 bg-emerald-100 rounded-full border border-emerald-300">
                      <Check className="w-4 h-4 text-emerald-700" />
                    </motion.div>
                  ) : (
                    <div className="p-1.5 bg-slate-200 rounded-full">
                      <AlertCircle className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>
              </div>

              {creatingForCol === col && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-5 bg-purple-50 border border-purple-300 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-purple-800 uppercase tracking-widest">Definição de Campo Customizado</span>
                    <button onClick={() => setCreatingForCol(null)} className="p-1.5 hover:bg-purple-200 rounded-lg transition-colors">
                      <X className="w-4 h-4 text-purple-800" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <input 
                      autoFocus
                      type="text"
                      placeholder="Identificador ou Pergunta da Pesquisa..."
                      value={newLabel}
                      onChange={(e) => setNewLabel(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateConfirm()}
                      className="flex-1 bg-white border border-purple-300 rounded-xl px-4 py-3 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-purple-300 outline-none placeholder:text-slate-400"
                    />
                    <button 
                      onClick={handleCreateConfirm}
                      className="bg-purple-700 hover:bg-purple-800 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-purple-700/20"
                    >
                      Registrar
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
