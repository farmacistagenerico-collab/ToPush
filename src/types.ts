export type TrafficLightColor = 'red' | 'orange' | 'yellow' | 'green';

/** Cadenza di una lista/campagna. Allineato con `server.ts`. */
export type PeriodType = 'weekly' | 'biweekly' | 'monthly' | 'seasonal';

/**
 * Sottocategoria di una lista (es. «Tosse & Gola», «Difese Immunitarie»).
 * Vive DENTRO la lista che la definisce: ogni lista ha le proprie.
 */
export interface Subcategory {
  id: string;
  name: string;
}

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
  /** Sottocategoria della lista a cui il prodotto appartiene (null = nessuna). */
  subcategoryId?: string | null;
  /** Foto del prodotto (data-url compressa) o null se assente. */
  imageUrl?: string | null;
}

export interface CampaignConfig {
  id: string;
  title: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  pharmacyName: string;
  notes: string;
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

export interface CustomList {
  id: string;
  name: string;
  description: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  isActive: boolean;
  products: ProductItem[];
  subcategories: Subcategory[];
  createdAt: string;
  lastModified: string;
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

export interface ColorMeta {
  color: TrafficLightColor;
  label: string;
  sublabel: string;
  description: string;
  bgBadge: string;
  textBadge: string;
  borderBadge: string;
  glowClass: string;
  dotBg: string;
  ringClass: string;
}

export const COLOR_METAS: Record<TrafficLightColor, ColorMeta> = {
  red: {
    color: 'red',
    label: 'Priorità Assoluta',
    sublabel: 'Consiglio Primario (Da smaltire subito)',
    description: 'Prodotti con giacenze elevate, accordi speciali o scadenze ravvicinate. Da proporre sistematicamente al banco.',
    bgBadge: 'bg-rose-50 text-rose-700 border-rose-200',
    textBadge: 'text-rose-700',
    borderBadge: 'border-rose-300',
    glowClass: 'shadow-rose-100 border-rose-200 hover:border-rose-400',
    dotBg: 'bg-rose-600',
    ringClass: 'ring-rose-500/20',
  },
  orange: {
    color: 'orange',
    label: 'In Consiglio Attivo',
    sublabel: 'Da consigliare con continuità',
    description: 'Prodotti al centro della strategia di reparto. Da proporre in associazione alle richieste o ai sintomi del cliente.',
    bgBadge: 'bg-amber-50 text-amber-800 border-amber-200',
    textBadge: 'text-amber-800',
    borderBadge: 'border-amber-300',
    glowClass: 'shadow-amber-100 border-amber-200 hover:border-amber-400',
    dotBg: 'bg-amber-500',
    ringClass: 'ring-amber-500/20',
  },
  yellow: {
    color: 'yellow',
    label: 'Quasi al Traguardo',
    sublabel: 'Vicini all’obiettivo prefissato',
    description: 'Rotazione a buon punto. Ultimo sprint di consigli per completare la saturazione del lotto.',
    bgBadge: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    textBadge: 'text-yellow-800',
    borderBadge: 'border-yellow-300',
    glowClass: 'shadow-yellow-100 border-yellow-200 hover:border-yellow-400',
    dotBg: 'bg-yellow-500',
    ringClass: 'ring-yellow-500/20',
  },
  green: {
    color: 'green',
    label: 'Traguardo Raggiunto',
    sublabel: 'Obiettivo centrato con successo',
    description: 'Missione compiuta! Le scorte critiche sono state smaltite. Non serve forzare ulteriormente il consiglio.',
    bgBadge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    textBadge: 'text-emerald-800',
    borderBadge: 'border-emerald-300',
    glowClass: 'shadow-emerald-100 border-emerald-200 hover:border-emerald-400',
    dotBg: 'bg-emerald-600',
    ringClass: 'ring-emerald-500/20',
  },
};
