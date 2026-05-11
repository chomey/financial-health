# Tasks

<!-- Older tasks archived to TASKS-ARCHIVE.md -->

<!-- Completed tasks archived to TASKS-ARCHIVE.md. Last completed: Task 217. -->
<!-- Ralph picks up the first unchecked task and works on exactly one per iteration. -->

## Country Plugin Architecture Refactor (Phase A)

**Spec:** `docs/superpowers/specs/2026-05-09-uk-support-design.md`
**Plan:** `docs/superpowers/plans/2026-05-09-country-plugin-architecture.md`

Tasks 1–5 of the plan already landed on branch `feat/country-plugin-architecture`:
snapshot regression baselines, shared interfaces, registry shell, Canada bracket-data
extraction, and `canadianVehicles` catalog. These Ralph tasks (196–234) cover plan
tasks 6–44. Each Ralph task points to the corresponding plan task — read that section
of the plan for full step-by-step detail (file paths, code, commands, commit message).

Snapshot regression tests at `tests/unit/tax-engine-snapshot.test.ts` and
`tests/unit/withdrawal-tax-snapshot.test.ts` MUST stay green after every task.
If a snapshot mismatch appears, the change broke behavior — investigate before
regenerating snapshots.

**Test convention:** vitest only includes `tests/unit/**/*.test.{ts,tsx}`. Put new
test files there, mirroring source paths (e.g. `tests/unit/countries/canada/vehicles.test.ts`).

### Cross-cutting interface changes (plan tasks 28–31)

- [ ] Task 219: Drop legacy TaxResult fields — Remove `federalTax` and `provincialStateTax` from the `TaxResult` interface in `src/lib/tax-engine.ts`. Find every consumer (`grep -rn "\.federalTax\|\.provincialStateTax\|\.medicareLevy" src/`) and rewrite as `result.breakdown.find(b => b.kind === "income-tax")?.amount ?? 0` (or `"social"` for Medicare Levy, `"sub-federal"` for state/provincial). Remove legacy field population from each country's `tax-engine.ts`. Regenerate tax-engine snapshot with `-u` and visually verify the new shape. [@fullstack] [OPUS]

- [ ] Task 220: Locale threading through CurrencyFormatter — Extend `CurrencyFormatter` constructor in `src/lib/currency.ts` to accept an optional `locale: Locale` (default `"en-US"`). Update `formatCurrency` and `formatCurrencyCompact` to accept and use locale. Update `CurrencyContext.tsx` to pull locale from `getCountry(country).locale` when constructing the formatter. Visual check: CA/US/AU formatting unchanged. [@fullstack]

- [ ] Task 221: Plugin contract tests — Create `tests/unit/countries/contract.test.ts` running shared assertions against every `CountryProfile` in `COUNTRIES`: zero income → zero tax, breakdown sums to totalTax, marginalRate in [0,1], effectiveRate ≤ marginalRate, locale parseable by Intl, defaultJurisdiction in jurisdictions list, defaultFilingStatus in filingStatuses, taxYearLabel non-empty. [@backend] [@qa]

### Consumer migration — library shims (plan tasks 32–36)

- [ ] Task 222: tax-engine.ts shim — Rewrite `src/lib/tax-engine.ts` to a thin shim. Public `computeTax(income, type, country, jurisdiction, year)` and `getMarginalRateForIncome` delegate to `getCountry(country).taxEngine.*`. Keep `IncomeType` and `TaxResult` type exports. Snapshot regressions must stay green. [@backend]

- [ ] Task 223: withdrawal-tax.ts shim — Rewrite `src/lib/withdrawal-tax.ts` to delegate `getWithdrawalTaxRate`, `classifyTaxTreatment`, `getEarlyWithdrawalPenalties` to `getCountry(country).taxEngine`. Keep `TaxTreatment`, `WithdrawalTaxResult`, `EarlyWithdrawalPenalty` type exports. Snapshot regressions must stay green. [@backend]

- [ ] Task 224: government-retirement.ts shim — Rewrite `computeMonthlyGovernmentIncome(country, gri)` as `getCountry(country).governmentRetirement.computeMonthly(gri)`. Keep `GovernmentRetirementIncome` type export. [@backend]

- [ ] Task 225: tax-credits.ts shim — Rewrite `getCreditCategories(country, year)`, `getCategoriesForFilingStatus`, `findCreditCategory` to delegate via registry. Keep `TaxCreditCategory`, `FilingStatus`, `IncomeLimitThresholds`, `TaxCredit` type exports and the `resolveCategoryForYear` helper. [@backend]

