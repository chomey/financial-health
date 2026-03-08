"use client";

// Suppress Recharts dimension warnings for collapsed/hidden chart containers
if (typeof window !== "undefined") {
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("The width(-1) and height(-1)")) return;
    origError.apply(console, args);
  };
}

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SnapshotDashboard, { type DataFlowConnectionDef } from "@/components/SnapshotDashboard";
import ProjectionChart from "@/components/ProjectionChart";
// CountryJurisdictionSelector moved to wizard-only
import ExpenseBreakdownChart from "@/components/ExpenseBreakdownChart";
import NetWorthDonutChart from "@/components/NetWorthDonutChart";
import FastForwardPanel from "@/components/FastForwardPanel";
import BenchmarkComparisons from "@/components/BenchmarkComparisons";
import CashFlowSankey from "@/components/CashFlowSankey";
// FxRateDisplay moved to wizard-only
import InsightsPanel from "@/components/InsightsPanel";
import FinancialHealthScore from "@/components/FinancialHealthScore";
import FinancialFlowchart from "@/components/FinancialFlowchart";
import ZoomableCard from "@/components/ZoomableCard";
import { DataFlowProvider } from "@/components/DataFlowArrows";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import {
  computeMetrics,
  computeTotals,
  computeMonthlyInvestmentReturns,
  toFinancialData,
} from "@/lib/financial-state";
import { getProfilesForCountry } from "@/lib/sample-profiles";
import WizardShell from "@/components/wizard/WizardShell";
import { formatCurrencyCompact } from "@/lib/currency";
import { getDefaultRoiTaxTreatment } from "@/components/AssetEntry";
import { computeMortgageBreakdown, DEFAULT_INTEREST_RATE } from "@/components/PropertyEntry";
import { getPortfolioSummary, getAnnualizedReturn, getStockValue } from "@/components/StockEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
// getFilingStatuses moved to wizard-only
import { getStepFromURL, updateStepURL, type WizardStep } from "@/lib/url-state";
import {
  PrintSnapshotButton,
  PrintFooter,
  CopyLinkButton,
  WelcomeBanner,
} from "@/app/_page-helpers";
import { useFinancialState } from "@/app/_use-financial-state";

