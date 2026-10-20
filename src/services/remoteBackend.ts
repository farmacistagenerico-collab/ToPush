/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client HTTP verso il backend Express (`server.ts`).
 * Usato solo quando l'app gira con Node (dev locale o deploy full-stack).
 * In modalità statica `src/services/api.ts` dirotta tutto su `localBackend.ts`.
 */

import { PharmacyStore, ProductItem, CampaignConfig, CustomList, TrafficLightColor } from '../types';
import { parseBackupPayload } from './backupCore';

export async function fetchPharmacyState(): Promise<PharmacyStore> {
  const res = await fetch('/api/state');
  if (!res.ok) {
    throw new Error(`Errore caricamento stato: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function createCustomList(data: {
  name: string;
  description?: string;
  periodType?: string;
  startDate?: string;
  endDate?: string;
  makeActive?: boolean;
  template?: string;
}): Promise<CustomList> {
  const res = await fetch('/api/lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Errore creazione lista: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function updateCustomList(id: string, data: Partial<CustomList>): Promise<CustomList> {
  const res = await fetch(`/api/lists/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Errore aggiornamento lista: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function activateCustomList(id: string): Promise<CustomList> {
  const res = await fetch(`/api/lists/${id}/activate`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Errore attivazione lista: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function duplicateCustomList(id: string): Promise<CustomList> {
  const res = await fetch(`/api/lists/${id}/duplicate`, {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Errore duplicazione lista: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteCustomList(id: string): Promise<boolean> {
  const res = await fetch(`/api/lists/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Errore eliminazione lista: ${res.statusText}`);
  }
  return true;
}

export async function recommendProduct(productId: string, staffMember?: string): Promise<{
  success: boolean;
  product: ProductItem;
  colorTransition: { from: TrafficLightColor; to: TrafficLightColor } | null;
}> {
  const res = await fetch(`/api/products/${productId}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ staffMember: staffMember || 'Banco Vendita' }),
  });
  if (!res.ok) {
    throw new Error(`Errore registrazione consiglio: ${res.statusText}`);
  }
  return res.json();
}

export async function updateProduct(productId: string, data: Partial<ProductItem>): Promise<ProductItem> {
  const res = await fetch(`/api/products/${productId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Errore aggiornamento prodotto: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function createProduct(data: Partial<ProductItem>): Promise<ProductItem> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Errore creazione prodotto: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const res = await fetch(`/api/products/${productId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    throw new Error(`Errore eliminazione prodotto: ${res.statusText}`);
  }
  return true;
}

export async function batchImportProducts(items: Partial<ProductItem>[], replaceExisting: boolean = false): Promise<number> {
  const res = await fetch('/api/products/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, replaceExisting }),
  });
  if (!res.ok) {
    throw new Error(`Errore importazione batch: ${res.statusText}`);
  }
  const json = await res.json();
  return json.importedCount;
}

export async function updateCampaign(data: Partial<CampaignConfig>): Promise<CampaignConfig> {
  const res = await fetch('/api/campaign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Errore aggiornamento campagna: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data;
}

export async function resetDemoData(): Promise<boolean> {
  const res = await fetch('/api/reset-demo', {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Errore ripristino dati demo: ${res.statusText}`);
  }
  return true;
}

export async function resetBlankData(): Promise<boolean> {
  const res = await fetch('/api/reset-blank', {
    method: 'POST',
  });
  if (!res.ok) {
    throw new Error(`Errore azzeramento versione in bianco: ${res.statusText}`);
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Backup e ripristino                                                 */
/* ------------------------------------------------------------------ */

export async function exportBackup(): Promise<string> {
  const res = await fetch('/api/backup');
  if (!res.ok) {
    throw new Error(`Errore creazione backup: ${res.statusText}`);
  }
  const json = await res.json();
  return typeof json.data === 'string' ? json.data : JSON.stringify(json.data, null, 2);
}

export async function restoreBackup(raw: string): Promise<PharmacyStore> {
  // Pre-validazione locale: messaggi d'errore identici in entrambe le modalità
  // e nessun round-trip inutile verso il server per file scartati subito.
  parseBackupPayload(raw);
  const res = await fetch('/api/backup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: raw,
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Errore ripristino backup: ${res.statusText}`);
  }
  const json = await res.json();
  return json.data as PharmacyStore;
}

export function subscribeToRealtimeUpdates(
  onUpdate: (store: PharmacyStore) => void,
  onError?: (err: Event) => void
): () => void {
  const eventSource = new EventSource('/api/stream');

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      if (payload.data) {
        onUpdate(payload.data);
      }
    } catch (err) {
      console.warn('Invalid SSE event data:', err);
    }
  };

  eventSource.onerror = (err) => {
    if (onError) onError(err);
  };

  return () => {
    eventSource.close();
  };
}
