"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import PropertyEntry from "@/components/PropertyEntry";
import StockEntry, { getStockValue } from "@/components/StockEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import SnapshotDashboard, { type DataFlowConnectionDef } from "@/components/SnapshotDashboard";
import ProjectionChart from "@/components/ProjectionChart";
import CountryJurisdictionSelector from "@/components/CountryJurisdictionSelector";
import ExpenseBreakdownChart from "@/components/ExpenseBreakdownChart";
import NetWorthDonutChart from "@/components/NetWorthDonutChart";
import FastForwardPanel from "@/components/FastForwardPanel";
import BenchmarkComparisons from "@/components/BenchmarkComparisons";
import CashFlowSankey from "@/components/CashFlowSankey";
import FxRateDisplay from "@/components/FxRateDisplay";
import InsightsPanel from "@/components/InsightsPanel";
import ZoomableCard from "@/components/ZoomableCard";
import { DataFlowProvider, useOptionalDataFlow, type SourceMetadataItem } from "@/components/DataFlowArrows";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import {
  INITIAL_STATE,
  computeMetrics,
  computeTotals,
  computeMonthlyInvestmentReturns,
  toFinancialData,
} from "@/lib/financial-state";
import { getProfilesForCountry, type SampleProfile } from "@/lib/sample-profiles";
import MobileWizard, { type WizardResult } from "@/components/MobileWizard";
import { getStateFromURL, updateURL, getSwrFromURL, updateSwrURL } from "@/lib/url-state";
import { getHomeCurrency, getForeignCurrency, getEffectiveFxRates, fxPairKey, formatCurrencyCompact } from "@/lib/currency";
import type { FxRates, SupportedCurrency } from "@/lib/currency";
import type { Asset } from "@/components/AssetEntry";
import { getDefaultRoiTaxTreatment } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import { computeMortgageBreakdown, DEFAULT_INTEREST_RATE } from "@/components/PropertyEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getPortfolioSummary, getAnnualizedReturn } from "@/components/StockEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";

function PrintSnapshotButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-400 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95 print:hidden"
      aria-label="Print snapshot"
      data-testid="print-snapshot-button"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
      Print
    </button>
  );
}

function PrintFooter() {
  const [date, setDate] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const updateValues = () => {
      setDate(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      setUrl(window.location.href);
    };
    updateValues();
    // Also refresh right before the browser opens the print dialog
    window.addEventListener("beforeprint", updateValues);
    return () => window.removeEventListener("beforeprint", updateValues);
  }, []);

  return (
    <footer
      className="mt-8 hidden border-t border-slate-700 pt-4 print:block"
      data-testid="print-footer"
    >
      <div className="flex items-start justify-between gap-4 text-xs text-slate-500">
        <div>
          <p className="font-semibold text-slate-300">Financial Health Snapshot</p>
          <p className="mt-0.5">Your finances at a glance — no accounts, no data stored</p>
        </div>
        <div className="space-y-0.5 text-right">
          <p data-testid="print-footer-date">{date}</p>
          <p
            className="break-all font-mono text-xs text-slate-500"
            data-testid="print-footer-url"
          >
            {url}
          </p>
        </div>
      </div>
    </footer>
  );
}

function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-400 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95"
      aria-label="Copy link to clipboard"
    >
      {copied ? (
        <>
          <svg
            className="h-4 w-4 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-cyan-400">Copied!</span>
        </>
      ) : (
        <>
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Copy Link
        </>
      )}
    </button>
  );
}

function AgeInputHeader({ age, onAgeChange }: { age?: number; onAgeChange: (age: number | undefined) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(age?.toString() ?? "");

  const submit = () => {
    const parsed = parseInt(input, 10);
    if (parsed >= 18 && parsed <= 120) {
      onAgeChange(parsed);
    } else if (input === "") {
      onAgeChange(undefined);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5" data-testid="age-input-header-form">
        <label className="text-sm font-medium text-slate-400">Age:</label>
        <input
          type="number"
          min={18}
          max={120}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setEditing(false); }}
          onBlur={submit}
          autoFocus
          className="w-16 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-sm text-slate-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all duration-150"
          placeholder="e.g. 35"
          data-testid="age-input-header"
        />
      </div>
    );
  }

  if (age) {
    return (
      <div className="flex items-center gap-1" data-testid="age-display-header">
        <span className="text-sm font-medium text-slate-400">Age:</span>
        <button
          onClick={() => { setInput(age.toString()); setEditing(true); }}
          className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-medium text-slate-300 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900"
          data-testid="age-value-header"
        >
          {age}
        </button>
        <button
          onClick={() => { onAgeChange(undefined); setInput(""); }}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors duration-150 rounded"
          aria-label="Clear age"
          data-testid="age-clear-header"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setInput(""); setEditing(true); }}
      className="min-h-[36px] rounded-lg border border-dashed border-white/10 bg-transparent px-3 py-1 text-sm text-slate-500 transition-all duration-200 hover:border-white/20 hover:text-slate-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900"
      data-testid="age-add-header"
    >
      Add age
    </button>
  );
}

