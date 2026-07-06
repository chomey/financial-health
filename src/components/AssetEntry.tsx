"use client";

import { useState, useRef, useCallback } from "react";
import CurrencyBadge from "@/components/CurrencyBadge";
import { DataFlowSourceItem } from "@/components/DataFlowArrows";
import { useCurrency } from "@/lib/CurrencyContext";
import { convertToHome, FALLBACK_RATES } from "@/lib/currency";
import { getTaxTreatment, type TaxTreatment } from "@/lib/withdrawal-tax";
import { parseCurrencyInput, formatNumericInput } from "@/lib/format-input";
import { generateId, useEditState, useAddNew } from "@/lib/entry-hooks";
import HelpTip from "@/components/HelpTip";
import { useModeContext } from "@/lib/ModeContext";
import type { Property } from "@/components/PropertyEntry";
import { getRegisteredCountries } from "@/lib/countries";
import {
  DESTRUCTIVE_GHOST_BUTTON_CLASS,
  FORM_INPUT_CLASS,
  FORM_INPUT_COMPACT_CLASS,
  PRIMARY_BUTTON_CLASS,
} from "@/components/formStyles";

/** ID for the single property created in simple mode */
export const SIMPLE_HOME_ID = "_simple_home";

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

const UNIVERSAL_CATEGORIES = ["Savings", "Checking", "Brokerage", "Vehicle", "Other"];

/** Get the description for a known account type from country vehicle plugins */
export function getAccountTypeDescription(category: string): string | undefined {
  for (const c of getRegisteredCountries()) {
    const desc = c.vehicles.getDescription(category);
    if (desc !== undefined) return desc;
  }
  return undefined;
}

export function getAllCategorySuggestions(): string[] {
  return [
    ...getRegisteredCountries().flatMap((c) => c.vehicles.categories),
    ...UNIVERSAL_CATEGORIES,
  ];
}

export interface SuggestionGroup {
  label: string;
  items: string[];
}

export function getGroupedCategorySuggestions(): SuggestionGroup[] {
  return [
    ...getRegisteredCountries().map((c) => ({
      label: `${c.flagEmoji} ${c.shortLabel}`,
      items: c.vehicles.categories,
    })),
    { label: "General", items: UNIVERSAL_CATEGORIES },
  ];
}

const UNIVERSAL_DEFAULT_ROI: Record<string, number> = {
  "Savings": 2,
  "Savings Account": 2,
  "Checking": 0.5,
  "Brokerage": 7,
};

/** Get the suggested ROI for a category, or undefined if none */
export function getDefaultRoi(category: string): number | undefined {
  for (const c of getRegisteredCountries()) {
    const roi = c.vehicles.getDefaultRoi(category);
    if (roi !== undefined) return roi;
  }
  return UNIVERSAL_DEFAULT_ROI[category];
}

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

/** Get the default ROI tax treatment for a category */
export function getDefaultRoiTaxTreatment(category: string): RoiTaxTreatment {
  return getRegisteredCountries().some((c) => c.vehicles.isIncomeTaxRoi(category)) ? "income" : "capital-gains";
}

/** Whether the ROI tax treatment toggle should be shown for a category */
export function shouldShowRoiTaxToggle(category: string, taxTreatmentOverride?: TaxTreatment): boolean {
  const isTaxSheltered = getRegisteredCountries().some((c) => c.vehicles.isTaxSheltered(category));
  return !isTaxSheltered && getTaxTreatment(category, taxTreatmentOverride) !== "tax-free";
}

/** Get the default reinvest-returns setting for a category */
export function getDefaultReinvest(category: string): boolean {
  return getRegisteredCountries().some((c) => c.vehicles.isReinvestDefault(category));
}

/** Returns a flag emoji if the category is region-specific, or empty string */
export function getAssetCategoryFlag(category: string): string {
  for (const c of getRegisteredCountries()) {
    if (c.vehicles.categories.includes(category)) return c.vehicles.flagEmoji;
  }
  return "";
}

const MOCK_ASSETS: Asset[] = [
  { id: "a1", category: "Savings Account", amount: 12000 },
  { id: "a2", category: "TFSA", amount: 35000 },
  { id: "a3", category: "Brokerage", amount: 18500 },
];

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

