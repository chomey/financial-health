"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import CurrencyBadge from "@/components/CurrencyBadge";
import { DataFlowSourceItem } from "@/components/DataFlowArrows";
import { useCurrency } from "@/lib/CurrencyContext";
import { convertToHome, FALLBACK_RATES } from "@/lib/currency";
import { getTaxTreatment, type TaxTreatment } from "@/lib/withdrawal-tax";

export type RoiTaxTreatment = "capital-gains" | "income";

export interface Asset {
  id: string;
  category: string;
  amount: number;
  roi?: number; // annual ROI percentage
  roiTaxTreatment?: RoiTaxTreatment; // how ROI is taxed: capital gains vs interest income
  monthlyContribution?: number; // monthly contribution in $
  surplusTarget?: boolean; // monthly surplus is deposited here
  computed?: boolean; // auto-computed from stocks/properties — amount is read-only
  currency?: import("@/lib/currency").SupportedCurrency; // per-item currency override
  costBasisPercent?: number; // 0-100: % of balance that is original contributions (only for taxable accounts)
  taxTreatment?: TaxTreatment; // user override for tax treatment (auto-detected if not set)
  employerMatchPct?: number; // employer match percentage (e.g., 50 = 50% match on contributions)
  employerMatchCap?: number; // employer match salary cap (e.g., 6 = 6% of annual salary)
  reinvestReturns?: boolean; // true = compound returns back into balance, false = pay out as income
}

const CATEGORY_SUGGESTIONS = {
  CA: ["TFSA", "RRSP", "RESP", "FHSA", "LIRA"],
  US: ["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA"],
  AU: ["Super (Accumulation)", "Super (Pension Phase)", "First Home Super Saver"],
  universal: [
    "Savings",
    "Checking",
    "Brokerage",
    "Vehicle",
    "Other",
  ],
};

/** Set of CA-specific asset category names */
export const CA_ASSET_CATEGORIES = new Set(CATEGORY_SUGGESTIONS.CA);
/** Set of US-specific asset category names */
export const US_ASSET_CATEGORIES = new Set(CATEGORY_SUGGESTIONS.US);
/** Set of AU-specific asset category names */
export const AU_ASSET_CATEGORIES = new Set(CATEGORY_SUGGESTIONS.AU);

export function getAllCategorySuggestions(): string[] {
  return [
    ...CATEGORY_SUGGESTIONS.CA,
    ...CATEGORY_SUGGESTIONS.US,
    ...CATEGORY_SUGGESTIONS.AU,
    ...CATEGORY_SUGGESTIONS.universal,
  ];
}

export interface SuggestionGroup {
  label: string;
  items: string[];
}

export function getGroupedCategorySuggestions(): SuggestionGroup[] {
  return [
    { label: "🇨🇦 Canada", items: CATEGORY_SUGGESTIONS.CA },
    { label: "🇺🇸 USA", items: CATEGORY_SUGGESTIONS.US },
    { label: "🇦🇺 Australia", items: CATEGORY_SUGGESTIONS.AU },
    { label: "General", items: CATEGORY_SUGGESTIONS.universal },
  ];
}

/** Smart ROI defaults by account type (annual %) */
export const DEFAULT_ROI: Record<string, number> = {
  "401k": 7,
  "Roth 401k": 7,
  "IRA": 7,
  "Roth IRA": 7,
  "TFSA": 5,
  "RRSP": 5,
  "RESP": 5,
  "FHSA": 5,
  "LIRA": 5,
  "Super (Accumulation)": 7,
  "Super (Pension Phase)": 7,
  "First Home Super Saver": 7,
  "Savings": 2,
  "Savings Account": 2,
  "Checking": 0.5,
  "Brokerage": 7,
  "529": 6,
  "HSA": 6,
};

/** Get the suggested ROI for a category, or undefined if none */
export function getDefaultRoi(category: string): number | undefined {
  return DEFAULT_ROI[category];
}

/** Employer-sponsored registered accounts eligible for employer match */
export const EMPLOYER_MATCH_ELIGIBLE = new Set([
  "RRSP", "401k", "Roth 401k", "Super (Accumulation)",
]);

/**
 * Compute monthly employer match contribution.
 * Employer matches `matchPct`% of the user's monthly contribution, capped at
 * `matchCap`% of annual salary (divided by 12 for monthly).
 */
