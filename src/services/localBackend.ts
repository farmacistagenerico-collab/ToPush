/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Backend "in-browser" di FarmaCromia.
 *
 * GitHub Pages serve solo file statici: non può eseguire `server.ts` (Express),
 * né ospitare lo stream SSE. Questo modulo reimplementa la stessa identica API
 * usando `localStorage` come archivio e `BroadcastChannel` come canale di sync,
 * così la stessa build funziona sia collegata al backend Node sia pubblicata
 * come sito statico.
 *
 * Differenza funzionale da tenere presente in modalità statica:
 * i dati sono per-dispositivo/per-browser. La sincronizzazione real-time resta
 * attiva fra le schede e le finestre dello STESSO browser, ma non fra terminali
 * diversi della farmacia (per quello serve il backend Node).
 */
import type {
  CampaignConfig,
  CustomList,
  PharmacyStore,
  ProductItem,
  TrafficLightColor,
} from '../types';
import {
  buildDefaultAntibioticiProducts,
  buildDefaultAutunnoProducts,
  buildInitialStore,
  computeAutoColor,
} from '../data/seed';

const STORAGE_KEY = 'farmacromia.store.v1';
const CHANNEL_NAME = 'farmacromia-sync';
const MAX_HISTORY = 100;

/* ------------------------------------------------------------------ */
/* Persistenza                                                         */
/* ------------------------------------------------------------------ */

let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof BroadcastChannel === 'undefined') return null;
  if (!channel) {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event: MessageEvent) => {
      if (event.data?.type === 'STATE_UPDATED' && event.data.data) {
        notifySubscribers(event.data.data as PharmacyStore);
      }
    };
  }
  return channel;
}

