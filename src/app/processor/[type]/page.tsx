'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { MappingInterface } from '@/components/MappingInterface';
import { CustomFieldManager } from '@/components/CustomFieldManager';
import { FixedValueInjector } from '@/components/FixedValueInjector';
import { processFiles } from '@/lib/processor';
import { ArrowLeft, Play, Download, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
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
    // In a production app, we would sample the files here.
    // Simplifying: extraction would happen when files are set.
    return files.length > 0 ? ['Email', 'Nome', 'Telefone', 'Data da Transação', 'Status do Pedido', 'Campanha', 'Valor'] : [];
  }, [files]);

  const customFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    customFields.forEach(f => {
      if (f.label) labels[f.key] = f.label;
    });
    return labels;
  }, [customFields]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const resp = await processFiles(files, mappings, fixedValues, type as string);
      setResult(resp);
      setStep(isSurvey ? 5 : 4); // Jump to result
    } catch (err) {
      alert('Erro ao processar arquivos.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const steps = [
    { id: 1, name: 'Upload' },
    ...(isSurvey ? [{ id: 2, name: 'Dicionário' }] : []),
    { id: isSurvey ? 3 : 2, name: 'Mapeamento' },
    { id: isSurvey ? 4 : 3, name: 'Tags Fixas' },
    { id: isSurvey ? 5 : 4, name: 'Resultado' }
  ];

  const currentStepData = steps.find(s => s.id === step);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center text-slate-500 hover:text-white transition-all font-medium text-sm group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> Voltar ao Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center">
            Pipeline: <span className="text-indigo-500 ml-3">wtl_{type}</span>
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Fluxo de normalização e inteligência de dados históricos.</p>
        </div>
        
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          {steps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                step === s.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 
                step > s.id ? 'text-indigo-400' : 'text-slate-600'
              }`}>
                {s.name}
              </div>
              {idx < steps.length - 1 && <div className="w-4" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <FileUpload onFilesSelected={setFiles} />
            <div className="flex justify-end pt-4">
              <button 
                disabled={files.length === 0}
                onClick={nextStep}
                className="premium-button px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center disabled:opacity-30 disabled:grayscale transition-all"
              >
                Configurar Mapeamento <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {isSurvey && step === 2 && (
          <motion.div key="step-2-survey" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <CustomFieldManager fields={customFields} onChange={setCustomFields} />
            <div className="flex justify-between items-center pt-4">
              <button onClick={prevStep} className="px-8 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:text-white transition-colors flex items-center">
                <ChevronLeft className="mr-2 w-5 h-5" /> Voltar
              </button>
              <button onClick={nextStep} className="premium-button px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center">
                Seguir para Mapeamento <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === (isSurvey ? 3 : 2) && (
          <motion.div key="step-mapping" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <MappingInterface 
              sourceColumns={sourceColumns} 
              type={type as string}
              customFieldLabels={customFieldLabels}
              onMappingChange={setMappings} 
            />
            <div className="flex justify-between items-center pt-4">
              <button onClick={prevStep} className="px-8 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:text-white transition-colors flex items-center">
                <ChevronLeft className="mr-2 w-5 h-5" /> Voltar
              </button>
              <button onClick={nextStep} className="premium-button px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center">
                Configurar Tags Fixas <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === (isSurvey ? 4 : 3) && (
          <motion.div key="step-fixed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
            <FixedValueInjector 
              unmappedTargets={Object.keys(require('@/lib/constants').FIELD_DESCRIPTIONS).filter(t => !Object.values(mappings).includes(t))}
              onChange={setFixedValues} 
            />
            <div className="flex justify-between items-center pt-4">
              <button onClick={prevStep} className="px-8 py-4 rounded-2xl font-bold text-sm text-slate-400 hover:text-white transition-colors flex items-center">
                <ChevronLeft className="mr-2 w-5 h-5" /> Voltar
              </button>
              <button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="premium-button px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center group shadow-indigo-500/40"
              >
                {isProcessing ? 'Processando Dados...' : 'Finalizar e Consolidar'} 
                {!isProcessing && <Play className="ml-3 w-5 h-5 fill-current group-hover:scale-110 transition-transform" />}
              </button>
            </div>
          </motion.div>
        )}

        {step === (isSurvey ? 5 : 4) && (
          <motion.div 
            key="step-result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 glass-card text-center space-y-8 bg-emerald-500/5 border-emerald-500/20"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 blur-2xl opacity-20 animate-pulse" />
              <div className="relative w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-500" />
              </div>
            </div>
            
            <div>
              <h2 className="text-4xl font-black tracking-tight">Sucesso Absoluto!</h2>
              <p className="text-slate-400 mt-3 text-lg font-medium">
                Consolidamos <span className="text-emerald-400 font-bold">{result?.data?.length || 0}</span> linhas de dados 100% estruturados.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-4 pt-4">
              <button 
                onClick={() => {
                  const ws = XLSX.utils.json_to_sheet(result.data);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, "Resultado");
                  XLSX.writeFile(wb, `consolidado_${type}.xlsx`);
                }}
                className="premium-button px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center shadow-indigo-500/40"
              >
                Baixar Planilha Consolidada <Download className="ml-3 w-6 h-6" />
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-slate-800 hover:bg-slate-700 transition-all border border-slate-700"
              >
                Processar Novo Lote
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
