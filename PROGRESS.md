# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 195
- **Completed**: 193
- **Remaining**: 2
- **Last Updated**: 2026-03-20

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

## Task 193: Retirement readiness score [@fullstack]
- **Date**: 2026-03-21
- **Files**:
  - `src/lib/retirement-readiness.ts`: New — 0-100 score combining 5 weighted components: income replacement (30%), emergency runway (20%), government benefits (15%), debt position (15%), tax diversification (20%). Tier labels: Getting Started/Building/On Track/Strong/Retirement Ready.
  - `src/components/RetirementReadinessScore.tsx`: New — card with score display, tier badge, overall progress bar, and 5 component mini-bars with icons and labels.
  - `src/app/page.tsx`: Added imports, computes readiness score from financial data, renders in compare section.
  - `tests/unit/retirement-readiness.test.ts`: New — 17 tests covering tiers, score computation, component sensitivity, edge cases.
  - `tests/e2e/retirement-readiness.spec.ts`: New — 2 tests covering score visibility and component breakdowns.
- **Tests**: T1: 2848 passed (153 files), T2: 2 passed (Playwright), Build: passes
- **Screenshots**: `task-193-retirement-readiness.png`

## Task 192: RRIF/RMD required minimum distributions [@fullstack] [MATH]
- **Date**: 2026-03-21
- **Files**:
  - `src/lib/required-minimum-distributions.ts`: New — US RMD Uniform Lifetime Table (ages 73-120), CA RRIF minimum withdrawal table (ages 71-95+). Functions: `getUsRmdPercent`, `getCaRrifPercent`, `computeRequiredMinimumDistribution`, `getRmdSummaries`. Constants: `US_RMD_START_AGE=73`, `CA_RRIF_CONVERSION_AGE=71`.
  - `src/lib/financial-state.ts`: `toFinancialData` computes RMD summaries from user's age and asset categories. Passes to FinancialData.
  - `src/lib/insights/types.ts`: Added `rmdSummaries` to FinancialData, `"rmd"` to InsightType.
  - `src/lib/insights/generate.ts`: RMD insight showing required annual withdrawals with per-account breakdowns. "Upcoming" variant for ages 65-72 (CA) or 65-72 (US) with tax-deferred accounts.
  - `src/components/InsightsPanel.tsx`: Added "rmd" to insight-section mapping.
  - `tests/unit/required-minimum-distributions.test.ts`: New — 25 tests covering US RMD, CA RRIF, computeRMD, summaries, toFinancialData.
  - `tests/e2e/required-minimum-distributions.spec.ts`: New — 2 tests.
- **Tests**: T1: 2831 passed (152 files), T2: 2 passed (Playwright), Build: passes
- **Screenshots**: `task-192-rmd-ca-75.png`, `task-192-no-rmd-ca-40.png`

## Task 191: Early withdrawal penalty warnings [@fullstack] [MATH]
- **Date**: 2026-03-21
- **Files**:
  - `src/lib/withdrawal-tax.ts`: Added `EarlyWithdrawalPenalty` interface and `getEarlyWithdrawalPenalties` function. Rules: US 401k/IRA 10% penalty before 59.5, CA RRSP withholding warning before 65, AU Super preservation age 60. FHSS excluded.
  - `src/lib/financial-state.ts`: `computeWithdrawalTaxSummary` now computes and includes early withdrawal penalties based on user age.
  - `src/lib/insights/types.ts`: Added `earlyWithdrawalPenalties` to withdrawalTax data.
  - `src/components/WithdrawalTaxSummary.tsx`: Added penalty warning badges with amber styling, penalty percentage badges, rule descriptions, and penalty-free age display.
  - `src/app/page.tsx`: Wired WithdrawalTaxSummary into breakdowns section (was previously unused). Passes earlyWithdrawalPenalties prop.
  - `tests/unit/early-withdrawal-penalties.test.ts`: New — 19 tests covering US/CA/AU penalties, edge cases, toFinancialData integration.
  - `tests/e2e/early-withdrawal-penalties.spec.ts`: New — 2 tests covering penalty visibility for young CA user and absence for older user.
- **Tests**: T1: 2806 passed (151 files), T2: 2 passed (Playwright), Build: passes
- **Screenshots**: `task-191-early-withdrawal-ca-40.png`, `task-191-no-penalties-ca-70.png`

