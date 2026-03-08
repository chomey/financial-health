# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 145
- **Completed**: 144
- **Remaining**: 1
- **Last Updated**: 2026-03-07

## Task 144: Tax credits impact on dashboard metrics
- **Date**: 2026-03-07
- **Files**: `src/components/SnapshotDashboard.tsx`, `src/lib/financial-state.ts`, `src/lib/changelog.ts`, `tests/unit/tax-credit-metrics.test.ts`, `tests/e2e/tax-credit-metrics.spec.ts`
- **Tests**: T1: 1957 passed (12 new in `tax-credit-metrics.test.ts`), T2: 5 passed (new `tax-credit-metrics.spec.ts`), Build: passes
- **Screenshots**: ![Monthly boost](screenshots/task-144-credit-monthly-boost.png) ![Tax rate adjusted](screenshots/task-144-tax-rate-adjusted.png) ![Surplus badge](screenshots/task-144-surplus-credit-badge.png) ![Runway adjusted](screenshots/task-144-runway-adjusted.png)
- **Notes**: Added 3 new fields to `MetricData`: `taxCreditAdjustedRate`, `taxCreditMonthlyBoost`, `taxCreditAdjustedRunway`. Non-refundable credits capped at `totalTaxEstimate` to avoid negative taxes. Adjusted runway only shows if it exceeds base runway by >0.1 mo.
