import React, { useState } from 'react';
import { ProductItem, COLOR_METAS } from '../types';
import { Check, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface SimpleProductListProps {
  products: ProductItem[];
  onRecommend: (productId: string) => Promise<void>;
}

export const SimpleProductList: React.FC<SimpleProductListProps> = ({ products, onRecommend }) => {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleRecommendClick = async (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (submittingId) return;
    setSubmittingId(productId);
    try {
      await onRecommend(productId);
      setCelebratingId(productId);
      setTimeout(() => {
        setCelebratingId(null);
      }, 1600);
    } finally {
      setSubmittingId(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
      {/* Header bar for list */}
      <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-slate-50/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">
        <div className="col-span-1 text-center">Semaforo</div>
        <div className="col-span-4">Prodotto / Reparto</div>
        <div className="col-span-4">Quando Consigliare (Gancio al Banco)</div>
        <div className="col-span-3 text-right">Azione Rapida</div>
      </div>

      {products.map((product) => {
        const meta = COLOR_METAS[product.color];
        const isCelebrating = celebratingId === product.id;
        const isExpanded = expandedId === product.id;

        // Visual completion ratio (only for gradient bar, zero numbers displayed!)
        const ratio = product.targetQuantity > 0 ? Math.min(1, product.currentQuantity / product.targetQuantity) : 1;
        const progressPercent = Math.round(ratio * 100);

        const getGradientFill = () => {
          switch (product.color) {
            case 'red':
              return 'bg-gradient-to-r from-rose-500 to-rose-400';
            case 'orange':
              return 'bg-gradient-to-r from-amber-500 to-amber-400';
            case 'yellow':
              return 'bg-gradient-to-r from-yellow-500 to-emerald-400';
            case 'green':
              return 'bg-gradient-to-r from-emerald-500 to-teal-400';
          }
        };

        return (
          <div
            key={product.id}
            onClick={() => toggleExpand(product.id)}
            className={`transition-colors cursor-pointer ${
              isExpanded ? 'bg-slate-50/90' : 'hover:bg-slate-50/60'
            }`}
          >
            {/* Primary List Row */}
            <div className="p-4 sm:px-5 flex flex-col md:grid md:grid-cols-12 md:items-center gap-3">
              {/* Col 1: Chromatic Beacon */}
              <div className="md:col-span-1 flex items-center md:justify-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full shrink-0 shadow-xs ${meta.dotBg} ${
                    product.color === 'red' ? 'animate-pulse' : ''
                  }`}
                  title={meta.label}
                />
                <span className="md:hidden text-xs font-bold uppercase tracking-wider text-slate-700">
                  {meta.label}
                </span>
              </div>

              {/* Col 2: Product Name & Category */}
              <div className="md:col-span-4 space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight leading-snug">
                    {product.name}
                  </h3>
                  {product.sku && (
                    <span className="text-[10px] font-mono text-slate-400 hidden lg:inline">
                      {product.sku}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-slate-600">{product.category}</span>
                  {product.brand && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span>{product.brand}</span>
                    </>
                  )}
                  {product.batchExpiry && (
                    <>
                      <span className="text-slate-300">·</span>
                      <span className="text-slate-400 text-[11px]">{product.batchExpiry}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Col 3: Counter Advice Trigger */}
              <div className="md:col-span-4">
                <div className="text-xs text-slate-800 line-clamp-2 md:line-clamp-1 leading-snug bg-slate-100/60 md:bg-transparent p-2 md:p-0 rounded-md">
                  <span className="font-semibold text-slate-600 md:hidden">Proponi con: </span>
                  {product.adviceTrigger}
                </div>
                {/* Chromatic mini-progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5 hidden md:block">
                  <div
                    className={`h-full transition-all duration-500 ${getGradientFill()}`}
                    style={{ width: `${Math.max(8, progressPercent)}%` }}
                  />
                </div>
              </div>

              {/* Col 4: Action Button & Expand Toggle */}
              <div className="md:col-span-3 flex items-center justify-between md:justify-end gap-2.5 pt-1 md:pt-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(product.id);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded hover:bg-slate-200/60 transition-colors"
                >
                  <span className="text-[11px]">{isExpanded ? 'Chiudi' : 'Dettagli'}</span>
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={(e) => handleRecommendClick(product.id, e)}
                  disabled={submittingId === product.id}
                  className={`px-3.5 py-2 rounded-lg font-semibold text-xs tracking-wide transition-all duration-150 flex items-center gap-1.5 shrink-0 shadow-2xs ${
                    isCelebrating
                      ? 'bg-emerald-600 text-white'
                      : product.color === 'green'
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                  }`}
                >
                  {isCelebrating ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Registrato!</span>
                    </>
                  ) : product.color === 'green' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Raggiunto</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Consigliato</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Expandable Details Drawer */}
            {isExpanded && (
              <div className="px-5 pb-4 pt-1 bg-slate-50 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs animate-in fade-in-50 duration-200">
                <div className="space-y-2">
                  <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>I punti di forza da comunicare al cliente:</span>
                  </div>
                  <ul className="space-y-1 text-slate-600 pl-1">
                    {product.sellingPoints.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <div className="font-semibold text-slate-700">
                    Abbinamenti Cross-Selling:
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-600 font-medium">
                    {product.crossSellSuggestions.map((item, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <span className="text-slate-300">·</span>}
                        <span>{item}</span>
                      </React.Fragment>
                    ))}
                  </div>

                  {product.notesForStaff && (
                    <div className="text-[11px] text-slate-500 italic mt-2 bg-white p-2 rounded border border-slate-200">
                      Nota di reparto: {product.notesForStaff}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
