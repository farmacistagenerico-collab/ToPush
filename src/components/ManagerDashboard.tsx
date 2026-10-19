import React, { useState } from 'react';
import { ProductItem, CampaignConfig, CustomList, TrafficLightColor, COLOR_METAS, HistoryLogEntry } from '../types';
import {
  Plus,
  Upload,
  Calendar,
  Layers,
  Trash2,
  Edit2,
  Check,
  RotateCcw,
  Sparkles,
  Download,
  AlertCircle,
  FileSpreadsheet,
  Clock,
  ArrowRight,
  Copy,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';

interface ManagerDashboardProps {
  products: ProductItem[];
  config: CampaignConfig;
  lists: CustomList[];
  activeListId: string;
  historyLog: HistoryLogEntry[];
  onAddProduct: (prod: Partial<ProductItem>) => Promise<void>;
  onUpdateProduct: (id: string, data: Partial<ProductItem>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onBatchImport: (items: Partial<ProductItem>[], replace: boolean) => Promise<void>;
  onUpdateCampaign: (data: Partial<CampaignConfig>) => Promise<void>;
  onResetDemo: () => Promise<void>;
  onResetBlank: () => Promise<void>;
  onActivateList: (id: string) => Promise<void>;
  onRenameList: (id: string, newName: string) => Promise<void>;
  onDuplicateList: (id: string) => Promise<void>;
  onDeleteList: (id: string) => Promise<void>;
  onOpenCreateListModal: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  products,
  config,
  lists,
  activeListId,
  historyLog,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBatchImport,
  onUpdateCampaign,
  onResetDemo,
  onResetBlank,
  onActivateList,
  onRenameList,
  onDuplicateList,
  onDeleteList,
  onOpenCreateListModal,
}) => {
  const [activeTab, setActiveTab] = useState<'lists' | 'products' | 'import' | 'campaign' | 'history'>('products');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editingListName, setEditingListName] = useState('');

  // New Product Form State
  const [formData, setFormData] = useState<Partial<ProductItem>>({
    name: '',
    brand: '',
    category: 'Integratori & Vitamine',
    sku: '',
    adviceTrigger: '',
    crossSellSuggestions: [''],
    sellingPoints: [''],
    color: 'red',
    targetQuantity: 30,
    currentQuantity: 0,
    batchExpiry: '',
    priorityReason: 'Giacenza magazzino da smaltire',
    notesForStaff: '',
  });

  // Batch Import Raw Text State
  const [batchText, setBatchText] = useState('');
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Campaign Form State
  const [campaignTitle, setCampaignTitle] = useState(config.title);
  const [periodType, setPeriodType] = useState<CampaignConfig['periodType']>(config.periodType);
  const [startDate, setStartDate] = useState(config.startDate);
  const [endDate, setEndDate] = useState(config.endDate);
  const [pharmacyName, setPharmacyName] = useState(config.pharmacyName);
  const [campaignNotes, setCampaignNotes] = useState(config.notes);
  const [campaignSaved, setCampaignSaved] = useState(false);

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateCampaign({
      title: campaignTitle,
      periodType,
      startDate,
      endDate,
      pharmacyName,
      notes: campaignNotes,
    });
    setCampaignSaved(true);
    setTimeout(() => setCampaignSaved(false), 2000);
  };

  const handleQuickColorToggle = async (productId: string, newColor: TrafficLightColor) => {
    await onUpdateProduct(productId, { color: newColor });
  };

  const handleSubmitNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, formData);
      setEditingProduct(null);
    } else {
      await onAddProduct(formData);
    }

    setShowAddModal(false);
    // Reset form
    setFormData({
      name: '',
      brand: '',
      category: 'Integratori & Vitamine',
      sku: '',
      adviceTrigger: '',
      crossSellSuggestions: [''],
      sellingPoints: [''],
      color: 'red',
      targetQuantity: 30,
      currentQuantity: 0,
      batchExpiry: '',
      priorityReason: 'Giacenza magazzino da smaltire',
      notesForStaff: '',
    });
  };

  const handleStartEdit = (prod: ProductItem) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      brand: prod.brand,
      category: prod.category,
      sku: prod.sku,
      adviceTrigger: prod.adviceTrigger,
      crossSellSuggestions: [...prod.crossSellSuggestions],
      sellingPoints: [...prod.sellingPoints],
      color: prod.color,
      targetQuantity: prod.targetQuantity,
      currentQuantity: prod.currentQuantity,
      batchExpiry: prod.batchExpiry || '',
      priorityReason: prod.priorityReason,
      notesForStaff: prod.notesForStaff,
    });
    setShowAddModal(true);
  };

  const handleBatchParseAndImport = async () => {
    if (!batchText.trim()) return;
    try {
      const lines = batchText.trim().split('\n');
      const items: Partial<ProductItem>[] = [];

      for (const line of lines) {
        if (!line.trim() || line.startsWith('#') || line.startsWith('Nome;')) continue;
        // Format supported: Nome; Marchio; Categoria; Trigger; Target; Colore; Motivo
        const parts = line.split(';').map((s) => s.trim());
        if (parts.length >= 1 && parts[0]) {
          const colorVal = (['red', 'orange', 'yellow', 'green'].includes(parts[5]?.toLowerCase())
            ? parts[5].toLowerCase()
            : 'red') as TrafficLightColor;

          items.push({
            name: parts[0],
            brand: parts[1] || 'Marchio Farmacia',
            category: parts[2] || 'Generale',
            adviceTrigger: parts[3] || 'Consiglia in abbinamento al banco',
            crossSellSuggestions: parts[3] ? [parts[3].split(',')[0]] : ['Consiglio attivo'],
            sellingPoints: ['Prodotto raccomandato dalla farmacia'],
            targetQuantity: parseInt(parts[4], 10) || 25,
            currentQuantity: 0,
            color: colorVal,
            priorityReason: parts[6] || 'Giacenza da far ruotare',
            notesForStaff: '',
          });
        }
      }

      if (items.length === 0) {
        setImportStatus('Nessun prodotto valido riconosciuto. Verifica il formato.');
        return;
      }

      await onBatchImport(items, replaceExisting);
      setImportStatus(`Successo: importati ${items.length} prodotti!`);
      setBatchText('');
      setTimeout(() => {
        setImportStatus(null);
        setActiveTab('products');
      }, 1500);
    } catch (err: any) {
      setImportStatus(`Errore durante l'importazione: ${err.message}`);
    }
  };

  const handleLoadSampleCSV = () => {
    const sample = `Nome; Marchio; Categoria; Trigger al Banco; Target; Colore; Motivo
KuraGola Propoli Forte; FarmLab; Vie Respiratorie; Con sciroppi o mal di gola; 35; red; Scorta elevata magazzino
DermoHydra Crema Mani 75ml; SkinCare Lab; Dermocosmesi; Mani screpolate o freddo; 40; red; Accordo commerciale 2+1
Calcio D3 Plus Compresse; PharmaVita; Integratori & Vitamine; Con terapie per osteoporosi o over 60; 25; orange; Rotazione stagionale
GastroProtect Gel Orale; MedSanitas; Fermenti & Digestione; Bruciore gastrico o FANS; 30; orange; Consiglio attivo
Collirio Euphrasia Rinfrescante; OculoVerde; Oculare; Occhi arrossati o stanchezza; 20; yellow; Verso traguardo
Vitamina C 1000 Masticabile; BioHealth; Difese & Vitamine; Prevenzione invernale; 50; green; Obiettivo raggiunto`;
    setBatchText(sample);
  };

  return (
    <div className="space-y-6">
      {/* Top Management Header */}
      <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Area Riservata Titolare & Direzione</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pannello Gestione Obiettivi & Giacenze
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Imposta qui la lista dei prodotti, le giacenze da smaltire e le priorità cromatiche. Il sistema trasforma automaticamente questi dati in semafori privi di numeri per lo staff al banco.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenCreateListModal}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <FolderPlus className="w-4 h-4 text-emerald-400" />
              <span>Nuova Lista</span>
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi Prodotto</span>
            </button>
            <button
              onClick={onResetBlank}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Azzera a versione in bianco pronta da personalizzare per GitHub"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              <span>In Bianco (Template)</span>
            </button>
            <button
              onClick={onResetDemo}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Ricarica prodotti e statistiche di esempio"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dati Demo</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-slate-200 -mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('lists')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'lists'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>Tutte le Liste ({lists.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Prodotti Lista Attiva ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'import'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Caricamento Massivo CSV / Gestionale</span>
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'campaign'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Configura Ciclo & Frequenza</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Log Rotazione Live ({historyLog.length})</span>
          </button>
        </div>
      </section>

      {/* TAB 0: ALL CUSTOM LISTS MANAGEMENT */}
      {activeTab === 'lists' && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Tutte le Liste della Farmacia ({lists.length})
              </h2>
              <p className="text-xs text-slate-500">
                Crea liste per ogni stagione o obiettivo (es. Consiglio Autunno/Inverno, Focus Antibiotici, Solari). La lista con il badge verde è quella attualmente visibile al banco.
              </p>
            </div>
            <button
              onClick={onOpenCreateListModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Crea Nuova Lista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lists.map((l) => {
              const isActive = l.id === activeListId;
              const isRenaming = editingListId === l.id;

              return (
                <div
                  key={l.id}
                  className={`bg-white rounded-xl border p-5 flex flex-col justify-between transition-all ${
                    isActive
                      ? 'border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            autoFocus
                            value={editingListName}
                            onChange={(e) => setEditingListName(e.target.value)}
                            className="px-2 py-1 text-sm font-bold border border-emerald-500 rounded focus:outline-none w-full"
                          />
                          <button
                            onClick={async () => {
                              if (editingListName.trim()) {
                                await onRenameList(l.id, editingListName.trim());
                              }
                              setEditingListId(null);
                            }}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-base font-bold text-slate-900 tracking-tight">
                            {l.name}
                          </h3>
                          <button
                            onClick={() => {
                              setEditingListId(l.id);
                              setEditingListName(l.name);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title="Rinomina lista"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {isActive && (
                        <span className="shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          Attiva
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {l.description || 'Nessuna descrizione specificata'}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <span className="font-semibold text-slate-700 capitalize">
                        {l.periodType === 'weekly'
                          ? 'Settimanale'
                          : l.periodType === 'biweekly'
                          ? 'Bisettimanale'
                          : l.periodType === 'monthly'
                          ? 'Mensile'
                          : 'Stagionale'}
                      </span>
                      <span>·</span>
                      <span>{l.products.length} referenze</span>
                      {l.startDate && (
                        <>
                          <span>·</span>
                          <span>Fino al {l.endDate}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* List Card Bottom Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isActive ? (
                      <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>In uso al banco</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onActivateList(l.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                      >
                        Attiva al Banco
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={async () => {
                          if (!isActive) await onActivateList(l.id);
                          setActiveTab('products');
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                        title="Vedi e gestisci i prodotti di questa lista"
                      >
                        Prodotti
                      </button>
                      <button
                        onClick={() => onDuplicateList(l.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors"
                        title="Duplica lista"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      {lists.length > 1 && (
                        <button
                          onClick={() => onDeleteList(l.id)}
                          className="p-1.5 text-rose-400 hover:text-rose-600 rounded-md transition-colors"
                          title="Elimina lista"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Create New List Placeholder Card */}
            <button
              onClick={onOpenCreateListModal}
              className="bg-slate-50/60 hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl p-6 flex flex-col items-center justify-center gap-2 text-center transition-all group min-h-[170px]"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 group-hover:border-emerald-300 text-slate-400 group-hover:text-emerald-600 flex items-center justify-center transition-colors shadow-2xs">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 block">
                  Crea Nuova Lista
                </span>
                <span className="text-[11px] text-slate-500">
                  Es. Consiglio Primavera, Focus Febbre, ecc.
                </span>
              </div>
            </button>
          </div>
        </section>
      )}

      {/* TAB 1: PRODUCTS INVENTORY TABLE */}
      {activeTab === 'products' && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/60 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">
                Gestione Priorità Cromatiche
              </span>
              <span className="ml-2 text-slate-500">
                Clicca direttamente sui cerchi colorati per cambiare all’istante il semaforo visibile al banco.
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Rosso (Priorità / Da far fuori)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Arancio (In consiglio)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Giallo (Quasi traguardo)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Verde (Raggiunto)
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Semaforo Banco</th>
                  <th className="py-3 px-4">Prodotto / Reparto</th>
                  <th className="py-3 px-4">Gancio al Banco</th>
                  <th className="py-3 px-4 text-right">Target Riservato</th>
                  <th className="py-3 px-4 text-right">Consigliati</th>
                  <th className="py-3 px-4 text-center">Avanzamento</th>
                  <th className="py-3 px-4">Motivo / Scadenza</th>
                  <th className="py-3 px-4 text-center">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((item) => {
                  const percent = item.targetQuantity > 0 ? Math.round((item.currentQuantity / item.targetQuantity) * 100) : 100;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Interactive Traffic Light switcher */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/60 w-fit">
                          {(['red', 'orange', 'yellow', 'green'] as TrafficLightColor[]).map((c) => (
                            <button
                              key={c}
                              onClick={() => handleQuickColorToggle(item.id, c)}
                              className={`w-5 h-5 rounded-full transition-transform ${COLOR_METAS[c].dotBg} ${
                                item.color === c ? 'scale-110 ring-2 ring-slate-800' : 'opacity-40 hover:opacity-80'
                              }`}
                              title={`Imposta come ${COLOR_METAS[c].label}`}
                            />
                          ))}
                        </div>
                      </td>

                      {/* Product details */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 leading-tight">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {item.brand} · <span className="text-slate-600">{item.category}</span>
                        </div>
                      </td>

                      {/* Advice Trigger */}
                      <td className="py-3 px-4 max-w-xs">
                        <p className="text-slate-700 line-clamp-2 leading-relaxed">
                          {item.adviceTrigger}
                        </p>
                      </td>

                      {/* Target pieces (internal) */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 font-semibold">
                        {item.targetQuantity} pz
                      </td>

                      {/* Current recommendations (internal) */}
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 font-bold">
                        {item.currentQuantity} pz
                      </td>

                      {/* Progress bar (manager view) */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span className="font-mono tabular-nums text-[11px] text-slate-600">
                            {percent}%
                          </span>
                        </div>
                      </td>

                      {/* Expiry or priority reason */}
                      <td className="py-3 px-4 text-slate-600 text-[11px]">
                        <div>{item.priorityReason}</div>
                        {item.batchExpiry && (
                          <div className="text-slate-400 font-mono mt-0.5">
                            {item.batchExpiry}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-md hover:bg-slate-200 transition-colors"
                            title="Modifica prodotto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(item.id)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 rounded-md hover:bg-rose-50 transition-colors"
                            title="Elimina prodotto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: BATCH IMPORT */}
      {activeTab === 'import' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Caricamento Rapido da Gestionale o Foglio Excel
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Incolla una lista di prodotti esportata dal gestionale (formato separato da punto e virgola: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">Nome; Marchio; Categoria; Trigger; Target; Colore; Motivo</code>).
              </p>
            </div>
            <button
              onClick={handleLoadSampleCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Incolla Esempio Farmacia</span>
            </button>
          </div>

          <textarea
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            rows={8}
            placeholder={`Nome; Marchio; Categoria; Trigger al Banco; Target; Colore; Motivo\nFlorBio Fermenti; BioFarma; Fermenti; Con antibiotici; 40; red; Giacenza alta`}
            className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>
                Sostituisci completamente la lista attiva esistente (consigliato per avviare un nuovo ciclo settimanale o mensile)
              </span>
            </label>

            <button
              onClick={handleBatchParseAndImport}
              disabled={!batchText.trim()}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 shrink-0"
            >
              <Upload className="w-4 h-4" />
              <span>Elabora e Aggiorna Dashboard Staff</span>
            </button>
          </div>

          {importStatus && (
            <div className={`p-3 rounded-lg text-xs font-medium ${
              importStatus.includes('Errore')
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {importStatus}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: CAMPAIGN CONFIG */}
      {activeTab === 'campaign' && (
        <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs max-w-2xl">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Configurazione Ciclo & Frequenza Obiettivi
          </h2>
          <p className="text-xs text-slate-600 mb-5">
            Scegli ogni quanto aggiornare il semaforo: ogni settimana, ogni due settimane o ogni mese per mantenere il personale motivato senza saturazione.
          </p>

          <form onSubmit={handleSaveCampaign} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome Farmacia
              </label>
              <input
                type="text"
                value={pharmacyName}
                onChange={(e) => setPharmacyName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Titolo Campagna Attiva
              </label>
              <input
                type="text"
                value={campaignTitle}
                onChange={(e) => setCampaignTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cadenza Obiettivo
                </label>
                <select
                  value={periodType}
                  onChange={(e) => setPeriodType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="weekly">Settimanale (7 giorni)</option>
                  <option value="biweekly">Bisettimanale (14 giorni)</option>
                  <option value="monthly">Mensile (30 giorni)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Inizio
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data Fine
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Note & Indicazioni per lo Staff (mostrate nel banner operativo)
              </label>
              <textarea
                value={campaignNotes}
                onChange={(e) => setCampaignNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {campaignSaved ? <Check className="w-4 h-4 text-emerald-400" /> : null}
                <span>{campaignSaved ? 'Salvato con Successo' : 'Salva Impostazioni Ciclo'}</span>
              </button>
            </div>
          </form>
        </section>
      )}

      {/* TAB 4: RECENT ROTATION LOG */}
      {activeTab === 'history' && (
        <section className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-1">
            Log Rotazioni e Consigli in Tempo Reale
          </h2>
          <p className="text-xs text-slate-600 mb-4">
            Ogni volta che un farmacista al banco o da mobile tocca "Consigliato al Banco", l’evento appare qui all’istante via connessione live.
          </p>

          {historyLog.length > 0 ? (
            <div className="space-y-2">
              {historyLog.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <div>
                      <span className="font-bold text-slate-900">{log.productName}</span>
                      <span className="text-slate-500 ml-2">registrato da {log.source}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                    {log.previousColor !== log.newColor && (
                      <span className="text-amber-700 font-sans font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Transizione: {COLOR_METAS[log.previousColor].label} ➔ {COLOR_METAS[log.newColor].label}
                      </span>
                    )}
                    <span>{new Date(log.timestamp).toLocaleTimeString('it-IT')}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-slate-400 text-xs">
              Nessun consiglio registrato in questa sessione. Quando lo staff clicca al banco, i consigli appariranno qui.
            </div>
          )}
        </section>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingProduct ? 'Modifica Prodotto' : 'Aggiungi Nuovo Prodotto al Semaforo'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              I dati clinici e il colore saranno visibili allo staff; le quantità interne rimangono riservate alla gestione.
            </p>

            <form onSubmit={handleSubmitNewProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Prodotto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Es. FlorBio Fermenti Vivi 12 Flaconcini"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marchio / Laboratorio
                  </label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Es. BioFarma"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reparto / Categoria
                  </label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Es. Fermenti & Digestione"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gancio al Banco ("Quando proporlo al cliente") *
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.adviceTrigger || ''}
                  onChange={(e) => setFormData({ ...formData, adviceTrigger: e.target.value })}
                  placeholder="Es. Da proporre a chiunque acquisti un antibiotico per proteggere la flora intestinale..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Priority Color selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semaforo Iniziale Assegnato
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['red', 'orange', 'yellow', 'green'] as TrafficLightColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: c })}
                      className={`p-2 rounded-lg border text-center transition-all ${
                        formData.color === c
                          ? `${COLOR_METAS[c].bgBadge} ring-2 ring-slate-800 font-bold`
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full mx-auto block mb-1 ${COLOR_METAS[c].dotBg}`} />
                      <span className="text-[11px] block">{COLOR_METAS[c].label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Target pieces (hidden from staff) */}
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Pezzi (Riservato Titolare)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.targetQuantity || 30}
                    onChange={(e) => setFormData({ ...formData, targetQuantity: parseInt(e.target.value, 10) || 1 })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scadenza Lotto / Note Scorta
                  </label>
                  <input
                    type="text"
                    value={formData.batchExpiry || ''}
                    onChange={(e) => setFormData({ ...formData, batchExpiry: e.target.value })}
                    placeholder="Es. Scadenza: 12/2026"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo della Priorità
                </label>
                <input
                  type="text"
                  value={formData.priorityReason || ''}
                  onChange={(e) => setFormData({ ...formData, priorityReason: e.target.value })}
                  placeholder="Es. Giacenza alta magazzino, Accordo commerciale 3+1"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                >
                  {editingProduct ? 'Salva Modifiche' : 'Aggiungi alla Dashboard'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
