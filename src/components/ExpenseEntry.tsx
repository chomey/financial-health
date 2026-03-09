"use client";

import { useState, useRef } from "react";
import { DataFlowSourceItem } from "@/components/DataFlowArrows";
import { useCurrency } from "@/lib/CurrencyContext";
import CurrencyBadge from "@/components/CurrencyBadge";
import type { SupportedCurrency, FxRates } from "@/lib/currency";
import { convertToHome, FALLBACK_RATES } from "@/lib/currency";
import { parseCurrencyInput, formatNumericInput } from "@/lib/format-input";
import { generateId, useControlledArray, useEditState, useAddNew } from "@/lib/entry-hooks";

export type ExpenseFrequency = "monthly" | "yearly" | "one-time";

const EXPENSE_FREQUENCY_SHORT_LABELS: Record<ExpenseFrequency, string> = {
  monthly: "/mo",
  yearly: "/yr",
  "one-time": "once",
};

export function normalizeExpenseToMonthly(amount: number, frequency: ExpenseFrequency = "monthly"): number {
  switch (frequency) {
    case "yearly":
    case "one-time":
      return amount / 12;
    case "monthly":
    default:
      return amount;
  }
}

export interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  frequency?: ExpenseFrequency;
  currency?: SupportedCurrency;
}

const CATEGORY_SUGGESTIONS = [
  "Rent/Mortgage Payment",
  "Childcare",
  "Groceries",
  "Subscriptions",
  "Transportation",
  "Insurance",
  "Utilities",
  "Monthly Expenses",
  "Other",
];

export function getAllExpenseCategorySuggestions(): string[] {
  return [...CATEGORY_SUGGESTIONS];
}

const MOCK_EXPENSES: ExpenseItem[] = [
  { id: "e1", category: "Rent/Mortgage Payment", amount: 2200 },
  { id: "e2", category: "Groceries", amount: 600 },
  { id: "e3", category: "Subscriptions", amount: 150 },
];

interface ExpenseEntryProps {
  items?: ExpenseItem[];
  onChange?: (items: ExpenseItem[]) => void;
  homeCurrency?: SupportedCurrency;
  fxRates?: FxRates;
}

