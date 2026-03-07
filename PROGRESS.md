# Progress Log

<!--
  This file is automatically updated by Ralph after each task iteration.
  It serves as a running log of what was done and provides context for
  future iterations to pick up where the last one left off.

  Do not manually edit entries below unless correcting errors.
-->

## Summary
- **Total Tasks**: 120
- **Completed**: 111
- **Remaining**: 9
- **Last Updated**: 2026-03-06

<!-- Tasks 1-90 archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

## Task 102: Redesign tax bracket visualization with tiered fill bars
- **Date**: 2026-03-06
- **Files**: `src/components/DataFlowArrows.tsx` (replaced `BracketTable` with `TieredBracketBars`, removed stacked bracket bar), `src/lib/financial-state.ts` (updated `computeBracketSegments` to return ALL brackets including unfilled ones above income), `src/lib/changelog.ts`, `tests/unit/tiered-bracket-bars.test.tsx` (new), `tests/e2e/tiered-bracket-bars.spec.ts` (new), `tests/unit/tax-explainer.test.tsx` (updated test IDs), `tests/unit/milestone-10-e2e-infra.test.ts` (updated test IDs), `tests/unit/changelog.test.ts`
- **Tests**: T1: 1245 passed, 0 failed (76 files). T2: 36 passed, 0 failed (tiered-bracket-bars + tax-explainer + milestone-10 + milestone-11)
- **Screenshots**:
  ![Tiered bracket bars](screenshots/task-102-tiered-bracket-bars.png)
  ![Provincial bracket bars](screenshots/task-102-provincial-bracket-bars.png)
  ![Unfilled bracket tiers](screenshots/task-102-unfilled-bracket-tiers.png)
- **Notes**: Pre-existing test failures in zero-income E2E tests were fixed in a separate commit — they assumed deleting salary alone produced zero income, but Task 100's investment interest from assets kept income non-zero. Fix: also delete assets before checking zero-income behavior.

## Task 103: Fix currency formatting in explainer modals
- **Date**: 2026-03-06
- **Files**: `src/components/DataFlowArrows.tsx` (added `formatCurrency` import, `homeCurrency` to context/provider/ExplainerModal/SourceSummaryCard/TaxExplainerContent/RunwayExplainerContent/InvestmentReturnsSummary, `currency` field on SourceMetadataItem, replaced hardcoded "$" formatting with Intl.NumberFormat), `src/app/page.tsx` (pass `homeCurrency` to DataFlowProvider, `currency` to asset/debt/property items, updated `fmtLabel` to use `formatCurrencyCompact`), `src/lib/changelog.ts`, `tests/unit/changelog.test.ts`, `tests/unit/explainer-currency-formatting.test.tsx` (new), `tests/e2e/explainer-currency-formatting.spec.ts` (new)
- **Tests**: T1: 1256 passed, 0 failed (77 files). T2: 4 passed, 0 failed.
- **Screenshots**:
  ![Explainer full currency](screenshots/task-103-explainer-full-currency.png)
  ![Explainer CAD currency](screenshots/task-103-explainer-cad-currency.png)
  ![Tax explainer full currency](screenshots/task-103-tax-explainer-full-currency.png)

## Task 104: Replace Net Worth waterfall chart with donut/pie chart
- **Date**: 2026-03-06
- **Files**: `src/components/NetWorthDonutChart.tsx` (new), `src/app/page.tsx` (swap component), `src/lib/changelog.ts`, `tests/unit/donut-chart.test.ts` (new), `tests/e2e/donut-chart.spec.ts` (new), `tests/e2e/waterfall-chart.spec.ts` (updated testids), `tests/unit/milestone-5-e2e-infra.test.ts` (updated testid), `tests/unit/changelog.test.ts`
- **Tests**: T1: 1266 passed, 0 failed (78 files). T2: 9 passed, 0 failed.
- **Screenshots**:
  ![Donut chart default](screenshots/task-104-donut-chart-default.png)
  ![Donut center label](screenshots/task-104-donut-center-label.png)
  ![Donut legend](screenshots/task-104-donut-legend.png)
