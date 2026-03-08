export interface ChangelogEntry {
  version: number;
  title: string;
  description: string;
  date: string;
}

export const CHANGELOG: ChangelogEntry[] = [
  // Financial roadmap inference engine
  {
    version: 149,
    title: "Financial roadmap step definitions and inference engine",
    description: "Added src/lib/flowchart-steps.ts with full 10-step roadmap definitions for both CA (r/PersonalFinanceCanada Money Steps: budget, starter EF, employer RRSP match, high-interest debt, full EF, TFSA, RRSP, moderate debt, RESP/FHSA, taxable investing) and US (r/personalfinance How to handle $: budget, starter EF, 401k match, high-interest debt, full EF, HSA, IRA/Roth IRA, 401k, moderate debt, taxable investing). Inference engine computes completion status and progress from FinancialState: budget from income/expense presence, emergency fund from liquid assets vs monthly obligations, debt steps from interest rate thresholds (>8% high, 4–8% moderate), account steps from asset category keywords. Steps that can't be inferred are userAcknowledgeable (employer match, RESP/FHSA, taxable investing) with optional skipLabel. URL persistence helpers added to url-state.ts: getFlowchartAcksFromURL(), getFlowchartSkipsFromURL(), updateFlowchartOverridesURL() using fca= and fcs= params.",
    date: "2026-03-08",
  },
  // Context-aware insights
  {
    version: 148,
    title: "Context-aware account insights",
    description: "Insights now reference the user's actual accounts instead of generic lists. The 'high tax rate' insight checks which tax-advantaged accounts you already have (TFSA, RRSP, 401k, Roth IRA) and suggests only what's missing — or encourages maximizing contributions if you have both. Tax optimization insights use 'maximizing your TFSA' vs 'shifting to a TFSA' based on account ownership. The RRSP/401k deduction suggestion only appears when you have taxable accounts to redirect. The no-tax-free-account suggestion correctly recommends TFSA for CA users and Roth IRA for US users. Canadian accounts are never suggested to US users and vice versa.",
    date: "2026-03-08",
  },
  // Deduplicate computation functions
  {
    version: 147,
    title: "Deduplicate computation functions",
    description: "Consolidated duplicate calculations into single sources of truth. Added computeFireNumber(), computeMonthlyObligations(), and computeSurplus() to compute-totals.ts. Replaced 4 independent formatCurrency implementations (insights/formatting.ts, NetWorthWaterfallChart, TaxCreditEntry, _page-helpers) with delegations to the canonical currency.ts module. compute-metrics.ts and financial-state.ts now use the shared helpers instead of inline formulas.",
    date: "2026-03-08",
  },
  // Large file splits for Claude efficiency
  {
    version: 146,
    title: "Codebase modularization: split large files",
    description: "Factored 800+ line files into focused modules. page.tsx (1078→572 lines): extracted helper components (PrintButton, CopyLink, AgeInput, WelcomeBanner, CollapsibleSection) into _page-helpers.tsx and state management into useFinancialState hook. insights.ts (941→2 lines): split into insights/ folder with types.ts, formatting.ts, net-worth.ts, generate.ts, and index.ts barrel. ProjectionChart.tsx (949→820 lines): extracted tooltip components to projection/ProjectionTooltips.tsx and utility constants/functions to projection/ProjectionUtils.ts. Added reusable useInlineEdit hook in src/hooks/. All public APIs preserved via barrel re-exports. All 1966 tests pass.",
    date: "2026-03-08",
  },
  // Tax credits E2E regression
  {
    version: 145,
    title: "Tax credits E2E regression",
    description: "Full Playwright regression test covering the complete tax credits feature across CA and US: credit entry, category swapping on country switch, all four insight types, dashboard metric updates (effective tax rate, monthly cash flow, runway), and URL state round-trip persistence. Confirms the entire tax credits pipeline works end-to-end.",
    date: "2026-03-07",
  },
  // Tax credits impact on dashboard metrics
  {
    version: 144,
    title: "Tax credits impact on dashboard metrics",
    description: "Tax credits now visibly affect three dashboard metrics. Estimated Tax shows your effective rate before and after credits (e.g. '22.5% → 18.2%') with a 'Tax Credits Applied' badge. Monthly Cash Flow shows a '+$X/mo from tax credits' line for refundable credits. Financial Runway shows an adjusted runway factoring in both refundable credits (treated as income) and non-refundable credits (reduced tax burden). All credit indicators include a 'Tax Credits Applied' badge so you know why the metric changed.",
    date: "2026-03-07",
  },
  // Tax credit insights with income eligibility awareness
  {
    version: 143,
    title: "Tax credit insights with eligibility awareness",
    description: "Four new insight types powered by your entered tax credits: tax-credits-summary shows your total credits and how they shift your effective tax rate; tax-credits-unclaimed suggests up to 2 unclaimed credits based on your profile (children, low income, homeowner, student) and income eligibility; tax-credits-refundable flags when your refundable credits exceed your estimated tax, signalling a possible refund; tax-credits-ineligible warns when any entered credits are likely unavailable at your income level or filing status, with an adjusted total. Tone stays encouraging throughout.",
    date: "2026-03-07",
  },
  // US tax credit categories with income limits and filing status
  {
    version: 142,
    title: "Full US tax credit category list",
    description: "Added 13 US credit/deduction categories with per-filing-status income limits: Child and Dependent Care Credit, Premium Tax Credit, Adoption Credit, Standard Deduction (info baseline), State and Local Tax (SALT) Deduction, Charitable Contributions Deduction, and SSDI/SSI Benefits (info). Updated descriptions for all existing US credits (EITC, Child Tax Credit, AOTC, Lifetime Learning, Saver's Credit, EV Credit, Clean Energy, Student Loan Interest) with plain-English income limit explanations.",
    date: "2026-03-07",
  },
  // Canadian tax credit categories with income limits and spousal status
  {
    version: 141,
    title: "Full Canadian tax credit category list",
    description: "Added 15 Canadian credit and deduction categories to the Tax Credits entry: DTC, Spousal Amount, Canada Caregiver, Medical Expense, Home Accessibility, CWB, GST/HST, CCB, Climate Action Incentive, Canada Training, Moving Expenses, Child Care, RRSP (info), Union & Professional Dues, and Northern Residents Deduction. Each includes per-filing-status income limits. Spousal Amount Credit is hidden for single filers and shown only for married/common-law. Introduced getCreditCategoriesForFilingStatus() to filter spouse-only credits based on filing status.",
    date: "2026-03-07",
  },
  // Tax credits entry UI, filing status selector, and data model
  {
    version: 140,
    title: "Tax Credits & Deductions entry UI",
    description: "New TaxCreditEntry component with jurisdiction-filtered categories, income eligibility badges (reduced/ineligible), refundable/non-refundable/deduction type badges, and info tooltip. Filing status selector in header (US: single/MFJ/MFS/HoH, CA: single/married-common-law). Tax credits and filing status persisted in URL state with compact encoding. Per-filing-status income limits with phase-out, hard cap, and ineligible indicators.",
    date: "2026-03-07",
  },
  // New insights E2E regression
  {
    version: 139,
    title: "New insights E2E regression",
    description: "Full Playwright regression test verifying all 5 new insight types (debt-to-income, housing cost, Coast FIRE, net worth milestones, age-based percentile) render correctly across 3 scenarios: young adult with student debt, mid-career homeowner, and high earner. Includes WCAG AA contrast ratio validation ensuring 4.5:1 minimum on all insight cards.",
    date: "2026-03-07",
  },
  // Net worth milestones and age-based percentile insight
  {
    version: 138,
    title: "Net worth milestones and age-based percentile insight",
    description: "Two new insights: (1) Net worth milestones celebrate crossing key thresholds from $0 to $10M+, with motivating messages at each level — including the famous Charlie Munger quote at $100k. (2) Age-based percentile compares your net worth to Federal Reserve SCF 2022 medians by age group (Under 35: $39k, 35–44: $135k, 45–54: $247k, 55–64: $364k, 65–74: $410k, 75+: $335k). Tone is encouraging regardless of where you stand. Requires entering your age for the percentile insight.",
    date: "2026-03-07",
  },
  // Coast FIRE age calculation and insight
  {
    version: 137,
    title: "Coast FIRE age calculation and insight",
    description: "New Coast FIRE insight that calculates when your existing investments, compounding at ~5% real return, will grow to cover retirement expenses by age 65 without additional contributions. If you've already hit Coast FIRE, it celebrates the milestone. If not, it shows how many more years of saving are needed. Includes educational explanation of what Coast FIRE means and why it's motivating. Requires entering your age via the age input.",
    date: "2026-03-07",
  },
  // Housing cost ratio insight
  {
    version: 136,
    title: "Housing cost ratio insight with 30% rule explanation",
    description: "New insight type showing your housing cost ratio — monthly rent or mortgage payment divided by gross monthly income. Four tiers: Well within budget (<25%), Right at the sweet spot (25–30%), Above the 30% rule (31–40%), and Cost-burdened (40%+). Each tier explains why the 30% guideline matters: financial planners and HUD use it as the benchmark — spending more limits savings capacity and emergency preparedness. Mortgage payments from PropertyEntry take priority; falls back to rent expense category.",
    date: "2026-03-07",
  },
  // Debt-to-income ratio insight
  {
    version: 135,
    title: "Debt-to-income ratio insight with educational explainer",
    description: "New insight type showing your debt-to-income (DTI) ratio — total monthly debt payments divided by gross monthly income. Four tiers: Excellent (<20%), Good (20–35%), Moderate (36–43%), and High (44%+). Each tier explains why DTI matters: lenders use it to decide mortgage approvals, credit card limits, and loan rates. A lower DTI means better terms and more financial flexibility. Appears on the Debt-to-Asset Ratio metric card.",
    date: "2026-03-07",
  },
  // Visual theme E2E regression
  {
    version: 134,
    title: "Visual theme E2E regression — WCAG AA contrast verification",
    description: "Full Playwright regression test verifying the cyberpunk theme renders correctly across all major views: dashboard metric cards, entry panels with inputs, explainer modal, projection chart, and mobile responsive layout. Includes WCAG AA contrast ratio verification ensuring all text/background color pairs meet 4.5:1 for normal text and 3:1 for large text. All 485 E2E tests pass.",
    date: "2026-03-07",
  },
  // Income Replacement explainer modal
  {
    version: 133,
    title: "Income Replacement metric — clickable explainer with 4% rule breakdown",
    description: "The Income Replacement metric card is now clickable. Clicking opens a detailed explainer showing: formula breakdown (total invested assets × 4% ÷ 12 vs monthly income), progress through tiers (Early stage → Building momentum → Strong position → Nearly independent → Financially independent), per-account contribution to the sustainable withdrawal, how much more is needed to reach the next tier, and an educational explanation of the 4% Safe Withdrawal Rate rule.",
    date: "2026-03-07",
  },
  // Show company/fund names for stock tickers
  {
    version: 132,
    title: "Show company/fund names for stock tickers",
    description: "Added a static map of 550+ ticker symbols to company/fund names (S&P 500, popular ETFs, Canadian stocks/ETFs, Vanguard/Fidelity mutual funds). Company names display as subtle text below ticker symbols in the stock entry view and as parenthetical labels in explainer modal source cards. Unknown tickers attempt an async Yahoo Finance lookup with session-level caching. Graceful fallback — if lookup fails, nothing is shown.",
    date: "2026-03-07",
  },
  // Page layout and remaining UI dark theme
  {
    version: 131,
    title: "Page layout, header, and remaining UI — dark cyberpunk theme",
    description: "Final dark theme pass across all remaining components. Page background slate-950, header bg-slate-900/80 with backdrop-blur glass effect, nav bg-slate-950/90. Print styles in globals.css override back to white-on-light for printing. All stone-* colors replaced with slate equivalents. Positive/negative convention consistent everywhere: emerald-400 positive, rose-400 negative. FastForwardPanel sliders updated to vivid accents. MobileWizard, StockEntry, ZoomableCard, FxRateDisplay, CurrencyBadge, WithdrawalTaxSummary, InsightsPanel, BenchmarkComparisons, CountryJurisdictionSelector all updated to glass card pattern.",
    date: "2026-03-07",
  },
  // Charts dark theme
  {
    version: 130,
    title: "Charts and projection panel — dark cyberpunk theme",
    description: "Applied dark cyberpunk palette to all chart components: NetWorthDonutChart, ExpenseBreakdownChart, ProjectionChart, NetWorthWaterfallChart. Dark glass-effect cards (bg-white/5 backdrop-blur border-white/10). Recharts color arrays updated to vivid saturated colors: cyan-400, violet-400, emerald-400, amber-400, blue-400, pink-400. Grid lines now use rgba(255,255,255,0.05) for subtle contrast. Axis labels in slate-400. Projection chart net worth line glows with a CSS drop-shadow filter. Positive values emerald-400, negative red-400. Summary tables use white/5 row dividers with slate text. FIRE callout uses amber-400 accent.",
    date: "2026-03-07",
  },
  // Entry panels dark theme
  {
    version: 129,
    title: "Entry panels — dark cyberpunk theme",
    description: "Applied the soft cyberpunk palette to all entry panel components: AssetEntry, DebtEntry, IncomeEntry, ExpenseEntry, PropertyEntry. Dark glass-effect cards (bg-white/5 backdrop-blur), border-white/10 card borders, cyan-500/50 inputs with slate-900 backgrounds, emerald-400 for positive/asset/income amounts, rose-400 for debt/expense amounts. Vivid accent glows on hover/focus. 'Add' buttons use bright cyan accent. Auto-computed rows have a distinct dark badge style. Section footers use white/10 dividers and cyan 'Add' buttons.",
    date: "2026-03-07",
  },
  // Dashboard and explainer modal dark theme
  {
    version: 128,
    title: "Metric cards and explainer modal — dark theme",
    description: "Applied the soft cyberpunk palette to SnapshotDashboard metric cards: glass-effect dark backgrounds (bg-white/5 backdrop-blur), cyan-400 for positive values, rose-400 for negative, slate text for labels. Explainer modal now uses dark slate-800 background. Tax bracket bars use a muted cyan→violet→rose color progression on dark containers, with consistently readable light text. Source summary cards, connector lines, and investment returns section all updated to the new palette.",
    date: "2026-03-07",
  },
  // Visual theme overhaul — soft cyberpunk palette
  {
    version: 127,
    title: "Soft cyberpunk theme tokens",
    description: "Replaced the green/stone Tailwind theme with a soft cyberpunk palette: dark slate-900 background, muted cyan for positive metrics, violet for info/links, rose for warnings. Added semantic accent CSS custom properties (--accent-positive, --accent-negative, --accent-info, --accent-highlight, --accent-muted, --accent-surface, --accent-border). Legacy green/stone/blue tokens remapped to new palette for gradual migration. Glow animations updated to use cyan/rose accents.",
    date: "2026-03-07",
  },
  // Show both monthly and yearly totals on Income and Expenses
  {
    version: 126,
    title: "Dual monthly/yearly totals on Income & Expenses",
    description: "Income and Expense sections now always show both monthly and yearly amounts. Each item displays its primary amount with frequency suffix (e.g. $5,500/mo) and a secondary converted amount ($66,000/yr). Section footers show 'Monthly: $X | Yearly: $Y'. The monthly/yearly toggle in Expenses has been removed.",
    date: "2026-03-07",
  },
  // Fix surplus explainer showing Assets instead of Contributions
  {
    version: 125,
    title: "Fix surplus explainer: Contributions card",
    description: "The Monthly Surplus explainer modal now correctly shows a 'Contributions' card (with your monthly contribution amount) instead of incorrectly showing the full 'Assets' section card. The fix uses virtual source IDs (virtual-contributions, virtual-mortgage) so the explainer displays the right label and value without pulling in unrelated section metadata.",
    date: "2026-03-07",
  },
  // Foreign currency support for income and expense entries
  {
    version: 124,
    title: "Foreign currency income & expenses",
    description: "Income and expense items now support a CAD/USD currency toggle, matching the existing behaviour on assets and debts. Each row shows a compact currency badge that can be clicked to mark the amount as foreign currency. When toggled, the converted home-currency equivalent is shown inline. Section totals and all downstream calculations (tax, surplus, net worth) automatically convert foreign amounts using the live FX rate.",
    date: "2026-03-07",
  },
  // Mortgage burndown line on projection chart
  {
    version: 123,
    title: "Mortgage burndown line on projection chart",
    description: "The Financial Projection chart now includes a dedicated mortgage burndown line (dashed orange) that shows how your mortgage balance declines over time alongside Net Worth, Assets, and Debts. The line coincides with the Mortgage Free milestone marker when the balance reaches $0. A Mortgage legend entry appears in the chart legend when a mortgage is present.",
    date: "2026-03-07",
  },
  // Fix projection chart label clipping
  {
    version: 122,
    title: "Projection chart label clipping fixed",
    description: "Y-axis currency labels no longer show unnecessary decimal zeros (e.g. '$105M' instead of '$105.0M'), reducing label width and preventing clipping. The left chart margin and Y-axis width have been increased to comfortably accommodate currency labels with CA$/US$ prefixes. Milestone annotation labels (Consumer Debt Free, Mortgage Free) are now rendered as SVG pills just inside the chart boundary instead of being clipped at the top edge.",
    date: "2026-03-07",
  },
  // Auto-display investment returns in Income section
  {
    version: 121,
    title: "Investment returns in Income section",
    description: "Auto-computed investment returns now appear as read-only line items in the Income section, below manually entered income sources. Each asset with a non-zero ROI contributes a '{category} returns' row with an 'auto' badge showing its monthly return amount. Investment returns are included in the Monthly Total, giving a complete picture of monthly cash flow from all sources.",
    date: "2026-03-07",
  },
  // Milestone E2E: Financial Intelligence
  {
    version: 120,
    title: "Milestone E2E: Financial Intelligence",
    description: "Comprehensive end-to-end test suite covering all financial intelligence features from tasks 110-119: inflation-adjusted projections, age-based benchmarks, employer match modeling, sample profiles, print layout, mobile wizard, debt payoff strategies, FIRE milestone, tax optimization suggestions, and income replacement ratio. Full regression test across the entire application.",
    date: "2026-03-06",
  },
  // Income replacement ratio metric
  {
    version: 119,
    title: "Income replacement ratio",
    description: "Added an Income Replacement metric card showing what percentage of your monthly income your investment portfolio could sustainably replace using the 4% withdrawal rule. The formula is (total invested assets × 4% / 12) ÷ monthly after-tax income. A progress bar visualizes your journey from Early stage (< 25%) through Building momentum (25–50%), Strong position (50–75%), Nearly independent (75–100%), to Financially independent (100%+). An insight card in the insights panel provides an encouraging, tier-specific message about your progress toward financial independence.",
    date: "2026-03-06",
  },
  // Tax optimization suggestions
  {
    version: 118,
    title: "Tax optimization suggestions",
    description: "Added smart tax optimization insights that analyze your account mix and suggest actionable improvements. Three suggestions appear when relevant: (1) If you hold taxable brokerage assets, the insight shows how much you'd save annually by shifting contributions to a TFSA or Roth IRA instead. (2) For higher-income earners, it shows the approximate tax savings from maximizing RRSP or 401(k) contributions using your marginal rate. (3) When taxable savings exceed tax-free savings, it nudges you to redirect contributions into your TFSA or Roth IRA. All suggestions only appear when the annual savings exceed $100 — no noise for minor optimizations.",
    date: "2026-03-06",
  },
  // FIRE number milestone
  {
    version: 117,
    title: "FIRE number milestone",
    description: "Added Financial Independence, Retire Early (FIRE) number to the projection chart. The FIRE number is calculated as annual living expenses divided by your safe withdrawal rate (default 4%). A golden reference line on the chart marks this target, and a callout shows how many years until you reach financial independence at your current savings rate. The Fast Forward panel now includes a withdrawal rate slider (3–5%) so you can model conservative or aggressive scenarios. A new insight celebrates when you've already hit your FIRE number, or shows your current progress toward it.",
    date: "2026-03-06",
  },
  // Debt payoff strategy comparison
  {
    version: 116,
    title: "Debt payoff strategy comparison",
    description: "Added avalanche vs snowball vs current debt payoff strategy comparison. When you have 2 or more debts with interest rates and monthly payments, the insights panel now shows how much interest and time you could save by switching strategies. The avalanche method (highest-rate debt first) minimizes total interest paid; the snowball method (smallest balance first) builds momentum by eliminating debts faster. The insight shows the best strategy for your situation and how long until you're debt-free at current payments.",
    date: "2026-03-06",
  },
  // Mobile guided wizard
  {
    version: 115,
    title: "Mobile guided wizard entry mode",
    description: "Added a full-screen step-by-step wizard for mobile visitors (< 768px) with no existing data. The 4-step flow collects income, expenses, savings & investments, and debts — each with large touch targets and quick-pick preset buttons. A progress bar shows current position; swipe left/right or tap Next/Back to navigate. Tapping 'See my snapshot' populates all entry fields and transitions to the dashboard. A localStorage flag ensures returning users skip the wizard and go straight to their data. Skip button is always available.",
    date: "2026-03-06",
  },
  // Print/PDF export
  {
    version: 114,
    title: "Print/PDF snapshot export",
    description: "Added a 'Print' button in the header that triggers the browser's print dialog, enabling one-click Save as PDF. In print mode, CSS @media print rules hide all entry panels, navigation, and interactive elements, leaving a clean layout of metric cards, the projection chart, and the insights panel. A print-only footer shows the snapshot URL and generation date, so the exported PDF is self-contained and shareable. Charts render at fixed heights to avoid collapsing in print.",
    date: "2026-03-06",
  },
  // Preset sample profiles for new users
  {
    version: 113,
    title: "Sample profiles for new users",
    description: "Added a 'Start with a sample profile' banner that appears for first-time visitors (no URL state). Three clickable profiles populate all entry fields instantly: Fresh grad (age 25, student loan, TFSA), Mid-career family (age 38, mortgage, RRSP/TFSA), and Pre-retirement (age 58, large registered accounts, near debt-free). US equivalents (Roth IRA, 401k) are shown automatically when country is set to US. A 'Clear all' button resets to a blank state. Loading a profile updates the URL, so the snapshot is immediately bookmarkable.",
    date: "2026-03-06",
  },
  // Employer match modeling for registered accounts
  {
    version: 112,
    title: "Employer match modeling for registered accounts",
    description: "Added optional employer match fields to RRSP, 401k, and Roth 401k asset entries: match percentage (e.g., 50% = employer matches half your contributions) and salary cap percentage (e.g., 6% = match is capped at 6% of annual salary). The projection engine adds employer match as additional monthly contributions. A new insight celebrates the employer match: 'Your employer match adds $X/year in free money — make sure you're contributing enough to get the full match.' All settings persist in URL state.",
    date: "2026-03-06",
  },
  // Age input and personalized benchmarks
  {
    version: 111,
    title: "Age input and personalized benchmarks",
    description: "Added an optional age field to the header (next to country/jurisdiction selector). When provided, all benchmark comparisons show personalized age-group medians with actual dollar amounts: 'Your net worth of $X is above/below the median of $Y for ages 35–44.' Each metric now displays an estimated percentile within the age group using a lognormal distribution model. Age is stored in the URL state and persists across sessions.",
    date: "2026-03-06",
  },
  // Inflation-adjusted projection toggle
  {
    version: 110,
    title: "Inflation-adjusted projection (real vs nominal)",
    description: "Added an 'Adjust for inflation' toggle to the Financial Projection chart. When enabled, all future values — chart data, 50-year summary table, and milestones — are deflated to today's purchasing power using a configurable annual inflation rate (default 2.5%). An info tooltip explains what 'today's dollars' means. Toggle state and rate are stored in URL params (ia=1&ir=2.5) so shared links preserve the setting.",
    date: "2026-03-06",
  },
  // Milestone E2E: UI polish and formula validation
  {
    version: 109,
    title: "Milestone E2E: UI polish and formula validation",
    description: "Comprehensive end-to-end test covering tax bracket tiered fill bars, full-format currency in explainer modals, net worth donut chart segments, Cash Flow Sankey investment income nodes, Fast Forward scenario options, and metric card consistency with explainer breakdowns.",
    date: "2026-03-06",
  },
  // Consistent currency formatting and composition tables on charts
  {
    version: 108,
    title: "Full currency in charts and composition tables",
    description: "Fixed currency formatting inconsistencies across all charts. Net worth donut chart center label now shows full formatted currency (e.g., CA$1,234,567) instead of compact notation. Removed duplicate recharts legend from Asset Allocation chart — the composition table below is the single source of truth. Projection chart milestone tables now show full currency values for precise reading.",
    date: "2026-03-06",
  },
  // Formula validation and projection bug fix
  {
    version: 107,
    title: "Formula validation and projection fix",
    description: "Comprehensive audit of all financial formulas. Fixed a bug where the projection chart did not subtract mortgage payments from the surplus, causing projected asset growth to be overstated for users with mortgages. Added 26 formula validation tests covering Net Worth, Monthly Surplus, Estimated Tax, Financial Runway, Debt-to-Asset Ratio, projection accumulation, and Cash Flow Sankey flow balance.",
    date: "2026-03-06",
  },
  // Enhanced Fast Forward what-if scenarios
  {
    version: 106,
    title: "Enhanced Fast Forward what-if scenarios",
    description: "Added powerful new scenario options: 'What if I retired today?' zeros all income and shows how long savings last. 'Max tax-sheltered accounts' auto-calculates contribution limits for TFSA, RRSP, 401k, IRA, etc. 'Downsize housing' slider converts property equity to liquid savings. 'ROI adjustment' slider models different market conditions. Quick-pick preset buttons for Conservative, Aggressive Saver, and Early Retirement scenarios.",
    date: "2026-03-06",
  },
  // Investment interest income in Cash Flow Sankey
  {
    version: 105,
    title: "Investment interest income in Cash Flow Sankey",
    description: "The Cash Flow Sankey diagram now includes investment interest income as separate income source nodes. Only accounts with income-type ROI tax treatment (Savings, GIC, HISA, etc.) are shown — capital gains and tax-sheltered accounts are excluded since they aren't realized cash flow. Interest income nodes appear in teal to visually distinguish from employment income.",
    date: "2026-03-06",
  },
  // Net worth donut chart
  {
    version: 104,
    title: "Net worth donut chart",
    description: "Replaced the waterfall bar chart with a donut/pie chart for net worth breakdown. Assets shown as colored segments in the outer ring, debts in an inner ring. Property equity uses a hatched pattern to distinguish illiquid from liquid assets. Center label shows net worth total. Compact legend below with all segments.",
    date: "2026-03-06",
  },
  // Full currency formatting in explainer modals
  {
    version: 103,
    title: "Full currency formatting in explainer modals",
    description: "Explainer modal totals and item rows now show full formatted currency (e.g., CA$12,476,711) instead of abbreviated values like $12477k. Items in a foreign currency display the currency code (e.g., USD). All explainer content — tax brackets, runway obligations, withdrawal order — uses proper Intl.NumberFormat with the correct currency code.",
    date: "2026-03-06",
  },
  // Tax bracket redesign
  {
    version: 102,
    title: "Tiered fill bar tax bracket visualization",
    description: "Replaced the flat stacked bracket bar and table with a tiered waterfall visualization. Each tax bracket is shown as a horizontal bar filled proportionally to income in that bracket, stacked vertically with lowest bracket at bottom. Filled brackets use a green-to-teal color gradient; unfilled brackets above your income show as dashed gray outlines. Both federal and provincial/state brackets are shown separately with subtotals. The visualization replaces both the old stacked bar and the bracket table.",
    date: "2026-03-06",
  },
  // Milestone E2E: unified chart and enhancements
  {
    version: 101,
    title: "Milestone E2E: unified chart and final enhancements",
    description: "Comprehensive E2E test suite covering the unified projection/burndown chart with mode tabs, 50-year projections with 40yr/50yr columns, dual federal/provincial bracket tables, investment income tax in the explainer, merged withdrawal tax in Financial Runway, $0 income tax explainer, ROI tax treatment toggle, scrollable source summary cards, and all modal close mechanisms. Full multi-step journey test across all features.",
    date: "2026-03-06",
  },
  // Investment return taxes in Estimated Tax
  {
    version: 100,
    title: "Investment interest income included in tax estimate",
    description: "Interest income from taxable savings accounts (Savings, GIC, HISA, etc.) is now included in the Estimated Tax calculation. Tax-free (TFSA, Roth IRA) and tax-deferred (RRSP, 401k) accounts are excluded. Capital gains ROI is not taxed annually. The tax explainer modal now shows a per-account breakdown of investment interest income with a note explaining the rules.",
    date: "2026-03-06",
  },
  // Always 50 years, X-axis in years, 40/50yr columns
  {
    version: 99,
    title: "50-year unified chart with consistent year axis",
    description: "Removed the 10/20/30 year timeline selector — the chart now always projects 50 years. Both 'Keep Earning' and 'Income Stops' modes share the same X-axis in years (0–50). Summary and per-asset tables now show 40yr and 50yr columns. If savings run out before 50 years in Income Stops mode, the line stays at $0 for the remainder.",
    date: "2026-03-06",
  },
  // Unified multi-mode chart
  {
    version: 98,
    title: "Unified projection and burndown chart",
    description: "Merged the projection chart and runway burndown into a single multi-mode chart with 'Keep Earning' and 'Income Stops' tabs. Keep Earning shows net worth growth projections with scenario toggles. Income Stops shows how long savings last if income stops. Added income/expense surplus subtitle to the projection view.",
    date: "2026-03-06",
  },
  // After-tax runway + merge withdrawal tax into runway
  {
    version: 97,
    title: "After-tax runway and merged withdrawal tax impact",
    description: "Financial Runway metric card now shows after-tax runway sub-line. Standalone Withdrawal Tax Impact card removed from sidebar — its content (tax treatment breakdown bar, account groupings, suggested withdrawal order with disclaimer, tax drag summary) is now consolidated into the Financial Runway explainer modal.",
    date: "2026-03-06",
  },
  // Dual Federal + Provincial/State Bracket Tables
  {
    version: 96,
    title: "Federal and provincial/state bracket tables in tax explainer",
    description: "The tax explainer now shows both federal and provincial/state bracket tables side by side, each with range, rate, and tax amount columns. Subtotals appear under each table. Zero-income mode shows bracket ranges and rates with dashes for tax amounts. Includes comprehensive milestone E2E tests.",
    date: "2026-03-06",
  },
  // Withdrawal Pills Overflow Fix
  {
    version: 95,
    title: "Fix withdrawal order pills overflowing container",
    description: "Withdrawal order pills now wrap to multiple lines instead of overflowing their container when there are many accounts. Long account names are truncated with ellipsis at 150px max width. Applied to both the Withdrawal Tax Summary card and the Runway Burndown chart.",
    date: "2026-03-06",
  },
  // Smart Tax Classification
  {
    version: 94,
    title: "Smart tax treatment classification with overrides",
    description: "Tax treatment is now auto-detected using keyword matching instead of exact name lookups. Custom account names like 'BP 401k' or 'Company RRSP' are correctly classified. Each asset shows a colored pill (green=tax-free, rose=tax-deferred, amber=taxable) that can be clicked to override the auto-detected classification. Overrides persist in URL state.",
    date: "2026-03-06",
  },
  // New Account Category
  {
    version: 93,
    title: "Roth 401k support",
    description: "Added Roth 401k as a distinct US asset category. It appears in the category suggestions after 401k, defaults to 7% ROI, is classified as tax-free for withdrawal modeling, and the ROI tax treatment toggle is hidden since growth is tax-free.",
    date: "2026-03-06",
  },
  // Chart Clarity
  {
    version: 92,
    title: "Simplified runway burndown chart",
    description: "Redesigned the runway burndown chart for clarity. Replaced confusing stacked per-account areas with 2-3 simple lines: solid green for 'With investment growth', dashed gray for 'Without growth', and amber for 'After withdrawal taxes' (only when tax drag > 0). Added milestone markers where each scenario hits $0, a 6-month emergency fund threshold line, a plain-English summary sentence above the chart, a clean legend, and a compact starting balances row below.",
    date: "2026-03-06",
  },
  // Tax Treatment Enhancements
  {
    version: 91,
    title: "Asset ROI tax treatment toggle",
    description: "Added a toggle on asset entries to specify whether investment returns are taxed as capital gains or interest income. Savings-type accounts (Savings, GIC, HISA, Money Market) default to interest income; investment accounts default to capital gains. Tax-sheltered accounts (TFSA, Roth IRA, FHSA, HSA) hide the toggle since ROI is tax-free. The setting affects withdrawal tax simulations and persists in URL state.",
    date: "2026-03-06",
  },
  // UI Polish (Milestone 12)
  {
    version: 90,
    title: "Runway burndown chart moved to main page",
    description: "The runway burndown chart (stacked area chart showing account drawdown over time) has been moved from the Financial Runway explainer modal to the main page as a full-width section below the Projection Chart. The chart is wrapped in ZoomableCard for fullscreen viewing. The explainer modal now shows a condensed summary with monthly obligations, withdrawal order, and a note pointing to the main page chart.",
    date: "2026-03-06",
  },
  {
    version: 89,
    title: "Estimated Tax card click-to-explain when tax is $0",
    description: "Clicking the Estimated Tax metric card now opens the explainer even when income is $0. Shows the jurisdiction's federal tax bracket structure for reference with a friendly message prompting users to add income. Bracket rates and ranges are displayed as a reference table, with 0% effective and marginal rates.",
    date: "2026-03-06",
  },
  {
    version: 88,
    title: "Withdrawal Tax Impact card auto-expanded with disclaimer",
    description: "The Withdrawal Tax Impact card now shows account breakdowns and withdrawal order expanded by default instead of hiding them behind a 'Show details' toggle. The withdrawal order is renamed from 'Optimal' to 'Suggested' with a subtle disclaimer noting that it's a rough suggestion and users should consult a tax professional for personalized advice.",
    date: "2026-03-06",
  },
  {
    version: 87,
    title: "Scrollable source summary cards with frozen total pane",
    description: "Source summary cards in explainer modals now show all items instead of truncating at 5 with '+N more'. Long item lists scroll vertically within a 200px container with a thin stone-colored scrollbar. The total row is sticky at the bottom with a subtle shadow separator so it stays visible while scrolling. Cards have increased padding and larger total font, and the explainer modal is wider (max-w-xl) for more breathing room.",
    date: "2026-03-06",
  },
  // Metric-Specific Explainers (Milestone 11)
  {
    version: 86,
    title: "Asset ROI included in Monthly Surplus calculation and explainer",
    description: "Investment returns are now factored into the Monthly Surplus metric. For each asset with a non-zero ROI, the estimated monthly return (balance * ROI / 12) is added to the income side of the surplus formula. The Monthly Surplus explainer modal now shows an 'Investment Returns' sub-section with green dashed border, listing each asset's estimated monthly return (e.g., 'RRSP ($28k @ 5%) → +$117/mo') with a total row. A new data flow connection for investment returns also appears in the surplus source cards.",
    date: "2026-03-06",
  },
  {
    version: 85,
    title: "Interactive burndown chart in Financial Runway explainer",
    description: "Clicking the Financial Runway metric card now opens a burndown chart showing account balances depleting over time as stacked areas per account category (using recharts AreaChart). Includes a dashed 'without growth' comparison line, a tax drag overlay showing the impact of withdrawal taxes, a numbered withdrawal order list with tax treatment labels and estimated tax costs, and a monthly obligations breakdown. The runwayAfterTax sub-line was removed from the metric card since tax drag is now visualized directly in the chart.",
    date: "2026-03-06",
  },
  {
    version: 84,
    title: "Tax bracket visualization in Estimated Tax explainer",
    description: "Clicking the Estimated Tax metric card now opens a tax-specific explainer modal with a horizontal stacked bar showing income by tax bracket (colored segments from light to deep green), federal and provincial/state tax breakdown with jurisdiction name, effective vs marginal rate comparison, capital gains section (CA inclusion rates or US bracket rates) when applicable, and a Gross → Tax → After-tax income flow summary.",
    date: "2026-03-06",
  },
  // SVG Refinements
  {
    version: 83,
    title: "Smoother hand-drawn SVG circles and lines",
    description: "Replaced the jittery 24-segment quadratic bezier ovals with smooth 4-curve cubic bezier ovals (one per quadrant) that look like a confident teacher circling something with a single fluid pen stroke. Reduced line jitter from max 4px to 2.5px for gentler curves. Jitter amplitude now scales with oval size (1-2px for small, 2-3px for large).",
    date: "2026-03-06",
  },
  // Whiteboard Explainer Mode (Milestone 10)
  {
    version: 82,
    title: "E2E test for whiteboard explainer modal",
    description: "Comprehensive milestone E2E test suite (19 tests) covering all five metric explainer modals (Net Worth, Monthly Surplus, Estimated Tax, Financial Runway, Debt-to-Asset Ratio) with source summary card verification, insight card interaction, three close mechanisms (Escape, X button, backdrop click), entrance animations, hand-drawn SVG annotations (ovals, connectors, sum bar with round stroke caps), arithmetic layout with operators and result, mobile behavior at 375px, keyboard navigation (Tab, Enter, Escape), cursor hints, and a full multi-step journey test across all metrics.",
    date: "2026-03-05",
  },
  {
    version: 81,
    title: "Whiteboard-style SVG annotations and arithmetic layout",
    description: "Enhanced ExplainerModal with full whiteboard aesthetic: hand-drawn connector lines with arrowheads (green for positive, red for negative) flowing from source cards to the result area, sequenced animations (source cards fade in, ovals draw on, connectors draw, operators pop in, sum bar draws, result counts up), count-up animation for the result value using requestAnimationFrame, and tuned hand-drawn style with opacity 0.7, round stroke caps/joins, and sinusoidal jitter for organic whiteboard feel.",
    date: "2026-03-05",
  },
  {
    version: 80,
    title: "Source summary cards for explainer modal",
    description: "Added SourceSummaryCard component to the explainer modal. Each source section now shows a detailed read-only card with section icon, individual items with values, a bold total with hand-drawn oval annotation, and colored left border (green for positive, red for negative). Sections with many items show top 5 by position and a '+N more' summary row. Extended SourceMetadata with items array and updated CollapsibleSection to pass item-level data from all 6 entry types (assets, debts, income, expenses, property, stocks).",
    date: "2026-03-05",
  },
  {
    version: 79,
    title: "Replace spotlight dimming with click-to-explain whiteboard mode",
    description: "Complete overhaul of data-flow visualization: removed hover-triggered spotlight/dimming system (SpotlightOverlay, FormulaBar, full-page overlay, data-dataflow-highlighted CSS). Replaced with click-triggered whiteboard explainer modal that opens when clicking any metric card or insight card. Modal shows metric title, value, source summary cards with colored left borders (green positive, red negative), hand-drawn SVG oval annotations around values, arithmetic operators between sources, and a sum bar with result. Hand-drawn SVG utilities (handDrawnOval, handDrawnLine) create wobbly organic paths. Modal animates in/out with scale+fade. Closes on Escape, X button, or backdrop click. Added 'click to explain' hint on metric cards.",
    date: "2026-03-05",
  },
  // Spotlight Dimming System (Milestone 9)
  {
    version: 78,
    title: "E2E test for spotlight dimming system",
    description: "Comprehensive milestone E2E test validating the spotlight dimming system: Net Worth card shows dim overlay with spotlighted assets/debts/stocks sections and color-coded formula bar terms; Monthly Surplus formula bar shows after-tax income minus expenses; formula bar displays correct terms for Estimated Tax, Financial Runway, and Debt-to-Asset Ratio; spotlight clears on mouse leave with no residual highlights; mobile viewport shows formula bar fixed at bottom; keyboard Tab triggers spotlight on focus with aria-live announcements; no Cumulative Layout Shift during spotlight activation/deactivation; insight card hover shows spotlight with data-dataflow-active-target attribute.",
    date: "2026-03-05",
  },
  {
    version: 77,
    title: "Replace SVG arrow overlay with spotlight dimming system",
    description: "Replaced SVG arrow overlay with a spotlight dimming system: a dark backdrop dims the page while source sections and the active metric card rise above it with colored borders and shadows. Added FormulaBar component showing color-coded computation terms as pills (green positive, red negative, bold result). Added activeTargetMeta to DataFlowContext for formula display. Mobile formula bar fixed at bottom of viewport. Removed all SVG geometry functions, arrow animations, and particle effects.",
    date: "2026-03-05",
  },
  // Data Flow Visualization (Milestone 8)
  {
    version: 76,
    title: "Full E2E test for data-flow arrow visualization",
    description: "Comprehensive milestone E2E test covering all data-flow arrow features from tasks 69-75: hovering each metric card (Net Worth, Monthly Surplus, Estimated Tax, Financial Runway, Debt-to-Asset Ratio) shows correct source arrows; insight card hover shows light-style arrows; arrows disappear on mouse leave; source sections highlight with correct positive/negative signs; collapsed sections still receive arrows; mobile viewport uses highlight-only mode without SVG overlay; arrows update when financial data changes; keyboard focus activates arrows with aria-live announcements.",
    date: "2026-03-05",
  },
  {
    version: 75,
    title: "Arrow visual polish — particles, responsive, and accessibility",
    description: "Flowing particle animation along arrow paths with staggered timing. Mobile (< 768px) switches to highlight-only mode with pulsing borders instead of SVG arrows. Accessibility: aria-live region announces data sources to screen readers. Performance: max 8 simultaneous arrows prioritized by value, will-change: transform on SVG overlay. Label pills styled as rounded capsules matching arrow color.",
    date: "2026-03-05",
  },
  {
    version: 74,
    title: "Insight panel cards show data-flow arrows on hover",
    description: "Each insight card in the InsightsPanel now shows animated SVG arrows to its relevant source sections on hover or focus. Insight types map to sources: runway → assets + expenses, surplus → income + expenses, net-worth → assets + debts, savings-rate → income + expenses, debt-interest → debts, tax → income, withdrawal-tax → assets. Insight arrows use a lighter style (thinner, more transparent) than metric card arrows to avoid visual overload.",
    date: "2026-03-05",
  },
  {
    version: 73,
    title: "Wire remaining metric cards with data-flow arrows",
    description: "Estimated Tax, Financial Runway, and Debt-to-Asset Ratio metric cards now show data-flow arrows on hover. Estimated Tax shows a green arrow from Income with the effective tax rate and gross income. Financial Runway shows green arrows from Assets and Stocks (numerator) and red arrows from Expenses and Mortgage (denominator). Debt-to-Asset Ratio shows green arrows from all asset sources and red arrows from Debts and Mortgage. All five metric cards are now fully wired.",
    date: "2026-03-05",
  },
  {
    version: 72,
    title: "Monthly Surplus metric card data-flow arrows on hover",
    description: "Hovering the Monthly Surplus metric card now shows animated SVG arrows: green arrow from Income (after-tax amount), red arrows from Expenses, asset Contributions (if any), and Mortgage payments (if any). The surplus formula is immediately obvious — income flows in green, everything else flows in red. Same staggered entrance, source highlights, and fade-out behavior as Net Worth.",
    date: "2026-03-05",
  },
  {
    version: 71,
    title: "Net Worth metric card data-flow arrows on hover",
    description: "Hovering the Net Worth metric card now shows animated SVG arrows connecting it to the Assets, Stocks, Property (if present), and Debts source sections. Green arrows for positive contributions, red for debts. Source sections get a color-matched highlight glow. Arrows fade in with staggered animation and disappear on mouse leave. Works with keyboard focus too.",
    date: "2026-03-05",
  },
  {
    version: 70,
    title: "Data-flow source registration for all entry sections",
    description: "All 6 entry sections (Assets, Debts, Income, Expenses, Property, Stocks) now register as data-flow sources via DataFlowContext. Individual entry rows also register as sub-sources for granular arrow targeting. CollapsibleSection switches registration between collapsed header and expanded container. DataFlowSourceItem component handles row-level registration with graceful no-op outside provider.",
    date: "2026-03-05",
  },
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
    { milestone: "Tax Credits & Deductions", range: [140, 146] as const },
    { milestone: "UI Polish", range: [88, 139] as const },
    { milestone: "Metric-Specific Explainers", range: [83, 87] as const },
    { milestone: "Whiteboard Explainer Mode", range: [79, 82] as const },
    { milestone: "Spotlight Dimming System", range: [77, 78] as const },
    { milestone: "Data Flow Visualization", range: [69, 76] as const },
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
