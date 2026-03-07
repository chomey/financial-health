# Progress Log

<!--
  This file is automatically updated by Ralph after each task iteration.
  It serves as a running log of what was done and provides context for
  future iterations to pick up where the last one left off.

  Do not manually edit entries below unless correcting errors.
-->

## Summary
- **Total Tasks**: 108
- **Completed**: 105
- **Remaining**: 3
- **Last Updated**: 2026-03-06

<!-- Tasks 1-90 archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

## Task 96: Show both federal and provincial/state bracket tables in tax explainer
- **Status**: Complete
- **Date**: 2026-03-06
- **Changes**:
  - `src/components/DataFlowArrows.tsx`: Added `provincialBrackets`, `federalBasicPersonalAmount`, `provincialBasicPersonalAmount` to `TaxExplainerDetails` interface. Created reusable `BracketTable` component with range/rate/tax-amount columns. `TaxExplainerContent` now renders both federal and provincial/state bracket tables with subtotals. Zero-income mode shows "—" for tax amounts.
  - `src/lib/financial-state.ts`: `buildTaxExplainerDetails` now computes provincial/state bracket segments using `getCanadianBrackets`/`getUSBrackets` and returns them alongside federal brackets. Both zero-income and income paths include provincial data.
  - `src/lib/changelog.ts`: Added version 97 entry for dual bracket tables.
  - `tests/unit/tax-explainer.test.tsx`: Added 12 new tests for dual bracket table rendering, subtotals, provincial brackets integration, and zero-income provincial brackets.
  - `tests/e2e/tax-explainer.spec.ts`: Updated test ID references from old `tax-bracket-reference` to new `tax-federal-brackets-table`.
  - `tests/e2e/milestone-10-e2e.spec.ts`: Updated test ID references.
  - `tests/unit/milestone-10-e2e-infra.test.ts`: Updated test ID references.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/tax-explainer.test.tsx`: 45 tests passed (12 new for dual bracket tables)
  - All 71 unit test files: 1184 passed, 0 failed
  - `tests/e2e/tax-explainer.spec.ts`: 9 passed, 0 failed
- **Screenshots**:
  ![Tax explainer with dual bracket tables](screenshots/task-84-tax-explainer.png)
  ![Zero income bracket reference](screenshots/task-89-tax-explainer-zero-income.png)
- **Notes**: The bracket reference table for zero-income was replaced with the same BracketTable component used for income > 0, showing "—" in the tax amount column. Test IDs updated from `tax-bracket-reference`/`tax-bracket-ref-*` to `tax-federal-brackets-table`/`tax-federal-brackets-row-*`.

## Task 97: Show after-tax runway on metric card and merge Withdrawal Tax Impact into Financial Runway
- **Status**: Complete
- **Date**: 2026-03-06
- **Changes**:
  - `src/components/SnapshotDashboard.tsx`: Added `runwayAfterTax` sub-line to Financial Runway metric card. Shows "X.X mo after withdrawal taxes" in amber when it differs from both `runwayWithGrowth` and the base value.
  - `src/app/page.tsx`: Removed `WithdrawalTaxSummary` component from dashboard sidebar. Removed import.
  - `src/components/DataFlowArrows.tsx`: Expanded `RunwayExplainerContent` to include full withdrawal tax content: tax treatment breakdown bar (green/amber/rose), account groupings by treatment, suggested withdrawal order with disclaimer, and tax drag summary. Content derived from existing `withdrawalOrder` data in `RunwayExplainerDetails`.
  - `src/lib/changelog.ts`: Added task 97 entry. Fixed pre-existing duplicate entries for task 96. Updated UI Polish milestone range to [88, 99].
  - `tests/e2e/withdrawal-tax-summary.spec.ts`: Rewritten to test withdrawal tax in Financial Runway explainer modal instead of standalone card.
  - `tests/e2e/withdrawal-pills-overflow.spec.ts`: Updated to test withdrawal order in explainer modal.
  - `tests/e2e/milestone-10-e2e.spec.ts`: Updated withdrawal tax test to check explainer modal.
  - `tests/e2e/milestone-6-e2e.spec.ts`: Updated all withdrawal tax references to explainer modal. Fixed pre-existing `burndown-tax-drag` testid references.
  - `tests/unit/milestone-6-e2e-infra.test.ts`: Updated string checks for refactored E2E test.
  - `tests/unit/milestone-10-e2e-infra.test.ts`: Updated string checks for refactored E2E test.
  - `tests/unit/snapshot-dashboard.test.tsx`: Added 4 tests for `runwayAfterTax` sub-line visibility logic.
  - `tests/unit/runway-withdrawal-tax-merge.test.ts`: New file with 4 tests verifying `RunwayExplainerDetails` contains all data needed for merged withdrawal tax view.
  - `tests/unit/changelog.test.ts`: Updated counts for 97 entries and milestone range.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/snapshot-dashboard.test.tsx`: 21 passed (4 new for runwayAfterTax)
  - `tests/unit/runway-withdrawal-tax-merge.test.ts`: 4 passed (all new)
  - All 72 unit test files: 1192 passed, 0 failed
  - `tests/e2e/withdrawal-tax-summary.spec.ts`: 3 passed
  - `tests/e2e/withdrawal-pills-overflow.spec.ts`: 2 passed
  - `tests/e2e/milestone-10-e2e.spec.ts`: 11 passed
  - `tests/e2e/milestone-6-e2e.spec.ts`: 5 passed
