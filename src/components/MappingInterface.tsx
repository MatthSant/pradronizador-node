'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FIELD_DESCRIPTIONS, HARD_MAPPINGS } from '@/lib/constants';
import { Check, AlertCircle, ChevronRight, FileStack, X, Sparkles, Ban, ListFilter, Trash2, RotateCcw, Info, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MappingInterfaceProps {
  activeFileName: string;
  fileIndex: number;
  totalFiles: number;
  sourceColumns: string[];
  sourceSamples: Record<string, string[]>;
  type: string;
  customFieldLabels: Record<string, string>;
  initialMappings?: Record<string, string>;
  onMappingChange: (mappings: Record<string, string>) => void;
  onAddCustomField?: (label: string) => string;
}

export const MappingInterface: React.FC<MappingInterfaceProps> = ({ 
  activeFileName,
  fileIndex,
  totalFiles,
  sourceColumns, 
  sourceSamples,
  type, 
  customFieldLabels,
  initialMappings = {},
  onMappingChange, 
  onAddCustomField 
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [creatingForCol, setCreatingForCol] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  
  const targetOptions = useMemo(() => [
    { id: '__NONE__', name: '(Não Mapear)' },
    ...(onAddCustomField ? [{ id: '__CREATE__', name: '+ Criar Novo Campo Customizado...' }] : []),
    ...Object.entries(FIELD_DESCRIPTIONS)
      .filter(([_, meta]) => meta.category === 'global' || meta.category === type)
      .map(([id, meta]) => ({
        id,
        name: `${meta.name}`
      })),
    ...Object.entries(customFieldLabels).map(([id, label]) => ({
      id,
      name: `🟡 ${label.toUpperCase()}`
    }))
  ], [type, onAddCustomField, customFieldLabels]);

  const safeSourceColumns = useMemo(() => {
    return Array.from(new Set(sourceColumns.filter(c => c && c.trim().length > 0)));
  }, [sourceColumns]);

  // Initialization: Zero-Guess strategy as requested
  useEffect(() => {
    const initialMappingsPreserved: Record<string, string> = {};

    sourceColumns.forEach(col => {
      // 1. Preserve existing manual mappings from parent state if any
      if (initialMappings[col] && initialMappings[col] !== '__NONE__') {
        initialMappingsPreserved[col] = initialMappings[col];
        return;
      }

      // 2. Exact Match for Hotmart Standard (Only for Transactions)
      if (type === 'transactions' && HARD_MAPPINGS[col]) {
        initialMappingsPreserved[col] = HARD_MAPPINGS[col];
        return;
      }

      // 3. Default to NONE to avoid incorrect guessing
      initialMappingsPreserved[col] = '__NONE__';
    });
    
    setMappings(initialMappingsPreserved);
  }, [sourceColumns, type]); 

  const groups = useMemo(() => {
    const pending: string[] = [];
    const mapped: string[] = [];
    const skipped: string[] = [];

    safeSourceColumns.forEach(col => {
      const target = mappings[col];
      if (target === '__SKIP__') {
        skipped.push(col);
      } else if (!target || target === '__NONE__') {
        pending.push(col);
      } else {
        mapped.push(col);
      }
    });

    return { pending, mapped, skipped };
  }, [safeSourceColumns, mappings]);

  const applyHotmartPreset = () => {
    const newMappings = { ...mappings };
    safeSourceColumns.forEach(col => {
      // Only overwrite if currently not mapped or explicitly none
      if ((!newMappings[col] || newMappings[col] === '__NONE__') && HARD_MAPPINGS[col]) {
        newMappings[col] = HARD_MAPPINGS[col];
      }
    });
    setMappings(newMappings);
  };

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

  const toggleSkip = (source: string) => {
    setMappings(prev => {
      const current = prev[source];
      return { ...prev, [source]: current === '__SKIP__' ? '__NONE__' : '__SKIP__' };
    });
  };

  const handleCreateConfirm = () => {
    if (onAddCustomField && creatingForCol && newLabel.trim()) {
      const newKey = onAddCustomField(newLabel.trim());
      setMappings(prev => ({ ...prev, [creatingForCol]: newKey }));
      setCreatingForCol(null);
    }
  };

  const renderColumnRow = (col: string, idx: number) => (
    <motion.div 
      key={col} 
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`flex flex-col space-y-3 p-5 rounded-2xl border transition-all group relative ${
        mappings[col] === '__SKIP__' 
          ? 'bg-slate-50 border-slate-200 opacity-60' 
          : mappings[col] && mappings[col] !== '__NONE__'
          ? 'bg-emerald-50/30 border-emerald-100 shadow-sm'
          : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0 flex flex-col items-start relative">
          <div className="flex items-center space-x-2 mb-1.5 h-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] block font-mono">Input Header</span>
            <button 
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
              className="p-0.5 rounded-full hover:bg-purple-100 text-slate-400 hover:text-purple-600 transition-all cursor-help"
            >
              <Info className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm font-black text-slate-800 break-words leading-tight" title={col}>{col}</p>

          <AnimatePresence>
            {hoveredCol === col && sourceSamples[col] && sourceSamples[col].length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute z-50 top-full left-0 mt-2 p-4 bg-white/95 backdrop-blur-xl border border-purple-200 rounded-2xl shadow-2xl shadow-purple-900/10 min-w-[200px]"
              >
                <div className="flex items-center space-x-2 mb-3 border-b border-purple-100 pb-2">
                  <Sparkles className="w-3 h-3 text-purple-600" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Amostra de Dados</span>
                </div>
                <div className="space-y-1.5">
                  {sourceSamples[col].map((val, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="text-[10px] font-bold text-slate-700 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100 truncate shadow-sm"
                    >
                      {String(val)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex-shrink-0 pt-5">
          <ChevronRight className={`w-5 h-5 transition-colors ${mappings[col] && mappings[col] !== '__NONE__' && mappings[col] !== '__SKIP__' ? 'text-emerald-400' : 'text-slate-300 group-hover:text-purple-500'}`} />
        </div>
        
        <div className="flex-1 min-w-0 flex items-center space-x-2">
          <div className="flex-1">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1.5 block font-mono">Sync Target</span>
            <select 
              disabled={mappings[col] === '__SKIP__'}
              value={mappings[col] === '__SKIP__' ? '__NONE__' : (mappings[col] || '__NONE__')}
              onChange={(e) => handleSelect(col, e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider px-3 py-2.5 focus:ring-2 focus:ring-purple-200 outline-none transition-all appearance-none cursor-pointer hover:border-purple-400 text-slate-800 disabled:bg-slate-100 disabled:cursor-not-allowed"
            >
              {targetOptions.map(opt => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="pt-5 flex items-center space-x-3">
            <button 
              onClick={() => toggleSkip(col)}
              title={mappings[col] === '__SKIP__' ? "Resgatar Campo" : "Descartar Campo"}
              className={`p-2.5 rounded-xl border transition-all ${
                mappings[col] === '__SKIP__'
                  ? 'bg-purple-600 border-purple-600 text-white shadow-lg hover:bg-purple-700 shadow-purple-900/20'
                  : 'bg-white border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50'
              }`}
            >
              {mappings[col] === '__SKIP__' ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            </button>

            <div className="w-8 flex justify-center">
              {mappings[col] === '__SKIP__' ? (
                null
              ) : mappings[col] !== '__NONE__' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-1.5 bg-emerald-100 rounded-full border border-emerald-400">
                  <Check className="w-4 h-4 text-emerald-700" />
                </motion.div>
              ) : (
                <div className="p-1.5 bg-amber-100 border border-amber-300 rounded-full">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
              )}
            </div>
          </div>
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
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER: PROGRESS & CONTEXT */}
      <div className="glass-card mb-8 p-10 bg-slate-900 border-white/[0.1] relative overflow-hidden group shadow-2xl shadow-purple-900/10">
        <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity">
          <FileStack className="w-48 h-48 text-white" />
        </div>
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
               <div className="px-3.5 py-1.5 bg-purple-500/20 border border-purple-400/30 rounded-full backdrop-blur-md">
                 <span className="text-[10px] font-black uppercase text-purple-200 tracking-[0.2em]">Documento {fileIndex + 1} de {totalFiles}</span>
               </div>
               <div className="h-1.5 w-32 bg-white/10 rounded-full overflow-hidden border border-white/5">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((fileIndex + 1) / totalFiles) * 100}%` }}
                   className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                 />
               </div>
            </div>
            {type === 'transactions' && (
              <button 
                onClick={applyHotmartPreset}
                className="flex items-center space-x-2 text-[10px] font-black text-white uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 border border-emerald-500 px-5 py-2.5 rounded-xl transition-all group shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span>Ligar Mapeamento Hotmart</span>
              </button>
            )}
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black text-white tracking-tighter leading-tight">
              Mapeando <span className="text-purple-400 italic">"{activeFileName}"</span>
            </h2>
            <p className="text-slate-400 text-sm font-medium max-w-2xl">Mapeamento granular por arquivo. A inteligência "Zero-Guess" agora aguarda seu comando ou vinculação exata.</p>
          </div>
        </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="px-5 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center space-x-3">
          <ListFilter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-black uppercase tracking-widest text-slate-700 font-mono">
            Sincronia: {groups.mapped.length}/{safeSourceColumns.length - groups.skipped.length}
          </span>
        </div>
        {groups.pending.length > 0 && (
          <div className="px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm flex items-center space-x-3">
            <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-700 font-mono">
              Pendente: {groups.pending.length}
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="popLayout">
        {/* SECTION 1: PENDING (URGENTE) */}
        {groups.pending.length > 0 && (
          <motion.div 
            key="section-pending"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card overflow-hidden border-amber-200 bg-white"
          >
            <div className="px-8 py-5 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-amber-700">
                <AlertCircle className="w-5 h-5 animate-pulse" />
                <h4 className="text-sm font-black uppercase tracking-[0.2em] font-mono italic">Faltam Mapear ({groups.pending.length})</h4>
              </div>
            </div>
            <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
              {groups.pending.map((col, idx) => renderColumnRow(col, idx))}
            </div>
          </motion.div>
        )}

        {/* ROW 2: SIDE BY SIDE GRID FOR MAPPED AND SKIPPED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* SECTION 2: MAPPED */}
          {groups.mapped.length > 0 && (
            <motion.div 
              key="section-mapped"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card overflow-hidden border-emerald-200 bg-white"
            >
              <div className="px-8 py-5 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-emerald-700">
                  <CheckCircle className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] font-mono italic">Sincronizados ({groups.mapped.length})</h4>
                </div>
              </div>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar">
                {groups.mapped.map((col, idx) => renderColumnRow(col, idx))}
              </div>
            </motion.div>
          )}

          {/* SECTION 3: SKIPPED */}
          {groups.skipped.length > 0 && (
            <motion.div 
              key="section-skipped"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card overflow-hidden border-slate-200 bg-slate-50/30"
            >
              <div className="px-8 py-5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-slate-500">
                  <Ban className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase tracking-[0.2em] font-mono italic">Descartados ({groups.skipped.length})</h4>
                </div>
              </div>
              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar grayscale opacity-80">
                {groups.skipped.map((col, idx) => renderColumnRow(col, idx))}
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>
    </div>
  );
};
