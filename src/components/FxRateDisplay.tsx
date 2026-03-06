"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { SupportedCurrency, FxRates } from "@/lib/currency";
import { fxPairKey } from "@/lib/currency";

interface FxRateDisplayProps {
  homeCurrency: SupportedCurrency;
  foreignCurrency: SupportedCurrency;
  fxRates: FxRates;
  fxManualOverride?: number;
  onManualOverrideChange: (override: number | undefined) => void;
}

export default function FxRateDisplay({
  homeCurrency,
  foreignCurrency,
  fxRates,
  fxManualOverride,
  onManualOverrideChange,
}: FxRateDisplayProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const isManual = fxManualOverride !== undefined && fxManualOverride > 0;
  const rateKey = fxPairKey(foreignCurrency, homeCurrency);
  const currentRate = fxRates[rateKey] ?? 1;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const startEditing = useCallback(() => {
    setEditValue(currentRate.toFixed(4));
    setEditing(true);
  }, [currentRate]);

  const commitEdit = useCallback(() => {
    const val = parseFloat(editValue);
    if (!isNaN(val) && val > 0) {
      onManualOverrideChange(val);
    }
    setEditing(false);
  }, [editValue, onManualOverrideChange]);

  const clearOverride = useCallback(() => {
    onManualOverrideChange(undefined);
    setEditing(false);
  }, [onManualOverrideChange]);

  return (
    <div
      className="flex items-center gap-1.5 text-xs text-stone-500"
      data-testid="fx-rate-display"
    >
      <span className="hidden sm:inline">1 {foreignCurrency} =</span>
      <span className="sm:hidden">FX:</span>
      {editing ? (
        <input
          ref={inputRef}
          type="number"
          step="0.0001"
          min="0.0001"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") setEditing(false);
          }}
          className="w-20 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs font-mono text-stone-700 focus:outline-none focus:ring-1 focus:ring-blue-400"
          data-testid="fx-rate-input"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          className="rounded px-1 py-0.5 font-mono text-stone-700 transition-colors hover:bg-stone-100 focus:outline-none focus:ring-1 focus:ring-blue-400"
          title="Click to set custom rate"
          data-testid="fx-rate-value"
        >
          {currentRate.toFixed(4)}
        </button>
      )}
      <span className="hidden sm:inline">{homeCurrency}</span>
      {isManual ? (
        <button
          type="button"
          onClick={clearOverride}
          className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 transition-colors hover:bg-amber-200 focus:outline-none focus:ring-1 focus:ring-amber-400"
          title="Using custom rate — click to revert to live rate"
          data-testid="fx-badge-custom"
        >
          custom
        </button>
      ) : (
        <span
          className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700"
          data-testid="fx-badge-live"
        >
          live
        </span>
      )}
    </div>
  );
}
