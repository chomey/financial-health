export interface ChangelogEntry {
  version: number;
  title: string;
  description: string;
  date: string;
}

export const CHANGELOG: ChangelogEntry[] = [
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
    { milestone: "UI Polish", range: [88, 120] as const },
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
