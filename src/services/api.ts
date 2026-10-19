/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Punto d'accesso unico ai dati per tutta la UI.
 *
 * FarmaCromia gira in due modalità e questo modulo sceglie da solo quale usare:
 *
 *   1. `server` — il backend Express (`server.ts`) risponde su `/api/*`.
 *                  Dati condivisi fra tutti i terminali + SSE real-time.
 *                  (dev locale, oppure deploy full-stack su un host Node)
 *
 *   2. `local`  — nessun backend raggiungibile: si usa `localBackend.ts`,
 *                  che persiste su `localStorage` e sincronizza le schede
 *                  dello stesso browser via `BroadcastChannel`.
 *                  È la modalità di GitHub Pages, che è solo statico.
 *
 * I componenti React importano sempre e solo da qui: nessuna modifica alla UI
 * è necessaria per passare dall'una all'altra modalità.
 */
import type { CampaignConfig, CustomList, PharmacyStore, ProductItem, Subcategory, TrafficLightColor } from '../types';
import * as local from './localBackend';
import * as remote from './remoteBackend';

export type BackendMode = 'server' | 'local';

/** Millisecondi concessi al backend per rispondere prima di passare in locale. */
const PROBE_TIMEOUT_MS = 3000;

let modePromise: Promise<BackendMode> | null = null;
let resolvedMode: BackendMode | null = null;

function staticFlagEnabled(): boolean {
  // Impostato dalla build di GitHub Pages (vedi .github/workflows/deploy.yml).
  return import.meta.env.VITE_STATIC_MODE === 'true';
}

/**
 * Verifica la presenza del backend Express.
 * Su GitHub Pages `/api/state` restituisce la pagina di 404 in HTML: il controllo
 * sul `Content-Type` evita di scambiare quell'HTML per uno stato valido.
 */
