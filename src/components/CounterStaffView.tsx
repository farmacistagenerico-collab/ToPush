import React, { useState, useMemo } from 'react';
import { ProductItem, Subcategory, TrafficLightColor, COLOR_METAS, CampaignConfig } from '../types';
import { ProductCard } from './ProductCard';
import { SimpleProductList } from './SimpleProductList';
import { Search, Sparkles, Filter, RefreshCw, X, Shield, BookOpen, AlertTriangle, LayoutGrid, List } from 'lucide-react';

interface CounterStaffViewProps {
  products: ProductItem[];
  subcategories: Subcategory[];
  config: CampaignConfig;
  onRecommend: (productId: string) => Promise<void>;
  onOpenCrossSelling: () => void;
  onOpenMethodExplainer: () => void;
}

export const CounterStaffView: React.FC<CounterStaffViewProps> = ({
  products,
  subcategories,
  config,
  onRecommend,
  onOpenCrossSelling,
  onOpenMethodExplainer,
}) => {
  const [selectedColor, setSelectedColor] = useState<TrafficLightColor | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    return (localStorage.getItem('farmacromia_view_mode') as 'grid' | 'list') || 'list';
  });

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('farmacromia_view_mode', mode);
  };

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Sottocategorie con almeno un prodotto (le aree vuote non affollano il banco)
  const visibleSubs = useMemo(() => {
    return subcategories.filter((sub) => products.some((p) => p.subcategoryId === sub.id));
  }, [subcategories, products]);

  const hasUnassigned = useMemo(
    () => products.some((p) => !p.subcategoryId),
    [products]
  );

  // Se la lista cambia e la sottocategoria selezionata non esiste più, torna a «tutte»
  const effectiveSub =
    selectedSub === 'all' || selectedSub === 'none' || subcategories.some((s) => s.id === selectedSub)
      ? selectedSub
      : 'all';

  // Color distribution summary (for staff visual awareness)
  const colorCounts = useMemo(() => {
    const counts = { red: 0, orange: 0, yellow: 0, green: 0 };
    products.forEach((p) => {
      if (p.color in counts) {
        counts[p.color]++;
      }
    });
    return counts;
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      // Color filter
      if (selectedColor !== 'all' && item.color !== selectedColor) return false;

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

      // Subcategory filter
      if (effectiveSub === 'none' && item.subcategoryId) return false;
      if (effectiveSub !== 'all' && effectiveSub !== 'none' && item.subcategoryId !== effectiveSub) {
        return false;
      }

      // Search query (case-insensitive across name, adviceTrigger, crossSellSuggestions, category, brand)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const inName = item.name.toLowerCase().includes(query);
        const inBrand = item.brand.toLowerCase().includes(query);
        const inCat = item.category.toLowerCase().includes(query);
        const inTrigger = item.adviceTrigger.toLowerCase().includes(query);
        const inCrossSell = item.crossSellSuggestions.some((s) => s.toLowerCase().includes(query));
        const inSellingPoints = item.sellingPoints.some((p) => p.toLowerCase().includes(query));
        return inName || inBrand || inCat || inTrigger || inCrossSell || inSellingPoints;
      }

      return true;
    });
  }, [products, selectedColor, selectedCategory, effectiveSub, searchQuery]);

  const renderProductBlock = (items: ProductItem[]) =>
    viewMode === 'list' ? (
      <SimpleProductList products={items} onRecommend={onRecommend} />
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} onRecommend={onRecommend} />
        ))}
      </div>
    );

  /** Con «Tutte le aree» i prodotti sono raggruppati sotto titoli di sottocategoria. */
  const renderProducts = (items: ProductItem[], grouped: boolean) => {
    if (!grouped) return renderProductBlock(items);

    const groups: { key: string; title: string; items: ProductItem[] }[] = visibleSubs
      .map((sub) => ({
        key: sub.id,
        title: sub.name,
        items: items.filter((p) => p.subcategoryId === sub.id),
      }))
      .filter((g) => g.items.length > 0);

    const unassigned = items.filter((p) => !p.subcategoryId);
    if (unassigned.length > 0) {
      groups.push({ key: 'none', title: 'Senza sottocategoria', items: unassigned });
    }

    return (
      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.key} className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="h-4 w-1 rounded-full bg-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                {group.title}
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">{group.items.length}</span>
            </div>
            {renderProductBlock(group.items)}
          </section>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Pharmacy Status Banner */}
      <section className="bg-white rounded-xl border border-slate-200 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>{config.pharmacyName}</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-500 capitalize">
                Ciclo {config.periodType === 'weekly' ? 'Settimanale' : config.periodType === 'biweekly' ? 'Bisettimanale' : 'Mensile'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Semaforo del Banco & Consiglio
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Nessun numero o quota da calcolare: orientati con i colori. Proponi i prodotti con colore ad alta priorità per ottimizzare la rotazione scorte e offrire un consiglio mirato.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onOpenCrossSelling}
              className="px-3.5 py-2 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Prontuario Cross-Selling</span>
            </button>
            <button
              onClick={onOpenMethodExplainer}
              className="px-3.5 py-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Legenda Colori</span>
            </button>
          </div>
        </div>

        {/* Chromatic Segmented Visual Filter Bar */}
        <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-2">
          {/* All */}
          <button
            onClick={() => setSelectedColor('all')}
            className={`p-3 rounded-lg border text-left transition-all ${
              selectedColor === 'all'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">
              Tutti i Prodotti
            </div>
            <div className="text-base font-bold mt-0.5">
              {products.length} in elenco
            </div>
          </button>

          {/* Red */}
          <button
            onClick={() => setSelectedColor('red')}
            className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden ${
              selectedColor === 'red'
                ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/30'
                : 'bg-white border-slate-200 hover:border-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-rose-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
              <span>Priorità Massima</span>
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              Consiglio Primario
            </div>
            <div className="text-[11px] text-slate-500">
              {colorCounts.red} referenze
            </div>
          </button>

          {/* Orange */}
          <button
            onClick={() => setSelectedColor('orange')}
            className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden ${
              selectedColor === 'orange'
                ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/30'
                : 'bg-white border-slate-200 hover:border-amber-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>In Consiglio</span>
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              Proposta Attiva
            </div>
            <div className="text-[11px] text-slate-500">
              {colorCounts.orange} referenze
            </div>
          </button>

          {/* Yellow */}
          <button
            onClick={() => setSelectedColor('yellow')}
            className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden ${
              selectedColor === 'yellow'
                ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-500/30'
                : 'bg-white border-slate-200 hover:border-yellow-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-yellow-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <span>Quasi al Fine</span>
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              Verso Traguardo
            </div>
            <div className="text-[11px] text-slate-500">
              {colorCounts.yellow} referenze
            </div>
          </button>

          {/* Green */}
          <button
            onClick={() => setSelectedColor('green')}
            className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden col-span-2 sm:col-span-1 ${
              selectedColor === 'green'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/30'
                : 'bg-white border-slate-200 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-1.5 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Raggiunto</span>
            </div>
            <div className="text-sm font-semibold text-slate-900 mt-1">
              Target Centrato
            </div>
            <div className="text-[11px] text-slate-500">
              {colorCounts.green} completati
            </div>
          </button>
        </div>
      </section>

      {/* Subcategory filter chips (criterio primario di consiglio) */}
      {visibleSubs.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 shrink-0 pr-1">
            Aree di consiglio
          </span>
          <button
            onClick={() => setSelectedSub('all')}
            className={`px-3.5 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors border ${
              effectiveSub === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200'
            }`}
          >
            Tutte le aree
          </button>
          {visibleSubs.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSub(sub.id)}
              className={`px-3.5 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-colors border ${
                effectiveSub === sub.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-200'
              }`}
            >
              {sub.name}
            </button>
          ))}
          {hasUnassigned && (
            <button
              onClick={() => setSelectedSub('none')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-colors border border-dashed ${
                effectiveSub === 'none'
                  ? 'bg-slate-700 text-white border-slate-700'
                  : 'bg-white border-slate-300 text-slate-500 hover:bg-slate-50'
              }`}
            >
              Senza area
            </button>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Fast Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca per sintomo (es. antibiotico, tosse, stanchezza), prodotto o reparto..."
            className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-slate-900 placeholder:text-slate-400 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              title="Cancella ricerca"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Horizontal Filter & View Mode Switcher */}
        <div className="flex items-center justify-between sm:justify-start gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Tutti i Reparti
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Lista Semplice vs Schede */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/80 shrink-0 ml-auto sm:ml-2">
            <button
              onClick={() => handleSetViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Modalità Visuale Semplice Solo Lista (ad alta densità per il banco)"
            >
              <List className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Solo Lista</span>
            </button>
            <button
              onClick={() => handleSetViewMode('grid')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Modalità Schede Dettagliate"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Schede</span>
            </button>
          </div>
        </div>
      </div>

      {/* Products Display (Simple List or Detailed Cards) */}
      {products.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-300 p-8 sm:p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 mx-auto flex items-center justify-center mb-4 shadow-xs">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Lista in Bianco Pronta da Personalizzare
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
            Il portale è pronto per la tua farmacia! Questa lista non contiene ancora referenze. Passa all'<strong>Area Titolare</strong> per caricare il tuo file dal gestionale (CSV) o inserire i primi prodotti con i relativi semafori.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={onOpenMethodExplainer}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Come Funziona il Semaforo
            </button>
          </div>
        </div>
      ) : filteredProducts.length > 0 ? (
        renderProducts(filteredProducts, effectiveSub === 'all' && visibleSubs.length > 0)
      ) : (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Nessun prodotto trovato
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Nessun articolo corrisponde ai filtri selezionati (colore, reparto o parola chiave).
          </p>
          <button
            onClick={() => {
              setSelectedColor('all');
              setSelectedCategory('all');
              setSelectedSub('all');
              setSearchQuery('');
            }}
            className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            Azzera tutti i filtri
          </button>
        </div>
      )}
    </div>
  );
};
