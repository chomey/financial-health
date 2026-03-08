"use client";

import { useState, useRef, useEffect } from "react";
import type { TaxCredit } from "@/lib/tax-credits";
import {
  type FilingStatus,
  type TaxCreditCategory,
  getCreditCategoriesForFilingStatus,
  findCreditCategory,
  checkIncomeEligibility,
  getIncomeLimitDescription,
} from "@/lib/tax-credits";
import { formatCurrency as canonicalFormatCurrency } from "@/lib/currency";

export type { TaxCredit } from "@/lib/tax-credits";

interface TaxCreditEntryProps {
  items?: TaxCredit[];
  onChange?: (items: TaxCredit[]) => void;
  country: "CA" | "US";
  filingStatus: FilingStatus;
  annualIncome: number;
  taxYear?: number;
}

function generateId(): string {
  return `tc${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function formatCurrency(value: number): string {
  return canonicalFormatCurrency(value, "USD", { homeCurrency: "USD" });
}

function typeBadgeClasses(type: TaxCredit["type"]): string {
  switch (type) {
    case "refundable":
      return "bg-emerald-500/10 text-emerald-400";
    case "non-refundable":
      return "bg-amber-500/10 text-amber-400";
    case "deduction":
      return "bg-blue-500/10 text-blue-400";
  }
}

function typeLabel(type: TaxCredit["type"]): string {
  switch (type) {
    case "refundable":
      return "Refundable";
    case "non-refundable":
      return "Non-refundable";
    case "deduction":
      return "Deduction";
  }
}

function EligibilityBadge({
  category,
  annualIncome,
  filingStatus,
  country,
  taxYear = new Date().getFullYear(),
}: {
  category: string;
  annualIncome: number;
  filingStatus: FilingStatus;
  country: "CA" | "US";
  taxYear?: number;
}) {
  const catDef = findCreditCategory(category, country, taxYear);
  if (!catDef) return null;

  const status = checkIncomeEligibility(catDef, annualIncome, filingStatus);
  if (status === "eligible") return null;

  const limitDesc = getIncomeLimitDescription(catDef, filingStatus);
  const limits = catDef.incomeLimits[filingStatus];

  if (status === "reduced") {
    const threshold = limits?.phaseOutStart;
    return (
      <span
        className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/20"
        title={limitDesc ?? undefined}
        data-testid="eligibility-reduced"
      >
        Reduced {threshold ? `— income above ${formatCurrency(threshold)}` : ""}
      </span>
    );
  }

  // ineligible
  const threshold = limits?.hardCap ?? limits?.phaseOutEnd;
  const ineligibleByStatus = limits?.ineligible;
  return (
    <span
      className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/20"
      title={limitDesc ?? undefined}
      data-testid="eligibility-ineligible"
    >
      {ineligibleByStatus
        ? `Not available for ${filingStatus === "married-separately" ? "MFS" : filingStatus}`
        : `Likely ineligible — income above ${threshold ? formatCurrency(threshold) : "limit"}`}
    </span>
  );
}

export default function TaxCreditEntry({
  items,
  onChange,
  country,
  filingStatus,
  annualIncome,
  taxYear = new Date().getFullYear(),
}: TaxCreditEntryProps) {
  const [credits, setCredits] = useState<TaxCredit[]>(items ?? []);
  const isExternalSync = useRef(false);
  const didMount = useRef(false);
  const syncDidMount = useRef(false);
  const lastSentToParent = useRef<TaxCredit[] | null>(null);

  // Sync with parent
  useEffect(() => {
    if (!syncDidMount.current) {
      syncDidMount.current = true;
      return;
    }
    // Skip echo-back: parent passing back the same items we just sent
    if (items !== undefined && items !== lastSentToParent.current) {
      isExternalSync.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCredits(items);
    }
  }, [items]);

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
    lastSentToParent.current = credits;
    onChangeRef.current?.(credits);
  }, [credits]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"category" | "amount" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [showNewSuggestions, setShowNewSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const newCategoryRef = useRef<HTMLInputElement>(null);
  const newAmountRef = useRef<HTMLInputElement>(null);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

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

  const categories = getCreditCategoriesForFilingStatus(country, filingStatus, taxYear);

  const filteredSuggestions = (query: string): TaxCreditCategory[] => {
    if (!query) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(query.toLowerCase()),
    );
  };

  const startEdit = (id: string, field: "category" | "amount", currentValue: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
    if (field === "category") setShowSuggestions(true);
  };

  const commitEdit = (overrideValue?: string) => {
    const value = overrideValue ?? editValue;
    if (editingId && editingField) {
      setCredits((prev) =>
        prev.map((tc) => {
          if (tc.id !== editingId) return tc;
          if (editingField === "category") {
            const catDef = findCreditCategory(value, country, taxYear);
            const updated = {
              ...tc,
              category: value || tc.category,
              type: catDef?.type ?? tc.type,
            };
            // Auto-set amount for fixed-amount credits
            if (catDef?.fixedAmount) {
              if (catDef.amountOptions && catDef.amountOptions.length > 0) {
                updated.annualAmount = catDef.amountOptions[0].value;
              } else if (catDef.maxAmount) {
                updated.annualAmount = catDef.maxAmount;
              }
            }
            return updated;
          }
          return { ...tc, annualAmount: parseCurrencyInput(value) };
        }),
      );
    }
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
    setShowSuggestions(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") (e.target as HTMLElement).blur();
    else if (e.key === "Escape") {
      setEditingId(null);
      setEditingField(null);
      setShowSuggestions(false);
    }
  };

  const deleteCredit = (id: string) => {
    setCredits((prev) => prev.filter((tc) => tc.id !== id));
  };

  // Resolve the category def for the currently-being-added credit
  const newCatDef = newCategory ? findCreditCategory(newCategory.trim(), country, taxYear) : undefined;

  const addCredit = () => {
    if (!newCategory.trim()) return;
    const amount = parseCurrencyInput(newAmount);
    const catDef = findCreditCategory(newCategory.trim(), country, taxYear);
    setCredits((prev) => [
      ...prev,
      {
        id: generateId(),
        category: newCategory.trim(),
        annualAmount: amount,
        type: catDef?.type ?? "non-refundable",
      },
    ]);
    setNewCategory("");
    setNewAmount("");
    setAddingNew(false);
    setShowNewSuggestions(false);
  };

  const handleNewKeyDown = (e: React.KeyboardEvent, field: "category" | "amount") => {
    if (e.key === "Enter") {
      if (field === "category" && newAmountRef.current) {
        newAmountRef.current.focus();
      } else {
        addCredit();
      }
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewCategory("");
      setNewAmount("");
      setShowNewSuggestions(false);
    }
  };

  const total = credits.reduce((sum, tc) => sum + tc.annualAmount, 0);

  // Count how many credits have income eligibility warnings
  const warningCount = credits.filter((tc) => {
    const catDef = findCreditCategory(tc.category, country, taxYear);
    if (!catDef) return false;
    return checkIncomeEligibility(catDef, annualIncome, filingStatus) !== "eligible";
  }).length;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <span aria-hidden="true">🏷️</span>
          Tax Credits & Deductions
        </h2>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowInfoTooltip(!showInfoTooltip)}
            onBlur={() => setTimeout(() => setShowInfoTooltip(false), 150)}
            className="rounded-full p-0.5 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            aria-label="About tax credits"
            data-testid="tax-credit-info-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </button>
          {showInfoTooltip && (
            <div
              className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-white/10 bg-slate-800 p-3 text-xs text-slate-300 shadow-lg shadow-black/30"
              data-testid="tax-credit-info-tooltip"
            >
              <p className="mb-1.5 font-medium text-slate-200">How tax credits work</p>
              <p className="mb-1"><span className="text-emerald-400 font-medium">Refundable</span> credits can result in a refund even if you owe no tax.</p>
              <p className="mb-1"><span className="text-amber-400 font-medium">Non-refundable</span> credits reduce tax owed to zero but no further.</p>
              <p className="mb-1"><span className="text-blue-400 font-medium">Deductions</span> reduce your taxable income, lowering your overall tax.</p>
              <p className="mt-2 text-slate-400">Income limits shown are based on your filing status. These are estimates — consult a tax professional for exact amounts.</p>
            </div>
          )}
        </div>
      </div>

      {credits.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center py-4 text-center" data-testid="tax-credit-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-400/10 text-violet-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Add tax credits and deductions to see their impact on your effective tax rate and take-home pay.
          </p>
        </div>
      ) : (
        <div className="space-y-0" role="list" aria-label="Tax credit items">
          {credits.map((tc) => {
            const catDef = findCreditCategory(tc.category, country, taxYear);
            const eligibility = catDef
              ? checkIncomeEligibility(catDef, annualIncome, filingStatus)
              : "eligible";

            return (
              <div key={tc.id} role="listitem">
                <div className="group flex items-center justify-between rounded-lg px-3 py-0.5 transition-all duration-200 hover:bg-white/5">
                  <div className="flex flex-1 items-center gap-1 sm:gap-3 min-w-0">
                    {/* Category */}
                    {editingId === tc.id && editingField === "category" ? (
                      <div className="relative flex-1 min-w-0">
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => {
                            setEditValue(e.target.value);
                            setShowSuggestions(true);
                          }}
                          onBlur={() => setTimeout(() => commitEdit(), 150)}
                          onKeyDown={handleEditKeyDown}
                          className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-1 text-sm text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200"
                          aria-label="Edit credit category"
                        />
                        {showSuggestions && filteredSuggestions(editValue).length > 0 && (
                          <div className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30">
                            {filteredSuggestions(editValue).map((cat) => (
                              <button
                                key={cat.name}
                                type="button"
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  commitEdit(cat.name);
                                }}
                                className="w-full px-3 py-1.5 text-left text-sm text-slate-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300"
                              >
                                <div className="flex items-center gap-2">
                                  <span>{cat.name}</span>
                                  <span className={`rounded px-1 py-0.5 text-[10px] ${typeBadgeClasses(cat.type)}`}>
                                    {typeLabel(cat.type)}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">{cat.description}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(tc.id, "category", tc.category)}
                        className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 text-left text-sm text-slate-300 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-white/10 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        aria-label={`Edit category for ${tc.category}`}
                      >
                        {tc.category}
                      </button>
                    )}

                    {/* Amount */}
                    {catDef?.fixedAmount && catDef.amountOptions ? (
                      // Fixed amount with discrete options — show a select dropdown
                      <select
                        value={tc.annualAmount}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCredits((prev) =>
                            prev.map((c) =>
                              c.id === tc.id ? { ...c, annualAmount: val } : c,
                            ),
                          );
                        }}
                        className={`w-auto min-w-[8rem] max-w-[14rem] min-h-[44px] sm:min-h-0 text-right text-sm font-medium rounded px-2 py-2 sm:py-1 bg-transparent border border-white/10 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer ${
                          eligibility === "ineligible"
                            ? "text-slate-500"
                            : "text-violet-400"
                        }`}
                        aria-label={`Select amount for ${tc.category}`}
                      >
                        {catDef.amountOptions.map((opt) => (
                          <option key={opt.value} value={opt.value} className="bg-slate-800 text-slate-200">
                            {opt.label} — {formatCurrency(opt.value)}/yr
                          </option>
                        ))}
                      </select>
                    ) : catDef?.fixedAmount ? (
                      // Fixed amount, no options — read-only display
                      <span
                        className={`w-28 text-right text-sm font-medium px-2 py-2 sm:py-1 ${
                          eligibility === "ineligible"
                            ? "text-slate-500 line-through"
                            : "text-violet-400"
                        }`}
                        title="Fixed amount"
                      >
                        {formatCurrency(tc.annualAmount)}/yr
                      </span>
                    ) : editingId === tc.id && editingField === "amount" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit()}
                        onKeyDown={handleEditKeyDown}
                        className="w-28 rounded-md border border-cyan-500/50 bg-slate-900 px-2 py-1 text-right text-sm font-medium text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200"
                        aria-label={`Edit amount for ${tc.category}`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(tc.id, "amount", String(tc.annualAmount))}
                        className={`w-28 min-h-[44px] sm:min-h-0 text-right text-sm font-medium rounded px-2 py-2 sm:py-1 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-violet-500/30 ${
                          eligibility === "ineligible"
                            ? "text-slate-500 line-through hover:bg-white/5"
                            : "text-violet-400 hover:bg-violet-400/10 hover:text-violet-300"
                        }`}
                        aria-label={`Edit amount for ${tc.category}, currently ${formatCurrency(tc.annualAmount)}/year`}
                      >
                        {formatCurrency(tc.annualAmount)}/yr
                      </button>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => deleteCredit(tc.id)}
                    className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-slate-500 sm:min-h-0 sm:min-w-0 sm:p-1 sm:text-slate-600 sm:opacity-0 transition-all duration-150 hover:bg-rose-400/10 hover:text-rose-400 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-500/30 sm:group-hover:opacity-100"
                    aria-label={`Delete ${tc.category}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Detail badges row */}
                <div className="flex flex-wrap items-center gap-1.5 px-3 -mt-1 pb-0.5">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${typeBadgeClasses(tc.type)}`}>
                    {typeLabel(tc.type)}
                  </span>
                  <EligibilityBadge
                    category={tc.category}
                    annualIncome={annualIncome}
                    filingStatus={filingStatus}
                    country={country}
                    taxYear={taxYear}
                  />
                  {catDef && (
                    <span className="text-[11px] text-slate-500" title={catDef.description}>
                      {(() => {
                        const limitDesc = getIncomeLimitDescription(catDef, filingStatus);
                        return limitDesc ? limitDesc : catDef.description.slice(0, 60) + (catDef.description.length > 60 ? "..." : "");
                      })()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new credit row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/5 px-3 py-2 animate-in">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <input
                ref={newCategoryRef}
                type="text"
                placeholder="Credit or deduction..."
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  setShowNewSuggestions(true);
                }}
                onFocus={() => setShowNewSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNewSuggestions(false), 150)}
                onKeyDown={(e) => handleNewKeyDown(e, "category")}
                className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-3 py-2 text-base text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New credit category"
              />
              {showNewSuggestions && filteredSuggestions(newCategory).length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30">
                  {filteredSuggestions(newCategory).map((cat) => {
                    const elig = checkIncomeEligibility(cat, annualIncome, filingStatus);
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setNewCategory(cat.name);
                          setShowNewSuggestions(false);
                          // Pre-fill amount: use first amountOption, or maxAmount, or leave blank
                          if (cat.amountOptions && cat.amountOptions.length > 0) {
                            setNewAmount(String(cat.amountOptions[0].value));
                          } else if (cat.maxAmount) {
                            setNewAmount(String(cat.maxAmount));
                          }
                          if (!cat.fixedAmount) {
                            newAmountRef.current?.focus();
                          }
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300 sm:py-1.5"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={elig === "ineligible" ? "text-slate-500" : ""}>{cat.name}</span>
                          <span className={`rounded px-1 py-0.5 text-[10px] ${typeBadgeClasses(cat.type)}`}>
                            {typeLabel(cat.type)}
                          </span>
                          {elig === "reduced" && (
                            <span className="rounded px-1 py-0.5 text-[10px] bg-amber-500/15 text-amber-400">Reduced</span>
                          )}
                          {elig === "ineligible" && (
                            <span className="rounded px-1 py-0.5 text-[10px] bg-rose-500/15 text-rose-400">Ineligible</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{cat.description}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {newCatDef?.fixedAmount && newCatDef.amountOptions ? (
                // Discrete options dropdown
                <select
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-3 py-2 text-base text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:w-auto sm:min-w-[10rem] sm:max-w-[16rem] sm:px-2 sm:py-1 sm:text-sm"
                  aria-label="Select credit amount"
                >
                  {newCatDef.amountOptions.map((opt) => (
                    <option key={opt.value} value={opt.value} className="bg-slate-800 text-slate-200">
                      {opt.label} — {formatCurrency(opt.value)}/yr
                    </option>
                  ))}
                </select>
              ) : newCatDef?.fixedAmount ? (
                // Fixed amount, read-only
                <span className="w-full text-right text-base font-medium text-violet-400 px-3 py-2 sm:w-28 sm:px-2 sm:py-1 sm:text-sm">
                  {newAmount ? `${formatCurrency(Number(newAmount))}/yr` : "—"}
                </span>
              ) : (
                <input
                  ref={newAmountRef}
                  type="text"
                  placeholder="$/year"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => handleNewKeyDown(e, "amount")}
                  className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-3 py-2 text-right text-base text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:w-28 sm:px-2 sm:py-1 sm:text-sm"
                  aria-label="New credit annual amount"
                />
              )}
              <button
                type="button"
                onClick={addCredit}
                className="min-h-[44px] rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 transition-all duration-150 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
                aria-label="Confirm add credit"
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
                aria-label="Cancel adding credit"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total and Add button */}
      <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
        <div>
          <span className="text-sm font-medium text-slate-400">
            Total: {formatCurrency(total)}/yr
          </span>
          {warningCount > 0 && (
            <span className="ml-2 text-xs text-amber-400">
              ({warningCount} {warningCount === 1 ? "credit" : "credits"} may be reduced or ineligible)
            </span>
          )}
        </div>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-cyan-400 transition-all duration-150 hover:bg-cyan-500/10 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 active:bg-cyan-500/20"
          >
            + Add Credit
          </button>
        )}
      </div>
    </div>
  );
}
