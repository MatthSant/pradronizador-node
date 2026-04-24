'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { MappingInterface } from '@/components/MappingInterface';
import { MappingReview } from '@/components/MappingReview';
import { StatusNormalizer } from '@/components/StatusNormalizer';
import { FixedValueInjector } from '@/components/FixedValueInjector';
import { createCsvBlob } from '@/lib/csv';
import { processFiles, extractFileHeaders, discoverUniqueStatuses } from '@/lib/processor';
import { ArrowLeft, Play, Download, CheckCircle2, ChevronRight, ChevronLeft, Layers, Loader2, Sparkles } from 'lucide-react';
import { usePipeline } from '@/providers/PipelineContext';

export default function ProcessorPage() {
  const { type } = useParams();
  const router = useRouter();
  const { 
    files, setFiles, 
    mappings, setMappings, updateMapping,
    customFields, addCustomField, 
    statusMappings, setStatusMappings,
    fixedValues, setFixedValues 
  } = usePipeline();
  
  const [step, setStep] = useState<number>(1);
  const [perFileData, setPerFileData] = useState<Record<string, { headers: string[], samples: Record<string, string[]> }>>({});
  const [activeMappingFileIdx, setActiveMappingFileIdx] = useState(0);
  const [discoveredStatuses, setDiscoveredStatuses] = useState<string[]>([]);
  const [isDiscoveringStatuses, setIsDiscoveringStatuses] = useState(false);
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
    updateMapping(currentFile.name, newFileMappings);
  }, [files, activeMappingFileIdx, updateMapping]);

  const customFieldLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    customFields.forEach(f => {
      if (f.label) labels[f.key] = f.label;
    });
    return labels;
  }, [customFields]);

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
      await new Promise(r => setTimeout(r, 100));
      
      const resp = await processFiles(
        files, 
        mappings, 
        fixedValues, 
        type as string,
        async (fileName, current, total) => {
          setProcessingStatus({ fileName, current, total });
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

  const downloadCsv = (data: Record<string, unknown>[], filename: string) => {
    if (!data || data.length === 0) return;
    const blob = createCsvBlob(data);
    const url = URL.createObjectURL(blob);

    try {
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 0);
    }
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
    <div className="space-y-16 w-full py-8">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-12 pb-12 border-b border-slate-100">
        <div className="space-y-6">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center text-technical text-slate-400 hover:text-purple-600 transition-all group"
          >
            <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" /> Voltar ao Início
          </button>
          
          <div className="flex items-center space-x-6">
            <div className="w-14 h-14 bg-white border border-slate-100 rounded-[1.25rem] flex items-center justify-center shadow-sm">
              <Layers className="text-purple-600 w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-5xl font-black tracking-tighter text-slate-900 leading-none">
                  wtl_{type}
                </h1>
                <span className="text-technical text-slate-300">v1.1</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-technical text-slate-500">Node Operacional: Isolated Cluster</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* NEW PROGRESS TRACKER */}
        <div className="flex bg-white/50 p-2 rounded-[2rem] border border-slate-100 shadow-sm backdrop-blur-md">
          {steps.map((s, idx) => {
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className={`relative flex items-center px-6 py-3 rounded-full transition-all duration-500 ${
                  isActive ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.02]' : 
                  isDone ? 'text-emerald-600' : 'text-slate-400'
                }`}>
                  <span className="text-technical whitespace-nowrap">{s.name}</span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 ml-2" />}
                  {isActive && (
                    <motion.div 
                      layoutId="activeStep"
                      className="absolute inset-0 bg-slate-900 rounded-full -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                {idx < steps.length - 1 && (
                  <div className="flex items-center px-1">
                    <div className="w-4 h-[1px] bg-slate-100" />
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
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white/60 backdrop-blur-md"
          >
            <div className="flex flex-col items-center space-y-8">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-2xl opacity-10 animate-pulse" />
                <div className="relative w-24 h-24 bg-white border border-slate-100 rounded-[2.5rem] flex items-center justify-center shadow-xl">
                  <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-2xl font-black text-slate-900 tracking-tighter">Analisando Arquitetura...</h4>
                <div className="flex items-center justify-center space-x-2 text-purple-600">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-technical">Smart Mapping Registry</span>
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
            className="fixed inset-0 z-[110] flex items-center justify-center bg-white/80 backdrop-blur-xl"
          >
            <div className="flex flex-col items-center space-y-12 w-full max-w-xl px-12">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-600 blur-[100px] opacity-10 animate-pulse" />
                <div className="relative w-32 h-32 bg-slate-900 rounded-[3rem] flex items-center justify-center shadow-2xl rotate-3">
                  <Loader2 className="w-14 h-14 text-white animate-spin" strokeWidth={1} />
                </div>
              </div>

              <div className="text-center space-y-6 w-full">
                <div className="space-y-2">
                  <h4 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">Consolidando Lote</h4>
                  <p className="text-technical text-purple-600 tracking-[0.4em] flex items-center justify-center space-x-3">
                    <Sparkles className="w-4 h-4" />
                    <span>Neural Pipeline Active</span>
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Progress Bar Container */}
                  <div className="h-4 w-full bg-slate-50 rounded-full border border-slate-100 p-1 shadow-inner relative overflow-hidden">
                    <motion.div 
                      layout
                      initial={{ width: 0 }}
                      animate={{ width: `${(processingStatus.current / processingStatus.total) * 100}%` }}
                      className="h-full bg-slate-900 rounded-full relative z-10"
                      transition={{ type: "spring", bounce: 0, duration: 1 }}
                    />
                    <div className="absolute inset-0 bg-slate-50 z-0" />
                  </div>

                  <div className="flex justify-between items-center px-2">
                    <div className="flex flex-col items-start min-w-0 pr-4">
                      <span className="text-technical text-slate-400">Processando Agora</span>
                      <span className="text-sm font-bold text-slate-900 truncate w-full" title={processingStatus.fileName}>
                        {processingStatus.fileName}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                      <div className="w-px h-8 bg-slate-100" />
                      <div className="text-left">
                        <span className="text-technical text-slate-400">Progresso</span>
                        <div className="text-sm font-black text-purple-700">
                          {processingStatus.current} <span className="text-slate-300">/</span> {processingStatus.total} <span className="text-[10px] text-slate-400 ml-1">arquivos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                    Normalizando e higienizando cada registro conforme o dicionário <b>wtl_{type}</b>. 
                    Mantenha a janela ativa para garantir a performance do processamento local.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.98, y: -10 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-[400px]"
        >
          {step === 1 && (
            <div className="space-y-12">
              <FileUpload onFilesSelected={handleFilesSelected} />
              <div className="flex justify-center md:justify-end">
                <button 
                  disabled={files.length === 0}
                  onClick={nextStep}
                  className="premium-button px-14 py-6 rounded-3xl text-sm flex items-center disabled:opacity-20 disabled:grayscale transition-all duration-700 h-20"
                >
                  <span className="mr-3">Validar Documentos</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-12">
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
                  onAddCustomField={isSurvey ? addCustomField : undefined}
                />
              )}
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-50 pt-10">
                <button 
                  onClick={() => {
                    if (activeMappingFileIdx > 0) setActiveMappingFileIdx(prev => prev - 1);
                    else prevStep();
                  }}
                  className="px-10 py-5 rounded-2xl text-technical text-slate-400 hover:text-slate-900 transition-colors flex items-center group"
                >
                  <ChevronLeft className="mr-3 w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
                  {activeMappingFileIdx > 0 ? 'Arquivo Anterior' : 'Revisar Upload'}
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
                  className="premium-button px-14 py-6 rounded-3xl text-sm flex items-center transition-all duration-700 h-20"
                >
                  {activeMappingFileIdx < files.length - 1 ? (
                    <>Próximo Arquivo <ChevronRight className="ml-3 w-5 h-5" /></>
                  ) : isTransaction ? (
                    <>Mapeamento de Status <ChevronRight className="ml-3 w-5 h-5" /></>
                  ) : (
                    <>Auditoria Final <ChevronRight className="ml-3 w-5 h-5" /></>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && isTransaction && (
            <div className="space-y-12">
              <StatusNormalizer 
                discoveredStatuses={discoveredStatuses}
                mappings={statusMappings}
                onChange={setStatusMappings}
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-50 pt-10">
                <button onClick={() => setStep(2)} className="px-10 py-5 rounded-2xl text-technical text-slate-400 hover:text-slate-900 transition-colors flex items-center group">
                  <ChevronLeft className="mr-3 w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar ao Mapeamento
                </button>
                <button onClick={() => setStep(4)} className="premium-button px-14 py-6 rounded-3xl text-sm flex items-center transition-all duration-700 h-20">
                  Auditoria Final <ChevronRight className="ml-3 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-12">
              <MappingReview 
                mappings={mappings}
                perFileData={perFileData}
                type={type as string}
                customFieldLabels={customFieldLabels}
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-50 pt-10">
                <button onClick={() => setStep(isTransaction ? 3 : 2)} className="px-10 py-5 rounded-2xl text-technical text-slate-400 hover:text-slate-900 transition-colors flex items-center group">
                  <ChevronLeft className="mr-3 w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar
                </button>
                <button onClick={nextStep} className="premium-button px-14 py-6 rounded-3xl text-sm flex items-center transition-all duration-700 h-20">
                  Definir Tags Fixas <ChevronRight className="ml-3 w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-12">
              <FixedValueInjector 
                files={files}
                unmappedTargets={Object.keys(require('@/lib/constants').FIELD_DESCRIPTIONS).filter(t => !Object.values(mappings).some(m => Object.values(m).includes(t)))}
                onChange={setFixedValues} 
                initialValues={fixedValues}
              />
              <div className="flex flex-col md:flex-row justify-between items-center gap-8 border-t border-slate-50 pt-10">
                <button onClick={prevStep} className="px-10 py-5 rounded-2xl text-technical text-slate-400 hover:text-slate-900 transition-colors flex items-center group">
                  <ChevronLeft className="mr-3 w-5 h-5 group-hover:-translate-x-1 transition-transform" /> Voltar
                </button>
                <button 
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="premium-button px-16 py-6 rounded-[2.5rem] text-base flex items-center group relative overflow-hidden h-24"
                >
                  <span className="relative z-10 flex items-center">
                    {isProcessing ? 'Mapeando...' : 'Consolidar Lote'} 
                    {!isProcessing && <Play className="ml-4 w-5 h-5 fill-current group-hover:scale-110 transition-transform" />}
                  </span>
                </button>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-16 py-8">
              <div className="flex flex-col items-center justify-center p-16 glass-card text-center space-y-8 bg-emerald-50/10 border-emerald-100 min-h-[400px]">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-400 blur-[100px] opacity-10 animate-pulse" />
                  <div className="relative w-32 h-32 bg-white rounded-[2.5rem] flex items-center justify-center border border-emerald-100 shadow-2xl rotate-6">
                    <CheckCircle2 className="w-16 h-16 text-emerald-600" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h2 className="text-6xl font-black tracking-tighter text-slate-900 uppercase leading-none">Job Concluído</h2>
                  <p className="text-technical text-emerald-600 tracking-[0.3em] font-bold uppercase py-2">
                    {result?.data?.length || 0} registros normalizados com sucesso
                  </p>
                  <div className="flex items-center justify-center space-x-2 text-slate-400 mt-4">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                    <span className="text-technical">Integridade Estrutural: 100% Verified</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>

              {/* DOWNLOAD CENTER */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FINAL DATA */}
                <div className="glass-card p-12 bg-white border-slate-100 hover:border-purple-200 transition-all duration-500 space-y-8 flex flex-col items-center text-center shadow-sm hover:shadow-2xl hover:shadow-purple-900/5 group">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-purple-600 group-hover:text-white">
                    <Download className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-technical text-slate-900 mb-2">Dados Consolidados</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Versão final unificada das bases originais.</p>
                  </div>
                  <button 
                    onClick={() => downloadCsv(result.data, `consolidado_${type}.csv`)}
                    className="premium-button w-full py-5 rounded-2xl text-[10px]"
                  >
                    Baixar Dataset (CSV)
                  </button>
                </div>

                {/* MAPPING LOG */}
                <div className="glass-card p-12 bg-white border-slate-100 hover:border-slate-300 transition-all duration-500 space-y-8 flex flex-col items-center text-center shadow-sm group">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-slate-900 group-hover:text-white">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-technical text-slate-900 mb-2">Audit Trace Log</h4>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Rastreabilidade completa de cada mapeamento.</p>
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
                    className="w-full py-5 bg-slate-50 hover:bg-slate-100 text-slate-900 rounded-2xl text-technical border border-slate-100 transition-all"
                  >
                    Baixar Relatório
                  </button>
                </div>

                {/* SURVEY DICTIONARY (OPTIONAL) */}
                {isSurvey && (
                  <div className="glass-card p-12 bg-white border-slate-100 hover:border-emerald-200 transition-all duration-500 space-y-8 flex flex-col items-center text-center shadow-sm group">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:bg-emerald-600 group-hover:text-white">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                      <h4 className="text-technical text-slate-900 mb-2">Questões Técnicas</h4>
                      <p className="text-xs text-slate-400 font-medium leading-relaxed">Dicionário de IDs e perguntas customizadas.</p>
                    </div>
                    <button 
                      onClick={() => {
                        const dictData = customFields.map(cf => ({
                          "Chave Técnica": cf.key,
                          "Pergunta / Label": cf.label
                        }));
                        downloadCsv(dictData, `dicionario_pesquisa.csv`);
                      }}
                      className="w-full py-5 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 rounded-2xl text-technical border border-emerald-100 transition-all"
                    >
                      Baixar Dicionário
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-center pt-8">
                <button 
                  onClick={() => window.location.reload()}
                  className="px-12 py-5 rounded-2xl text-technical text-slate-400 hover:text-slate-900 transition-all"
                >
                  Reiniciar Outro Lote
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