export function computeEmployerMatchMonthly(
  monthlyContribution: number,
  matchPct: number,
  matchCap: number,
  annualSalary: number,
): number {
  if (matchPct <= 0 || matchCap <= 0 || monthlyContribution <= 0 || annualSalary <= 0) return 0;
  const matchOnContrib = monthlyContribution * (matchPct / 100);
  const monthlyCap = (annualSalary * (matchCap / 100)) / 12;
  return Math.min(matchOnContrib, monthlyCap);
}

/** Categories whose ROI is taxed as interest income (not capital gains) by default */
const INCOME_TAX_ROI_CATEGORIES = new Set([
  "Savings", "Savings Account", "Checking", "GIC", "Money Market", "HISA",
]);

/** Tax-sheltered accounts where ROI is tax-free — toggle should be hidden */
const TAX_SHELTERED_CATEGORIES = new Set([
  "TFSA", "Roth IRA", "Roth 401k", "FHSA", "HSA",
  "Super (Pension Phase)",
]);

/** Get the default ROI tax treatment for a category */
export function getDefaultRoiTaxTreatment(category: string): RoiTaxTreatment {
  return INCOME_TAX_ROI_CATEGORIES.has(category) ? "income" : "capital-gains";
}

/** Whether the ROI tax treatment toggle should be shown for a category */
export function shouldShowRoiTaxToggle(category: string, taxTreatmentOverride?: TaxTreatment): boolean {
  return !TAX_SHELTERED_CATEGORIES.has(category) && getTaxTreatment(category, taxTreatmentOverride) !== "tax-free";
}

/** Categories that default to reinvesting returns (compound within the account) */
const REINVEST_DEFAULT_CATEGORIES = new Set([
  "401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA",
  "TFSA", "RRSP", "RESP", "FHSA", "LIRA",
  "Super (Accumulation)", "Super (Pension Phase)", "First Home Super Saver",
  "Brokerage",
]);

/** Get the default reinvest-returns setting for a category */
export function getDefaultReinvest(category: string): boolean {
  return REINVEST_DEFAULT_CATEGORIES.has(category);
}

/** Returns a flag emoji if the category is region-specific, or empty string */
export function getAssetCategoryFlag(category: string): string {
  if (CA_ASSET_CATEGORIES.has(category)) return "🇨🇦";
  if (US_ASSET_CATEGORIES.has(category)) return "🇺🇸";
  if (AU_ASSET_CATEGORIES.has(category)) return "🇦🇺";
  return "";
}

const MOCK_ASSETS: Asset[] = [
  { id: "a1", category: "Savings Account", amount: 12000 },
  { id: "a2", category: "TFSA", amount: 35000 },
  { id: "a3", category: "Brokerage", amount: 18500 },
];

