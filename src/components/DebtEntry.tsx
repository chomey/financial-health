"use client";

import { useState, useRef, useEffect } from "react";

export interface Debt {
  id: string;
  category: string;
  amount: number;
}

const CATEGORY_SUGGESTIONS = [
  "Mortgage",
  "Car Loan",
  "Student Loan",
  "Credit Card",
  "Line of Credit",
  "Personal Loan",
  "Other",
];

export function getAllDebtCategorySuggestions(): string[] {
  return [...CATEGORY_SUGGESTIONS];
}

const MOCK_DEBTS: Debt[] = [
  { id: "d1", category: "Mortgage", amount: 280000 },
  { id: "d2", category: "Car Loan", amount: 15000 },
];

let nextId = 200;
function generateId(): string {
  return String(++nextId);
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
  const [debts, setDebtsInternal] = useState<Debt[]>(items ?? MOCK_DEBTS);

  useEffect(() => {
    if (items !== undefined) {
      setDebtsInternal(items);
    }
  }, [items]);

  const setDebts = (updater: Debt[] | ((prev: Debt[]) => Debt[])) => {
    setDebtsInternal((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      onChange?.(next);
      return next;
    });
  };
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "category" | "amount" | null
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

  const commitEdit = () => {
    if (editingId && editingField) {
      setDebts((prev) =>
        prev.map((d) => {
          if (d.id !== editingId) return d;
          if (editingField === "category") {
            return { ...d, category: editValue || d.category };
          }
          return { ...d, amount: parseCurrencyInput(editValue) };
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

  const total = debts.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-800">
        <span aria-hidden="true">📋</span>
        Debts
      </h2>

      {debts.length === 0 && !addingNew ? (
        <p className="text-sm text-stone-400">
          Track your mortgage, loans, and credit cards — every number brings
          clarity.
        </p>
      ) : (
        <div className="space-y-1" role="list" aria-label="Debt items">
          {debts.map((debt) => (
            <div
              key={debt.id}
              role="listitem"
              className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-stone-50"
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
                      filteredSuggestions(editValue).length > 0 && (
                        <div
                          ref={suggestionsRef}
                          className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg"
                        >
                          {filteredSuggestions(editValue).map((suggestion) => (
                            <button
                              key={suggestion}
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                setEditValue(suggestion);
                                setShowSuggestions(false);
                                commitEdit();
                              }}
                              className="w-full px-3 py-1.5 text-left text-sm text-stone-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
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
                      startEdit(debt.id, "category", debt.category)
                    }
                    className="flex-1 min-w-0 truncate text-left text-sm text-stone-700 rounded px-2 py-1 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-200"
                    aria-label={`Edit category for ${debt.category}`}
                  >
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
                    onBlur={commitEdit}
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
                    className="w-28 text-right text-sm font-medium text-rose-600 rounded px-2 py-1 transition-colors duration-150 hover:bg-rose-50 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-200"
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
                className="ml-2 rounded-md p-1 text-stone-300 opacity-0 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-200 group-hover:opacity-100"
                aria-label={`Delete ${debt.category}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
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
          ))}
        </div>
      )}

      {/* Add new debt row */}
      {addingNew && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2 animate-in">
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
              className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
              aria-label="New debt category"
            />
            {showNewSuggestions &&
              filteredSuggestions(newCategory).length > 0 && (
                <div className="absolute left-0 top-full z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
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
                      className="w-full px-3 py-1.5 text-left text-sm text-stone-700 transition-colors hover:bg-blue-50 hover:text-blue-700"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
          </div>
          <input
            ref={newAmountRef}
            type="text"
            placeholder="$0"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            onKeyDown={(e) => handleNewKeyDown(e, "amount")}
            className="w-28 rounded-md border border-blue-300 bg-white px-2 py-1 text-right text-sm text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
            aria-label="New debt amount"
          />
          <button
            type="button"
            onClick={addDebt}
            className="rounded-md bg-green-600 px-3 py-1 text-sm font-medium text-white transition-colors duration-150 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300"
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
            className="rounded-md p-1 text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-200"
            aria-label="Cancel adding debt"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
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
