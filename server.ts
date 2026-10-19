import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';

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
  lastUpdated: string;
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
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'pharmacy_store.json');

const DEFAULT_AUTUNNO_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-001',
    name: 'FlorBio Fermenti Vivi 12 Flaconcini',
    brand: 'BioFarma',
    category: 'Fermenti & Digestione',
    sku: 'FLOR-12',
    adviceTrigger: 'Ogni volta che viene prescritto o richiesto un ANTIBIOTICO, o per gonfiore e disbiosi',
    crossSellSuggestions: ['Antibiotici orali', 'Antinfiammatori FANS', 'Disturbi da viaggio'],
    sellingPoints: [
      '5 miliardi di fermenti tindalizzati + Vitamine Gruppo B',
      'Gusto gradevole arancia, si assume anche a stomaco vuoto',
      'Resiste all acidità gastrica senza refrigerazione'
    ],
    color: 'red',
    targetQuantity: 40,
    currentQuantity: 6,
    batchExpiry: '11/2026 (Scorte elevate)',
    priorityReason: 'Giacenza elevata in arrivo dal distributore con accordo speciale',
    notesForStaff: 'Priorità massima di reparto: consigliare sistematicamente con tutte le ricette antibiotiche.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    name: 'Immunotop Defense C + Zinco + Echinacea',
    brand: 'PharmaNature',
    category: 'Difese & Vitamine',
    sku: 'IMMU-30',
    adviceTrigger: 'Pazienti affaticati, primi freddi, richiesta di antinfiammatori o antipiretici',
    crossSellSuggestions: ['Paracetamolo', 'Decongestionanti nasali', 'Sciroppi tosse'],
    sellingPoints: [
      'Tripla azione sinergica ad alto dosaggio (1000mg Vitamina C)',
      'Compresse effervescenti al gusto agrumi, rapido assorbimento',
      'Con estratto titolato di Echinacea Purpurea'
    ],
    color: 'red',
    targetQuantity: 35,
    currentQuantity: 8,
    batchExpiry: '02/2027',
    priorityReason: 'Accordo commerciale stagionale con marginalità strategica',
    notesForStaff: 'Proponilo a chi acquista prodotti per il raffreddore per velocizzare il recupero.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    name: 'Magnesio + Potassio Fast Bustine',
    brand: 'Equilibrio Sanitas',
    category: 'Integratori & Energia',
    sku: 'MAGN-24',
    adviceTrigger: 'Persone che lamentano stanchezza mattutina, crampi notturni o cambio stagione',
    crossSellSuggestions: ['Pazienti ipertesi in terapia con diuretici', 'Sportivi', 'Over 65'],
    sellingPoints: [
      'Zero zuccheri aggiunti, ideale anche per diabetici',
      'Magnesio chelato bisglicinato a tolleranza gastrica ottimale',
      'Azione rapida contro la spossatezza muscolare'
    ],
    color: 'orange',
    targetQuantity: 30,
    currentQuantity: 14,
    batchExpiry: '06/2027',
    priorityReason: 'Rotazione regolare consigliata',
    notesForStaff: 'Ottimo abbinamento con diuretici o per chi chiede qualcosa contro la debolezza.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    name: 'Ceramidi Lipid Crema Barriera 150ml',
    brand: 'DermoDerma Lab',
    category: 'Dermocosmesi & Pelle',
    sku: 'DERM-150',
    adviceTrigger: 'Richiesta di creme cortisoniche, dermatite secca, disidratazione mani dal freddo',
    crossSellSuggestions: ['Corticosteroidi topici', 'Antistaminici', 'Saponi mani frequenti'],
    sellingPoints: [
      'Ripristina la barriera lipidica cutanea con 3 ceramidi essenziali',
      'Texture nutriente non unta, priva di profumo e conservanti irritanti',
      'Consigliata per adulti e pelli atopiche pediatriche'
    ],
    color: 'orange',
    targetQuantity: 25,
    currentQuantity: 11,
    batchExpiry: '08/2027',
    priorityReason: 'Focus dermocosmetico stagionale',
    notesForStaff: 'Abbinamento ideale quando dispensate idrocortisone per prolungare il benessere cutaneo.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    name: 'OcuRelief Gocce Oculari Idratanti 10ml',
    brand: 'VisioCare',
    category: 'Oculare & Benessere',
    sku: 'OCU-10',
    adviceTrigger: 'Occhi rossi da videoterminale, colliri decongestionanti vasocostrittori',
    crossSellSuggestions: ['Colliri generici', 'Antistaminici orali', 'Lavoratori al computer'],
    sellingPoints: [
      'Acido ialuronico 0.2% sterile senza conservanti',
      'Flacone pluridose brevettato con sistema OSD anti-contaminazione',
      'Compatibile con lenti a contatto a permanenza'
    ],
    color: 'yellow',
    targetQuantity: 20,
    currentQuantity: 16,
    batchExpiry: '01/2028',
    priorityReason: 'Vicino all obiettivo prefissato',
    notesForStaff: 'Siamo quasi al traguardo! Ancora pochi consigli e possiamo considerarlo saturato.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-006',
    name: 'Sedatol Gola Spray Barriera Mucoadesivo',
    brand: 'ErbaSanitas',
    category: 'Vie Respiratorie',
    sku: 'GOLA-30',
    adviceTrigger: 'Mal di gola iniziale, bruciore alla deglutizione, fumatori o raucedine',
    crossSellSuggestions: ['Sciroppi mucolitici', 'Pastiglie balsamiche', 'Collutori'],
    sellingPoints: [
      'Propoli decerata idrodispersibile + Aloe gel protettivo',
      'Nebulizzatore orientabile preciso per il retrofaringe',
      'Non brucia la mucosa infiammata'
    ],
    color: 'yellow',
    targetQuantity: 25,
    currentQuantity: 21,
    batchExpiry: '12/2027',
    priorityReason: 'Ultimo sprint per chiudere il lotto stagionale',
    notesForStaff: 'Ultimi pezzi della campagna, ottimo per chi cerca una soluzione naturale efficace.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'prod-007',
    name: 'Melatonina Crono 1mg Notte Rilassata',
    brand: 'SomnoLab',
    category: 'Integratori & Energia',
    sku: 'MEL-60',
    adviceTrigger: 'Difficoltà ad addormentarsi, risvegli notturni o ansia da cambio ora',
    crossSellSuggestions: ['Tisane rilassanti', 'Ansiolitici su ricetta (inquadramento)', 'Magnesio'],
    sellingPoints: [
      'Rilascio bifasico: immediato 0.5mg per sonno rapido + ritardato 0.5mg per sonno continuo',
      'Con Escolzia e Passiflora titolate',
      'Non crea assuefazione o intontimento mattutino'
    ],
    color: 'green',
    targetQuantity: 30,
    currentQuantity: 31,
    batchExpiry: '04/2028',
    priorityReason: 'Obiettivo completato con successo!',
    notesForStaff: 'TRAGUARDO RAGGIUNTO! Ottimo lavoro di squadra. Consigliare solo su esplicita richiesta del cliente.',
    lastUpdated: new Date().toISOString(),
  },
];