## Task 190: Retirement income waterfall chart [@frontend]
- **Date**: 2026-03-21
- **Files**:
  - `src/components/RetirementIncomeChart.tsx`: New — horizontal stacked bar chart comparing retirement income sources (government benefits + portfolio 4% rule) vs monthly expenses. Color-coded segments (cyan=government, violet=portfolio), coverage percentage, gap calculation. Country-aware labels (CPP+OAS / Social Security / Age Pension).
  - `src/app/page.tsx`: Added RetirementIncomeChart import. Computed `monthlyGovRetirementIncome`, `monthlyPortfolioWithdrawal`, `showRetirementChart`. Renders in breakdowns section when any retirement income exists.
  - `tests/unit/retirement-income-chart.test.ts`: New — 9 tests covering coverage calculation, gap computation, portfolio withdrawal (4% rule), government income by country.
  - `tests/e2e/retirement-income-chart.spec.ts`: New — 2 tests covering chart visibility with/without government income.
- **Tests**: T1: 2787 passed (150 files), T2: 2 passed (Playwright), Build: passes
- **Screenshots**: `task-190-retirement-income-chart-ca.png`, `task-190-retirement-income-chart-default.png`

## Task 189: Government retirement income estimator (AU) [@fullstack] [MATH]
- **Date**: 2026-03-20
- **Files**:
  - `src/lib/government-retirement.ts`: Added AU Age Pension constants (single $1,116.30/fn, couple $841.40/fn each), preservation age 60, pension age 67, `AuPensionPreset` type, `getAuPensionPresetAmount`, `fortnightlyToMonthly` helpers.
  - `src/components/GovernmentRetirementInput.tsx`: Added `AgePensionInput` component with single/couple/custom presets. Fortnightly display with monthly conversion in summary. Updated main component to render AU input.
  - `tests/unit/government-retirement-au.test.ts`: New — 18 tests covering constants, presets, fortnightly-to-monthly conversion, computeMonthlyGovernmentIncome for AU, FIRE number reduction, toFinancialData, URL round-trip.
  - `tests/e2e/government-retirement-au.spec.ts`: New — 3 tests covering AU pension rendering, single preset, URL persistence.
- **Tests**: T1: 2778 passed (149 files), T2: 3 passed (Playwright), Build: passes
- **Screenshots**: `task-189-au-pension-default.png`, `task-189-au-pension-single.png`

## Task 188: Government retirement income estimator (US) [@fullstack] [MATH]
- **Date**: 2026-03-20
- **Files**:
  - `src/lib/government-retirement.ts`: Added SS constants (average $1,976, max at 62/67/70), `SsPreset` type, `getSsPresetAmount` helper.
  - `src/components/GovernmentRetirementInput.tsx`: Added `SocialSecurityInput` component with 6 presets (none/average/max-62/max-67/max-70/custom). Updated main component to render US input when country=US.
  - `tests/unit/government-retirement-us.test.ts`: New — 16 tests covering SS presets, computeMonthlyGovernmentIncome for US, FIRE number reduction, toFinancialData, URL round-trip.
  - `tests/e2e/government-retirement-us.spec.ts`: New — 4 tests covering SS rendering, preset selection, URL persistence.
- **Tests**: T1: 2760 passed (148 files), T2: 4 passed (Playwright), Build: passes
- **Screenshots**: `task-188-ss-default.png`, `task-188-ss-average.png`, `task-188-ss-max-70.png`

## Task 187: Government retirement income estimator (CA) [@fullstack] [MATH]
- **Date**: 2026-03-20
- **Files**:
  - `src/lib/financial-types.ts`: Added `GovernmentRetirementIncome` interface (cppMonthly, oasMonthly, ssMonthly, agePensionFortnightly) and field to FinancialState.
  - `src/lib/government-retirement.ts`: New — CPP/OAS constants (2025 amounts), preset helpers, `computeMonthlyGovernmentIncome` for CA/US/AU.
  - `src/lib/compute-totals.ts`: `computeFireNumber` now accepts optional `monthlyGovernmentIncome` parameter to reduce FIRE number.
  - `src/lib/financial-state.ts`: `toFinancialData` computes government income and passes to FIRE number. `computeCoastFireAge` accepts government income. Added `monthlyGovernmentRetirementIncome` to output.
  - `src/lib/url-state.ts`: Added `gri` compact key for government retirement income serialization.
  - `src/lib/insights/types.ts`: Added `monthlyGovernmentRetirementIncome` to FinancialData.
  - `src/lib/insights/generate.ts`: Coast FIRE insight passes government income to calculation.
  - `src/components/GovernmentRetirementInput.tsx`: New — CPP/OAS preset selector (none/average/max/custom for CPP, none/full/custom for OAS) with summary display.
  - `src/components/wizard/steps/ProfileStep.tsx`: Added government retirement input for CA users in advanced mode.
  - `src/components/wizard/WizardShell.tsx`: Added government retirement income props.
  - `src/app/_use-financial-state.ts`: Added `governmentRetirementIncome`/`setGovernmentRetirementIncome` state, URL restore/persist.
  - `src/app/page.tsx`: Wired government retirement income through state and WizardShell.
  - `tests/unit/government-retirement-ca.test.ts`: New — 22 tests covering presets, FIRE number reduction, Coast FIRE, toFinancialData, URL round-trip.
  - `tests/e2e/government-retirement-ca.spec.ts`: New — 4 tests covering CPP/OAS rendering, preset selection, summary, URL persistence.
