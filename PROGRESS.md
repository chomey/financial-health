# Progress Log

<!--
  This file is automatically updated by Ralph after each task iteration.
  It serves as a running log of what was done and provides context for
  future iterations to pick up where the last one left off.

  Do not manually edit entries below unless correcting errors.
-->

## Summary
- **Total Tasks**: 120
- **Completed**: 115
- **Remaining**: 5
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

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

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

## Task 113: Preset sample profiles for new users
- **Date**: 2026-03-06
- **Files**: `src/lib/sample-profiles.ts` (new — 3 CA profiles + 3 US profiles + `getProfilesForCountry`), `src/app/page.tsx` (`showSampleProfiles` state, `loadProfile`/`clearAll` callbacks, sample profiles banner inline in main, `SampleProfile` import), `src/lib/changelog.ts` (v113 entry), `tests/unit/changelog.test.ts` (updated counts), `tests/unit/sample-profiles.test.ts` (new — 16 tests), `tests/e2e/sample-profiles.spec.ts` (new — 8 tests)
- **Tests**: T1: 1427 passed, 0 failed (87 files). T2: 8 passed (sample-profiles). Build: passes.
- **Screenshots**:
  ![Sample profiles banner](screenshots/task-113-sample-profiles-banner.png)
  ![Banner dismissed](screenshots/task-113-banner-dismissed.png)
  ![Fresh grad loaded](screenshots/task-113-fresh-grad-loaded.png)
  ![Mid-career loaded](screenshots/task-113-mid-career-loaded.png)
  ![Pre-retirement loaded](screenshots/task-113-pre-retirement-loaded.png)
  ![Clear all](screenshots/task-113-clear-all.png)

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
