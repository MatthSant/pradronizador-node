'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUpload } from '@/components/FileUpload';
import { MappingInterface } from '@/components/MappingInterface';
import { processFiles } from '@/lib/processor';
import { ArrowLeft, Play, Download, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function ProcessorPage() {
  const { type } = useParams();
  const router = useRouter();
  
  const [step, setStep] = useState<'upload' | 'mapping' | 'result'>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const sourceColumns = useMemo(() => {
    // In a real app, we'd extract this from the first file sample.
    // For now, we'll assume the files are ready to be passed to the MappingInterface.
    // This is a simplification for the reconstruction.
    return files.length > 0 ? ['Email', 'Nome', 'Telefone', 'Data', 'Status'] : [];
  }, [files]);

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const resp = await processFiles(files, mappings, {}, type as string);
      setResult(resp);
      setStep('result');
    } catch (err) {
      alert('Erro ao processar arquivos.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    const ws = XLSX.utils.json_to_sheet(result.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultado");
    XLSX.writeFile(wb, `consolidado_${type}.xlsx`);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <button 
        onClick={() => router.push('/')}
        className="flex items-center text-slate-400 hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Dashboard
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold capitalize">Pipeline: wtl_{type}</h1>
          <p className="text-slate-400 mt-2">Siga os passos abaixo para normalizar seus arquivos.</p>
        </div>
        
        <div className="flex bg-slate-800/50 p-1 rounded-lg border border-slate-700">
          <div className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${step === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>1. Upload</div>
          <div className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${step === 'mapping' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>2. Mapeamento</div>
          <div className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase ${step === 'result' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>3. Resultado</div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div 
            key="upload"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <FileUpload onFilesSelected={setFiles} />
            <div className="flex justify-end">
              <button 
                disabled={files.length === 0}
                onClick={() => setStep('mapping')}
                className="premium-button px-8 py-3 rounded-xl font-bold flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo Passo <ChevronRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'mapping' && (
          <motion.div 
            key="mapping"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <MappingInterface 
              sourceColumns={sourceColumns} 
              onMappingChange={setMappings} 
            />
            <div className="flex justify-between">
              <button 
                onClick={() => setStep('upload')}
                className="px-8 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Voltar
              </button>
              <button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="premium-button px-8 py-3 rounded-xl font-bold flex items-center"
              >
                {isProcessing ? 'Processando...' : 'Processar Agora'} <Play className="ml-2 w-5 h-5 fill-current" />
              </button>
            </div>
          </motion.div>
        )}

        {step === 'result' && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center p-12 glass-card text-center space-y-6"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <h2 className="text-3xl font-bold">Processamento Concluído!</h2>
            <p className="text-slate-400">Consolidamos {result?.data?.length || 0} linhas de dados estruturados com sucesso.</p>
            
            <div className="flex space-x-4 pt-6">
              <button 
                onClick={downloadResult}
                className="premium-button px-8 py-3 rounded-xl font-bold flex items-center"
              >
                Baixar Resultado (.xlsx) <Download className="ml-2 w-5 h-5" />
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-3 rounded-xl font-bold bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                Novo Processamento
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return <path className={className} d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
}
