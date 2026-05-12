# Progress Log

<!--
  This file acts as a mutex: only the CURRENT task's progress is shown here.
  When a task completes, its entry is archived to PROGRESS-ARCHIVE.md before
  the next task begins. Ralph reads this for context on the current iteration.
-->

## Summary
- **Total Tasks**: 234
- **Completed**: 229
- **Remaining**: 5
- **Last Updated**: 2026-05-12

<!-- Older entries archived to PROGRESS-ARCHIVE.md -->

## Task 229: Migrate UI consumers of country switches [@fullstack] [OPUS]
- **Date**: 2026-05-12
- **Files**:
  - `src/lib/countries/types.ts`: Added `FlowchartWiki` type. Added `programLabel: string` to `GovernmentRetirementPlugin`. Added `wizardRegisteredCategories: [string, string]`, `flowchartWiki: FlowchartWiki`, `regionTaxLabel: string` to `CountryProfile`.
  - `src/lib/countries/index.ts`: Re-export `FlowchartWiki` type.
  - `src/lib/countries/canada/government-retirement.ts`: `programLabel: "CPP + OAS"`.
  - `src/lib/countries/usa/government-retirement.ts`: `programLabel: "Social Security"`.
  - `src/lib/countries/australia/government-retirement.ts`: `programLabel: "Age Pension"`.
  - `src/lib/countries/canada/index.ts`: `wizardRegisteredCategories: ["TFSA", "RRSP"]`, `flowchartWiki: r/PersonalFinanceCanada` (tip/link/URL), `regionTaxLabel: "Provincial"`.
  - `src/lib/countries/usa/index.ts`: `wizardRegisteredCategories: ["Roth IRA", "401k"]`, `flowchartWiki: r/personalfinance`, `regionTaxLabel: "State"`.
  - `src/lib/countries/australia/index.ts`: `wizardRegisteredCategories: ["Roth IRA", "401k"]` (preserves pre-refactor fallthrough), `flowchartWiki: tipName=r/AusFinance, linkText=r/personalfinance, linkUrl=us-link` (preserves the pre-refactor inconsistency between help tip and visible link), `regionTaxLabel: "State"`.
  - `src/components/MobileWizard.tsx`: `country === "CA" ? [...] : [...]` replaced with `getCountry(country).wizardRegisteredCategories` for both `reg1Cat/reg2Cat` and `reg1Label/reg2Label`.
  - `src/components/RetirementIncomeChart.tsx`: Deleted local `getGovernmentLabel` switch. Source label now reads `getCountry(country).governmentRetirement.programLabel`.
  - `src/components/FinancialFlowchart.tsx`: Replaced inline `country === "CA"/"AU"` HelpTip ternary and link ternary with `getCountry(country).flowchartWiki.{tipName,linkText,linkUrl}` lookups. Removed local `caWikiUrl`/`usWikiUrl` consts.
  - `src/components/GovernmentRetirementInput.tsx`: Replaced three `country === "..."` conditional render branches with a `Record<CountryCode, ComponentType<SubInputProps>>` lookup. `Input` resolved via `INPUT_BY_COUNTRY[country]`.
  - `src/components/wizard/steps/ProfileStep.tsx`: Dropped `getFilingStatuses` import. Filing-status dropdown now iterates `getCountry(country).filingStatuses`.
  - `src/components/wizard/steps/WelcomeStep.tsx`: Dropped `getProfilesForCountry`/`getQuickStartProfilesForCountry` imports. Reads `getCountry(country).profiles.{samples,quickStarts}` directly.
  - `src/components/wizard/steps/TaxSummaryStep.tsx`: `country === "CA" ? "Provincial" : ...` replaced with `getCountry(country).regionTaxLabel`.
  - `src/components/DataFlowArrows.tsx`: Extracted capital-gains explainer into a `Record<CountryCode, fn>` keyed dispatch and a tiny `CapitalGainsExplainer` component. AU maps to the US explainer to preserve current UI.
  - `tests/unit/countries/profile-ui-fields.test.ts` (new): 13 tests covering the new `wizardRegisteredCategories`, `flowchartWiki`, `regionTaxLabel`, `governmentRetirement.programLabel` fields per country.
  - `tests/unit/withdrawal-tax-shim.test.ts`: Updated the `as ReturnType<typeof getCountry>` casts to `as unknown as ReturnType<typeof getCountry>` so the partial mock survives the new required fields.
  - `tests/e2e/task-229-registry-migration.spec.ts` (new): 3 verification tests that load the dashboard, flowchart link, and wizard tax summary for CA and screenshot each.
  - `src/lib/changelog.ts`: Added version 229 entry.
- **Tests**:
  - T1: All affected files + new fields tested. Sample runs:
    - `tests/unit/countries/profile-ui-fields.test.ts`: 13/13 pass
    - `tests/unit/countries/contract.test.ts`: 30/30 pass
    - `tests/unit/withdrawal-tax-shim.test.ts`: 18/18 pass
    - `tests/unit/mobile-wizard.test.ts`: 11/11 pass
    - `tests/unit/welcome-step-simple-mode.test.tsx`: 17/17 pass
    - `tests/unit/data-flow-arrows.test.tsx`: 6/6 pass
    - `tests/unit/financial-flowchart.test.ts`: 11/11 pass
    - `tests/unit/tax-explainer.test.tsx`: 45/45 pass
    - `tests/unit/tax-engine-snapshot.test.ts`: 440/440 pass (regression baseline green)
    - `tests/unit/withdrawal-tax-snapshot.test.ts`: 54/54 pass (regression baseline green)
  - T2: 35/35 affected E2E pass (`country-jurisdiction.spec.ts`, `financial-flowchart.spec.ts`, `government-retirement-au/ca/us.spec.ts`, `retirement-income-chart.spec.ts`, `tax-summary.spec.ts`, `task-229-registry-migration.spec.ts`).
  - Build: `npm run build` → `Compiled successfully in 5.6s`.
- **Screenshots**: `task-229-dashboard-ca.png`, `task-229-flowchart-ca.png`, `task-229-wizard-tax-summary-ca.png`.
- **Notes**:
  - `BenchmarkComparisons.tsx`, `TaxCreditEntry.tsx`, `ExpensesStep.tsx`, `TaxCreditsStep.tsx`, `WizardShell.tsx` — listed in the task but contained no `country === "X"` switches (only typed props or registry-backed helper calls). Left unchanged.
  - Pre-existing failures NOT introduced by this task and NOT fixed here:
    - `tests/e2e/mobile-wizard.spec.ts` — `mobile-wizard` testId is never rendered (component was removed from active rendering in commit 7101022). Verified pre-existing by stashing this task's changes and re-running.
    - `tests/e2e/tax-explainer.spec.ts` "Zero Income" group — flaky setup that tries to hover a Salary row that has detached. Verified pre-existing the same way.
  - AU keeps the pre-refactor visible text (Roth IRA/401k wizard labels, r/personalfinance flowchart link) — intentional per "Keep visible UI text identical." The help tip already said "r/AusFinance" pre-refactor and continues to.
