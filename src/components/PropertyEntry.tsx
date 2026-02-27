"use client";

import { useState, useRef, useEffect } from "react";

export interface Property {
  id: string;
  name: string;
  value: number;
  mortgage: number;
}

const MOCK_PROPERTIES: Property[] = [
  { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
];

let nextId = 500;
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

interface PropertyEntryProps {
  items?: Property[];
  onChange?: (items: Property[]) => void;
}

export default function PropertyEntry({ items, onChange }: PropertyEntryProps = {}) {
  const [properties, setProperties] = useState<Property[]>(items ?? MOCK_PROPERTIES);
  const isExternalSync = useRef(false);
  const didMount = useRef(false);
  const syncDidMount = useRef(false);

  // Sync with parent if controlled
  useEffect(() => {
    if (!syncDidMount.current) {
      syncDidMount.current = true;
      return;
    }
    if (items !== undefined) {
      isExternalSync.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProperties(items);
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
    onChangeRef.current?.(properties);
  }, [properties]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"name" | "value" | "mortgage" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newMortgage, setNewMortgage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const newValueRef = useRef<HTMLInputElement>(null);
  const newMortgageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew && newNameRef.current) {
      newNameRef.current.focus();
    }
  }, [addingNew]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField]);

  const startEdit = (id: string, field: "name" | "value" | "mortgage", currentValue: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (editingId && editingField) {
      setProperties((prev) =>
        prev.map((p) => {
          if (p.id !== editingId) return p;
          if (editingField === "name") {
            return { ...p, name: editValue || p.name };
          }
          if (editingField === "value") {
            return { ...p, value: parseCurrencyInput(editValue) };
          }
          return { ...p, mortgage: parseCurrencyInput(editValue) };
        })
      );
    }
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingField(null);
    }
  };

  const deleteProperty = (id: string) => {
    setProperties((prev) => prev.filter((p) => p.id !== id));
  };

  const addProperty = () => {
    if (!newName.trim()) return;
    const value = parseCurrencyInput(newValue);
    const mortgage = parseCurrencyInput(newMortgage);
    setProperties((prev) => [
      ...prev,
      { id: generateId(), name: newName.trim(), value, mortgage },
    ]);
    setNewName("");
    setNewValue("");
    setNewMortgage("");
    setAddingNew(false);
  };

  const handleNewKeyDown = (e: React.KeyboardEvent, field: "name" | "value" | "mortgage") => {
    if (e.key === "Enter") {
      if (field === "name" && newValueRef.current) {
        newValueRef.current.focus();
      } else if (field === "value" && newMortgageRef.current) {
        newMortgageRef.current.focus();
      } else {
        addProperty();
      }
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewName("");
      setNewValue("");
      setNewMortgage("");
    }
  };

  const totalEquity = properties.reduce((sum, p) => sum + Math.max(0, p.value - p.mortgage), 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 sm:p-6">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-800">
        <span aria-hidden="true">🏠</span>
        Property
      </h2>

      {properties.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center py-4 text-center" data-testid="property-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-sm text-stone-400">
            Add your home or other properties to see your full net worth.
          </p>
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Property items">
          {properties.map((property) => {
            const equity = Math.max(0, property.value - property.mortgage);
            return (
              <div
                key={property.id}
                role="listitem"
                className="group rounded-lg border border-stone-100 px-3 py-2 transition-colors duration-150 hover:bg-stone-50"
              >
                {/* Property name row */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-1 items-center min-w-0">
                    {editingId === property.id && editingField === "name" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        className="w-full rounded-md border border-blue-300 bg-white px-2 py-1 text-sm font-medium text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                        aria-label="Edit property name"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(property.id, "name", property.name)}
                        className="min-h-[44px] sm:min-h-0 text-left text-sm font-medium text-stone-800 rounded px-2 py-2 sm:py-1 transition-colors duration-150 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label={`Edit name for ${property.name}`}
                      >
                        {property.name}
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteProperty(property.id)}
                    className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-stone-400 sm:min-h-0 sm:min-w-0 sm:p-1 sm:text-stone-300 sm:opacity-0 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:group-hover:opacity-100"
                    aria-label={`Delete ${property.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Value / Mortgage / Equity details */}
                <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                  {/* Value */}
                  <div>
                    <span className="text-stone-400">Value</span>
                    {editingId === property.id && editingField === "value" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        className="mt-0.5 w-full rounded-md border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                        aria-label={`Edit value for ${property.name}`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(property.id, "value", String(property.value))}
                        className="mt-0.5 block w-full min-h-[44px] sm:min-h-0 text-left text-xs font-medium text-blue-700 rounded px-1.5 py-1 sm:py-0.5 transition-colors duration-150 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label={`Edit value for ${property.name}, currently ${formatCurrency(property.value)}`}
                      >
                        {formatCurrency(property.value)}
                      </button>
                    )}
                  </div>

                  {/* Mortgage */}
                  <div>
                    <span className="text-stone-400">Mortgage</span>
                    {editingId === property.id && editingField === "mortgage" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        className="mt-0.5 w-full rounded-md border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                        aria-label={`Edit mortgage for ${property.name}`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(property.id, "mortgage", String(property.mortgage))}
                        className="mt-0.5 block w-full min-h-[44px] sm:min-h-0 text-left text-xs font-medium text-rose-600 rounded px-1.5 py-1 sm:py-0.5 transition-colors duration-150 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-200"
                        aria-label={`Edit mortgage for ${property.name}, currently ${formatCurrency(property.mortgage)}`}
                      >
                        {formatCurrency(property.mortgage)}
                      </button>
                    )}
                  </div>

                  {/* Equity (derived, not editable) */}
                  <div>
                    <span className="text-stone-400">Equity</span>
                    <p className="mt-0.5 px-1.5 py-1 sm:py-0.5 text-xs font-medium text-green-700" data-testid={`equity-${property.id}`}>
                      {formatCurrency(equity)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new property row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2 animate-in">
          <div className="flex flex-col gap-2">
            <input
              ref={newNameRef}
              type="text"
              placeholder="Property name (e.g., Home, Rental)..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => handleNewKeyDown(e, "name")}
              className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-base text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:px-2 sm:py-1 sm:text-sm"
              aria-label="New property name"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                ref={newValueRef}
                type="text"
                placeholder="Value ($)"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => handleNewKeyDown(e, "value")}
                className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-base text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New property value"
              />
              <input
                ref={newMortgageRef}
                type="text"
                placeholder="Mortgage ($)"
                value={newMortgage}
                onChange={(e) => setNewMortgage(e.target.value)}
                onKeyDown={(e) => handleNewKeyDown(e, "mortgage")}
                className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-base text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:px-2 sm:py-1 sm:text-sm"
                aria-label="New property mortgage"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={addProperty}
                className="min-h-[44px] rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
                aria-label="Confirm add property"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setNewName("");
                  setNewValue("");
                  setNewMortgage("");
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-stone-400 sm:min-h-0 sm:min-w-0 sm:p-1 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-200"
                aria-label="Cancel adding property"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total equity and Add button */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-sm font-medium text-stone-500">
          Total Equity: {formatCurrency(totalEquity)}
        </span>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-all duration-150 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 active:bg-blue-100"
          >
            + Add Property
          </button>
        )}
      </div>
    </div>
  );
}