const DEFAULT_ANTIBIOTICI_PRODUCTS: ProductItem[] = [
  {
    id: 'anti-001',
    name: 'ProbioForte 20 Miliardi Bustine',
    brand: 'MicroBioLab',
    category: 'Fermenti & Digestione',
    sku: 'PRO-20B',
    adviceTrigger: 'Prescrizioni di Amoxicillina/Clavulanico, Ciprofloxacina o Azitromicina',
    crossSellSuggestions: ['Antibiotici sistemici', 'Pazienti anziani'],
    sellingPoints: ['20 miliardi UFC di 4 ceppi gastroresistenti', 'Arricchito con Zinco e FOS'],
    color: 'red',
    targetQuantity: 50,
    currentQuantity: 12,
    batchExpiry: '10/2027',
    priorityReason: 'Abbinamento essenziale per prevenire la diarrea da antibiotico',
    notesForStaff: 'Consigliare tassativamente: assumere a 3 ore di distanza dall antibiotico.',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'anti-002',
    name: 'GastroRepair Gel Mucoadesivo Bustine',
    brand: 'MedSanitas',
    category: 'Fermenti & Digestione',
    sku: 'GAS-20',
    adviceTrigger: 'Pazienti con prescrizione di FANS (Ibuprofene, Ketoprofene) o bruciore di stomaco',
    crossSellSuggestions: ['Antinfiammatori', 'Antidolorifici'],
    sellingPoints: ['Effetto zattera con alginato e mucillagini', 'Sollievo in 3 minuti'],
    color: 'orange',
    targetQuantity: 30,
    currentQuantity: 10,
    batchExpiry: '05/2027',
    priorityReason: 'Protezione naturale dello stomaco senza alterare il pH gastrico',
    notesForStaff: 'Ideale per chi assume antinfiammatori per diversi giorni.',
    lastUpdated: new Date().toISOString(),
  },
];