export default function Home() {
  const {
    assets,
    debts,
    properties,
    stocks,
    income,
    expenses,
    country,
    jurisdiction,
    age,
    federalTaxOverride,
    provincialTaxOverride,
    fxManualOverride,
    taxCredits,
    filingStatus,
    taxYear,
    showSampleProfiles,
    showWizard,
    safeWithdrawalRate,
    outlookYears,
    surplusTargetComputedId,
    homeCurrency,
    foreignCurrency,
    effectiveFxRates,
    setAge,
    setJurisdiction,
    setFilingStatus,
    setTaxYear,
    setFxManualOverride,
    setShowSampleProfiles,
    setOutlookYears,
    setTaxCredits,
    setDebts,
    setIncome,
    setExpenses,
    setProperties,
    setStocks,
    setFederalTaxOverride,
    setProvincialTaxOverride,
    handleAssetsChange,
    loadProfile,
    handleCountryChange,
    clearAll,
    handleWizardComplete,
    handleWizardSkip,
    handleSwrChange,
    flowchartAcks,
    flowchartSkips,
    isRetired,
    setFlowchartAcks,
    setFlowchartSkips,
    setIsRetired,
  } = useFinancialState();

  // ── Phase routing: wizard vs dashboard ──────────────────────────────────────
  const [phase, setPhase] = useState<"wizard" | "dashboard" | null>(null);

  // ── Dashboard section definitions (for header stepper scroll-to links) ──
  const DASHBOARD_SECTIONS = useMemo(() => [
    { id: "intro", icon: "🏠", label: "Intro", shortLabel: "Intro" },
    { id: "insights", icon: "💡", label: "Insights", shortLabel: "Insights" },
    { id: "metrics", icon: "🎯", label: "Metrics", shortLabel: "Metrics" },
    { id: "roadmap", icon: "🗺️", label: "Flowchart", shortLabel: "Flow" },
    { id: "cashflow", icon: "💸", label: "Cash Flow", shortLabel: "Cash" },
    { id: "breakdowns", icon: "📉", label: "Breakdowns", shortLabel: "Charts" },
    { id: "compare", icon: "📊", label: "Compare", shortLabel: "Compare" },
    { id: "projections", icon: "📈", label: "Projections", shortLabel: "Project" },
    { id: "scenarios", icon: "🔮", label: "What If", shortLabel: "What If" },
  ] as const, []);

  // Track which section is visible for highlighting the stepper
  const [visibleSection, setVisibleSection] = useState("intro");
  useEffect(() => {
    if (phase !== "dashboard" || typeof IntersectionObserver === "undefined") return;
    const sectionIds = DASHBOARD_SECTIONS.map(s => s.id);
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setVisibleSection(entry.target.id.replace("section-dash-", ""));
        }
      }
    }, { rootMargin: "-40% 0px -55% 0px" });
    for (const id of sectionIds) {
      const el = document.getElementById(`section-dash-${id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [phase, DASHBOARD_SECTIONS]);

  useEffect(() => {
    const urlStep = getStepFromURL();
    if (urlStep && urlStep !== "dashboard") {
      setPhase("wizard");
    } else if (urlStep === "dashboard" || new URLSearchParams(window.location.search).has("s")) {
      // Explicit dashboard step or has saved state → dashboard
      setPhase("dashboard");
    } else {
      // Fresh visit with no state → wizard
      setPhase("wizard");
      updateStepURL("welcome" as WizardStep);
    }
  }, []);

  const switchToDashboard = useCallback(() => {
    updateStepURL("dashboard" as WizardStep);
    setPhase("dashboard");
    window.scrollTo(0, 0);
  }, []);

  const switchToWizard = useCallback(() => {
    updateStepURL("profile" as WizardStep);
    setPhase("wizard");
    window.scrollTo(0, 0);
  }, []);

  const state = { assets, debts, properties, stocks, income, expenses, country, jurisdiction, age, federalTaxOverride, provincialTaxOverride, surplusTargetComputedId, fxRates: effectiveFxRates, fxManualOverride, taxCredits, filingStatus, taxYear };

  // Computed values needed by both wizard and dashboard
  const totals = computeTotals(state);
  const totalInvestmentContributions = assets.filter((a) => !a.computed).reduce((sum, a) => sum + (a.monthlyContribution ?? 0), 0);
  const totalMortgagePayments = totals.totalMortgagePayments;
  const monthlyInvestmentReturns = computeMonthlyInvestmentReturns(assets);
  const payoutInvestmentReturns = monthlyInvestmentReturns.filter((r) => !r.reinvest).reduce((sum, r) => sum + r.amount, 0);
  const monthlySurplus = totals.monthlyAfterTaxIncome + payoutInvestmentReturns - totals.monthlyExpenses - totals.totalMonthlyContributions - totalMortgagePayments - totals.totalDebtPayments;
  const annualEmploymentSalary = income.reduce((sum, i) => {
    if ((i.incomeType ?? "employment") !== "employment") return sum;
    return sum + normalizeToMonthly(i.amount, i.frequency) * 12;
  }, 0);

  // Projection milestones (reported by ProjectionChart, displayed in InsightsPanel)
  const [projectionMilestones, setProjectionMilestones] = useState<import("@/components/projection/ProjectionUtils").ProjectionMilestone[]>([]);
  const milestonesRef = useRef(setProjectionMilestones);
  milestonesRef.current = setProjectionMilestones;
  const handleMilestonesChange = useCallback((m: import("@/components/projection/ProjectionUtils").ProjectionMilestone[]) => milestonesRef.current(m), []);

  // ── Render wizard phase ───────────────────────────────────────────────────
  if (phase === "wizard") {
    return (
      <CurrencyProvider currency={homeCurrency}>
      <WizardShell
        assets={assets}
        debts={debts}
        properties={properties}
        stocks={stocks}
        income={income}
        expenses={expenses}
        country={country}
        jurisdiction={jurisdiction}
        age={age}
        taxCredits={taxCredits}
        filingStatus={filingStatus}
        taxYear={taxYear}
        homeCurrency={homeCurrency}
        effectiveFxRates={effectiveFxRates}
        fxManualOverride={fxManualOverride}
        federalTaxOverride={federalTaxOverride}
        provincialTaxOverride={provincialTaxOverride}
        monthlySurplus={monthlySurplus}
        annualEmploymentSalary={annualEmploymentSalary}
        monthlyInvestmentReturns={monthlyInvestmentReturns}
        totalInvestmentContributions={totalInvestmentContributions}
        totalMortgagePayments={totalMortgagePayments}
        surplusTargetComputedId={surplusTargetComputedId}
        handleAssetsChange={handleAssetsChange}
        setDebts={setDebts}
        setProperties={setProperties}
        setStocks={setStocks}
        setIncome={setIncome}
        setExpenses={setExpenses}
        handleCountryChange={handleCountryChange}
        setJurisdiction={setJurisdiction}
        setAge={setAge}
        setTaxCredits={setTaxCredits}
        setFilingStatus={setFilingStatus}
        setTaxYear={setTaxYear}
        setFxManualOverride={setFxManualOverride}
        setFederalTaxOverride={setFederalTaxOverride}
        setProvincialTaxOverride={setProvincialTaxOverride}
        loadProfile={loadProfile}
        onFinish={switchToDashboard}
      />
      </CurrencyProvider>
    );
  }

  // ── Null during initial hydration (avoids flash) ──────────────────────────
  if (phase === null) {
    return <div className="min-h-screen bg-slate-950" />;
  }

  // ── Dashboard phase ───────────────────────────────────────────────────────
  const metrics = computeMetrics(state);
  const runwayDetails = metrics.find(m => m.title === "Financial Runway")?.runwayDetails;
  const financialData = { ...toFinancialData(state), outlookYears };
  const debtTotal = totals.totalDebts;

  // Data-flow connections for metric cards
  const fmtLabel = (v: number) => {
    const sign = v >= 0 ? "+" : "-";
    return `${sign}${formatCurrencyCompact(Math.abs(v), homeCurrency, homeCurrency)}`;
  };

  // Pre-compute per-item breakdowns for metric card click-throughs
  const realAssets = assets.filter((a) => !a.computed);
  const assetItems = realAssets.filter((a) => a.amount > 0).map((a) => ({ label: a.category, value: a.amount }));
  const stockItems = stocks.filter((s) => getStockValue(s) > 0).map((s) => ({ label: s.ticker, value: getStockValue(s) }));
  const propertyEquityItems = properties.filter((p) => p.value > p.mortgage).map((p) => ({ label: p.name || "Property", value: Math.max(0, p.value - p.mortgage) }));
  const debtItems = debts.filter((d) => d.amount > 0).map((d) => ({ label: d.category, value: d.amount }));
  const incomeItems = income.filter((i) => i.amount > 0).map((i) => ({ label: i.category, value: normalizeToMonthly(i.amount, i.frequency) }));
  const expenseItems = expenses.filter((e) => e.amount > 0).map((e) => ({ label: e.category, value: e.amount }));
  const debtPaymentItems = debts.filter((d) => (d.monthlyPayment ?? 0) > 0).map((d) => ({ label: d.category, value: d.monthlyPayment! }));

  const netWorthConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive", items: assetItems },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive", items: stockItems },
    ...(totals.totalPropertyEquity > 0 ? [{ sourceId: "section-property", label: fmtLabel(totals.totalPropertyEquity), value: totals.totalPropertyEquity, sign: "positive" as const, items: propertyEquityItems }] : []),
    { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative", items: debtItems },
  ];

  const incomeAndReturnsTotal = totals.monthlyIncome + payoutInvestmentReturns;
  const monthlyTaxes = totals.monthlyIncome - totals.monthlyAfterTaxIncome;

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

  const contributionItems = realAssets.filter((a) => (a.monthlyContribution ?? 0) > 0).map((a) => ({ label: a.category, value: a.monthlyContribution! }));

  const monthlySurplusConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: fmtLabel(incomeAndReturnsTotal), value: incomeAndReturnsTotal, sign: "positive", items: incomeItems },
    ...(monthlyTaxes > 0 ? [{ sourceId: "virtual-taxes", label: `taxes ${fmtLabel(-monthlyTaxes)}`, value: monthlyTaxes, sign: "negative" as const }] : []),
    { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative", items: expenseItems },
    ...(totals.totalMonthlyContributions > 0 ? [{ sourceId: "virtual-contributions", label: `contributions ${fmtLabel(-totals.totalMonthlyContributions)}`, value: totals.totalMonthlyContributions, sign: "negative" as const, items: contributionItems }] : []),
    ...(totalMortgagePayments > 0 ? [{ sourceId: "virtual-mortgage", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const, items: mortgageItems.length > 0 ? mortgageItems : undefined }] : []),
    ...(totals.totalDebtPayments > 0 ? [{ sourceId: "section-debts", label: `debt payments ${fmtLabel(-totals.totalDebtPayments)}`, value: totals.totalDebtPayments, sign: "negative" as const, items: debtPaymentItems }] : []),
  ];

  // Estimated Tax: green arrow from income showing gross income, label with effective rate + annual tax
  const estimatedTaxConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: totals.effectiveTaxRate > 0 ? `${(totals.effectiveTaxRate * 100).toFixed(1)}% of ${fmtLabel(totals.monthlyIncome * 12).replace(/^[+-]/, "")}` : fmtLabel(totals.monthlyIncome * 12), value: totals.monthlyIncome, sign: "positive", items: incomeItems.map((i) => ({ label: i.label, value: i.value * 12 })) },
  ];

  // Financial Runway: liquid assets (green) / monthly obligations (red)
  const financialRunwayConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive", items: assetItems },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive", items: stockItems },
    { sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative", items: expenseItems },
    ...(totalMortgagePayments > 0 ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const, items: mortgageItems.length > 0 ? mortgageItems : undefined }] : []),
    ...(totals.totalDebtPayments > 0 ? [{ sourceId: "section-debts", label: `debt payments ${fmtLabel(-totals.totalDebtPayments)}`, value: totals.totalDebtPayments, sign: "negative" as const, items: debtPaymentItems }] : []),
  ];

  // Debt-to-Asset Ratio: all assets (green) vs all debts (red)
  const debtToAssetConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive", items: assetItems },
    { sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive", items: stockItems },
    ...(totals.totalPropertyValue > 0 ? [{ sourceId: "section-property", label: `value ${fmtLabel(totals.totalPropertyValue)}`, value: totals.totalPropertyValue, sign: "positive" as const, items: properties.map((p) => ({ label: p.name || "Property", value: p.value })) }] : []),
    { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative", items: debtItems },
    ...(totals.totalPropertyMortgage > 0 ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totals.totalPropertyMortgage)}`, value: totals.totalPropertyMortgage, sign: "negative" as const, items: properties.filter((p) => p.mortgage > 0).map((p) => ({ label: p.name || "Property", value: p.mortgage })) }] : []),
  ];

  // Income Replacement: invested assets (green) driving the 4% withdrawal
  const incomeReplacementConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-assets", label: fmtLabel(totals.totalAssets), value: totals.totalAssets, sign: "positive" as const, items: assetItems },
    ...(totals.totalStocks > 0 ? [{ sourceId: "section-stocks", label: fmtLabel(totals.totalStocks), value: totals.totalStocks, sign: "positive" as const, items: stockItems }] : []),
  ].filter((c) => c.value > 0);

  const dataFlowConnections: Record<string, DataFlowConnectionDef[]> = {
    "Net Worth": netWorthConnections,
    "Monthly Cash Flow": monthlySurplusConnections,
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
    "debt-to-income": [
      { sourceId: "section-debts", label: fmtLabel(-totals.totalDebts), value: totals.totalDebts, sign: "negative" },
      { sourceId: "section-income", label: fmtLabel(totals.monthlyIncome), value: totals.monthlyIncome, sign: "positive" },
    ],
    "housing-cost": [
      { sourceId: "section-income", label: fmtLabel(totals.monthlyIncome), value: totals.monthlyIncome, sign: "positive" },
      ...(totalMortgagePayments > 0
        ? [{ sourceId: "section-property", label: `mortgage ${fmtLabel(-totalMortgagePayments)}`, value: totalMortgagePayments, sign: "negative" as const }]
        : [{ sourceId: "section-expenses", label: fmtLabel(-totals.monthlyExpenses), value: totals.monthlyExpenses, sign: "negative" as const }]),
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
  const benchmarkMonthlyObligations = totals.monthlyExpenses + totals.totalMortgagePayments + totals.totalDebtPayments;
  const benchmarkEmergencyMonths = benchmarkMonthlyObligations > 0 ? (totals.totalAssets + totals.totalStocks) / benchmarkMonthlyObligations : 0;
  const annualIncome = totals.monthlyIncome * 12;
  const benchmarkDebtToIncome = annualIncome > 0 ? (debtTotal + totals.totalPropertyMortgage) / annualIncome : 0;

  return (
    <CurrencyProvider currency={homeCurrency}>
    <DataFlowProvider homeCurrency={homeCurrency}>
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* ── Header (sticky) ── */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm px-4 py-2 sm:px-6">
        <div className="mx-auto max-w-5xl">
          {/* Title + phase toggle + actions */}
          <div className="flex items-center gap-2 mb-1.5 print:hidden">
            <h1 className="text-sm font-bold text-white sm:text-base">Financial Health</h1>
            <span className="text-slate-700 select-none">·</span>
            <button
              type="button"
              onClick={switchToWizard}
              className="rounded-md px-2 py-1 text-xs font-medium text-slate-400 transition-all duration-150 hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 active:scale-95"
            >
              📝 My Finances
            </button>
            <span className="text-slate-600 select-none text-xs">/</span>
            <span className="rounded-md bg-violet-500/15 px-2 py-1 text-xs font-medium text-violet-300 ring-1 ring-violet-500/30">
              📊 Dashboard
            </span>
            <span className="flex-1" />
            <a
              href="/changelog"
              className="rounded-md px-1.5 py-1 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            >
              Changelog
            </a>
            <a
              href="https://ko-fi.com/R6R11VMSML"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md px-1.5 py-1 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
            >
              ☕ Tip
            </a>
            <CopyLinkButton />
            <PrintSnapshotButton />
          </div>
          {/* Dashboard section stepper (scroll-to links) */}
          <nav className="w-full overflow-x-auto scrollbar-hide print:hidden" aria-label="Dashboard sections" style={{ scrollbarWidth: "none" }}>
            <ol className="flex items-center gap-0 min-w-max px-0 py-0.5 pr-8">
              {DASHBOARD_SECTIONS.map((sec, idx) => {
                const isCurrent = sec.id === visibleSection;
                return (
                  <li key={sec.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`section-dash-${sec.id}`);
                        if (el) {
                          el.scrollIntoView({ behavior: "smooth", block: "start" });
                        }
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                        isCurrent
                          ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                          : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                      }`}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      <span className="text-sm" aria-hidden="true">{sec.icon}</span>
                      <span className="hidden sm:inline">{sec.label}</span>
                      <span className="sm:hidden">{sec.shortLabel}</span>
                    </button>
                    {idx < DASHBOARD_SECTIONS.length - 1 && (
                      <div className="mx-0.5 h-px w-4 bg-white/10" aria-hidden="true" />
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </header>

      {/* ── All sections (scrollable) ── */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Intro */}
          <section id="section-dash-intro" className="scroll-mt-28 max-w-3xl mx-auto">
            <WelcomeBanner />
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
          </section>

          {/* Insights */}
          <section id="section-dash-insights" className="scroll-mt-28" aria-label="Financial insights">
            <InsightsPanel data={financialData} insightConnections={insightConnections} milestones={projectionMilestones} />
          </section>

          {/* Metrics */}
          <section id="section-dash-metrics" className="scroll-mt-28" data-testid="dashboard-panel" aria-label="Financial dashboard">
            <SnapshotDashboard metrics={metrics} financialData={financialData} homeCurrency={homeCurrency} dataFlowConnections={dataFlowConnections} />
          </section>

          {/* r/personalfinance Flowchart */}
          <section id="section-dash-roadmap" className="scroll-mt-28 max-w-3xl mx-auto" aria-label="r/personalfinance flowchart">
            <FinancialFlowchart
              state={state}
              acknowledged={flowchartAcks}
              skipped={flowchartSkips}
              isRetired={isRetired}
              onAcksChange={setFlowchartAcks}
              onSkipsChange={setFlowchartSkips}
              onRetiredChange={setIsRetired}
            />
          </section>

          {/* Cash Flow */}
          <section id="section-dash-cashflow" className="scroll-mt-28 max-w-3xl mx-auto" aria-label="Cash flow">
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
                  if (r.reinvest) return false;
                  const asset = assets.find((a) => a.category === r.label);
                  if (!asset) return false;
                  const treatment = asset.roiTaxTreatment ?? getDefaultRoiTaxTreatment(asset.category);
                  return treatment === "income";
                })
                .map((r) => ({ label: r.label, monthlyAmount: r.amount }))}
            /></ZoomableCard>
          </section>

          {/* Breakdowns (2-col) */}
          <section id="section-dash-breakdowns" className="scroll-mt-28" aria-label="Expense and net worth breakdowns">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
            </div>
          </section>

          {/* Compare (2-col) */}
          <section id="section-dash-compare" className="scroll-mt-28" aria-label="Comparisons and benchmarks">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <ZoomableCard><FinancialHealthScore
                savingsRate={benchmarkSavingsRate}
                emergencyMonths={benchmarkEmergencyMonths}
                debtToIncomeRatio={benchmarkDebtToIncome}
                netWorth={benchmarkNetWorth}
                annualIncome={annualIncome}
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
              {stocks.length > 0 && (() => {
                const portfolio = getPortfolioSummary(stocks);
                const stocksWithReturns = stocks
                  .map((s) => ({ ticker: s.ticker, annualized: getAnnualizedReturn(s) }))
                  .filter((s) => s.annualized !== null) as { ticker: string; annualized: number }[];
                return (
                  <ZoomableCard><div className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm transition-all duration-200" data-testid="portfolio-performance">
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
            </div>
          </section>

          {/* Projections */}
          <section id="section-dash-projections" className="scroll-mt-28 max-w-3xl mx-auto" aria-label="Financial projections">
            <ZoomableCard><ProjectionChart state={state} runwayDetails={runwayDetails ?? undefined} safeWithdrawalRate={safeWithdrawalRate} onOutlookChange={setOutlookYears} onMilestonesChange={handleMilestonesChange} /></ZoomableCard>
          </section>

          {/* What If */}
          <section id="section-dash-scenarios" className="scroll-mt-28 max-w-3xl mx-auto" aria-label="Scenario modeling">
            <FastForwardPanel state={state} safeWithdrawalRate={safeWithdrawalRate} onSwrChange={handleSwrChange} />
          </section>

        </div>
        <PrintFooter />
      </main>
    </div>
    </DataFlowProvider>
    </CurrencyProvider>
  );
}
