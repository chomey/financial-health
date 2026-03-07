"use client";

import { useState, useRef, useCallback } from "react";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";

export interface WizardResult {
  income: IncomeItem[];
  expenses: ExpenseItem[];
  assets: Asset[];
  debts: Debt[];
}

interface MobileWizardProps {
  country: "CA" | "US";
  onComplete: (result: WizardResult) => void;
  onSkip: () => void;
}

interface WizardData {
  income: number;
  housing: number;
  food: number;
  transport: number;
  other: number;
  savings: number;
  registered1: number;
  registered2: number;
  debt1: number;
  debt2: number;
  debt3: number;
}

export function buildWizardResult(country: "CA" | "US", data: WizardData): WizardResult {
  const incomeItems: IncomeItem[] = [];
  if (data.income > 0) {
    incomeItems.push({ id: "w-income", category: "Employment Income", amount: data.income, frequency: "monthly" });
  }

  const expenseItems: ExpenseItem[] = [];
  if (data.housing > 0) expenseItems.push({ id: "w-housing", category: "Rent/Mortgage Payment", amount: data.housing });
  if (data.food > 0) expenseItems.push({ id: "w-food", category: "Groceries", amount: data.food });
  if (data.transport > 0) expenseItems.push({ id: "w-transport", category: "Transportation", amount: data.transport });
  if (data.other > 0) expenseItems.push({ id: "w-other", category: "Monthly Expenses", amount: data.other });

  const assetItems: Asset[] = [];
  if (data.savings > 0) assetItems.push({ id: "w-savings", category: "Savings", amount: data.savings });
  const [reg1Cat, reg2Cat] = country === "CA" ? ["TFSA", "RRSP"] : ["Roth IRA", "401k"];
  if (data.registered1 > 0) assetItems.push({ id: "w-reg1", category: reg1Cat, amount: data.registered1 });
  if (data.registered2 > 0) assetItems.push({ id: "w-reg2", category: reg2Cat, amount: data.registered2 });

  const debtItems: Debt[] = [];
  if (data.debt1 > 0) debtItems.push({ id: "w-student", category: "Student Loan", amount: data.debt1 });
  if (data.debt2 > 0) debtItems.push({ id: "w-cc", category: "Credit Card", amount: data.debt2 });
  if (data.debt3 > 0) debtItems.push({ id: "w-car", category: "Car Loan", amount: data.debt3 });

  return { income: incomeItems, expenses: expenseItems, assets: assetItems, debts: debtItems };
}

const STEPS = [
  { id: "income", emoji: "💵", title: "Monthly Income", subtitle: "What's your monthly take-home pay?" },
  { id: "expenses", emoji: "🧾", title: "Monthly Expenses", subtitle: "What do you spend each month?" },
  { id: "assets", emoji: "💰", title: "Savings & Investments", subtitle: "What do you have saved up?" },
  { id: "debts", emoji: "💳", title: "Debts", subtitle: "Any outstanding debts? Leave blank if none." },
];

function PresetButton({ amount, active, onClick }: { amount: number; active: boolean; onClick: () => void }) {
  const label = amount >= 1000 ? `$${(amount / 1000 % 1 === 0 ? (amount / 1000).toFixed(0) : (amount / 1000).toFixed(1))}k` : `$${amount}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95 ${
        active ? "bg-blue-600 text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
      }`}
    >
      {label}
    </button>
  );
}

