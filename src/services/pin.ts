/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * PIN del pannello Titolare.
 *
 * Protezione VOLUTA semplice: serve a evitare modifiche accidentali al banco
 * (tap distratti sul tablet), non a fermare un attaccante determinato.
 * Nel file/store finisce solo l'HASH del PIN, mai il PIN in chiaro.
 *
 * - Contesti sicuri (https, localhost): SHA-256 via WebCrypto.
 * - Contesti non sicuri (backend LAN su http): fallback FNV-1a, marcato
 *   nel prefisso così la verifica usa lo stesso algoritmo della creazione.
 */

const SALT = 'farmacromia-pin:v1:';

export function isPinFormatValid(pin: string): boolean {
  return /^\d{4,8}$/.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  const input = SALT + pin;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `sha256:${hex}`;
  }
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `fnv1a:${h.toString(16)}`;
}

export async function matchesPinHash(pin: string, expectedHash: string | null | undefined): Promise<boolean> {
  if (!expectedHash) return false;
  const actual = await hashPin(pin);
  return actual === expectedHash;
}

/** Chiave sessionStorage: sblocco per-scheda, si aziona alla chiusura. */
export const UNLOCK_STORAGE_KEY = 'farmacromia.manager.unlocked';

export function isSessionUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setSessionUnlocked(unlocked: boolean): void {
  try {
    if (unlocked) sessionStorage.setItem(UNLOCK_STORAGE_KEY, '1');
    else sessionStorage.removeItem(UNLOCK_STORAGE_KEY);
  } catch {
    /* storage non disponibile: ignora */
  }
}
