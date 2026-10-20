/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Modale di sblocco del pannello Titolare: chiede il PIN quando è attivo.
 */
import React, { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { matchesPinHash } from '../services/pin';

interface Props {
  isOpen: boolean;
  expectedHash: string | null;
  onClose: () => void;
  onUnlocked: () => void;
}

export const PinModal: React.FC<Props> = ({ isOpen, expectedHash, onClose, onUnlocked }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const okPin = await matchesPinHash(pin, expectedHash);
    if (okPin) {
      setPin('');
      setError(null);
      onUnlocked();
    } else {
      setError('PIN errato. Riprova.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Lock className="w-4 h-4 text-emerald-400" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Area Titolare protetta</h2>
              <p className="text-[11px] text-slate-500">Inserisci il PIN per gestire liste e prodotti</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
            title="Chiudi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            value={pin}
            onChange={(e) => {
              setPin(e.target.value.replace(/\D/g, ''));
              setError(null);
            }}
            placeholder="PIN (4-8 cifre)"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 text-center text-xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {error && <p className="text-xs font-semibold text-rose-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
          >
            Sblocca pannello
          </button>
        </form>
      </div>
    </div>
  );
};