- **Notes**: Old `NetWorthWaterfallChart.tsx` still exists (not deleted) — old unit tests still pass against it. Pre-existing milestone-5 E2E failures (ZoomableCard strict mode violations on allocation-chart, benchmark, sankey testids) fixed in separate commit.

## Task 105: Include investment interest income in Cash Flow Sankey
- **Date**: 2026-03-06
- **Files**: `src/lib/sankey-data.ts` (added `InvestmentReturnItem` interface, `investmentReturns` field on `CashFlowInput`, investment-income nodes in `buildSankeyData`, teal color in `SANKEY_COLORS`), `src/components/CashFlowSankey.tsx` (added `investmentReturns` prop, legend entry for Interest Income, updated `isLeft` for investment-income nodes), `src/app/page.tsx` (filter `computeMonthlyInvestmentReturns` for income-type accounts and pass to Sankey), `src/lib/changelog.ts`, `tests/unit/sankey-investment-returns.test.ts` (new), `tests/e2e/sankey-investment-returns.spec.ts` (new), `tests/unit/sankey-data.test.ts` (updated SANKEY_COLORS types), `tests/unit/changelog.test.ts`
- **Tests**: T1: 1276 passed, 0 failed (79 files). T2: 3 passed (sankey-investment-returns). T3: 330 passed, 0 failed (full suite).
- **Screenshots**:
  ![Sankey with investment returns](screenshots/task-105-sankey-investment-returns.png)
  ![Sankey legend with interest income](screenshots/task-105-sankey-legend-interest.png)

## Task 106: Enhance Fast Forward what-if scenarios
- **Date**: 2026-03-06
- **Files**: `src/lib/scenario.ts` (added retireToday, maxTaxSheltered, housingDownsizePercent, roiAdjustment fields, TAX_SHELTERED_LIMITS constants, isTaxSheltered/getMonthlyLimit/applyPreset helpers, scenarioRunwayMonths in comparison), `src/components/FastForwardPanel.tsx` (added preset buttons, retire-today toggle, max-tax-sheltered toggle with account limit details, housing downsize slider, ROI adjustment slider, runway estimate display), `src/lib/changelog.ts` (added v106 entry), `tests/unit/scenario-enhanced.test.ts` (new — 31 tests), `tests/e2e/fast-forward-enhanced.spec.ts` (new — 7 tests), `tests/unit/changelog.test.ts` (updated counts)
- **Tests**: T1: 1307 passed, 0 failed (80 files). T2: 7 passed (fast-forward-enhanced).
- **Screenshots**:
  ![Scenario presets](screenshots/task-106-presets.png)
  ![Conservative preset](screenshots/task-106-conservative-preset.png)
  ![Early retirement](screenshots/task-106-early-retirement.png)
  ![Retire today](screenshots/task-106-retire-today.png)
  ![ROI adjustment](screenshots/task-106-roi-adjustment.png)
- **Notes**: No changes needed in page.tsx — FastForwardPanel already receives the full `state` prop. Added 5 new scenario types: retire today (zeros income, shows runway), max tax-sheltered (auto-calculates TFSA/RRSP/401k/IRA limits), housing downsize (slider with equity release), ROI adjustment (global ±5% slider), and 3 quick presets (Conservative, Aggressive Saver, Early Retirement).

## Task 107: Validate all formulas and fix contextual inconsistencies
- **Date**: 2026-03-06
- **Files**: `src/lib/projections.ts` (fixed baseSurplus to subtract mortgage payments, fixed drawdown threshold to include mortgage), `src/lib/changelog.ts` (added v107 entry), `tests/unit/formula-validation.test.ts` (new — 26 tests), `tests/e2e/formula-validation.spec.ts` (new — 4 tests), `tests/unit/changelog.test.ts` (updated counts)
- **Tests**: T1: 1333 passed, 0 failed (81 files). T2: 4 passed (formula-validation).
- **Screenshots**:
  ![Net worth explainer](screenshots/task-107-net-worth-explainer.png)
  ![Tax explainer](screenshots/task-107-tax-explainer.png)
  ![Runway explainer](screenshots/task-107-runway-explainer.png)
  ![All metric cards](screenshots/task-107-all-metric-cards.png)
