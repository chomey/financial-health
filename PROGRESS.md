# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 151
- **Completed**: 149
- **Remaining**: 2
- **Last Updated**: 2026-03-08

## Task 149: Financial roadmap step definitions and inference engine
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/flowchart-steps.ts` (new): FlowchartStep type, `getFlowchartSteps(state)`, `getCurrentStepIndex(steps)`, `applyUserOverrides(steps, acks, skips)`. 10-step CA and US flowcharts with inference engine (budget, EF, debt, tax-advantaged accounts).
  - `src/lib/url-state.ts`: Added `getFlowchartAcksFromURL()`, `getFlowchartSkipsFromURL()`, `updateFlowchartOverridesURL()` using `fca=` and `fcs=` params.
  - `tests/unit/flowchart-steps.test.ts` (new): 42 unit tests covering no-data, partial, fully funded, CA-only, US-only, high debt, no debt, stock counting, employer match, applyUserOverrides, getCurrentStepIndex.
  - `tests/unit/changelog.test.ts`: Fixed pre-existing test failure (147→148 count/range).
- **Tests**: T1: 2061 passed (all), Build: passes
- **Notes**: `getStockValue` uses `lastFetchedPrice ?? 0` (not costBasis). Steps with `isComplete=true` remain "complete" even after first in-progress step (independent, not purely sequential). Steps marked `userAcknowledgeable` (employer match, RESP/FHSA, taxable investing) require user confirmation to mark complete.

## Task 148: Make insights context-aware of user's actual accounts
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/insights/types.ts`: Added `assetCategories` and `debtCategories` to `FinancialData`
  - `src/lib/financial-state.ts`: Populates `assetCategories`/`debtCategories` in `toFinancialData`
  - `src/lib/insights/generate.ts`: Added `buildTaxRateHighMessage()` helper; updated `tax-rate-high`, `withdrawal-tax-no-free`, `tax-opt-taxable-to-free`, `tax-opt-deferred-contribution`, `tax-opt-use-tax-free-room` insights
  - `tests/unit/context-aware-insights.test.ts`: 21 unit tests for CA/US/no-accounts/all-accounts mixes
  - `tests/unit/tax-optimization.test.ts`: Updated 2 tests requiring taxable accounts for deferred contribution insight
  - `tests/unit/withdrawal-tax-summary.test.ts`: Updated 1 test for country-specific no-free-account message
  - `tests/e2e/context-aware-insights.spec.ts`: 2 T2 Playwright tests
- **Tests**: T1: 2006 passed (all), T2: 2 passed, Build: passes
- **Screenshots**: `task-148-insights-ca-with-tfsa-rrsp.png`, `task-148-insights-panel-default.png`
- **Notes**: `tax-opt-deferred-contribution` now requires taxableTotal > 0 (skip when user has no taxable accounts). Existing tests updated to add taxable balances where needed.

## Task 147: Deduplicate computation functions
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/compute-totals.ts`: Added `computeFireNumber()`, `computeMonthlyObligations()`, `computeSurplus()` consolidated helpers
  - `src/lib/compute-metrics.ts`: Uses `computeSurplus()` and `computeMonthlyObligations()` instead of inline formulas
  - `src/lib/financial-state.ts`: Uses `computeFireNumber()` and `computeMonthlyObligations()`, barrel re-exports new functions
  - `src/lib/insights/formatting.ts`: Delegates to `currency.ts` `formatCurrency`/`formatCurrencyCompact` instead of reimplementing
  - `src/components/NetWorthWaterfallChart.tsx`: Local `formatCurrency` delegates to `formatCurrencyCompact` from `currency.ts`
  - `src/components/TaxCreditEntry.tsx`: Local `formatCurrency` delegates to canonical `formatCurrency` from `currency.ts`
  - `src/app/_page-helpers.tsx`: `formatCurrencySummary` delegates to `formatCurrencyCompact` from `currency.ts`
  - `tests/unit/deduplicated-computations.test.ts`: 16 unit tests for consolidated functions
  - `tests/e2e/deduplicated-computations.spec.ts`: 2 E2E tests verifying dashboard metrics and currency formatting
- **Tests**: T1: 1982 passed (all), T2: 2 passed, Build: passes
- **Screenshots**: `task-147-dashboard-after-consolidation.png`, `task-147-section-summaries-after-consolidation.png`
- **Notes**: Net worth calculations intentionally differ by context (with/without property equity) so were not merged. ProjectionChart surplus intentionally uses a simpler formula (no investment returns, mortgage, debt) for projection allocation. Insights surplus is already consistent via pre-aggregated data in `toFinancialData`.
