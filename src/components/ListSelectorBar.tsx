import React, { useState } from 'react';
import { CustomList } from '../types';
import { Plus, Check, Edit2, Copy, Trash2, ChevronDown, CheckCircle2, Sparkles, Layers } from 'lucide-react';

interface ListSelectorBarProps {
  lists: CustomList[];
  activeListId: string;
  onSelectList: (listId: string) => void;
  onActivateList: (listId: string) => Promise<void>;
  onRenameList: (listId: string, newName: string) => Promise<void>;
  onDuplicateList: (listId: string) => Promise<void>;
  onDeleteList: (listId: string) => Promise<void>;
  onOpenCreateModal: () => void;
  isManagerView: boolean;
}

export const ListSelectorBar: React.FC<ListSelectorBarProps> = ({
  lists,
  activeListId,
  onSelectList,
  onActivateList,
  onRenameList,
  onDuplicateList,
  onDeleteList,
  onOpenCreateModal,
  isManagerView,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const currentList = lists.find((l) => l.id === activeListId) || lists[0];
  const [nameInput, setNameInput] = useState(currentList?.name || '');

  // Keep name input in sync when list changes
  React.useEffect(() => {
    if (currentList) {
      setNameInput(currentList.name);
    }
  }, [currentList]);

  const handleSaveRename = async () => {
    if (!nameInput.trim() || !currentList) return;
    await onRenameList(currentList.id, nameInput.trim());
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveRename();
    } else if (e.key === 'Escape') {
      setIsEditingName(false);
      setNameInput(currentList?.name || '');
    }
  };

  if (!currentList) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-2xs mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Current Active List Name with Inline Edit */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Lista Operativa Attiva
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                In Uso al Banco
              </span>
            </div>

            {isEditingName ? (
              <div className="flex items-center gap-2 pt-0.5">
                <input
                  type="text"
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="px-2 py-1 text-sm sm:text-base font-bold text-slate-900 border border-emerald-500 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  onClick={handleSaveRename}
                  className="p-1 text-white bg-emerald-600 rounded hover:bg-emerald-700"
                  title="Salva nome"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingName(false);
                    setNameInput(currentList.name);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 px-1"
                >
                  Annulla
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  {currentList.name}
                </h2>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 transition-colors"
                  title="Rinomina questa lista"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: List Selector Tabs and Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* List Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200/80 overflow-x-auto max-w-full">
            {lists.map((l) => (
              <button
                key={l.id}
                onClick={() => onActivateList(l.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  l.id === activeListId
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {l.id === activeListId && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                )}
                <span>{l.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  ({l.products.length})
                </span>
              </button>
            ))}
          </div>

          {/* Create New List Button */}
          <button
            onClick={onOpenCreateModal}
            className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Crea Nuova Lista</span>
          </button>

          {/* List Utility Actions for Manager */}
          {isManagerView && (
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
              <button
                onClick={() => onDuplicateList(currentList.id)}
                className="p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors"
                title="Duplica questa lista per avviare una nuova campagna"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              {lists.length > 1 && (
                <button
                  onClick={() => onDeleteList(currentList.id)}
                  className="p-2 text-rose-500 hover:text-rose-700 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Elimina questa lista"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
