# Tasks

<!-- Older tasks archived to TASKS-ARCHIVE.md -->

<!-- Completed tasks archived to TASKS-ARCHIVE.md. Last completed: Task 234b. -->
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

### Consumer migration — library shims (plan tasks 32–36)

- [x] Task 222: tax-engine.ts shim — Rewrite `src/lib/tax-engine.ts` to a thin shim. Public `computeTax(income, type, country, jurisdiction, year)` and `getMarginalRateForIncome` delegate to `getCountry(country).taxEngine.*`. Keep `IncomeType` and `TaxResult` type exports. Snapshot regressions must stay green. [@backend]

### Cleanup (plan tasks 42–44)

- [ ] Task 234c: Phase A Playwright regression shard 2/3 — Run `npx playwright test --shard=2/3`. Fix regressions exposed by this shard only, rerun the shard until green, and commit. Do not run the full Playwright suite. [@qa] [E2E]

- [ ] Task 234d: Phase A Playwright regression shard 3/3 — Run `npx playwright test --shard=3/3`. Fix regressions exposed by this shard only, rerun the shard until green, and commit. Do not run the full Playwright suite. [@qa] [E2E]

- [ ] Task 234e: Phase A regression signoff — Confirm Tasks 234a–234d recorded green unit/typecheck and all three Playwright shards. Run `npm test && npx tsc --noEmit && npm run lint`. Fix only Phase A regressions. Do not rerun the full Playwright suite: the three green shard runs are the complete E2E regression. Record the final verification in `PROGRESS.md`. [@qa] [MILESTONE]

## UK Support (Phase B + C)

**Spec:** `docs/superpowers/specs/2026-05-09-uk-support-design.md`
**Plan:** `docs/superpowers/plans/2026-06-01-uk-support-phase-b.md`

Tasks 235–248 add the United Kingdom as a fourth supported country alongside CA / US / AU.
Tasks 235–244 author each UK plugin file as a standalone export (dead code, not yet in
registry). Task 245 is the atomic wire-up: extends `CountryCode` / `SupportedCurrency` /
`Locale` / `TaxTreatment` unions, adds `marriageAllowance?` to `FinancialState`, wires
withdrawal-tax for `uk-pension`, assembles `uk/index.ts`, and registers UK in `COUNTRIES`.
After task 245 lands, UK appears in every UI surface automatically because Phase A migrated
consumers to `getRegisteredCountries()`. Tasks 246–248 are tests, E2E, and release.

**Prerequisite:** Phase A tasks 231–234 must be complete and all snapshot regression tests
must stay byte-identical for CA/US/AU.

Each Ralph task below points to the corresponding plan section — read that section for full
step-by-step detail (file paths, code, commands, commit message).

### UK plugin files (plan tasks 235–241)

- [ ] Task 235: uk/tax-tables.ts — rUK + Scotland income-tax bands (above-PA form), NI bands (absolute), Personal Allowance, PA taper threshold, Marriage Allowance transfer, CGT constants, State Pension age, pension access age, LISA access age. See plan §Task 235. [@backend] [MATH]

- [ ] Task 236: uk/vehicles.ts — VehicleCatalog for Cash ISA / Stocks & Shares ISA / Lifetime ISA / Junior ISA / SIPP / Workplace Pension / Premium Bonds. Tax-shelter, tax-defer, reinvest, employer-match, default-ROI maps. See plan §Task 236. [@backend]

- [ ] Task 237: uk/government-retirement.ts — UK State Pension plugin (£230.25/wk full new for 2025/26, weekly→monthly conversion via × 52 / 12, none/full-new/custom presets). See plan §Task 237. [@backend]

- [ ] Task 238: uk/tax-credits.ts — TaxCreditCatalog listing Marriage Allowance, Gift Aid, Pension Contributions, Personal Savings Allowance, Dividend Allowance, CGT Annual Exempt Amount, Pension Annual Allowance (mostly info-only). See plan §Task 238. [@backend]

- [ ] Task 239: uk/sample-profiles.ts — three quick-starts (Early career £32k Cash ISA + WP, Mid career £65k S&S ISA + SIPP + LISA + mortgage, Pre-retirement £82k large SIPP + ISA + State Pension on the horizon). See plan §Task 239. [@backend]

