# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 134
- **Completed**: 132
- **Remaining**: 2
- **Last Updated**: 2026-03-07

## Task 132: Show company/fund names for stock tickers
- **Date**: 2026-03-07
- **Files**: `src/lib/ticker-names.ts` (new), `src/components/StockEntry.tsx`, `src/components/DataFlowArrows.tsx`, `tests/unit/ticker-names.test.ts` (new), `tests/e2e/ticker-names.spec.ts` (new), `src/lib/changelog.ts`, `tests/unit/changelog.test.ts`
- **Tests**: 1701 passed (10 new T1 in `ticker-names.test.ts`, 4 new T2 in `ticker-names.spec.ts`)
- **Screenshots**: ![Ticker name AAPL](screenshots/task-132-ticker-name-aapl.png) ![Multiple ticker names](screenshots/task-132-ticker-names-multiple.png) ![Ticker name explainer](screenshots/task-132-ticker-name-explainer.png)
- **Notes**: Created static map with 550+ ticker-to-name entries (S&P 500, popular ETFs, Canadian stocks/ETFs, Vanguard/Fidelity funds). Async fallback via Yahoo Finance search API with module-level cache. Company names show as subtle 10px text below ticker buttons in StockEntry and as parenthetical labels in DataFlowArrows explainer source cards. Fixed pre-existing changelog test failure (task 131 count mismatch).
