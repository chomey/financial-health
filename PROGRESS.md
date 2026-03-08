# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 169
- **Completed**: 161
- **Remaining**: 8
- **Last Updated**: 2026-03-08

## Task 161: AU superannuation account types [@backend] [MATH]
- **Date**: 2026-03-08
- **Files**:
  - `src/components/AssetEntry.tsx`: Added AU category suggestions (Super Accumulation, Pension Phase, FHSS), 7% default ROI, AU_ASSET_CATEGORIES set, AU flag emoji, employer match eligibility for accumulation, tax-sheltered and reinvest defaults.
  - `src/lib/scenario.ts`: Added TAX_SHELTERED_LIMITS: concessional $30k/yr, non-concessional $120k/yr, FHSS $15k/yr.
  - `src/lib/withdrawal-tax.ts`: Added `super-accumulation` and `super-fhss` TaxTreatment types. Super pension phase → tax-free, accumulation → flat 15%, FHSS → marginal minus 30% offset.
  - `src/lib/runway-simulation.ts`: Updated all withdrawal priority maps for new treatment types with estimated tax costs.
  - `src/lib/projections.ts`: Updated withdrawal priority map for new treatment types.
  - `src/lib/compute-totals.ts`: Skip super accounts from investment income tax calculation.
  - `tests/unit/au-super-accounts.test.ts`: New — 28 tests covering suggestions, ROI, employer match, reinvest, tax sheltering, contribution limits, tax classification, withdrawal tax computation, and CA/US regression.
  - `tests/unit/grouped-dropdowns.test.ts`: Updated for 4 groups (added AU).
  - `tests/unit/asset-entry.test.tsx`: Updated suggestion count 16→19.
  - `src/lib/changelog.ts`: Added version 161 entry.
- **Tests**: T1: 2325 passed (127 files), Build: passes
- **Screenshots**: N/A (backend/math task)
- **Notes**: Super (Pension Phase) classified as tax-free (assumes retirement-age withdrawals after 60). Super (Accumulation) uses flat 15% tax on earnings within the fund. FHSS uses marginal rate minus 30% offset, which zeroes out at low incomes.

## Task 160: AU federal income tax brackets 2025/2026 [@backend] [MATH]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/tax-tables.ts`: Added AU_FEDERAL_2025 and AU_FEDERAL_2026 bracket tables (Stage 3 cuts: 0%/16%/30%/37%/45%). Added AU_MEDICARE_LEVY constants with low-income phase-in thresholds. Added `getAUBrackets()` (returns federal + empty state brackets) and `calculateMedicareLevy()`.
  - `src/lib/tax-engine.ts`: Replaced AU zero-tax stub with `computeAUTax()`. Handles employment income, capital gains (50% CGT discount), and Medicare Levy marginal rate integration.
  - `tests/unit/au-tax-brackets.test.ts`: New — 39 tests covering bracket structure, getAUBrackets, Medicare Levy (exempt/phase-in/full), marginal rates at key thresholds, tax amounts at bracket boundaries, capital gains discount, 2026 indexation, and all-jurisdictions parity.
  - `tests/unit/au-country-type.test.ts`: Updated AU tax engine tests from stub expectations to real calculations.
  - `tests/unit/changelog.test.ts`: Updated counts (159→160, milestone entries 2→3).
  - `src/lib/changelog.ts`: Added version 160 entry.
