"use client";

import { useState, useRef, useEffect } from "react";

export interface Asset {
  id: string;
  category: string;
  amount: number;
  roi?: number; // annual ROI percentage
  monthlyContribution?: number; // monthly contribution in $
  surplusTarget?: boolean; // monthly surplus is deposited here
}

const CATEGORY_SUGGESTIONS = {
  CA: ["TFSA", "RRSP", "RESP", "FHSA", "LIRA"],
  US: ["401k", "IRA", "Roth IRA", "529", "HSA"],
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

export function getAllCategorySuggestions(): string[] {
  return [
    ...CATEGORY_SUGGESTIONS.CA,
    ...CATEGORY_SUGGESTIONS.US,
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
    { label: "General", items: CATEGORY_SUGGESTIONS.universal },
  ];
}

/** Smart ROI defaults by account type (annual %) */
export const DEFAULT_ROI: Record<string, number> = {
  "401k": 7,
  "IRA": 7,
  "Roth IRA": 7,
  "TFSA": 5,
  "RRSP": 5,
  "RESP": 5,
  "FHSA": 5,
  "LIRA": 5,
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

/** Returns a flag emoji if the category is region-specific, or empty string */
export function getAssetCategoryFlag(category: string): string {
  if (CA_ASSET_CATEGORIES.has(category)) return "🇨🇦";
  if (US_ASSET_CATEGORIES.has(category)) return "🇺🇸";
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

function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toFixed(0)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

interface AssetEntryProps {
  items?: Asset[];
  onChange?: (items: Asset[]) => void;
}

export default function AssetEntry({ items, onChange }: AssetEntryProps = {}) {
  const [assets, setAssets] = useState<Asset[]>(items ?? MOCK_ASSETS);
  const isExternalSync = useRef(false);
  const didMount = useRef(false);
  const syncDidMount = useRef(false);

  // Sync with parent if controlled — intentional external-system sync
  // Skip initial mount since useState already handles the initial value
  useEffect(() => {
    if (!syncDidMount.current) {
      syncDidMount.current = true;
      return;
    }
    if (items !== undefined) {
      isExternalSync.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssets(items);
    }
  }, [items]);

  // Notify parent of internal changes via useEffect (not during render)
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (isExternalSync.current) {
      isExternalSync.current = false;
      return;
    }
    onChangeRef.current?.(assets);
  }, [assets]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "category" | "amount" | "roi" | "monthlyContribution" | null
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
    field: "category" | "amount" | "roi" | "monthlyContribution",
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
      setAssets((prev) =>
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
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingField(null);
      setShowSuggestions(false);
    }
  };

  const deleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const addAsset = () => {
    if (!newCategory.trim()) return;
    const amount = parseCurrencyInput(newAmount);
    setAssets((prev) => [
      ...prev,
      { id: generateId(), category: newCategory.trim(), amount },
    ]);
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

  const total = assets.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 sm:p-4">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-stone-800">
        <span aria-hidden="true">📊</span>
        Assets
      </h2>

      {assets.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center py-4 text-center" data-testid="asset-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm text-stone-400">
            Add your savings, investments, and property to see your full picture.
          </p>
        </div>
      ) : (
        <div className="space-y-1" role="list" aria-label="Asset items">
          {assets.map((asset) => {
            const defaultRoi = getDefaultRoi(asset.category);
            const displayRoi = asset.roi ?? defaultRoi;
            const hasRoi = asset.roi !== undefined;
            const hasContribution = asset.monthlyContribution !== undefined && asset.monthlyContribution > 0;
            return (
            <div key={asset.id} role="listitem">
              <div
                className="group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 hover:bg-stone-50"
              >
                <div className="flex flex-1 items-center gap-3 min-w-0">
                  {/* Category */}
                  {editingId === asset.id && editingField === "category" ? (
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
                        className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                        aria-label="Edit category name"
                      />
                      {showSuggestions &&
                        filteredGroupedSuggestions(editValue).length > 0 && (
                          <div
                            ref={suggestionsRef}
                            className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
                          >
                            {filteredGroupedSuggestions(editValue).map((group) => (
                              <div key={group.label}>
                                <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400" data-testid="suggestion-group-header">{group.label}</div>
                                {group.items.map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      commitEdit(suggestion);
                                    }}
                                    className="w-full px-3 py-1.5 text-left text-sm text-stone-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
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
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(asset.id, "category", asset.category)
                      }
                      className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 truncate text-left text-sm text-stone-700 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      aria-label={`Edit category for ${asset.category}`}
                    >
                      {getAssetCategoryFlag(asset.category) && (
                        <span className="mr-1" aria-hidden="true">{getAssetCategoryFlag(asset.category)}</span>
                      )}
                      {asset.category}
                    </button>
                  )}

                  {/* Amount */}
                  {editingId === asset.id && editingField === "amount" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit()}
                      onKeyDown={handleEditKeyDown}
                      className="w-28 rounded-md border border-blue-300 bg-white px-2 py-1 text-right text-sm font-medium text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                      aria-label={`Edit amount for ${asset.category}`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(asset.id, "amount", String(asset.amount))
                      }
                      className="w-28 min-h-[44px] sm:min-h-0 text-right text-sm font-medium text-green-700 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-green-50 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-200"
                      aria-label={`Edit amount for ${asset.category}, currently ${formatCurrency(asset.amount)}`}
                    >
                      {formatCurrency(asset.amount)}
                    </button>
                  )}
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  onClick={() => deleteAsset(asset.id)}
                  className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-stone-400 sm:min-h-0 sm:min-w-0 sm:p-1 sm:text-stone-300 sm:opacity-0 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:group-hover:opacity-100"
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
              </div>

              {/* Secondary detail fields: ROI and Monthly Contribution */}
              <div className="flex flex-wrap items-center gap-2 px-5 pb-1" data-testid={`asset-details-${asset.id}`}>
                {/* ROI badge/editor */}
                {editingId === asset.id && editingField === "roi" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className="w-20 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                    aria-label={`Edit ROI for ${asset.category}`}
                    placeholder="e.g. 7"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(asset.id, "roi", String(asset.roi ?? ""))}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      hasRoi
                        ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                        : displayRoi !== undefined
                          ? "bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                          : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                    }`}
                    aria-label={`Edit ROI for ${asset.category}${displayRoi !== undefined ? `, currently ${displayRoi}%` : ""}`}
                    data-testid={`roi-badge-${asset.id}`}
                  >
                    {displayRoi !== undefined
                      ? `${displayRoi}% ROI${!hasRoi ? " (suggested)" : ""}`
                      : "Annual return %"}
                  </button>
                )}

                {/* Monthly contribution badge/editor */}
                {editingId === asset.id && editingField === "monthlyContribution" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className="w-24 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                    aria-label={`Edit monthly contribution for ${asset.category}`}
                    placeholder="e.g. 500"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(asset.id, "monthlyContribution", String(asset.monthlyContribution ?? ""))}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      hasContribution
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                    }`}
                    aria-label={`Edit monthly contribution for ${asset.category}${hasContribution ? `, currently ${formatCurrency(asset.monthlyContribution!)}` : ""}`}
                    data-testid={`contribution-badge-${asset.id}`}
                  >
                    {hasContribution
                      ? `+${formatCurrency(asset.monthlyContribution!)}/mo`
                      : "Monthly contribution"}
                  </button>
                )}

                {/* Surplus target checkbox */}
                <label
                  className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-xs cursor-pointer transition-colors duration-150 ${
                    asset.surplusTarget
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                  }`}
                  data-testid={`surplus-target-${asset.id}`}
                >
                  <input
                    type="checkbox"
                    checked={asset.surplusTarget ?? false}
                    onChange={() => {
                      setAssets((prev) =>
                        prev.map((a) => ({
                          ...a,
                          surplusTarget: a.id === asset.id ? !a.surplusTarget : false,
                        }))
                      );
                    }}
                    className="h-3 w-3 rounded border-stone-300 text-amber-600 accent-amber-500"
                  />
                  Surplus goes here
                </label>
              </div>

              {/* Per-asset 10/20/30 year projections */}
              {(displayRoi !== undefined && displayRoi > 0) || hasContribution ? (
                <div className="flex items-center gap-3 px-5 pb-1.5 text-[10px] text-stone-400" data-testid={`asset-projection-${asset.id}`}>
                  <span className="font-medium">Projected:</span>
                  <span>10yr <span className="text-green-600 font-medium">{formatCompact(projectAssetValue(asset.amount, displayRoi ?? 0, asset.monthlyContribution ?? 0, 10))}</span></span>
                  <span>20yr <span className="text-green-600 font-medium">{formatCompact(projectAssetValue(asset.amount, displayRoi ?? 0, asset.monthlyContribution ?? 0, 20))}</span></span>
                  <span>30yr <span className="text-green-600 font-medium">{formatCompact(projectAssetValue(asset.amount, displayRoi ?? 0, asset.monthlyContribution ?? 0, 30))}</span></span>
                </div>
              ) : null}
            </div>
          );})}
        </div>
      )}

      {/* Add new asset row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2 animate-in">
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
                className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-base text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New asset category"
              />
              {showNewSuggestions &&
                filteredGroupedSuggestions(newCategory).length > 0 && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
                    {filteredGroupedSuggestions(newCategory).map((group) => (
                      <div key={group.label}>
                        <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400" data-testid="suggestion-group-header">{group.label}</div>
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
                            className="w-full px-3 py-2 text-left text-sm text-stone-700 transition-colors hover:bg-blue-50 hover:text-blue-700 sm:py-1.5"
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
                className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-right text-base text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:w-28 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New asset amount"
              />
              <button
                type="button"
                onClick={addAsset}
                className="min-h-[44px] rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
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
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-stone-400 sm:min-h-0 sm:min-w-0 sm:p-1 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-200"
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
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-sm font-medium text-stone-500">
          Total: {formatCurrency(total)}
        </span>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-all duration-150 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 active:bg-blue-100"
          >
            + Add Asset
          </button>
        )}
      </div>
    </div>
  );
}
