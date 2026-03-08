# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 153
- **Completed**: 153
- **Remaining**: 3
- **Last Updated**: 2026-03-08

## Task 153: Add tax year selector (2025/2026) with year-specific credit and bracket values [@fullstack] [OPUS]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/financial-types.ts`: Added `taxYear?: number` to `FinancialState`.
  - `src/lib/tax-tables.ts`: Added `CA_FEDERAL_2026`, `US_FEDERAL_2026`, `US_CAPITAL_GAINS_2026` bracket tables with inflation-indexed values. Year-indexed lookup tables. Updated `getCanadianBrackets`/`getUSBrackets` to accept 2025 or 2026. Added `getUSCapitalGainsBrackets` helper. Exported `SUPPORTED_TAX_YEARS`.
  - `src/lib/tax-credits.ts`: Added `TaxCreditYearOverride` interface and `yearOverrides` field to `TaxCreditCategory`. Added `resolveCategoryForYear` helper. Updated `getCreditCategories`, `getCreditCategoriesForFilingStatus`, `getAllCreditCategories`, `findCreditCategory` to accept `year` parameter. Added 2026 overrides for DTC, CWB, GST/HST, CCB (CA) and EITC, CTC, Saver's Credit, Standard Deduction (US).
  - `src/lib/tax-engine.ts`: Added `year` parameter to `computeTax`, `computeCanadianTax`, `computeUSTax`, `computeUSCapitalGainsTax`, `getMarginalRateForIncome`. Uses `getUSCapitalGainsBrackets(year)`.
  - `src/lib/compute-totals.ts`: Extracts `taxYear` from state, passes through all bracket lookup and `computeTax` calls.
  - `src/lib/withdrawal-tax.ts`: Added `year` parameter to `getWithdrawalTaxRate`.
  - `src/lib/financial-state.ts`: Passes `taxYear` to `getMarginalRateForIncome`.
  - `src/lib/url-state.ts`: Added `ty` to `CompactState`, serializes/deserializes `taxYear` (omitted when 2025).
  - `src/app/_use-financial-state.ts`: Added `taxYear`/`setTaxYear` state, URL restore/persist.
  - `src/app/page.tsx`: Wired `taxYear`/`setTaxYear` to state and components.
  - `src/components/CountryJurisdictionSelector.tsx`: Added segmented tax year toggle (2025/2026).
  - `src/components/TaxCreditEntry.tsx`: Added `taxYear` prop, passed through to all category lookups.
  - `src/lib/changelog.ts`: Added version 153 entry.
- **Tests**: T1: 2124 passed (121 files), T2: 3 passed (Playwright), Build: passes
- **Screenshots**: `task-153-tax-year-default.png`, `task-153-tax-year-2026.png`

## Task 152: Apply tax credits to displayed tax and cash flow [@fullstack] [MATH]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/compute-totals.ts`: Apply deductions before bracket computation, apply non-refundable/refundable credits after. Export `rawTaxEstimate`, `totalCreditBenefit`, `totalDeductions`.
  - `src/lib/compute-metrics.ts`: Remove redundant credit computation. Use credit-adjusted values from computeTotals for displayed tax, surplus, and breakdown strings. Replace `taxCreditAdjustedRate`/`taxCreditMonthlyBoost`/`taxCreditAdjustedRunway` with `taxCreditsApplied` boolean.
  - `src/components/SnapshotDashboard.tsx`: Simplify MetricData interface — replace 3 credit fields with `taxCreditsApplied`. Update MetricCard rendering.
  - `tests/unit/tax-credit-metrics.test.ts`: Rewritten — 9 tests covering credits reducing displayed tax, improving surplus, deductions reducing taxable income.
  - `tests/e2e/tax-credit-metrics.spec.ts`: Rewritten — 3 tests for badge visibility and cash flow with credits.
  - `tests/e2e/tax-credit-regression.spec.ts`: Updated 5 dashboard metric tests for new badge/rate display.
  - `tests/unit/changelog.test.ts`: Updated for 152 entries.
  - `src/lib/changelog.ts`: Added version 152 entry.
- **Tests**: T1: 2090 passed (all), T2: 3 passed, Build: passes
- **Screenshots**: `task-152-tax-credits-applied.png`, `task-152-cash-flow-with-credits.png`
