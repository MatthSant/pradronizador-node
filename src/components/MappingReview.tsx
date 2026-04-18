'use client';

import React, { useMemo } from 'react';
import { FIELD_DESCRIPTIONS } from '@/lib/constants';
import { CheckCircle2, AlertTriangle, Trash2, ArrowRightLeft, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface MappingReviewProps {
  mappings: Record<string, Record<string, string>>;
  perFileData: Record<string, { headers: string[], samples: Record<string, string[]> }>;
  type: string;
  customFieldLabels: Record<string, string>;
}

export const MappingReview: React.FC<MappingReviewProps> = ({ mappings, perFileData, type, customFieldLabels }) => {
  const summary = useMemo(() => {
    let totalMappedCount = 0;
    let totalUnusedCount = 0;
    const fileSummaries: { name: string, mapped: number, total: number }[] = [];
    const allMappedTargets = new Set<string>();

    Object.entries(perFileData).forEach(([fileName, data]) => {
      const fileMappings = mappings[fileName] || {};
      const mappedInFile = Object.entries(fileMappings).filter(([_, t]) => t !== '__NONE__' && t !== '__SKIP__');
      const unusedInFile = data.headers.filter(h => !fileMappings[h] || fileMappings[h] === '__NONE__' || fileMappings[h] === '__SKIP__');
      
      totalMappedCount += mappedInFile.length;
      totalUnusedCount += unusedInFile.length;
      
      mappedInFile.forEach(([_, t]) => allMappedTargets.add(t));
      
      fileSummaries.push({
        name: fileName,
        mapped: mappedInFile.length,
        total: data.headers.length
      });
    });

    // Missing required fields (Global check)
    const missingRequired = Object.entries(FIELD_DESCRIPTIONS)
      .filter(([key, meta]) => {
        const isMandatory = meta.name.includes('(Obrigatório)');
        if (!isMandatory) return false;
        
        const isGlobal = meta.category === 'global';
        const isTypeSpecific = meta.category === type;
        
        if (!isGlobal && !isTypeSpecific) return false;
        
        return !allMappedTargets.has(key);
      })
      .map(([_, meta]) => meta.name);

    return { totalMappedCount, totalUnusedCount, fileSummaries, missingRequired };
  }, [mappings, perFileData, type]);

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
        {/* BLOCK 1: FILE SYNC STATUS */}
        <div className="glass-card p-8 space-y-6 border-emerald-100 bg-emerald-50/[0.02]">
          <div className="flex items-center space-x-3 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
            <h4 className="text-sm font-black uppercase tracking-widest text-emerald-800">Sincronia por Arquivo</h4>
          </div>
          
          <div className="space-y-3">
            {summary.fileSummaries.map((f, i) => (
              <div key={i} className="p-4 bg-white border border-emerald-100 rounded-2xl shadow-sm flex items-center justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-black text-emerald-700">{i + 1}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-700 truncate" title={f.name}>{f.name}</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0">
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                    {f.mapped}/{f.total} colunas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BLOCK 2: GLOBAL AUDIT STATS */}
        <div className="glass-card p-8 space-y-8 border-slate-200 bg-slate-50/50">
          <div className="flex items-center space-x-3 text-slate-500">
            <Trash2 className="w-5 h-5" />
            <h4 className="text-sm font-black uppercase tracking-widest">Resumo do Lote</h4>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white border border-slate-200 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Mapeado</span>
              <span className="text-3xl font-black text-emerald-600">{summary.totalMappedCount}</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-bold italic">campos consolidados</span>
            </div>
            <div className="p-6 bg-white border border-slate-200 rounded-2xl">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Descartados</span>
              <span className="text-3xl font-black text-slate-400">{summary.totalUnusedCount}</span>
              <span className="text-[10px] text-slate-500 block mt-1 font-bold italic">serão ignorados</span>
            </div>
          </div>

          <div className="p-4 bg-white/50 border border-slate-200 rounded-xl border-dashed">
            <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
              <b>Nota do Auditor:</b> Todas as colunas mapeadas serão normalizadas conforme o dicionário <b>wtl_{type}</b>. Datas serão padronizadas para ISO e os e-mails serão limpos automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
