'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected }) => {
  const [files, setFiles] = useState<File[]>([]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    onDrop: (acceptedFiles) => {
      const newFiles = [...files, ...acceptedFiles];
      setFiles(newFiles);
      onFilesSelected(newFiles);
    }
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`relative glass-card border-2 border-dashed p-12 transition-all duration-500 cursor-pointer group ${
          isDragActive 
            ? 'border-purple-600 bg-purple-100 scale-[1.01]' 
            : 'border-slate-200 hover:border-purple-300 bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-600 blur-2xl opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${
              isDragActive ? 'bg-purple-700 text-white rotate-12 scale-110' : 'bg-slate-100 text-slate-500 group-hover:text-purple-700 hover:bg-purple-50'
            }`}>
              <Upload className="w-8 h-8" />
            </div>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-black tracking-tight text-slate-900">
              {isDragActive ? 'Solte para Iniciar' : 'Arraste seus Artefatos de Dados'}
            </p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Suporta CSV, XLSX e XLS de até 50MB
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid md:grid-cols-2 gap-4"
          >
            {files.map((file, idx) => (
              <motion.div 
                key={`${file.name}-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center p-4 glass-card border-slate-200 bg-white group hover:border-purple-400"
              >
                <div className="w-10 h-10 bg-purple-100 border border-purple-200 rounded-xl flex items-center justify-center mr-4">
                  <FileText className="text-purple-700 w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate text-slate-900 uppercase tracking-tight">{file.name}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
