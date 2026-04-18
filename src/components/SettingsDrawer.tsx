'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, RotateCcw, Trash2, Edit3, Check, Sparkles, AlertTriangle, ChevronRight } from 'lucide-react';
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
          {/* Overlay */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.1)] border-l border-slate-200 flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tighter uppercase italic">Frost Control Center</h3>
                  <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Painel de Auditoria Global</span>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-200 text-slate-400 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
              
              {/* Reset Section */}
              <section className="space-y-4">
                <div className="flex items-center space-x-2 text-slate-400">
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">Gestão de Ciclo de Vida</span>
                </div>
                <div className="p-6 bg-red-50 border border-red-100 rounded-3xl space-y-4">
                   <div className="flex items-start space-x-3">
                     <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                     <div className="space-y-1">
                       <h4 className="text-xs font-black text-red-900 uppercase">Resetar Sessão Atual</h4>
                       <p className="text-[11px] text-red-700 font-medium leading-relaxed italic">
                         Cuidado: Isso limpará todos os arquivos carregados ({files.length}), mapeamentos e campos customizados permanentemente.
                       </p>
                     </div>
                   </div>
                   <button 
                     onClick={() => {
                        if (confirm('Tem certeza que deseja resetar toda a sessão? Todos os dados serão perdidos.')) {
                          resetSession();
                          onClose();
                        }
                     }}
                     className="w-full py-4 bg-white hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm active:scale-95 flex items-center justify-center space-x-2 group"
                   >
                     <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                     <span>Limpar e Voltar ao Início</span>
                   </button>
                </div>
              </section>

              {/* Custom Fields Manager */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] font-mono">Gerenciador de Atributos</span>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500">{customFields.length} campos</span>
                </div>

                <div className="space-y-3">
                  {customFields.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center px-6">
                      <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                        <Settings className="w-6 h-6 opacity-20" />
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold leading-relaxed uppercase tracking-widest">Nenhum campo customizado <br/> criado nesta sessão</p>
                    </div>
                  ) : (
                    customFields.map((field) => (
                      <div 
                        key={field.key}
                        className="group p-4 bg-white border border-slate-100 hover:border-purple-200 rounded-2xl transition-all hover:shadow-lg hover:shadow-purple-900/5"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0 flex items-center space-x-2 overflow-hidden">
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">{field.key}</span>
                              {editingKey === field.key ? (
                                <input 
                                  autoFocus
                                  value={tempLabel}
                                  onChange={(e) => setTempLabel(e.target.value)}
                                  onBlur={() => handleEditSave(field.key)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleEditSave(field.key)}
                                  className="w-full bg-slate-50 border border-purple-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none"
                                />
                              ) : (
                                <div className="flex items-center space-x-2 cursor-pointer group/label" onClick={() => handleEditStart(field.key, field.label)}>
                                  <h5 className="text-xs font-bold text-slate-800 truncate" title={field.label}>{field.label}</h5>
                                  <Edit3 className="w-3 h-3 text-slate-300 group-hover/label:text-purple-500 transition-colors flex-shrink-0" />
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 transition-opacity">
                            {editingKey === field.key ? (
                              <button onClick={() => handleEditSave(field.key)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <>
                                <button onClick={() => handleEditStart(field.key, field.label)} className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => removeCustomField(field.key)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Version Info */}
              <div className="pt-10 border-t border-slate-100">
                 <div className="flex items-center justify-between px-2">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Frost Engine v2.1</span>
                     <span className="text-[9px] font-bold text-slate-400 uppercase">Stable Build</span>
                   </div>
                   <div className="flex items-center space-x-2 text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                     <span>Sistema Online</span>
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
