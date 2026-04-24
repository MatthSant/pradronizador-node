'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface CustomField {
  key: string;
  label: string;
}

interface PipelineContextType {
  files: File[];
  mappings: Record<string, Record<string, string>>;
  customFields: CustomField[];
  statusMappings: Record<string, string>;
  fixedValues: Record<string, Record<string, string>>;
  
  setFiles: (files: File[]) => void;
  updateMapping: (fileKey: string, fileMappings: Record<string, string>) => void;
  setMappings: (mappings: Record<string, Record<string, string>>) => void;
  addCustomField: (label: string) => string;
  updateCustomField: (key: string, newLabel: string) => void;
  removeCustomField: (key: string) => void;
  setStatusMappings: (mappings: Record<string, string>) => void;
  setFixedValues: (values: Record<string, Record<string, string>>) => void;
  
  resetSession: () => void;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

export const PipelineProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [mappings, setMappings] = useState<Record<string, Record<string, string>>>({});
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [statusMappings, setStatusMappings] = useState<Record<string, string>>({});
  const [fixedValues, setFixedValues] = useState<Record<string, Record<string, string>>>({});

  const updateMapping = useCallback((fileKey: string, fileMappings: Record<string, string>) => {
    setMappings(prev => ({
      ...prev,
      [fileKey]: fileMappings
    }));
  }, []);

  const addCustomField = useCallback((label: string) => {
    const nextIdx = customFields.length + 1;
    const newKey = `custom_field_${nextIdx}`;
    setCustomFields(prev => [...prev, { key: newKey, label }]);
    return newKey;
  }, [customFields.length]);

  const updateCustomField = useCallback((key: string, newLabel: string) => {
    setCustomFields(prev => prev.map(f => f.key === key ? { ...f, label: newLabel } : f));
  }, []);

  const removeCustomField = useCallback((key: string) => {
    setCustomFields(prev => prev.filter(f => f.key !== key));
    // Optional: Clean up mappings that use this key? 
  }, []);

  const resetSession = useCallback(() => {
    setFiles([]);
    setMappings({});
    setCustomFields([]);
    setStatusMappings({});
    setFixedValues({});
    router.push('/');
  }, [router]);

  return (
    <PipelineContext.Provider value={{
      files,
      mappings,
      customFields,
      statusMappings,
      fixedValues,
      setFiles,
      updateMapping,
      setMappings,
      addCustomField,
      updateCustomField,
      removeCustomField,
      setStatusMappings,
      setFixedValues,
      resetSession,
    }}>
      {children}
    </PipelineContext.Provider>
  );
};

export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
};