- [ ] Task 226: sample-profiles.ts shim — Rewrite `getProfilesForCountry(country)` and `getQuickStartProfilesForCountry(country)` to delegate to `getCountry(country).profiles`. Keep `SampleProfile` type export. [@backend]

### Consumer migration — components (plan tasks 37–41)

- [ ] Task 227: AssetEntry reads from VehicleCatalog — In `src/components/AssetEntry.tsx`, replace `CATEGORY_SUGGESTIONS` (line ~38), `ACCOUNT_TYPE_DESCRIPTIONS` (~51), `DEFAULT_ROI` (~107), `EMPLOYER_MATCH_ELIGIBLE` (~134), `INCOME_TAX_ROI_CATEGORIES` (~156), `TAX_SHELTERED_CATEGORIES` (~161), `REINVEST_DEFAULT_CATEGORIES` (~177), CA/US/AU asset category sets (~77-81), `getGroupedCategorySuggestions` (~97), and `getAssetCategoryFlag` (~190) with calls into `getRegisteredCountries()` and `getCountry(code).vehicles`. Delete the now-unused constants. [@fullstack]

- [ ] Task 228: CountryJurisdictionSelector reads from registry — In `src/components/CountryJurisdictionSelector.tsx`, remove `CA_PROVINCES`, `US_STATES`, `AU_STATES_TERRITORIES`, `DEFAULT_JURISDICTION` constants. Render country buttons from `getRegisteredCountries()` (using profile.flagEmoji and profile.shortLabel). Render jurisdiction options from `getCountry(country).jurisdictions`. On country change, default jurisdiction comes from `getCountry(newCountry).defaultJurisdiction`. [@fullstack]

- [ ] Task 229: Migrate UI consumers of country switches — Rewrite country-branching code in: `BenchmarkComparisons.tsx`, `DataFlowArrows.tsx`, `FinancialFlowchart.tsx`, `GovernmentRetirementInput.tsx`, `MobileWizard.tsx`, `RetirementIncomeChart.tsx`, `TaxCreditEntry.tsx`, all wizard step files (`ExpensesStep`, `ProfileStep`, `TaxCreditsStep`, `TaxSummaryStep`, `WelcomeStep`), and `WizardShell.tsx`. Replace `if (country === "CA") ... else if (country === "US") ...` with `getCountry(country).{appropriate plugin}` lookups. Keep visible UI text identical. [@fullstack] [OPUS]

- [ ] Task 230: Migrate library-side consumers — Rewrite country switches in `src/lib/compute-totals.ts`, `src/lib/financial-state.ts`, `src/lib/projections.ts`, `src/lib/runway-simulation.ts`, `src/lib/required-minimum-distributions.ts`, `src/lib/scenario.ts`, `src/lib/benchmarks.ts`, `src/lib/flowchart-steps.ts`, `src/app/page.tsx` to use `getCountry(country).*`. The shimmed free functions still work, so this task targets direct `country === "..."` branches. [@fullstack] [OPUS]

- [ ] Task 231: Insights generate.ts dispatches via registry — In `src/lib/insights/generate.ts`, replace inline CA/US/AU branches with `getCountry(state.country).insights.getCandidates(state)` plus universal-insights generation. Each country's per-country `insights.ts` already exists by this point. [@fullstack]

### Cleanup (plan tasks 42–44)

- [ ] Task 232: Tax year display via taxYearLabel — Find every site that displays the tax year (search `src/components/` for `taxYear` or `"tax year"` strings) and replace `${taxYear}` with `getCountry(country).taxYearLabel(taxYear)`. AU users will see "2024/25 FY", CA/US still "2025". [@frontend]

- [ ] Task 233: Prune monolithic lib files — After all migrations, audit `src/lib/tax-tables.ts`, `src/lib/government-retirement.ts`, `src/lib/sample-profiles.ts`, `src/lib/tax-credits.ts`, `src/lib/withdrawal-tax.ts`. Each should now hold only shared types + thin shim free functions. Delete any remaining per-country constants/functions/sets. Confirm `wc -l` on each is < 100. Snapshot regressions must stay green. [@backend]

- [ ] Task 234: Final regression check + changelog — Run `npm test && npx tsc --noEmit && npx playwright test`. All green. Add changelog entry to `src/lib/changelog.ts` describing the refactor (no user-visible change, foundation for future country additions). Run `npm run lint`. [@qa] [E2E] [MILESTONE]
