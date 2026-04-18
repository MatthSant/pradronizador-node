'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { FIELD_DESCRIPTIONS, HARD_MAPPINGS } from '@/lib/constants';
import { Check, AlertCircle, ChevronRight, FileStack, X, Sparkles, Ban, ListFilter, Trash2, RotateCcw, Info, CheckCircle } from 'lucide-react';
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

  useEffect(() => {
    const initialMappingsPreserved: Record<string, string> = {};
    sourceColumns.forEach(col => {
      if (initialMappings[col] && initialMappings[col] !== '__NONE__') {
        initialMappingsPreserved[col] = initialMappings[col];
        return;
      }
      if (type === 'transactions' && HARD_MAPPINGS[col]) {
        initialMappingsPreserved[col] = HARD_MAPPINGS[col];
        return;
      }
      initialMappingsPreserved[col] = '__NONE__';
    });
    setMappings(initialMappingsPreserved);
  }, [activeFileName, sourceColumns, type]); 

  const groups = useMemo(() => {
    const pending: string[] = [];
    const mapped: string[] = [];
    const skipped: string[] = [];
    safeSourceColumns.forEach(col => {
      const target = mappings[col];
      if (target === '__SKIP__') skipped.push(col);
      else if (!target || target === '__NONE__') pending.push(col);
      else mapped.push(col);
    });
    return { pending, mapped, skipped };
  }, [safeSourceColumns, mappings]);

  const applyHotmartPreset = () => {
    const newMappings = { ...mappings };
    safeSourceColumns.forEach(col => {
      if (HARD_MAPPINGS[col]) newMappings[col] = HARD_MAPPINGS[col];
      else if (!newMappings[col] || newMappings[col] === '__NONE__') newMappings[col] = '__SKIP__';
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
      className={`flex flex-col space-y-3 p-6 rounded-3xl border transition-all group relative ${
        mappings[col] === '__SKIP__' 
          ? 'bg-slate-50 border-slate-100 opacity-60' 
          : mappings[col] && mappings[col] !== '__NONE__'
          ? 'bg-emerald-50/20 border-emerald-100 shadow-sm'
          : 'bg-white border-slate-100 hover:border-purple-200 hover:shadow-md'
      }`}
    >
      <div className="flex items-center justify-between gap-8">
        <div className="flex-1 min-w-0 flex flex-col items-start relative">
          <div className="flex items-center space-x-2 mb-2 h-4">
            <span className="text-technical text-slate-600">Header Origem</span>
            <Info className="w-3 h-3 text-slate-300" />
          </div>
          <p className="text-base font-bold text-slate-900 break-words leading-tight" title={col}>{col}</p>

          <AnimatePresence>
            {hoveredCol === col && sourceSamples[col] && sourceSamples[col].length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                className="absolute z-50 top-full left-0 mt-4 p-5 bg-white backdrop-blur-xl border border-slate-200 rounded-[1.5rem] shadow-2xl min-w-[240px]"
              >
                <div className="flex items-center space-x-2 mb-4 border-b border-slate-50 pb-3">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  <span className="text-technical text-slate-500">Amostra de Valores</span>
                </div>
                <div className="space-y-2">
                  {sourceSamples[col].map((val, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="text-[11px] font-medium text-slate-600 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 truncate"
                    >
                      {String(val)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="flex-shrink-0 pt-6">
          <ChevronRight className={`w-6 h-6 transition-colors ${mappings[col] && mappings[col] !== '__NONE__' && mappings[col] !== '__SKIP__' ? 'text-emerald-500' : 'text-slate-200 group-hover:text-purple-400'}`} />
        </div>
        
        <div className="flex-1 min-w-0 flex items-center space-x-3">
          <div className="flex-1">
            <span className="text-technical text-slate-600 mb-2 block">Destino Padronizado</span>
            <select 
              disabled={mappings[col] === '__SKIP__'}
              value={mappings[col] === '__SKIP__' ? '__NONE__' : (mappings[col] || '__NONE__')}
              onChange={(e) => handleSelect(col, e.target.value)}
              onMouseEnter={() => setHoveredCol(col)}
              onMouseLeave={() => setHoveredCol(null)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold uppercase tracking-wider px-4 py-3 focus:ring-4 focus:ring-purple-100 outline-none transition-all appearance-none cursor-pointer hover:border-purple-300 text-slate-800 disabled:opacity-30"
            >
              {targetOptions.map(opt => (
                <option key={opt.id} value={opt.id} className="text-slate-900">
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="pt-6 flex items-center space-x-3">
            <button 
              onClick={() => toggleSkip(col)}
              title={mappings[col] === '__SKIP__' ? "Resgatar Campo" : "Descartar Campo"}
              className={`p-3 rounded-xl border transition-all ${
                mappings[col] === '__SKIP__'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                  : 'bg-white border-slate-200 text-slate-300 hover:text-red-500 hover:border-red-100 hover:bg-red-50'
              }`}
            >
              {mappings[col] === '__SKIP__' ? <RotateCcw className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
            </button>

            <div className="w-8 flex justify-center">
              {mappings[col] === '__SKIP__' ? null : mappings[col] !== '__NONE__' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-1.5 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </motion.div>
              ) : (
                <div className="p-1.5 bg-amber-50 border border-amber-100 rounded-full text-amber-500">
                  <AlertCircle className="w-5 h-5 animate-pulse" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="glass-card mb-12 p-10 bg-white/40 border-slate-100 relative overflow-hidden group shadow-xl shadow-purple-900/5">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
          <FileStack className="w-40 h-40 text-purple-600" />
        </div>
        <div className="relative z-10 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
               <div className="px-4 py-1.5 bg-purple-600 border border-purple-500 rounded-full shadow-lg shadow-purple-600/10">
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">Artefato {fileIndex + 1} de {totalFiles}</span>
               </div>
               <div className="h-0.5 w-32 bg-slate-100 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((fileIndex + 1) / totalFiles) * 100}%` }}
                   className="h-full bg-purple-500"
                 />
               </div>
            </div>
            {type === 'transactions' && (
              <button 
                onClick={applyHotmartPreset}
                className="flex items-center space-x-2 text-technical text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-5 py-2.5 rounded-full transition-all group active:scale-95 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Aplicar Preset Hotmart</span>
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-baseline md:space-x-4">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                Mapeando
              </h2>
              <span className="text-xl font-bold text-purple-600 italic truncate max-w-lg" title={activeFileName}>
                "{activeFileName}"
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium max-w-2xl leading-relaxed">
              Mapeie os cabeçalhos originais para os padrões de inteligência da rede. 
              Use campos customizados para capturar dados granulares.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-6 mb-8 items-center justify-between">
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center space-x-3">
            <ListFilter className="w-4 h-4 text-slate-400" />
            <span className="text-technical text-slate-600">
              Mapeamento: {groups.mapped.length}/{safeSourceColumns.length - groups.skipped.length} Colunas
            </span>
          </div>
          {groups.pending.length > 0 && (
            <div className="px-6 py-3 bg-white border border-rose-100 rounded-2xl shadow-sm flex items-center space-x-3">
              <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
              <span className="text-technical text-rose-600">
                Pendentes: {groups.pending.length}
              </span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {groups.pending.length > 0 && (
          <motion.div 
            key="section-pending"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-card overflow-hidden border-rose-100 bg-white"
          >
            <div className="px-10 py-6 bg-rose-50/30 border-b border-rose-50 flex items-center justify-between">
              <div className="flex items-center space-x-3 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h4 className="text-technical italic">Aguardando Mapeamento ({groups.pending.length})</h4>
              </div>
            </div>
            <div className="p-10 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
              {groups.pending.map((col, idx) => renderColumnRow(col, idx))}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {groups.mapped.length > 0 && (
            <motion.div 
              key="section-mapped"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card overflow-hidden border-emerald-100 bg-white"
            >
              <div className="px-10 py-6 bg-emerald-50/30 border-b border-emerald-50 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                  <h4 className="text-technical italic">Vínculos Ativos ({groups.mapped.length})</h4>
                </div>
              </div>
              <div className="p-8 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                {groups.mapped.map((col, idx) => renderColumnRow(col, idx))}
              </div>
            </motion.div>
          )}

          {groups.skipped.length > 0 && (
            <motion.div 
              key="section-skipped"
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card overflow-hidden border-slate-200 bg-slate-50/30"
            >
              <div className="px-10 py-6 bg-slate-100/50 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-3 text-slate-400">
                  <Ban className="w-5 h-5" />
                  <h4 className="text-technical italic">Colunas Descartadas ({groups.skipped.length})</h4>
                </div>
              </div>
              <div className="p-8 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar grayscale opacity-60">
                {groups.skipped.map((col, idx) => renderColumnRow(col, idx))}
              </div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      <AnimatePresence>
        {creatingForCol && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCreatingForCol(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden"
            >
              <div className="p-12 space-y-10">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <span className="text-technical text-purple-600 block">Dicionário Dinâmico</span>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Novo Campo Customizado</h3>
                  </div>
                  <button 
                    onClick={() => setCreatingForCol(null)}
                    className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                   <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                     <p className="text-sm text-purple-800 font-medium leading-relaxed italic">
                       &quot;Este campo será incorporado ao processamento. Use rótulos que facilitem a futura análise dos dados.&quot;
                     </p>
                   </div>
                   
                   <div className="space-y-6">
                      <div className="group">
                        <label className="text-technical text-slate-400 ml-2 mb-3 block">Rótulo / Pergunta da Coluna</label>
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Ex: Renda Mensal do Usuário..."
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleCreateConfirm()}
                          className="w-full bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-base text-slate-900 font-bold focus:ring-4 focus:ring-purple-50 focus:border-purple-300 outline-none transition-all placeholder:text-slate-300"
                        />
                      </div>

                      <button 
                        onClick={handleCreateConfirm}
                        className="premium-button w-full py-6 rounded-3xl text-sm flex items-center justify-center space-x-3"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Confirmar Inclusão</span>
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
