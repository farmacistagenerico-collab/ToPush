/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Dati "seme" di FarmaCromia, condivisi da:
 *  - `server.ts`                (backend Express, modalità full-stack locale)
 *  - `src/services/localBackend.ts` (modalità statica su GitHub Pages)
 *
 * Mantenere un'unica fonte di verità evita che la demo pubblicata su Pages
 * e quella servita dal backend divergano nel tempo.
 */
import type { CustomList, PharmacyStore, ProductItem, Subcategory, TrafficLightColor } from '../types';

/** Sottocategorie demo della lista «Consiglio Autunno/Inverno». */
export const AUTUNNO_SUBCATEGORIES: Subcategory[] = [
  { id: 'sub-tosse-gola', name: 'Tosse & Gola' },
  { id: 'sub-difese', name: 'Difese Immunitarie' },
  { id: 'sub-energia', name: 'Energia & Sonno' },
  { id: 'sub-pelle', name: 'Pelle & Freddo' },
  { id: 'sub-occhi', name: 'Occhi & Benessere' },
];

/** Sottocategorie demo della lista «Focus Antibiotici & Terapie Gastriche». */
export const ANTIBIOTICI_SUBCATEGORIES: Subcategory[] = [
  { id: 'sub-fermenti', name: 'Fermenti Vivi' },
  { id: 'sub-gastro', name: 'Gastroprotezione' },
];

/** Assegnazione demo prodotto -> sottocategoria (per id prodotto). */
const PRODUCT_SUBCATEGORY: Record<string, string> = {
  'prod-001': 'sub-difese',
  'prod-002': 'sub-difese',
  'prod-003': 'sub-energia',
  'prod-004': 'sub-pelle',
  'prod-005': 'sub-occhi',
  'prod-006': 'sub-tosse-gola',
  'prod-007': 'sub-energia',
  'anti-001': 'sub-fermenti',
  'anti-002': 'sub-gastro',
};

/**
 * Assegna la sottocategoria demo ai prodotti che non ne hanno una.
 * Usato dalle factory qui sotto; i dati creati dall'utente restano intatti.
 */
export function applySubcategoryDefaults(products: ProductItem[]): ProductItem[] {
  products.forEach((p) => {
    if (p.subcategoryId === undefined) {
      p.subcategoryId = PRODUCT_SUBCATEGORY[p.id] ?? null;
    }
  });
  return products;
}

export const DEFAULT_AUTUNNO_PRODUCTS: ProductItem[] = [
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

export const DEFAULT_ANTIBIOTICI_PRODUCTS: ProductItem[] = [
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

export const INITIAL_LISTS: CustomList[] = [
  {
    id: 'list-autunno-inverno',
    name: 'Consiglio Autunno/Inverno',
    description: 'Focus su difese immunitarie, integratori per stanchezza da cambio stagione, fermenti per terapie antibiotiche e protezione pelle dal freddo.',
    periodType: 'seasonal',
    startDate: '2026-10-01',
    endDate: '2027-02-28',
    isActive: true,
    products: DEFAULT_AUTUNNO_PRODUCTS,
    subcategories: AUTUNNO_SUBCATEGORIES,
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
    subcategories: ANTIBIOTICI_SUBCATEGORIES,
    createdAt: new Date().toISOString(),
    lastModified: new Date().toISOString(),
  },
];

export const INITIAL_STORE: PharmacyStore = {
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

const DEMO_LIST_SUBCATEGORIES: Record<string, Subcategory[]> = {
  'list-autunno-inverno': AUTUNNO_SUBCATEGORIES,
  'list-focus-antibiotici': ANTIBIOTICI_SUBCATEGORIES,
};

/**
 * Se una lista salvata è ancora quella DEMO (id lista e id prodotti coincidono
 * con i dati di esempio), le riaggancia sottocategorie e assegnazioni demo.
 * I dati reali degli utenti (liste o prodotti propri) restano intatti.
 */
export function hydrateDemoSubcategories(list: CustomList): void {
  const demoSubs = DEMO_LIST_SUBCATEGORIES[list.id];
  if (!demoSubs) return;
  const isDemoProducts =
    list.products.length > 0 && list.products.every((p) => p.id in PRODUCT_SUBCATEGORY);
  if (!isDemoProducts) return;
  if (!Array.isArray(list.subcategories) || list.subcategories.length === 0) {
    list.subcategories = clone(demoSubs);
  }
  // Assegnazione forzata SOLO se i prodotti non sono mai stati assegnati
  // (migrazione da formato vecchio). Se anche uno solo ha una sottocategoria,
  // significa che l'utente ha già organizzato la lista: non la tocchiamo.
  const neverAssigned = list.products.every((p) => !p.subcategoryId);
  if (neverAssigned) {
    list.products.forEach((p) => {
      p.subcategoryId = PRODUCT_SUBCATEGORY[p.id] ?? null;
    });
  }
}

/** Soglie del semaforo cromatico: identiche a quelle del backend Express. */
export function computeAutoColor(current: number, target: number): TrafficLightColor {
  if (target <= 0) return 'green';
  const ratio = current / target;
  if (ratio >= 0.95) return 'green';
  if (ratio >= 0.7) return 'yellow';
  if (ratio >= 0.35) return 'orange';
  return 'red';
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stamp(dateIso: string) {
  return dateIso;
}

/** Prodotti della lista demo "Consiglio Autunno/Inverno" (copia profonda). */
export function buildDefaultAutunnoProducts(): ProductItem[] {
  const products = applySubcategoryDefaults(clone(DEFAULT_AUTUNNO_PRODUCTS));
  const now = new Date().toISOString();
  products.forEach((p) => {
    p.lastUpdated = stamp(now);
  });
  return products;
}

/** Prodotti della lista demo "Focus Antibiotici & Terapie Gastriche" (copia profonda). */
export function buildDefaultAntibioticiProducts(): ProductItem[] {
  const products = applySubcategoryDefaults(clone(DEFAULT_ANTIBIOTICI_PRODUCTS));
  const now = new Date().toISOString();
  products.forEach((p) => {
    p.lastUpdated = stamp(now);
  });
  return products;
}

/** Le tre liste demo di partenza (copia profonda, con prodotti indipendenti). */
export function buildInitialLists(): CustomList[] {
  const lists = clone(INITIAL_LISTS);
  const now = new Date().toISOString();
  lists.forEach((list) => {
    list.createdAt = now;
    list.lastModified = now;
    if (!Array.isArray(list.subcategories)) list.subcategories = [];
    applySubcategoryDefaults(list.products);
    list.products.forEach((p) => {
      p.lastUpdated = now;
    });
  });
  return lists;
}

/** Stato iniziale completo dell'applicazione (copia profonda, date rigenerate). */
export function buildInitialStore(): PharmacyStore {
  const lists = buildInitialLists();
  const active = lists.find((l) => l.id === INITIAL_STORE.activeListId) || lists[0];
  return {
    pharmacyName: INITIAL_STORE.pharmacyName,
    activeListId: active.id,
    lists,
    config: {
      ...clone(INITIAL_STORE.config),
      title: active.name,
      periodType: active.periodType,
      startDate: active.startDate,
      endDate: active.endDate,
      notes: active.description,
    },
    products: active.products,
    historyLog: [],
    managerPinHash: null,
  };
}
