"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { WIZARD_STEPS, type WizardStep, getStepFromURL, updateStepURL } from "@/lib/url-state";
import { getForeignCurrency } from "@/lib/currency";
import { AppHeader } from "@/app/_page-helpers";
import WizardStepper from "./WizardStepper";
import WelcomeStep from "./steps/WelcomeStep";
import ProfileStep from "./steps/ProfileStep";
import PropertyStep from "./steps/PropertyStep";
import AssetsStep from "./steps/AssetsStep";
import StocksStep from "./steps/StocksStep";
import DebtsStep from "./steps/DebtsStep";
import IncomeStep from "./steps/IncomeStep";
import TaxSummaryStep from "./steps/TaxSummaryStep";
import ExpensesStep from "./steps/ExpensesStep";
// TaxCreditsStep merged into ExpensesStep
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";
import type { TaxCredit, FilingStatus } from "@/lib/tax-credits";
import type { FxRates, SupportedCurrency } from "@/lib/currency";
import type { FinancialState } from "@/lib/financial-types";
import type { SampleProfile } from "@/lib/sample-profiles";

export interface WizardProps {
  // State
  assets: Asset[];
  debts: Debt[];
  properties: Property[];
  stocks: StockHolding[];
  income: IncomeItem[];
  expenses: ExpenseItem[];
  country: "CA" | "US" | "AU";
  jurisdiction: string;
  age: number | undefined;
  taxCredits: TaxCredit[];
  filingStatus: FilingStatus;
  taxYear: number;
  homeCurrency: SupportedCurrency;
  effectiveFxRates: FxRates;
  fxManualOverride: number | undefined;
  federalTaxOverride: number | undefined;
  provincialTaxOverride: number | undefined;
  // Computed
  monthlySurplus: number;
  annualEmploymentSalary: number;
  // For building FinancialState for tax computation
  surplusTargetComputedId: string | undefined;
  // Setters
  handleAssetsChange: (assets: Asset[]) => void;
  setDebts: (debts: Debt[]) => void;
  setProperties: (properties: Property[]) => void;
  setStocks: (stocks: StockHolding[]) => void;
  setIncome: (income: IncomeItem[]) => void;
  setExpenses: (expenses: ExpenseItem[]) => void;
  handleCountryChange: (country: "CA" | "US" | "AU") => void;
  setJurisdiction: (j: string) => void;
  setAge: (age: number | undefined) => void;
  setTaxCredits: (credits: TaxCredit[]) => void;
  setFilingStatus: (fs: FilingStatus) => void;
  setTaxYear: (y: number) => void;
  setFxManualOverride: (v: number | undefined) => void;
  setFederalTaxOverride: (v: number | undefined) => void;
  setProvincialTaxOverride: (v: number | undefined) => void;
  // Sample profiles
  loadProfile: (profile: SampleProfile) => void;
  clearAll: () => void;
  // Navigation
  onFinish: () => void;
}

