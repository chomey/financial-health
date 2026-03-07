# Progress Log

<!--
  This file is automatically updated by Ralph after each task iteration.
  It serves as a running log of what was done and provides context for
  future iterations to pick up where the last one left off.

  Do not manually edit entries below unless correcting errors.
-->

## Summary
- **Total Tasks**: 124
- **Completed**: 123
- **Remaining**: 1
- **Last Updated**: 2026-03-07

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

## Task 114: Print/PDF snapshot export
- **Date**: 2026-03-06
- **Files**: `src/app/page.tsx` (added `PrintSnapshotButton`, `PrintFooter` components; `print:hidden` on nav, header controls, entry panel, sample profiles banner, FastForward section; `data-testid` on entry/dashboard panels; `PrintFooter` in main), `src/app/globals.css` (`@media print` rules for page setup, chart heights, full-width dashboard, suppress animations), `src/lib/changelog.ts` (v114 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/print-snapshot.test.ts` (new — 9 tests), `tests/e2e/print-snapshot.spec.ts` (new — 11 tests), `tests/unit/setup.test.tsx` (updated to use `getAllByText` for duplicated title text)
- **Tests**: T1: 1434 passed, 0 failed (88 files). T2: 11 passed (print-snapshot). Build: passes.
- **Screenshots**:
  ![Print button visible](screenshots/task-114-print-button-visible.png)
  ![Print footer visible](screenshots/task-114-print-footer-visible.png)
  ![Print dashboard visible](screenshots/task-114-print-dashboard-visible.png)
  ![Print layout with data](screenshots/task-114-print-layout-with-data.png)

## Task 115: Mobile guided wizard entry mode
- **Date**: 2026-03-06
- **Files**: `src/components/MobileWizard.tsx` (new), `src/app/page.tsx` (showWizard state, wizard trigger in useEffect, callbacks), `src/lib/changelog.ts` (v115 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/mobile-wizard.test.ts` (new — 10 tests), `tests/e2e/mobile-wizard.spec.ts` (new — 13 tests)
- **Tests**: T1: 1445 passed, 0 failed (89 files). T2: 13 passed (mobile-wizard). Build: passes.
- **Screenshots**:
  ![Wizard step 1](screenshots/task-115-wizard-step1.png)
  ![Wizard step 4](screenshots/task-115-wizard-step4.png)
  ![Wizard presets](screenshots/task-115-wizard-presets.png)
  ![Wizard completed](screenshots/task-115-wizard-completed.png)
  ![Wizard skipped](screenshots/task-115-wizard-skipped.png)
- **Notes**: localStorage access wrapped in try/catch since JSDOM test environment doesn't support it. Wizard only triggers for mobile (< 768px) new users with no URL state and no localStorage flag set.

## Task 116: Debt payoff strategy comparison
- **Date**: 2026-03-06
- **Files**: `src/lib/debt-payoff.ts` (added `DebtForStrategy`, `StrategyResult`, `DebtStrategyComparison` interfaces + `compareDebtStrategies`, `simulateCurrent`, `simulateWithRedistribution`), `src/lib/insights.ts` (added `"debt-strategy"` InsightType, imported `compareDebtStrategies`/`formatDuration`, added strategy insight generation), `src/components/InsightsPanel.tsx` (added `"debt-strategy"` source mapping), `src/lib/changelog.ts` (v116 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/debt-strategy.test.ts` (new — 19 tests)
- **Tests**: T1: 1464 passed, 0 failed (90 files). Build: passes.
- **Screenshots**: N/A ([@backend] task — T2 not required)
- **Notes**: Avalanche = highest-rate-first with payment redistribution; snowball = smallest-balance-first with redistribution; current = no redistribution. Insight only appears when ≥2 debts have both `interestRate` and `monthlyPayment` set and all payments cover their respective interest.

## Task 117: FIRE number milestone
- **Date**: 2026-03-06
- **Files**: `src/lib/projections.ts` (added `computeFireNumber`, `findMonthAtTarget`), `src/lib/url-state.ts` (added `getSwrFromURL`, `updateSwrURL`), `src/lib/insights.ts` (added `"fire"` InsightType, `fireNumber`/`yearsToFire` to FinancialData, FIRE insight generation), `src/lib/financial-state.ts` (compute `fireNumber` in `toFinancialData`), `src/components/InsightsPanel.tsx` (added `"fire"` source mapping), `src/components/FastForwardPanel.tsx` (added SWR slider props and UI), `src/components/ProjectionChart.tsx` (FIRE reference line + callout using `safeWithdrawalRate` prop), `src/app/page.tsx` (added `safeWithdrawalRate` state, `handleSwrChange`, wired to components), `src/lib/changelog.ts` (v117 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/fire-number.test.ts` (new — 18 tests), `tests/e2e/fire-number.spec.ts` (new — 6 tests)
- **Tests**: T1: 1482 passed, 0 failed (91 files). T2: 6 passed (fire-number). Build: passes.
- **Screenshots**:
  ![FIRE milestone default](screenshots/task-117-fire-milestone-default.png)
  ![SWR slider](screenshots/task-117-swr-slider.png)
  ![SWR changed 3%](screenshots/task-117-swr-changed-3pct.png)
  ![FIRE insight](screenshots/task-117-fire-insight.png)
  ![FIRE achieved](screenshots/task-117-fire-achieved.png)

## Task 118: Tax optimization suggestions
- **Date**: 2026-03-06
- **Files**: `src/lib/tax-engine.ts` (export `getMarginalRateForIncome`), `src/lib/insights.ts` (add `"tax-optimization"` InsightType, add `marginalRate`/`country`/`annualEmploymentIncome` to FinancialData, add 3 tax optimization insights), `src/lib/financial-state.ts` (import `getMarginalRateForIncome`, compute marginalRate in `toFinancialData`), `src/components/InsightsPanel.tsx` (add `"tax-optimization"` source mapping), `src/lib/changelog.ts` (v118 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/tax-optimization.test.ts` (new — 18 tests)
- **Tests**: T1: 1501 passed, 0 failed (92 files). Build: passes.
- **Screenshots**: N/A ([@backend] task — T2 not required)
- **Notes**: Three insights: (1) taxable→TFSA/Roth IRA savings when taxable×5%×marginalRate > $100/yr; (2) RRSP/401k deduction suggestion when marginalRate ≥ 25% and employment income present; (3) tax-free room nudge when taxable > tax-free and suggestion 1 threshold not met.

## Task 119: Income replacement ratio metric
- **Date**: 2026-03-06
- **Files**: `src/lib/insights.ts` (added `incomeReplacementRatio` to FinancialData, `"income-replacement"` InsightType, tier-based insight generation), `src/lib/financial-state.ts` (Income Replacement metric in `computeMetrics`, `incomeReplacementRatio` in `toFinancialData`), `src/components/SnapshotDashboard.tsx` (added `"percent"` format type, `formatMetricValue` case, progress bar rendering, tier label, METRIC_TO_INSIGHT_TYPES entry), `src/components/InsightsPanel.tsx` (added `"income-replacement"` source mapping), `src/lib/changelog.ts` (v119 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/financial-state.test.ts` (updated 5→6 metric count), `tests/unit/income-replacement.test.ts` (new — 14 tests), `tests/e2e/income-replacement.spec.ts` (new — 6 tests)
- **Tests**: T1: 1515 passed, 0 failed (93 files). T2: 6 passed (income-replacement). Build: passes.
- **Screenshots**:
  ![Income replacement card](screenshots/task-119-income-replacement-card.png)
  ![Income replacement progress bar](screenshots/task-119-income-replacement-progress.png)
  ![Income replacement insight](screenshots/task-119-income-replacement-insight.png)
  ![Income replacement high](screenshots/task-119-income-replacement-high.png)

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

## Task 120: [MILESTONE] E2E test for new financial intelligence features
- **Date**: 2026-03-06
- **Files**: `tests/e2e/milestone-e2e-120.spec.ts` (new — 11 tests covering all tasks 110-119), `tests/unit/milestone-13-e2e-infra.test.ts` (new — 16 tests), `src/lib/changelog.ts` (v120 entry), `tests/unit/changelog.test.ts` (updated counts)
- **Tests**: T1: 1531 passed, 0 failed (94 files). T2: 11 passed (milestone-e2e-120). T3: 407 passed (full suite). Build: passes.
- **Screenshots**:
  ![Inflation toggle](screenshots/task-120-inflation-toggle.png)
  ![Age benchmarks](screenshots/task-120-age-benchmarks.png)
  ![Employer match](screenshots/task-120-employer-match.png)
  ![Sample profile loaded](screenshots/task-120-sample-profile-loaded.png)
  ![Print layout](screenshots/task-120-print-layout.png)
  ![Wizard completed](screenshots/task-120-wizard-completed.png)
  ![Debt strategy insights](screenshots/task-120-debt-strategy-insights.png)
  ![FIRE milestone](screenshots/task-120-fire-milestone.png)
  ![FIRE SWR changed](screenshots/task-120-fire-swr-changed.png)
  ![Tax optimization](screenshots/task-120-tax-optimization.png)
  ![Income replacement](screenshots/task-120-income-replacement.png)
  ![Full dashboard](screenshots/task-120-full-dashboard.png)
- **Notes**: All 10 feature areas from tasks 110-119 verified end-to-end. Full regression suite (407 tests) passes. No pre-existing test failures.

## Task 122: Fix projection chart label clipping
- **Date**: 2026-03-07
- **Files**: `src/lib/currency.ts` (compact format: strip trailing .0 from millions), `src/components/ProjectionChart.tsx` (added `MilestoneLabelContent` SVG component; main chart margin left 0→10, YAxis width 60→75; milestone reference line labels use custom SVG pill), `tests/unit/currency.test.ts` (3 new test cases for round-million compact format), `tests/e2e/projection-chart-labels.spec.ts` (new — 5 tests), `src/lib/changelog.ts` (v122 entry, UI Polish range extended to 130), `tests/unit/changelog.test.ts` (updated counts)
- **Tests**: T1: 1550 passed, 0 failed (95 files). T2: 5 passed (projection-chart-labels). Build: passes.
- **Screenshots**:
  ![Projection chart container](screenshots/task-122-projection-chart-container.png)
  ![Y-axis labels](screenshots/task-122-yaxis-labels.png)
  ![Chart dimensions](screenshots/task-122-chart-dimensions.png)
  ![Milestone labels](screenshots/task-122-milestone-labels.png)
  ![Full chart](screenshots/task-122-full-chart.png)

## Task 123: Add mortgage burndown line to projection chart
- **Date**: 2026-03-07
- **Files**: `src/lib/projections.ts` (added `computeMortgageAmortization` export), `src/components/ProjectionChart.tsx` (added `mortgage` field to chartData, orange dashed Line for mortgage, Mortgage legend entry), `src/lib/changelog.ts` (v123 entry), `tests/unit/changelog.test.ts` (updated counts to 123), `tests/unit/mortgage-amortization.test.ts` (new — 9 tests), `tests/e2e/mortgage-burndown.spec.ts` (new — 5 tests)
- **Tests**: T1: 1559 passed, 0 failed (96 files). T2: 5 passed (mortgage-burndown). Build: passes.
- **Screenshots**:
  ![Mortgage legend visible](screenshots/task-123-mortgage-legend-visible.png)
  ![No mortgage no legend](screenshots/task-123-no-mortgage-no-legend.png)
  ![Chart with mortgage line](screenshots/task-123-chart-with-mortgage-line.png)
  ![Summary table mortgage](screenshots/task-123-summary-table-mortgage.png)
  ![Mortgage free milestone](screenshots/task-123-mortgage-free-milestone.png)

## Task 121: Auto-display investment returns in Income section
- **Date**: 2026-03-07
- **Files**: `src/components/IncomeEntry.tsx` (import `MonthlyInvestmentReturn`, add `investmentReturns` prop, auto-computed section with "auto" badge rows, include in monthly total), `src/app/page.tsx` (pass `investmentReturns={monthlyInvestmentReturns}` to IncomeEntry), `src/lib/changelog.ts` (v121 entry, UI Polish range extended to 121), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/investment-returns-income.test.tsx` (new — 14 tests), `tests/e2e/investment-returns-income.spec.ts` (new — 8 tests)
- **Tests**: T1: 1545 passed, 0 failed (95 files). T2: 8 passed (investment-returns-income). Build: passes.
- **Screenshots**:
  ![Auto returns section](screenshots/task-121-auto-returns-section.png)
  ![Auto return labels](screenshots/task-121-auto-return-labels.png)
  ![Monthly total with returns](screenshots/task-121-monthly-total-with-returns.png)
  ![Manual plus auto income](screenshots/task-121-manual-plus-auto-income.png)
