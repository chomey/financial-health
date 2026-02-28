"use client";

import { useState, useRef, useEffect } from "react";
import { calculateDebtPayoff, formatPayoffCurrency } from "@/lib/debt-payoff";

export interface Debt {
  id: string;
  category: string;
  amount: number;
  interestRate?: number; // annual interest rate %
  monthlyPayment?: number; // minimum monthly payment $
}

const DEBT_CATEGORY_SUGGESTIONS = {
  CA: ["HELOC", "Canada Student Loan"],
  US: ["Medical Debt", "Federal Student Loan"],
  universal: [
    "Car Loan",
    "Student Loan",
    "Credit Card",
    "Line of Credit",
    "Personal Loan",
    "Other",
  ],
};

/** Set of CA-specific debt category names */
export const CA_DEBT_CATEGORIES = new Set(DEBT_CATEGORY_SUGGESTIONS.CA);
/** Set of US-specific debt category names */
export const US_DEBT_CATEGORIES = new Set(DEBT_CATEGORY_SUGGESTIONS.US);

export function getAllDebtCategorySuggestions(): string[] {
  return [
    ...DEBT_CATEGORY_SUGGESTIONS.CA,
    ...DEBT_CATEGORY_SUGGESTIONS.US,
    ...DEBT_CATEGORY_SUGGESTIONS.universal,
  ];
}

export interface DebtSuggestionGroup {
  label: string;
  items: string[];
}

export function getGroupedDebtCategorySuggestions(): DebtSuggestionGroup[] {
  return [
    { label: "🇨🇦 Canada", items: DEBT_CATEGORY_SUGGESTIONS.CA },
    { label: "🇺🇸 USA", items: DEBT_CATEGORY_SUGGESTIONS.US },
    { label: "General", items: DEBT_CATEGORY_SUGGESTIONS.universal },
  ];
}

/** Returns a flag emoji if the category is region-specific, or empty string */
export function getDebtCategoryFlag(category: string): string {
  if (CA_DEBT_CATEGORIES.has(category)) return "🇨🇦";
  if (US_DEBT_CATEGORIES.has(category)) return "🇺🇸";
  return "";
}

/** Smart interest rate defaults by debt type (annual %) */
export const DEFAULT_DEBT_INTEREST: Record<string, number> = {
  "Credit Card": 19.9,
  "Car Loan": 6,
  "Student Loan": 5,
  "Canada Student Loan": 5,
  "Federal Student Loan": 5,
  "Personal Loan": 8,
  "Line of Credit": 7,
  "HELOC": 6.5,
  "Medical Debt": 0,
};

/** Get the suggested interest rate for a debt category, or undefined if none */
export function getDefaultDebtInterest(category: string): number | undefined {
  return DEFAULT_DEBT_INTEREST[category];
}

const MOCK_DEBTS: Debt[] = [
  { id: "d1", category: "Car Loan", amount: 15000 },
];

