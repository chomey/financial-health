"use client";

import { useState, useRef, useEffect } from "react";

export interface Property {
  id: string;
  name: string;
  value: number;
  mortgage: number;
  interestRate?: number; // annual %
  monthlyPayment?: number; // $ per month
  amortizationYears?: number; // original amortization term
  yearPurchased?: number; // year the property was purchased
  appreciation?: number; // annual appreciation/depreciation % (negative for depreciating assets)
}

/** Compute remaining amortization years based on purchase year and original term */
export function computeRemainingYears(amortizationYears: number | undefined, yearPurchased: number | undefined): number {
  const term = amortizationYears ?? 25;
  if (yearPurchased === undefined) return term;
  const elapsed = new Date().getFullYear() - yearPurchased;
  return Math.max(1, term - elapsed);
}

/** Get the effective monthly payment for a property (explicit or suggested) */
export function getEffectivePayment(property: Property): number {
  if (property.monthlyPayment !== undefined && property.monthlyPayment > 0) {
    return property.monthlyPayment;
  }
  if (property.mortgage <= 0) return 0;
  const rate = property.interestRate ?? DEFAULT_INTEREST_RATE;
  const remainingYears = computeRemainingYears(property.amortizationYears, property.yearPurchased);
  return suggestMonthlyPayment(property.mortgage, rate, remainingYears);
}

/** Default interest rate suggestion for mortgages (annual %) */
export const DEFAULT_INTEREST_RATE = 5;

/** Compute monthly interest and principal portions of a mortgage payment */
export function computeMortgageBreakdown(
  mortgage: number,
  annualRate: number,
  monthlyPayment: number
): { interestPortion: number; principalPortion: number } {
  const monthlyRate = annualRate / 100 / 12;
  const interestPortion = mortgage * monthlyRate;
  const principalPortion = Math.max(0, monthlyPayment - interestPortion);
  return { interestPortion, principalPortion };
}

/** Compute total interest over remaining term and estimated payoff date */
export function computeAmortizationInfo(
  mortgage: number,
  annualRate: number,
  monthlyPayment: number
): { totalInterest: number; payoffMonths: number } {
  if (mortgage <= 0 || monthlyPayment <= 0) {
    return { totalInterest: 0, payoffMonths: 0 };
  }
  const monthlyRate = annualRate / 100 / 12;
  let balance = mortgage;
  let totalInterest = 0;
  let months = 0;
  const maxMonths = 360 * 2; // safety cap: 60 years

  while (balance > 0.01 && months < maxMonths) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    const principal = Math.min(monthlyPayment - interest, balance);
    if (principal <= 0) {
      // Payment doesn't cover interest — will never pay off
      return { totalInterest: -1, payoffMonths: -1 };
    }
    balance -= principal;
    months++;
  }

  return { totalInterest, payoffMonths: months };
}

/** Yearly summary for amortization schedule */
export interface AmortizationYearSummary {
  year: number;
  interestPaid: number;
  principalPaid: number;
  endingBalance: number;
}

/** Compute a year-by-year amortization schedule */
export function computeAmortizationSchedule(
  mortgage: number,
  annualRate: number,
  monthlyPayment: number
): AmortizationYearSummary[] {
  if (mortgage <= 0 || monthlyPayment <= 0) return [];
  const monthlyRate = annualRate / 100 / 12;
  let balance = mortgage;
  const schedule: AmortizationYearSummary[] = [];
  const maxYears = 60;

  for (let year = 1; year <= maxYears && balance > 0.01; year++) {
    let yearInterest = 0;
    let yearPrincipal = 0;
    for (let month = 0; month < 12 && balance > 0.01; month++) {
      const interest = balance * monthlyRate;
      const principal = Math.min(monthlyPayment - interest, balance);
      if (principal <= 0) {
        // Payment doesn't cover interest
        return schedule;
      }
      yearInterest += interest;
      yearPrincipal += principal;
      balance -= principal;
    }
    schedule.push({
      year,
      interestPaid: Math.round(yearInterest),
      principalPaid: Math.round(yearPrincipal),
      endingBalance: Math.max(0, Math.round(balance)),
    });
  }

  return schedule;
}