export default function WizardShell(props: WizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("welcome");

  useEffect(() => {
    const urlStep = getStepFromURL();
    if (urlStep && urlStep !== "dashboard") {
      setCurrentStep(urlStep);
    }
  }, []);

  const navigateTo = useCallback((step: WizardStep) => {
    setCurrentStep(step);
    updateStepURL(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const currentIdx = WIZARD_STEPS.indexOf(currentStep);
  const isFirst = currentIdx === 0;
  const isLast = currentIdx === WIZARD_STEPS.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      props.onFinish();
    } else {
      navigateTo(WIZARD_STEPS[currentIdx + 1]);
    }
  }, [currentIdx, isLast, navigateTo, props]);

  const goPrev = useCallback(() => {
    if (!isFirst) {
      navigateTo(WIZARD_STEPS[currentIdx - 1]);
    }
  }, [currentIdx, isFirst, navigateTo]);

  const stepCompletion = useMemo(() => ({
    welcome: true, // landing step, always complete
    profile: !!(props.country && props.jurisdiction),
    property: true, // optional, always "complete"
    assets: props.assets.filter(a => !a.computed).length > 0,
    stocks: true, // optional
    debts: true, // optional
    income: props.income.length > 0,
    "tax-summary": true, // read-only interstitial, always complete
    expenses: props.expenses.length > 0,
  }), [props.assets, props.income, props.expenses, props.country, props.jurisdiction]);

  // Build FinancialState for tax summary step
  const state: FinancialState = useMemo(() => ({
    assets: props.assets,
    debts: props.debts,
    properties: props.properties,
    stocks: props.stocks,
    income: props.income,
    expenses: props.expenses,
    country: props.country,
    jurisdiction: props.jurisdiction,
    age: props.age,
    federalTaxOverride: props.federalTaxOverride,
    provincialTaxOverride: props.provincialTaxOverride,
    surplusTargetComputedId: props.surplusTargetComputedId,
    fxRates: props.effectiveFxRates,
    fxManualOverride: props.fxManualOverride,
    taxCredits: props.taxCredits,
    filingStatus: props.filingStatus,
    taxYear: props.taxYear,
  }), [props]);

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <WelcomeStep
            country={props.country}
            jurisdiction={props.jurisdiction}
            taxYear={props.taxYear}
            onCountryChange={props.handleCountryChange}
            onJurisdictionChange={props.setJurisdiction}
            onTaxYearChange={props.setTaxYear}
            loadProfile={props.loadProfile}
            onProfileLoaded={props.onFinish}
            onEnterOwn={() => { props.clearAll(); goNext(); }}
          />
        );
      case "profile":
        return (
          <ProfileStep
            country={props.country}
            jurisdiction={props.jurisdiction}
            age={props.age}
            filingStatus={props.filingStatus}
            taxYear={props.taxYear}
            homeCurrency={props.homeCurrency}
            foreignCurrency={getForeignCurrency(props.homeCurrency)}
            effectiveFxRates={props.effectiveFxRates}
            fxManualOverride={props.fxManualOverride}
            onCountryChange={props.handleCountryChange}
            onJurisdictionChange={props.setJurisdiction}
            onAgeChange={props.setAge}
            onFilingStatusChange={props.setFilingStatus}
            onTaxYearChange={props.setTaxYear}
            onFxManualOverrideChange={props.setFxManualOverride}
          />
        );
      case "property":
        return (
          <PropertyStep
            items={props.properties}
            onChange={props.setProperties}
            homeCurrency={props.homeCurrency}
            fxRates={props.effectiveFxRates}
          />
        );
      case "assets":
        return (
          <AssetsStep
            items={props.assets}
            onChange={props.handleAssetsChange}
            monthlySurplus={props.monthlySurplus}
            homeCurrency={props.homeCurrency}
            fxRates={props.effectiveFxRates}
            annualEmploymentSalary={props.annualEmploymentSalary}
          />
        );
      case "stocks":
        return (
          <StocksStep
            items={props.stocks}
            onChange={props.setStocks}
          />
        );
      case "debts":
        return (
          <DebtsStep
            items={props.debts}
            onChange={props.setDebts}
            homeCurrency={props.homeCurrency}
            fxRates={props.effectiveFxRates}
          />
        );
      case "income":
        return (
          <IncomeStep
            items={props.income}
            onChange={props.setIncome}
            homeCurrency={props.homeCurrency}
            fxRates={props.effectiveFxRates}
          />
        );
      case "tax-summary":
        return (
          <TaxSummaryStep state={state} />
        );
      case "expenses":
      case "tax-credits": // backward compat — merged into expenses
        return (
          <ExpensesStep
            items={props.expenses}
            onChange={props.setExpenses}
            homeCurrency={props.homeCurrency}
            fxRates={props.effectiveFxRates}
            taxCredits={props.taxCredits}
            onTaxCreditsChange={props.setTaxCredits}
            country={props.country}
            filingStatus={props.filingStatus}
            annualIncome={props.income.reduce((sum, i) => sum + (i.amount ?? 0), 0) * 12}
            taxYear={props.taxYear}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <AppHeader activePhase="inputs" onSwitchPhase={props.onFinish}>
          <WizardStepper
            currentStep={currentStep}
            onStepChange={navigateTo}
            stepCompletion={stepCompletion}
          />
      </AppHeader>

      {/* Step content */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-3xl">
          {renderStep()}
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="sticky bottom-0 border-t border-white/10 bg-slate-900/95 backdrop-blur-sm px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goPrev}
            disabled={isFirst}
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-400 transition-all duration-150 hover:bg-white/10 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-violet-400"
            data-testid="wizard-prev"
          >
            ← Back
          </button>
          <span className="text-xs text-slate-600 tabular-nums">
            {currentIdx + 1} of {WIZARD_STEPS.length}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={stepCompletion[currentStep as keyof typeof stepCompletion] === false}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-40 disabled:cursor-not-allowed ${
              isLast
                ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-500/20"
                : "bg-violet-600 text-white hover:bg-violet-500"
            }`}
            data-testid="wizard-next"
          >
            {isLast ? "See my results →" : "Next →"}
          </button>
        </div>
      </footer>
    </div>
  );
}