function generateId(): string {
  return `d${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

interface DebtEntryProps {
  items?: Debt[];
  onChange?: (items: Debt[]) => void;
}

export default function DebtEntry({ items, onChange }: DebtEntryProps = {}) {
  const [debts, setDebts] = useState<Debt[]>(items ?? MOCK_DEBTS);
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
      setDebts(items);
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
    onChangeRef.current?.(debts);
  }, [debts]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "category" | "amount" | "interestRate" | "monthlyPayment" | null
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
    field: "category" | "amount" | "interestRate" | "monthlyPayment",
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
      setDebts((prev) =>
        prev.map((d) => {
          if (d.id !== editingId) return d;
          if (editingField === "category") {
            return { ...d, category: value || d.category };
          }
          if (editingField === "interestRate") {
            const val = parseFloat(value);
            return { ...d, interestRate: isNaN(val) ? undefined : val };
          }
          if (editingField === "monthlyPayment") {
            const val = parseCurrencyInput(value);
            return { ...d, monthlyPayment: val || undefined };
          }
          return { ...d, amount: parseCurrencyInput(value) };
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

  const deleteDebt = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  const addDebt = () => {
    if (!newCategory.trim()) return;
    const amount = parseCurrencyInput(newAmount);
    setDebts((prev) => [
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
        addDebt();
      }
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewCategory("");
      setNewAmount("");
      setShowNewSuggestions(false);
    }
  };

  const filteredSuggestions = (query: string) => {
    const all = getAllDebtCategorySuggestions();
    if (!query) return all;
    return all.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  };

  const filteredGroupedSuggestions = (query: string): DebtSuggestionGroup[] => {
    const groups = getGroupedDebtCategorySuggestions();
    return groups
      .map((group) => ({
        ...group,
        items: query
          ? group.items.filter((s) => s.toLowerCase().includes(query.toLowerCase()))
          : group.items,
      }))
      .filter((group) => group.items.length > 0);
  };

  const total = debts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 sm:p-4">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-stone-800">
        <span aria-hidden="true">📋</span>
        Debts
      </h2>

      {debts.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center py-4 text-center" data-testid="debt-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-rose-50 text-rose-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <p className="text-sm text-stone-400">
            Track your mortgage, loans, and credit cards — every number brings clarity.
          </p>
        </div>
      ) : (
        <div className="space-y-1" role="list" aria-label="Debt items">
          {debts.map((debt) => {
            const defaultInterest = getDefaultDebtInterest(debt.category);
            const displayInterest = debt.interestRate ?? defaultInterest;
            const hasInterest = debt.interestRate !== undefined;
            const hasPayment = debt.monthlyPayment !== undefined && debt.monthlyPayment > 0;
            return (
            <div key={debt.id} role="listitem">
              <div
                className="group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 hover:bg-stone-50"
              >
              <div className="flex flex-1 items-center gap-3 min-w-0">
                {/* Category */}
                {editingId === debt.id && editingField === "category" ? (
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
                                  {getDebtCategoryFlag(suggestion) && (
                                    <span className="mr-1" aria-hidden="true">{getDebtCategoryFlag(suggestion)}</span>
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
                      startEdit(debt.id, "category", debt.category)
                    }
                    className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 truncate text-left text-sm text-stone-700 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label={`Edit category for ${debt.category}`}
                  >
                    {getDebtCategoryFlag(debt.category) && (
                      <span className="mr-1" aria-hidden="true">{getDebtCategoryFlag(debt.category)}</span>
                    )}
                    {debt.category}
                  </button>
                )}

                {/* Amount */}
                {editingId === debt.id && editingField === "amount" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className="w-28 rounded-md border border-blue-300 bg-white px-2 py-1 text-right text-sm font-medium text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                    aria-label={`Edit amount for ${debt.category}`}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      startEdit(debt.id, "amount", String(debt.amount))
                    }
                    className="w-28 min-h-[44px] sm:min-h-0 text-right text-sm font-medium text-rose-600 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    aria-label={`Edit amount for ${debt.category}, currently ${formatCurrency(debt.amount)}`}
                  >
                    {formatCurrency(debt.amount)}
                  </button>
                )}
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => deleteDebt(debt.id)}
                className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-stone-400 sm:min-h-0 sm:min-w-0 sm:p-1 sm:text-stone-300 sm:opacity-0 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:group-hover:opacity-100"
                aria-label={`Delete ${debt.category}`}
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

              {/* Secondary detail fields: interest rate and monthly payment */}
              <div className="flex flex-wrap items-center gap-2 px-5 pb-1" data-testid={`debt-details-${debt.id}`}>
                {/* Interest rate badge/editor */}
                {editingId === debt.id && editingField === "interestRate" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className="w-20 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                    aria-label={`Edit interest rate for ${debt.category}`}
                    placeholder="e.g. 19.9"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(debt.id, "interestRate", String(debt.interestRate ?? ""))}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      hasInterest
                        ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                        : displayInterest !== undefined
                          ? "bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                          : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                    }`}
                    aria-label={`Edit interest rate for ${debt.category}${displayInterest !== undefined ? `, currently ${displayInterest}%` : ""}`}
                    data-testid={`interest-badge-${debt.id}`}
                  >
                    {displayInterest !== undefined
                      ? `${displayInterest}% APR${!hasInterest ? " (suggested)" : ""}`
                      : "Interest rate %"}
                  </button>
                )}

                {/* Monthly payment badge/editor */}
                {editingId === debt.id && editingField === "monthlyPayment" ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onBlur={() => commitEdit()}
                    onKeyDown={handleEditKeyDown}
                    className="w-24 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                    aria-label={`Edit monthly payment for ${debt.category}`}
                    placeholder="e.g. 150"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => startEdit(debt.id, "monthlyPayment", String(debt.monthlyPayment ?? ""))}
                    className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                      hasPayment
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                    }`}
                    aria-label={`Edit monthly payment for ${debt.category}${hasPayment ? `, currently ${formatCurrency(debt.monthlyPayment!)}` : ""}`}
                    data-testid={`debt-payment-badge-${debt.id}`}
                  >
                    {hasPayment
                      ? `${formatCurrency(debt.monthlyPayment!)}/mo`
                      : "Monthly payment"}
                  </button>
                )}
              </div>

              {/* Payoff timeline summary */}
              {(() => {
                const effectiveRate = debt.interestRate ?? defaultInterest;
                if (effectiveRate !== undefined && hasPayment) {
                  const result = calculateDebtPayoff(debt.amount, effectiveRate, debt.monthlyPayment!);
                  if (!result.coversInterest) {
                    return (
                      <div
                        className="mx-5 mb-1 rounded px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200"
                        data-testid={`debt-payoff-warning-${debt.id}`}
                      >
                        Payment doesn&rsquo;t cover interest &mdash; balance will grow
                      </div>
                    );
                  }
                  if (result.months > 0) {
                    return (
                      <div
                        className="mx-5 mb-1 rounded px-2 py-1 text-xs bg-blue-50 text-blue-600"
                        data-testid={`debt-payoff-${debt.id}`}
                      >
                        Paid off in {result.payoffDuration} &middot; {formatPayoffCurrency(result.totalInterest)} total interest
                      </div>
                    );
                  }
                }
                return null;
              })()}
            </div>
          );})}
        </div>
      )}

      {/* Add new debt row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2 animate-in">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <input
                ref={newCategoryRef}
                type="text"
                placeholder="Debt type..."
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
                aria-label="New debt category"
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
                            {getDebtCategoryFlag(suggestion) && (
                              <span className="mr-1" aria-hidden="true">{getDebtCategoryFlag(suggestion)}</span>
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
                aria-label="New debt amount"
              />
              <button
                type="button"
                onClick={addDebt}
                className="min-h-[44px] rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
                aria-label="Confirm add debt"
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
                aria-label="Cancel adding debt"
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
            + Add Debt
          </button>
        )}
      </div>
    </div>
  );
}