/** Suggest a reasonable monthly payment from mortgage amount and rate */
export function suggestMonthlyPayment(mortgage: number, annualRate: number, years: number = 25): number {
  if (mortgage <= 0) return 0;
  const monthlyRate = annualRate / 100 / 12;
  if (monthlyRate === 0) return Math.round(mortgage / (years * 12));
  const n = years * 12;
  const payment = mortgage * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  return Math.round(payment);
}

/** Suggest a default appreciation rate based on property name */
export function getDefaultAppreciation(name: string): number | undefined {
  const lower = name.toLowerCase();
  if (/\b(home|house|condo|townhouse|apartment|duplex|triplex|rental|cottage|cabin)\b/.test(lower)) {
    return 3;
  }
  if (/\b(car|vehicle|truck|suv|van|motorcycle|boat)\b/.test(lower)) {
    return -15;
  }
  return undefined;
}

/** Get the property icon based on appreciation rate */
export function getPropertyIcon(appreciation: number | undefined, name: string): string {
  const rate = appreciation ?? getDefaultAppreciation(name);
  if (rate !== undefined && rate < 0) return "🚗";
  return "🏠";
}

const MOCK_PROPERTIES: Property[] = [
  { id: "p1", name: "Home", value: 450000, mortgage: 280000 },
];

