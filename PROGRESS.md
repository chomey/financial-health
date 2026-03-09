# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 184
- **Completed**: 180
- **Remaining**: 4
- **Last Updated**: 2026-03-09

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

## Task 183: Update sample profiles and welcome step for simple mode [@frontend]
- **Date**: 2026-03-09
- **Files**:
  - `src/lib/sample-profiles.ts`: Added `QUICK_START_CA_PROFILES`, `QUICK_START_US_PROFILES`, `QUICK_START_AU_PROFILES` (2 profiles each: "Renter with salary" and "Homeowner with mortgage") with simple-mode-only fields (no stocks, no costBasis, no employerMatch); homeowner profiles use `_simple_home` property ID; added `getQuickStartProfilesForCountry()` function
  - `src/components/wizard/steps/WelcomeStep.tsx`: Added `useModeContext` and `getQuickStartProfilesForCountry` imports; in simple mode shows tagline "Get a quick snapshot of your financial health in under 2 minutes." and quick-start profiles; in advanced mode shows standard tagline and existing advanced sample profiles; added `data-testid="welcome-tagline"` to tagline element
  - `tests/unit/welcome-step-simple-mode.test.tsx`: 14 unit tests — quick-start profile counts/IDs per country, no stocks/costBasis/employerMatch, homeowner _simple_home property, WelcomeStep tagline per mode, profile buttons visible per mode, loadProfile called correctly
  - `tests/e2e/welcome-step-simple-mode.spec.ts`: 6 Playwright tests — simple/advanced taglines, quick-start profiles visible/hidden per mode, loading ca-renter/ca-homeowner profiles
  - `src/lib/changelog.ts`: Added version 183 entry
- **Tests**: T1: 2710 passed (145 files), T2: 6 passed, Build: passes
- **Screenshots**: task-183-welcome-simple-mode-tagline, task-183-welcome-advanced-mode-tagline, task-183-welcome-simple-quick-start-profiles, task-183-welcome-ca-renter-loaded, task-183-welcome-ca-homeowner-loaded

## Task 182: Simplify dashboard in simple mode [@frontend]
- **Date**: 2026-03-09
- **Files**:
  - `src/app/page.tsx`: Made `DASHBOARD_SECTIONS` mode-aware (4 sections in simple, 8 in advanced); renamed "Metrics" → "Overview" in simple mode; wrapped cashflow, breakdowns, compare, scenarios sections with `mode !== "simple"` conditionals; added upgrade banner at bottom in simple mode
  - `src/lib/ModeContext.tsx`: Added `useOptionalModeContext()` hook (returns "advanced" default when not in provider — avoids breaking existing tests)
  - `src/components/SnapshotDashboard.tsx`: Uses `useOptionalModeContext`; filters to only Net Worth, Monthly Cash Flow, Financial Runway in simple mode; uses `sm:grid-cols-3` layout in simple mode
  - `src/components/InsightsPanel.tsx`: Uses `useOptionalModeContext`; caps at 4 insights in simple mode; filters out "fire" and "income-replacement" insight types in simple mode
  - `src/components/ProjectionChart.tsx`: Uses `useOptionalModeContext`; locks scenario to "moderate" in simple mode via `useEffect`; hides scenario toggle buttons in simple mode
  - `tests/unit/simple-mode-dashboard.test.tsx`: 7 unit tests — 3 metrics in simple, all in advanced, grid classes, InsightsPanel caps
  - `tests/e2e/simple-mode-dashboard.spec.ts`: 6 Playwright tests — 4 nav sections, 8 nav sections, hidden sections, 3-metric overview, upgrade banner, banner switches mode
  - `src/lib/changelog.ts`: Added version 182 entry
- **Tests**: T1: 2693 passed (144 files), T2: 6 passed, Build: passes
- **Screenshots**: task-182-simple-mode-dashboard-stepper, task-182-advanced-mode-dashboard-stepper, task-182-simple-mode-overview-3-metrics, task-182-simple-mode-upgrade-banner

