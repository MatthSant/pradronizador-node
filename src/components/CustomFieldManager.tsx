'use client';

import React from 'react';
import { Plus, Trash2, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CustomField {
  key: string;
  label: string;
}

interface CustomFieldManagerProps {
  fields: CustomField[];
  onChange: (fields: CustomField[]) => void;
}

export const CustomFieldManager: React.FC<CustomFieldManagerProps> = ({ fields, onChange }) => {
  const addField = () => {
    const nextIdx = fields.length + 1;
    let nextKey = `custom_field_${nextIdx}`;
    // Check for collisions
    while (fields.some(f => f.key === nextKey)) {
      nextKey = `custom_field_${Math.floor(Math.random() * 1000)}`;
    }
    onChange([...fields, { key: nextKey, label: '' }]);
  };

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  const updateLabel = (idx: number, label: string) => {
    const newFields = [...fields];
    newFields[idx].label = label;
    onChange(newFields);
  };

  return (
    <div className="glass-card p-6 border-amber-500/30 bg-amber-500/5">
      <div className="flex items-center space-x-2 mb-4">
        <HelpCircle className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-bold">Dicionário de Campos Customizados</h3>
      </div>
      <p className="text-sm text-slate-400 mb-6">
        Defina o significado das colunas extras da sua pesquisa. O nome que você der aqui aparecerá no mapeamento abaixo.
      </p>

      <div className="space-y-3">
        <AnimatePresence>
          {fields.map((field, idx) => (
            <motion.div 
              key={field.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex items-center space-x-4 bg-slate-900/60 p-3 rounded-lg border border-slate-700"
            >
              <code className="text-xs font-mono text-amber-500 w-24">{field.key}</code>
              <input 
                type="text"
                placeholder="Ex: Qual o seu maior sonho?"
                value={field.label}
                onChange={(e) => updateLabel(idx, e.target.value)}
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm outline-none placeholder:text-slate-600"
              />
              <button 
                onClick={() => removeField(idx)}
                className="p-1.5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-md transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        <button 
          onClick={addField}
          className="w-full py-3 border-2 border-dashed border-slate-700 hover:border-amber-500/50 rounded-xl text-slate-500 hover:text-amber-500 transition-all flex items-center justify-center text-sm font-semibold"
        >
          <Plus className="w-4 h-4 mr-2" /> Adicionar Novo Campo Customizado
        </button>
      </div>
    </div>
  );
};
