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
import { getPortfolioSummary, getAnnualizedReturn, getStockValue, getStockGainLoss } from "@/components/StockEntry";
import { normalizeToMonthly } from "@/components/IncomeEntry";
// getFilingStatuses moved to wizard-only
import { getStepFromURL, updateStepURL, type WizardStep } from "@/lib/url-state";
import {
  PrintSnapshotButton,
  AppHeader,
  PrintFooter,
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
    { id: "projections", icon: "📈", label: "Projections", shortLabel: "Project" },
    { id: "insights", icon: "💡", label: "Insights", shortLabel: "Insights" },
    { id: "metrics", icon: "🎯", label: "Metrics", shortLabel: "Metrics" },
    { id: "roadmap", icon: "🗺️", label: "Money Steps", shortLabel: "Steps" },
    { id: "cashflow", icon: "💸", label: "Cash Flow", shortLabel: "Cash" },
    { id: "breakdowns", icon: "📉", label: "Breakdowns", shortLabel: "Charts" },
    { id: "compare", icon: "📊", label: "Compare", shortLabel: "Compare" },
    { id: "scenarios", icon: "🔮", label: "What If", shortLabel: "What If" },
  ] as const, []);

  // Track which section is visible for highlighting the stepper
  const stepperNavRef = useRef<HTMLElement>(null);
  const [visibleSection, setVisibleSection] = useState("insights");
  const visibleSectionsRef = useRef(new Set<string>());
  useEffect(() => {
    if (phase !== "dashboard" || typeof IntersectionObserver === "undefined") return;
    const sectionIds = DASHBOARD_SECTIONS.map(s => s.id);
    const visible = visibleSectionsRef.current;
    visible.clear();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = entry.target.id.replace("section-dash-", "");
        if (entry.isIntersecting) {
          visible.add(id);
        } else {
          visible.delete(id);
        }
      }
      // Pick the first (topmost) visible section in DOM order
      for (const id of sectionIds) {
        if (visible.has(id)) {
          setVisibleSection(id);
          return;
        }
      }
    }, { rootMargin: "-20% 0px -60% 0px" });
    for (const id of sectionIds) {
      const el = document.getElementById(`section-dash-${id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [phase, DASHBOARD_SECTIONS]);

  // Auto-scroll stepper nav to keep active section button visible
  useEffect(() => {
    const nav = stepperNavRef.current;
    if (!nav) return;
    const active = nav.querySelector("[aria-current='step']") as HTMLElement | null;
    if (active) {
      const navRect = nav.getBoundingClientRect();
      const btnRect = active.getBoundingClientRect();
      const scrollLeft = active.offsetLeft - navRect.width / 2 + btnRect.width / 2;
      nav.scrollTo({ left: scrollLeft, behavior: "smooth" });
    }
  }, [visibleSection]);

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

  // Merge all outflows into a single card with categorized items
  const outflowItems: { label: string; value: number }[] = [];
  if (monthlyTaxes > 0) outflowItems.push({ label: "Taxes", value: Math.round(monthlyTaxes) });
  for (const e of expenseItems) outflowItems.push(e);
  for (const c of contributionItems) outflowItems.push({ label: `${c.label} (contribution)`, value: c.value });
  if (totalMortgagePayments > 0) outflowItems.push({ label: "Mortgage", value: Math.round(totalMortgagePayments) });
  for (const d of debtPaymentItems) outflowItems.push({ label: `${d.label} (payment)`, value: d.value });
  const totalOutflows = Math.round(monthlyTaxes + totals.monthlyExpenses + totals.totalMonthlyContributions + totalMortgagePayments + totals.totalDebtPayments);

  const monthlySurplusConnections: DataFlowConnectionDef[] = [
    { sourceId: "section-income", label: fmtLabel(incomeAndReturnsTotal), value: incomeAndReturnsTotal, sign: "positive", items: incomeItems },
    { sourceId: "section-expenses", label: fmtLabel(-totalOutflows), value: totalOutflows, sign: "negative", items: outflowItems },
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
      <AppHeader activePhase="dashboard" onSwitchPhase={switchToWizard}>
          {/* Dashboard section stepper (scroll-to links) */}
          <nav ref={stepperNavRef} className="w-full overflow-x-auto scrollbar-hide print:hidden" aria-label="Dashboard sections" style={{ scrollbarWidth: "none" }}>
            <ol className="flex items-center gap-0 px-4 py-0.5">
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
      </AppHeader>

      {/* ── All sections (scrollable) ── */}
      <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl space-y-8">

          {/* Welcome */}
          <p className="text-sm text-slate-500 max-w-3xl">
            Your financial snapshot at a glance. Edit numbers in{" "}
            <button type="button" onClick={switchToWizard} className="text-violet-400 hover:text-violet-300 transition-colors underline underline-offset-2">Inputs</button>
            {" "}— everything stays in your browser, nothing is stored.
          </p>

          {/* Projections */}
          <section id="section-dash-projections" className="scroll-mt-28" aria-label="Financial projections">
            <ZoomableCard><ProjectionChart state={state} runwayDetails={runwayDetails ?? undefined} safeWithdrawalRate={safeWithdrawalRate} onOutlookChange={setOutlookYears} onMilestonesChange={handleMilestonesChange} /></ZoomableCard>
          </section>

          {/* Insights */}
          <section id="section-dash-insights" className="scroll-mt-28" aria-label="Financial insights">
            <InsightsPanel data={financialData} insightConnections={insightConnections} milestones={projectionMilestones} />
          </section>

          {/* Metrics */}
          <section id="section-dash-metrics" className="scroll-mt-28" data-testid="dashboard-panel" aria-label="Financial dashboard">
            <SnapshotDashboard metrics={metrics} financialData={financialData} homeCurrency={homeCurrency} dataFlowConnections={dataFlowConnections} />
          </section>

          {/* Flowchart */}
          <section id="section-dash-roadmap" className="scroll-mt-28" aria-label="r/personalfinance flowchart">
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
          <section id="section-dash-cashflow" className="scroll-mt-28" aria-label="Cash flow">
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
              /></ZoomableCard>
            </div>
            {stocks.length > 0 && (() => {
              const portfolio = getPortfolioSummary(stocks);
              if (portfolio.totalValue === 0) return null;
              const fc = (v: number) => formatCurrencyCompact(Math.abs(v), homeCurrency, homeCurrency);
              const ALLOC_COLORS = ["#a78bfa", "#22d3ee", "#f472b6", "#34d399", "#fbbf24", "#fb923c", "#60a5fa", "#e879f9"];
              const stockDetails = stocks
                .filter((s) => getStockValue(s) > 0)
                .map((s) => {
                  const value = getStockValue(s);
                  const gainLoss = getStockGainLoss(s);
                  const annualized = getAnnualizedReturn(s);
                  const weight = portfolio.totalValue > 0 ? (value / portfolio.totalValue) * 100 : 0;
                  return { ...s, value, gainLoss, annualized, weight };
                })
                .sort((a, b) => b.value - a.value);
              const bestPerformer = stockDetails.reduce<typeof stockDetails[0] | null>((best, s) =>
                s.gainLoss && (!best || !best.gainLoss || s.gainLoss.percentage > best.gainLoss.percentage) ? s : best, null);
              const worstPerformer = stockDetails.reduce<typeof stockDetails[0] | null>((worst, s) =>
                s.gainLoss && (!worst || !worst.gainLoss || s.gainLoss.percentage < worst.gainLoss.percentage) ? s : worst, null);
              return (
                <ZoomableCard><div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm transition-all duration-200 sm:p-5" data-testid="portfolio-performance">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-slate-400">Portfolio Performance</h3>
                    <span className="text-lg" aria-hidden="true">📊</span>
                  </div>

                  {/* Total gain/loss + return */}
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <p className={`text-2xl font-bold ${portfolio.totalGainLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {portfolio.totalGainLoss >= 0 ? "+" : ""}{fc(portfolio.totalGainLoss)}
                    </p>
                    {portfolio.totalCostBasis > 0 && (
                      <p className="text-sm text-slate-400" data-testid="portfolio-return-pct">
                        {portfolio.overallReturnPct >= 0 ? "+" : ""}{portfolio.overallReturnPct.toFixed(1)}% return on {fc(portfolio.totalCostBasis)} invested
                      </p>
                    )}
                  </div>

                  {/* Allocation bar */}
                  {stockDetails.length > 1 && (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-slate-500">Allocation</p>
                      <div className="flex h-3 overflow-hidden rounded-full">
                        {stockDetails.map((s, i) => (
                          <div
                            key={s.id}
                            className="transition-all duration-300"
                            style={{ width: `${s.weight}%`, backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length], minWidth: s.weight > 0 ? 4 : 0 }}
                            title={`${s.ticker} ${s.weight.toFixed(1)}%`}
                          />
                        ))}
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                        {stockDetails.map((s, i) => (
                          <span key={s.id} className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ALLOC_COLORS[i % ALLOC_COLORS.length] }} />
                            {s.ticker} {s.weight.toFixed(0)}%
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Per-stock table */}
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-white/10 text-slate-500">
                          <th className="py-1.5 text-left font-medium">Ticker</th>
                          <th className="py-1.5 text-right font-medium">Value</th>
                          <th className="py-1.5 text-right font-medium">Gain/Loss</th>
                          <th className="py-1.5 text-right font-medium">Return</th>
                          <th className="py-1.5 text-right font-medium hidden sm:table-cell">CAGR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockDetails.map((s) => (
                          <tr key={s.id} className="border-b border-white/5">
                            <td className="py-1.5 font-mono font-medium text-slate-300">{s.ticker}</td>
                            <td className="py-1.5 text-right text-slate-300">{fc(s.value)}</td>
                            <td className={`py-1.5 text-right font-medium ${s.gainLoss ? (s.gainLoss.amount >= 0 ? "text-emerald-400" : "text-rose-400") : "text-slate-500"}`}>
                              {s.gainLoss ? `${s.gainLoss.amount >= 0 ? "+" : ""}${fc(s.gainLoss.amount)}` : "—"}
                            </td>
                            <td className={`py-1.5 text-right ${s.gainLoss ? (s.gainLoss.percentage >= 0 ? "text-emerald-400" : "text-rose-400") : "text-slate-500"}`}>
                              {s.gainLoss ? `${s.gainLoss.percentage >= 0 ? "+" : ""}${s.gainLoss.percentage.toFixed(1)}%` : "—"}
                            </td>
                            <td className={`py-1.5 text-right hidden sm:table-cell ${s.annualized !== null ? (s.annualized >= 0 ? "text-emerald-400" : "text-rose-400") : "text-slate-500"}`}>
                              {s.annualized !== null ? `${s.annualized >= 0 ? "+" : ""}${s.annualized.toFixed(1)}%/yr` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Best / Worst performers */}
                  {stockDetails.length > 1 && bestPerformer?.gainLoss && worstPerformer?.gainLoss && bestPerformer.ticker !== worstPerformer.ticker && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-400/10 px-2 py-1 text-[11px] font-medium text-emerald-400">
                        Best: {bestPerformer.ticker} +{bestPerformer.gainLoss.percentage.toFixed(1)}%
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-rose-400/10 px-2 py-1 text-[11px] font-medium text-rose-400">
                        Worst: {worstPerformer.ticker} {worstPerformer.gainLoss.percentage.toFixed(1)}%
                      </span>
                    </div>
                  )}
                </div></ZoomableCard>
              );
            })()}
          </section>

          {/* What If */}
          <section id="section-dash-scenarios" className="scroll-mt-28" aria-label="Scenario modeling">
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