function AmountField({
  label,
  value,
  onChange,
  presets,
  testId,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  presets?: number[];
  testId?: string;
}) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-stone-600 mb-2">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-stone-400 pointer-events-none">$</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          step={100}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          data-testid={testId}
          className="w-full rounded-xl border border-stone-200 pl-8 pr-4 py-3.5 text-lg font-semibold text-stone-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all duration-150"
        />
      </div>
      {presets && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {presets.map((p) => (
            <PresetButton key={p} amount={p} active={value === String(p)} onClick={() => onChange(String(p))} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MobileWizard({ country, onComplete, onSkip }: MobileWizardProps) {
  const [step, setStep] = useState(0);

  // Step 1: income
  const [incomeAmount, setIncomeAmount] = useState("");

  // Step 2: expenses
  const [housing, setHousing] = useState("");
  const [food, setFood] = useState("");
  const [transport, setTransport] = useState("");
  const [other, setOther] = useState("");

  // Step 3: assets
  const [savings, setSavings] = useState("");
  const [registered1, setRegistered1] = useState("");
  const [registered2, setRegistered2] = useState("");

  // Step 4: debts
  const [debt1, setDebt1] = useState("");
  const [debt2, setDebt2] = useState("");
  const [debt3, setDebt3] = useState("");

  // Swipe gesture tracking
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0 && step < STEPS.length - 1) setStep((s) => s + 1);
        if (dx > 0 && step > 0) setStep((s) => s - 1);
      }
    },
    [step]
  );

  const handleComplete = useCallback(() => {
    const parse = (v: string) => Math.max(0, parseFloat(v) || 0);
    const result = buildWizardResult(country, {
      income: parse(incomeAmount),
      housing: parse(housing),
      food: parse(food),
      transport: parse(transport),
      other: parse(other),
      savings: parse(savings),
      registered1: parse(registered1),
      registered2: parse(registered2),
      debt1: parse(debt1),
      debt2: parse(debt2),
      debt3: parse(debt3),
    });
    try { localStorage.setItem("fhs-wizard-done", "1"); } catch { /* ignore */ }
    onComplete(result);
  }, [country, incomeAmount, housing, food, transport, other, savings, registered1, registered2, debt1, debt2, debt3, onComplete]);

  const handleSkip = useCallback(() => {
    try { localStorage.setItem("fhs-wizard-done", "1"); } catch { /* ignore */ }
    onSkip();
  }, [onSkip]);

  const [reg1Label, reg2Label] = country === "CA" ? ["TFSA", "RRSP"] : ["Roth IRA", "401k"];
  const currentStep = STEPS[step];
  const isLastStep = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-white"
      data-testid="mobile-wizard"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-label="Quick financial setup wizard"
      aria-modal="true"
    >
      {/* Header with progress */}
      <div className="border-b border-stone-100 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-stone-800">Quick Setup</p>
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-stone-400 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded px-1.5 py-0.5 transition-colors duration-150"
            data-testid="wizard-skip"
          >
            Skip
          </button>
        </div>
        {/* Progress bar */}
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuenow={step + 1}
          aria-valuemax={STEPS.length}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
          data-testid="wizard-progress"
        >
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= step ? "bg-blue-500" : "bg-stone-200"
              }`}
            />
          ))}
        </div>
        <p className="mt-1.5 text-xs text-stone-400" data-testid="wizard-step-label">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-5 py-6">
        <div className="mb-6 text-center">
          <span className="text-5xl" aria-hidden="true">
            {currentStep.emoji}
          </span>
          <h2 className="mt-3 text-2xl font-bold text-stone-900" data-testid="wizard-step-title">
            {currentStep.title}
          </h2>
          <p className="mt-1 text-sm text-stone-500">{currentStep.subtitle}</p>
        </div>

        {step === 0 && (
          <div data-testid="wizard-step-income">
            <AmountField
              label="Monthly take-home pay"
              value={incomeAmount}
              onChange={setIncomeAmount}
              presets={[3000, 5000, 7000, 10000]}
              testId="wizard-income-input"
            />
          </div>
        )}

        {step === 1 && (
          <div data-testid="wizard-step-expenses">
            <AmountField
              label="Housing (rent or mortgage)"
              value={housing}
              onChange={setHousing}
              presets={[800, 1200, 1800, 2500]}
              testId="wizard-housing-input"
            />
            <AmountField
              label="Groceries & food"
              value={food}
              onChange={setFood}
              presets={[400, 600, 800]}
              testId="wizard-food-input"
            />
            <AmountField
              label="Transportation"
              value={transport}
              onChange={setTransport}
              presets={[200, 400, 600]}
              testId="wizard-transport-input"
            />
            <AmountField
              label="Everything else"
              value={other}
              onChange={setOther}
              presets={[300, 600, 1000]}
              testId="wizard-other-input"
            />
          </div>
        )}

        {step === 2 && (
          <div data-testid="wizard-step-assets">
            <AmountField
              label="Savings & checking"
              value={savings}
              onChange={setSavings}
              presets={[5000, 10000, 25000]}
              testId="wizard-savings-input"
            />
            <AmountField
              label={reg1Label}
              value={registered1}
              onChange={setRegistered1}
              presets={[5000, 20000, 50000]}
              testId="wizard-reg1-input"
            />
            <AmountField
              label={reg2Label}
              value={registered2}
              onChange={setRegistered2}
              presets={[10000, 30000, 75000]}
              testId="wizard-reg2-input"
            />
          </div>
        )}

        {step === 3 && (
          <div data-testid="wizard-step-debts">
            <AmountField
              label="Student loans"
              value={debt1}
              onChange={setDebt1}
              presets={[5000, 15000, 30000]}
              testId="wizard-debt1-input"
            />
            <AmountField
              label="Credit cards"
              value={debt2}
              onChange={setDebt2}
              presets={[1000, 5000, 10000]}
              testId="wizard-debt2-input"
            />
            <AmountField
              label="Car loan"
              value={debt3}
              onChange={setDebt3}
              presets={[5000, 15000, 25000]}
              testId="wizard-debt3-input"
            />
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="border-t border-stone-100 px-5 py-4 flex items-center gap-3">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="h-[52px] flex-1 rounded-xl border border-stone-200 bg-white text-sm font-semibold text-stone-600 transition-all duration-150 hover:bg-stone-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400"
            data-testid="wizard-prev"
          >
            ← Back
          </button>
        ) : (
          <div className="flex-1" />
        )}

        {isLastStep ? (
          <button
            type="button"
            onClick={handleComplete}
            className="h-[52px] flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            data-testid="wizard-complete"
          >
            See my snapshot →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="h-[52px] flex-1 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:bg-blue-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            data-testid="wizard-next"
          >
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
