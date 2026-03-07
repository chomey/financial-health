# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 139
- **Completed**: 135
- **Remaining**: 4
- **Last Updated**: 2026-03-07

## Task 135: Add debt-to-income ratio insight with educational explainer
- **Date**: 2026-03-07
- **Files**: `src/lib/insights.ts`, `src/lib/financial-state.ts`, `src/components/SnapshotDashboard.tsx`, `src/components/InsightsPanel.tsx`, `src/app/page.tsx`, `src/lib/changelog.ts`, `tests/unit/debt-to-income.test.ts`, `tests/e2e/debt-to-income.spec.ts`
- **Tests**: T1: 1755 passed (12 new in `debt-to-income.test.ts`), T2: 6 passed (new `debt-to-income.spec.ts`)
- **Screenshots**: ![DTI insight default](screenshots/task-135-dti-insight-default.png) ![DTI explainer modal](screenshots/task-135-dti-explainer-modal.png) ![DTI metric card](screenshots/task-135-dti-metric-card.png)
- **Notes**: DTI = monthly debt payments (minimums + mortgage) / gross monthly income. Four tiers: Excellent <20%, Good 20-35%, Moderate 36-43%, High 44%+. Added `monthlyDebtPayments` and `monthlyGrossIncome` to FinancialData. InsightsPanel.tsx needed `"debt-to-income"` added to `INSIGHT_TYPE_SOURCES` exhaustive Record type.
