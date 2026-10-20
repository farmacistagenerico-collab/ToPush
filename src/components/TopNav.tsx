import React from 'react';
import { Activity, ShieldCheck, Sparkles, BookOpen, Settings, Store } from 'lucide-react';

interface TopNavProps {
  activeView: 'counter' | 'manager';
  onSelectView: (view: 'counter' | 'manager') => void;
  onOpenCrossSelling: () => void;
  onOpenMethodExplainer: () => void;
  isRealtimeConnected: boolean;
  /** 'server' = backend Express + SSE, 'local' = statico (GitHub Pages), null = in rilevamento */
  backendMode?: 'server' | 'local' | null;
  activeCycleTitle: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeView,
  onSelectView,
  onOpenCrossSelling,
  onOpenMethodExplainer,
  isRealtimeConnected,
  backendMode,
  activeCycleTitle,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-8 px-3 sm:px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold shadow-sm">
            <span className="text-lg leading-none">+</span>
          </div>
          <button
            onClick={() => onSelectView('counter')}
            className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap hover:text-emerald-700 transition-colors text-left"
          >
            <span className="hidden min-[360px]:inline">FarmaCromia</span>
            <span className="min-[360px]:hidden sr-only">FarmaCromia</span>
          </button>
        </div>

        {/* Zone 2: 4-5 clean single-line text navigation links */}
        <nav className="hidden xl:flex items-center gap-7 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectView('counter')}
            className={`whitespace-nowrap shrink-0 transition-colors ${
              activeView === 'counter'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            Banco Vendita (Cromatico)
          </button>

          <button
            onClick={onOpenCrossSelling}
            className="whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Prontuario Cross-Selling</span>
          </button>

          <button
            onClick={onOpenMethodExplainer}
            className="whitespace-nowrap shrink-0 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Metodo Semaforo</span>
          </button>

          <button
            onClick={() => onSelectView('manager')}
            className={`whitespace-nowrap shrink-0 transition-colors flex items-center gap-1.5 ${
              activeView === 'manager'
                ? 'text-emerald-700 font-semibold border-b-2 border-emerald-600 pb-0.5'
                : 'hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Gestione Titolare</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Mobile view toggle */}
          <div className="flex xl:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => onSelectView('counter')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeView === 'counter' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Banco
            </button>
            <button
              onClick={() => onSelectView('manager')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                activeView === 'manager' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              Titolare
            </button>
          </div>

          <div
            title={
              backendMode === 'local'
                ? 'Modalità locale (sito statico): i dati sono salvati in questo browser e sincronizzati fra le schede aperte. Per la sincronizzazione fra tutti i terminali della farmacia serve il backend Node.'
                : isRealtimeConnected
                  ? 'Sincronizzato in tempo reale tra tutti i dispositivi'
                  : 'Connessione al server in corso...'
            }
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 bg-slate-50"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isRealtimeConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="whitespace-nowrap">
              {backendMode === 'local'
                ? 'Modalità Locale'
                : isRealtimeConnected
                  ? 'Sincronizzato Live'
                  : 'Connessione...'}
            </span>
          </div>

          {activeView === 'counter' ? (
            <button
              onClick={() => onSelectView('manager')}
              title="Area Titolare"
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Area Titolare</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectView('counter')}
              title="Torna al Banco"
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Torna al Banco</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