- [ ] Task 240: uk/insights.ts — UK InsightProvider with three candidates (no-ISA prompt, no-pension prompt, PA taper warning for £100k–£125,140 income). See plan §Task 240. [@backend]

- [ ] Task 241: uk/rmd.ts + uk/benchmarks.ts + uk/flowchart-steps.ts — bundled tiny data files. RMD returns 0 (no UK forced-withdrawal rule). Benchmarks from ONS Wealth & Assets Survey Wave 8. Flowchart-steps wrap a `buildUKSteps` helper added to `src/lib/flowchart-steps.ts`. See plan §Task 241. [@backend]

### UK tax engine (plan tasks 242–244)

- [ ] Task 242: uk/tax-engine.ts — base income tax (rUK + Scotland bands, marginal-rate lookup, classifyTaxTreatment for ISA/SIPP/WP/Brokerage). No PA taper, no NI, no Marriage Allowance, no withdrawal tax, no bracket segments yet. See plan §Task 242. [@backend] [MATH]

- [ ] Task 243: uk/tax-engine.ts — Personal Allowance taper (£100k–£125,140), Class 1 employee NI on employment income (surfaced as `kind: "social"` breakdown line), `applyMarriageAllowance` helper. See plan §Task 243. [@backend] [MATH]

- [ ] Task 244: uk/tax-engine.ts — withdrawal tax (SIPP/WP 25% tax-free lump sum, rest at marginal rate; ISA tax-free; Brokerage cost-basis split), Capital Gains Tax (£3,000 AEA + 18/24% bands), early-withdrawal penalties (LISA 25% before 60; SIPP/WP locked before 55), bracket segments for the explainer (federal=income tax absolute ranges with effective PA; regional=NI bands). See plan §Task 244. [@backend] [MATH]

### Wire-up (plan task 245)

- [ ] Task 245: Wire UK into registry — Atomic flip. Extend `CountryCode` to add "UK"; extend `SupportedCurrency` to add "GBP" + FALLBACK_RATES GBP pairs + `symbolMap` GBP; extend `TaxTreatment` to add "uk-pension" + `classifyTaxTreatment` shim arm; extend `FinancialState.country` union + add `statePensionWeekly?` to `GovernmentRetirementIncome` + add `marriageAllowance?` field; extend `FilingStatus` to add "married-civil-partnership" if missing; promote `classifyUKTaxTreatment` to return "uk-pension" for SIPP/WP and rename withdrawal-tax switch arm; create `uk/index.ts` assembling `UK_COUNTRY: CountryProfile`; register UK getter in `COUNTRIES`; extend snapshot test matrices in `tests/unit/tax-engine-snapshot.test.ts` and `tests/unit/withdrawal-tax-snapshot.test.ts` to include UK and capture new baselines with `-u`; verify CA/US/AU snapshots unchanged. See plan §Task 245. [@backend] [MATH]

### Tests + release (plan tasks 246–248)

- [ ] Task 246: UK spec coverage test suite — `tests/unit/countries/uk/uk-spec-coverage.test.ts` with rUK + Scotland boundary tests, NI thresholds, PA taper sweep, Marriage Allowance, SIPP withdrawal lump sum, ISA classification, LISA early-withdrawal penalty, State Pension monthly conversion, registry lookup. See plan §Task 246. [@backend] [MATH]

- [ ] Task 247: UK E2E Playwright spec — `tests/e2e/uk-flow.spec.ts` covers country switch to UK (£ renders), Scotland jurisdiction switch (Income Tax + NI breakdown lines), back to ENG (rUK recompute), Mid-career sample profile loads ISA + SIPP, asset suggestion dropdown includes UK vehicles. Capture screenshots with `CAPTURE_TASK=247`. See plan §Task 247. [@qa] [E2E]

- [ ] Task 248: UK release — Final regression (`npm test && npx tsc --noEmit && npm run lint && npx playwright test`). Add changelog entry to `src/lib/changelog.ts` describing UK launch (Personal Allowance taper, NI, Marriage Allowance, ISA family, SIPP/WP, State Pension, three quick-starts). Capture release screenshots with `CAPTURE_TASK=248`. Confirm CA/US/AU snapshots still byte-identical. See plan §Task 248. [@qa] [E2E] [MILESTONE]
