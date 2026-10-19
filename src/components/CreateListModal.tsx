import React, { useState } from 'react';
import { X, Plus, Sparkles, Calendar, Layers, Check, ArrowRight } from 'lucide-react';
import { CustomList } from '../types';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (data: {
    name: string;
    description: string;
    periodType: CustomList['periodType'];
    startDate: string;
    endDate: string;
    makeActive: boolean;
    template: 'empty' | 'autunno' | 'antibiotici';
  }) => Promise<void>;
}

export const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onCreateList,
}) => {
  const [name, setName] = useState('Consiglio Autunno/Inverno');
  const [description, setDescription] = useState(
    'Focus su prevenzione, difese immunitarie, integratori per stanchezza e fermenti per terapie antibiotiche.'
  );
  const [periodType, setPeriodType] = useState<CustomList['periodType']>('seasonal');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [template, setTemplate] = useState<'empty' | 'autunno' | 'antibiotici'>('autunno');
  const [makeActive, setMakeActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCreateList({
        name: name.trim(),
        description: description.trim(),
        periodType,
        startDate,
        endDate,
        makeActive,
        template,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const nameSuggestions = [
    'Consiglio Autunno/Inverno',
    'Focus Antibiotici & Terapie Gastro',
    'Settimana Prevenzione & Difese',
    'Rotazione Magazzino Novembre',
    'Consiglio Bambini & Rientro Scuola',
    'Dermocosmesi & Protezione Inverno',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-0.5">
              Punto di Partenza
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Crea una Nuova Lista del Banco
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs sm:text-sm">
          {/* List Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Nome della Lista *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Es. Consiglio Autunno/Inverno"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
            />
            {/* Suggestion Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-400">Suggeriti:</span>
              {nameSuggestions.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setName(sug)}
                  className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Descrizione & Obiettivo per lo Staff
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Spiega allo staff su cosa si concentra questa lista..."
              className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
            />
          </div>

          {/* Period type and dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Cadenza Obiettivo
              </label>
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="weekly">Settimanale (7 gg)</option>
                <option value="biweekly">Bisettimanale (14 gg)</option>
                <option value="monthly">Mensile (30 gg)</option>
                <option value="seasonal">Stagionale (3-4 mesi)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Data Inizio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Data Fine
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Template Choice */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Punto di partenza dei prodotti
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTemplate('autunno')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  template === 'autunno'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">Autunno/Inverno</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Pre-carica 7 prodotti chiave (difese, fermenti, spray)
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('antibiotici')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  template === 'antibiotici'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">Focus Antibiotici</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Probiotici 20 Mld e protettori gastro
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTemplate('empty')}
                className={`p-3 rounded-lg border text-left transition-all ${
                  template === 'empty'
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">Lista Vuota</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Parti da zero per inserire i tuoi lotti
                </div>
              </button>
            </div>
          </div>

          {/* Make Active Checkbox */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={makeActive}
                onChange={(e) => setMakeActive(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-medium">
                Imposta subito come lista attiva per il banco vendita (sincronizza all'istante schermi e smartphone dello staff)
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-bold rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creazione in corso...' : 'Crea Lista e Salva'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
