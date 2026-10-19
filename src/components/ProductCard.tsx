import React, { useState } from 'react';
import { ProductItem, COLOR_METAS, TrafficLightColor } from '../types';
import { Check, Flame, HelpCircle, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';

interface ProductCardProps {
  product: ProductItem;
  onRecommend: (productId: string) => Promise<void>;
  onQuickColorChange?: (productId: string, newColor: TrafficLightColor) => void;
  isManagerMode?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onRecommend,
  onQuickColorChange,
  isManagerMode = false,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const meta = COLOR_METAS[product.color];

  const handleRecommendClick = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onRecommend(product.id);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1800);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Visual completion ratio (only used for rendering the subtle smooth chromatic bar gradient, without revealing numbers)
  const ratio = product.targetQuantity > 0 ? Math.min(1, product.currentQuantity / product.targetQuantity) : 1;
  const progressPercent = Math.round(ratio * 100);

  // Gradient style depending on color stage
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
    <article
      className={`relative bg-white rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
        product.color === 'red'
          ? 'border-rose-200 shadow-sm hover:border-rose-300'
          : product.color === 'orange'
          ? 'border-amber-200 shadow-sm hover:border-amber-300'
          : product.color === 'yellow'
          ? 'border-yellow-200 shadow-sm hover:border-yellow-300'
          : 'border-emerald-200 shadow-sm hover:border-emerald-300'
      }`}
    >
      {/* Top Chromatic Banner */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between border-b ${
          product.color === 'red'
            ? 'bg-rose-50/70 border-rose-100'
            : product.color === 'orange'
            ? 'bg-amber-50/70 border-amber-100'
            : product.color === 'yellow'
            ? 'bg-yellow-50/70 border-yellow-100'
            : 'bg-emerald-50/70 border-emerald-100'
        }`}
      >
        <div className="flex items-center gap-2">
          {/* Chromatic Beacon Indicator */}
          <span
            aria-hidden="true"
            className={`w-3.5 h-3.5 rounded-full shrink-0 shadow-xs ${meta.dotBg} ${
              product.color === 'red' ? 'animate-pulse' : ''
            }`}
          />
          <div className="flex flex-col">
            <span className={`text-xs font-bold uppercase tracking-wider ${meta.textBadge}`}>
              {meta.label}
            </span>
            <span className="text-[11px] text-slate-500 leading-tight">
              {meta.sublabel}
            </span>
          </div>
        </div>

        {/* Clean unboxed category metadata with separator */}
        <div className="text-right">
          <span className="text-xs font-medium text-slate-600 block">
            {product.category}
          </span>
          {product.brand && (
            <span className="text-[11px] text-slate-400 block">
              {product.brand}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-5 flex-1 flex flex-col gap-4">
        {/* Product Title */}
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h3>
          {product.sku && (
            <span className="text-[11px] font-mono text-slate-400 mt-0.5 block">
              Cod. {product.sku}
            </span>
          )}
        </div>

        {/* When to recommend (Il Gancio di Consiglio al Banco) */}
        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Quando proporlo al cliente:</span>
          </div>
          <p className="text-xs font-medium text-slate-800 leading-relaxed">
            {product.adviceTrigger}
          </p>
        </div>

        {/* Key Selling Points / Clinical Strengths */}
        {product.sellingPoints && product.sellingPoints.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Punti di forza per il consiglio:
            </div>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {product.sellingPoints.map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cross-Sell Suggestions (Zero-Pill discipline: unboxed with separators) */}
        {product.crossSellSuggestions && product.crossSellSuggestions.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Abbinamenti frequenti:
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 font-medium">
              {product.crossSellSuggestions.map((item, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-slate-300 font-normal">·</span>}
                  <span className="hover:text-slate-900 transition-colors">
                    {item}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Notes for staff if present */}
        {product.notesForStaff && (
          <p className="text-[11px] text-slate-500 italic bg-amber-50/40 p-2 rounded-md border border-amber-100/60">
            Nota: {product.notesForStaff}
          </p>
        )}
      </div>

      {/* Chromatic Progress Track (Zero Numbers shown to staff!) */}
      <div className="px-5 pt-1 pb-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
          <span>Stato smaltimento giacenza</span>
          <span className="font-medium text-slate-600">
            {product.color === 'green'
              ? 'Traguardo raggiunto'
              : product.color === 'yellow'
              ? 'In dirittura d’arrivo'
              : product.color === 'orange'
              ? 'Rotazione attiva'
              : 'Priorità massima'}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getGradientFill()}`}
            style={{ width: `${Math.max(8, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Action Zone: Single tap counter registration */}
      <div className="p-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-3">
        {isManagerMode ? (
          /* Manager quick color change override */
          <div className="w-full flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Forza colore:</span>
            <div className="flex items-center gap-1.5">
              {(['red', 'orange', 'yellow', 'green'] as TrafficLightColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => onQuickColorChange && onQuickColorChange(product.id, c)}
                  className={`w-6 h-6 rounded-full border transition-all ${COLOR_METAS[c].dotBg} ${
                    product.color === c ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={`Imposta come ${COLOR_METAS[c].label}`}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Staff Zero-Stress Action Button */
          <button
            onClick={handleRecommendClick}
            disabled={isSubmitting}
            className={`w-full py-3 px-4 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all duration-150 flex items-center justify-center gap-2 shadow-xs ${
              showCelebration
                ? 'bg-emerald-600 text-white'
                : product.color === 'green'
                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.99]'
            }`}
          >
            {showCelebration ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Consigliato al Banco!</span>
              </>
            ) : product.color === 'green' ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Obiettivo già Raggiunto (Registra altro)</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Consigliato al Banco</span>
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
};