- **Tests**: T1: 2293 passed (126 files), Build: passes
- **Screenshots**: N/A (backend/math task)
- **Notes**: Pre-existing changelog test failure fixed in separate commit. Medicare Levy uses single-filer thresholds (family thresholds deferred — we don't track dependents in the tax engine).

## Task 159: AU states/territories in CountryJurisdictionSelector [@frontend]
- **Date**: 2026-03-08
- **Files**:
  - `src/components/CountryJurisdictionSelector.tsx`: Added `AU_STATES_TERRITORIES` array (NSW, VIC, QLD, SA, WA, TAS, NT, ACT, alphabetically sorted). Updated `jurisdictions` to use AU list when country is "AU". Added 🇦🇺 AU button to the country toggle (`data-testid="country-au"`).
  - `tests/unit/country-jurisdiction-selector.test.tsx`: Added 8 new tests covering AU button active state, AU states shown, switching to AU resets jurisdiction, and AU data validation tests.
  - `tests/e2e/country-jurisdiction.spec.ts`: Added 2 new E2E tests (switching to AU, switching from AU to CA). Updated screenshot capture to task-159.
  - `src/lib/changelog.ts`: Added version 159 entry.
- **Tests**: T1: 2254 passed (125 files), Build: passes, T2: 8 passed (country-jurisdiction.spec.ts)
- **Screenshots**: task-159-country-jurisdiction-selector.png

## Task 158: Widen country type to CA | US | AU [@backend]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/financial-types.ts`: `country?: "CA" | "US"` → `"CA" | "US" | "AU"`
  - `src/lib/currency.ts`: Added "AUD" to SupportedCurrency. `getHomeCurrency("AU")` → "AUD". `getForeignCurrency("AUD")` → "USD". Added AUD↔USD and AUD↔CAD fallback rates. Fixed `formatCurrencyCompact` symbol map for AUD ("AU$").
  - `src/lib/url-state.ts`: Updated cast comment and country cast to include "AU".
  - `src/lib/tax-credits.ts`: All `"CA" | "US"` widened to `"CA" | "US" | "AU"`. AU returns empty arrays (no credits defined yet).
  - `src/lib/sample-profiles.ts`: `getProfilesForCountry` accepts AU (falls back to CA profiles until Task 165).
  - `src/lib/benchmarks.ts`: All functions accept AU. Added AU entry to DATA_SOURCES.
  - `src/lib/scenario.ts`: TAX_SHELTERED_LIMITS country type widened.
  - `src/lib/runway-simulation.ts`: All country params widened.
  - `src/lib/withdrawal-tax.ts`: country param widened.
  - `src/lib/tax-engine.ts`: Added AU stub returning zero taxes (full impl in Task 160).
  - `src/lib/insights/types.ts` and `generate.ts`: country widened.
  - `src/app/_use-financial-state.ts`: state and handler types widened.
  - `src/components/CountryJurisdictionSelector.tsx`: DEFAULT_JURISDICTION includes AU→NSW. Jurisdictions list handles AU (empty until Task 159). aria-label updated.
  - `src/components/BenchmarkComparisons.tsx`, `DataFlowArrows.tsx`, `ExpenseEntry.tsx`, `TaxCreditEntry.tsx`, `MobileWizard.tsx`: prop types widened.
  - `src/components/wizard/WizardShell.tsx`, `ProfileStep.tsx`, `WelcomeStep.tsx`, `ExpensesStep.tsx`, `TaxCreditsStep.tsx`: prop types widened.
  - `src/lib/changelog.ts`: Added version 158 entry. Added "Australia Country Support" milestone (158-169).
  - `tests/unit/au-country-type.test.ts`: New — 28 unit tests covering currency, FX rates, profiles, benchmarks, credits, tax engine, and FinancialState type.
  - `tests/unit/changelog.test.ts`: Updated counts (157→158, 15→16 milestones).
- **Tests**: T1: 2247 passed (125 files), Build: passes
- **Screenshots**: N/A (backend/type-widening task)

## Task 156: Retirement-aware Money Steps [@fullstack]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/url-state.ts`: Added `getRetiredFromURL()` and `updateRetiredURL()` helpers for `fret=1` URL param.
  - `src/lib/flowchart-steps.ts`: Added `detectRetirementHeuristic()` export. Updated `getFlowchartSteps()` to accept `isRetired` param. When retired: budget step completes with expenses alone (hint: "Expenses tracked — living on savings/investments"), employer match auto-completes ("Retired — employer match not applicable"), TFSA/RRSP/HSA/IRA/401k steps become skippable with "Retired — contributions are optional" label.
  - `src/components/FinancialFlowchart.tsx`: Added `isRetired` state loaded from/saved to URL. Added "I'm retired" toggle checkbox in header. Added "Retirement mode" badge when active. Added retirement suggestion banner (shows when heuristic fires but user hasn't enabled mode). Added `data-testid="step-modal-{id}"` to modal dialog.
  - `src/lib/changelog.ts`: Added version 156 entry.
  - `tests/unit/retirement-aware-steps.test.ts`: New — 20 unit tests covering heuristic detection, CA/US retirement step behavior.
  - `tests/unit/changelog.test.ts`: Updated entry count to 156.
  - `tests/e2e/retirement-aware-steps.spec.ts`: New — 6 Playwright tests: toggle visibility, badge, URL persistence, suggestion banner, employer match modal, uncheck.
- **Tests**: T1: 2223 passed (124 files), T2: 6/6 passed, Build: passes
- **Screenshots**: task-156-retired-toggle-unchecked.png, task-156-retired-toggle-checked.png, task-156-employer-match-retired.png

## Task 155: Validate all US tax credits/brackets for 2025/2026 [@backend] [MATH]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/tax-credits.ts`: Updated all US credit values to IRS 2025 amounts (Rev. Proc. 2024-40). EITC $8,046 (was $7,430), phase-outs $21,370/$59,899 single (was $17,640/$56,838). CTC refundable $1,700 (was $1,600). Adoption Credit $17,280 with phase-out $259,190-$299,190 (was $15,950/$252,150-$292,150). Saver's Credit limits $39,500/$59,250/$79,000 (was $38,250/$57,375/$76,500). Student Loan Interest phase-out $85,000-$100,000 (was $80,000-$95,000). All 2026 overrides re-estimated with ~2.8% inflation.
  - `tests/unit/us-tax-credit-validation.test.ts`: New — 41 tests validating all corrected US credit values for both 2025 and 2026.
  - `tests/unit/tax-credits.test.ts`: Updated existing tests to match corrected values.
  - `tests/unit/tax-year-selector.test.ts`: Updated existing tests to match corrected values.
  - `tests/unit/changelog.test.ts`: Updated entry count to 155.
  - `src/lib/changelog.ts`: Added version 155 entry.
- **Tests**: T1: 158 passed (tax credit tests), Build: passes
- **Screenshots**: N/A (backend/data-only task)

## Task 154: Validate all Canadian tax credits/brackets for 2025/2026 [@backend] [MATH]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/tax-credits.ts`: Updated all CA credit values to CRA 2025 indexed amounts. DTC $10,138 (was $9,428), Spousal Amount $2,419 (was $2,359), Canada Caregiver $8,601 (was $7,999), CWB $1,633/$2,813 (was $1,518), GST/HST $533 with corrected phase-out range, CCB $7,997/$6,748 (was $7,437), Medical Expense threshold $2,833 (was $2,759), Canada Training Credit cap $154,534 (was $150,473). Added 2026 yearOverrides for Spousal Amount, Canada Caregiver, Medical Expense, and Canada Training Credit. Updated all existing 2026 overrides. Fixed Climate Action Incentive to not be income-tested.
  - `tests/unit/ca-tax-credit-validation.test.ts`: New — 30 tests validating all corrected CA credit values for both 2025 and 2026.
  - `tests/unit/tax-credits.test.ts`: Updated existing tests to match corrected values.
  - `tests/unit/tax-year-selector.test.ts`: Updated existing tests to match corrected values.
  - `src/lib/changelog.ts`: Added version 154 entry.
- **Tests**: T1: 2161 passed (122 files), Build: passes
- **Screenshots**: N/A (backend/data-only task)

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
