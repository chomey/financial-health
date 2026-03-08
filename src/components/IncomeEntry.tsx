"use client";

import { useState, useRef, useEffect } from "react";
import { DataFlowSourceItem } from "@/components/DataFlowArrows";
import { useCurrency } from "@/lib/CurrencyContext";
import type { MonthlyInvestmentReturn } from "@/lib/financial-state";
import CurrencyBadge from "@/components/CurrencyBadge";
import type { SupportedCurrency, FxRates } from "@/lib/currency";
import { convertToHome, FALLBACK_RATES } from "@/lib/currency";

export type IncomeFrequency = "monthly" | "weekly" | "biweekly" | "quarterly" | "semi-annually" | "annually";

export type IncomeType = "employment" | "capital-gains" | "other";

export interface IncomeItem {
  id: string;
  category: string;
  amount: number;
  frequency?: IncomeFrequency;
  incomeType?: IncomeType;
  currency?: SupportedCurrency;
}

const FREQUENCY_LABELS: Record<IncomeFrequency, string> = {
  monthly: "Monthly",
  weekly: "Weekly",
  biweekly: "Biweekly",
  quarterly: "Quarterly",
  "semi-annually": "Semi-annually",
  annually: "Annually",
};

const FREQUENCY_SHORT_LABELS: Record<IncomeFrequency, string> = {
  monthly: "/mo",
  weekly: "/wk",
  biweekly: "/2wk",
  quarterly: "/qtr",
  "semi-annually": "/6mo",
  annually: "/yr",
};

export function normalizeToMonthly(amount: number, frequency: IncomeFrequency = "monthly"): number {
  switch (frequency) {
    case "weekly": return amount * 52 / 12;
    case "biweekly": return amount * 26 / 12;
    case "quarterly": return amount / 3;
    case "semi-annually": return amount / 6;
    case "annually": return amount / 12;
    case "monthly":
    default: return amount;
  }
}

const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  employment: "Employment",
  "capital-gains": "Capital Gains",
  other: "Other",
};

const INCOME_TYPE_SHORT_LABELS: Record<IncomeType, string> = {
  employment: "Emp",
  "capital-gains": "Cap Gains",
  other: "Other",
};

const CATEGORY_SUGGESTIONS: Record<IncomeType, string[]> = {
  employment: [
    "Salary",
    "Freelance",
    "Investment Income",
    "Dividends",
    "Side Hustle",
    "Other",
  ],
  "capital-gains": [
    "Stock Sale",
    "Property Sale",
    "Crypto",
    "Capital Gains",
    "Other",
  ],
  other: [
    "Salary",
    "Freelance",
    "Investment Income",
    "Capital Gains",
    "Dividends",
    "Side Hustle",
    "Stock Sale",
    "Property Sale",
    "Crypto",
    "Other",
  ],
};

export function getAllIncomeCategorySuggestions(incomeType?: IncomeType): string[] {
  return [...CATEGORY_SUGGESTIONS[incomeType ?? "employment"]];
}

const MOCK_INCOME: IncomeItem[] = [
  { id: "i1", category: "Salary", amount: 5500 },
  { id: "i2", category: "Freelance", amount: 800 },
];

