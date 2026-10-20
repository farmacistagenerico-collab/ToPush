import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import {
  buildDefaultAutunnoProducts,
  buildDefaultAntibioticiProducts,
  buildInitialLists,
  buildInitialStore,
  computeAutoColor,
  hydrateDemoSubcategories,
} from './src/data/seed';
import { buildBackupPayload, parseBackupPayload } from './src/services/backupCore';

export type TrafficLightColor = 'red' | 'orange' | 'yellow' | 'green';

export interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  sku: string;
  adviceTrigger: string;
  crossSellSuggestions: string[];
  sellingPoints: string[];
  color: TrafficLightColor;
  targetQuantity: number;
  currentQuantity: number;
  batchExpiry?: string;
  priorityReason: string;
  notesForStaff: string;
  /** Foto del prodotto (data-url compressa) o null. */
  imageUrl?: string | null;
  lastUpdated: string;
  subcategoryId?: string | null;
}

export interface Subcategory {
  id: string;
  name: string;
}

export interface CampaignConfig {
  id: string;
  title: string;
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'seasonal';
  startDate: string;
  endDate: string;
  pharmacyName: string;
  notes: string;
}

export interface CustomList {
  id: string;
  name: string;
  description: string;
  periodType: 'weekly' | 'biweekly' | 'monthly' | 'seasonal';
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: ProductItem[];
  subcategories: Subcategory[];
  createdAt: string;
  lastModified: string;
}

export interface HistoryLogEntry {
  id: string;
  productId: string;
  productName: string;
  timestamp: string;
  source: string;
  previousColor: TrafficLightColor;
  newColor: TrafficLightColor;
}

export interface PharmacyStore {
  pharmacyName: string;
  activeListId: string;
  lists: CustomList[];
  config: CampaignConfig;
  products: ProductItem[];
  historyLog: HistoryLogEntry[];
  /** Hash del PIN del pannello Titolare (null = nessuna protezione). */
  managerPinHash?: string | null;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'pharmacy_store.json');


function ensureDataFile(): PharmacyStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(buildInitialStore(), null, 2), 'utf-8');
      return buildInitialStore();
    }
    const raw = fs.readFileSync(STORE_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Migration check: ensure lists exist
    if (!parsed.lists || !Array.isArray(parsed.lists) || parsed.lists.length === 0) {
      const activeList: CustomList = {
        id: 'list-autunno-inverno',
        name: parsed.config?.title || 'Consiglio Autunno/Inverno',
        description: parsed.config?.notes || 'Focus speciale su prevenzione stagionale e consiglio al banco.',
        periodType: parsed.config?.periodType || 'seasonal',
        startDate: parsed.config?.startDate || '2026-10-01',
        endDate: parsed.config?.endDate || '2027-02-28',
        isActive: true,
        products: parsed.products || buildDefaultAutunnoProducts(),
        subcategories: [],
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      parsed.lists = [activeList, ...buildInitialLists().filter(l => l.id !== 'list-autunno-inverno')];
      parsed.activeListId = activeList.id;
      parsed.pharmacyName = parsed.config?.pharmacyName || 'Farmacia Centrale San Rocco';
    }

    // Migrazione: liste salvate prima delle sottocategorie
    parsed.lists.forEach((l: any) => {
      if (!Array.isArray(l.subcategories)) l.subcategories = [];
      (l.products || []).forEach((prod: any) => {
        if (prod.subcategoryId === undefined) prod.subcategoryId = null;
      });
      hydrateDemoSubcategories(l);
    });

    // Sync active list products to root products
    const active = parsed.lists.find((l: CustomList) => l.id === parsed.activeListId) || parsed.lists[0];
    if (active) {
      parsed.activeListId = active.id;
      parsed.products = active.products;
      if (parsed.config) {
        parsed.config.title = active.name;
        parsed.config.periodType = active.periodType;
        parsed.config.startDate = active.startDate;
        parsed.config.endDate = active.endDate;
        parsed.config.notes = active.description;
      }
    }

    if (parsed.managerPinHash === undefined) parsed.managerPinHash = null;

    return parsed;
  } catch (err) {
    console.error('Error reading store file, falling back to initial data:', err);
    return buildInitialStore();
  }
}