function generateId(): string {
  return `p${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
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

  const [expandedSchedule, setExpandedSchedule] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<"name" | "value" | "mortgage" | "interestRate" | "monthlyPayment" | "amortizationYears" | "yearPurchased" | "appreciation" | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newMortgage, setNewMortgage] = useState("");
  const [newInterestRate, setNewInterestRate] = useState("");
  const [newMonthlyPayment, setNewMonthlyPayment] = useState("");
  const [newAmortization, setNewAmortization] = useState("");
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

  const startEdit = (id: string, field: "name" | "value" | "mortgage" | "interestRate" | "monthlyPayment" | "amortizationYears" | "yearPurchased" | "appreciation", currentValue: string) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
  };

  /** Recalculate monthly payment from mortgage factors */
  const recalcPayment = (p: Property): Property => {
    if (p.mortgage <= 0) return { ...p, monthlyPayment: undefined };
    const rate = p.interestRate ?? DEFAULT_INTEREST_RATE;
    const remainingYears = computeRemainingYears(p.amortizationYears, p.yearPurchased);
    return { ...p, monthlyPayment: suggestMonthlyPayment(p.mortgage, rate, remainingYears) };
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
          if (editingField === "mortgage") {
            const updated = { ...p, mortgage: parseCurrencyInput(editValue) };
            return recalcPayment(updated);
          }
          if (editingField === "interestRate") {
            const val = parseFloat(editValue);
            const updated = { ...p, interestRate: isNaN(val) ? undefined : val };
            return recalcPayment(updated);
          }
          if (editingField === "monthlyPayment") {
            const val = parseCurrencyInput(editValue);
            return { ...p, monthlyPayment: val || undefined };
          }
          if (editingField === "amortizationYears") {
            const val = parseFloat(editValue);
            const updated = { ...p, amortizationYears: isNaN(val) ? undefined : val };
            return recalcPayment(updated);
          }
          if (editingField === "yearPurchased") {
            const val = parseInt(editValue);
            const updated = { ...p, yearPurchased: isNaN(val) ? undefined : val };
            return recalcPayment(updated);
          }
          if (editingField === "appreciation") {
            const val = parseFloat(editValue);
            return { ...p, appreciation: isNaN(val) ? undefined : val };
          }
          return p;
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
    const newProp: Property = { id: generateId(), name: newName.trim(), value, mortgage };
    const rate = parseFloat(newInterestRate);
    if (!isNaN(rate)) newProp.interestRate = rate;
    const payment = parseCurrencyInput(newMonthlyPayment);
    if (payment > 0) newProp.monthlyPayment = payment;
    const amort = parseFloat(newAmortization);
    if (!isNaN(amort) && amort > 0) newProp.amortizationYears = amort;
    // Auto-set appreciation based on property name if not otherwise specified
    const defaultAp = getDefaultAppreciation(newName.trim());
    if (defaultAp !== undefined) newProp.appreciation = defaultAp;
    setProperties((prev) => [...prev, newProp]);
    setNewName("");
    setNewValue("");
    setNewMortgage("");
    setNewInterestRate("");
    setNewMonthlyPayment("");
    setNewAmortization("");
    setAddingNew(false);
  };

  const handleNewKeyDown = (e: React.KeyboardEvent, field: string) => {
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
      setNewInterestRate("");
      setNewMonthlyPayment("");
      setNewAmortization("");
    }
  };

  const totalEquity = properties.reduce((sum, p) => sum + Math.max(0, p.value - p.mortgage), 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 sm:p-4">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-stone-800">
        <span aria-hidden="true">{properties.some(p => (p.appreciation ?? getDefaultAppreciation(p.name) ?? 0) < 0) ? "🏠🚗" : "🏠"}</span>
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
                        <span className="mr-1" aria-hidden="true">{getPropertyIcon(property.appreciation, property.name)}</span>
                        {property.name}
                        {(() => {
                          const ap = property.appreciation ?? getDefaultAppreciation(property.name);
                          if (ap === undefined) return null;
                          const isPositive = ap >= 0;
                          return (
                            <span
                              className={`ml-1.5 inline-block rounded px-1 py-0.5 text-[10px] font-medium ${
                                isPositive ? "bg-green-50 text-green-600" : "bg-rose-50 text-rose-600"
                              }`}
                              data-testid={`appreciation-badge-${property.id}`}
                            >
                              {isPositive ? "+" : ""}{ap}%/yr
                            </span>
                          );
                        })()}
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

                {/* Secondary detail fields: interest rate, monthly payment, amortization */}
                {(() => {
                  const rate = property.interestRate;
                  const hasRate = rate !== undefined;
                  const displayRate = rate ?? DEFAULT_INTEREST_RATE;
                  const payment = property.monthlyPayment;
                  const hasPayment = payment !== undefined && payment > 0;
                  const remainingYears = computeRemainingYears(property.amortizationYears, property.yearPurchased);
                  const suggestedPayment = property.mortgage > 0 ? suggestMonthlyPayment(property.mortgage, displayRate, remainingYears) : 0;
                  const displayPayment = payment ?? suggestedPayment;
                  const amortYears = property.amortizationYears;
                  const hasAmort = amortYears !== undefined;

                  // Computed info
                  const showComputed = property.mortgage > 0 && displayPayment > 0;
                  const breakdown = showComputed ? computeMortgageBreakdown(property.mortgage, displayRate, displayPayment) : null;
                  const amortInfo = showComputed ? computeAmortizationInfo(property.mortgage, displayRate, displayPayment) : null;
                  const schedule = showComputed && amortInfo && amortInfo.payoffMonths > 0 ? computeAmortizationSchedule(property.mortgage, displayRate, displayPayment) : [];

                  return (
                    <div className="mt-1.5 space-y-1.5" data-testid={`property-details-${property.id}`}>
                      {/* Editable detail badges */}
                      <div className="flex flex-wrap items-center gap-2 px-1">
                        {/* Interest rate */}
                        {editingId === property.id && editingField === "interestRate" ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleEditKeyDown}
                            className="w-20 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                            aria-label={`Edit interest rate for ${property.name}`}
                            placeholder="e.g. 5"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(property.id, "interestRate", String(property.interestRate ?? ""))}
                            className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                              hasRate
                                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                : "bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                            }`}
                            aria-label={`Edit interest rate for ${property.name}${hasRate ? `, currently ${rate}%` : ""}`}
                            data-testid={`rate-badge-${property.id}`}
                          >
                            {hasRate ? `${rate}% APR` : `${DEFAULT_INTEREST_RATE}% APR (suggested)`}
                          </button>
                        )}

                        {/* Monthly payment */}
                        {editingId === property.id && editingField === "monthlyPayment" ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleEditKeyDown}
                            className="w-24 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                            aria-label={`Edit monthly payment for ${property.name}`}
                            placeholder="e.g. 1500"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(property.id, "monthlyPayment", String(property.monthlyPayment ?? ""))}
                            className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                              hasPayment
                                ? "bg-green-50 text-green-600 hover:bg-green-100"
                                : suggestedPayment > 0
                                  ? "bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                                  : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                            }`}
                            aria-label={`Edit monthly payment for ${property.name}${hasPayment ? `, currently ${formatCurrency(payment!)}` : ""}`}
                            data-testid={`payment-badge-${property.id}`}
                          >
                            {hasPayment
                              ? `${formatCurrency(payment!)}/mo`
                              : suggestedPayment > 0
                                ? `${formatCurrency(suggestedPayment)}/mo (suggested)`
                                : "Monthly payment"}
                          </button>
                        )}

                        {/* Amortization years */}
                        {editingId === property.id && editingField === "amortizationYears" ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={handleEditKeyDown}
                            className="w-16 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                            aria-label={`Edit amortization years for ${property.name}`}
                            placeholder="e.g. 25"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(property.id, "amortizationYears", String(property.amortizationYears ?? ""))}
                            className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                              hasAmort
                                ? "bg-purple-50 text-purple-600 hover:bg-purple-100"
                                : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                            }`}
                            aria-label={`Edit amortization for ${property.name}${hasAmort ? `, currently ${amortYears} years` : ""}`}
                            data-testid={`amort-badge-${property.id}`}
                          >
                            {hasAmort ? `${amortYears}yr term` : "Term years"}
                          </button>
                        )}

                        {/* Year purchased */}
                        {(() => {
                          const hasYearPurchased = property.yearPurchased !== undefined;
                          return editingId === property.id && editingField === "yearPurchased" ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={handleEditKeyDown}
                              className="w-16 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                              aria-label={`Edit year purchased for ${property.name}`}
                              placeholder="e.g. 2020"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(property.id, "yearPurchased", String(property.yearPurchased ?? ""))}
                              className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                hasYearPurchased
                                  ? "bg-orange-50 text-orange-600 hover:bg-orange-100"
                                  : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                              }`}
                              aria-label={`Edit year purchased for ${property.name}${hasYearPurchased ? `, currently ${property.yearPurchased}` : ""}`}
                              data-testid={`year-badge-${property.id}`}
                            >
                              {hasYearPurchased ? `Bought ${property.yearPurchased}` : "Year purchased"}
                            </button>
                          );
                        })()}

                        {/* Appreciation/depreciation rate */}
                        {(() => {
                          const hasAppreciation = property.appreciation !== undefined;
                          const defaultAp = getDefaultAppreciation(property.name);
                          const displayAp = property.appreciation ?? defaultAp;
                          const isNegative = displayAp !== undefined && displayAp < 0;
                          return editingId === property.id && editingField === "appreciation" ? (
                            <input
                              ref={inputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onBlur={commitEdit}
                              onKeyDown={handleEditKeyDown}
                              className="w-20 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                              aria-label={`Edit appreciation rate for ${property.name}`}
                              placeholder="e.g. 3 or -15"
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEdit(property.id, "appreciation", String(property.appreciation ?? ""))}
                              className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                                hasAppreciation
                                  ? isNegative
                                    ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                    : "bg-green-50 text-green-600 hover:bg-green-100"
                                  : defaultAp !== undefined
                                    ? "bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-500"
                                    : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                              }`}
                              aria-label={`Edit appreciation rate for ${property.name}${hasAppreciation ? `, currently ${property.appreciation}%` : ""}`}
                              data-testid={`appreciation-edit-${property.id}`}
                            >
                              {hasAppreciation
                                ? `${property.appreciation! >= 0 ? "+" : ""}${property.appreciation}%/yr`
                                : defaultAp !== undefined
                                  ? `${defaultAp >= 0 ? "+" : ""}${defaultAp}%/yr (suggested)`
                                  : "Appreciation %"}
                            </button>
                          );
                        })()}
                      </div>

                      {/* Computed mortgage info */}
                      {showComputed && breakdown && amortInfo && amortInfo.payoffMonths > 0 && (
                        <div className="mx-1 rounded-md bg-stone-50 px-2 py-1.5 text-[11px] text-stone-500 space-y-0.5" data-testid={`mortgage-info-${property.id}`}>
                          <div className="flex justify-between">
                            <span>Current month: interest</span>
                            <span className="font-medium text-rose-500">{formatCurrency(Math.round(breakdown.interestPortion))}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Current month: principal</span>
                            <span className="font-medium text-green-600">{formatCurrency(Math.round(breakdown.principalPortion))}</span>
                          </div>
                          {schedule.length > 1 && (
                            <div className="flex justify-between border-t border-stone-200 pt-0.5 mt-0.5">
                              <span>First year avg interest</span>
                              <span className="font-medium text-rose-400">{formatCurrency(Math.round(schedule[0].interestPaid / 12))}/mo</span>
                            </div>
                          )}
                          {schedule.length > 1 && (() => {
                            const lastYear = schedule[schedule.length - 1];
                            const lastYearMonths = amortInfo.payoffMonths - (schedule.length - 1) * 12;
                            const avgMonthlyInterest = Math.round(lastYear.interestPaid / (lastYearMonths > 0 ? lastYearMonths : 12));
                            return (
                              <div className="flex justify-between">
                                <span>Last year avg interest</span>
                                <span className="font-medium text-green-500">{formatCurrency(avgMonthlyInterest)}/mo</span>
                              </div>
                            );
                          })()}
                          {amortInfo.totalInterest > 0 && (
                            <div className="flex justify-between border-t border-stone-200 pt-0.5 mt-0.5">
                              <span>Total interest remaining</span>
                              <span className="font-medium text-stone-600">{formatCurrency(Math.round(amortInfo.totalInterest))}</span>
                            </div>
                          )}
                          {property.yearPurchased !== undefined && (
                            <div className="flex justify-between">
                              <span>Remaining term</span>
                              <span className="font-medium text-stone-600">{remainingYears}yr of {property.amortizationYears ?? 25}yr</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span>Estimated payoff</span>
                            <span className="font-medium text-stone-600">
                              {(() => {
                                const payoffDate = new Date();
                                payoffDate.setMonth(payoffDate.getMonth() + amortInfo.payoffMonths);
                                return `${payoffDate.toLocaleDateString("en-US", { month: "short", year: "numeric" })} (${Math.ceil(amortInfo.payoffMonths / 12)}yr)`;
                              })()}
                            </span>
                          </div>
                          {/* View schedule expandable */}
                          {schedule.length > 0 && (
                            <div className="border-t border-stone-200 pt-1 mt-1">
                              <button
                                type="button"
                                onClick={() => setExpandedSchedule(expandedSchedule === property.id ? null : property.id)}
                                className="text-[11px] text-blue-500 hover:text-blue-700 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-blue-200 rounded px-1"
                                data-testid={`view-schedule-${property.id}`}
                              >
                                {expandedSchedule === property.id ? "Hide schedule" : "View schedule"}
                              </button>
                              {expandedSchedule === property.id && (
                                <div className="mt-1 overflow-x-auto" data-testid={`schedule-table-${property.id}`}>
                                  <table className="w-full text-[10px] text-stone-500">
                                    <thead>
                                      <tr className="border-b border-stone-200">
                                        <th className="py-0.5 text-left font-medium">Year</th>
                                        <th className="py-0.5 text-right font-medium">Interest</th>
                                        <th className="py-0.5 text-right font-medium">Principal</th>
                                        <th className="py-0.5 text-right font-medium">Balance</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {schedule.map((row) => (
                                        <tr key={row.year} className="border-b border-stone-100 last:border-0">
                                          <td className="py-0.5">{row.year}</td>
                                          <td className="py-0.5 text-right text-rose-400">{formatCurrency(row.interestPaid)}</td>
                                          <td className="py-0.5 text-right text-green-500">{formatCurrency(row.principalPaid)}</td>
                                          <td className="py-0.5 text-right">{formatCurrency(row.endingBalance)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {showComputed && amortInfo && amortInfo.payoffMonths === -1 && (
                        <div className="mx-1 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-amber-600" data-testid={`mortgage-warning-${property.id}`}>
                          Payment doesn&apos;t cover monthly interest — consider increasing your payment.
                        </div>
                      )}
                    </div>
                  );
                })()}
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
                  setNewInterestRate("");
                  setNewMonthlyPayment("");
                  setNewAmortization("");
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