- **Notes**: **Bug fixed**: Projection chart `baseSurplus` was not subtracting `totalMortgagePayments`, causing projected asset growth to be overstated for users with mortgages. The surplus was being added to savings while mortgage payments were also being paid from nowhere. Drawdown threshold also updated to include mortgage in the income shortfall calculation. All other formulas (Net Worth, Monthly Surplus, Estimated Tax, Financial Runway, Debt-to-Asset Ratio, Sankey flows) were verified correct.

## Task 109: [MILESTONE] E2E test for UI polish and formula validation
- **Date**: 2026-03-06
- **Files**: `tests/e2e/milestone-e2e-109.spec.ts` (new — 11 tests), `tests/unit/milestone-12-e2e-infra.test.ts` (new — 12 tests), `src/lib/changelog.ts` (added v109 entry, updated milestone range), `tests/unit/changelog.test.ts` (updated counts)
- **Tests**: T1: 1345 passed, 0 failed (82 files). T2: 11 passed (milestone-e2e-109). T3: 345 passed, 0 failed (full suite).
- **Screenshots**:
  ![Tax bracket bars](screenshots/task-109-tax-bracket-bars.png)
  ![Explainer full currency](screenshots/task-109-explainer-full-currency.png)
  ![Tax explainer full currency](screenshots/task-109-tax-explainer-full-currency.png)
  ![Donut chart](screenshots/task-109-donut-chart.png)
  ![Sankey investment income](screenshots/task-109-sankey-investment-income.png)
  ![Fast forward options](screenshots/task-109-fast-forward-options.png)
  ![Fast forward early retirement](screenshots/task-109-fast-forward-early-retirement.png)
  ![Net worth match](screenshots/task-109-net-worth-match.png)
  ![Tax breakdown rates](screenshots/task-109-tax-breakdown-rates.png)
  ![Runway breakdown](screenshots/task-109-runway-breakdown.png)
  ![Full dashboard](screenshots/task-109-full-dashboard.png)
- **Notes**: TASKS.md was renumbered during this iteration — original task 108 (E2E milestone) became task 109, and a new task 108 (currency formatting) was inserted ahead of it. Implemented the E2E milestone test as task 109. Changelog has version gap at 108 (pending task).