## Task 181: Simplify PropertyEntry and fold into Assets in simple mode [@fullstack]
- **Date**: 2026-03-09
- **Files**:
  - `src/components/AssetEntry.tsx`: Added `Property` type import and `SIMPLE_HOME_ID` export; added `properties` and `onPropertiesChange` props; added simple mode "Home" subsection at top with inline-editable "Home value" and "Mortgage balance" fields; maps to a single `_simple_home` Property item in state
  - `src/components/wizard/steps/AssetsStep.tsx`: Added `properties` and `onPropertiesChange` optional props; passed them through to `AssetEntry`
  - `src/components/wizard/WizardShell.tsx`: Passed `properties={props.properties}` and `onPropertiesChange={props.setProperties}` to `AssetsStep`
  - `tests/unit/asset-entry-simple-home.test.tsx`: 10 unit tests — visibility per mode, amount display, upsert/update/remove via onPropertiesChange, preserve non-simple properties
  - `tests/e2e/asset-entry-simple-home.spec.ts`: 3 Playwright tests — section visible in simple, hidden in advanced, can enter home value
  - `src/lib/changelog.ts`: Added version 181 entry
- **Tests**: T1: 2686 passed (143 files), T2: 3 passed, Build: passes
- **Screenshots**: task-181-asset-simple-home-section, task-181-asset-advanced-mode-no-home-section, task-181-asset-simple-home-value-entered

## Task 180: Simplify DebtEntry and fold into Expenses in simple mode [@fullstack]
- **Date**: 2026-03-09
- **Files**:
  - `src/components/ExpenseEntry.tsx`: Added `useModeContext` import; added `Debt` type import and `SIMPLE_DEBT_CATEGORY` export; added `debts` and `onDebtsChange` props; added simple mode "Debt Payments" subsection with inline editable amount (stores to Debt item with `monthlyPayment` field, `amount=0`)
  - `src/components/wizard/steps/ExpensesStep.tsx`: Added `debts` and `onDebtsChange` optional props; passed them through to `ExpenseEntry`
  - `src/components/wizard/WizardShell.tsx`: Passed `debts={props.debts}` and `onDebtsChange={props.setDebts}` to `ExpensesStep`
  - `tests/unit/expense-entry-simple-debt.test.tsx`: 10 unit tests — visibility per mode, amount display, upsert/update/remove via onDebtsChange
  - `tests/e2e/expense-entry-simple-debt.spec.ts`: 3 Playwright tests — section visible in simple, hidden in advanced, can enter amount
  - `src/lib/changelog.ts`: Added version 180 entry
- **Tests**: T1: 2676 passed (142 files), T2: 3 passed, Build: passes
- **Screenshots**: task-180-expense-simple-debt-section, task-180-expense-advanced-mode-no-debt-section, task-180-expense-simple-debt-entered

## Task 179: Simplify IncomeEntry in simple mode [@frontend]
- **Date**: 2026-03-09
- **Files**:
  - `src/components/IncomeEntry.tsx`: Added `useModeContext` import; in simple mode hides income type selector (for existing items and new-item form), currency override badge (CurrencyBadge), and HelpTip tooltips; frequency dropdown remains visible in both modes
  - `tests/unit/income-entry-simple-mode.test.tsx`: 8 unit tests — verify hidden/visible fields per mode, add form behavior
  - `tests/e2e/income-entry-simple-mode.spec.ts`: 3 Playwright tests — simple mode hides income type, advanced shows it, add form works in simple mode
  - `src/lib/changelog.ts`: Added version 179 entry
- **Tests**: T1: 2666 passed (141 files), T2: 3 passed, Build: passes
- **Screenshots**: task-179-income-entry-simple-mode, task-179-income-entry-advanced-mode, task-179-income-entry-simple-add

