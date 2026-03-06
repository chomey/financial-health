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
import AssetAllocationChart from "@/components/AssetAllocationChart";
import ExpenseBreakdownChart from "@/components/ExpenseBreakdownChart";
import NetWorthWaterfallChart from "@/components/NetWorthWaterfallChart";
import FastForwardPanel from "@/components/FastForwardPanel";
import BenchmarkComparisons from "@/components/BenchmarkComparisons";
import CashFlowSankey from "@/components/CashFlowSankey";
import FxRateDisplay from "@/components/FxRateDisplay";
import WithdrawalTaxSummary from "@/components/WithdrawalTaxSummary";
import InsightsPanel from "@/components/InsightsPanel";
import ZoomableCard from "@/components/ZoomableCard";
import { DataFlowProvider, useOptionalDataFlow } from "@/components/DataFlowArrows";
import {
  INITIAL_STATE,
  computeMetrics,
  computeTotals,
  toFinancialData,
} from "@/lib/financial-state";
import { getStateFromURL, updateURL } from "@/lib/url-state";
import { getHomeCurrency, getForeignCurrency, getEffectiveFxRates, fxPairKey } from "@/lib/currency";
import type { FxRates, SupportedCurrency } from "@/lib/currency";
import type { Asset } from "@/components/AssetEntry";
import type { Debt } from "@/components/DebtEntry";
import type { Property } from "@/components/PropertyEntry";
import type { StockHolding } from "@/components/StockEntry";
import { getPortfolioSummary, getAnnualizedReturn } from "@/components/StockEntry";
import type { IncomeItem } from "@/components/IncomeEntry";
import type { ExpenseItem } from "@/components/ExpenseEntry";

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
      className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 shadow-sm transition-all duration-200 hover:border-stone-300 hover:bg-stone-50 hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 active:scale-95"
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
          <span className="text-emerald-600">Copied!</span>
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

function WelcomeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative mb-6 rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-sky-50 px-4 py-4 shadow-sm sm:px-6 sm:py-5">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 rounded-md p-1 text-stone-400 transition-colors hover:bg-white/60 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        aria-label="Dismiss welcome message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
      <h2 className="mb-2 text-base font-semibold text-stone-800 sm:text-lg">
        Welcome! Here&apos;s how this works
      </h2>
      <div className="space-y-2 text-sm leading-relaxed text-stone-600">
        <p>
          This is a simple tool to help you see your <strong>full financial picture in one place</strong>. Just fill in some rough numbers for your savings, debts, income, and expenses — it doesn&apos;t need to be exact.
        </p>
        <p>
          You&apos;ll get a snapshot of where you stand, plus a projection of how things could look in 10, 20, or 30 years.
        </p>
        <div className="mt-3 rounded-lg bg-white/60 px-3 py-2.5 text-xs text-stone-500 sm:text-sm">
          <strong className="text-stone-700">Your privacy is fully protected.</strong> Nothing you enter is stored on any server or sent anywhere. All your data stays right here in your browser. The numbers are saved in the page link itself — so you can bookmark it or share it, but nobody can see your information unless you give them that link.
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
    });
    return () => ctx.unregisterSource(dataFlowId);
  }, [dataFlowId, dataFlowLabel, dataFlowValue, title, open, ctx]);

  if (!open) {
    return (
      <button
        type="button"
        ref={collapsedRef}
        id={id}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-stone-200 bg-white px-4 py-3 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:bg-stone-50 scroll-mt-16"
        aria-expanded={false}
        data-dataflow-source={dataFlowId}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true">{icon}</span>
          <h2 className="text-base font-semibold text-stone-800">{title}</h2>
          {summary && (
            <span className="ml-2 text-sm text-stone-400 truncate">{summary}</span>
          )}
        </div>
        <svg
          className="h-4 w-4 flex-shrink-0 text-stone-400"
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
        className="absolute right-3 top-3 z-10 rounded-md p-1 text-stone-400 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600"
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
  const isFirstRender = useRef(true);

  // Restore state from URL after hydration
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
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

  const homeCurrency = getHomeCurrency(country);
  const foreignCurrency = getForeignCurrency(homeCurrency);
  const effectiveFxRates = getEffectiveFxRates(homeCurrency, fxManualOverride, fxRates);
  const state = { assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxRates: effectiveFxRates, fxManualOverride };
  const metrics = computeMetrics(state);
  const financialData = toFinancialData(state);
  const totals = computeTotals(state);
  const totalInvestmentContributions = assets.filter((a) => !a.computed).reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);
  const totalMortgagePayments = totals.totalMortgagePayments;
  const monthlySurplus = totals.monthlyAfterTaxIncome - totals.monthlyExpenses - totals.totalMonthlyContributions - totalMortgagePayments;
  const realAssets = assets.filter((a) => !a.computed);
  const surplusTargetName = realAssets.find((a) => a.surplusTarget)?.category ?? realAssets[0]?.category;

  // Summaries for collapsed sections
  const assetTotal = assets.filter((a) => !a.computed).reduce((sum, a) => sum + a.amount, 0);
  const debtTotal = debts.reduce((sum, d) => sum + d.amount, 0);
  const incomeTotal = income.reduce((sum, i) => sum + i.amount, 0);
  const expenseTotal = expenses.reduce((sum, e) => sum + e.amount, 0);
  const propertyCount = properties.length;
  const stockCount = stocks.length;

  // Data-flow connections for metric cards
  const fmtLabel = (v: number) => {
    const sign = v >= 0 ? "+" : "-";
    const abs = Math.abs(v);
    const formatted = abs >= 1000
      ? `$${(abs / 1000).toFixed(abs >= 10000 ? 0 : 1)}k`
      : `$${abs.toFixed(0)}`;
    return `${sign}${formatted}`;
  };

  const netWorthConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" },
    ...(totals.totalPropertyEquity > 0 ? [{ sourceId: "section-property", label: fmtLabel(totals.totalPropertyEquity), value: totals.totalPropertyEquity, sign: "positive" as const }] : []),
    { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
  ];

  const monthlySurplusConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: fmtLabel(totals.monthlyAfterTaxIncome), value: totals.monthlyAfterTaxIncome, sign: "positive" },
    { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" },
    ...(totals.totalMonthlyContributions > 0 ? [{ sourceId: "section-assets", label: `contributions ${fmtLabel(-totals.totalMonthlyContributions)}`, value: totals.totalMonthlyContributions, sign: "negative" as const }] : []),
    ...(totalMortgagePayments > 0 ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const }] : []),
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

  const dataFlowConnections: Record<string, DataFlowConnectionDef[]> = {
    "Net Worth": netWorthConnections,
    "Monthly Surplus": monthlySurplusConnections,
    "Estimated Tax": estimatedTaxConnections,
    "Financial Runway": financialRunwayConnections,
    "Debt-to-Asset Ratio": debtToAssetConnections,
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
    <DataFlowProvider>
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-4 py-3 shadow-sm sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-stone-900 sm:text-2xl">
              Financial Health Snapshot
            </h1>
            <p className="text-xs text-stone-500 sm:text-sm">
              Your finances at a glance — no judgment, just clarity
              <span className="mx-1.5 text-stone-300">·</span>
              <a
                href="/changelog"
                className="text-blue-500 transition-colors duration-200 hover:text-blue-700 hover:underline"
              >
                Changelog
              </a>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CountryJurisdictionSelector
              country={country}
              jurisdiction={jurisdiction}
              onCountryChange={setCountry}
              onJurisdictionChange={setJurisdiction}
            />
            <FxRateDisplay
              homeCurrency={homeCurrency}
              foreignCurrency={foreignCurrency}
              fxRates={effectiveFxRates}
              fxManualOverride={fxManualOverride}
              onManualOverrideChange={setFxManualOverride}
            />
            <CopyLinkButton />
          </div>
        </div>
      </header>

      <nav className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur-sm shadow-sm">
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
                className="flex-shrink-0 rounded-md px-2.5 py-1.5 font-medium text-stone-500 transition-all duration-150 hover:bg-stone-100 hover:text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-95"
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

        {/* Projection Chart — full-width above the two-column layout */}
        <section id="projections" className="mb-6 space-y-4 scroll-mt-16" aria-label="Financial projections">
          <ZoomableCard><ProjectionChart state={state} /></ZoomableCard>
          <InsightsPanel data={financialData} insightConnections={insightConnections} />
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Entry Panel — left side on desktop, top on mobile */}
          <section
            className="lg:col-span-7"
            aria-label="Financial data entry"
          >
            <div className="space-y-3">
              <CollapsibleSection id="assets" title="Assets" icon="💰" summary={formatCurrencySummary(assetTotal)} dataFlowId="section-assets" dataFlowValue={assetTotal} dataFlowLabel="Assets">
                <AssetEntry items={assets} onChange={handleAssetsChange} monthlySurplus={monthlySurplus} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="debts" title="Debts" icon="💳" summary={debtTotal > 0 ? formatCurrencySummary(debtTotal) : "None"} dataFlowId="section-debts" dataFlowValue={debtTotal} dataFlowLabel="Debts">
                <DebtEntry items={debts} onChange={setDebts} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="income" title="Income" icon="💵" summary={formatCurrencySummary(incomeTotal)} dataFlowId="section-income" dataFlowValue={incomeTotal} dataFlowLabel="Income">
                <IncomeEntry items={income} onChange={setIncome} />
              </CollapsibleSection>

              <CollapsibleSection id="expenses" title="Expenses" icon="🧾" summary={formatCurrencySummary(expenseTotal)} dataFlowId="section-expenses" dataFlowValue={expenseTotal} dataFlowLabel="Expenses">
                <ExpenseEntry items={expenses} onChange={setExpenses} investmentContributions={totalInvestmentContributions} mortgagePayments={totalMortgagePayments} surplus={monthlySurplus} surplusTargetName={surplusTargetName} federalTax={totals.totalFederalTax / 12} provincialStateTax={totals.totalProvincialStateTax / 12} computedFederalTax={totals.computedFederalTax / 12} computedProvincialStateTax={totals.computedProvincialStateTax / 12} federalTaxOverride={federalTaxOverride !== undefined ? federalTaxOverride / 12 : undefined} provincialTaxOverride={provincialTaxOverride !== undefined ? provincialTaxOverride / 12 : undefined} onFederalTaxOverride={(monthly) => setFederalTaxOverride(monthly !== undefined ? monthly * 12 : undefined)} onProvincialTaxOverride={(monthly) => setProvincialTaxOverride(monthly !== undefined ? monthly * 12 : undefined)} country={country} isUnderwater={monthlySurplus < 0} />
              </CollapsibleSection>

              <CollapsibleSection id="property" title="Property" icon="🏠" summary={propertyCount > 0 ? `${propertyCount} propert${propertyCount !== 1 ? "ies" : "y"}` : "None"} dataFlowId="section-property" dataFlowValue={totals.totalPropertyEquity} dataFlowLabel="Property">
                <PropertyEntry items={properties} onChange={setProperties} homeCurrency={homeCurrency} fxRates={effectiveFxRates} />
              </CollapsibleSection>

              <CollapsibleSection id="stocks" title="Stocks" icon="📊" summary={stockCount > 0 ? `${stockCount} holding${stockCount !== 1 ? "s" : ""}` : "None"} dataFlowId="section-stocks" dataFlowValue={totals.totalStocks} dataFlowLabel="Stocks">
                <StockEntry items={stocks} onChange={setStocks} />
              </CollapsibleSection>
            </div>
          </section>

          {/* Dashboard Panel — right side on desktop, bottom on mobile */}
          <section
            id="dashboard"
            className="lg:col-span-5 scroll-mt-16"
            aria-label="Financial dashboard"
          >
            <div className="lg:sticky lg:top-8 overflow-visible space-y-6">
              <SnapshotDashboard metrics={metrics} financialData={financialData} homeCurrency={homeCurrency} dataFlowConnections={dataFlowConnections} />
              {financialData.withdrawalTax && (
                <ZoomableCard>
                  <WithdrawalTaxSummary
                    taxDragMonths={financialData.withdrawalTax.taxDragMonths}
                    withdrawalOrder={financialData.withdrawalTax.withdrawalOrder}
                    accountsByTreatment={financialData.withdrawalTax.accountsByTreatment}
                    homeCurrency={homeCurrency}
                  />
                </ZoomableCard>
              )}
              {stocks.length > 0 && (() => {
                const portfolio = getPortfolioSummary(stocks);
                const stocksWithReturns = stocks
                  .map((s) => ({ ticker: s.ticker, annualized: getAnnualizedReturn(s) }))
                  .filter((s) => s.annualized !== null) as { ticker: string; annualized: number }[];
                return (
                  <ZoomableCard><div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5" data-testid="portfolio-performance">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-stone-500">Portfolio Performance</h3>
                      <span className="text-lg" aria-hidden="true">📊</span>
                    </div>
                    <p className={`mt-1.5 text-3xl font-bold ${portfolio.totalGainLoss >= 0 ? "text-green-600" : "text-rose-600"}`}>
                      {portfolio.totalGainLoss >= 0 ? "+" : ""}{new Intl.NumberFormat("en-US", { style: "currency", currency: homeCurrency, maximumFractionDigits: 0 }).format(portfolio.totalGainLoss)}
                    </p>
                    {portfolio.totalCostBasis > 0 && (
                      <p className="mt-0.5 text-sm text-stone-500" data-testid="portfolio-return-pct">
                        {portfolio.overallReturnPct >= 0 ? "+" : ""}{portfolio.overallReturnPct.toFixed(1)}% overall return
                      </p>
                    )}
                    {stocksWithReturns.length > 0 && (
                      <div className="mt-2 space-y-0.5">
                        {stocksWithReturns.map((s) => (
                          <p key={s.ticker} className="text-xs text-stone-400">
                            <span className="font-mono font-medium text-stone-500">{s.ticker}</span>{" "}
                            <span className={s.annualized >= 0 ? "text-green-500" : "text-rose-500"}>
                              {s.annualized >= 0 ? "+" : ""}{s.annualized.toFixed(1)}%/yr
                            </span>
                          </p>
                        ))}
                      </div>
                    )}
                    <p className="mt-1.5 text-xs text-stone-400 leading-relaxed">
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
              <ZoomableCard><AssetAllocationChart
                assets={assets}
                properties={properties}
                stocks={stocks}
              /></ZoomableCard>
              <ZoomableCard><NetWorthWaterfallChart
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
        <section id="scenarios" className="mt-8 scroll-mt-16" aria-label="Scenario modeling">
          <FastForwardPanel state={state} />
        </section>
      </main>
    </div>
    </DataFlowProvider>
  );
}