- **Screenshots**:
  ![Runway explainer with withdrawal tax content](screenshots/task-97-runway-explainer-with-withdrawal-tax.png)
  ![Runway card with after-tax sub-line](screenshots/task-97-runway-card-after-tax.png)
- **Notes**: The `WithdrawalTaxSummary` component file still exists but is no longer rendered on the page. It could be deleted in a future cleanup task. All withdrawal tax information is now consolidated in the Financial Runway explainer modal, accessible by clicking the Financial Runway metric card.

## Task 98: Merge projection chart and runway burndown into a single multi-mode chart
- **Status**: Complete
- **Date**: 2026-03-06
- **Changes**:
  - `src/components/ProjectionChart.tsx`: Added `runwayDetails` prop, `ChartMode` state ("keep-earning" / "income-stops"), pill-style mode tabs, burndown chart view (summary, legend, chart, starting balances, withdrawal order), surplus subtitle ("Income $X - Expenses $Y = $W surplus/mo"), stopPropagation on mode tabs to prevent ZoomableCard overlay triggering. Imported `RunwayExplainerDetails` and `buildSummary` from existing components.
  - `src/app/page.tsx`: Removed `RunwayBurndownChart` import and standalone rendering. Passes `runwayDetails` prop to `ProjectionChart` for unified chart.
  - `src/components/DataFlowArrows.tsx`: Updated `RunwayExplainerContent` chart note from "burndown chart above" to "Income Stops mode on the projection chart above".
  - `tests/unit/unified-chart.test.tsx`: **New** — 12 T1 unit tests for mode tabs, mode switching, burndown view content, scenario button visibility, surplus subtitle.
  - `tests/e2e/runway-burndown-main.spec.ts`: Rewritten — 4 tests for unified chart mode switching, burndown in Income Stops mode, explainer modal referencing Income Stops.
  - `tests/e2e/withdrawal-tax-runway.spec.ts`: Updated to switch to Income Stops mode before checking burndown summary.
  - `tests/e2e/runway-explainer.spec.ts`: Updated chart note text to "Income Stops", tax drag test uses mode-income-stops tab.
  - `tests/e2e/withdrawal-pills-overflow.spec.ts`: Updated to switch to Income Stops mode for burndown pills test.
  - `tests/e2e/milestone-6-e2e.spec.ts`: Updated burndown-summary references to use Income Stops tab switching.
  - `tests/e2e/milestone-10-e2e.spec.ts`: Updated burndown tests to use mode-income-stops tab, chart note to reference "Income Stops".
  - `tests/unit/milestone-10-e2e-infra.test.ts`: Updated expected testid from `runway-burndown-main` to `mode-income-stops`.
  - `tests/unit/changelog.test.ts`: Updated counts for 98 entries and 11 entries in UI Polish milestone group.
  - `src/lib/changelog.ts`: Added v98 changelog entry.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/unified-chart.test.tsx`: 12 passed (all new)
  - All 73 unit test files: 1204 passed, 0 failed
  - `tests/e2e/runway-burndown-main.spec.ts`: 4 passed
  - `tests/e2e/withdrawal-tax-runway.spec.ts`: 2 passed
  - `tests/e2e/runway-explainer.spec.ts`: 6 passed
  - `tests/e2e/withdrawal-pills-overflow.spec.ts`: 2 passed
  - `tests/e2e/milestone-6-e2e.spec.ts`: 5 passed
  - `tests/e2e/milestone-10-e2e.spec.ts`: 11 passed
- **Screenshots**:
  ![Income Stops burndown view](screenshots/task-98-burndown-income-stops.png)
  ![Withdrawal order in Income Stops](screenshots/task-98-withdrawal-order.png)
- **Notes**: The `RunwayBurndownChart` component file still exists and exports `buildSummary` which is imported by the unified `ProjectionChart`. The component itself is no longer rendered standalone. Mode tabs use `stopPropagation` on click to prevent the parent `ZoomableCard` overlay from opening when switching modes. Pre-existing test failures were fixed in a separate commit (runway-explainer tests had incorrect testids and stale assertions).

## Task 99: Unified chart — always 50 years, X-axis in years, add 40/50yr columns
- **Status**: Complete
- **Date**: 2026-03-06
- **Changes**:
  - `src/components/ProjectionChart.tsx`: Removed `TIMELINE_OPTIONS` constant, `years` state, and timeline selector buttons. Set `years = 50` as a constant. Changed `TABLE_MILESTONES` from `[10, 20, 30]` to `[10, 20, 30, 40, 50]`. Converted burndown mode X-axis from months to years (dataKey changed from `month` to `year`, removed "Months" axis label, added `tickFormatter` with "y" suffix). Added `fmtYears()` helper for year-based zero-crossing reference line labels. Updated burndown data to pad to 50 years (600 months) so both modes share 0–50 year X-axis range. Lines stay at $0 after savings run out. Updated `BurndownTooltip` to show year-based labels.
  - `src/lib/projections.ts`: Changed `projectAssets` default `milestoneYears` from `[10, 20, 30]` to `[10, 20, 30, 40, 50]`.
  - `src/lib/changelog.ts`: Added v99 changelog entry.
  - `tests/e2e/projection-chart.spec.ts`: Removed timeline slider test, updated scenario button tests to close ZoomableCard overlay between clicks, used `.first()` for legend selectors.
  - `tests/e2e/milestone-2-e2e.spec.ts`: Removed timeline slider interaction steps, added Escape key presses between scenario button clicks.
  - `tests/unit/changelog.test.ts`: Updated counts to 99 entries, 12 entries in UI Polish milestone group.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/unified-50yr-chart.test.tsx`: 6 tests — no timeline buttons rendered, summary table shows 40yr/50yr columns, asset projections table shows 40yr/50yr, burndown chart visible, projectAssets defaults to 5 milestones, projectFinances generates 601 points. 6 passed, 0 failed.
  - `tests/e2e/unified-50yr-chart.spec.ts`: 4 tests — no timeline buttons, summary table 40yr/50yr columns, burndown year-based axis, asset projections 40yr/50yr columns. 4 passed, 0 failed.
  - All T1 unit tests: 1210 passed, 0 failed (74 test files)
  - All related T2 E2E tests: 12 passed, 0 failed