function generateId(): string {
  return `i${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

interface IncomeEntryProps {
  items?: IncomeItem[];
  onChange?: (items: IncomeItem[]) => void;
  investmentReturns?: MonthlyInvestmentReturn[];
  homeCurrency?: SupportedCurrency;
  fxRates?: FxRates;
}

export default function IncomeEntry({ items: controlledItems, onChange, investmentReturns = [], homeCurrency, fxRates }: IncomeEntryProps = {}) {
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.full(v);
  const [items, setItems] = useState<IncomeItem[]>(controlledItems ?? MOCK_INCOME);
  const isExternalSync = useRef(false);
  const didMount = useRef(false);
  const syncDidMount = useRef(false);
  const lastSentToParent = useRef<IncomeItem[] | null>(null);

  // Sync with parent if controlled — intentional external-system sync
  // Skip initial mount since useState already handles the initial value
  useEffect(() => {
    if (!syncDidMount.current) {
      syncDidMount.current = true;
      return;
    }
    // Skip echo-back: parent passing back the same items we just sent
    if (controlledItems !== undefined && controlledItems !== lastSentToParent.current) {
      isExternalSync.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(controlledItems);
    }
  }, [controlledItems]);

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
    lastSentToParent.current = items;
    onChangeRef.current?.(items);
  }, [items]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "category" | "amount" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newFrequency, setNewFrequency] = useState<IncomeFrequency>("monthly");
  const [newIncomeType, setNewIncomeType] = useState<IncomeType>("employment");
  const [showNewSuggestions, setShowNewSuggestions] = useState(false);
  const [animatingTotal, setAnimatingTotal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const newCategoryRef = useRef<HTMLInputElement>(null);
  const newAmountRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hc = homeCurrency ?? "CAD";
  const rates = fxRates ?? FALLBACK_RATES;
  const investmentReturnsTotal = investmentReturns.reduce((sum, r) => sum + r.amount, 0);
  const total = items.reduce((sum, item) => sum + convertToHome(normalizeToMonthly(item.amount, item.frequency), item.currency ?? hc, hc, rates), 0) + investmentReturnsTotal;

  const triggerTotalAnimation = () => {
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    setAnimatingTotal(true);
    animationTimerRef.current = setTimeout(() => setAnimatingTotal(false), 300);
  };

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
    field: "category" | "amount",
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
      triggerTotalAnimation();
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== editingId) return item;
          if (editingField === "category") {
            return { ...item, category: value || item.category };
          }
          return { ...item, amount: parseCurrencyInput(value) };
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

  const deleteItem = (id: string) => {
    triggerTotalAnimation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const changeFrequency = (id: string, frequency: IncomeFrequency) => {
    triggerTotalAnimation();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, frequency } : item
      )
    );
  };

  const changeIncomeType = (id: string, incomeType: IncomeType) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, incomeType: incomeType === "employment" ? undefined : incomeType } : item
      )
    );
  };

  const addItem = () => {
    if (!newCategory.trim()) return;
    const amount = parseCurrencyInput(newAmount);
    triggerTotalAnimation();
    const newItem: IncomeItem = {
      id: generateId(),
      category: newCategory.trim(),
      amount,
      ...(newFrequency !== "monthly" ? { frequency: newFrequency } : {}),
      ...(newIncomeType !== "employment" ? { incomeType: newIncomeType } : {}),
    };
    setItems((prev) => [...prev, newItem]);
    setNewCategory("");
    setNewAmount("");
    setNewFrequency("monthly");
    setNewIncomeType("employment");
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
        addItem();
      }
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewCategory("");
      setNewAmount("");
      setNewIncomeType("employment");
      setShowNewSuggestions(false);
    }
  };

  const filteredSuggestions = (query: string, incomeType?: IncomeType) => {
    const all = getAllIncomeCategorySuggestions(incomeType);
    if (!query) return all;
    return all.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm sm:p-4">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-200">
        <span aria-hidden="true">💰</span>
        Income
      </h2>

      {items.length === 0 && !addingNew && investmentReturns.length === 0 && (
        <div className="flex flex-col items-center py-4 text-center" data-testid="income-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Enter your income sources to understand your monthly cash flow.
          </p>
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-1" role="list" aria-label="Income items">
          {items.map((item) => (
            <DataFlowSourceItem key={item.id} id={`income:${item.id}`} label={item.category} value={normalizeToMonthly(item.amount, item.frequency)}>
            <div>
            <div
              role="listitem"
              className={`group flex items-center justify-between rounded-lg px-3 py-1.5 transition-colors duration-150 ${
                item.incomeType === "capital-gains"
                  ? "bg-amber-400/5 hover:bg-amber-400/10 border-l-2 border-amber-400/60"
                  : "hover:bg-white/5"
              }`}
            >
              <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
                {/* Row 1 on mobile: Category + Amount */}
                <div className="flex flex-1 items-center gap-1 sm:gap-3 min-w-0">
                {/* Category */}
                {editingId === item.id && editingField === "category" ? (
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
                        setTimeout(() => {
                          commitEdit();
                        }, 150);
                      }}
                      onKeyDown={handleEditKeyDown}
                      className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200"
                      aria-label="Edit category name"
                    />
                    {showSuggestions &&
                      filteredSuggestions(editValue, item.incomeType).length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute left-0 top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30"
                        >
                          {filteredSuggestions(editValue, item.incomeType).map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                commitEdit(suggestion);
                              }}
                              className="w-full px-3 py-1.5 text-left text-sm text-slate-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(item.id, "category", item.category)
                    }
                    className="min-w-0 min-h-[44px] sm:min-h-0 text-left text-sm text-slate-300 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-white/10 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    aria-label={`Edit category for ${item.category}`}
                  >
                    {item.category}
                  </button>
                )}

                {/* Amount + Currency */}
                <div className="flex items-center gap-1 ml-auto">
                  {homeCurrency && fxRates && (
                    <span data-testid={`income-details-${item.id}`}>
                      <CurrencyBadge
                        currency={item.currency}
                        homeCurrency={homeCurrency}
                        amount={normalizeToMonthly(item.amount, item.frequency)}
                        fxRates={fxRates}
                        onCurrencyChange={(cu) => {
                          setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, currency: cu } : i));
                        }}
                      />
                    </span>
                  )}
                  {editingId === item.id && editingField === "amount" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit()}
                      onKeyDown={handleEditKeyDown}
                      className="w-28 rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-1 text-right text-sm font-medium text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200"
                      aria-label={`Edit amount for ${item.category}`}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        startEdit(item.id, "amount", String(item.amount))
                      }
                      className="min-h-[44px] sm:min-h-0 text-right rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-emerald-400/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      aria-label={`Edit amount for ${item.category}, currently ${formatCurrency(item.amount)}`}
                    >
                      <div className="text-sm font-medium text-emerald-400">{formatCurrency(item.amount)}{FREQUENCY_SHORT_LABELS[item.frequency ?? "monthly"]}</div>
                      {(item.frequency ?? "monthly") === "monthly" ? (
                        <div className="text-xs text-slate-500">{formatCurrency(item.amount * 12)}/yr</div>
                      ) : (
                        <div className="text-xs text-slate-500">{formatCurrency(normalizeToMonthly(item.amount, item.frequency))}/mo</div>
                      )}
                    </button>
                  )}
                </div>
                </div>

                {/* Row 2 on mobile: Frequency + Income type dropdowns */}
                <div className="flex items-center gap-1.5 sm:gap-1">
                {/* Frequency badge/dropdown */}
                <select
                  value={item.frequency ?? "monthly"}
                  onChange={(e) => changeFrequency(item.id, e.target.value as IncomeFrequency)}
                  className="w-auto min-h-[44px] sm:min-h-0 rounded-md border border-white/10 bg-slate-800 px-1.5 py-1 text-xs text-slate-400 transition-all duration-150 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer"
                  aria-label={`Change frequency for ${item.category}`}
                  data-testid={`frequency-${item.id}`}
                >
                  {(Object.keys(FREQUENCY_SHORT_LABELS) as IncomeFrequency[]).map((freq) => (
                    <option key={freq} value={freq}>
                      {FREQUENCY_SHORT_LABELS[freq]}
                    </option>
                  ))}
                </select>

                {/* Income type selector */}
                <select
                  value={item.incomeType ?? "employment"}
                  onChange={(e) => changeIncomeType(item.id, e.target.value as IncomeType)}
                  className={`w-auto min-h-[44px] sm:min-h-0 rounded-md border px-1.5 py-1 text-xs transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer ${
                    item.incomeType === "capital-gains"
                      ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:border-amber-400/50 hover:bg-amber-500/15"
                      : "border-white/10 bg-slate-800 text-slate-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400"
                  }`}
                  aria-label={`Change income type for ${item.category}`}
                  data-testid={`income-type-${item.id}`}
                >
                  {(Object.keys(INCOME_TYPE_SHORT_LABELS) as IncomeType[]).map((type) => (
                    <option key={type} value={type}>
                      {INCOME_TYPE_SHORT_LABELS[type]}
                    </option>
                  ))}
                </select>
                </div>
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => deleteItem(item.id)}
                className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-slate-500 sm:min-h-0 sm:min-w-0 sm:p-1 sm:text-slate-600 sm:opacity-0 transition-all duration-150 hover:bg-rose-400/10 hover:text-rose-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 sm:group-hover:opacity-100"
                aria-label={`Delete ${item.category}`}
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
            </DataFlowSourceItem>
          ))}
        </div>
      )}

      {/* Auto-computed investment returns */}
      {investmentReturns.length > 0 && (
        <div data-testid="investment-returns-auto-section">
          <div className="mt-1.5 mb-0.5 border-t border-dashed border-white/10 pt-1.5 px-3">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Auto-computed</span>
          </div>
          <div className="space-y-0.5 mx-1">
          {investmentReturns.map((r) => (
            <div
              key={r.label}
              className="flex items-center justify-between rounded-md px-3 py-1 bg-slate-800/60 border border-dashed border-white/10"
              data-testid="investment-return-row"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">{r.label} returns</span>
                <span className="inline-flex items-center rounded-full bg-slate-700/40 px-1 py-0 text-[8px] font-medium text-slate-500 uppercase tracking-wide" title="Auto-computed from your investment ROI">
                  auto
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-emerald-400">{formatCurrency(r.amount)}/mo</span>
                <span className="text-[10px] text-slate-500 ml-1.5">{formatCurrency(r.amount * 12)}/yr</span>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Add new income row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/5 px-3 py-2 animate-in">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <input
                ref={newCategoryRef}
                type="text"
                placeholder="Income source..."
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
                aria-label="New income category"
              />
              {showNewSuggestions &&
                filteredSuggestions(newCategory, newIncomeType).length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30">
                    {filteredSuggestions(newCategory, newIncomeType).map((suggestion) => (
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
                        {suggestion}
                      </button>
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
                aria-label="New income amount"
              />
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as IncomeFrequency)}
                className="min-h-[44px] sm:min-h-0 rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-2 text-xs text-slate-300 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:py-1 cursor-pointer"
                aria-label="New income frequency"
                data-testid="new-income-frequency"
              >
                {(Object.keys(FREQUENCY_LABELS) as IncomeFrequency[]).map((freq) => (
                  <option key={freq} value={freq}>
                    {FREQUENCY_LABELS[freq]}
                  </option>
                ))}
              </select>
              <select
                value={newIncomeType}
                onChange={(e) => setNewIncomeType(e.target.value as IncomeType)}
                className="min-h-[44px] sm:min-h-0 rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-2 text-xs text-slate-300 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:py-1 cursor-pointer"
                aria-label="New income type"
                data-testid="new-income-type"
              >
                {(Object.keys(INCOME_TYPE_LABELS) as IncomeType[]).map((type) => (
                  <option key={type} value={type}>
                    {INCOME_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addItem}
                className="min-h-[44px] rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 transition-all duration-150 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
                aria-label="Confirm add income"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setNewCategory("");
                  setNewAmount("");
                  setNewIncomeType("employment");
                  setShowNewSuggestions(false);
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-slate-500 sm:min-h-0 sm:min-w-0 sm:p-1 transition-colors duration-150 hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-white/20"
                aria-label="Cancel adding income"
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
        <span
          className={`text-sm font-medium text-slate-400 transition-all duration-300 ${
            animatingTotal ? "scale-110 text-emerald-400" : ""
          }`}
        >
          Monthly: <span data-testid="income-monthly-total">{formatCurrency(total)}</span>
          {" | "}
          Yearly: <span data-testid="income-yearly-total">{formatCurrency(total * 12)}</span>
        </span>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-cyan-400 transition-all duration-150 hover:bg-cyan-500/10 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 active:bg-cyan-500/20"
          >
            + Add Income
          </button>
        )}
      </div>
    </div>
  );
}