## Task 178: Simplify AssetEntry in simple mode [@frontend]
- **Date**: 2026-03-09
- **Files**:
  - `src/components/AssetEntry.tsx`: Added `useModeContext` import; in simple mode hides ROI badge/editor, tax treatment pill, ROI tax treatment toggle, reinvest returns toggle, monthly contribution, employer match section, cost basis badge, unrealized gains badge, surplus target radio, per-asset projections, currency override badge, and all computed assets
  - `tests/test-utils.tsx`: Added `ModeProvider` + `mode` option to `customRender` so unit tests can render in specific modes
  - `tests/unit/asset-entry-simple-mode.test.tsx`: 15 unit tests — verify hidden fields in simple mode, visible fields in advanced mode
  - `tests/e2e/asset-entry-simple-mode.spec.ts`: 3 Playwright tests — simple mode hides advanced fields, advanced mode toggle shows all fields, add asset still works
  - `src/lib/changelog.ts`: Added version 178 entry
- **Tests**: T1: 2658 passed (140 files), T2: 3 passed, Build: passes
- **Screenshots**: task-178-asset-entry-simple-mode, task-178-asset-entry-advanced-mode, task-178-asset-entry-simple-add

## Task 177: Simplify wizard steps in simple mode [@fullstack]
- **Date**: 2026-03-09
- **Files**:
  - `src/lib/url-state.ts`: Added `SIMPLE_WIZARD_STEPS` (6 steps), `ADVANCED_WIZARD_STEPS` (9 steps), `getWizardSteps(mode)` helper; `WIZARD_STEPS` kept as backward-compat alias for `ADVANCED_WIZARD_STEPS`
  - `src/components/wizard/WizardStepper.tsx`: Added `steps` and `mode` props (default to advanced); renders only the provided steps; `tax-summary` shows "Summary" label in simple mode
  - `src/components/wizard/WizardShell.tsx`: Imports `useModeContext`, computes `activeSteps = getWizardSteps(mode)`, passes to WizardStepper; navigation and footer counter use `activeSteps.length`; URL step redirect to `welcome` if step not in current mode
  - `src/lib/changelog.ts`: Added version 177 entry
  - `tests/unit/wizard-steps-mode.test.ts`: 11 unit tests for `getWizardSteps`, step counts, step inclusion/exclusion, backward-compat alias
  - `tests/e2e/wizard-steps-mode.spec.ts`: 7 Playwright tests: simple/advanced step visibility, footer counters, stepper labels, mode-switch preserves step position
- **Tests**: T1: 2643 passed (139 files), T2: 7 passed, Build: passes
- **Screenshots**: task-177-wizard-steps-simple-mode, task-177-wizard-steps-advanced-mode, task-177-wizard-steps-mode-switch-preserves-step

## Task 176: Add mode toggle and persist in URL state [@fullstack]
- **Date**: 2026-03-09
- **Files**:
  - `src/lib/financial-types.ts`: Added `mode?: "simple" | "advanced"` to `FinancialState`
  - `src/lib/url-state.ts`: Added `mo?` to `CompactState`, serialize (omit when simple/default), deserialize into `mode` field
  - `src/lib/ModeContext.tsx`: New — `AppMode` type, `ModeProvider`, `useModeContext()` hook
  - `src/app/_use-financial-state.ts`: Added `mode`/`setMode` state, restore from URL, include in `updateURL`
  - `src/app/_page-helpers.tsx`: Added `ModeToggle` component and import; wired into `AppHeader` between phase toggle and right-side buttons
  - `src/components/wizard/steps/ProfileStep.tsx`: Added mode selector card with Simple/Advanced buttons using `useModeContext()`
  - `src/app/page.tsx`: Import `ModeProvider`, destructure `mode`/`setMode`, wrap both wizard and dashboard returns
  - `src/lib/changelog.ts`: Added version 176 entry
  - `tests/unit/mode-toggle.test.tsx`: New — 8 unit tests covering ModeContext render/interaction/error and URL round-trip (simple omitted, advanced persisted, field isolation)
  - `tests/e2e/mode-toggle.spec.ts`: New — 5 E2E tests covering default simple mode, switching to advanced, URL persistence on reload, ProfileStep buttons, data preserved on mode switch
- **Tests**: T1: 2632 passed (138 files), T2: 5 passed, Build: passes
- **Screenshots**: task-176-mode-toggle-default-simple, task-176-mode-toggle-advanced-active, task-176-mode-toggle-persists-url, task-176-mode-toggle-data-preserved, task-176-mode-toggle-profile-step