- **Tests**: T1: 2744 passed (147 files), T2: 4 passed (Playwright), Build: passes
- **Screenshots**: `task-187-gov-income-default.png`, `task-187-cpp-average.png`, `task-187-cpp-oas-combined.png`

## Task 186: Retirement age input [@fullstack]
- **Date**: 2026-03-20
- **Files**:
  - `src/lib/financial-types.ts`: Added `retirementAge?: number` to FinancialState interface.
  - `src/lib/url-state.ts`: Added `ra?: number` to CompactState, serialize/deserialize (omitted when default 65).
  - `src/app/_use-financial-state.ts`: Added `retirementAge`/`setRetirementAge` state, URL restore, URL persist.
  - `src/app/_page-helpers.tsx`: New `RetirementAgeInput` component with inline editing, "years away" display.
  - `src/components/wizard/steps/ProfileStep.tsx`: Added retirement age input field below age input.
  - `src/components/wizard/WizardShell.tsx`: Added `retirementAge`/`setRetirementAge` props.
  - `src/app/page.tsx`: Wired `retirementAge`/`setRetirementAge` through state and WizardShell.
  - `src/lib/financial-state.ts`: Passes `retirementAge` through `toFinancialData`.
  - `src/lib/insights/types.ts`: Added `retirementAge` to `FinancialData` interface.
  - `src/lib/insights/generate.ts`: Coast FIRE insight uses `retirementAge` instead of hardcoded 65.
  - `tests/unit/retirement-age.test.ts`: New — 12 tests covering computeCoastFireAge with custom retirement age, toFinancialData passing, URL state round-trip.
  - `tests/e2e/retirement-age.spec.ts`: New — 4 tests covering default value, change, URL persistence, default omission.
- **Tests**: T1: 2722 passed (146 files), T2: 4 passed (Playwright), Build: passes
- **Screenshots**: `task-186-retirement-age-default.png`, `task-186-retirement-age-changed.png`

## Task 184: Simple/advanced mode E2E tests [@qa] [E2E]
- **Date**: 2026-03-09
- **Files**:
  - `tests/e2e/simple-advanced-mode-e2e.spec.ts`: New — 21 tests covering mode toggle URL persistence, simple mode wizard step hiding, advanced mode all-fields visibility, data preservation across mode switches (assets, income, debts), simple/advanced dashboard sections, and all 6 quick-start profiles (CA/US/AU renter + homeowner).
- **Tests**: T1: 2710 passed (145 files), T2: 21 passed, T3: 693 passed (full regression), Build: passes
- **Screenshots**: task-184-simple-mode-persists-url, task-184-data-preserved-after-mode-switch, task-184-debts-preserved-through-simple, task-184-simple-dashboard-sections, task-184-advanced-dashboard-sections, task-184-ca-renter-dashboard, task-184-ca-homeowner-dashboard, task-184-us-renter-dashboard, task-184-us-homeowner-dashboard, task-184-au-renter-dashboard, task-184-au-homeowner-dashboard
- **Notes**: All 184 tasks complete. Full regression green — 693 E2E tests pass.

## Task 162: AU tax credits and offsets [@backend] [MATH]
- **Date**: 2026-03-08
- **Files**:
  - `src/lib/tax-credits.ts`: Added `AUFilingStatus` type ("single" | "married-de-facto"). Updated `getFilingStatuses` for AU. Added 9 AU credit categories: LITO, SAPTO, MLS (info-only), Private Health Insurance Rebate, Franking Credits, Zone Tax Offset, Super Co-contribution, Spouse Super Tax Offset, Super Concessional Contributions (info-only). Updated `isMarried` check and `getIncomeLimitDescription` for married-de-facto.
  - `src/lib/insights/formatting.ts`: Added "Married/De Facto" label for married-de-facto status.
  - `src/lib/changelog.ts`: Added version 162 entry.
  - `tests/unit/au-tax-credits.test.ts`: New — 36 tests covering AU filing statuses, credit categories, LITO phase-out, SAPTO thresholds, MLS info-only, PHI rebate, franking credits, super co-contribution, spouse super offset, zone tax offset, income limit descriptions, and CA/US regression.
  - `tests/unit/au-country-type.test.ts`: Fixed pre-existing test (separate commit) — AU now has credits.
- **Tests**: T1: 2361 passed (128 files), Build: passes
- **Screenshots**: N/A (backend/math task)
- **Notes**: LMITO excluded — expired June 30, 2022. Franking credits are refundable (excess credits produce a cash refund). MLS is info-only since it's a surcharge, not a claimable credit.

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
