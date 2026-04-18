'use client';

import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
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
    <div className="space-y-10">
      <div 
        {...getRootProps()} 
        className={`relative p-16 transition-all duration-700 cursor-pointer group rounded-[3rem] border-2 border-dashed ${
          isDragActive 
            ? 'border-purple-600 bg-purple-50/50 scale-[1.01]' 
            : 'border-slate-100 bg-white hover:border-purple-200 hover:bg-slate-50/30'
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center transition-all duration-700 shadow-sm ${
              isDragActive 
                ? 'bg-purple-600 text-white rotate-12 scale-110 shadow-purple-500/20' 
                : 'bg-white border border-slate-100 text-slate-400 group-hover:text-purple-600 group-hover:bg-purple-50 group-hover:-rotate-6'
            }`}>
              {isDragActive ? <CheckCircle className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic">
              {isDragActive ? 'Solte para Ingerir' : 'Ingestão de Artefatos'}
            </h3>
            <p className="text-technical text-slate-500 mt-2">
              Formatos aceitos: CSV, XLSX de até 50MB
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
                className="flex items-center p-5 glass-card border-slate-100/50 bg-white group hover:border-purple-300 transition-colors"
              >
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mr-5 group-hover:bg-purple-50 transition-colors">
                  <FileText className="text-slate-400 group-hover:text-purple-600 w-5 h-5 transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-technical text-slate-900 truncate tracking-tight">{file.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5 tracking-widest">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                  className="p-2.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-xl transition-all"
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
