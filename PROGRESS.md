# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 140
- **Completed**: 140
- **Remaining**: 0
- **Last Updated**: 2026-03-07

## Task 142: Add US tax credit and deduction categories with income limits and filing status
- **Date**: 2026-03-07
- **Files**: `src/lib/tax-credits.ts`, `tests/unit/tax-credits.test.ts`, `tests/e2e/us-tax-categories.spec.ts`, `src/lib/changelog.ts`, `tests/unit/changelog.test.ts`
- **Tests**: T1: 83 passed (in `tax-credits.test.ts`, 34 new for US), T2: 3 passed (new `us-tax-categories.spec.ts`), Build: passes
- **Screenshots**: ![US single categories](screenshots/task-142-us-single-categories.png) ![US MFJ categories](screenshots/task-142-us-mfj-categories.png) ![US adoption credit](screenshots/task-142-us-adoption-credit-selected.png)
- **Notes**: Fixed pre-existing changelog test failures (tests expected 140 entries but task 141 added entry 141). SALT deduction renamed to "State and Local Tax (SALT) Deduction". Added Child and Dependent Care, Premium Tax Credit, Adoption Credit, Standard Deduction (info), Charitable Contributions, SSDI/SSI Benefits (info). MFS ineligibility handled via incomeLimits.
