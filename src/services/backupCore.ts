/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Formato del file di backup di FarmaCromia.
 *
 * Modulo "neutro": non tocca né localStorage né il filesystem, quindi può essere
 * importato sia dal backend in-browser (`localBackend.ts`) sia da Express
 * (`server.ts`). Contiene solo la busta (envelope) del file e la sua validazione.
 */
import type { PharmacyStore } from '../types';

/** Versione del formato: servirà per migrare i backup fra release future. */
export const BACKUP_SCHEMA_VERSION = 1;

/** Busta del file di backup. */
export interface BackupEnvelope {
  app: 'farmacromia';
  schemaVersion: number;
  exportedAt: string;
  origin: 'local' | 'server';
  store: PharmacyStore;
}

/** Serializza l'archivio corrente in un file di backup (stringa JSON). */
export function buildBackupPayload(store: PharmacyStore, origin: 'local' | 'server'): string {
  const envelope: BackupEnvelope = {
    app: 'farmacromia',
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    origin,
    store,
  };
  return JSON.stringify(envelope, null, 2);
}

/**
 * Valida un file di backup e restituisce l'archivio che contiene.
 * Lanci un `Error` con messaggio leggibile se il file non è un backup valido:
 * la UI mostra il messaggio così com'è.
 *
 * Le migrazioni dello schema (es. sottocategorie) NON vivono qui: le applicano
 * i due backend dopo il parse, ognuna con i propri strumenti.
 */
export function parseBackupPayload(raw: string): PharmacyStore {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Il file non è un JSON valido.');
  }
  const envelope = parsed as Partial<BackupEnvelope> | null;
  if (
    !envelope ||
    envelope.app !== 'farmacromia' ||
    typeof envelope.store !== 'object' ||
    envelope.store === null
  ) {
    throw new Error('Il file non è un backup di FarmaCromia.');
  }
  const store = envelope.store as PharmacyStore;
  if (
    !Array.isArray(store.lists) ||
    !Array.isArray(store.products) ||
    typeof store.pharmacyName !== 'string' ||
    typeof store.activeListId !== 'string'
  ) {
    throw new Error('Backup danneggiato: mancano liste, prodotti o i dati della farmacia.');
  }
  return store;
}