## Task 110: Inflation-adjusted projection toggle
- **Date**: 2026-03-06
- **Files**: `src/lib/projections.ts` (added `deflateProjectionPoints`), `src/lib/url-state.ts` (added `getInflationFromURL`, `updateInflationURL`), `src/components/ProjectionChart.tsx` (added inflation toggle UI, `displayPoints` memo with deflation, stopped click propagation so ZoomableCard doesn't open), `src/lib/changelog.ts` (v110 entry, expanded UI Polish range to 88-120), `tests/unit/inflation-deflation.test.ts` (new — 13 tests), `tests/e2e/inflation-toggle.spec.ts` (new — 6 tests), `tests/unit/changelog.test.ts` (updated counts)
- **Tests**: T1: 1370 passed, 0 failed (84 files). T2: 6 passed (inflation-toggle). T3: 357 passed, 0 failed (full suite). Build: passes.
- **Screenshots**:
  ![Inflation toggle off](screenshots/task-110-inflation-toggle-off.png)
  ![Inflation toggle on](screenshots/task-110-inflation-toggle-on.png)
  ![Inflation values lower](screenshots/task-110-inflation-values-lower.png)
  ![Inflation rate changed](screenshots/task-110-inflation-rate-changed.png)
  ![Now column unchanged](screenshots/task-110-inflation-now-unchanged.png)
- **Notes**: Inflation toggle uses `onClick={(e) => e.stopPropagation()}` on the controls container to prevent ZoomableCard from opening when interacting with the toggle. URL params `ia=1` and `ir=<rate>` persist the toggle state separately from the main `s=` state param. T3 was triggered (task 110 is the 110th completed task, divisible by 5) — all 357 E2E tests pass.

## Task 111: Age input and personalized benchmarks
- **Date**: 2026-03-06
- **Files**: `src/lib/benchmarks.ts` (added `estimatePercentile` with lognormal model, added `percentile`/`ageGroupLabel` to `BenchmarkComparison`, updated messages to include specific dollar amounts), `src/app/page.tsx` (added `AgeInputHeader` component in header next to `CountryJurisdictionSelector`), `src/components/BenchmarkComparisons.tsx` (show percentile badge per metric), `src/lib/changelog.ts` (v111 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/benchmarks.test.ts` (updated pre-existing message assertions), `tests/unit/age-benchmarks.test.ts` (new — 17 tests), `tests/e2e/age-benchmarks.spec.ts` (new — 8 tests)
- **Tests**: T1: 1392 passed, 0 failed (85 files). T2: 8 passed (age-benchmarks). Build: passes.
- **Screenshots**:
  ![Age header display](screenshots/task-111-age-header-display.png)
  ![Personalized benchmarks](screenshots/task-111-personalized-benchmarks.png)
  ![Benchmark percentile](screenshots/task-111-benchmark-percentile.png)
  ![Age persists](screenshots/task-111-age-persists.png)
  ![Card age syncs header](screenshots/task-111-card-age-syncs-header.png)
- **Notes**: Age was already stored in URL state (`ag` field in CompactState) — no url-state changes needed. Pre-existing `benchmarks.test.ts` message assertions updated to match new format (specific dollar amounts in messages). Percentile uses lognormal model (σ=1.0) which is a standard approximation for wealth/income distributions.

## Task 112: Employer match modeling for registered accounts
- **Date**: 2026-03-06
- **Files**: `src/components/AssetEntry.tsx` (added `employerMatchPct`/`employerMatchCap` to `Asset` interface, `EMPLOYER_MATCH_ELIGIBLE` set, `computeEmployerMatchMonthly` helper, `annualEmploymentSalary` prop, employer match UI badges, projection includes match), `src/lib/url-state.ts` (`emp`/`emc` fields encode/decode), `src/lib/projections.ts` (employer match added to `monthlyContribution`), `src/lib/financial-state.ts` (`employerMatchAnnual` in `toFinancialData`), `src/lib/insights.ts` (`"employer-match"` type + insight), `src/components/InsightsPanel.tsx` (`"employer-match"` source), `src/app/page.tsx` (`annualEmploymentSalary` computed + passed), `src/lib/changelog.ts`, `tests/unit/changelog.test.ts`, `tests/unit/employer-match.test.ts` (new), `tests/e2e/employer-match.spec.ts` (new)
- **Tests**: T1: 1410 passed, 0 failed (86 files). T2: 8 passed (employer-match). Build: passes.
- **Screenshots**:
  ![Employer match empty](screenshots/task-112-employer-match-empty.png)
  ![Employer match amount](screenshots/task-112-employer-match-amount.png)
  ![Employer match insight](screenshots/task-112-employer-match-insight.png)
  ![Employer match capped](screenshots/task-112-employer-match-capped.png)

## Task 108: Consistent currency formatting and composition tables on charts
- **Date**: 2026-03-06
- **Files**: `src/components/NetWorthDonutChart.tsx` (center label → full currency, text-lg → text-sm), `src/components/AssetAllocationChart.tsx` (removed recharts Legend component, reduced chart height), `src/components/ProjectionChart.tsx` (added formatTableCurrency = fmt.full, used in both milestone tables), `src/lib/changelog.ts` (added v108 entry), `tests/unit/chart-currency-formatting.test.tsx` (new — 15 tests), `tests/e2e/chart-currency-formatting.spec.ts` (new — 4 tests), `tests/unit/changelog.test.ts` (updated counts)
- **Tests**: T1: 1357 passed, 0 failed (83 files). T2: 4 passed (chart-currency-formatting). Build: passes.
- **Screenshots**:
  ![Donut center full currency](screenshots/task-108-donut-center-full-currency.png)
  ![Donut composition table](screenshots/task-108-donut-composition-table.png)
  ![Allocation composition table](screenshots/task-108-allocation-composition-table.png)
  ![Projection table full currency](screenshots/task-108-projection-table-full-currency.png)
- **Notes**: Donut chart composition table was already present from Task 104 (testid `donut-composition-table`). Fixed pre-existing E2E test failures in `donut-chart.spec.ts` that referenced wrong testid (`donut-legend` instead of `donut-composition-table`). Asset allocation chart had both a recharts Legend AND a custom composition table — removed the recharts Legend to avoid duplication.
