# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 151
- **Completed**: 151
- **Remaining**: 0
- **Last Updated**: 2026-03-08

## Task 151: Financial roadmap E2E regression [MILESTONE]
- **Date**: 2026-03-08
- **Files**:
  - `tests/unit/roadmap-regression.test.ts` (new): 20 unit tests covering all 8 regression scenarios at unit level — default CA state (7/10 complete, budget/TFSA/RRSP/EF complete), US mode (10 us- steps, 401k/HSA/IRA present), acknowledge/undo employer match, skip HSA, high-interest debt reduces complete count, fresh-grad EF completes after savings added, progress bar percentages.
  - `tests/e2e/milestone-roadmap-regression.spec.ts` (new): 8 Playwright tests — CA default (10 steps, budget hint, EF months, TFSA/RRSP), switch to US (US step titles, no CA titles, US community credit), acknowledge employer match with URL fca= reload persistence, skip HSA with N/A badge and fcs= param, undo acknowledgement (URL cleared, checkbox reverts), add high-interest debt via UI (step hint shows debt name), add savings to fresh-grad profile to complete 3-month EF, progress bar live updates (70% → 80% → 70% on ack/undo).
  - `src/lib/changelog.ts`: Added version 151 entry.
  - `TASKS.md`: Task 151 marked complete.
- **Tests**: T1: 2093 passed (all), T3: 239 passed (full suite), Build: passes
- **Screenshots**: `task-151-ca-roadmap-default.png`, `task-151-us-roadmap.png`
- **Notes**: Full suite took ~37 min due to two concurrent playwright runs competing. Individual run is typically 4–5 min. Task is a `[@qa]` milestone — all T1+T2+T3 tiers satisfied (T2 covered by milestone-roadmap-regression.spec.ts as part of the T3 full run; task 150's E2E spec already provides dedicated T2 coverage for flowchart rendering).

## Task 150: Financial roadmap visual component
- **Date**: 2026-03-08
- **Files**:
  - `src/components/FinancialFlowchart.tsx` (new): Interactive vertical flowchart. Green checkmark circle (complete), amber pulse circle (in-progress), grey number circle (upcoming). Connector lines colour-coded by status. Click-to-expand step detail with detailText + checkboxes. `userAcknowledgeable` steps: acknowledge checkbox; `skippable` steps: skip checkbox; Undo button when overridden. Auto-expands first non-complete step on load. Gradient progress bar. Community credit links + disclaimer. URL persistence via `fca=`/`fcs=` helpers. Exports `computeFlowchartSummary`, `getStepTitleColor`, `getConnectorColor` for unit tests.
  - `src/app/page.tsx`: Added `FinancialFlowchart` import, `Roadmap` nav link, `<section id="roadmap">` in right dashboard column.
  - `src/lib/changelog.ts`: Added version 150 entry; added "Financial Roadmap" milestone group (range 147–151) to `getChangelogByMilestone`.
  - `tests/unit/financial-flowchart.test.ts` (new): 8 unit tests for `computeFlowchartSummary`, `getStepTitleColor`, `getConnectorColor`.
  - `tests/unit/changelog.test.ts`: Updated for 150 entries, 14 milestone groups, new "Financial Roadmap" milestone.
  - `tests/e2e/financial-flowchart.spec.ts` (new): 6 Playwright tests — renders 10 steps, auto-expands current step, ack/unack checkbox + URL persistence, skip/unskip checkbox + N/A badge, undo button, nav link scroll.
- **Tests**: T1: 2072 passed (all), T2: 6 passed, Build: passes
- **Screenshots**: `task-150-flowchart-ca-default.png`, `task-150-flowchart-after-nav.png`
- **Notes**: ZoomableCard intentionally omitted — the flowchart is interactive with URL-synced state; wrapping in ZoomableCard creates two React instances with divergent state (acknowledged/expanded). The `<section id="roadmap">` is placed directly in the right column. E2E tests for expand-then-click use pre-loaded URL params (`?fca=` / `?fcs=`) to avoid a sticky-column click-interactability edge case with fresh page state.

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