function saveStore(store: PharmacyStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving store file:', err);
  }
}

function syncActiveListProducts(store: PharmacyStore) {
  const active = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
  if (active) {
    store.activeListId = active.id;
    store.lists.forEach((l) => {
      l.isActive = l.id === active.id;
    });
    store.products = active.products;
    store.config.title = active.name;
    store.config.periodType = active.periodType;
    store.config.startDate = active.startDate;
    store.config.endDate = active.endDate;
    store.config.notes = active.description;
  }
}


let store: PharmacyStore = ensureDataFile();
syncActiveListProducts(store);

const sseClients = new Set<Response>();

function broadcastUpdate() {
  syncActiveListProducts(store);
  const payload = `data: ${JSON.stringify({ type: 'STATE_UPDATED', data: store })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // Le risposte API non devono mai essere cachiate dal browser:
  // senza validatori, Chrome può applicare cache euristica su GET /api/state
  // e mostrare giacenze stale al banco dopo un consiglio registrato.
  app.use('/api', (_req: Request, res: Response, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.set('Pragma', 'no-cache');
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  // 1. Get entire pharmacy operational state
  app.get('/api/state', (_req: Request, res: Response) => {
    syncActiveListProducts(store);
    res.json({ success: true, data: store });
  });

  // 2. Server-Sent Events stream for instant real-time sync across mobile & desktop
  app.get('/api/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    syncActiveListProducts(store);
    res.write(`data: ${JSON.stringify({ type: 'INIT', data: store })}\n\n`);

    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
  });

  // 3. Lists CRUD & Switcher
  // 3a. Get all lists
  app.get('/api/lists', (_req: Request, res: Response) => {
    res.json({ success: true, data: store.lists, activeListId: store.activeListId });
  });

  // 3b. Create a new custom list
  app.post('/api/lists', (req: Request, res: Response) => {
    const { name, description, periodType, startDate, endDate, makeActive, template } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Il nome della lista è obbligatorio' });
    }

    let initialProducts: ProductItem[] = [];
    if (template === 'autunno') {
      initialProducts = buildDefaultAutunnoProducts();
    } else if (template === 'antibiotici') {
      initialProducts = buildDefaultAntibioticiProducts();
    }

    const newList: CustomList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      description: (description || 'Consiglio guidato a semaforo').trim(),
      periodType: periodType || 'weekly',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: Boolean(makeActive),
      products: initialProducts,
      subcategories: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    if (makeActive || store.lists.length === 0) {
      store.activeListId = newList.id;
    }

    store.lists.unshift(newList);
    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, data: newList, activeListId: store.activeListId });
  });

  // 3c. Update a list (rename, edit dates, change description or period)
  app.put('/api/lists/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const list = store.lists.find((l) => l.id === id);
    if (!list) {
      return res.status(404).json({ error: 'Lista non trovata' });
    }

    const { name, description, periodType, startDate, endDate } = req.body;
    if (name !== undefined && name.trim()) list.name = name.trim();
    if (description !== undefined) list.description = description.trim();
    if (periodType !== undefined) list.periodType = periodType;
    if (startDate !== undefined) list.startDate = startDate;
    if (endDate !== undefined) list.endDate = endDate;
    list.lastModified = new Date().toISOString();

    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, data: list });
  });

  // 3d. Set active list (transfers to counter staff immediately)
  app.post('/api/lists/:id/activate', (req: Request, res: Response) => {
    const { id } = req.params;
    const list = store.lists.find((l) => l.id === id);
    if (!list) {
      return res.status(404).json({ error: 'Lista non trovata' });
    }

    store.activeListId = list.id;
    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({
      success: true,
      message: `Lista "${list.name}" attivata per tutto il banco vendita!`,
      data: list,
    });
  });

  // 3e. Duplicate a list
  app.post('/api/lists/:id/duplicate', (req: Request, res: Response) => {
    const { id } = req.params;
    const sourceList = store.lists.find((l) => l.id === id);
    if (!sourceList) {
      return res.status(404).json({ error: 'Lista originale non trovata' });
    }

    const clonedProducts: ProductItem[] = sourceList.products.map((p, idx) => ({
      ...p,
      id: `prod-clone-${Date.now()}-${idx}`,
      currentQuantity: 0,
      color: computeAutoColor(0, p.targetQuantity),
      lastUpdated: new Date().toISOString(),
    }));

    const duplicatedList: CustomList = {
      id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${sourceList.name} (Copia)`,
      description: sourceList.description,
      periodType: sourceList.periodType,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: false,
      products: clonedProducts,
      subcategories: JSON.parse(JSON.stringify(sourceList.subcategories || [])),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
    };

    store.lists.push(duplicatedList);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, data: duplicatedList });
  });

  // 3f. Delete a list
  app.delete('/api/lists/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    if (store.lists.length <= 1) {
      return res.status(400).json({ error: 'Non puoi eliminare l unica lista rimasta.' });
    }

    store.lists = store.lists.filter((l) => l.id !== id);
    if (store.activeListId === id) {
      store.activeListId = store.lists[0].id;
    }

    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, message: 'Lista eliminata' });
  });

  // 4. Products: Register a recommendation at the pharmacy counter (1-tap by staff)
  app.post('/api/products/:id/recommend', (req: Request, res: Response) => {
    const { id } = req.params;
    const { staffMember } = req.body || {};

    const activeList = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
    if (!activeList) {
      return res.status(404).json({ error: 'Nessuna lista attiva trovata' });
    }

    const product = activeList.products.find((p) => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Prodotto non trovato nella lista attiva' });
    }

    const previousColor = product.color;
    product.currentQuantity += 1;

    const newColor = computeAutoColor(product.currentQuantity, product.targetQuantity);
    product.color = newColor;
    product.lastUpdated = new Date().toISOString();
    activeList.lastModified = new Date().toISOString();

    store.historyLog.unshift({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      productId: product.id,
      productName: product.name,
      timestamp: new Date().toISOString(),
      source: staffMember || 'Banco Vendita',
      previousColor,
      newColor,
    });
    if (store.historyLog.length > 100) {
      store.historyLog = store.historyLog.slice(0, 100);
    }

    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({
      success: true,
      message: 'Consiglio registrato con successo',
      product,
      colorTransition: previousColor !== newColor ? { from: previousColor, to: newColor } : null,
    });
  });

  // 5. Update product properties or force color priority manually
  app.put('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const activeList = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
    if (!activeList) return res.status(404).json({ error: 'Lista non trovata' });

    const index = activeList.products.findIndex((p) => p.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }

    const currentProd = activeList.products[index];
    const updated = {
      ...currentProd,
      ...req.body,
      id: currentProd.id,
      lastUpdated: new Date().toISOString(),
    };

    activeList.products[index] = updated;
    activeList.lastModified = new Date().toISOString();

    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, data: updated });
  });

  // 6. Add a new product to active list
  app.post('/api/products', (req: Request, res: Response) => {
    const activeList = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
    if (!activeList) return res.status(404).json({ error: 'Lista non trovata' });

    const {
      name,
      brand,
      category,
      sku,
      adviceTrigger,
      crossSellSuggestions,
      sellingPoints,
      color,
      targetQuantity,
      currentQuantity,
      batchExpiry,
      priorityReason,
      notesForStaff,
      imageUrl,
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Il nome del prodotto è obbligatorio' });
    }

    const newProd: ProductItem = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      brand: (brand || 'Laboratorio / Brand').trim(),
      category: (category || 'Generale').trim(),
      sku: (sku || '').trim(),
      adviceTrigger: (adviceTrigger || 'Consiglia in abbinamento al banco').trim(),
      crossSellSuggestions: Array.isArray(crossSellSuggestions)
        ? crossSellSuggestions.filter(Boolean)
        : ['Consiglio attivo'],
      sellingPoints: Array.isArray(sellingPoints)
        ? sellingPoints.filter(Boolean)
        : ['Consiglio mirato'],
      color: (color as TrafficLightColor) || 'red',
      targetQuantity: Number(targetQuantity) || 20,
      currentQuantity: Number(currentQuantity) || 0,
      batchExpiry: (batchExpiry || '').trim(),
      priorityReason: (priorityReason || 'Priorità impostata dalla direzione').trim(),
      notesForStaff: (notesForStaff || '').trim(),
      imageUrl: typeof imageUrl === 'string' && imageUrl.startsWith('data:image/') ? imageUrl : null,
      lastUpdated: new Date().toISOString(),
    };

    activeList.products.unshift(newProd);
    activeList.lastModified = new Date().toISOString();

    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, data: newProd });
  });

  // 7. Delete product from active list
  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    const activeList = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
    if (!activeList) return res.status(404).json({ error: 'Lista non trovata' });

    const initialLen = activeList.products.length;
    activeList.products = activeList.products.filter((p) => p.id !== id);

    if (activeList.products.length === initialLen) {
      return res.status(404).json({ error: 'Prodotto non trovato' });
    }

    activeList.lastModified = new Date().toISOString();
    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, message: 'Prodotto rimosso dalla lista attiva' });
  });

  // 8. Batch import products into active list
  app.post('/api/products/batch', (req: Request, res: Response) => {
    const activeList = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
    if (!activeList) return res.status(404).json({ error: 'Lista non trovata' });

    const { items, replaceExisting } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Nessun prodotto valido fornito per l importazione' });
    }

    const formattedItems: ProductItem[] = items.map((item: any, idx) => {
      const target = Number(item.targetQuantity) || 25;
      const current = Number(item.currentQuantity) || 0;
      const initialColor = (item.color as TrafficLightColor) || computeAutoColor(current, target);
      const subName = typeof item.subcategory === 'string' ? item.subcategory.trim() : '';
      let subcategoryId: string | null = item.subcategoryId ?? null;
      if (subName) {
        const existing = activeList.subcategories.find(
          (sub) => sub.name.toLowerCase() === subName.toLowerCase()
        );
        if (existing) {
          subcategoryId = existing.id;
        } else {
          const created: Subcategory = { id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name: subName };
          activeList.subcategories.push(created);
          subcategoryId = created.id;
        }
      }

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
        subcategoryId,
      };
    });

    if (replaceExisting) {
      activeList.products = formattedItems;
    } else {
      activeList.products = [...formattedItems, ...activeList.products];
    }

    activeList.lastModified = new Date().toISOString();
    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({
      success: true,
      importedCount: formattedItems.length,
      totalCount: activeList.products.length,
    });
  });

  // 8a-bis. Sottocategorie di una lista (CRUD)
  app.post('/api/lists/:id/subcategories', (req: Request, res: Response) => {
    const list = store.lists.find((l) => l.id === req.params.id);
    if (!list) return res.status(404).json({ error: 'Lista non trovata' });

    const name = String(req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Il nome della sottocategoria è obbligatorio' });
    if (list.subcategories.some((sub) => sub.name.toLowerCase() === name.toLowerCase())) {
      return res.status(400).json({ error: `Esiste già una sottocategoria «${name}» in questa lista` });
    }

    const created: Subcategory = { id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, name };
    list.subcategories.push(created);
    list.lastModified = new Date().toISOString();
    saveStore(store);
    broadcastUpdate();
    return res.json({ success: true, data: created });
  });

  app.put('/api/lists/:id/subcategories/:sid', (req: Request, res: Response) => {
    const list = store.lists.find((l) => l.id === req.params.id);
    if (!list) return res.status(404).json({ error: 'Lista non trovata' });
    const sub = list.subcategories.find((s) => s.id === req.params.sid);
    if (!sub) return res.status(404).json({ error: 'Sottocategoria non trovata' });

    const name = String(req.body?.name || '').trim();
    if (name) sub.name = name;
    list.lastModified = new Date().toISOString();
    saveStore(store);
    broadcastUpdate();
    return res.json({ success: true, data: sub });
  });

  app.delete('/api/lists/:id/subcategories/:sid', (req: Request, res: Response) => {
    const list = store.lists.find((l) => l.id === req.params.id);
    if (!list) return res.status(404).json({ error: 'Lista non trovata' });
    const before = list.subcategories.length;
    list.subcategories = list.subcategories.filter((s) => s.id !== req.params.sid);
    if (list.subcategories.length === before) {
      return res.status(404).json({ error: 'Sottocategoria non trovata' });
    }
    list.products.forEach((prod) => {
      if (prod.subcategoryId === req.params.sid) prod.subcategoryId = null;
    });
    list.lastModified = new Date().toISOString();
    saveStore(store);
    broadcastUpdate();
    return res.json({ success: true, message: 'Sottocategoria eliminata' });
  });

  // 8b. Update campaign / cycle configuration (pannello titolare)
  //     NB: `syncActiveListProducts` riscrive `store.config` a partire dalla lista
  //     attiva, quindi le modifiche vanno applicate alla lista: altrimenti verrebbero
  //     subito sovrascritte. (Prima questa rotta non esisteva affatto e la UI
  //     riceveva un 404 al salvataggio delle impostazioni del ciclo.)
  app.post('/api/campaign', (req: Request, res: Response) => {
    const activeList = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];
    if (!activeList) {
      return res.status(404).json({ error: 'Nessuna lista attiva trovata' });
    }

    const { title, periodType, startDate, endDate, notes, pharmacyName } = req.body || {};

    if (title !== undefined && String(title).trim()) activeList.name = String(title).trim();
    if (periodType !== undefined) activeList.periodType = periodType;
    if (startDate !== undefined) activeList.startDate = startDate;
    if (endDate !== undefined) activeList.endDate = endDate;
    if (notes !== undefined) activeList.description = String(notes);
    activeList.lastModified = new Date().toISOString();

    if (pharmacyName !== undefined && String(pharmacyName).trim()) {
      store.pharmacyName = String(pharmacyName).trim();
      store.config.pharmacyName = store.pharmacyName;
    }

    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();

    return res.json({ success: true, data: store.config });
  });

  // 8b. PIN del pannello Titolare (solo hash, mai il PIN in chiaro)
  app.post('/api/security/pin', (req: Request, res: Response) => {
    const hash = (req.body || {}).hash;
    if (hash !== null && typeof hash !== 'string') {
      return res.status(400).json({ error: 'Hash PIN non valido.' });
    }
    store.managerPinHash = hash;
    saveStore(store);
    broadcastUpdate();
    return res.json({ success: true });
  });

  // 8c. Backup download & restore (full archive replacement)
  app.get('/api/backup', (_req: Request, res: Response) => {
    return res.json({ data: buildBackupPayload(store, 'server') });
  });

  app.post('/api/backup', (req: Request, res: Response) => {
    try {
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const restored = parseBackupPayload(raw);
      syncActiveListProducts(restored);
      store = restored;
      saveStore(store);
      broadcastUpdate();
      return res.json({ data: store });
    } catch (err) {
      return res
        .status(400)
        .json({ error: err instanceof Error ? err.message : 'Backup non valido.' });
    }
  });

  // 9. Reset to default demo data
  app.post('/api/reset-demo', (_req: Request, res: Response) => {
    store = buildInitialStore();
    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();
    return res.json({ success: true, message: 'Dati di esempio ripristinati con successo' });
  });

  // 10. Reset to clean template "in bianco" (ready for GitHub publish & customization)
  app.post('/api/reset-blank', (_req: Request, res: Response) => {
    const today = new Date().toISOString().split('T')[0];
    const threeMonthsLater = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

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
          subcategories: [],
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

    store = blankStore;
    syncActiveListProducts(store);
    saveStore(store);
    broadcastUpdate();
    return res.json({ success: true, message: 'Portale azzerato a versione in bianco pronta da personalizzare' });
  });

  // Mount Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FarmaCromia] Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal error starting FarmaCromia server:', err);
  process.exit(1);
});
