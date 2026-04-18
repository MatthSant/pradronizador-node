'use client';

import React, { useState } from 'react';
import { FIELD_DESCRIPTIONS } from '@/lib/constants';
import { Plus, X, Tag } from 'lucide-react';

interface FixedValueInjectorProps {
  unmappedTargets: string[];
  onChange: (values: Record<string, string>) => void;
}

export const FixedValueInjector: React.FC<FixedValueInjectorProps> = ({ unmappedTargets, onChange }) => {
  const [fixedValues, setFixedValues] = useState<Record<string, string>>({});

  const handleAdd = (target: string) => {
    const next = { ...fixedValues, [target]: '' };
    setFixedValues(next);
    onChange(next);
  };

  const handleRemove = (target: string) => {
    const next = { ...fixedValues };
    delete next[target];
    setFixedValues(next);
    onChange(next);
  };

  const handleValueChange = (target: string, value: string) => {
    const next = { ...fixedValues, [target]: value };
    setFixedValues(next);
    onChange(next);
  };

  const availableOptions = unmappedTargets.filter(t => !fixedValues[t]);

  return (
    <div className="glass-card p-6 border-indigo-500/30 bg-indigo-500/5">
      <div className="flex items-center space-x-2 mb-4">
        <Tag className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-bold">Injeção de Valores Estáticos</h3>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Force um valor idêntico para colunas do banco que não existem nos seus arquivos (ex: nome da campanha).
      </p>

      <div className="space-y-4">
        {Object.entries(fixedValues).map(([target, val]) => (
          <div key={target} className="flex items-center space-x-4 bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <div className="w-48 text-xs font-bold text-indigo-400 uppercase tracking-tighter truncate">
              {FIELD_DESCRIPTIONS[target]?.name || target}
            </div>
            <input 
              type="text"
              placeholder="Digite o valor fixo..."
              value={val}
              onChange={(e) => handleValueChange(target, e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none placeholder:text-slate-700"
            />
            <button 
              onClick={() => handleRemove(target)}
              className="p-1 text-slate-500 hover:text-red-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <div className="pt-2">
          <select 
            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm outline-none focus:border-indigo-500 transition-colors"
            onChange={(e) => e.target.value !== "" && handleAdd(e.target.value)}
            value=""
          >
            <option value="">+ Adicionar valor estático...</option>
            {availableOptions.map(opt => (
              <option key={opt} value={opt}>
                {FIELD_DESCRIPTIONS[opt]?.name || opt}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
