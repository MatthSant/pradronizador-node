'use client';

import React, { useMemo } from 'react';
import { FIELD_DESCRIPTIONS } from '@/lib/constants';
import { CheckCircle2, AlertTriangle, Trash2, ArrowRightLeft, Sparkles, ClipboardCheck } from 'lucide-react';
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

    const missingRequired = Object.entries(FIELD_DESCRIPTIONS)
      .filter(([key, meta]) => {
        const isMandatory = meta.name.includes('(Obrigatório)');
        if (!isMandatory) return false;
        if (type === 'transactions' && key === 'data') return false;
        const isGlobal = meta.category === 'global';
        const isTypeSpecific = meta.category === type;
        if (!isGlobal && !isTypeSpecific) return false;
        return !allMappedTargets.has(key);
      })
      .map(([_, meta]) => meta.name);

    return { totalMappedCount, totalUnusedCount, fileSummaries, missingRequired };
  }, [mappings, perFileData, type]);

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-3xl font-black tracking-tighter text-slate-900">Auditoria de Mapeamento</h3>
          <p className="text-slate-500 font-medium text-lg leading-relaxed">Valide a integridade estrutural do lote antes da consolidação.</p>
        </div>
        <div className="px-5 py-2 bg-purple-50 border border-purple-100 rounded-full flex items-center space-x-3 shadow-sm">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="text-technical text-purple-700">Relatório de Pré-Ingestão Ativo</span>
        </div>
      </div>

      {summary.missingRequired.length > 0 && (
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-10 border border-rose-100 bg-rose-50/20 rounded-[2.5rem] space-y-6"
        >
          <div className="flex items-center space-x-4 text-rose-600">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-900/5 transition-transform group hover:scale-110">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xl font-bold tracking-tight text-rose-900 leading-none">Inconsistência de Requisitos</h4>
              <span className="text-technical text-rose-400 mt-1 block">Critical Data Audit Filter</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            Detectamos lacunas em campos obrigatórios para o pipeline <b>wtl_{type}</b>. 
            Você pode mapeá-los agora ou injetar valores padrão (Tags Fixas) no próximo passo.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            {summary.missingRequired.map((name, i) => (
              <span key={i} className="px-5 py-2 bg-white border border-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm">
                {name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="glass-card p-10 space-y-8 border-slate-100 bg-white">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div className="flex items-center space-x-4 text-slate-900">
              <ClipboardCheck className="w-5 h-5 text-purple-600" />
              <h4 className="text-technical">Integridade por Arquivo</h4>
            </div>
          </div>
          
          <div className="space-y-4">
            {summary.fileSummaries.map((f, i) => (
              <div key={i} className="p-5 bg-slate-50/50 border border-slate-100 rounded-3xl flex items-center justify-between group hover:bg-white hover:border-purple-200 transition-all duration-500">
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-slate-400 group-hover:text-purple-600 transition-colors">
                    {i + 1}
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate" title={f.name}>{f.name}</span>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <span className="text-technical text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm transition-colors group-hover:border-emerald-100 group-hover:text-emerald-600">
                    {f.mapped}/{f.total}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-10 space-y-10 border-slate-100 bg-white">
          <div className="flex items-center justify-between border-b border-slate-50 pb-6">
            <div className="flex items-center space-x-4 text-slate-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h4 className="text-technical">Métricas de Consolidação</h4>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-4 shadow-sm">
              <span className="text-technical text-slate-400 block">Mapeados</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-5xl font-black text-slate-900 leading-none tracking-tighter">{summary.totalMappedCount}</span>
                <span className="text-[10px] font-bold text-emerald-600 uppercase">OK</span>
              </div>
            </div>
            <div className="p-8 bg-slate-50/50 border border-slate-100 rounded-[2rem] space-y-4 shadow-sm opacity-60">
              <span className="text-technical text-slate-400 block">Ignorados</span>
              <div className="flex items-baseline space-x-1">
                <span className="text-5xl font-black text-slate-300 leading-none tracking-tighter">{summary.totalUnusedCount}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">OFF</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
            <p className="text-xs text-slate-500 font-medium leading-relaxed italic">
              <b>Nota do Auditor:</b> O processamento seguirá o padrão rigoroso <b>wtl_{type}</b>. 
              Estruturas complexas serão normalizadas e strings higienizadas automaticamente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