function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative mb-6 rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-400/10 to-cyan-400/5 px-4 py-4 shadow-sm sm:px-6 sm:py-5 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
        aria-label="Dismiss welcome message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <h2 className="mb-2 text-base font-semibold text-slate-200 sm:text-lg">
        Welcome! Here&apos;s how this works
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-400">
        <p>
          This is a simple tool to help you see your <strong>full financial picture in one place</strong>. Just fill in some rough numbers for your savings, debts, income, and expenses — it doesn&apos;t need to be exact.
        </p>
        <p>
          You&apos;ll get a snapshot of where you stand, plus a projection of how things could look in 10, 20, or 30 years.
        </p>
        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2.5 text-xs text-slate-400 sm:text-sm">
          <strong className="text-slate-300">Your privacy is fully protected.</strong> Nothing you enter is stored on any server or sent anywhere. All your data stays right here in your browser. The numbers are saved in the page link itself — so you can bookmark it or share it, but nobody can see your information unless you give them that link.
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  id,
  title,
  icon,
  summary,
  children,
  defaultOpen = true,
  dataFlowId,
  dataFlowValue,
  dataFlowLabel,
  dataFlowItems,
}: {
  id?: string;
  title: string;
  icon: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  dataFlowId?: string;
  dataFlowValue?: number;
  dataFlowLabel?: string;
  dataFlowItems?: SourceMetadataItem[];
}) {
  const [open, setOpen] = useState(defaultOpen);
  const collapsedRef = useRef<HTMLButtonElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const ctx = useOptionalDataFlow();

  // Register the appropriate element as a data-flow source based on open/collapsed state
  useEffect(() => {
    if (!dataFlowId || !ctx) return;
    const ref = open ? expandedRef : collapsedRef;
    ctx.registerSource(dataFlowId, ref, {
      label: dataFlowLabel ?? title,
      value: dataFlowValue ?? 0,
      items: dataFlowItems,
    });
    return () => ctx.unregisterSource(dataFlowId);
  }, [dataFlowId, dataFlowLabel, dataFlowValue, dataFlowItems, title, open, ctx]);

  if (!open) {
    return (
      <button
        type="button"
        ref={collapsedRef}
        id={id}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:bg-white/10 scroll-mt-16"
        aria-expanded={false}
        data-dataflow-source={dataFlowId}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true">{icon}</span>
          <h2 className="text-base font-semibold text-slate-200">{title}</h2>
          {summary && (
            <span className="ml-2 text-sm text-slate-500 truncate">{summary}</span>
          )}
        </div>
        <svg
          className="h-4 w-4 flex-shrink-0 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div ref={expandedRef} id={id} className="relative scroll-mt-16" data-dataflow-source={dataFlowId}>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-3 z-10 rounded-md p-1 text-slate-500 transition-colors duration-150 hover:bg-white/10 hover:text-slate-300"
        aria-expanded={true}
        aria-label={`Collapse ${title}`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      {children}
    </div>
  );
}

function formatCurrencySummary(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(0)}k`;
  return `$${amount.toFixed(0)}`;
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>(INITIAL_STATE.assets);
  const [debts, setDebts] = useState<Debt[]>(INITIAL_STATE.debts);
  const [properties, setProperties] = useState<Property[]>(INITIAL_STATE.properties);
  const [stocks, setStocks] = useState<StockHolding[]>(INITIAL_STATE.stocks);
  const [income, setIncome] = useState<IncomeItem[]>(INITIAL_STATE.income);
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_STATE.expenses);
  const [country, setCountry] = useState<"CA" | "US">(INITIAL_STATE.country ?? "CA");
  const [jurisdiction, setJurisdiction] = useState<string>(INITIAL_STATE.jurisdiction ?? "ON");
  const [age, setAge] = useState<number | undefined>(INITIAL_STATE.age);
  const [federalTaxOverride, setFederalTaxOverride] = useState<number | undefined>(undefined);
  const [provincialTaxOverride, setProvincialTaxOverride] = useState<number | undefined>(undefined);
  const [surplusTargetComputedId, setSurplusTargetComputedId] = useState<string | undefined>(undefined);
  const [fxManualOverride, setFxManualOverride] = useState<number | undefined>(undefined);
  const [fxRates, setFxRates] = useState<FxRates | undefined>(undefined);
  const [showSampleProfiles, setShowSampleProfiles] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [safeWithdrawalRate, setSafeWithdrawalRate] = useState(4);
  const isFirstRender = useRef(true);

  // Restore state from URL after hydration; show sample profiles if no URL state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSafeWithdrawalRate(getSwrFromURL());
    const urlState = getStateFromURL();
    if (urlState) {
      setAssets(urlState.assets);
      setDebts(urlState.debts);
      setProperties(urlState.properties);
      setStocks(urlState.stocks);
      setIncome(urlState.income);
      setExpenses(urlState.expenses);
      if (urlState.country) setCountry(urlState.country);
      if (urlState.jurisdiction) setJurisdiction(urlState.jurisdiction);
      if (urlState.age !== undefined) setAge(urlState.age);
      setFederalTaxOverride(urlState.federalTaxOverride);
      setProvincialTaxOverride(urlState.provincialTaxOverride);
      setSurplusTargetComputedId(urlState.surplusTargetComputedId);
      setFxManualOverride(urlState.fxManualOverride);
    } else {
      // No saved state — show sample profile picker for new visitors
      setShowSampleProfiles(true);
      // Show mobile wizard for new users on mobile viewports (< 768px)
      try {
        const wizardDone = localStorage.getItem("fhs-wizard-done");
        if (!wizardDone && window.innerWidth < 768) {
          setShowWizard(true);
        }
      } catch {
        // localStorage unavailable (private browsing, test environment, etc.)
      }
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Fetch live FX rates on mount and when country changes (skip if manual override is set)
  useEffect(() => {
    if (fxManualOverride !== undefined && fxManualOverride > 0) return;
    const homeCurrency = getHomeCurrency(country);
    const foreignCurrency = getForeignCurrency(homeCurrency);
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/fx-rate?from=${foreignCurrency}&to=${homeCurrency}`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        const rate = data.rate as number;
        setFxRates({
          [fxPairKey(foreignCurrency, homeCurrency)]: rate,
          [fxPairKey(homeCurrency, foreignCurrency)]: 1 / rate,
        });
      } catch {
        // Silently fall back to hardcoded rates
      }
    })();
    return () => { cancelled = true; };
  }, [country, fxManualOverride]);

  // Update URL whenever state changes (skip initial render to keep URL clean with defaults)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    updateURL({ assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxManualOverride });
  }, [assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxManualOverride]);

  // Sync computed assets for stocks and property equity (auto-update amounts, preserve ROI & surplusTarget)
  const syncComputedAssets = useCallback(() => {
    const totalStockValue = stocks.reduce((sum, s) => sum + getStockValue(s), 0);
    const totalEquity = properties.reduce((sum, p) => sum + Math.max(0, p.value - p.mortgage), 0);

    setAssets((prev) => {
      let next = [...prev];
      const stocksIdx = next.findIndex((a) => a.id === "_computed_stocks");

      if (totalStockValue > 0) {
        const existing = stocksIdx >= 0 ? next[stocksIdx] : undefined;
        const isSurplusTarget = existing?.surplusTarget || surplusTargetComputedId === "_computed_stocks";
        const entry: Asset = { id: "_computed_stocks", category: "Stocks & Equity", amount: totalStockValue, computed: true as const, roi: existing?.roi, surplusTarget: isSurplusTarget || undefined };
        if (stocksIdx >= 0) next[stocksIdx] = entry;
        else next = [entry, ...next];
      } else if (stocksIdx >= 0) {
        next.splice(stocksIdx, 1);
      }

      const equityIdxAfter = next.findIndex((a) => a.id === "_computed_equity");
      if (totalEquity > 0) {
        const existing = equityIdxAfter >= 0 ? next[equityIdxAfter] : undefined;
        const isSurplusTarget = existing?.surplusTarget || surplusTargetComputedId === "_computed_equity";
        const entry: Asset = { id: "_computed_equity", category: "Property Equity", amount: totalEquity, computed: true as const, roi: existing?.roi, surplusTarget: isSurplusTarget || undefined };
        if (equityIdxAfter >= 0) next[equityIdxAfter] = entry;
        else {
          const insertIdx = next.findIndex((a) => a.id === "_computed_stocks") >= 0 ? 1 : 0;
          next.splice(insertIdx, 0, entry);
        }
      } else if (equityIdxAfter >= 0) {
        next.splice(equityIdxAfter, 1);
      }

      // If a computed asset is the surplus target, clear it from real assets
      const computedHasSurplus = next.some((a) => a.computed && a.surplusTarget);
      if (computedHasSurplus) {
        next = next.map((a) => a.computed ? a : { ...a, surplusTarget: false });
      }

      return next;
    });
  }, [stocks, properties, surplusTargetComputedId]);

  // Sync on stocks/properties change
  useEffect(() => {
    syncComputedAssets();
  }, [syncComputedAssets]);

  // Wrap setAssets to track surplus target on computed assets
  const handleAssetsChange = useCallback((newAssets: Asset[]) => {
    setAssets(newAssets);
    const computedSurplus = newAssets.find((a) => a.computed && a.surplusTarget);
    setSurplusTargetComputedId(computedSurplus?.id);
  }, []);

  const loadProfile = useCallback((profile: SampleProfile) => {
    const s = profile.state;
    setAssets(s.assets);
    setDebts(s.debts);
    setIncome(s.income);
    setExpenses(s.expenses);
    setProperties(s.properties);
    setStocks(s.stocks);
    if (s.country) setCountry(s.country);
    if (s.jurisdiction) setJurisdiction(s.jurisdiction);
    if (s.age !== undefined) setAge(s.age);
    setFederalTaxOverride(undefined);
    setProvincialTaxOverride(undefined);
    setSurplusTargetComputedId(undefined);
    setFxManualOverride(undefined);
    setShowSampleProfiles(false);
  }, []);

  const clearAll = useCallback(() => {
    setAssets([]);
    setDebts([]);
    setIncome([]);
    setExpenses([]);
    setProperties([]);
    setStocks([]);
    setFederalTaxOverride(undefined);
    setProvincialTaxOverride(undefined);
    setSurplusTargetComputedId(undefined);
    setFxManualOverride(undefined);
    setShowSampleProfiles(false);
  }, []);

  const handleWizardComplete = useCallback((result: WizardResult) => {
    setAssets(result.assets);
    setDebts(result.debts);
    setIncome(result.income);
    setExpenses(result.expenses);
    setShowWizard(false);
    setShowSampleProfiles(false);
  }, []);

  const handleWizardSkip = useCallback(() => {
    setShowWizard(false);
  }, []);

  const handleSwrChange = useCallback((rate: number) => {
    setSafeWithdrawalRate(rate);
    updateSwrURL(rate);
  }, []);

  const homeCurrency = getHomeCurrency(country);
  const foreignCurrency = getForeignCurrency(homeCurrency);
  const effectiveFxRates = getEffectiveFxRates(homeCurrency, fxManualOverride, fxRates);
  const state = { assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxRates: effectiveFxRates, fxManualOverride };
  const metrics = computeMetrics(state);
  const runwayDetails = metrics.find(m => m.title === "Financial Runway")?.runwayDetails;
  const financialData = toFinancialData(state);
  const totals = computeTotals(state);
  const totalInvestmentContributions = assets.filter((a) => !a.computed).reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);
  const totalMortgagePayments = totals.totalMortgagePayments;
  const monthlyInvestmentReturns = computeMonthlyInvestmentReturns(assets);
  const totalMonthlyInvestmentReturns = monthlyInvestmentReturns.reduce((sum, r) => sum + r.amount, 0);
  const monthlySurplus = totals.monthlyAfterTaxIncome + totalMonthlyInvestmentReturns - totals.monthlyExpenses - totals.totalMonthlyContributions - totalMortgagePayments;
  const annualEmploymentSalary = income.reduce((sum, i) => {
    if ((i.incomeType ?? "employment") !== "employment") return sum;
    return sum + normalizeToMonthly(i.amount, i.frequency) * 12;
  }, 0);
  const realAssets = assets.filter((a) => !a.computed);
  const surplusTargetName = realAssets.find((a) => a.surplusTarget)?.category ?? realAssets[0]?.category;

  // Summaries for collapsed sections — use converted totals from computeTotals
  const assetTotal = totals.totalAssets;
  const debtTotal = totals.totalDebts;
  const incomeTotal = totals.monthlyIncome;
  const expenseTotal = totals.monthlyExpenses;
  const propertyCount = properties.length;
  const stockCount = stocks.length;

  // Build item-level data for source summary cards in explainer modal
  const assetItems: SourceMetadataItem[] = assets.filter((a) => !a.computed).map((a) => ({ label: a.category, value: a.amount, currency: a.currency }));
  const debtItems: SourceMetadataItem[] = debts.map((d) => ({ label: d.category, value: d.amount, currency: d.currency }));
  const incomeItems: SourceMetadataItem[] = [
    ...income.map((i) => ({ label: i.category, value: i.amount })),
    ...monthlyInvestmentReturns.map((r) => ({ label: `${r.label} returns`, value: Math.round(r.amount) })),
  ];
  const expenseItems: SourceMetadataItem[] = expenses.map((e) => ({ label: e.category, value: e.amount }));
  const propertyItems: SourceMetadataItem[] = properties.map((p) => ({ label: p.name, value: Math.max(0, p.value - p.mortgage), currency: p.currency }));
  const stockItems: SourceMetadataItem[] = stocks.map((s) => ({ label: s.ticker, value: getStockValue(s) }));

  // Data-flow connections for metric cards
  const fmtLabel = (v: number) => {
    const sign = v >= 0 ? "+" : "-";
    return `${sign}${formatCurrencyCompact(Math.abs(v), homeCurrency, homeCurrency)}`;
  };

  const netWorthConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" },
    ...(totals.totalPropertyEquity > 0 ? [{ sourceId: "section-property", label: fmtLabel(totals.totalPropertyEquity), value: totals.totalPropertyEquity, sign: "positive" as const }] : []),
    { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
  ];

  const incomeAndReturnsTotal = totals.monthlyAfterTaxIncome + totalMonthlyInvestmentReturns;

  // Compute mortgage principal/interest breakdown for explainer
  const mortgageItems: { label: string; value: number }[] = [];
  if (totalMortgagePayments > 0) {
    let totalInterest = 0;
    let totalPrincipal = 0;
    for (const prop of properties) {
      if (prop.mortgage > 0 && prop.monthlyPayment && prop.monthlyPayment > 0) {
        const rate = prop.interestRate ?? DEFAULT_INTEREST_RATE;
        const { interestPortion, principalPortion } = computeMortgageBreakdown(prop.mortgage, rate, prop.monthlyPayment);
        totalInterest += interestPortion;
        totalPrincipal += principalPortion;
      }
    }
    if (totalInterest > 0) mortgageItems.push({ label: "Interest", value: Math.round(totalInterest) });
    if (totalPrincipal > 0) mortgageItems.push({ label: "Principal", value: Math.round(totalPrincipal) });
  }

  const monthlySurplusConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: fmtLabel(incomeAndReturnsTotal), value: incomeAndReturnsTotal, sign: "positive" },
    { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ...(totals.totalMonthlyContributions > 0 ? [{ sourceId: "virtual-contributions", label: `contributions ${fmtLabel(-totals.totalMonthlyContributions)}`, value: totals.totalMonthlyContributions, sign: "negative" as const }] : []),
    ...(totalMortgagePayments > 0 ? [{ sourceId: "virtual-mortgage", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const, items: mortgageItems.length > 0 ? mortgageItems : undefined }] : []),
  ];

  // Estimated Tax: green arrow from income showing gross income, label with effective rate + annual tax
  const estimatedTaxConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: totals.effectiveTaxRate > 0 ? `${(totals.effectiveTaxRate * 100).toFixed(1)}% of ${fmtLabel(totals.monthlyIncome * 12).replace(/^[+-]/, "")}` : fmtLabel(totals.monthlyIncome * 12), value: totals.monthlyIncome, sign: "positive" },
  ];

  // Financial Runway: liquid assets (green) / monthly obligations (red)
  const financialRunwayConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" },
    { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ...(totalMortgagePayments > 0 ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const }] : []),
  ];

  // Debt-to-Asset Ratio: all assets (green) vs all debts (red)
  const debtToAssetConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" },
    ...(totals.totalPropertyValue > 0 ? [{ sourceId: "section-property", label: `value ${fmtLabel(totals.totalPropertyValue)}`, value: totals.totalPropertyValue, sign: "positive" as const }] : []),
    { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
    ...(totals.totalPropertyMortgage > 0 ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totals.totalPropertyMortgage)}`, value: totals.totalPropertyMortgage, sign: "negative" as const }] : []),
  ];

  // Income Replacement: invested assets (green) driving the 4% withdrawal
  const incomeReplacementConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" as const },
    ...(totals.totalStocks > 0 ? [{ sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" as const }] : []),
  ].filter((c) => c.value > 0);

  const dataFlowConnections: Record<string, DataFlowConnectionDef[]> = {
    "Net Worth": netWorthConnections,
    "Monthly Surplus": monthlySurplusConnections,
    "Estimated Tax": estimatedTaxConnections,
    "Financial Runway": financialRunwayConnections,
    "Debt-to-Asset Ratio": debtToAssetConnections,
    "Income Replacement": incomeReplacementConnections,
  };

  // Insight-type data-flow connections (keyed by InsightType)
  const insightConnections: Record<string, DataFlowConnectionDef[]> = {
    "runway": [
      { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
      { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ],
    "surplus": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyAfterTaxIncome), value: totals.monthlyAfterTaxIncome, sign: "positive" },
      { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ],
    "net-worth": [
      { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
      { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
    ],
    "savings-rate": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyAfterTaxIncome), value: totals.monthlyAfterTaxIncome, sign: "positive" },
      { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ],
    "debt-interest": [
      { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
    ],
    "tax": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyIncome * 12), value: totals.monthlyIncome, sign: "positive" },
    ],
    "withdrawal-tax": [
      { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    ],
  };

  // Benchmark comparison values
  const benchmarkNetWorth = totals.totalAssets + totals.totalStocks + totals.totalPropertyEquity - totals.totalDebts;
  // Savings rate includes surplus + investment contributions (which are a form of saving)
  const benchmarkSavingsRate = totals.monthlyAfterTaxIncome > 0 ? (monthlySurplus + totals.totalMonthlyContributions) / totals.monthlyAfterTaxIncome : 0;
  const benchmarkMonthlyObligations = totals.monthlyExpenses + totals.totalMortgagePayments;
  const benchmarkEmergencyMonths = benchmarkMonthlyObligations > 0 ? (totals.totalAssets + totals.totalStocks) / benchmarkMonthlyObligations : 0;
  const annualIncome = totals.monthlyIncome * 12;
  const benchmarkDebtToIncome = annualIncome > 0 ? (debtTotal + totals.totalPropertyMortgage) / annualIncome : 0;

  return (
    <CurrencyProvider currency={homeCurrency}>
    <DataFlowProvider homeCurrency={homeCurrency}>
    {/* Mobile guided wizard — full-screen for new mobile users */}
    {showWizard && (
      <MobileWizard
        country={country}
        onComplete={handleWizardComplete}
        onSkip={handleWizardSkip}
      />
    )}
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <div className="mx-auto max-w-7xl space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white sm:text-2xl">
                Financial Health Snapshot
              </h1>
              <p className="text-xs text-slate-400 sm:text-sm">
                Your finances at a glance — no judgment, just clarity
                <span className="mx-1.5 text-slate-600">·</span>
                <a
                  href="/changelog"
                  className="text-violet-400 transition-colors duration-200 hover:text-violet-300 hover:underline"
                >
                  Changelog
                </a>
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2 print:hidden">
              <CopyLinkButton />
              <PrintSnapshotButton />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
            <CountryJurisdictionSelector
              country={country}
              jurisdiction={jurisdiction}
              onCountryChange={setCountry}
              onJurisdictionChange={setJurisdiction}
            />
            <AgeInputHeader age={age} onAgeChange={setAge} />
            <FxRateDisplay
              homeCurrency={homeCurrency}
              foreignCurrency={foreignCurrency}
              fxRates={effectiveFxRates}
              fxManualOverride={fxManualOverride}
              onManualOverrideChange={setFxManualOverride}
            />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-sm shadow-sm print:hidden">
        <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6">
          <div className="flex items-center gap-1 py-1.5 text-sm">
            {[
              { id: "projections", icon: "📈", label: "Projections" },
              { id: "assets", icon: "💰", label: "Assets" },
              { id: "debts", icon: "💳", label: "Debts" },
              { id: "income", icon: "💵", label: "Income" },
              { id: "expenses", icon: "🧾", label: "Expenses" },
              { id: "property", icon: "🏠", label: "Property" },
              { id: "stocks", icon: "📊", label: "Stocks" },
              { id: "dashboard", icon: "🎯", label: "Dashboard" },
              { id: "scenarios", icon: "🔮", label: "What If" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="flex-shrink-0 rounded-md px-2.5 py-1.5 font-medium text-slate-400 transition-all duration-150 hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 active:scale-95"
              >
                <span aria-hidden="true" className="mr-1">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Welcome explainer for first-time visitors */}
        <WelcomeBanner />

        {/* Sample profile picker for new visitors (no URL state) */}
        {showSampleProfiles && (
          <div className="mb-6 rounded-xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/10 to-emerald-400/5 px-4 py-5 shadow-sm sm:px-6 print:hidden backdrop-blur-sm" data-testid="sample-profiles-banner">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-slate-200 sm:text-lg">Start with a sample profile</h2>
                <p className="mt-0.5 text-sm text-slate-400">See how the tool works with realistic numbers, then edit to match your own.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowSampleProfiles(false)}
                className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                aria-label="Dismiss sample profiles"
                data-testid="sample-profiles-dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {getProfilesForCountry(country).map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => loadProfile(profile)}
                  className="group flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4 text-left shadow-sm transition-all duration-200 hover:border-cyan-400/40 hover:bg-white/10 hover:shadow-md hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 active:scale-95"
                  data-testid={`sample-profile-${profile.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl" aria-hidden="true">{profile.emoji}</span>
                    <span className="font-semibold text-slate-200 text-sm leading-tight group-hover:text-cyan-400 transition-colors duration-150">{profile.name}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{profile.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {profile.highlights.map((h) => (
                      <span key={h} className="rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-300 border border-cyan-400/20">{h}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">Or enter your own numbers directly in the sections below.</p>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-400 shadow-sm transition-all duration-150 hover:border-white/20 hover:text-slate-200 hover:shadow focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900 active:scale-95"
                data-testid="clear-all-button"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Projection Chart — full-width above the two-column layout */}
        <section id="projections" className="mb-6 space-y-4 scroll-mt-16" aria-label="Financial projections">
          <ZoomableCard><ProjectionChart state={state} runwayDetails={runwayDetails ?? undefined} safeWithdrawalRate={safeWithdrawalRate} /></ZoomableCard>
          <InsightsPanel data={financialData} insightConnections={insightConnections} />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Entry Panel — left side on desktop, top on mobile */}
          <section
            className="lg:col-span-7 print:hidden"
            aria-label="Financial data entry"
            data-testid="entry-panel"
          >
            <div className="space-y-3">
              <CollapsibleSection id="assets" title="Assets" icon="💰" summary={formatCurrencySummary(assetTotal)} dataFlowId="section-assets" dataFlowValue={assetTotal} dataFlowLabel="Assets" dataFlowItems={assetItems}>
                <AssetEntry items={assets} onChange={handleAssetsChange} monthlySurplus={monthlySurplus} homeCurrency={homeCurrency} fxRates={effectiveFxRates} annualEmploymentSalary={annualEmploymentSalary} />
              </CollapsibleSection>

              <CollapsibleSection id="debts" title="Debts" icon="💳" summary={debtTotal > 0 ? formatCurrencySummary(debtTotal) : "None"} dataFlowId="section-debts" dataFlowValue={debtTotal} dataFlowLabel="Debts" dataFlowItems={debtItems}>
                <DebtEntry items={debts} onChange={setDebts} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="income" title="Income" icon="💵" summary={formatCurrencySummary(incomeTotal)} dataFlowId="section-income" dataFlowValue={incomeTotal + totalMonthlyInvestmentReturns} dataFlowLabel="Income & Returns" dataFlowItems={incomeItems}>
                <IncomeEntry items={income} onChange={setIncome} investmentReturns={monthlyInvestmentReturns} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="expenses" title="Expenses" icon="🧾" summary={formatCurrencySummary(expenseTotal)} dataFlowId="section-expenses" dataFlowValue={expenseTotal} dataFlowLabel="Expenses" dataFlowItems={expenseItems}>
                <ExpenseEntry items={expenses} onChange={setExpenses} investmentContributions={totalInvestmentContributions} mortgagePayments={totalMortgagePayments} surplus={monthlySurplus} surplusTargetName={surplusTargetName} federalTax={totals.totalFederalTax / 12} provincialStateTax={totals.totalProvincialStateTax / 12} computedFederalTax={totals.computedFederalTax / 12} computedProvincialStateTax={totals.computedProvincialStateTax / 12} federalTaxOverride={federalTaxOverride !== undefined ? federalTaxOverride / 12 : undefined} provincialTaxOverride={provincialTaxOverride !== undefined ? provincialTaxOverride / 12 : undefined} onFederalTaxOverride={(monthly) => setFederalTaxOverride(monthly !== undefined ? monthly * 12 : undefined)} onProvincialTaxOverride={(monthly) => setProvincialTaxOverride(monthly !== undefined ? monthly * 12 : undefined)} country={country} isUnderwater={monthlySurplus < 0} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="property" title="Property" icon="🏠" summary={propertyCount > 0 ? `${propertyCount} propert${propertyCount !== 1 ? "ies" : "y"}` : "None"} dataFlowId="section-property" dataFlowValue={totals.totalPropertyEquity} dataFlowLabel="Property" dataFlowItems={propertyItems}>
                <PropertyEntry items={properties} onChange={setProperties} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="stocks" title="Stocks" icon="📊" summary={stockCount > 0 ? `${stockCount} holding${stockCount !== 1 ? "s" : ""}` : "None"} dataFlowId="section-stocks" dataFlowValue={totals.totalStocks} dataFlowLabel="Stocks" dataFlowItems={stockItems}>
                <StockEntry items={stocks} onChange={setStocks} />
              </CollapsibleSection>
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            id="dashboard"
            className="lg:col-span-5 scroll-mt-16 print:col-span-full"
            data-testid="dashboard-panel"
            aria-label="Financial dashboard"
          >
            <div className="lg:sticky lg:top-8 overflow-visible space-y-6">
              <SnapshotDashboard metrics={metrics} financialData={financialData} homeCurrency={homeCurrency} dataFlowConnections={dataFlowConnections} />
              {stocks.length > 0 && (() => {
                const portfolio = getPortfolioSummary(stocks);
                const stocksWithReturns = stocks
                  .map((s) => ({ ticker: s.ticker, annualized: getAnnualizedReturn(s) }))
                  .filter((s) => s.annualized !== null) as { ticker: string; annualized: number }[];
                return (
                  <ZoomableCard><div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-white/20 hover:-translate-y-0.5" data-testid="portfolio-performance">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-400">Portfolio Performance</h3>
                      <span className="text-lg" aria-hidden="true">📊</span>
                    </div>
                    <p className={`mt-1.5 text-3xl font-bold ${portfolio.totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {portfolio.totalGainLoss >= 0 ? "+" : "-"}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.abs(portfolio.totalGainLoss))}
                    </p>
                    {portfolio.totalCostBasis > 0 && (
                      <p className="mt-0.5 text-sm text-slate-400" data-testid="portfolio-return-pct">
                        {portfolio.overallReturnPct >= 0 ? "+" : ""}{portfolio.overallReturnPct.toFixed(1)}% overall return
                      </p>
                    )}
                    {stocksWithReturns.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {stocksWithReturns.map((s) => (
                          <p key={s.ticker} className="text-xs text-slate-500">
                            <span className="font-mono font-medium text-slate-400">{s.ticker}</span>{" "}
                            <span className={s.annualized >= 0 ? "text-emerald-400" : "text-rose-400"}>
                              {s.annualized >= 0 ? "+" : ""}{s.annualized.toFixed(1)}%/yr
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Total gain/loss across your stock holdings based on cost basis. Annualized returns shown for holdings with purchase dates.
                    </p>
                  </div></ZoomableCard>
                );
              })()}
              <ZoomableCard><ExpenseBreakdownChart
                expenses={expenses}
                investmentContributions={totalInvestmentContributions}
                mortgagePayments={totalMortgagePayments}
                federalTax={totals.totalFederalTax / 12}
                provincialStateTax={totals.totalProvincialStateTax / 12}
                monthlyAfterTaxIncome={totals.monthlyAfterTaxIncome}
                monthlyGrossIncome={totals.monthlyIncome}
              /></ZoomableCard>
              <ZoomableCard><NetWorthDonutChart
                assets={assets}
                debts={debts}
                properties={properties}
                stocks={stocks}
              /></ZoomableCard>
              <ZoomableCard><CashFlowSankey
                income={income}
                expenses={expenses}
                investmentContributions={totalInvestmentContributions}
                mortgagePayments={totalMortgagePayments}
                monthlyFederalTax={totals.totalFederalTax / 12}
                monthlyProvincialTax={totals.totalProvincialStateTax / 12}
                monthlySurplus={monthlySurplus}
                investmentReturns={monthlyInvestmentReturns
                  .filter((r) => {
                    const asset = assets.find((a) => a.category === r.label);
                    if (!asset) return false;
                    const treatment = asset.roiTaxTreatment ?? getDefaultRoiTaxTreatment(asset.category);
                    return treatment === "income";
                  })
                  .map((r) => ({ label: r.label, monthlyAmount: r.amount }))}
              /></ZoomableCard>
              <ZoomableCard><BenchmarkComparisons
                age={age}
                country={country}
                netWorth={benchmarkNetWorth}
                savingsRate={benchmarkSavingsRate}
                emergencyMonths={benchmarkEmergencyMonths}
                debtToIncomeRatio={benchmarkDebtToIncome}
                annualIncome={annualIncome}
                onAgeChange={setAge}
              /></ZoomableCard>
            </div>
          </section>
        </div>

        {/* What If scenario panel — full-width at the bottom */}
        <section id="scenarios" className="mt-8 scroll-mt-16 print:hidden" aria-label="Scenario modeling">
          <FastForwardPanel state={state} safeWithdrawalRate={safeWithdrawalRate} onSwrChange={handleSwrChange} />
        </section>

        <PrintFooter />
      </main>
    </div>
    </DataFlowProvider>
    </CurrencyProvider>
  );
}