function hasStorage(): boolean {
  try {
    const probe = '__farmacromia_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

/** Fallback estremo (localStorage bloccato / navigazione privata): solo memoria. */
let memoryStore: PharmacyStore | null = null;

function readRaw(): PharmacyStore | null {
  if (memoryStore) return memoryStore;
  if (!hasStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PharmacyStore;
    if (!parsed || !Array.isArray(parsed.lists)) return null;
    return parsed;
  } catch (err) {
    console.warn('[FarmaCromia] Dati locali illeggibili, rigenero lo stato iniziale:', err);
    return null;
  }
}

function writeRaw(store: PharmacyStore) {
  memoryStore = store;
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    // Quota superata: la storia dei consigli è la voce meno critica.
    console.warn('[FarmaCromia] Scrittura localStorage fallita, riduco lo storico:', err);
    try {
      store.historyLog = store.historyLog.slice(0, 20);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      console.error('[FarmaCromia] Persistenza non disponibile: i dati resteranno solo in memoria.');
    }
  }
}

/* ------------------------------------------------------------------ */
/* Logica di dominio (speculare a server.ts)                            */
/* ------------------------------------------------------------------ */

function syncActiveListProducts(store: PharmacyStore) {
  const active = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
  if (!active) return;
  store.activeListId = active.id;
  store.lists.forEach((l) => {
    l.isActive = l.id === active.id;
  });
  store.products = active.products;
  if (store.config) {
    store.config.title = active.name;
    store.config.periodType = active.periodType;
    store.config.startDate = active.startDate;
    store.config.endDate = active.endDate;
    store.config.notes = active.description;
  }
}

function loadStore(): PharmacyStore {
  let store = readRaw();
  if (!store) {
    store = buildInitialStore();
  }
  syncActiveListProducts(store);
  writeRaw(store);
  return store;
}

function commit(store: PharmacyStore): PharmacyStore {
  syncActiveListProducts(store);
  writeRaw(store);
  broadcast(store);
  return store;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function plusDaysIso(days: number): string {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function activeList(store: PharmacyStore): CustomList {
  const list = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
  if (!list) throw new Error('Nessuna lista attiva trovata');
  return list;
}

/* ------------------------------------------------------------------ */
/* Real-time tra schede/finestre dello stesso browser                   */
/* ------------------------------------------------------------------ */

const subscribers = new Set<(store: PharmacyStore) => void>();

function notifySubscribers(store: PharmacyStore) {
  const snapshot = clone(store);
  syncActiveListProducts(snapshot);
  subscribers.forEach((cb) => {
    try {
      cb(snapshot);
    } catch (err) {
      console.error('[FarmaCromia] Errore in un subscriber real-time:', err);
    }
  });
}

function broadcast(store: PharmacyStore) {
  notifySubscribers(store);
  getChannel()?.postMessage({ type: 'STATE_UPDATED', data: store });
}

/* ------------------------------------------------------------------ */
/* API pubblica — stesse firme di src/services/api.ts                   */
/* ------------------------------------------------------------------ */

export async function fetchPharmacyState(): Promise<PharmacyStore> {
  return clone(loadStore());
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
  if (!data.name || !data.name.trim()) {
    throw new Error('Il nome della lista è obbligatorio');
  }

  const store = loadStore();

  let initialProducts: ProductItem[] = [];
  if (data.template === 'autunno') {
    initialProducts = buildDefaultAutunnoProducts();
  } else if (data.template === 'antibiotici') {
    initialProducts = buildDefaultAntibioticiProducts();
  }

  const newList: CustomList = {
    id: uid('list'),
    name: data.name.trim(),
    description: (data.description || 'Consiglio guidato a semaforo').trim(),
    periodType: (data.periodType as CustomList['periodType']) || 'weekly',
    startDate: data.startDate || todayIso(),
    endDate: data.endDate || plusDaysIso(30),
    isActive: Boolean(data.makeActive),
    products: initialProducts,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };

  if (data.makeActive || store.lists.length === 0) {
    store.activeListId = newList.id;
  }

  store.lists.unshift(newList);
  commit(store);
  return clone(newList);
}

export async function updateCustomList(id: string, data: Partial<CustomList>): Promise<CustomList> {
  const store = loadStore();
  const list = store.lists.find((l) => l.id === id);
  if (!list) throw new Error('Lista non trovata');

  if (data.name !== undefined && data.name.trim()) list.name = data.name.trim();
  if (data.description !== undefined) list.description = data.description.trim();
  if (data.periodType !== undefined) list.periodType = data.periodType;
  if (data.startDate !== undefined) list.startDate = data.startDate;
  if (data.endDate !== undefined) list.endDate = data.endDate;
  list.lastModified = new Date().toISOString();

  commit(store);
  return clone(list);
}

export async function activateCustomList(id: string): Promise<CustomList> {
  const store = loadStore();
  const list = store.lists.find((l) => l.id === id);
  if (!list) throw new Error('Lista non trovata');

  store.activeListId = list.id;
  commit(store);
  return clone(list);
}

export async function duplicateCustomList(id: string): Promise<CustomList> {
  const store = loadStore();
  const sourceList = store.lists.find((l) => l.id === id);
  if (!sourceList) throw new Error('Lista originale non trovata');

  const clonedProducts: ProductItem[] = sourceList.products.map((p, idx) => ({
    ...clone(p),
    id: `prod-clone-${Date.now()}-${idx}`,
    currentQuantity: 0,
    color: computeAutoColor(0, p.targetQuantity),
    lastUpdated: new Date().toISOString(),
  }));

  const duplicatedList: CustomList = {
    id: uid('list'),
    name: `${sourceList.name} (Copia)`,
    description: sourceList.description,
    periodType: sourceList.periodType,
    startDate: todayIso(),
    endDate: plusDaysIso(14),
    isActive: false,
    products: clonedProducts,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  };

  store.lists.push(duplicatedList);
  commit(store);
  return clone(duplicatedList);
}

export async function deleteCustomList(id: string): Promise<boolean> {
  const store = loadStore();
  if (store.lists.length <= 1) {
    throw new Error("Non puoi eliminare l'unica lista rimasta.");
  }

  store.lists = store.lists.filter((l) => l.id !== id);
  if (store.activeListId === id) {
    store.activeListId = store.lists[0].id;
  }

  commit(store);
  return true;
}

export async function recommendProduct(
  productId: string,
  staffMember?: string
): Promise<{
  success: boolean;
  product: ProductItem;
  colorTransition: { from: TrafficLightColor; to: TrafficLightColor } | null;
}> {
  const store = loadStore();
  const list = activeList(store);
  const product = list.products.find((p) => p.id === productId);
  if (!product) throw new Error('Prodotto non trovato nella lista attiva');

  const previousColor = product.color;
  product.currentQuantity += 1;

  const newColor = computeAutoColor(product.currentQuantity, product.targetQuantity);
  product.color = newColor;
  product.lastUpdated = new Date().toISOString();
  list.lastModified = new Date().toISOString();

  store.historyLog.unshift({
    id: uid('log'),
    productId: product.id,
    productName: product.name,
    timestamp: new Date().toISOString(),
    source: staffMember || 'Banco Vendita',
    previousColor,
    newColor,
  });
  if (store.historyLog.length > MAX_HISTORY) {
    store.historyLog = store.historyLog.slice(0, MAX_HISTORY);
  }

  commit(store);

  return {
    success: true,
    product: clone(product),
    colorTransition: previousColor !== newColor ? { from: previousColor, to: newColor } : null,
  };
}

export async function updateProduct(productId: string, data: Partial<ProductItem>): Promise<ProductItem> {
  const store = loadStore();
  const list = activeList(store);
  const index = list.products.findIndex((p) => p.id === productId);
  if (index === -1) throw new Error('Prodotto non trovato');

  const currentProd = list.products[index];
  const updated: ProductItem = {
    ...currentProd,
    ...data,
    id: currentProd.id,
    lastUpdated: new Date().toISOString(),
  };

  list.products[index] = updated;
  list.lastModified = new Date().toISOString();

  commit(store);
  return clone(updated);
}

export async function createProduct(data: Partial<ProductItem>): Promise<ProductItem> {
  const store = loadStore();
  const list = activeList(store);

  if (!data.name) throw new Error('Il nome del prodotto è obbligatorio');

  const newProd: ProductItem = {
    id: uid('prod'),
    name: data.name.trim(),
    brand: (data.brand || 'Laboratorio / Brand').trim(),
    category: (data.category || 'Generale').trim(),
    sku: (data.sku || '').trim(),
    adviceTrigger: (data.adviceTrigger || 'Consiglia in abbinamento al banco').trim(),
    crossSellSuggestions: Array.isArray(data.crossSellSuggestions)
      ? data.crossSellSuggestions.filter(Boolean)
      : ['Consiglio attivo'],
    sellingPoints: Array.isArray(data.sellingPoints)
      ? data.sellingPoints.filter(Boolean)
      : ['Consiglio mirato'],
    color: (data.color as TrafficLightColor) || 'red',
    targetQuantity: Number(data.targetQuantity) || 20,
    currentQuantity: Number(data.currentQuantity) || 0,
    batchExpiry: (data.batchExpiry || '').trim(),
    priorityReason: (data.priorityReason || 'Priorità impostata dalla direzione').trim(),
    notesForStaff: (data.notesForStaff || '').trim(),
    lastUpdated: new Date().toISOString(),
  };

  list.products.unshift(newProd);
  list.lastModified = new Date().toISOString();

  commit(store);
  return clone(newProd);
}

export async function deleteProduct(productId: string): Promise<boolean> {
  const store = loadStore();
  const list = activeList(store);

  const initialLen = list.products.length;
  list.products = list.products.filter((p) => p.id !== productId);
  if (list.products.length === initialLen) throw new Error('Prodotto non trovato');

  list.lastModified = new Date().toISOString();
  commit(store);
  return true;
}

export async function batchImportProducts(
  items: Partial<ProductItem>[],
  replaceExisting: boolean = false
): Promise<number> {
  const store = loadStore();
  const list = activeList(store);

  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Nessun prodotto valido fornito per l'importazione");
  }

  const formattedItems: ProductItem[] = items.map((item, idx) => {
    const target = Number(item.targetQuantity) || 25;
    const current = Number(item.currentQuantity) || 0;
    const initialColor = (item.color as TrafficLightColor) || computeAutoColor(current, target);

    return {
      id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: String(item.name || 'Prodotto senza nome').trim(),
      brand: String(item.brand || 'Marchio').trim(),
      category: String(item.category || 'Generale').trim(),
      sku: String(item.sku || '').trim(),
      adviceTrigger: String(item.adviceTrigger || 'Consiglia in abbinamento al bisogno').trim(),
      crossSellSuggestions: Array.isArray(item.crossSellSuggestions)
        ? item.crossSellSuggestions
        : [String(item.crossSellSuggestions || 'Consiglio correlato')],
      sellingPoints: Array.isArray(item.sellingPoints)
        ? item.sellingPoints
        : [String(item.sellingPoints || 'Formula raccomandata')],
      color: initialColor,
      targetQuantity: target,
      currentQuantity: current,
      batchExpiry: String(item.batchExpiry || '').trim(),
      priorityReason: String(item.priorityReason || 'Importazione massiva di giacenze').trim(),
      notesForStaff: String(item.notesForStaff || '').trim(),
      lastUpdated: new Date().toISOString(),
    };
  });

  list.products = replaceExisting ? formattedItems : [...formattedItems, ...list.products];
  list.lastModified = new Date().toISOString();

  commit(store);
  return formattedItems.length;
}

export async function updateCampaign(data: Partial<CampaignConfig>): Promise<CampaignConfig> {
  const store = loadStore();
  if (!store.config) {
    throw new Error('Configurazione campagna non trovata');
  }

  store.config = { ...store.config, ...data, id: store.config.id };

  if (data.pharmacyName !== undefined && data.pharmacyName.trim()) {
    store.pharmacyName = data.pharmacyName.trim();
    store.config.pharmacyName = store.pharmacyName;
  }

  // Allinea la lista attiva al ciclo appena modificato, come fa il pannello titolare.
  const list = store.lists.find((l) => l.id === store.activeListId);
  if (list) {
    if (data.title !== undefined && data.title.trim()) list.name = data.title.trim();
    if (data.periodType !== undefined) list.periodType = data.periodType;
    if (data.startDate !== undefined) list.startDate = data.startDate;
    if (data.endDate !== undefined) list.endDate = data.endDate;
    if (data.notes !== undefined) list.description = data.notes;
    list.lastModified = new Date().toISOString();
  }

  commit(store);
  return clone(store.config);
}

export async function resetDemoData(): Promise<boolean> {
  commit(buildInitialStore());
  return true;
}

export async function resetBlankData(): Promise<boolean> {
  const today = todayIso();
  const threeMonthsLater = plusDaysIso(90);

  const blankStore: PharmacyStore = {
    pharmacyName: 'La Mia Farmacia',
    activeListId: 'list-initial',
    lists: [
      {
        id: 'list-initial',
        name: 'Consiglio Autunno/Inverno',
        description: 'Lista di partenza pronta da personalizzare con le referenze del tuo magazzino.',
        periodType: 'seasonal',
        startDate: today,
        endDate: threeMonthsLater,
        isActive: true,
        products: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      },
    ],
    config: {
      id: 'camp-initial',
      title: 'Consiglio Autunno/Inverno',
      periodType: 'seasonal',
      startDate: today,
      endDate: threeMonthsLater,
      pharmacyName: 'La Mia Farmacia',
      notes: 'Personalizza questa lista aggiungendo i tuoi prodotti o importando un CSV dal gestionale.',
    },
    products: [],
    historyLog: [],
  };

  commit(blankStore);
  return true;
}

export function subscribeToRealtimeUpdates(
  onUpdate: (store: PharmacyStore) => void,
  onError?: (err: Event) => void
): () => void {
  subscribers.add(onUpdate);
  const ch = getChannel();

  // Copia di sicurezza per i browser senza BroadcastChannel: l'evento `storage`
  // scatta quando un'altra scheda scrive la stessa chiave.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY || !event.newValue) return;
    try {
      const parsed = JSON.parse(event.newValue) as PharmacyStore;
      if (parsed && Array.isArray(parsed.lists)) notifySubscribers(parsed);
    } catch {
      /* payload non valido: ignora */
    }
  };

  if (!ch) {
    window.addEventListener('storage', onStorage);
  }

  // Segnala subito la connessione: in modalità locale il canale è sempre pronto.
  onUpdate(clone(loadStore()));

  return () => {
    subscribers.delete(onUpdate);
    window.removeEventListener('storage', onStorage);
    if (subscribers.size === 0 && ch) {
      ch.close();
      channel = null;
    }
  };
}

/**
 * Indica se il browser ha una persistenza reale disponibile.
 * Serve all'UI per avvisare quando i dati vivranno solo in memoria.
 */
export function isPersistent(): boolean {
  return hasStorage();
}
