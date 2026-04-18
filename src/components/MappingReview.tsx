'use client';

import React, { useMemo } from 'react';
import { FIELD_DESCRIPTIONS } from '@/lib/constants';
import { CheckCircle2, AlertTriangle, Trash2, ArrowRightLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface MappingReviewProps {
  mappings: Record<string, string>;
  sourceColumns: string[];
  type: string;
}

export const MappingReview: React.FC<MappingReviewProps> = ({ mappings, sourceColumns, type }) => {
  const summary = useMemo(() => {
    // Mapped connections
    const mapped = Object.entries(mappings)
      .filter(([_, target]) => target !== '__NONE__' && target !== '__SKIP__')
      .map(([source, target]) => ({ source, target, label: FIELD_DESCRIPTIONS[target]?.name || target }));

    // Unused source columns
    const unused = sourceColumns.filter(col => !mappings[col] || mappings[col] === '__NONE__' || mappings[col] === '__SKIP__');

    // Missing required fields for the specific type
    const mappedTargetKeys = new Set(Object.values(mappings));
    
    // Determine which description keys are relevant to this operation
    // For simplicity, we filter by mandatory status and common sense relevance
    const missingRequired = Object.entries(FIELD_DESCRIPTIONS)
      .filter(([key, meta]) => {
        const isMandatory = meta.name.includes('(Obrigatório)');
        if (!isMandatory) return false;
        
        // Filter relevance by type
        if (type === 'events' && key.startsWith('field_transaction')) return false;
        if (type === 'transactions' && key === 'field_action') return false;
        if (type === 'survey' && (key.startsWith('utm_') || key.startsWith('field_transaction'))) return false;
        
        return !mappedTargetKeys.has(key);
      })
      .map(([_, meta]) => meta.name);

    return { mapped, unused, missingRequired };
  }, [mappings, sourceColumns, type]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black tracking-tight text-slate-900">Visão Geral da Sincronização</h3>
          <p className="text-slate-500 font-medium text-sm">Revise como seus dados serão transformados antes de prosseguir.</p>
        </div>
        <div className="px-4 py-2 bg-purple-50 border border-purple-100 rounded-xl flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-700">Auditoria Premium Ativa</span>
        </div>
      </div>

      {/* BLOCK 3: MISSING REQUIREMENTS (ALERT) - MOVED TO TOP */}
      {summary.missingRequired.length > 0 && (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-8 border-2 border-red-100 bg-red-50/30 rounded-3xl space-y-4 mb-8"
        >
          <div className="flex items-center space-x-3 text-red-600">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            <h4 className="text-lg font-black uppercase tracking-tighter">Atenção: Lacunas de Dados Detectadas</h4>
          </div>
          <p className="text-sm text-red-800 font-medium">Os seguintes campos obrigatórios não foram mapeados. Recomenda-se injetá-los como <b>Tags Fixas</b> no próximo passo ou revisar o mapeamento:</p>
          <div className="flex flex-wrap gap-3">
            {summary.missingRequired.map((name, i) => (
              <span key={i} className="px-4 py-2 bg-white border border-red-200 text-red-600 text-xs font-black rounded-xl shadow-sm">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* BLOCK 1: MAPPED CONNECTIONS */}
        <div className="glass-card p-8 space-y-6 border-emerald-100 bg-emerald-50/[0.02]">
          <div className="flex items-center space-x-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <h4 className="text-sm font-black uppercase tracking-widest">Conexões Ativas ({summary.mapped.length})</h4>
          </div>
          
          <div className="space-y-3">
            {summary.mapped.length === 0 ? (
              <p className="text-slate-400 text-xs italic">Nenhum mapeamento ativo encontrado.</p>
            ) : (
              summary.mapped.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-emerald-100 rounded-xl shadow-sm">
                  <span className="text-xs font-bold text-slate-600 truncate max-w-[140px]">{m.source}</span>
                  <ArrowRightLeft className="w-3 h-3 text-emerald-300 mx-2 flex-shrink-0" />
                  <span className="text-xs font-black text-emerald-700 text-right">{m.label.split('(')[0]}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* BLOCK 2: UNUSED / IGNORED */}
        <div className="glass-card p-8 space-y-6 border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3 text-slate-500">
            <Trash2 className="w-5 h-5" />
            <h4 className="text-sm font-black uppercase tracking-widest">Campos Descartados ({summary.unused.length})</h4>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {summary.unused.length === 0 ? (
              <p className="text-slate-400 text-xs italic">Todos os campos estão sendo utilizados.</p>
            ) : (
              summary.unused.map((col, i) => (
                <span key={i} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-tight">
                  {col}
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