interface AssetEntryProps {
  items?: Asset[];
  onChange?: (items: Asset[]) => void;
  monthlySurplus?: number;
  homeCurrency?: import("@/lib/currency").SupportedCurrency;
  fxRates?: import("@/lib/currency").FxRates;
  annualEmploymentSalary?: number;
  properties?: Property[];
  onPropertiesChange?: (properties: Property[]) => void;
}

export default function AssetEntry({ items, onChange, monthlySurplus = 0, homeCurrency, fxRates, annualEmploymentSalary = 0, properties, onPropertiesChange }: AssetEntryProps = {}) {
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.full(v);
  const formatCompact = (v: number) => fmt.compact(v);
  const assets = items ?? MOCK_ASSETS;
  const { mode } = useModeContext();
  const isSimple = mode === "simple";

  const updateAssets = useCallback((updater: Asset[] | ((prev: Asset[]) => Asset[])) => {
    const next = typeof updater === "function" ? updater(assets) : updater;
    onChange?.(next);
  }, [assets, onChange]);

  // Simple mode: home value and mortgage balance fields
  const [editingHomeField, setEditingHomeField] = useState<"value" | "mortgage" | null>(null);
  const [homeFieldInput, setHomeFieldInput] = useState("");
  const homeValueInputRef = useRef<HTMLInputElement>(null);
  const mortgageInputRef = useRef<HTMLInputElement>(null);
  const simpleHome = (properties ?? []).find((p) => p.id === SIMPLE_HOME_ID);
  const simpleHomeValue = simpleHome?.value ?? 0;
  const simpleHomeMortgage = simpleHome?.mortgage ?? 0;

  const handleSimpleHomeChange = (field: "value" | "mortgage", amount: number) => {
    if (!onPropertiesChange) return;
    const propList = properties ?? [];
    const newValue = field === "value" ? amount : simpleHomeValue;
    const newMortgage = field === "mortgage" ? amount : simpleHomeMortgage;
    if (newValue <= 0 && newMortgage <= 0) {
      onPropertiesChange(propList.filter((p) => p.id !== SIMPLE_HOME_ID));
    } else if (simpleHome) {
      onPropertiesChange(propList.map((p) => p.id === SIMPLE_HOME_ID ? { ...p, value: newValue, mortgage: newMortgage } : p));
    } else {
      onPropertiesChange([...propList, { id: SIMPLE_HOME_ID, name: "Primary Residence", value: newValue, mortgage: newMortgage }]);
    }
  };

  const commitHomeField = (field: "value" | "mortgage") => {
    handleSimpleHomeChange(field, parseCurrencyInput(homeFieldInput));
    setEditingHomeField(null);
  };

  type AssetField = "category" | "amount" | "roi" | "monthlyContribution" | "costBasisPercent" | "employerMatchPct" | "employerMatchCap";
  const edit = useEditState<AssetField>(["category"]);
  const { editingId, editingField, editValue, showSuggestions, inputRef, startEdit, clearEdit, setEditValue, setShowSuggestions, handleEditKeyDown } = edit;
  const addNew = useAddNew();
  const { addingNew, newCategory, newAmount, showNewSuggestions, newCategoryRef, newAmountRef, setAddingNew, setNewCategory, setNewAmount, setShowNewSuggestions, resetNew, handleNewKeyDown } = addNew;
  const suggestionsRef = useRef<HTMLDivElement>(null);

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
    clearEdit();
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
        { id: generateId("a"), category: newCategory.trim(), amount, surplusTarget: isFirst ? true : undefined },
      ];
    });
    resetNew();
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

      {/* Simple mode: Home value and Mortgage balance subsection */}
      {isSimple && onPropertiesChange && (
        <div className="mb-3 border-b border-white/10 pb-3" data-testid="simple-home-section">
          <div className="flex items-center justify-between px-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                <span aria-hidden="true">🏠</span>
                Home
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Optional — leave blank if renting</p>
            </div>
          </div>
          {/* Home value row */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm text-slate-400">Home value</span>
            {editingHomeField === "value" ? (
              <input
                ref={homeValueInputRef}
                type="text"
                inputMode="decimal"
                value={homeFieldInput}
                onChange={(e) => setHomeFieldInput(formatNumericInput(e.target.value))}
                onBlur={() => commitHomeField("value")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitHomeField("value"); }
                  if (e.key === "Escape") { setEditingHomeField(null); }
                }}
                className={`${FORM_INPUT_COMPACT_CLASS} w-32 text-right font-medium`}
                aria-label="Home value"
                data-testid="simple-home-value-input"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setHomeFieldInput(simpleHomeValue > 0 ? String(simpleHomeValue) : "");
                  setEditingHomeField("value");
                  setTimeout(() => homeValueInputRef.current?.focus(), 0);
                }}
                className="focus-ring w-32 rounded px-2 py-1 text-right text-sm font-medium text-emerald-400 transition-colors duration-150 hover:bg-emerald-400/10 hover:text-emerald-300"
                aria-label={`Edit home value, currently ${formatCurrency(simpleHomeValue)}`}
                data-testid="simple-home-value"
              >
                {simpleHomeValue > 0 ? formatCurrency(simpleHomeValue) : "$0"}
              </button>
            )}
          </div>
          {/* Mortgage balance row */}
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-sm text-slate-400">Mortgage balance</span>
            {editingHomeField === "mortgage" ? (
              <input
                ref={mortgageInputRef}
                type="text"
                inputMode="decimal"
                value={homeFieldInput}
                onChange={(e) => setHomeFieldInput(formatNumericInput(e.target.value))}
                onBlur={() => commitHomeField("mortgage")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); commitHomeField("mortgage"); }
                  if (e.key === "Escape") { setEditingHomeField(null); }
                }}
                className={`${FORM_INPUT_COMPACT_CLASS} w-32 text-right font-medium`}
                aria-label="Mortgage balance"
                data-testid="simple-mortgage-input"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setHomeFieldInput(simpleHomeMortgage > 0 ? String(simpleHomeMortgage) : "");
                  setEditingHomeField("mortgage");
                  setTimeout(() => mortgageInputRef.current?.focus(), 0);
                }}
                className="focus-ring w-32 rounded px-2 py-1 text-right text-sm font-medium text-rose-400 transition-colors duration-150 hover:bg-rose-400/10 hover:text-rose-300"
                aria-label={`Edit mortgage balance, currently ${formatCurrency(simpleHomeMortgage)}`}
                data-testid="simple-mortgage-value"
              >
                {simpleHomeMortgage > 0 ? formatCurrency(simpleHomeMortgage) : "$0"}
              </button>
            )}
          </div>
        </div>
      )}

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
          {[...assets.filter((a) => !a.computed), ...assets.filter((a) => a.computed)].filter((a) => !(isSimple && a.computed)).map((asset) => {
            const defaultRoi = getDefaultRoi(asset.category);
            const displayRoi = asset.roi ?? defaultRoi;
            const hasRoi = asset.roi !== undefined;
            const hasContribution = asset.monthlyContribution !== undefined && asset.monthlyContribution > 0;
            const isComputed = asset.computed === true;
            return (
            <DataFlowSourceItem key={asset.id} id={`asset:${asset.id}`} label={asset.category} value={asset.amount}>
            <div role="listitem">
              <div
                className={`group flex items-center justify-between rounded-lg px-3 transition-colors duration-200 ${isComputed ? "py-0.5 bg-slate-800/60 border border-dashed border-white/10 rounded-md mx-1" : "py-0.5 hover:bg-white/5"}`}
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
                        className={`${FORM_INPUT_COMPACT_CLASS} w-full`}
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
                                    className="focus-ring w-full px-3 py-1.5 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-cyan-500/10 hover:text-cyan-300"
                                  >
                                    <div>
                                      {getAssetCategoryFlag(suggestion) && (
                                        <span className="mr-1" aria-hidden="true">{getAssetCategoryFlag(suggestion)}</span>
                                      )}
                                      {suggestion}
                                    </div>
                                    {getAccountTypeDescription(suggestion) && (
                                      <div className="text-[11px] text-slate-500 mt-0.5">{getAccountTypeDescription(suggestion)}</div>
                                    )}
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
                      className="focus-ring min-h-[44px] min-w-0 flex-1 rounded px-2 py-2 text-left text-sm text-slate-300 transition-colors duration-150 hover:bg-white/10 hover:text-slate-100 sm:min-h-0 sm:py-1"
                      aria-label={`Edit category for ${asset.category}`}
                    >
                      <div>
                        {getAssetCategoryFlag(asset.category) && (
                          <span className="mr-1" aria-hidden="true">{getAssetCategoryFlag(asset.category)}</span>
                        )}
                        {asset.category}
                      </div>
                      {getAccountTypeDescription(asset.category) && (
                        <div className="text-[11px] text-slate-500 mt-0.5 font-normal">{getAccountTypeDescription(asset.category)}</div>
                      )}
                    </button>
                    )
                  )}

                  {/* Amount + Currency */}
                  <div className="flex items-center gap-1">
                    {homeCurrency && fxRates && !isComputed && !isSimple && (
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
                        inputMode="decimal"
                        value={editValue}
                        onChange={(e) => setEditValue(formatNumericInput(e.target.value))}
                        onBlur={() => commitEdit()}
                        onKeyDown={handleEditKeyDown}
                        className={`${FORM_INPUT_COMPACT_CLASS} w-28 text-right font-medium`}
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
                        className="focus-ring min-h-[44px] w-28 rounded px-2 py-2 text-right text-sm font-medium text-emerald-400 transition-colors duration-150 hover:bg-emerald-400/10 hover:text-emerald-300 sm:min-h-0 sm:py-1"
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
                  className={`${DESTRUCTIVE_GHOST_BUTTON_CLASS} ml-2 flex min-h-[44px] min-w-[44px] items-center justify-center p-2 sm:min-h-0 sm:min-w-0 sm:p-1 sm:opacity-0 focus-visible:opacity-100 sm:group-hover:opacity-100`}
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
              {/* In simple mode, hide all secondary detail fields */}
              {isSimple ? null : asset.id === "_computed_equity" ? (
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
                      className={`focus-ring rounded px-1.5 py-0.5 text-xs font-medium transition-colors duration-150 ${colors[effective]}`}
                      aria-label={`Tax treatment for ${asset.category}: ${labels[effective]}${isOverridden ? " (overridden)" : " (auto-detected)"}. Click to change.`}
                      data-testid={`tax-treatment-pill-${asset.id}`}
                    >
                      {labels[effective]}{isOverridden ? " *" : ""}
                    </button>
                  );
                })()}
                <HelpTip text="How withdrawals are taxed — auto-detected from account type, click pill to override." />

                {/* ROI badge/editor */}
                {editingId === asset.id && editingField === "roi" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(formatNumericInput(e.target.value))}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className={`${FORM_INPUT_COMPACT_CLASS} w-20 text-xs`}
                    aria-label={`Edit ROI for ${asset.category}`}
                    placeholder="e.g. 7"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => startEdit(asset.id, "roi", String(asset.roi ?? ""))}
                      className={`focus-ring rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
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
                    <HelpTip text="Expected annual return on this account, used to project future growth." />
                  </>
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
                      className={`focus-ring rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
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
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          updateAssets(assets.map((a) =>
                            a.id === asset.id ? { ...a, reinvestReturns: !effectiveReinvest } : a
                          ));
                        }}
                        className={`focus-ring rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
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
                      <HelpTip text="Reinvesting compounds returns into the balance; Payout counts returns as monthly income." />
                    </>
                  );
                })()}

                {/* Monthly contribution badge/editor */}
                {editingId === asset.id && editingField === "monthlyContribution" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="decimal"
                    value={editValue}
                    onChange={(e) => setEditValue(formatNumericInput(e.target.value))}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className={`${FORM_INPUT_COMPACT_CLASS} w-24 text-xs`}
                    aria-label={`Edit monthly contribution for ${asset.category}`}
                    placeholder="e.g. 500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(asset.id, "monthlyContribution", String(asset.monthlyContribution ?? ""))}
                    className={`focus-ring rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
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
                {getRegisteredCountries().some((c) => c.vehicles.isEmployerMatchEligible(asset.category)) && !isComputed && (() => {
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
                      <HelpTip text="Your employer matches a % of your contributions up to a salary cap." />
                      {/* Match % badge */}
                      {editingId === asset.id && editingField === "employerMatchPct" ? (
                        <input
                          ref={inputRef}
                          type="text"
                          inputMode="decimal"
                          value={editValue}
                          onChange={(e) => setEditValue(formatNumericInput(e.target.value))}
                          onBlur={() => commitEdit()}
                          onKeyDown={handleEditKeyDown}
                          className={`${FORM_INPUT_COMPACT_CLASS} w-20 text-xs`}
                          aria-label={`Edit employer match percent for ${asset.category}`}
                          placeholder="e.g. 50"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(asset.id, "employerMatchPct", String(asset.employerMatchPct ?? ""))}
                          className={`focus-ring rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
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
                          inputMode="decimal"
                          value={editValue}
                          onChange={(e) => setEditValue(formatNumericInput(e.target.value))}
                          onBlur={() => commitEdit()}
                          onKeyDown={handleEditKeyDown}
                          className={`${FORM_INPUT_COMPACT_CLASS} w-20 text-xs`}
                          aria-label={`Edit employer match cap for ${asset.category}`}
                          placeholder="e.g. 6"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(asset.id, "employerMatchCap", String(asset.employerMatchCap ?? ""))}
                          className={`focus-ring rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
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
                      inputMode="decimal"
                      value={editValue}
                      onChange={(e) => setEditValue(formatNumericInput(e.target.value))}
                      onBlur={() => commitEdit()}
                      onKeyDown={handleEditKeyDown}
                      className={`${FORM_INPUT_COMPACT_CLASS} w-20 text-xs`}
                      aria-label={`Edit cost basis percent for ${asset.category}`}
                      placeholder="e.g. 80"
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEdit(asset.id, "costBasisPercent", String(asset.costBasisPercent ?? ""))}
                        className={`focus-ring rounded px-1.5 py-0.5 text-xs transition-colors duration-150 ${
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
                      </button>
                      <HelpTip text="% of balance that is original contributions. Gains above cost basis are taxed on withdrawal." />
                    </>
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
                    className="focus-ring h-3 w-3 accent-cyan-400"
                  />
                  Surplus goes here
                </label>
                <HelpTip text="Monthly leftover cash after all expenses is deposited into this account." />
                {asset.surplusTarget && monthlySurplus > 0 && (
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-xs text-amber-400" data-testid={`surplus-amount-${asset.id}`}>
                    +{formatCurrency(monthlySurplus)}/mo surplus
                  </span>
                )}
              </div>
              )}

              {/* Per-asset 10/20/30 year projections — hidden in simple mode */}
              {!isSimple && (() => {
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
                onKeyDown={(e) => handleNewKeyDown(e, "category", addAsset)}
                className={`${FORM_INPUT_CLASS} w-full sm:h-9`}
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
                            className="focus-ring w-full px-3 py-2 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-cyan-500/10 hover:text-cyan-300 sm:py-1.5"
                          >
                            <div>
                              {getAssetCategoryFlag(suggestion) && (
                                <span className="mr-1" aria-hidden="true">{getAssetCategoryFlag(suggestion)}</span>
                              )}
                              {suggestion}
                            </div>
                            {getAccountTypeDescription(suggestion) && (
                              <div className="text-[11px] text-slate-500 mt-0.5">{getAccountTypeDescription(suggestion)}</div>
                            )}
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
                inputMode="decimal"
                placeholder="$0"
                value={newAmount}
                onChange={(e) => setNewAmount(formatNumericInput(e.target.value))}
                onKeyDown={(e) => handleNewKeyDown(e, "amount", addAsset)}
                className={`${FORM_INPUT_CLASS} w-full text-right sm:h-9 sm:w-28`}
                aria-label="New asset amount"
              />
              <button
                type="button"
                onClick={addAsset}
                className={`${PRIMARY_BUTTON_CLASS} min-h-[44px] sm:min-h-0`}
                aria-label="Confirm add asset"
              >
                Add
              </button>
              <button
                type="button"
                onClick={resetNew}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-white/10 bg-white/5 p-2 text-slate-200 transition-colors duration-150 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:outline-none sm:min-h-0 sm:min-w-0 sm:p-1"
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
            className={PRIMARY_BUTTON_CLASS}
          >
            + Add Asset
          </button>
        )}
      </div>
    </div>
  );
}