async function probeBackend(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch('/api/state', {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) return false;
    const json = await res.json();
    return Boolean(json && json.data);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/** Risolve la modalità una sola volta per tutta la sessione. */
export function getBackendMode(): Promise<BackendMode> {
  if (resolvedMode) return Promise.resolve(resolvedMode);
  if (!modePromise) {
    modePromise = (async () => {
      const mode: BackendMode = staticFlagEnabled() ? 'local' : (await probeBackend()) ? 'server' : 'local';
      resolvedMode = mode;
      if (mode === 'local') {
        console.info(
          '[FarmaCromia] Backend non raggiungibile: modalità locale attiva ' +
            '(dati salvati in questo browser, sincronizzati fra le schede aperte).'
        );
      }
      return mode;
    })();
  }
  return modePromise;
}

async function useLocal(): Promise<boolean> {
  return (await getBackendMode()) === 'local';
}

/* ------------------------------------------------------------------ */
/* Lettura stato                                                       */
/* ------------------------------------------------------------------ */

export async function fetchPharmacyState(): Promise<PharmacyStore> {
  return (await useLocal()) ? local.fetchPharmacyState() : remote.fetchPharmacyState();
}

/* ------------------------------------------------------------------ */
/* Liste                                                               */
/* ------------------------------------------------------------------ */

export async function createCustomList(data: {
  name: string;
  description?: string;
  periodType?: string;
  startDate?: string;
  endDate?: string;
  makeActive?: boolean;
  template?: string;
}): Promise<CustomList> {
  return (await useLocal()) ? local.createCustomList(data) : remote.createCustomList(data);
}

export async function updateCustomList(id: string, data: Partial<CustomList>): Promise<CustomList> {
  return (await useLocal()) ? local.updateCustomList(id, data) : remote.updateCustomList(id, data);
}

export async function activateCustomList(id: string): Promise<CustomList> {
  return (await useLocal()) ? local.activateCustomList(id) : remote.activateCustomList(id);
}

export async function duplicateCustomList(id: string): Promise<CustomList> {
  return (await useLocal()) ? local.duplicateCustomList(id) : remote.duplicateCustomList(id);
}

export async function deleteCustomList(id: string): Promise<boolean> {
  return (await useLocal()) ? local.deleteCustomList(id) : remote.deleteCustomList(id);
}

/* ------------------------------------------------------------------ */
/* Prodotti                                                            */
/* ------------------------------------------------------------------ */

export async function recommendProduct(
  productId: string,
  staffMember?: string
): Promise<{
  success: boolean;
  product: ProductItem;
  colorTransition: { from: TrafficLightColor; to: TrafficLightColor } | null;
}> {
  return (await useLocal())
    ? local.recommendProduct(productId, staffMember)
    : remote.recommendProduct(productId, staffMember);
}

export async function updateProduct(productId: string, data: Partial<ProductItem>): Promise<ProductItem> {
  return (await useLocal()) ? local.updateProduct(productId, data) : remote.updateProduct(productId, data);
}

export async function createProduct(data: Partial<ProductItem>): Promise<ProductItem> {
  return (await useLocal()) ? local.createProduct(data) : remote.createProduct(data);
}

export async function deleteProduct(productId: string): Promise<boolean> {
  return (await useLocal()) ? local.deleteProduct(productId) : remote.deleteProduct(productId);
}

export type BatchImportItem = Partial<ProductItem> & { subcategory?: string };

export async function batchImportProducts(
  items: BatchImportItem[],
  replaceExisting: boolean = false
): Promise<number> {
  return (await useLocal())
    ? local.batchImportProducts(items, replaceExisting)
    : remote.batchImportProducts(items, replaceExisting);
}

/* ------------------------------------------------------------------ */
/* Sottocategorie (per lista)                                          */
/* ------------------------------------------------------------------ */

export async function createSubcategory(listId: string, name: string): Promise<Subcategory> {
  return (await useLocal()) ? local.createSubcategory(listId, name) : remoteCreateSubcategory(listId, name);
}

export async function updateSubcategory(
  listId: string,
  subcategoryId: string,
  data: Partial<Subcategory>
): Promise<Subcategory> {
  return (await useLocal())
    ? local.updateSubcategory(listId, subcategoryId, data)
    : remoteUpdateSubcategory(listId, subcategoryId, data);
}

export async function deleteSubcategory(listId: string, subcategoryId: string): Promise<boolean> {
  return (await useLocal())
    ? local.deleteSubcategory(listId, subcategoryId)
    : remoteDeleteSubcategory(listId, subcategoryId);
}

/* ------------------------------------------------------------------ */
/* Campagna e reset                                                    */
/* ------------------------------------------------------------------ */

export async function updateCampaign(data: Partial<CampaignConfig>): Promise<CampaignConfig> {
  return (await useLocal()) ? local.updateCampaign(data) : remote.updateCampaign(data);
}

export async function resetDemoData(): Promise<boolean> {
  return (await useLocal()) ? local.resetDemoData() : remote.resetDemoData();
}

export async function resetBlankData(): Promise<boolean> {
  return (await useLocal()) ? local.resetBlankData() : remote.resetBlankData();
}

/* ------------------------------------------------------------------ */
/* Real-time                                                           */
/* ------------------------------------------------------------------ */

/**
 * In modalità `server` apre lo stream SSE; in modalità `local` si aggancia al
 * BroadcastChannel. La risoluzione della modalità è asincrona, quindi l'unsubscribe
 * annulla anche una sottoscrizione non ancora aperta.
 */
export function subscribeToRealtimeUpdates(
  onUpdate: (store: PharmacyStore) => void,
  onError?: (err: Event) => void
): () => void {
  let dispose: (() => void) | null = null;
  let cancelled = false;

  getBackendMode()
    .then((mode) => {
      if (cancelled) return;
      dispose =
        mode === 'local'
          ? local.subscribeToRealtimeUpdates(onUpdate, onError)
          : remote.subscribeToRealtimeUpdates(onUpdate, onError);
    })
    .catch((err) => {
      console.error('[FarmaCromia] Impossibile inizializzare il canale real-time:', err);
      if (!cancelled && onError) onError(new Event('error'));
    });

  return () => {
    cancelled = true;
    if (dispose) dispose();
  };
}

/* ------------------------------------------------------------------ */
/* Client HTTP per le sottocategorie (modalità server)                  */
/* ------------------------------------------------------------------ */

async function remoteCreateSubcategory(listId: string, name: string): Promise<Subcategory> {
  const res = await fetch(`/api/lists/${listId}/subcategories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Errore creazione sottocategoria: ${res.statusText}`);
  }
  return (await res.json()).data;
}

async function remoteUpdateSubcategory(
  listId: string,
  subcategoryId: string,
  data: Partial<Subcategory>
): Promise<Subcategory> {
  const res = await fetch(`/api/lists/${listId}/subcategories/${subcategoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Errore aggiornamento sottocategoria: ${res.statusText}`);
  return (await res.json()).data;
}

async function remoteDeleteSubcategory(listId: string, subcategoryId: string): Promise<boolean> {
  const res = await fetch(`/api/lists/${listId}/subcategories/${subcategoryId}`, { method: 'DELETE' });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `Errore eliminazione sottocategoria: ${res.statusText}`);
  }
  return true;
}

/* ------------------------------------------------------------------ */
/* Info per la UI                                                      */
/* ------------------------------------------------------------------ */

/** True se i dati vivono solo in questo browser (nessun backend Node). */
export async function isLocalMode(): Promise<boolean> {
  return (await getBackendMode()) === 'local';
}

/** True se il browser offre una persistenza reale (localStorage disponibile). */
export function isPersistentStorage(): boolean {
  return local.isPersistent();
}
