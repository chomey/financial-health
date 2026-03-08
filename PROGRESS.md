# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 147
- **Completed**: 147
- **Remaining**: 0
- **Last Updated**: 2026-03-08

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
