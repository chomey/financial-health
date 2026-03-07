export type SupportedCurrency = "CAD" | "USD";

export interface FxRates {
  /** Rate to convert from foreign currency to home currency. Key is "CAD_USD" or "USD_CAD". */
  [pair: string]: number;
}

/** Derive home currency from country code */
export function getHomeCurrency(country: "CA" | "US"): SupportedCurrency {
  return country === "CA" ? "CAD" : "USD";
}

/** Get the foreign currency (the one that isn't home) */
export function getForeignCurrency(homeCurrency: SupportedCurrency): SupportedCurrency {
  return homeCurrency === "CAD" ? "USD" : "CAD";
}

/** Build an FX rate pair key */
export function fxPairKey(from: SupportedCurrency, to: SupportedCurrency): string {
  return `${from}_${to}`;
}

/** Hardcoded fallback rates (approximate) used when no live rate is available */
export const FALLBACK_RATES: FxRates = {
  CAD_USD: 0.73,
  USD_CAD: 1.37,
};

/**
 * Convert an amount from one currency to another using the given rates.
 * Returns the original amount if from === to.
 */
export function convertToHome(
  amount: number,
  from: SupportedCurrency,
  to: SupportedCurrency,
  rates: FxRates,
): number {
  if (from === to) return amount;
  const key = fxPairKey(from, to);
  const rate = rates[key];
  if (rate === undefined || rate <= 0) {
    // Try fallback
    const fallback = FALLBACK_RATES[key];
    if (fallback) return amount * fallback;
    return amount; // no conversion possible
  }
  return amount * rate;
}

/**
 * Format a currency amount for display.
 * Uses plain "$" for the home currency; only shows "CA$" or "US$" for foreign amounts.
 */
export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  opts?: { maximumFractionDigits?: number; showSign?: boolean; homeCurrency?: SupportedCurrency },
): string {
  const maxFrac = opts?.maximumFractionDigits ?? 0;
  const abs = Math.abs(amount);
  const isForeign = opts?.homeCurrency !== undefined && currency !== opts.homeCurrency;
  // Use plain "$" for home currency, full prefix for foreign
  const formatted = isForeign
    ? new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: maxFrac }).format(abs)
    : "$" + new Intl.NumberFormat("en-US", { maximumFractionDigits: maxFrac }).format(abs);
  const sign = amount < 0 ? "-" : opts?.showSign && amount > 0 ? "+" : "";
  return `${sign}${formatted}`;
}

/**
 * Format a currency amount in compact form (e.g., "$55k", "$1.2M").
 * Uses plain "$" for home currency; shows "CA$"/"US$" only for foreign amounts.
 */
export function formatCurrencyCompact(
  amount: number,
  currency: SupportedCurrency,
  homeCurrency?: SupportedCurrency,
): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const isForeign = homeCurrency !== undefined && currency !== homeCurrency;
  const symbol = isForeign ? (currency === "CAD" ? "CA$" : "US$") : "$";
  if (abs >= 1_000_000) return `${sign}${symbol}${parseFloat((abs / 1_000_000).toFixed(1))}M`;
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(0)}k`;
  return `${sign}${symbol}${abs.toFixed(0)}`;
}

/**
 * A currency-aware formatter. Create once with the home currency,
 * then use `.compact()` and `.full()` everywhere.
 */
export class CurrencyFormatter {
  constructor(public readonly currency: SupportedCurrency) {}

  /** Compact display for chart axes / tight spaces: $1.2M, $55k, $123 */
  compact(amount: number): string {
    return formatCurrencyCompact(amount, this.currency, this.currency);
  }

  /** Full formatted display for tooltips / tables: $1,234,567 */
  full(amount: number, opts?: { showSign?: boolean; decimals?: number }): string {
    return formatCurrency(amount, this.currency, {
      showSign: opts?.showSign,
      maximumFractionDigits: opts?.decimals,
      homeCurrency: this.currency,
    });
  }

  /** Format an amount in a specific (possibly foreign) currency: US$5,000 or $5,000 */
  foreign(amount: number, itemCurrency: SupportedCurrency): string {
    return formatCurrency(amount, itemCurrency, { homeCurrency: this.currency });
  }
}

/** Get effective FX rates: manual override if set, otherwise use provided rates or fallback */
export function getEffectiveFxRates(
  homeCurrency: SupportedCurrency,
  fxManualOverride?: number,
  liveFxRates?: FxRates,
): FxRates {
  const foreign = getForeignCurrency(homeCurrency);

  if (fxManualOverride !== undefined && fxManualOverride > 0) {
    // Manual override is the rate: 1 foreign = X home
    // e.g., for CA user: 1 USD = 1.37 CAD, so fxManualOverride = 1.37
    const foreignToHome = fxManualOverride;
    const homeToForeign = 1 / fxManualOverride;
    return {
      [fxPairKey(foreign, homeCurrency)]: foreignToHome,
      [fxPairKey(homeCurrency, foreign)]: homeToForeign,
    };
  }

  if (liveFxRates) return liveFxRates;
  return { ...FALLBACK_RATES };
}
