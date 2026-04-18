'use client';

import React, { useState, useEffect } from 'react';
import { FIELD_DESCRIPTIONS, HARD_MAPPINGS, UNIVERSAL_PRESETS, PLATFORM_PRESETS } from '@/lib/constants';
import { normalizeString } from '@/lib/normalization';
import { Check, AlertCircle, ChevronRight, Globe, FileStack } from 'lucide-react';

interface MappingInterfaceProps {
  sourceColumns: string[];
  type: string;
  customFieldLabels?: Record<string, string>;
  onMappingChange: (mapping: Record<string, string>) => void;
}

export const MappingInterface: React.FC<MappingInterfaceProps> = ({ 
  sourceColumns, 
  type, 
  customFieldLabels = {}, 
  onMappingChange 
}) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [unifiedMode, setUnifiedMode] = useState(true);
  
  const targetOptions = [
    { id: '__NONE__', name: '(Não Mapear)' },
    { id: '__SKIP__', name: '(Pular Campo)' },
    ...Object.entries(FIELD_DESCRIPTIONS).map(([id, meta]) => ({
      id,
      name: `${meta.name} (${id})`
    })),
    ...Object.entries(customFieldLabels).map(([id, label]) => ({
      id,
      name: `🟡 ${label} (${id})`
    }))
  ];

  useEffect(() => {
    const initialMappings: Record<string, string> = {};
    const platformPreset = PLATFORM_PRESETS[type] || {};
    
    sourceColumns.forEach(col => {
      const norm = normalizeString(col);
      
      // Order of precedence: Platform Preset -> Hard Mapping -> Universal Preset -> Fuzzy
      if (platformPreset[norm]) {
        initialMappings[col] = platformPreset[norm];
      } else if (HARD_MAPPINGS[col]) {
        initialMappings[col] = HARD_MAPPINGS[col];
      } else if (UNIVERSAL_PRESETS[norm]) {
        initialMappings[col] = UNIVERSAL_PRESETS[norm];
      } else {
        const found = Object.keys(FIELD_DESCRIPTIONS).find(target => 
          normalizeString(target) === norm || 
          normalizeString(FIELD_DESCRIPTIONS[target].name) === norm
        );
        if (found) initialMappings[col] = found;
        else initialMappings[col] = '__NONE__';
      }
    });

    setMappings(initialMappings);
  }, [sourceColumns, type]);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const handleSelect = (source: string, target: string) => {
    setMappings(prev => ({ ...prev, [source]: target }));
  };

  return (
    <div className="glass-card shadow-xl overflow-hidden border-slate-700 bg-slate-900/50">
      <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold">🎯 Mapeamento Inteligente</h3>
          <p className="text-xs text-slate-400 mt-0.5">Mapeie as origens do seu arquivo para os campos do banco de dados.</p>
        </div>
        
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button 
            onClick={() => setUnifiedMode(true)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${unifiedMode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Globe className="w-3.5 h-3.5" /> <span>Unificado</span>
          </button>
          <button 
            onClick={() => setUnifiedMode(false)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${!unifiedMode ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <FileStack className="w-3.5 h-3.5" /> <span>Por Arquivo</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {sourceColumns.map(col => (
          <div key={col} className="flex items-center space-x-4 p-4 bg-slate-800/20 rounded-xl hover:bg-slate-800/40 transition-all border border-transparent hover:border-slate-700/50">
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 block">Origem</span>
              <p className="text-sm font-bold truncate" title={col}>{col}</p>
            </div>
            
            <div className="flex-shrink-0">
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </div>
            
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 block">Destino</span>
              <select 
                value={mappings[col] || '__NONE__'}
                onChange={(e) => handleSelect(col, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs font-medium px-2.5 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none cursor-pointer"
              >
                {targetOptions.map(opt => (
                  <option key={opt.id} value={opt.id} className="bg-slate-900 border-none">{opt.name}</option>
                ))}
              </select>
            </div>

            <div className="w-8 flex justify-center">
              {mappings[col] !== '__NONE__' && mappings[col] !== '__SKIP__' ? (
                <div className="p-1 bg-emerald-500/10 rounded-full">
                  <Check className="w-5 h-5 text-emerald-500" />
                </div>
              ) : (
                <div className="p-1 bg-slate-500/5 rounded-full">
                  <AlertCircle className="w-5 h-5 text-slate-700" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
