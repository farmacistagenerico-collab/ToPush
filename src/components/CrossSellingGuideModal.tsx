import React, { useState } from 'react';
import { X, Search, CheckCircle2, ArrowRight, ShieldCheck, HeartHandshake } from 'lucide-react';

interface CrossSellingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CrossSellPair {
  customerTrigger: string;
  category: string;
  recommendedCompanion: string;
  clinicalRationale: string;
  counterPhrase: string;
}

const CROSS_SELL_DATA: CrossSellPair[] = [
  {
    customerTrigger: 'Antibiotico (Amoxicillina, Ciprofloxacina, Macrolidi, ecc.)',
    category: 'Prescrizione Medica',
    recommendedCompanion: 'Probiotici / Fermenti tindalizzati ad alta concentrazione con Vitamine B',
    clinicalRationale: 'L’antibiotico distrugge la flora batterica fisiologica (disbiosi), esponendo a diarrea, coliti e candidosi.',
    counterPhrase: '«Dottore le ha prescritto l’antibiotico: per evitare disturbi intestinali e debolezza, le consiglio di iniziare subito questo probiotico a distanza di 3 ore dall’antibiotico.»',
  },
  {
    customerTrigger: 'Antinfiammatorio FANS (Ibuprofene, Ketoprofene, Diclofenac)',
    category: 'Dolore & Infiammazione',
    recommendedCompanion: 'Gastroprotettore naturale a base di mucillagini o Magnesio/Fasce autoriscaldanti',
    clinicalRationale: 'I FANS inibiscono le prostaglandine protettive della mucosa gastrica. Per il dolore muscolare, il calore locale riduce la contrattura senza sovraccaricare il fegato.',
    counterPhrase: '«Se lo assume per qualche giorno, le consiglio di proteggere lo stomaco con questo sciroppo barriera naturale per evitare acidità.»',
  },
  {
    customerTrigger: 'Corticosteroidi topici (Creme cortisoniche per eczema/dermatite)',
    category: 'Dermatologia',
    recommendedCompanion: 'Crema liporestitutiva alle Ceramidi o detergente ultra-delicato oleoso',
    clinicalRationale: 'Il cortisone spegne l’infiammazione acuta ma assottiglia la cute. Le ceramidi riparano stabilmente la barriera cutanea prevenendo recidive.',
    counterPhrase: '«Applichi il cortisone solo la sera per pochi giorni, e durante il giorno idrati costantemente con questa crema alle ceramidi per riparare a fondo la barriera protettiva.»',
  },
  {
    customerTrigger: 'Farmaco per la pressione / Diuretico (Idroclorotiazide, Furosemide)',
    category: 'Cardiovascolare',
    recommendedCompanion: 'Integratore di Magnesio e Potassio chelato',
    clinicalRationale: 'I diuretici aumentano la clearance renale di ioni potassio e magnesio, provocando debolezza muscolare, astenia e crampi notturni.',
    counterPhrase: '«Con il caldo o con questo diuretico si perdono molti sali minerali: sente stanchezza o crampi? Questa bustina di magnesio e potassio riequilibra le scorte.»',
  },
  {
    customerTrigger: 'Decongestionante nasale spray / Sintomatico raffreddore',
    category: 'Vie Respiratorie',
    recommendedCompanion: 'Spray nasale a base di acqua marina ipertonica / Vitamina C + Zinco',
    clinicalRationale: 'I decongestionanti vasocostrittori non vanno usati per più di 5 giorni (rischio rinite medicamentosa). L’ipertonica drena per osmosi in sicurezza.',
    counterPhrase: '«Usi questo spray solo la sera per respirare, mentre durante il giorno lavi bene con acqua di mare ipertonica per sfiammare senza assuefazione.»',
  },
  {
    customerTrigger: 'Collirio decongestionante (Tetrizolina, Naftazolina)',
    category: 'Oculistica',
    recommendedCompanion: 'Gocce oculari idratanti con Acido Ialuronico senza conservanti',
    clinicalRationale: 'I colliri sbiancanti vasocostrittori causano effetto rimbalzo e secchezza corneale cronica. Le lacrime artificiali riparano il film lacrimale.',
    counterPhrase: '«Questo collirio toglie subito il rosso, ma per non seccare la cornea le consiglio di alternarlo con gocce di acido ialuronico puro.»',
  },
  {
    customerTrigger: 'Statina per colesterolo (Atorvastatina, Simvastatina)',
    category: 'Metabolico',
    recommendedCompanion: 'Coenzima Q10 (Ubichinone) 100mg',
    clinicalRationale: 'Le statine bloccano la via del mevalonato, riducendo la sintesi endogena sia del colesterolo che del CoQ10, causando mialgie e stanchezza muscolare.',
    counterPhrase: '«Chi assume statine sperimenta spesso indolenzimento alle gambe. Il Coenzima Q10 reintegra l’energia cellulare persa.»',
  },
];

export const CrossSellingGuideModal: React.FC<CrossSellingGuideModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const filtered = CROSS_SELL_DATA.filter((item) => {
    const q = searchTerm.toLowerCase();
    return (
      item.customerTrigger.toLowerCase().includes(q) ||
      item.recommendedCompanion.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.clinicalRationale.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-0.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Prontuario Clinico per il Banco</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              Associazioni di Consiglio & Cross-Selling Etico
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per farmaco prescritto (es. antibiotico, cortisone, diuretico, FANS)..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            {filtered.length} abbinamenti
          </span>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Il consiglio in farmacia non è "vendere qualcosa in più", ma <strong>prevenire gli effetti collaterali</strong> o <strong>velocizzare la guarigione</strong> del paziente.
            </span>
          </p>

          <div className="space-y-4">
            {filtered.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-50 rounded-xl border border-slate-200/90 p-4 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-xs font-bold text-slate-900">
                      Quando chiedono: {item.customerTrigger}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Cosa proporre in abbinamento:
                    </span>
                    <p className="text-slate-900 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                      {item.recommendedCompanion}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-semibold text-slate-700">
                      Motivazione clinica per il farmacista:
                    </span>
                    <p className="text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                      {item.clinicalRationale}
                    </p>
                  </div>
                </div>

                {/* Phrase to say at the counter */}
                <div className="bg-amber-50/70 border border-amber-200/70 p-3 rounded-lg text-xs text-amber-900">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-amber-800 block mb-1">
                    Esempio di frase naturale al banco:
                  </span>
                  <span className="italic">{item.counterPhrase}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Chiudi Prontuario
          </button>
        </div>
      </div>
    </div>
  );
};
