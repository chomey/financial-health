# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 234
- **Completed**: 232
- **Remaining**: 2
- **Last Updated**: 2026-06-01

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

## Task 230: Migrate library-side consumers of country switches [@fullstack] [OPUS]
- **Date**: 2026-05-12
- **Files**:
  - `src/lib/countries/types.ts`: Added `TaxBracketSegment`, `BracketSegmentArgs`, `BracketSegmentResult`, `RmdRule`, `AgeGroupBenchmark`, `NationalAverage`, `BenchmarkData`, `RawFlowchartStep`, `FlowchartStepsBuilder` types. Added `computeBracketSegments` method to `TaxEngine`. Added `rmd: RmdRule`, `benchmarks: BenchmarkData`, `flowchartSteps: FlowchartStepsBuilder` to `CountryProfile`.
  - `src/lib/countries/index.ts`: Re-export new types. Switched `COUNTRIES` to property getters (`get CA() { return CANADA; }`, etc.) so the registry tolerates cycle-induced module-load ordering — the prior frozen object literal snapshotted `undefined` when a country plugin transitively pulled `getCountry` back through itself.
  - `src/lib/countries/canada/tax-engine.ts`: Added `computeCanadianBracketSegments` (federal + provincial brackets, CA capital-gains inclusion).
  - `src/lib/countries/usa/tax-engine.ts`: Added `computeAmericanBracketSegments` (federal brackets, capital-gains alternative, state brackets, standard-deduction handling).
  - `src/lib/countries/australia/tax-engine.ts`: Added `computeAustralianBracketSegments` (federal only; state always zeroed).
  - `src/lib/countries/canada/rmd.ts` (new): CA RRIF rule — `ruleName: "RRIF minimum"`, RRSP/LIRA/RRIF/LIF mapping with `getCaRrifPercent`.
  - `src/lib/countries/usa/rmd.ts` (new): US RMD rule — `ruleName: "RMD"`, 401k/IRA/403b/457 (non-Roth) mapping with `getUsRmdPercent`.
  - `src/lib/countries/australia/rmd.ts` (new): AU no-op RMD plugin (no forced-withdrawal mechanism).
  - `src/lib/countries/canada/benchmarks.ts` (new): SFS 2023 age-group benchmarks + national average in CAD.
  - `src/lib/countries/usa/benchmarks.ts` (new): SCF 2022 age-group benchmarks + national average in USD.
  - `src/lib/countries/australia/benchmarks.ts` (new): ABS 2021-22 age-group benchmarks + national average in AUD.
  - `src/lib/countries/canada/flowchart-steps.ts` (new): Wraps `buildCASteps(inferData(...))`.
  - `src/lib/countries/usa/flowchart-steps.ts` (new): Wraps `buildUSSteps(inferData(...))`.
  - `src/lib/countries/australia/flowchart-steps.ts` (new): Wraps `buildAUSteps(inferData(...))`.
  - `src/lib/countries/canada/index.ts`, `usa/index.ts`, `australia/index.ts`: Wired `rmd`, `benchmarks`, `flowchartSteps` into each profile.
  - `src/lib/bracket-math.ts`: Added shared `buildBracketSegments(taxableIncome, table)` helper used by each country's `computeBracketSegments` implementation.
  - `src/lib/compute-totals.ts`: Removed `country === "CA"/"AU"` switches. `jurisdictionType` reads `profile.regionTaxLabel`. Bracket lookup (zero-income reference AND non-zero) goes through `profile.taxEngine.computeBracketSegments({jurisdiction, year, grossAnnualIncome, capGainsTotal})`. `computeTax` shim call replaced with `profile.taxEngine.computeTax(...)`. Dropped imports of `computeTax`, `getCanadianBrackets`, `getUSBrackets`, `getAUBrackets`, `getUSCapitalGainsBrackets`, `calculateCanadianCapitalGainsInclusion`, `BracketTable`, `TaxBracketSegment`. Deleted local `computeBracketSegments` helper (logic moved into country plugins).
  - `src/lib/required-minimum-distributions.ts`: Replaced inline US/CA branches with `getCountry(country).rmd.{ruleName,computeRmd}`. File now re-exports the helper percent functions from per-country `rmd.ts` for backward compat. `getRmdSummaries` reads `rule.ruleName` once per call instead of `country === "CA" ? "RRIF minimum" : "RMD"`.
  - `src/lib/benchmarks.ts`: Replaced inline CA/AU constant lookups (`CA_BENCHMARKS`, `AU_BENCHMARKS`, `US_BENCHMARKS`, etc.) with `getCountry(country).benchmarks.{ageGroups,national,dataSource}`. Removed in-file benchmark data and `DATA_SOURCES` const (replaced by a registry-backed `Record`).
  - `src/lib/flowchart-steps.ts`: Exported `inferData`, `buildCASteps`, `buildUSSteps`, `buildAUSteps`, and `RawStep` for per-country plugin use. `getFlowchartSteps` now calls `getCountry(country).flowchartSteps.build(state, isRetired)` instead of the `country === "US"/"AU"/"CA"` ternary. Imported `getCountry` and `RawFlowchartStep`.
  - `src/lib/financial-state.ts`: Replaced shim calls — `getMarginalRateForIncome(...)` → `profile.taxEngine.getMarginalRate(...)`; `getEarlyWithdrawalPenalties(...)` → `getCountry(...).taxEngine.getEarlyWithdrawalPenalties(...)`; `computeMonthlyGovernmentIncome(...)` → `profile.governmentRetirement.computeMonthly(...)`. Dropped now-unused imports.
  - `src/lib/projections.ts`: Replaced `getWithdrawalTaxRate(...)` shim call with `taxEngine.getWithdrawalTaxRate({...})` using a captured `getCountry(country).taxEngine` reference.
  - `src/lib/runway-simulation.ts`: Same migration as projections (both `simulateRunwayWithTax` and `simulateRunwayTimeSeries`). Switched the `country: "CA" | "US" | "AU"` parameters to the `CountryCode` type re-exported from the registry.
  - `src/app/page.tsx`: Removed unused `getProfilesForCountry` import.
  - `tests/unit/countries/registry-consumer-plugins.test.ts` (new): 31 tests covering `taxEngine.computeBracketSegments` (zero-income reference rendering, populated buckets, CA capital-gains inclusion, AU zero-state, US cap-gains brackets), the new `rmd` plugin (per-country label/computeRmd correctness for RRSP/401k/Roth/Super), `benchmarks` (age-group + national + source per country), and `flowchartSteps` (country-prefixed step ids).
  - `tests/e2e/task-230-library-consumer-migration.spec.ts` (new): 3 verification tests — dashboard renders, flowchart roadmap renders with CA steps, tax-explainer brackets render.
  - `src/lib/changelog.ts`: Added version 230 entry.
