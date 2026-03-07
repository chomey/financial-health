# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 134
- **Completed**: 126
- **Remaining**: 8
- **Last Updated**: 2026-03-07

## Task 126: Show both monthly and yearly totals on Income and Expenses
- **Date**: 2026-03-07
- **Files**: `src/components/IncomeEntry.tsx`, `src/components/ExpenseEntry.tsx`, `tests/unit/income-entry.test.tsx`, `tests/unit/expense-entry.test.tsx`, `tests/unit/investment-returns-income.test.tsx`, `tests/unit/monthly-yearly-totals.test.tsx`, `tests/e2e/monthly-yearly-totals.spec.ts`, `tests/e2e/income-entry.spec.ts`, `tests/e2e/expense-entry.spec.ts`, `tests/e2e/investment-contributions.spec.ts`, `src/lib/changelog.ts`
- **Tests**: 1596 passed (10 new T1 in `monthly-yearly-totals.test.tsx`, 6 new T2 in `monthly-yearly-totals.spec.ts`)
- **Screenshots**: ![Income dual totals](screenshots/task-126-income-dual-totals.png) ![Expense dual totals](screenshots/task-126-expense-dual-totals.png) ![Full page](screenshots/task-126-full-page-dual-totals.png)
- **Notes**: Pre-existing changelog test failure (from task 125) was fixed before implementing. Expense items always stored as monthly; income items show their native frequency + the other unit as secondary.
