/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { PharmacyStore, ProductItem, CampaignConfig, CustomList, HistoryLogEntry, Subcategory, TrafficLightColor, COLOR_METAS } from './types';
import {
  getBackendMode,
  type BackendMode,
  fetchPharmacyState,
  recommendProduct,
  updateProduct,
  createProduct,
  deleteProduct,
  batchImportProducts,
  updateCampaign,
  resetDemoData,
  resetBlankData,
  subscribeToRealtimeUpdates,
  createCustomList,
  updateCustomList,
  activateCustomList,
  duplicateCustomList,
  deleteCustomList,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  exportBackup,
  restoreBackup,
  setManagerPin,
} from './services/api';
import { isSessionUnlocked, setSessionUnlocked } from './services/pin';
import { PinModal } from './components/PinModal';
import { TopNav } from './components/TopNav';
import { ListSelectorBar } from './components/ListSelectorBar';
import { CreateListModal } from './components/CreateListModal';
import { CounterStaffView } from './components/CounterStaffView';
import { ManagerDashboard } from './components/ManagerDashboard';
import { CrossSellingGuideModal } from './components/CrossSellingGuideModal';
import { MethodExplainerModal } from './components/MethodExplainerModal';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [store, setStore] = useState<PharmacyStore | null>(null);
  const [activeView, setActiveView] = useState<'counter' | 'manager'>('counter');
  const [managerUnlocked, setManagerUnlocked] = useState<boolean>(() => isSessionUnlocked());
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [backendMode, setBackendMode] = useState<BackendMode | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isCrossSellingOpen, setIsCrossSellingOpen] = useState(false);
  const [isMethodExplainerOpen, setIsMethodExplainerOpen] = useState(false);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; color?: TrafficLightColor } | null>(null);

  // Load initial state
  useEffect(() => {
    let isMounted = true;

    getBackendMode()
      .then((mode) => {
        if (isMounted) setBackendMode(mode);
      })
      .catch(() => {
        /* la UI resta in stato indeterminato: non è bloccante */
      });

    fetchPharmacyState()
      .then((data) => {
        if (isMounted) {
          setStore(data);
          setLoadError(null);
        }
      })
      .catch((err) => {
        console.error('Error fetching initial pharmacy state:', err);
        if (isMounted) {
          setLoadError(err?.message || 'Errore sconosciuto');
        }
      });

    // Subscribe to SSE real-time stream for multi-device sync
    const unsubscribe = subscribeToRealtimeUpdates(
      (updatedStore) => {
        if (isMounted) {
          setStore(updatedStore);
          setIsRealtimeConnected(true);
        }
      },
      () => {
        if (isMounted) {
          setIsRealtimeConnected(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const showToast = useCallback((message: string, color?: TrafficLightColor) => {
    setNotification({ message, color });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, 3200);
  }, []);

  // Staff 1-tap counter recommendation
  const handleRecommend = async (productId: string) => {
    if (!store) return;
    try {
      const result = await recommendProduct(productId, 'Banco Vendita');
      if (result.colorTransition) {
        showToast(
          `Rotazione aggiornata: "${result.product.name}" è ora passato a ${COLOR_METAS[result.colorTransition.to].label}!`,
          result.colorTransition.to
        );
      } else {
        showToast(`Consiglio registrato: ${result.product.name}`, result.product.color);
      }
    } catch (err: any) {
      console.error('Failed to log recommendation:', err);
    }
  };

  // List Management Handlers
  const handleCreateList = async (data: {
    name: string;
    description: string;
    periodType: CustomList['periodType'];
    startDate: string;
    endDate: string;
    makeActive: boolean;
    template: 'empty' | 'autunno' | 'antibiotici';
  }) => {
    try {
      const created = await createCustomList(data);
      showToast(`Nuova lista creata: "${created.name}"`);
    } catch (err: any) {
      alert(`Errore creazione lista: ${err.message}`);
    }
  };

  const handleActivateList = async (listId: string) => {
    try {
      const activated = await activateCustomList(listId);
      showToast(`Lista "${activated.name}" attiva al banco vendita per tutto lo staff!`);
    } catch (err: any) {
      alert(`Errore attivazione lista: ${err.message}`);
    }
  };

  const handleRenameList = async (listId: string, newName: string) => {
    try {
      const updated = await updateCustomList(listId, { name: newName });
      showToast(`Lista rinominata in: "${updated.name}"`);
    } catch (err: any) {
      alert(`Errore rinomina: ${err.message}`);
    }
  };

  const handleDuplicateList = async (listId: string) => {
    try {
      const duplicated = await duplicateCustomList(listId);
      showToast(`Lista duplicata con successo: "${duplicated.name}"`);
    } catch (err: any) {
      alert(`Errore duplicazione: ${err.message}`);
    }
  };

  const handleDeleteList = async (listId: string) => {
    if (!confirm('Vuoi davvero eliminare questa lista?')) return;
    try {
      await deleteCustomList(listId);
      showToast('Lista eliminata');
    } catch (err: any) {
      alert(`Errore eliminazione lista: ${err.message}`);
    }
  };

  // Manager: Update product
  const handleUpdateProduct = async (id: string, data: Partial<ProductItem>) => {
    try {
      const updated = await updateProduct(id, data);
      showToast(`Prodotto aggiornato con successo: ${updated.name}`);
    } catch (err: any) {
      alert(`Errore aggiornamento: ${err.message}`);
    }
  };

  // Manager: Add product
  const handleAddProduct = async (data: Partial<ProductItem>) => {
    try {
      const created = await createProduct(data);
      showToast(`Aggiunto nuovo prodotto: ${created.name}`, created.color);
    } catch (err: any) {
      alert(`Errore inserimento: ${err.message}`);
    }
  };

  // Manager: Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Vuoi rimuovere questo prodotto dalla lista attiva del banco?')) return;
    try {
      await deleteProduct(id);
      showToast('Prodotto rimosso dalla lista');
    } catch (err: any) {
      alert(`Errore eliminazione: ${err.message}`);
    }
  };

  // Manager: Batch import
  const handleBatchImport = async (items: (Partial<ProductItem> & { subcategory?: string })[], replace: boolean) => {
    try {
      const count = await batchImportProducts(items, replace);
      showToast(`Importati ${count} prodotti nella dashboard dello staff!`);
    } catch (err: any) {
      alert(`Errore batch import: ${err.message}`);
    }
  };

  // Manager: Sottocategorie della lista attiva
  const handleCreateSubcategory = async (listId: string, name: string) => {
    try {
      const created = await createSubcategory(listId, name);
      showToast(`Sottocategoria «${created.name}» aggiunta alla lista`);
    } catch (err: any) {
      alert(`Errore creazione sottocategoria: ${err.message}`);
    }
  };

  const handleRenameSubcategory = async (listId: string, subId: string, name: string) => {
    try {
      await updateSubcategory(listId, subId, { name });
      showToast('Sottocategoria rinominata');
    } catch (err: any) {
      alert(`Errore rinomina sottocategoria: ${err.message}`);
    }
  };

  const handleDeleteSubcategory = async (listId: string, subId: string) => {
    if (!confirm('Eliminare la sottocategoria? I prodotti al suo interno torneranno «senza sottocategoria».')) return;
    try {
      await deleteSubcategory(listId, subId);
      showToast('Sottocategoria eliminata');
    } catch (err: any) {
      alert(`Errore eliminazione sottocategoria: ${err.message}`);
    }
  };

  // Manager: Update Campaign config
  const handleUpdateCampaign = async (data: Partial<CampaignConfig>) => {
    try {
      await updateCampaign(data);
      showToast('Impostazioni del ciclo aggiornate per tutta la farmacia');
    } catch (err: any) {
      alert(`Errore salvataggio campagna: ${err.message}`);
    }
  };

  // Manager: Reset Demo Data
  const handleResetDemo = async () => {
    if (!confirm('Ripristinare l’elenco iniziale e le statistiche di esempio?')) return;
    try {
      await resetDemoData();
      showToast('Dati di esempio ripristinati');
    } catch (err: any) {
      alert(`Errore reset: ${err.message}`);
    }
  };

  // Manager: Reset to Blank Template for GitHub
  const handleExportBackup = async (): Promise<string> => {
    return exportBackup();
  };

  const handleRestoreBackup = async (
    raw: string
  ): Promise<{ lists: number; products: number }> => {
    const restored = await restoreBackup(raw);
    setStore(restored);
    return { lists: restored.lists.length, products: restored.products.length };
  };

  const handleResetBlank = async () => {
    if (
      !confirm(
        'Vuoi azzerare il portale alla versione in bianco (template pronto per GitHub)? Questa azione rimuove le referenze demo e lascia una lista pulita da personalizzare.'
      )
    )
      return;
    try {
      await resetBlankData();
      showToast('Portale azzerato alla versione in bianco (template pronto)');
    } catch (err: any) {
      alert(`Errore azzeramento: ${err.message}`);
    }
  };

  if (!store && loadError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-slate-800">
            Impossibile avviare FarmaCromia
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <h2 className="text-sm font-bold text-slate-800">
            Avvio FarmaCromia in corso...
          </h2>
          <p className="text-xs text-slate-500">
            Sincronizzazione in tempo reale con i banchi della farmacia
          </p>
        </div>
      </div>
    );
  }

  const activeList = store.lists.find((l) => l.id === store.activeListId) || store.lists[0];

  /** Il pannello Titolare può essere protetto da PIN: intercetta l'accesso. */
  const handleSelectView = (view: 'counter' | 'manager') => {
    if (view === 'manager' && store.managerPinHash && !managerUnlocked) {
      setPinModalOpen(true);
      return;
    }
    setActiveView(view);
  };

  const handleSetManagerPin = async (pin: string | null) => {
    await setManagerPin(pin);
  };

  const handleLockPanel = () => {
    setSessionUnlocked(false);
    setManagerUnlocked(false);
    setActiveView('counter');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <TopNav
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenCrossSelling={() => setIsCrossSellingOpen(true)}
        onOpenMethodExplainer={() => setIsMethodExplainerOpen(true)}
        isRealtimeConnected={isRealtimeConnected}
        backendMode={backendMode}
        activeCycleTitle={activeList?.name || store.config.title}
      />

      {/* Live Toast Notification */}
      {notification && (
        <div className="fixed top-16 right-4 sm:right-6 z-50 max-w-sm w-full transition-all duration-300">
          <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-3">
            {notification.color ? (
              <span
                className={`w-3 h-3 rounded-full shrink-0 shadow-xs ${
                  COLOR_METAS[notification.color].dotBg
                }`}
              />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <p className="text-xs font-medium leading-snug">
              {notification.message}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Universal List Selector & Rename Bar */}
        <ListSelectorBar
          lists={store.lists}
          activeListId={store.activeListId}
          onSelectList={handleActivateList}
          onActivateList={handleActivateList}
          onRenameList={handleRenameList}
          onDuplicateList={handleDuplicateList}
          onDeleteList={handleDeleteList}
          onOpenCreateModal={() => setIsCreateListOpen(true)}
          isManagerView={activeView === 'manager'}
        />

        {activeView === 'counter' ? (
          <CounterStaffView
            products={store.products}
            subcategories={activeList?.subcategories || []}
            config={store.config}
            onRecommend={handleRecommend}
            onOpenCrossSelling={() => setIsCrossSellingOpen(true)}
            onOpenMethodExplainer={() => setIsMethodExplainerOpen(true)}
          />
        ) : (
          <ManagerDashboard
            products={store.products}
            config={store.config}
            lists={store.lists}
            activeListId={store.activeListId}
            subcategories={activeList?.subcategories || []}
            onCreateSubcategory={handleCreateSubcategory}
            onRenameSubcategory={handleRenameSubcategory}
            onDeleteSubcategory={handleDeleteSubcategory}
            historyLog={store.historyLog}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onBatchImport={handleBatchImport}
            onUpdateCampaign={handleUpdateCampaign}
            onResetDemo={handleResetDemo}
            onResetBlank={handleResetBlank}
            onExportBackup={handleExportBackup}
            onRestoreBackup={handleRestoreBackup}
            managerPinSet={Boolean(store.managerPinHash)}
            onSetManagerPin={handleSetManagerPin}
            onLockPanel={handleLockPanel}
            onActivateList={handleActivateList}
            onRenameList={handleRenameList}
            onDuplicateList={handleDuplicateList}
            onDeleteList={handleDeleteList}
            onOpenCreateListModal={() => setIsCreateListOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <CreateListModal
        isOpen={isCreateListOpen}
        onClose={() => setIsCreateListOpen(false)}
        onCreateList={handleCreateList}
      />

      <PinModal
        isOpen={pinModalOpen}
        expectedHash={store.managerPinHash ?? null}
        onClose={() => setPinModalOpen(false)}
        onUnlocked={() => {
          setSessionUnlocked(true);
          setManagerUnlocked(true);
          setPinModalOpen(false);
          setActiveView('manager');
        }}
      />

      <CrossSellingGuideModal
        isOpen={isCrossSellingOpen}
        onClose={() => setIsCrossSellingOpen(false)}
      />

      <MethodExplainerModal
        isOpen={isMethodExplainerOpen}
        onClose={() => setIsMethodExplainerOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">FarmaCromia</span>
            <span>·</span>
            <span>Sistema di Consiglio Cromatico Senza Pressione per Farmacie</span>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Aggiornato in Tempo Reale (Mobile & Desktop)</span>
            <span>·</span>
            <span>Deontologia & Consiglio Etico</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