export default function ExpenseEntry({ items: controlledItems, onChange, homeCurrency, fxRates }: ExpenseEntryProps = {}) {
  const fmt = useCurrency();
  const formatCurrency = (v: number) => fmt.full(v);
  const [items, setItems] = useControlledArray(controlledItems, MOCK_EXPENSES, onChange);

  type ExpenseField = "category" | "amount";
  const edit = useEditState<ExpenseField>(["category"]);
  const { editingId, editingField, editValue, showSuggestions, inputRef, startEdit, clearEdit, setEditValue, setShowSuggestions, handleEditKeyDown } = edit;
  const addNew = useAddNew();
  const { addingNew, newCategory, newAmount, showNewSuggestions, newCategoryRef, newAmountRef, setAddingNew, setNewCategory, setNewAmount, setShowNewSuggestions, resetNew, handleNewKeyDown } = addNew;
  const [animatingTotal, setAnimatingTotal] = useState(false);
  const [newFrequency, setNewFrequency] = useState<ExpenseFrequency>("monthly");
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hc = homeCurrency ?? "CAD";
  const rates = fxRates ?? FALLBACK_RATES;
  const total = items.reduce((sum, item) => sum + convertToHome(normalizeExpenseToMonthly(item.amount, item.frequency), item.currency ?? hc, hc, rates), 0);

  const triggerTotalAnimation = () => {
    if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    setAnimatingTotal(true);
    animationTimerRef.current = setTimeout(() => setAnimatingTotal(false), 300);
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
    clearEdit();
  };

  const deleteItem = (id: string) => {
    triggerTotalAnimation();
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addItem = () => {
    if (!newCategory.trim()) return;
    const amount = parseCurrencyInput(newAmount);
    triggerTotalAnimation();
    const newItem: ExpenseItem = { id: generateId("e"), category: newCategory.trim(), amount };
    if (newFrequency !== "monthly") newItem.frequency = newFrequency;
    setItems((prev) => [...prev, newItem]);
    setNewFrequency("monthly");
    resetNew();
  };

  const changeFrequency = (id: string, frequency: ExpenseFrequency) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, frequency: frequency === "monthly" ? undefined : frequency };
        if (frequency === "monthly") delete updated.frequency;
        return updated;
      })
    );
  };

  const filteredSuggestions = (query: string) => {
    const all = getAllExpenseCategorySuggestions();
    if (!query) return all;
    return all.filter((s) => s.toLowerCase().includes(query.toLowerCase()));
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 shadow-sm sm:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-slate-200">
          <span aria-hidden="true">🧾</span>
          Expenses
        </h2>
      </div>

      {items.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center py-4 text-center" data-testid="expense-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/10 text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
            </svg>
          </div>
          <p className="text-sm text-slate-500">
            Add your regular expenses — be as detailed or broad as you like.
          </p>
        </div>
      ) : (
        <div className="space-y-0" role="list" aria-label="Expense items">
          {items.map((item) => (
            <DataFlowSourceItem key={item.id} id={`expense:${item.id}`} label={item.category} value={item.amount}>
            <div role="listitem">
            <div
              className="group flex items-center justify-between rounded-lg px-3 py-0.5 transition-colors duration-150 hover:bg-white/5"
            >
              <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 min-w-0">
                {/* Row 1: Category + Amount */}
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
                      filteredSuggestions(editValue).length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute left-0 top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30"
                        >
                          {filteredSuggestions(editValue).map((suggestion) => (
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
                    className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 text-left text-sm text-slate-300 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-white/10 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                    aria-label={`Edit category for ${item.category}`}
                  >
                    {item.category}
                  </button>
                )}

                {/* Amount + Currency */}
                <div className="flex items-center gap-1 ml-auto" data-testid={`expense-details-${item.id}`}>
                  {homeCurrency && fxRates && (
                    <CurrencyBadge
                      currency={item.currency}
                      homeCurrency={homeCurrency}
                      amount={normalizeExpenseToMonthly(item.amount, item.frequency)}
                      fxRates={fxRates}
                      onCurrencyChange={(cu) => {
                        setItems((prev) => prev.map((e) => e.id === item.id ? { ...e, currency: cu } : e));
                      }}
                    />
                  )}
                  {editingId === item.id && editingField === "amount" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="decimal"
                      value={editValue}
                      onChange={(e) => setEditValue(formatNumericInput(e.target.value))}
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
                      className="min-w-[7rem] min-h-[44px] sm:min-h-0 text-right rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-rose-400/10 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                      aria-label={`Edit amount for ${item.category}, currently ${formatCurrency(item.amount)}`}
                    >
                      {(item.frequency ?? "monthly") === "monthly" ? (
                        <>
                          <div className="text-sm font-medium text-rose-400">{formatCurrency(item.amount)}/mo</div>
                          <div className="text-xs text-slate-500">{formatCurrency(item.amount * 12)}/yr</div>
                        </>
                      ) : (
                        <>
                          <div className="text-sm font-medium text-rose-400">{formatCurrency(item.amount)}{EXPENSE_FREQUENCY_SHORT_LABELS[item.frequency!]}</div>
                          <div className="text-xs text-slate-500">{formatCurrency(normalizeExpenseToMonthly(item.amount, item.frequency))}/mo</div>
                        </>
                      )}
                    </button>
                  )}
                </div>
                </div>

                {/* Row 2: Frequency dropdown */}
                <div className="flex items-center gap-1.5 sm:gap-1 pb-1 sm:pb-0">
                  <select
                    value={item.frequency ?? "monthly"}
                    onChange={(e) => changeFrequency(item.id, e.target.value as ExpenseFrequency)}
                    className="w-auto min-h-[44px] sm:min-h-0 rounded-md border border-white/10 bg-slate-800 px-1.5 py-1 text-xs text-slate-400 transition-all duration-150 hover:border-cyan-500/30 hover:bg-cyan-500/5 hover:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer"
                    aria-label={`Change frequency for ${item.category}`}
                    data-testid={`expense-frequency-${item.id}`}
                  >
                    {(Object.keys(EXPENSE_FREQUENCY_SHORT_LABELS) as ExpenseFrequency[]).map((freq) => (
                      <option key={freq} value={freq}>
                        {freq === "monthly" ? "/mo" : freq === "yearly" ? "/yr" : "once"}
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


      {/* Add new expense row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/5 px-3 py-2 animate-in">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1 min-w-0">
              <input
                ref={newCategoryRef}
                type="text"
                placeholder="Expense type..."
                value={newCategory}
                onChange={(e) => {
                  setNewCategory(e.target.value);
                  setShowNewSuggestions(true);
                }}
                onFocus={() => setShowNewSuggestions(true)}
                onBlur={() => {
                  setTimeout(() => setShowNewSuggestions(false), 150);
                }}
                onKeyDown={(e) => handleNewKeyDown(e, "category", addItem)}
                className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-3 py-2 text-base text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New expense category"
              />
              {showNewSuggestions &&
                filteredSuggestions(newCategory).length > 0 && (
                  <div className="absolute left-0 top-full z-50 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-white/10 bg-slate-800 py-1 shadow-lg shadow-black/30">
                    {filteredSuggestions(newCategory).map((suggestion) => (
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
                inputMode="decimal"
                placeholder="$0"
                value={newAmount}
                onChange={(e) => setNewAmount(formatNumericInput(e.target.value))}
                onKeyDown={(e) => handleNewKeyDown(e, "amount", addItem)}
                className="w-full rounded-md border border-cyan-500/50 bg-slate-900 px-3 py-2 text-right text-base text-slate-100 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 sm:w-28 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New expense amount"
              />
              <select
                value={newFrequency}
                onChange={(e) => setNewFrequency(e.target.value as ExpenseFrequency)}
                className="rounded-md border border-cyan-500/50 bg-slate-900 px-1.5 py-2 text-sm text-slate-300 outline-none ring-2 ring-cyan-500/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 cursor-pointer sm:py-1"
                aria-label="New expense frequency"
                data-testid="new-expense-frequency"
              >
                {(Object.keys(EXPENSE_FREQUENCY_SHORT_LABELS) as ExpenseFrequency[]).map((freq) => (
                  <option key={freq} value={freq}>
                    {freq === "monthly" ? "/mo" : freq === "yearly" ? "/yr" : "once"}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={addItem}
                className="min-h-[44px] rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-900 transition-all duration-150 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
                aria-label="Confirm add expense"
              >
                Add
              </button>
              <button
                type="button"
                onClick={resetNew}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-slate-500 sm:min-h-0 sm:min-w-0 sm:p-1 transition-colors duration-150 hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-white/10"
                aria-label="Cancel adding expense"
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

      {/* Total breakdown and Add button */}
      <div className="mt-2 border-t border-white/10 pt-2 space-y-1">

        {/* Grand total + Add button */}
        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium text-slate-400 transition-all duration-300 ${
              animatingTotal ? "scale-110 text-rose-400" : ""
            }`}
          >
            Monthly: <span data-testid="expense-monthly-total">{formatCurrency(total)}</span>
            {" | "}
            Yearly: <span data-testid="expense-yearly-total">{formatCurrency(total * 12)}</span>
          </span>
          {!addingNew && (
            <button
              type="button"
              onClick={() => setAddingNew(true)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-cyan-400 transition-all duration-150 hover:bg-cyan-500/10 hover:text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 active:bg-cyan-500/20"
            >
              + Add Expense
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