const INITIAL_LISTS: CustomList[] = [
  {
    id: 'list-autunno-inverno',
    name: 'Consiglio Autunno/Inverno',
    description: 'Focus su difese immunitarie, integratori per stanchezza da cambio stagione, fermenti per terapie antibiotiche e protezione pelle dal freddo.',
    periodType: 'seasonal',
    startDate: '2026-10-01',
    endDate: '2027-02-28',
    isActive: true,
    products: DEFAULT_AUTUNNO_PRODUCTS,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
  {
    id: 'list-focus-antibiotici',
    name: 'Focus Antibiotici & Terapie Gastriche',
    description: 'Campagna specifica per affiancare probiotici ad alta concentrazione a ogni ricetta medica antibiotica o antinfiammatoria.',
    periodType: 'monthly',
    startDate: '2026-10-15',
    endDate: '2026-11-15',
    isActive: false,
    products: DEFAULT_ANTIBIOTICI_PRODUCTS,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
];

const INITIAL_STORE: PharmacyStore = {
  pharmacyName: 'Farmacia Centrale San Rocco',
  activeListId: 'list-autunno-inverno',
  lists: INITIAL_LISTS,
  config: {
    id: 'camp-2026-curr',
    title: 'Consiglio Autunno/Inverno',
    periodType: 'seasonal',
    startDate: '2026-10-01',
    endDate: '2027-02-28',
    pharmacyName: 'Farmacia Centrale San Rocco',
    notes: 'Focus speciale su prevenzione stagionale, fermenti con antibiotico e rotazione scorte di magazzino.',
  },
  products: DEFAULT_AUTUNNO_PRODUCTS,
  historyLog: [],
};

function ensureDataFile(): PharmacyStore {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_FILE)) {
      fs.writeFileSync(STORE_FILE, JSON.stringify(INITIAL_STORE, null, 2), 'utf-8');
      return INITIAL_STORE;
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
        products: parsed.products || DEFAULT_AUTUNNO_PRODUCTS,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      parsed.lists = [activeList, ...INITIAL_LISTS.filter(l => l.id !== 'list-autunno-inverno')];
      parsed.activeListId = activeList.id;
      parsed.pharmacyName = parsed.config?.pharmacyName || 'Farmacia Centrale San Rocco';
    }

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

    return parsed;
  } catch (err) {
    console.error('Error reading store file, falling back to initial data:', err);
    return INITIAL_STORE;
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

export function computeAutoColor(current: number, target: number): TrafficLightColor {
  if (target <= 0) return 'green';
  const ratio = current / target;
  if (ratio >= 0.95) return 'green';
  if (ratio >= 0.70) return 'yellow';
  if (ratio >= 0.35) return 'orange';
  return 'red';
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
      initialProducts = JSON.parse(JSON.stringify(DEFAULT_AUTUNNO_PRODUCTS));
    } else if (template === 'antibiotici') {
      initialProducts = JSON.parse(JSON.stringify(DEFAULT_ANTIBIOTICI_PRODUCTS));
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

  // 9. Reset to default demo data
  app.post('/api/reset-demo', (_req: Request, res: Response) => {
    store = JSON.parse(JSON.stringify(INITIAL_STORE));
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