- **Tests**:
  - T1: All affected files green. Highlights:
    - `tests/unit/countries/registry-consumer-plugins.test.ts`: 31/31 pass.
    - `tests/unit/countries/contract.test.ts`: 30/30 pass.
    - `tests/unit/countries/registry.test.ts`: 7/7 pass.
    - `tests/unit/required-minimum-distributions.test.ts`: 19/19 pass (existing tests still green through the new registry-backed shim).
    - `tests/unit/tax-engine-snapshot.test.ts`: 440/440 pass (regression baseline green).
    - `tests/unit/withdrawal-tax-snapshot.test.ts`: 54/54 pass (regression baseline green).
    - Full suite: 4487/4487 pass.
  - T2: 3/3 task-230 E2E tests pass.
  - Build: `npm run build` → `Compiled successfully in 2.2s`.
  - Lint: 11 errors before and after this task — all pre-existing, none introduced.
- **Screenshots**: `task-230-dashboard-default.png`, `task-230-flowchart-after-migration.png`, `task-230-tax-explainer-brackets.png`.
- **Notes**:
  - `src/lib/scenario.ts` was in the file list but contained no `country === "..."` switches — `TAX_SHELTERED_LIMITS` uses country as a data tag, not a branch. Left unchanged.
  - `src/lib/financial-state.ts`, `projections.ts`, `runway-simulation.ts` had no `country === "..."` branches either, only deprecated shim calls. Migrated those to direct `getCountry(country).taxEngine.*` to align with the consumer-migration goal.
  - `src/app/page.tsx`'s only registry-relevant change was a stale unused import — every other country use was already prop-typed.
  - `COUNTRIES` const was switched to property getters because the new flowchart plugin path created a real value-import cycle (`country/index → country/flowchart-steps → lib/flowchart-steps → lib/countries → country/index`). A frozen object literal snapshotted `undefined` for the still-loading country; getters re-read the live binding at access time so the test (`Object.keys` + identity) still passes.

## Task 231: Insights generate.ts dispatches via registry [@fullstack]
- **Date**: 2026-06-01
- **Files**:
  - `src/lib/insights/generate.ts`, `src/lib/insights/types.ts`, `src/lib/financial-state.ts`: Threaded raw app state into insight generation and dispatch selected country candidates through `getCountry(state.country).insights.getCandidates(state, data)`.
  - `src/lib/countries/types.ts`, `src/lib/countries/australia/insights.ts`: Extended the provider context for derived-data candidates and moved the AU-only Super Guarantee, HECS-HELP, FHSS, franking-credit, and MLS candidates behind the Australia plugin.
  - `tests/unit/countries/insights-registry-dispatch.test.ts`, `tests/e2e/task-231-insights-registry-dispatch.spec.ts`: Added T1 registry-dispatch coverage and T2 dashboard render coverage.
- **Tests**:
  - Build: `npm run build` passed.
  - T1: `npm test` passed (`4488/4488`).
  - T2: `CAPTURE_SCREENSHOTS=1 CAPTURE_TASK=231 npx playwright test tests/e2e/task-231-insights-registry-dispatch.spec.ts` passed (`1/1`).
  - Lint: `npm run lint` still reports `20` errors and `5` warnings in pre-existing untouched files; no new lint findings in task files.
- **Screenshots**: `task-231-insights-registry-dispatch.png`.

## Task 232: Tax year display via taxYearLabel [@frontend]
- **Date**: 2026-06-01
- **Files**:
  - `src/components/CountryJurisdictionSelector.tsx`, `src/components/wizard/steps/ProfileStep.tsx`: Rendered tax-year choices through `getCountry(country).taxYearLabel(...)`; welcome selector accessibility labels now use the same country-specific text.
  - `tests/unit/country-jurisdiction-selector.test.tsx`, `tests/e2e/task-232-tax-year-label.spec.ts`: Added T1 and T2 coverage for AU fiscal-year labels while preserving CA calendar-year labels.
- **Tests**:
  - Build: `npm run build` passed.
  - T1: `npm test` passed (`4490/4490`).
  - T2: `CAPTURE_SCREENSHOTS=1 CAPTURE_TASK=232 npx playwright test tests/e2e/task-232-tax-year-label.spec.ts` passed (`1/1`).
- **Screenshots**: `task-232-au-tax-year-labels.png`.
- **Notes**: One repeated `npm test` run exposed an intermittent pre-existing `IncomeEntry.tsx` animation timeout after jsdom teardown. The isolated `income-frequency.test.tsx` suite passed (`18/18`) and the final full rerun passed (`4490/4490`).