function generateId(): string {
  return `a${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Project an asset's value at year milestones using compound growth + contributions */
function projectAssetValue(amount: number, annualRoi: number, monthlyContribution: number, years: number): number {
  const monthlyRate = annualRoi / 100 / 12;
  let balance = amount;
  for (let m = 0; m < years * 12; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContribution;
  }
  return Math.round(balance);
}

// formatCurrency and formatCompact defined inside component via useCurrency()

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

interface AssetEntryProps {
  items?: Asset[];
  onChange?: (items: Asset[]) => void;
  monthlySurplus?: number;
  homeCurrency?: import("@/lib/currency").SupportedCurrency;
  fxRates?: import("@/lib/currency").FxRates;
  annualEmploymentSalary?: number;
}

export default function AssetEntry({ items, onChange, monthlySurplus = 0, homeCurrency, fxRates, annualEmploymentSalary = 0 }: AssetEntryProps = {}) {
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.full(v);
  const formatCompact = (v: number) => fmt.compact(v);
  const assets = items ?? MOCK_ASSETS;

  const updateAssets = useCallback((updater: Asset[] | ((prev: Asset[]) => Asset[])) => {
    const next = typeof updater === "function" ? updater(assets) : updater;
    onChange?.(next);
  }, [assets, onChange]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "category" | "amount" | "roi" | "monthlyContribution" | "costBasisPercent" | "employerMatchPct" | "employerMatchCap" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [showNewSuggestions, setShowNewSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const newCategoryRef = useRef<HTMLInputElement>(null);
  const newAmountRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (addingNew && newCategoryRef.current) {
      newCategoryRef.current.focus();
    }
  }, [addingNew]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField]);

  const startEdit = (
    id: string,
    field: "category" | "amount" | "roi" | "monthlyContribution" | "costBasisPercent" | "employerMatchPct" | "employerMatchCap",
    currentValue: string
  ) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
    if (field === "category") {
      setShowSuggestions(true);
    }
  };

  const commitEdit = (overrideValue?: string) => {
    const value = overrideValue ?? editValue;
    if (editingId && editingField) {
      updateAssets((prev) =>
        prev.map((a) => {
          if (a.id !== editingId) return a;
          if (editingField === "category") {
            return { ...a, category: value || a.category };
          }
          if (editingField === "roi") {
            const val = parseFloat(value);
            return { ...a, roi: isNaN(val) ? undefined : val };
          }
          if (editingField === "monthlyContribution") {
            const val = parseCurrencyInput(value);
            return { ...a, monthlyContribution: val || undefined };
          }
          if (editingField === "costBasisPercent") {
            const val = parseFloat(value);
            if (isNaN(val)) return { ...a, costBasisPercent: undefined };
            const clamped = Math.max(0, Math.min(100, val));
            return { ...a, costBasisPercent: clamped };
          }
          if (editingField === "employerMatchPct") {
            const val = parseFloat(value);
            return { ...a, employerMatchPct: isNaN(val) || val <= 0 ? undefined : val };
          }
          if (editingField === "employerMatchCap") {
            const val = parseFloat(value);
            return { ...a, employerMatchCap: isNaN(val) || val <= 0 ? undefined : val };
          }
          return { ...a, amount: parseCurrencyInput(value) };
        })
      );
    }
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
    setShowSuggestions(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLElement).blur();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingField(null);
      setShowSuggestions(false);
    }
  };

  const deleteAsset = (id: string) => {
    updateAssets((prev) => {
      const next = prev.filter((a) => a.id !== id);
      // If we deleted the surplus target, reassign to first remaining
      if (next.length > 0 && !next.some((a) => a.surplusTarget)) {
        next[0] = { ...next[0], surplusTarget: true };
      }
      return next;
    });
  };

  const addAsset = () => {
    if (!newCategory.trim()) return;
    const amount = parseCurrencyInput(newAmount);
    updateAssets((prev) => {
      const isFirst = prev.length === 0;
      return [
        ...prev,
        { id: generateId(), category: newCategory.trim(), amount, surplusTarget: isFirst ? true : undefined },
      ];
    });
    setNewCategory("");
    setNewAmount("");
    setAddingNew(false);
    setShowNewSuggestions(false);
  };

  const handleNewKeyDown = (
    e: React.KeyboardEvent,
    field: "category" | "amount"
  ) => {
    if (e.key === "Enter") {
      if (field === "category" && newAmountRef.current) {
        newAmountRef.current.focus();
      } else {
        addAsset();
      }
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewCategory("");
      setNewAmount("");
      setShowNewSuggestions(false);
    }
  };

  const filteredSuggestions = (query: string) => {
    const all = getAllCategorySuggestions();
    if (!query) return all;
    return all.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  };

  const filteredGroupedSuggestions = (query: string): SuggestionGroup[] => {
    const groups = getGroupedCategorySuggestions();
    return groups
      .map((group) => ({
        ...group,
        items: query
          ? group.items.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
  };

  const hc = homeCurrency ?? "CAD";
  const rates = fxRates ?? FALLBACK_RATES;
  const total = assets.filter((a) => !a.computed).reduce((sum, a) => sum + convertToHome(a.amount, a.currency ?? hc, hc, rates), 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm sm:p-4">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-200">
        <span aria-hidden="true">📊</span>
        Assets
      </h2>

      {assets.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center py-4 text-center" data-testid="asset-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Add your savings, investments, and property to see your full picture.
          </p>
        </div>
      ) : (
        <div className="space-y-0" role="list" aria-label="Asset items">
          {/* Regular assets first, computed assets at the bottom */}
          {[...assets.filter((a) => !a.computed), ...assets.filter((a) => a.computed)].map((asset, idx, sortedAssets) => {
            const defaultRoi = getDefaultRoi(asset.category);
            const displayRoi = asset.roi ?? defaultRoi;
            const hasRoi = asset.roi !== undefined;
            const hasContribution = asset.monthlyContribution !== undefined && asset.monthlyContribution > 0;
            const isComputed = asset.computed === true;
            // Show separator before first computed asset
            const isFirstComputed = isComputed && (idx === 0 || !sortedAssets[idx - 1].computed);
            return (
            <DataFlowSourceItem key={asset.id} id={`asset:${asset.id}`} label={asset.category} value={asset.amount}>
            <div role="listitem">
              {isFirstComputed && (
                <div className="mt-2 mb-1 border-t border-dashed border-white/10 pt-2 px-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Auto-computed</span>
                </div>
              )}
              <div
                className={`group flex items-center justify-between rounded-lg px-3 transition-all duration-200 ${isComputed ? "py-0.5 bg-slate-800/60 border border-dashed border-white/10 rounded-md mx-1" : "py-0.5 hover:bg-white/5"}`}
              >
                <div className="flex flex-1 items-center gap-1 sm:gap-3 min-w-0">
                  {/* Category */}
                  {editingId === asset.id && editingField === "category" && !isComputed ? (
                    <div className="relative flex-1 min-w-0">
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => {
                          setEditValue(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onBlur={() => {
                          // Delay to allow suggestion click
                          setTimeout(() => {
                            commitEdit();
                          }, 150);
                        }}
                        onKeyDown={handleEditKeyDown}
                        className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200"
                        aria-label="Edit category name"
                      />
                      {showSuggestions &&
                        filteredGroupedSuggestions(editValue).length > 0 && (
                          <div
                            ref={suggestionsRef}
                            className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30"
                          >
                            {filteredGroupedSuggestions(editValue).map((group) => (
                              <div key={group.label}>
                                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500" data-testid="suggestion-group-header">{group.label}</div>
                                {group.items.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      commitEdit(suggestion);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-sm text-slate-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
                                  >
                                    {getAssetCategoryFlag(suggestion) && (
                                      <span className="mr-1" aria-hidden="true">{getAssetCategoryFlag(suggestion)}</span>
                                    )}
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  ) : (
                    isComputed ? (
                      <span className="flex-1 min-w-0 text-left text-sm text-slate-400 px-2 py-1">
                        {asset.category}
                        <span className="ml-1.5 inline-flex items-center rounded-full bg-slate-700/40 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 uppercase tracking-wide">auto</span>
                      </span>
                    ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(asset.id, "category", asset.category)
                      }
                      className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 text-left text-sm text-slate-300 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-white/10 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                      aria-label={`Edit category for ${asset.category}`}
                    >
                      {getAssetCategoryFlag(asset.category) && (
                        <span className="mr-1" aria-hidden="true">{getAssetCategoryFlag(asset.category)}</span>
                      )}
                      {asset.category}
                    </button>
                    )
                  )}

                  {/* Amount + Currency */}
                  <div className="flex items-center gap-1">
                    {homeCurrency && fxRates && !isComputed && (
                      <CurrencyBadge
                        currency={asset.currency}
                        homeCurrency={homeCurrency}
                        amount={asset.amount}
                        fxRates={fxRates}
                        onCurrencyChange={(cu) => {
                          updateAssets(assets.map((a) => a.id === asset.id ? { ...a, currency: cu } : a));
                        }}
                      />
                    )}
                    {editingId === asset.id && editingField === "amount" && !isComputed ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit()}
                        onKeyDown={handleEditKeyDown}
                        className="w-28 rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-1 text-right text-sm font-medium text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200"
                        aria-label={`Edit amount for ${asset.category}`}
                      />
                    ) : (
                      isComputed ? (
                        <span className="w-28 text-right text-sm font-medium text-slate-500 px-2 py-1">
                          {formatCurrency(asset.amount)}
                        </span>
                      ) : (
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(asset.id, "amount", String(asset.amount))
                        }
                        className="w-28 min-h-[44px] sm:min-h-0 text-right text-sm font-medium text-emerald-400 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-emerald-400/10 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        aria-label={`Edit amount for ${asset.category}, currently ${formatCurrency(asset.amount)}`}
                      >
                        {formatCurrency(asset.amount)}
                      </button>
                      )
                    )}
                  </div>
                </div>

                {/* Delete button — hidden for computed assets */}
                {!isComputed && (
                <button
                  type="button"
                  onClick={() => deleteAsset(asset.id)}
                  className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-slate-500 sm:min-h-0 sm:min-w-0 sm:p-1 sm:text-slate-600 sm:opacity-0 transition-all duration-150 hover:bg-rose-400/10 hover:text-rose-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 sm:group-hover:opacity-100"
                  aria-label={`Delete ${asset.category}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 sm:h-4 sm:w-4"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                )}
              </div>

              {/* Secondary detail fields */}
              {/* Hide all detail controls for Property Equity — taxable badge, ROI, contribution, cost basis are irrelevant */}
              {asset.id === "_computed_equity" ? (
                <div className="pb-0.5" />
              ) : (
              <div className="flex flex-wrap items-center gap-1.5 pb-1 px-3" data-testid={`asset-details-${asset.id}`}>
                {/* Tax treatment pill — auto-detected, click to override */}
                {(() => {
                  const autoDetected = getTaxTreatment(asset.category);
                  const effective = asset.taxTreatment ?? autoDetected;
                  const isOverridden = asset.taxTreatment !== undefined;
                  const treatments: TaxTreatment[] = ["tax-free", "tax-deferred", "taxable"];
                  const labels: Record<TaxTreatment, string> = { "tax-free": "Tax-free", "tax-deferred": "Tax-deferred", "taxable": "Taxable", "super-accumulation": "Super 15%", "super-fhss": "FHSS" };
                  const colors: Record<TaxTreatment, string> = {
                    "tax-free": "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
                    "tax-deferred": "bg-rose-500/15 text-rose-400 hover:bg-rose-500/25",
                    "taxable": "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25",
                    "super-accumulation": "bg-sky-500/15 text-sky-400 hover:bg-sky-500/25",
                    "super-fhss": "bg-violet-500/15 text-violet-400 hover:bg-violet-500/25",
                  };
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        // Cycle to next treatment
                        const currentIdx = treatments.indexOf(effective);
                        const nextTreatment = treatments[(currentIdx + 1) % treatments.length];
                        // If cycling back to auto-detected, clear the override
                        const override = nextTreatment === autoDetected ? undefined : nextTreatment;
                        updateAssets(assets.map((a) =>
                          a.id === asset.id ? { ...a, taxTreatment: override } : a
                        ));
                      }}
                      className={`rounded px-1.5 py-0.5 text-xs font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${colors[effective]}`}
                      aria-label={`Tax treatment for ${asset.category}: ${labels[effective]}${isOverridden ? " (overridden)" : " (auto-detected)"}. Click to change.`}
                      data-testid={`tax-treatment-pill-${asset.id}`}
                    >
                      {labels[effective]}{isOverridden ? " *" : ""}
                    </button>
                  );
                })()}

                {/* ROI badge/editor */}
                {editingId === asset.id && editingField === "roi" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className="w-20 rounded border border-cyan-500/50 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-200 outline-none ring-1 ring-cyan-500/20"
                    aria-label={`Edit ROI for ${asset.category}`}
                    placeholder="e.g. 7"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(asset.id, "roi", String(asset.roi ?? ""))}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                      hasRoi
                        ? "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                        : displayRoi !== undefined
                          ? "bg-slate-800/60 text-slate-500 hover:bg-slate-700 hover:text-slate-400"
                          : "border border-dashed border-white/10 text-slate-600 hover:bg-slate-800/60 hover:text-slate-500"
                    }`}
                    aria-label={`Edit ROI for ${asset.category}${displayRoi !== undefined ? `, currently ${displayRoi}%` : ""}`}
                    data-testid={`roi-badge-${asset.id}`}
                  >
                    {displayRoi !== undefined
                      ? `${displayRoi}% ROI${!hasRoi ? " (suggested)" : ""}`
                      : isComputed ? "Set estimated return %" : "Annual return %"}
                  </button>
                )}

                {/* ROI tax treatment toggle — only when ROI > 0 and not tax-sheltered */}
                {displayRoi !== undefined && displayRoi > 0 && shouldShowRoiTaxToggle(asset.category, asset.taxTreatment) && (() => {
                  const effectiveTreatment = asset.roiTaxTreatment ?? getDefaultRoiTaxTreatment(asset.category);
                  const isIncome = effectiveTreatment === "income";
                  const isExplicit = asset.roiTaxTreatment !== undefined;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const newTreatment = isIncome ? "capital-gains" : "income";
                        updateAssets(assets.map((a) =>
                          a.id === asset.id ? { ...a, roiTaxTreatment: newTreatment } : a
                        ));
                      }}
                      className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                        isExplicit
                          ? isIncome
                            ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                            : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
                          : "bg-slate-800/60 text-slate-500 hover:bg-slate-700 hover:text-slate-400"
                      }`}
                      aria-label={`Toggle ROI tax treatment for ${asset.category}, currently ${isIncome ? "interest income" : "capital gains"}`}
                      data-testid={`roi-tax-treatment-${asset.id}`}
                    >
                      {isIncome ? "Interest income" : "Capital gains"}
                    </button>
                  );
                })()}

                {/* Reinvest returns toggle — only when ROI > 0 */}
                {displayRoi !== undefined && displayRoi > 0 && (() => {
                  const effectiveReinvest = asset.reinvestReturns ?? getDefaultReinvest(asset.category);
                  const isExplicit = asset.reinvestReturns !== undefined;
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        updateAssets(assets.map((a) =>
                          a.id === asset.id ? { ...a, reinvestReturns: !effectiveReinvest } : a
                        ));
                      }}
                      className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                        isExplicit
                          ? effectiveReinvest
                            ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                          : "bg-slate-800/60 text-slate-500 hover:bg-slate-700 hover:text-slate-400"
                      }`}
                      aria-label={`Toggle reinvest returns for ${asset.category}, currently ${effectiveReinvest ? "reinvesting" : "paying out"}`}
                      data-testid={`reinvest-toggle-${asset.id}`}
                    >
                      {effectiveReinvest ? "Reinvesting" : "Payout"}
                    </button>
                  );
                })()}

                {/* Monthly contribution badge/editor */}
                {editingId === asset.id && editingField === "monthlyContribution" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className="w-24 rounded border border-cyan-500/50 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-200 outline-none ring-1 ring-cyan-500/20"
                    aria-label={`Edit monthly contribution for ${asset.category}`}
                    placeholder="e.g. 500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(asset.id, "monthlyContribution", String(asset.monthlyContribution ?? ""))}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                      hasContribution
                        ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                        : "border border-dashed border-white/10 text-slate-600 hover:bg-slate-800/60 hover:text-slate-500"
                    }`}
                    aria-label={`Edit monthly contribution for ${asset.category}${hasContribution ? `, currently ${formatCurrency(asset.monthlyContribution!)}` : ""}`}
                    data-testid={`contribution-badge-${asset.id}`}
                  >
                    {hasContribution
                      ? `+${formatCurrency(asset.monthlyContribution!)}/mo`
                      : "Monthly contribution"}
                  </button>
                )}

                {/* Employer match — only for eligible registered accounts */}
                {EMPLOYER_MATCH_ELIGIBLE.has(asset.category) && !isComputed && (() => {
                  const hasPct = asset.employerMatchPct !== undefined && asset.employerMatchPct > 0;
                  const hasCap = asset.employerMatchCap !== undefined && asset.employerMatchCap > 0;
                  const monthlyMatch = (hasPct && hasCap && asset.monthlyContribution)
                    ? computeEmployerMatchMonthly(
                        asset.monthlyContribution,
                        asset.employerMatchPct!,
                        asset.employerMatchCap!,
                        annualEmploymentSalary,
                      )
                    : 0;
                  return (
                    <div className="flex flex-wrap items-center gap-1" data-testid={`employer-match-section-${asset.id}`}>
                      {/* Match % badge */}
                      {editingId === asset.id && editingField === "employerMatchPct" ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit()}
                          onKeyDown={handleEditKeyDown}
                          className="w-20 rounded border border-cyan-500/50 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-200 outline-none ring-1 ring-cyan-500/20"
                          aria-label={`Edit employer match percent for ${asset.category}`}
                          placeholder="e.g. 50"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(asset.id, "employerMatchPct", String(asset.employerMatchPct ?? ""))}
                          className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                            hasPct
                              ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                              : "border border-dashed border-white/10 text-slate-600 hover:bg-slate-800/60 hover:text-slate-500"
                          }`}
                          aria-label={`Edit employer match percent for ${asset.category}${hasPct ? `, currently ${asset.employerMatchPct}%` : ""}`}
                          data-testid={`employer-match-pct-${asset.id}`}
                        >
                          {hasPct ? `${asset.employerMatchPct}% match` : "Employer match %"}
                        </button>
                      )}
                      {/* Cap % badge */}
                      {editingId === asset.id && editingField === "employerMatchCap" ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit()}
                          onKeyDown={handleEditKeyDown}
                          className="w-20 rounded border border-cyan-500/50 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-200 outline-none ring-1 ring-cyan-500/20"
                          aria-label={`Edit employer match cap for ${asset.category}`}
                          placeholder="e.g. 6"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(asset.id, "employerMatchCap", String(asset.employerMatchCap ?? ""))}
                          className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                            hasCap
                              ? "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                              : "border border-dashed border-white/10 text-slate-600 hover:bg-slate-800/60 hover:text-slate-500"
                          }`}
                          aria-label={`Edit employer match cap for ${asset.category}${hasCap ? `, currently ${asset.employerMatchCap}% of salary` : ""}`}
                          data-testid={`employer-match-cap-${asset.id}`}
                        >
                          {hasCap ? `up to ${asset.employerMatchCap}% salary` : "salary cap %"}
                        </button>
                      )}
                      {/* Computed match amount */}
                      {monthlyMatch > 0 && (
                        <span
                          className="rounded bg-violet-500/10 px-1.5 py-0.5 text-xs text-violet-400"
                          data-testid={`employer-match-amount-${asset.id}`}
                        >
                          +{formatCurrency(monthlyMatch)}/mo employer match
                        </span>
                      )}
                    </div>
                  );
                })()}

                {/* Cost basis % — only for taxable accounts */}
                {getTaxTreatment(asset.category, asset.taxTreatment) === "taxable" && asset.amount > 0 && (
                  editingId === asset.id && editingField === "costBasisPercent" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit()}
                      onKeyDown={handleEditKeyDown}
                      className="w-20 rounded border border-cyan-500/50 bg-slate-900 px-1.5 py-0.5 text-xs text-slate-200 outline-none ring-1 ring-cyan-500/20"
                      aria-label={`Edit cost basis percent for ${asset.category}`}
                      placeholder="e.g. 80"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(asset.id, "costBasisPercent", String(asset.costBasisPercent ?? ""))}
                      className={`group/cb relative rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 ${
                        asset.costBasisPercent !== undefined && asset.costBasisPercent < 100
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          : "border border-dashed border-white/10 text-slate-600 hover:bg-slate-800/60 hover:text-slate-500"
                      }`}
                      aria-label={`Edit cost basis percent for ${asset.category}${asset.costBasisPercent !== undefined ? `, currently ${asset.costBasisPercent}%` : ""}`}
                      data-testid={`cost-basis-badge-${asset.id}`}
                    >
                      {asset.costBasisPercent !== undefined && asset.costBasisPercent < 100
                        ? `${asset.costBasisPercent}% cost basis`
                        : "Cost basis %"}
                      <span className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-stone-800 px-2 py-1 text-[10px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/cb:opacity-100">
                        % of balance that is original contributions (not gains).
                        <br />Gains above cost basis are subject to capital gains tax on withdrawal.
                      </span>
                    </button>
                  )
                )}

                {/* Unrealized gains badge */}
                {getTaxTreatment(asset.category, asset.taxTreatment) === "taxable" && asset.costBasisPercent !== undefined && asset.costBasisPercent < 100 && asset.amount > 0 && (
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400" data-testid={`unrealized-gains-${asset.id}`}>
                    ~{formatCurrency(Math.round(asset.amount * (100 - asset.costBasisPercent) / 100))} unrealized gains
                  </span>
                )}

                {/* Surplus target — radio behavior, one must always be selected */}
                <label
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
                    asset.surplusTarget
                      ? "bg-amber-500/10 text-amber-400 cursor-default"
                      : "border border-dashed border-white/10 text-slate-600 hover:bg-slate-800/60 hover:text-slate-500 cursor-pointer"
                  }`}
                  data-testid={`surplus-target-${asset.id}`}
                >
                  <input
                    type="radio"
                    name="surplus-target"
                    checked={asset.surplusTarget ?? false}
                    onChange={() => {
                      if (asset.surplusTarget) return;
                      updateAssets((prev) =>
                        prev.map((a) => ({
                          ...a,
                          surplusTarget: a.id === asset.id,
                        }))
                      );
                    }}
                    className="h-3 w-3 border-white/20 text-amber-400 accent-amber-500"
                  />
                  Surplus goes here
                </label>
                {asset.surplusTarget && monthlySurplus > 0 && (
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400" data-testid={`surplus-amount-${asset.id}`}>
                    +{formatCurrency(monthlySurplus)}/mo surplus
                  </span>
                )}
              </div>
              )}

              {/* Per-asset 10/20/30 year projections */}
              {(() => {
                const matchContrib = (asset.employerMatchPct && asset.employerMatchCap && asset.monthlyContribution)
                  ? computeEmployerMatchMonthly(asset.monthlyContribution, asset.employerMatchPct, asset.employerMatchCap, annualEmploymentSalary)
                  : 0;
                const totalContrib = (asset.monthlyContribution ?? 0) + matchContrib + (asset.surplusTarget ? monthlySurplus : 0);
                const showProjection = (displayRoi !== undefined && displayRoi > 0) || totalContrib > 0;
                return showProjection ? (
                  <div className={`flex items-center gap-3 pb-1.5 text-[10px] text-slate-500 ${isComputed ? "px-4" : "px-3"}`} data-testid={`asset-projection-${asset.id}`}>
                    <span className="font-medium">Projected:</span>
                    <span>10yr <span className="text-emerald-400 font-medium">{formatCompact(projectAssetValue(asset.amount, displayRoi ?? 0, totalContrib, 10))}</span></span>
                    <span>20yr <span className="text-emerald-400 font-medium">{formatCompact(projectAssetValue(asset.amount, displayRoi ?? 0, totalContrib, 20))}</span></span>
                    <span>30yr <span className="text-emerald-400 font-medium">{formatCompact(projectAssetValue(asset.amount, displayRoi ?? 0, totalContrib, 30))}</span></span>
                  </div>
                ) : null;
              })()}
            </div>
          </DataFlowSourceItem>
          );})}
        </div>
      )}

      {/* Add new asset row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/5 px-3 py-2 animate-in">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <input
                ref={newCategoryRef}
                type="text"
                placeholder="Category name..."
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  setShowNewSuggestions(true);
                }}
                onFocus={() => setShowNewSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowNewSuggestions(false), 150);
                }}
                onKeyDown={(e) => handleNewKeyDown(e, "category")}
                className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-3 py-2 text-base text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New asset category"
              />
              {showNewSuggestions &&
                filteredGroupedSuggestions(newCategory).length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30">
                    {filteredGroupedSuggestions(newCategory).map((group) => (
                      <div key={group.label}>
                        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500" data-testid="suggestion-group-header">{group.label}</div>
                        {group.items.map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setNewCategory(suggestion);
                              setShowNewSuggestions(false);
                              newAmountRef.current?.focus();
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300 sm:py-1.5"
                          >
                            {getAssetCategoryFlag(suggestion) && (
                              <span className="mr-1" aria-hidden="true">{getAssetCategoryFlag(suggestion)}</span>
                            )}
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={newAmountRef}
                type="text"
                placeholder="$0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                onKeyDown={(e) => handleNewKeyDown(e, "amount")}
                className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-3 py-2 text-right text-base text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:w-28 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New asset amount"
              />
              <button
                type="button"
                onClick={addAsset}
                className="min-h-[44px] rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 transition-all duration-150 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
                aria-label="Confirm add asset"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setNewCategory("");
                  setNewAmount("");
                  setShowNewSuggestions(false);
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-slate-500 sm:min-h-0 sm:min-w-0 sm:p-1 transition-colors duration-150 hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Cancel adding asset"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-4 sm:w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total and Add button */}
      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
        <span className="text-sm font-medium text-slate-400">
          Total: {formatCurrency(total)}
        </span>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-cyan-400 transition-all duration-150 hover:bg-cyan-500/10 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 active:bg-cyan-500/20"
          >
            + Add Asset
          </button>
        )}
      </div>
    </div>
  );
}
