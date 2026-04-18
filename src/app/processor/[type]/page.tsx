'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { MappingInterface } from '@/components/MappingInterface';
import { MappingReview } from '@/components/MappingReview';
import { StatusNormalizer } from '@/components/StatusNormalizer';
import { FixedValueInjector } from '@/components/FixedValueInjector';
import { processFiles, extractFileHeaders, discoverUniqueStatuses } from '@/lib/processor';
import { ArrowLeft, Play, Download, CheckCircle2, ChevronRight, ChevronLeft, Layers, Loader2, Sparkles, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ProcessorPage() {
  const { type } = useParams();
  const router = useRouter();
  
  const [step, setStep] = useState<number>(1);
  const [files, setFiles] = useState<File[]>([]);
  const [perFileData, setPerFileData] = useState<Record<string, { headers: string[], samples: Record<string, string[]> }>>({});
  const [activeMappingFileIdx, setActiveMappingFileIdx] = useState(0);
  const [mappings, setMappings] = useState<Record<string, Record<string, string>>>({}); // fileName -> mappings
  const [customFields, setCustomFields] = useState<{key: string, label: string}[]>([]);
  const [statusMappings, setStatusMappings] = useState<Record<string, string>>({});
  const [discoveredStatuses, setDiscoveredStatuses] = useState<string[]>([]);
  const [isDiscoveringStatuses, setIsDiscoveringStatuses] = useState(false);
  const [fixedValues, setFixedValues] = useState<Record<string, Record<string, string>>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState({ current: 0, total: 0, fileName: '' });
  const [isExtractingHeaders, setIsExtractingHeaders] = useState(false);
  const [result, setResult] = useState<any>(null);

  const isSurvey = type === 'survey';
  const isTransaction = type === 'transactions';

  const handleFilesSelected = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    
    // Initialize empty records per file
    const initialMappings: Record<string, Record<string, string>> = {};
    const initialFixed: Record<string, Record<string, string>> = {};
    selectedFiles.forEach(f => {
      initialMappings[f.name] = {};
      initialFixed[f.name] = {};
    });
    setMappings(initialMappings);
    setFixedValues(initialFixed);
    setActiveMappingFileIdx(0);

    if (selectedFiles.length > 0) {
      setIsExtractingHeaders(true);
      try {
        const fileMetadata = await extractFileHeaders(selectedFiles);
        setPerFileData(fileMetadata);
      } finally {
        setIsExtractingHeaders(false);
      }
    } else {
      setPerFileData({});
    }
  };

  const updateMappingForActiveFile = useCallback((newFileMappings: Record<string, string>) => {
    const currentFile = files[activeMappingFileIdx];
    if (!currentFile) return;
    
    setMappings(prev => {
      // Avoid unnecessary state updates if data is identical
      if (JSON.stringify(prev[currentFile.name]) === JSON.stringify(newFileMappings)) {
        return prev;
      }
      return {
        ...prev,
        [currentFile.name]: newFileMappings
      };
    });
  }, [files, activeMappingFileIdx]);

  const customFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    customFields.forEach(f => {
      if (f.label) labels[f.key] = f.label;
    });
    return labels;
  }, [customFields]);

  const handleAddCustomField = useCallback((label: string) => {
    const nextIdx = customFields.length + 1;
    const newKey = `custom_field_${nextIdx}`;
    setCustomFields(prev => [...prev, { key: newKey, label }]);
    return newKey;
  }, [customFields.length]);

  const handleStartStatusDiscovery = async () => {
    setIsDiscoveringStatuses(true);
    try {
      const statuses = await discoverUniqueStatuses(files, mappings, type as string);
      setDiscoveredStatuses(statuses);
      setStep(3);
    } catch (err) {
      console.error(err);
      alert('Erro ao analisar status.');
      setStep(4); // Fallback to review
    } finally {
      setIsDiscoveringStatuses(false);
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    setProcessingStatus({ current: 0, total: files.length, fileName: 'Iniciando...' });
    
    try {
      // Use a small delay to allow UI to render first
      await new Promise(r => setTimeout(r, 100));
      
      const resp = await processFiles(
        files, 
        mappings, 
        fixedValues, 
        type as string,
        async (fileName, current, total) => {
          setProcessingStatus({ fileName, current, total });
          // Force a tiny gap for React to render the progress update
          await new Promise(r => setTimeout(r, 10));
        },
        statusMappings
      );
      setResult(resp);
      setStep(6);
    } catch (err) {
      alert('Erro ao processar arquivos.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadCsv = (data: any[], filename: string) => {
    if (!data || data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h] === null || row[h] === undefined ? "" : String(row[h]);
        if (val.includes(',') || val.includes('"') || val.includes('\n')) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const steps = [
    { id: 1, name: 'Upload' },
    { id: 2, name: 'Mapeamento' },
    ...(isTransaction ? [{ id: 3, name: 'Normalização' }] : []),
    { id: 4, name: 'Revisão' },
    { id: 5, name: 'Tags Fixas' },
    { id: 6, name: 'Conclusão' }
  ];

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="space-y-12 w-full py-8">
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
      
      {/* LOADING OVERLAY FOR HEADER EXTRACTION */}
      <AnimatePresence>
        {isExtractingHeaders && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-md"
          >
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-20 h-20 rounded-full border-4 border-purple-100 border-t-purple-600 shadow-xl shadow-purple-200"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Analisando Estruturas...</h4>
                <div className="flex items-center justify-center space-x-2 text-purple-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">Smart Mapping Engine</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PROCESSING OVERLAY (CONSOLIDATION) */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-white/90 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center space-y-10 w-full max-w-md px-10">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600 blur-3xl opacity-20 animate-pulse" />
                <div className="relative w-24 h-24 bg-white border-2 border-purple-100 rounded-[2.5rem] flex items-center justify-center shadow-2xl rotate-6">
                  <Loader2 className="w-12 h-12 text-purple-600 animate-spin" strokeWidth={1.5} />
                </div>
              </div>

              <div className="text-center space-y-4 w-full">
                <div className="space-y-1">
                  <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Sincronizando Lote</h4>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-600 flex items-center justify-center space-x-2">
                    <Sparkles className="w-3 h-3" />
                    <span>Frost High-Speed Engine</span>
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(processingStatus.current / processingStatus.total) * 100}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full shadow-[0_0_15px_rgba(147,51,234,0.4)]"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                    <span className="truncate max-w-[200px] text-left" title={processingStatus.fileName}>
                      {processingStatus.fileName}
                    </span>
                    <span className="text-purple-700 bg-purple-50 px-2 py-1 rounded-md border border-purple-100 italic">
                      {processingStatus.current} de {processingStatus.total} arquivos
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-medium max-w-[280px] mx-auto leading-relaxed">
                  Trabalhando na normalização e limpeza de campo por campo. Por favor, mantenha esta aba ativa.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <FileUpload onFilesSelected={handleFilesSelected} />
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
              {files[activeMappingFileIdx] && (
                <MappingInterface 
                  activeFileName={files[activeMappingFileIdx].name}
                  fileIndex={activeMappingFileIdx}
                  totalFiles={files.length}
                  sourceColumns={perFileData[files[activeMappingFileIdx].name]?.headers || []} 
                  sourceSamples={perFileData[files[activeMappingFileIdx].name]?.samples || {}}
                  type={type as string}
                  customFieldLabels={customFieldLabels}
                  initialMappings={mappings[files[activeMappingFileIdx].name] || {}}
                  onMappingChange={updateMappingForActiveFile} 
                  onAddCustomField={isSurvey ? handleAddCustomField : undefined}
                />
              )}
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <button 
                  onClick={() => {
                    if (activeMappingFileIdx > 0) setActiveMappingFileIdx(prev => prev - 1);
                    else prevStep();
                  }}
                  className="px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors flex items-center"
                >
                  <ChevronLeft className="mr-3 w-4 h-4" /> {activeMappingFileIdx > 0 ? 'Arquivo Anterior' : 'Revisar Upload'}
                </button>
                
                <button 
                  onClick={() => {
                    if (activeMappingFileIdx < files.length - 1) {
                      setActiveMappingFileIdx(prev => prev + 1);
                    } else if (isTransaction) {
                      handleStartStatusDiscovery();
                    } else {
                      setStep(4);
                    }
                  }}
                  className="premium-button px-12 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center transition-all"
                >
                  {activeMappingFileIdx < files.length - 1 ? (
                    <>Próximo Arquivo <ChevronRight className="ml-3 w-5 h-5" /></>
                  ) : isTransaction ? (
                    <>Sincronia de Status <ChevronRight className="ml-3 w-5 h-5" /></>
                  ) : (
                    <>Auditoria de Dados <ChevronRight className="ml-3 w-5 h-5" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && isTransaction && (
            <div className="space-y-10">
              <StatusNormalizer 
                discoveredStatuses={discoveredStatuses}
                mappings={statusMappings}
                onChange={setStatusMappings}
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <button onClick={() => setStep(2)} className="px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors flex items-center">
                  <ChevronLeft className="mr-3 w-4 h-4" /> Voltar ao Mapeamento
                </button>
                <button onClick={() => setStep(4)} className="premium-button px-12 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center transition-all">
                  Auditoria de Dados <ChevronRight className="ml-3 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10">
              <MappingReview 
                mappings={mappings}
                perFileData={perFileData}
                type={type as string}
                customFieldLabels={customFieldLabels}
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <button onClick={() => setStep(isTransaction ? 3 : 2)} className="px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors flex items-center">
                  <ChevronLeft className="mr-3 w-4 h-4" /> Voltar
                </button>
                <button onClick={nextStep} className="premium-button px-12 py-5 rounded-2xl text-[11px] uppercase tracking-[0.25em] flex items-center transition-all">
                  Avançar para Tags Fixas <ChevronRight className="ml-3 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-10">
              <FixedValueInjector 
                files={files}
                unmappedTargets={Object.keys(require('@/lib/constants').FIELD_DESCRIPTIONS).filter(t => !Object.values(mappings).some(m => Object.values(m).includes(t)))}
                onChange={setFixedValues} 
                initialValues={fixedValues}
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                <button onClick={prevStep} className="px-8 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors flex items-center">
                  <ChevronLeft className="mr-3 w-4 h-4" /> Voltar
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

          {step === 6 && (
            <div className="space-y-10">
              <div className="flex flex-col items-center justify-center py-12 glass-card text-center space-y-6 bg-emerald-50/[0.05] border-emerald-200">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-600 blur-3xl opacity-10 animate-pulse" />
                  <div className="relative w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center border border-emerald-200 rotate-3 animate-in zoom-in-50 duration-700">
                    <CheckCircle2 className="w-12 h-12 text-emerald-700" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-4xl font-black tracking-tighter text-slate-900 uppercase">Pipeline Concluído</h2>
                  <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                    Processamos <span className="text-emerald-700 font-black">{result?.data?.length || 0}</span> registros com sucesso
                  </p>
                </div>
              </div>

              {/* DOWNLOAD CENTER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* FINAL DATA */}
                <div className="glass-card p-8 bg-white border-purple-200 shadow-xl shadow-purple-900/5 space-y-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <Download className="text-purple-700 w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Dados Consolidados</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Dataset final normalizado (CSV)</p>
                  </div>
                  <button 
                    onClick={() => downloadCsv(result.data, `consolidado_${type}.csv`)}
                    className="premium-button w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Baixar CSV
                  </button>
                </div>

                {/* MAPPING LOG */}
                <div className="glass-card p-8 bg-white border-slate-200 space-y-6 flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center">
                    <Layers className="text-slate-600 w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Log de Rastreabilidade</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Audit Trail de colunas (CSV)</p>
                  </div>
                  <button 
                    onClick={() => {
                      const logData = result.logs.map((l: any) => ({
                        "Arquivo": l.arquivo,
                        "Coluna Origem": l.origem,
                        "Destino Final": l.destino,
                        "Status": l.status
                      }));
                      downloadCsv(logData, `log_mapeamento_${type}.csv`);
                    }}
                    className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-200"
                  >
                    Baixar Relatório
                  </button>
                </div>

                {/* SURVEY DICTIONARY (OPTIONAL) */}
                {isSurvey && (
                  <div className="glass-card p-8 bg-purple-50 border-purple-200 space-y-6 flex flex-col items-center text-center">
                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-purple-100 shadow-sm">
                      <Sparkles className="text-purple-600 w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-purple-900">Dicionário de Pesquisa</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mapeamento de questões (CSV)</p>
                    </div>
                    <button 
                      onClick={() => {
                        const dictData = customFields.map(cf => ({
                          "Chave Técnica": cf.key,
                          "Pergunta / Label": cf.label
                        }));
                        downloadCsv(dictData, `dicionario_pesquisa.csv`);
                      }}
                      className="w-full py-4 bg-white hover:bg-purple-100 text-purple-800 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-purple-300 shadow-sm"
                    >
                      Baixar Dicionário
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-12 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 text-slate-500"
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
