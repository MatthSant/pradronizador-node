'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, RotateCcw, Trash2, Edit3, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { usePipeline } from '@/providers/PipelineContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { customFields, updateCustomField, removeCustomField, resetSession, files } = usePipeline();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempLabel, setTempLabel] = useState('');

  const handleEditStart = (key: string, currentLabel: string) => {
    setEditingKey(key);
    setTempLabel(currentLabel);
  };

  const handleEditSave = (key: string) => {
    updateCustomField(key, tempLabel);
    setEditingKey(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-hidden">
          {/* Blur Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300, mass: 0.8 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-[-40px_0_100px_rgba(0,0,0,0.15)] border-l border-slate-100 flex flex-col"
          >
            {/* Header */}
            <div className="p-10 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-slate-900/20">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Configurações</h3>
                  <span className="text-technical text-slate-400 mt-1 block uppercase">Workspace Control Center</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-50 text-slate-300 hover:text-slate-900 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
              
              {/* Security Lock Info */}
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-900">Segurança de Dados Ativa</p>
                  <p className="text-[10px] text-slate-400 font-medium leading-tight">O processamento é 100% isolado em seu navegador.</p>
                </div>
              </div>

              {/* Reset Control */}
              <section className="space-y-6">
                <div className="flex items-center space-x-3 text-slate-300">
                  <RotateCcw className="w-4 h-4" />
                  <h4 className="text-technical uppercase">Ciclo de Vida</h4>
                </div>
                <div className="p-8 border-2 border-rose-50 rounded-[2.5rem] space-y-6">
                   <div className="space-y-2">
                     <div className="flex items-center space-x-2 text-rose-600">
                       <AlertTriangle className="w-4 h-4" />
                       <h5 className="text-sm font-black uppercase tracking-tight">Purge Lote Atual</h5>
                     </div>
                     <p className="text-xs text-slate-500 font-medium leading-relaxed">
                       Esta ação limpará permanentemente os <b>{files.length} arquivos</b>, 
                       mapeamentos e cache local. Não é possível reverter após a confirmação.
                     </p>
                   </div>
                   <button 
                     onClick={() => {
                        if (confirm('Tem certeza que deseja resetar toda a sessão? Todos os dados serão perdidos.')) {
                          resetSession();
                          onClose();
                        }
                     }}
                     className="w-full py-5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-100 hover:border-rose-600 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm active:scale-[0.98] flex items-center justify-center space-x-3 group"
                   >
                     <Trash2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                     <span>Destruir Session Cache</span>
                   </button>
                </div>
              </section>

              {/* Custom Attribs Manager */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 text-slate-300">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="text-technical uppercase">Dicionário Técnico</h4>
                  </div>
                  <span className="text-technical text-slate-200">{customFields.length} Registrados</span>
                </div>

                <div className="space-y-4">
                  {customFields.length === 0 ? (
                    <div className="py-20 border border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center text-center px-10">
                      <div className="w-16 h-16 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mb-6 text-slate-200">
                        <Edit3 className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="text-technical text-slate-300 max-w-[200px] leading-relaxed">Nenhum campo customizado injetado nesta rotina</p>
                    </div>
                  ) : (
                    customFields.map((field) => (
                      <div 
                        key={field.key}
                        className="group p-6 bg-slate-50/50 border border-slate-100 hover:bg-white hover:border-purple-200 rounded-3xl transition-all duration-500 hover:shadow-xl hover:shadow-purple-900/5"
                      >
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex-1 min-w-0">
                            <span className="text-technical text-slate-400 block mb-2">{field.key}</span>
                            {editingKey === field.key ? (
                              <input 
                                autoFocus
                                value={tempLabel}
                                onChange={(e) => setTempLabel(e.target.value)}
                                onBlur={() => handleEditSave(field.key)}
                                onKeyDown={(e) => e.key === 'Enter' && handleEditSave(field.key)}
                                className="w-full bg-white border border-purple-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-purple-50 outline-none transition-all shadow-sm"
                              />
                            ) : (
                              <div className="flex items-center space-x-3 cursor-pointer group/label" onClick={() => handleEditStart(field.key, field.label)}>
                                <h5 className="text-sm font-bold text-slate-800 truncate" title={field.label}>{field.label}</h5>
                                <Edit3 className="w-3 h-3 text-slate-200 group-hover/label:text-purple-400 transition-colors flex-shrink-0" />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => removeCustomField(field.key)} 
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Version & Build */}
              <div className="pt-12 border-t border-slate-50">
                 <div className="flex items-center justify-between">
                   <div>
                     <span className="text-technical text-slate-900 block mb-1">DataStruct Stable</span>
                     <span className="text-technical text-slate-300">Build Ver 1.1.0-Release</span>
                   </div>
                   <div className="flex items-center space-x-2 text-technical text-emerald-600">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span>Cloud Sync Lockdown</span>
                   </div>
                 </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