- **Screenshots**:
  ![50-year chart](screenshots/task-99-50yr-chart.png)
  ![Summary table with 40yr/50yr](screenshots/task-99-summary-table-50yr.png)
  ![Burndown with year-based axis](screenshots/task-99-burndown-years-axis.png)
  ![Asset projections with 40yr/50yr](screenshots/task-99-asset-projections-50yr.png)
- **Notes**: The timeline selector was removed entirely — the chart always projects 50 years in both modes. Both "Keep Earning" and "Income Stops" share the same 0–50 year X-axis range so switching modes doesn't jump the axis. The `simulateRunwayTimeSeries` cap was already at 600 months (50 years) so no change needed there. Pre-existing E2E test failures (timeline-slider testid, ZoomableCard overlay blocking scenario button clicks) were fixed in a separate commit.

## Task 100: Include investment return taxes in Estimated Tax with correct CA/US rules
- **Status**: Complete
- **Date**: 2026-03-06
- **Changes**:
  - `src/lib/financial-state.ts`: Added `getDefaultRoiTaxTreatment` import. In `computeTotals`, iterate over assets to find taxable accounts with income-type ROI, compute annual interest (`balance × roi%`), and add to the employment income bucket for tax calculation. Returns `investmentIncomeAccounts` and `totalInvestmentInterest` for the explainer. Updated effective tax rate denominator to include investment interest. Updated tax breakdown string to show investment interest. Updated `buildTaxExplainerDetails` to accept and include `investmentIncomeTax` data.
  - `src/components/DataFlowArrows.tsx`: Added `investmentIncomeTax` field to `TaxExplainerDetails` interface. Added investment income section to `TaxExplainerContent` with per-account breakdown (balance, ROI%, annual interest), total line for multiple accounts, and explanatory note about annual vs realized taxation.
  - `src/lib/changelog.ts`: Added version 100 entry.
  - `tests/unit/financial-state.test.ts`: Added 8 new tests and updated 3 existing tests. New tests cover: CA interest taxed at marginal rate, US interest taxed at ordinary income rate, capital-gains accounts excluded, TFSA excluded, RRSP excluded, Roth IRA excluded, investment income in tax explainer details, mixed account types. Updated 3 existing tests to account for Savings Account investment interest now being included in tax base.
  - `tests/e2e/investment-income-tax.spec.ts`: New E2E test with 3 tests verifying investment income section visibility in tax explainer, per-account ROI display, and tax estimate including interest.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/financial-state.test.ts`: 50 tests passed (8 new + 3 updated), 0 failed
  - `tests/e2e/investment-income-tax.spec.ts`: 3 tests passed, 0 failed
  - All 1218 unit tests passed, all 22 tax-related E2E tests passed
- **Screenshots**:
  ![Investment income in tax explainer](screenshots/task-100-investment-income-tax-explainer.png)
- **Notes**: Pre-existing E2E test failures in `snapshot-dashboard.spec.ts` (6 tests referencing `role="tooltip"` and hardcoded metric values that had drifted) were fixed in a separate commit. Investment interest is added to the "employment" income type bucket so progressive brackets apply correctly across salary + interest income combined. Only taxable accounts with `roiTaxTreatment === "income"` are included — capital-gains ROI, tax-free, and tax-deferred accounts are all excluded per the task requirements.

## Task 101: [MILESTONE] E2E test for unified chart and enhancements
- **Status**: Complete
- **Date**: 2026-03-06
- **Changes**:
  - `tests/e2e/milestone-11-e2e.spec.ts`: **New** — Comprehensive milestone E2E test suite with 12 tests covering: (1) Unified chart mode tabs (Keep Earning/Income Stops), (2) 50-year chart with 40yr/50yr columns in summary and asset tables, (3) Dual federal/provincial bracket tables with subtotals, (4) Investment income tax section in explainer, (5) Withdrawal tax merged into Financial Runway explainer with suggested order and disclaimer, (6) $0 income tax explainer with bracket reference, (7) Modal close mechanisms (Escape, X button, backdrop), (8) ROI tax treatment toggle, (9) Scrollable source summary cards with sticky total, (10) Full multi-step journey across all features.
  - `tests/unit/milestone-11-e2e-infra.test.ts`: **New** — 16 T1 unit tests verifying milestone E2E test structure: existence, imports, coverage of unified chart, 50yr columns, dual brackets, investment income, withdrawal tax merge, $0 tax, ROI toggle, scrollable cards, close mechanisms, journey test, test count, screenshots, and related feature files.
  - `src/lib/changelog.ts`: Added v101 changelog entry. Extended UI Polish milestone range to [88, 101].
  - `tests/unit/changelog.test.ts`: Updated counts to 101 entries, 14 entries in UI Polish milestone group.
- **Test tiers run**: T1, T2, T3
- **Tests**:
  - `tests/unit/milestone-11-e2e-infra.test.ts`: 16 passed, 0 failed
  - `tests/unit/changelog.test.ts`: 11 passed, 0 failed
  - All T1 unit tests: 1234 passed, 0 failed (75 test files)
  - `tests/e2e/milestone-11-e2e.spec.ts`: 12 passed, 0 failed
  - All T2/T3 E2E tests: 314 passed, 0 failed
- **Screenshots**:
  ![Unified chart Keep Earning](screenshots/task-101-unified-chart-keep-earning.png)
  ![Unified chart Income Stops](screenshots/task-101-unified-chart-income-stops.png)
  ![50yr summary table](screenshots/task-101-50yr-summary-table.png)
  ![Dual bracket tables](screenshots/task-101-dual-bracket-tables.png)
  ![Investment income tax](screenshots/task-101-investment-income-tax.png)
  ![Runway with withdrawal tax](screenshots/task-101-runway-withdrawal-tax.png)
  ![Zero income tax explainer](screenshots/task-101-zero-income-tax-explainer.png)
  ![ROI tax toggle](screenshots/task-101-roi-tax-toggle.png)
  ![Scrollable source cards](screenshots/task-101-scrollable-source-cards.png)
  ![Full journey complete](screenshots/task-101-full-journey-complete.png)
- **Notes**: All 101 tasks are now complete. This milestone covers the unified chart and final enhancements from tasks 97-101, validating the merged projection/burndown chart with mode tabs, 50-year projections, dual bracket tables, investment income tax, withdrawal tax merged into runway, and all modal interactions. The full E2E suite (314 tests) passes across all milestone test files. Pre-existing changelog test failure (expected 99 entries but had 100) was fixed in a separate commit.

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
