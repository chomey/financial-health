export interface ChangelogEntry {
  version: number;
  title: string;
  description: string;
  date: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  // Data Flow Visualization (Milestone 8)
  {
    version: 69,
    title: "SVG arrow overlay system and data-flow context",
    description: "New DataFlowArrows component with a full-viewport SVG overlay that renders animated flowing arrows between source and target elements. Includes DataFlowContext for registering sources and targets, cubic bezier path calculation, CSS stroke-dasharray animations, green/red color coding for positive/negative contributions, and scroll/resize recalculation.",
    date: "2026-03-05",
  },
  // Withdrawal Tax Modeling (Milestone 7)
  {
    version: 68,
    title: "Full E2E test for withdrawal tax features",
    description: "Comprehensive end-to-end test covering account tax treatment classification (TFSA tax-free, RRSP tax-deferred, Brokerage taxable), runway with vs without withdrawal tax, projection chart tax drag, withdrawal order recommendation, capital gains cost basis on brokerage accounts, tax-free withdrawal insights, and URL persistence of costBasisPercent. Tests both CA and US jurisdictions.",
    date: "2026-03-05",
  },
  {
    version: 67,
    title: "Capital gains tracking for brokerage accounts",
    description: "Taxable accounts (Brokerage, Savings, etc.) now support a cost basis % field indicating what portion of the balance is original contributions vs unrealized gains. Shows an unrealized gains badge when cost basis is below 100%. Wired into withdrawal tax calculations — gains are taxed at capital gains rates (Canada 50% inclusion, US 0%/15%/20% brackets). Persisted in URL state.",
    date: "2026-03-05",
  },
  {
    version: 66,
    title: "Withdrawal tax summary and insights",
    description: "New Withdrawal Tax Impact dashboard card showing tax drag on runway, account breakdown by tax treatment (tax-free, taxable, tax-deferred), and optimal withdrawal order. Insights engine now generates withdrawal-tax-aware messages about TFSA/Roth IRA benefits and tax-deferred account implications.",
    date: "2026-03-05",
  },
  {
    version: 65,
    title: "Tax-aware projection drawdown",
    description: "Projection engine now models withdrawal taxes during drawdown. When expenses exceed income (retirement scenario), assets are drawn in tax-optimal order with gross-up for taxes. Chart tooltip shows cumulative withdrawal tax paid.",
    date: "2026-03-05",
  },
  {
    version: 64,
    title: "Tax-adjusted financial runway",
    description: "Financial runway now accounts for withdrawal taxes using smart ordering: tax-free accounts (TFSA, Roth IRA) are drawn first, then taxable, then tax-deferred (RRSP, 401k). Shows adjusted runway alongside base runway.",
    date: "2026-03-05",
  },
  {
    version: 63,
    title: "Account tax treatment classification",
    description: "New withdrawal-tax module classifies accounts as tax-free (TFSA, Roth IRA), tax-deferred (RRSP, 401k), or taxable (Brokerage) and computes withdrawal tax impact including capital gains handling.",
    date: "2026-03-05",
  },
  {
    version: 62,
    title: "Changelog page",
    description: "New /changelog page displaying version history grouped by milestone with all completed tasks.",
    date: "2026-03-05",
  },
  // Multi-Currency Support (Milestone 6)
  {
    version: 61,
    title: "Multi-currency E2E tests",
    description: "Comprehensive end-to-end tests for currency badge toggling, FX rate display, manual overrides, and URL persistence.",
    date: "2026-03-05",
  },
  {
    version: 60,
    title: "Currency fields in URL state",
    description: "Per-item currency overrides and manual FX rates now persist in the URL for sharing and bookmarking.",
    date: "2026-03-05",
  },
  {
    version: 59,
    title: "FX rate display and manual override",
    description: "Live FX rate shown in the header with click-to-edit manual override support.",
    date: "2026-03-05",
  },
  {
    version: 58,
    title: "Per-item currency override",
    description: "Assets, debts, and properties can each be denominated in a different currency with automatic conversion.",
    date: "2026-03-05",
  },
  {
    version: 57,
    title: "Live FX rate API",
    description: "API endpoint fetching live CAD/USD exchange rates with 4-hour caching and fallback rates.",
    date: "2026-03-05",
  },
  {
    version: 56,
    title: "Currency utility library",
    description: "Core currency conversion, formatting, and FX rate management utilities.",
    date: "2026-03-05",
  },

  // Kubera-Inspired Visualizations (Milestone 5)
  {
    version: 55,
    title: "Visualization E2E tests",
    description: "Comprehensive end-to-end tests for all Kubera-inspired charts and visualization features.",
    date: "2026-02-28",
  },
  {
    version: 54,
    title: "Stock ROI performance tracking",
    description: "Portfolio performance metrics with annualized returns, gain/loss display, and purchase date tracking.",
    date: "2026-02-28",
  },
  {
    version: 53,
    title: "Cash flow Sankey diagram",
    description: "Interactive Sankey diagram showing money flowing from income through taxes to expenses, investments, and surplus.",
    date: "2026-02-28",
  },
  {
    version: 52,
    title: "Benchmark comparisons",
    description: "Compare your metrics against age-group medians from StatsCan and Federal Reserve data.",
    date: "2026-02-28",
  },
  {
    version: 51,
    title: "Fast Forward scenario modeling",
    description: "What-if scenarios: toggle debts, adjust contributions, add windfalls, and see projected impact.",
    date: "2026-02-28",
  },
  {
    version: 50,
    title: "Net worth waterfall chart",
    description: "Waterfall chart showing how each asset and debt contributes to your net worth.",
    date: "2026-02-28",
  },
  {
    version: 49,
    title: "Expense breakdown chart",
    description: "Horizontal bar chart showing expense categories with income vs expenses comparison.",
    date: "2026-02-28",
  },
  {
    version: 48,
    title: "Asset allocation chart",
    description: "Doughnut chart showing asset allocation by category type or by liquidity.",
    date: "2026-02-28",
  },

  // Tax Computation & Property Enhancements (Milestone 4)
  {
    version: 47,
    title: "Property appreciation/depreciation",
    description: "Properties support annual appreciation rates with dynamic icons and projection integration.",
    date: "2026-02-28",
  },
  {
    version: 46,
    title: "Tax computation E2E tests",
    description: "Comprehensive end-to-end tests for the full tax computation feature across CA and US.",
    date: "2026-02-28",
  },
  {
    version: 45,
    title: "Tax summary in dashboard",
    description: "Tax insights and after-tax projections displayed in the dashboard with effective rate info.",
    date: "2026-02-28",
  },
  {
    version: 44,
    title: "Tax computation in metrics",
    description: "After-tax income, surplus, and projections using the tax engine for accurate calculations.",
    date: "2026-02-28",
  },
  {
    version: 43,
    title: "Income type selector",
    description: "Per-income-row type selector (Employment, Capital Gains, Other) with visual styling.",
    date: "2026-02-28",
  },
  {
    version: 42,
    title: "Country and jurisdiction selector",
    description: "Country toggle (CA/US) and province/state dropdown in the header for tax calculations.",
    date: "2026-02-28",
  },
  {
    version: 41,
    title: "Tax computation engine",
    description: "Core tax engine computing federal and provincial/state taxes for CA and US jurisdictions.",
    date: "2026-02-27",
  },
  {
    version: 40,
    title: "US tax bracket tables",
    description: "2025 US federal and all 50 state + DC income tax bracket tables.",
    date: "2026-02-27",
  },
  {
    version: 39,
    title: "Canadian tax bracket tables",
    description: "2025 Canadian federal and all 13 provincial/territorial tax bracket tables.",
    date: "2026-02-27",
  },
  {
    version: 38,
    title: "Income type field",
    description: "Added income type (employment, capital gains, other) to income items with URL encoding.",
    date: "2026-02-27",
  },
  {
    version: 37,
    title: "Country and jurisdiction state",
    description: "Added country and jurisdiction fields to financial state with URL encoding.",
    date: "2026-02-27",
  },

  // Feature Enhancements (Milestone 3)
  {
    version: 36,
    title: "Feature enhancements E2E tests",
    description: "Comprehensive end-to-end tests for tasks 27-35 including projections, stocks, and contributions.",
    date: "2026-02-27",
  },
  {
    version: 35,
    title: "Investment contribution tracking",
    description: "Auto-generated expense row for investment contributions to prevent double-counting in surplus.",
    date: "2026-02-27",
  },
  {
    version: 34,
    title: "Mortgage amortization schedule",
    description: "Year-by-year amortization breakdown showing changing interest/principal split over time.",
    date: "2026-02-27",
  },
  {
    version: 33,
    title: "Full-width projection chart",
    description: "Projection chart moved above the two-column layout to span the full page width.",
    date: "2026-02-27",
  },
  {
    version: 32,
    title: "Stock holdings with live prices",
    description: "Stocks & Equity section with ticker lookup, live price fetching, and gain/loss tracking.",
    date: "2026-02-27",
  },
  {
    version: 31,
    title: "Grouped category dropdowns",
    description: "Asset and debt dropdowns now show CA/US/General sections instead of a region toggle.",
    date: "2026-02-27",
  },
  {
    version: 30,
    title: "Income frequency support",
    description: "Income items support weekly, biweekly, quarterly, semi-annual, and annual frequencies.",
    date: "2026-02-27",
  },
  {
    version: 29,
    title: "Loan payoff timeline",
    description: "Estimated payoff date and total interest for debts with payment and interest rate info.",
    date: "2026-02-27",
  },
  {
    version: 28,
    title: "Projection scenario legend",
    description: "Explanatory legend for conservative/moderate/optimistic projection lines.",
    date: "2026-02-27",
  },
  {
    version: 27,
    title: "Chart at top of dashboard",
    description: "Projection chart moved to the top of the dashboard for maximum visual impact.",
    date: "2026-02-27",
  },

  // Core Features & Projections (Milestone 2)
  {
    version: 26,
    title: "New features E2E tests",
    description: "Comprehensive end-to-end tests for ROI, property interest, debt interest, and projections.",
    date: "2026-02-27",
  },
  {
    version: 25,
    title: "Financial projection timeline",
    description: "Interactive time-series projection chart with net worth, goals, and debt-free milestones.",
    date: "2026-02-27",
  },
  {
    version: 24,
    title: "Debt interest rates",
    description: "Interest rate and monthly payment fields on debts with smart defaults by debt type.",
    date: "2026-02-27",
  },
  {
    version: 23,
    title: "Property interest and payments",
    description: "Interest rate, monthly payment, and amortization fields on properties.",
    date: "2026-02-27",
  },
  {
    version: 22,
    title: "Asset ROI and contributions",
    description: "Expected annual ROI and monthly contribution fields on assets with smart defaults.",
    date: "2026-02-27",
  },
  {
    version: 21,
    title: "Region toggle improvements",
    description: "Enhanced region toggle with visible labels, region badges, and instant feedback.",
    date: "2026-02-27",
  },
  {
    version: 20,
    title: "Hydration mismatch fix",
    description: "Fixed server/client ID mismatch in all entry components using deterministic IDs.",
    date: "2026-02-27",
  },
  {
    version: 19,
    title: "Dashboard z-index fix",
    description: "Fixed tooltips and hover states in the dashboard column.",
    date: "2026-02-27",
  },
  {
    version: 18,
    title: "Property section",
    description: "New Property card with linked value, mortgage, and equity replacing separate asset/debt entries.",
    date: "2026-02-27",
  },
  {
    version: 17,
    title: "Region toggle visibility",
    description: "Region toggle now visibly affects the UI with flag badges and region-specific styling.",
    date: "2026-02-27",
  },
  {
    version: 16,
    title: "setState bug fix",
    description: "Fixed setState-during-render bug in all entry components using useEffect.",
    date: "2026-02-27",
  },

  // Foundation & Initial Build (Milestone 1)
  {
    version: 15,
    title: "Full E2E test suite",
    description: "Comprehensive end-to-end test covering all entry sections, dashboard, and URL persistence.",
    date: "2026-02-27",
  },
  {
    version: 14,
    title: "Mobile responsiveness",
    description: "Full mobile optimization with stacked layout, touch targets, and responsive editing.",
    date: "2026-02-27",
  },
  {
    version: 13,
    title: "Micro-interactions and polish",
    description: "Hover states, focus rings, slide animations, tooltips, and celebratory effects.",
    date: "2026-02-27",
  },
  {
    version: 12,
    title: "Region toggle (CA/US)",
    description: "Toggle between Canadian, US, or both financial vehicle categories.",
    date: "2026-02-27",
  },
  {
    version: 11,
    title: "URL state persistence",
    description: "Full app state encoded in URL query params for bookmarking and sharing.",
    date: "2026-02-27",
  },
  {
    version: 10,
    title: "Shared state wiring",
    description: "All entry sections connected to shared state with live dashboard updates.",
    date: "2026-02-27",
  },
  {
    version: 9,
    title: "Positive insights engine",
    description: "Encouraging, human-readable insights based on your financial data.",
    date: "2026-02-27",
  },
  {
    version: 8,
    title: "Snapshot dashboard",
    description: "Dashboard with Net Worth, Surplus, Runway, and Debt-to-Asset metrics.",
    date: "2026-02-27",
  },
  {
    version: 7,
    title: "Financial goals",
    description: "Goal tracking with progress bars, color transitions, and celebration effects.",
    date: "2026-02-27",
  },
  {
    version: 6,
    title: "Income and expenses",
    description: "Monthly income and expense entry sections with animated totals.",
    date: "2026-02-27",
  },
  {
    version: 5,
    title: "Debt entry section",
    description: "Debt tracking with category suggestions and inline editing.",
    date: "2026-02-27",
  },
  {
    version: 4,
    title: "Asset entry section",
    description: "Asset entry with CA/US financial vehicle suggestions and inline editing.",
    date: "2026-02-27",
  },
  {
    version: 3,
    title: "App shell and layout",
    description: "Responsive two-column layout with header and warm design language.",
    date: "2026-02-27",
  },
  {
    version: 2,
    title: "Playwright test infrastructure",
    description: "Playwright setup with screenshot helpers and Git LFS for images.",
    date: "2026-02-27",
  },
  {
    version: 1,
    title: "Project initialization",
    description: "Next.js 15 with TypeScript, Tailwind CSS v4, Vitest, and custom color palette.",
    date: "2026-02-27",
  },
];

/** Group changelog entries by milestone */
export function getChangelogByMilestone(): { milestone: string; entries: ChangelogEntry[] }[] {
  const milestones = [
    { milestone: "Withdrawal Tax Modeling", range: [62, 68] as const },
    { milestone: "Multi-Currency Support", range: [56, 61] as const },
    { milestone: "Kubera-Inspired Visualizations", range: [48, 55] as const },
    { milestone: "Tax Computation & Enhancements", range: [37, 47] as const },
    { milestone: "Feature Enhancements", range: [27, 36] as const },
    { milestone: "Core Features & Projections", range: [15, 26] as const },
    { milestone: "Foundation & Initial Build", range: [1, 14] as const },
  ];

  return milestones.map(({ milestone, range }) => ({
    milestone,
    entries: CHANGELOG.filter((e) => e.version >= range[0] && e.version <= range[1]),
  }));
}
