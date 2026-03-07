"use client";

import type { SupportedCurrency, FxRates } from "@/lib/currency";
import { convertToHome, formatCurrency } from "@/lib/currency";

interface CurrencyBadgeProps {
  currency?: SupportedCurrency;
  homeCurrency: SupportedCurrency;
  amount: number;
  fxRates: FxRates;
  onCurrencyChange: (currency: SupportedCurrency | undefined) => void;
}

export default function CurrencyBadge({
  currency,
  homeCurrency,
  amount,
  fxRates,
  onCurrencyChange,
}: CurrencyBadgeProps) {
  const foreignCurrency = homeCurrency === "CAD" ? "USD" : "CAD";
  const isHome = !currency || currency === homeCurrency;
  const isForeign = currency === foreignCurrency;

  const handleToggle = () => {
    if (isHome) {
      onCurrencyChange(foreignCurrency);
    } else {
      onCurrencyChange(undefined); // reset to home
    }
  };

  const convertedAmount = isForeign
    ? convertToHome(amount, foreignCurrency, homeCurrency, fxRates)
    : 0;

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        onClick={handleToggle}
        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-blue-400 ${
          isForeign
            ? "bg-violet-400/20 text-violet-300 hover:bg-violet-400/30"
            : "bg-white/5 text-slate-500 hover:bg-white/10 hover:text-slate-300"
        }`}
        title={isForeign ? `Click to switch to ${homeCurrency}` : `Click to switch to ${foreignCurrency}`}
        data-testid="currency-badge"
      >
        {isForeign ? foreignCurrency : homeCurrency}
      </button>
      {isForeign && amount > 0 && (
        <span className="text-[10px] text-slate-500" data-testid="currency-converted">
          ≈ {formatCurrency(convertedAmount, homeCurrency)}
        </span>
      )}
    </span>
  );
}
