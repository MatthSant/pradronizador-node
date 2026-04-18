'use client';

import React, { useState, useEffect } from 'react';
import { FIELD_DESCRIPTIONS, HARD_MAPPINGS, UNIVERSAL_PRESETS } from '@/lib/constants';
import { normalizeString } from '@/lib/normalization';
import { Check, AlertCircle, ChevronRight } from 'lucide-react';

interface MappingInterfaceProps {
  sourceColumns: string[];
  onMappingChange: (mapping: Record<string, string>) => void;
}

export const MappingInterface: React.FC<MappingInterfaceProps> = ({ sourceColumns, onMappingChange }) => {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  const targetOptions = [
    { id: '__NONE__', name: '(Não Mapear)' },
    ...Object.entries(FIELD_DESCRIPTIONS).map(([id, meta]) => ({
      id,
      name: `${meta.name} (${id})`
    }))
  ];

  // Auto-mapping logic
  useEffect(() => {
    const initialMappings: Record<string, string> = {};
    
    sourceColumns.forEach(col => {
      const norm = normalizeString(col);
      
      // 1. Hard Mappings
      if (HARD_MAPPINGS[col]) {
        initialMappings[col] = HARD_MAPPINGS[col];
      }
      // 2. Universal Presets
      else if (UNIVERSAL_PRESETS[norm]) {
        initialMappings[initialMappings[col]] = UNIVERSAL_PRESETS[norm];
      }
      // 3. Fuzzy match (exact normalized string match)
      else {
        const found = Object.keys(FIELD_DESCRIPTIONS).find(target => 
          normalizeString(target) === norm || 
          normalizeString(FIELD_DESCRIPTIONS[target].name) === norm
        );
        if (found) initialMappings[col] = found;
        else initialMappings[col] = '__NONE__';
      }
    });

    setMappings(initialMappings);
  }, [sourceColumns]);

  useEffect(() => {
    onMappingChange(mappings);
  }, [mappings, onMappingChange]);

  const handleSelect = (source: string, target: string) => {
    setMappings(prev => ({ ...prev, [source]: target }));
  };

  return (
    <div className="glass-card overflow-hidden border-slate-700 bg-slate-900/50">
      <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-700">
        <h3 className="text-lg font-semibold">Mapeamento de Colunas</h3>
        <p className="text-sm text-slate-400">Combine as colunas do seu arquivo com os campos do banco.</p>
      </div>

      <div className="p-4 space-y-3">
        {sourceColumns.map(col => (
          <div key={col} className="flex items-center space-x-4 p-3 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-700">
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Origem (De)</span>
              <p className="text-sm font-medium">{col}</p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-slate-600" />
            
            <div className="flex-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Destino (Para)</span>
              <select 
                value={mappings[col] || '__NONE__'}
                onChange={(e) => handleSelect(col, e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md text-sm px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {targetOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            </div>

            <div className="w-8 flex justify-center">
              {mappings[col] !== '__NONE__' ? (
                <Check className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-slate-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
