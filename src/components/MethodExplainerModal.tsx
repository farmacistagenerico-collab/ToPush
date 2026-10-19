import React from 'react';
import { X, Check, EyeOff, ShieldCheck, Zap, HeartHandshake, Smile } from 'lucide-react';
import trafficLightSpheresImg from '../assets/images/traffic_light_spheres_1792400430317.jpg';

interface MethodExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MethodExplainerModal: React.FC<MethodExplainerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-0.5">
              Filosofia & Psicologia Operativa
            </span>
            <h2 className="text-xl font-bold tracking-tight">
              Il Metodo a Semaforo: Vendere Senza Pressione Numerica
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700">
          {/* Visual Concept Banner */}
          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-16/9 sm:aspect-21/9 max-h-48">
            <img
              src={trafficLightSpheresImg}
              alt="Indicatori cromatici a semaforo per il consiglio in farmacia"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-4">
              <p className="text-white font-medium text-xs sm:text-sm">
                4 stati visivi immediati: Rosso (massima spinta), Arancio (consiglio), Giallo (quasi al traguardo), Verde (raggiunto).
              </p>
            </div>
          </div>

          {/* Section: Il paradosso del farmacista dipendente */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-rose-600" />
              <span>Perché eliminare i numeri dal banco vendita?</span>
            </h3>
            <p className="leading-relaxed text-slate-600">
              Il farmacista collaboratore ha una formazione scientifica e sanitaria. Quando la direzione impone tabelle con numeri di pezzi, quote di fatturato o budget («dobbiamo vendere ancora 45 confezioni di fermenti entro venerdì»), il dipendente si sente trasformato in un venditore aggressivo e si attiva un naturale <strong>rifiuto psicologico</strong>.
            </p>
            <p className="leading-relaxed text-slate-600">
              FarmaCromia sostituisce fogli di calcolo e ansia da budget con <strong>segnali visivi a semaforo</strong>. Il farmacista vede solo il colore di priorità e il gancio di consiglio clinico.
            </p>
          </div>

          {/* 4 Colors Meaning Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* RED */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 space-y-1">
              <div className="flex items-center gap-2 font-bold text-rose-800">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-pulse" />
                <span>Rosso: Priorità Massima</span>
              </div>
              <p className="text-xs text-rose-950/80 leading-relaxed">
                Scorte critiche in magazzino, accordi ad alta marginalità o scadenze ravvicinate. Da proporre sistematicamente a ogni cliente compatibile.
              </p>
            </div>

            {/* ORANGE */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span>Arancio: In Consiglio Attivo</span>
              </div>
              <p className="text-xs text-amber-950/80 leading-relaxed">
                Rotazione ordinaria programmata. Prodotto solido da abbinare alle prescrizioni mediche o ai sintomi riferiti al banco.
              </p>
            </div>

            {/* YELLOW */}
            <div className="p-3.5 rounded-xl border border-yellow-200 bg-yellow-50/50 space-y-1">
              <div className="flex items-center gap-2 font-bold text-yellow-800">
                <span className="w-3 h-3 rounded-full bg-yellow-500" />
                <span>Giallo: Quasi al Traguardo</span>
              </div>
              <p className="text-xs text-yellow-950/80 leading-relaxed">
                Obiettivo quasi completato. Segnala allo staff che la giacenza è quasi rientrata e serve solo un ultimo sforzo collettivo.
              </p>
            </div>

            {/* GREEN */}
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-1">
              <div className="flex items-center gap-2 font-bold text-emerald-800">
                <span className="w-3 h-3 rounded-full bg-emerald-600" />
                <span>Verde: Obiettivo Raggiunto!</span>
              </div>
              <p className="text-xs text-emerald-950/80 leading-relaxed">
                Traguardo centrato! Lo staff può rilassare la spinta su quel prodotto e concentrarsi sui colori più caldi. Zero senso di colpa.
              </p>
            </div>
          </div>

          {/* How automation works */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <span>Come lavora il motore in background:</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Chi è di dovere carica la lista:</strong> Inserisce le scorte da smaltire e sceglie la cadenza (settimanale, bisettimanale, mensile).</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Transizione automatica:</strong> Ogni tap sul pulsante "Consigliato al Banco" scala internamente la giacenza. Quando la percentuale sale oltre le soglie (35%, 70%, 95%), il colore muta da solo.</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Sincronizzazione in tempo reale:</strong> Desktop al banco, tablet e smartphone in tasca al camice mostrano istantaneamente lo stesso stato.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Ho Capito, Torna al Banco
          </button>
        </div>
      </div>
    </div>
  );
};