## Task 175: Support yearly/one-time expenses [@fullstack]
- **Date**: 2026-03-09
- **Files**:
  - `src/components/ExpenseEntry.tsx`: Added `ExpenseFrequency` type (`"monthly" | "yearly" | "one-time"`), `normalizeExpenseToMonthly()` export, `frequency` field on `ExpenseItem`, frequency dropdown on each item (testid `expense-frequency-${id}`), frequency dropdown in add form (`new-expense-frequency`), updated amount display (shows `$X/yr → $Y/mo` for yearly, `$X once → $Y/mo` for one-time), updated total calculation.
  - `src/lib/url-state.ts`: Added `f?` field to `CompactExpense`, serialize/deserialize frequency (omit when monthly).
  - `src/lib/compute-totals.ts`: Import and use `normalizeExpenseToMonthly` for monthly expenses.
  - `src/lib/flowchart-steps.ts`: Import and use `normalizeExpenseToMonthly` in `getRawMonthlyExpenses`, `detectRetirementHeuristic`, and budget detail items.
  - `src/lib/financial-state.ts`: Import and use `normalizeExpenseToMonthly` for rent detection and withdrawal tax calculations.
  - `src/lib/sankey-data.ts`: Import and use `normalizeExpenseToMonthly` for Sankey diagram expense nodes.
  - `src/app/page.tsx`: Import and use `normalizeExpenseToMonthly` for expense items display.
  - `src/components/ExpenseBreakdownChart.tsx`: Import and use `normalizeExpenseToMonthly` in `computeExpenseBreakdown` and manual expenses calculation.
  - `src/lib/changelog.ts`: Updated version 175 entry.
  - `tests/unit/expense-frequency.test.tsx`: New — 18 unit tests covering `normalizeExpenseToMonthly`, frequency UI display, total normalization, dropdown interactions, and integration calculations.
  - `tests/e2e/expense-frequency.spec.ts`: New — 7 E2E tests covering default dropdowns, yearly frequency update, label display, add form frequency selector, add yearly/one-time expenses, URL state persistence.
- **Tests**: T1: 2624 passed (137 files), T2: 7 passed, Build: passes
- **Screenshots**: task-175-expense-frequency-defaults, task-175-expense-yearly-frequency, task-175-expense-yearly-label, task-175-add-form-with-frequency, task-175-add-yearly-expense, task-175-add-one-time-expense, task-175-expense-frequency-persists

## Task 173: AU E2E tests and regression [@qa] [E2E] [MILESTONE]
- **Date**: 2026-03-09
- **Files**:
  - `tests/e2e/au-e2e.spec.ts`: New — 18 E2E tests covering AU full flow (3 profiles → dashboard), AUD currency display (country button, FX rate, currency badges), Money Steps (AU steps present, CA/US absent), Tax Summary step (Financial Summary with effective rate), Super accounts in assets step (all 3 profiles), CA regression (Money Steps, sample profile, default country/jurisdiction), US regression (Money Steps, country cycle).
  - `tests/unit/au-url-state.test.ts`: New — 13 unit tests covering AU sample profile URL state round-trip (country preserved, super accounts, HECS-HELP debt, properties, ASX stocks, URL-safe length, no plaintext sensitive data).
- **Tests**: T1: 2606 passed (136 files), T2: 18 passed, Build: passes
- **Screenshots**: task-173-au-young-professional-dashboard, task-173-au-mid-career-family-dashboard, task-173-au-pre-retiree-dashboard, task-173-au-country-selected, task-173-au-fx-display-aud, task-173-au-currency-badge-aud, task-173-au-money-steps, task-173-au-tax-summary, task-173-au-pre-retiree-tax-summary, task-173-au-super-in-assets, task-173-au-mid-career-assets, task-173-au-pre-retiree-super-assets, task-173-regression-ca-money-steps, task-173-regression-ca-fresh-grad-dashboard, task-173-regression-us-money-steps, task-173-regression-country-cycle

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
