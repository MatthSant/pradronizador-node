'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { MappingInterface } from '@/components/MappingInterface';
import { FixedValueInjector } from '@/components/FixedValueInjector';
import { processFiles } from '@/lib/processor';
import { ArrowLeft, Play, Download, CheckCircle2, ChevronRight, ChevronLeft, Layers } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ProcessorPage() {
  const { type } = useParams();
  const router = useRouter();
  
  const [step, setStep] = useState<number>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [customFields, setCustomFields] = useState<{key: string, label: string}[]>([]);
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isSurvey = type === 'survey';

  const sourceColumns = useMemo(() => {
    return files.length > 0 ? ['Email', 'Nome', 'Telefone', 'Data da Transação', 'Status do Pedido', 'Campanha', 'Valor', 'Pergunta Extra 1'] : [];
  }, [files]);

  const customFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    customFields.forEach(f => {
      if (f.label) labels[f.key] = f.label;
    });
    return labels;
  }, [customFields]);

  const handleAddCustomField = (label: string) => {
    const nextIdx = customFields.length + 1;
    const newKey = `custom_field_${nextIdx}`;
    setCustomFields(prev => [...prev, { key: newKey, label }]);
    return newKey;
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const resp = await processFiles(files, mappings, fixedValues, type as string);
      setResult(resp);
      setStep(4);
    } catch (err) {
      alert('Erro ao processar arquivos.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 1, name: 'Upload' },
    { id: 2, name: 'Mapeamento' },
    { id: 3, name: 'Tags Fixas' },
    { id: 4, name: 'Conclusão' }
  ];

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="space-y-12 max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-black/[0.1] pb-10">
        <div className="space-y-4">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-purple-800 transition-all group"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 border border-purple-200 rounded-2xl flex items-center justify-center">
              <Layers className="text-purple-700 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                wtl_{type} <span className="text-slate-400 ml-2 font-light">Pipeline</span>
              </h1>
              <div className="flex items-center space-x-2 mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Frost Processing Cluster</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex bg-slate-200/30 p-1.5 rounded-2xl border border-black/[0.05] shadow-inner">
          {steps.map((s, idx) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className={`flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-purple-700 text-white shadow-lg shadow-purple-700/20' : 
                  isDone ? 'text-purple-800' : 'text-slate-400'
                }`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{s.name}</span>
                  {isDone && <CheckCircle2 className="w-3 h-3 ml-2" />}
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex items-center px-1">
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-[400px]"
        >
          {step === 1 && (
            <div className="space-y-10">
              <FileUpload onFilesSelected={setFiles} />
              <div className="flex justify-center md:justify-end">
                <button 
                  disabled={files.length === 0}
                  onClick={nextStep}
                  className="premium-button px-12 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center disabled:opacity-30 disabled:grayscale transition-all"
                >
                  Confirmar Artefatos <ChevronRight className="ml-3 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10">
              <MappingInterface 
                sourceColumns={sourceColumns} 
                type={type as string}
                customFieldLabels={customFieldLabels}
                onMappingChange={setMappings} 
                onAddCustomField={isSurvey ? handleAddCustomField : undefined}
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <button onClick={prevStep} className="px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors flex items-center">
                  <ChevronLeft className="mr-3 w-4 h-4" /> Revisar Upload
                </button>
                <button onClick={nextStep} className="premium-button px-12 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center transition-all">
                  Injetar Tags Fixas <ChevronRight className="ml-3 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-10">
              <FixedValueInjector 
                unmappedTargets={Object.keys(require('@/lib/constants').FIELD_DESCRIPTIONS).filter(t => !Object.values(mappings).includes(t))}
                onChange={setFixedValues} 
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <button onClick={prevStep} className="px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors flex items-center">
                  <ChevronLeft className="mr-3 w-4 h-4" /> Voltar ao Mapeamento
                </button>
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="premium-button px-14 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center group relative overflow-hidden"
                >
                  <span className="relative z-10">
                    {isProcessing ? 'Sincronizando...' : 'Consolidar Lote'} 
                  </span>
                  {!isProcessing && <Play className="ml-4 w-4 h-4 fill-current group-hover:scale-110 transition-transform relative z-10" />}
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center justify-center py-24 glass-card text-center space-y-10 bg-emerald-50/[0.05] border-emerald-200">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-600 blur-3xl opacity-10 animate-pulse" />
                <div className="relative w-28 h-28 bg-emerald-100 rounded-3xl flex items-center justify-center border border-emerald-200 rotate-3 animate-in zoom-in-50 duration-700">
                  <CheckCircle2 className="w-16 h-16 text-emerald-700" />
                </div>
              </div>
              
              <div className="space-y-4">
                <h2 className="text-5xl font-black tracking-tighter text-slate-900">Pipeline Concluído.</h2>
                <p className="text-slate-700 text-lg font-bold">
                  Processamos <span className="text-emerald-700 font-extrabold">{result?.data?.length || 0}</span> registros com sucesso nominal.
                </p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-5 pt-6">
                <button 
                  onClick={() => {
                    const ws = XLSX.utils.json_to_sheet(result.data);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Resultado");
                    XLSX.writeFile(wb, `consolidado_${type}.xlsx`);
                  }}
                  className="premium-button px-14 py-6 rounded-2xl text-[12px] uppercase tracking-[0.3em] flex items-center shadow-xl shadow-purple-700/30"
                >
                  Baixar Consolidação <Download className="ml-4 w-6 h-6" />
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="px-10 py-6 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 text-slate-600"
                >
                  Novo Pipeline
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
