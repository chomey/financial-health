# Adding UK Support to Financial Health Snapshot

**Date:** 2026-05-09
**Status:** Design approved, awaiting implementation plan

## Goal

Extend the Financial Health Snapshot app to support UK users at the same depth as the existing CA / US / AU integrations: tax computation, tax-advantaged account vehicles, government retirement benefit, sample profiles, and country-specific insights.

UK introduces several country-specific quirks that the existing AU integration does not exercise: a separate Scottish income-tax bracket table, National Insurance as a second tax stream alongside income tax, a Personal Allowance taper that creates a 60% effective marginal band between £100k and £125,140, a Marriage Allowance transfer between spouses, and a 25% tax-free lump-sum rule on pension withdrawals. The opportunity is to address these without scattering UK-specific branches across the codebase.

## Architecture

The feature is delivered behind a refactor that **replaces country-switching free functions with per-country plugins behind shared interfaces.** Today the codebase has switches like `if (country === "CA") computeCanadianTax(...) else if (country === "US") computeUSTax(...) else computeAUTax(...)` scattered across ~30 files. This refactor eliminates them in favour of a registry: `getCountry(code).taxEngine.computeTax(...)`.

### Directory layout

```text
src/lib/countries/
  types.ts                      — CountryCode, CountryProfile, plugin interfaces
  index.ts                      — COUNTRIES registry, getCountry()
  __tests__/
    contract.test.ts            — runs against every CountryProfile

  canada/
    index.ts                    — exports CANADA: CountryProfile
    tax-engine.ts               — implements TaxEngine
    vehicles.ts                 — implements VehicleCatalog
    government-retirement.ts    — implements GovernmentRetirementPlugin
    tax-credits.ts              — implements TaxCreditCatalog
    sample-profiles.ts          — implements ProfileLibrary
    insights.ts                 — implements InsightProvider
    tax-tables.ts               — bracket data (moved from src/lib/tax-tables.ts)

  usa/
    (same structure)
  australia/
    (same structure)
  uk/                           — new
    (same structure)
```

File names inside each country directory drop the country prefix — the directory provides the namespace.

### Shared interfaces (in `types.ts`)

```typescript
export type CountryCode = "CA" | "US" | "AU" | "UK";
export type SupportedCurrency = "CAD" | "USD" | "AUD" | "GBP";

export interface Jurisdiction { code: string; name: string; }

export interface TaxEngine {
  computeTax(annualIncome: number, type: IncomeType, jurisdiction: string, year: number): TaxResult;
  getMarginalRate(annualIncome: number, jurisdiction: string, year: number): number;
  classifyTaxTreatment(category: string): TaxTreatment;
  getWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult;
  getEarlyWithdrawalPenalties(categories: string[], age: number): EarlyWithdrawalPenalty[];
}

export interface VehicleCatalog {
  categories: string[];                              // suggestion list
  flagEmoji: string;
  getDescription(category: string): string | undefined;
  getDefaultRoi(category: string): number | undefined;
  isTaxSheltered(category: string): boolean;
  isTaxDeferred(category: string): boolean;
  isIncomeTaxRoi(category: string): boolean;
  isReinvestDefault(category: string): boolean;
  isEmployerMatchEligible(category: string): boolean;
}

export interface GovernmentRetirementPlugin {
  computeMonthly(income: GovernmentRetirementIncome): number;
  presetsFor(field: string): { value: string; label: string; amount: number }[];
}

export interface TaxCreditCatalog {
  getCategories(year: number): TaxCreditCategory[];
  getCategoriesForFilingStatus(filingStatus: FilingStatus, year: number): TaxCreditCategory[];
  findCategory(name: string, year: number): TaxCreditCategory | undefined;
}

export interface ProfileLibrary {
  samples: SampleProfile[];
  quickStarts: SampleProfile[];
}

export interface InsightProvider {
  getCandidates(state: FinancialState, computed: ComputedTotals): InsightCandidate[];
}

export interface CountryProfile {
  code: CountryCode;
  displayName: string;
  shortLabel: string;
  flagEmoji: string;
  homeCurrency: SupportedCurrency;
  locale: "en-CA" | "en-US" | "en-AU" | "en-GB";
  jurisdictions: Jurisdiction[];
  defaultJurisdiction: string;
  filingStatuses: { value: FilingStatus; label: string }[];
  defaultFilingStatus: FilingStatus;
  taxYearLabel(year: number): string;       // "2025" / "2025/26" / "2024/25 FY"
  taxYearBoundary: { startMonth: number; startDay: number };
  taxEngine: TaxEngine;
  vehicles: VehicleCatalog;
  governmentRetirement: GovernmentRetirementPlugin;
  taxCredits: TaxCreditCatalog;
  profiles: ProfileLibrary;
  insights: InsightProvider;
}
```

### Registry

`COUNTRIES: Record<CountryCode, CountryProfile>` — exhaustive by virtue of the `Record` type. Adding a 5th `CountryCode` without a matching `CountryProfile` is a compile error. No country file mutates global state on import; assembly happens explicitly in `countries/index.ts`.

```typescript
import { CANADA } from "./canada";
import { USA } from "./usa";
import { AUSTRALIA } from "./australia";
import { UK } from "./uk";

export const COUNTRIES: Record<CountryCode, CountryProfile> = {
  CA: CANADA, US: USA, AU: AUSTRALIA, UK: UK,
};

export function getCountry(code: CountryCode): CountryProfile {
  return COUNTRIES[code];
}
```

### TaxResult — generic breakdown

Today's `TaxResult` has fixed `federalTax` and `provincialStateTax` fields. AU silently bundles Medicare Levy into `totalTax` only. UK needs to surface income tax and National Insurance as two separately-labelled lines. Replaced with a generic breakdown:

```typescript
export interface TaxResult {
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  afterTaxIncome: number;
  breakdown: { label: string; amount: number; kind: "income-tax" | "social" | "sub-federal" }[];
}
```

UK populates two lines (Income Tax + National Insurance). AU's Medicare Levy moves from hidden to a `kind: "social"` breakdown line. CA/US populate `income-tax` + `sub-federal`. UI components that previously read `federalTax` / `provincialStateTax` switch to `breakdown.find(b => b.kind === ...)`.

### Locale per country

`CountryProfile.locale` is threaded into `CurrencyFormatter`, replacing hardcoded `"en-US"` calls in `Intl.NumberFormat`. UK uses `en-GB`.

## UK tax engine specifics

### Jurisdictions

| Code  | Name              | Bracket source |
|-------|-------------------|----------------|
| `ENG` | England           | rUK            |
| `WAL` | Wales             | rUK (TODO: Welsh divergence flag) |
| `NIR` | Northern Ireland  | rUK            |
| `SCT` | Scotland          | Scottish bands |

Default jurisdiction: `ENG`.

### Tax year semantics

UK tax year runs **6 April → 5 April**. The `taxYear: number` field on `FinancialState` represents the start year (so `2025` means 2025/26).

```typescript
UK.taxYearLabel(2025) === "2025/26"
UK.taxYearBoundary === { startMonth: 4, startDay: 6 }
```

AU, separately, uses `1 July → 30 June`; this refactor formalises the existing AU tax-year handling at the same time.

### Bracket tables (2025/26)

Ranges below are stated as **taxable income above the Personal Allowance** (HMRC convention). Implementation: subtract effective PA from gross income, then apply bands to the remainder.

**rUK (England, Wales, Northern Ireland):**

| Band | Range (above PA)        | Rate |
|------|-------------------------|------|
| Basic | £0 – £37,700           | 20%  |
| Higher | £37,700 – £125,140    | 40%  |
| Additional | above £125,140    | 45%  |

Personal Allowance: £12,570.

**Scotland:**

| Band | Range (above PA)        | Rate |
|------|-------------------------|------|
| Starter | £0 – £2,827          | 19%  |
| Basic | £2,827 – £14,921       | 20%  |
| Intermediate | £14,921 – £31,092 | 21%  |
| Higher | £31,092 – £62,430     | 42%  |
| Advanced | £62,430 – £125,140  | 45%  |
| Top | above £125,140           | 48%  |

Personal Allowance: £12,570 (set by UK Parliament, applies to Scotland too).

Implementation values to verify against HMRC at coding time — these are widely-cited 2025/26 figures.

### Personal Allowance taper

Above £100,000 income, Personal Allowance reduces by £1 for every £2 over £100,000, fully phased out at £125,140 (income = £100k + 2 × £12,570).

Effect: a 60% effective marginal band between £100k and £125,140 on rUK (40% bracket + 20% lost-PA), 63% on Scotland (42% + 21%-equivalent).

Implemented as `effectivePersonalAllowance(grossIncome, baseAllowance)`, called at the start of the income tax computation.

### National Insurance

Class 1 employee NI for 2025/26:

| Range                    | Rate |
|--------------------------|------|
| £0 – £12,570 (PT)        | 0%   |
| £12,570 – £50,270 (UEL)  | 8%   |
| above £50,270            | 2%   |

`computeUKNI(grossEmploymentIncome, year)` returns NI as a separate value populated into the `breakdown` array as `kind: "social"`. **Only applied to employment income** — capital gains and other passive income do not pay NI.

### Marriage Allowance

Stored on `FinancialState` as `marriageAllowance?: "claiming" | "transferring" | "none"`.

- `claiming`: Personal Allowance increases by £1,260 (recipient).
- `transferring`: Personal Allowance decreases by £1,260 (donor).
- `none`: no adjustment.

Eligibility check is informational — does not block. Eligibility requires the recipient to be a basic-rate taxpayer (rUK income £12,570 – £50,270, equivalent for Scotland).

### Capital gains

- Annual exempt amount: £3,000 (2024/25 onwards).
- Above the AEA: 18% basic-rate band, 24% higher-rate band (non-residential rates used uniformly).
- No NI on capital gains.

### Filing statuses

`"single" | "married-civil-partnership"`. Default `"single"`. Used for Marriage Allowance flow only — UK doesn't file jointly.

## UK vehicles, withdrawal tax, government retirement

### Asset suggestion list

```text
Cash ISA
Stocks & Shares ISA
Lifetime ISA (LISA)
Junior ISA (JISA)
SIPP
Workplace Pension
Premium Bonds
```

### Account-type descriptions

- **Cash ISA** — Tax-free interest, £20k/yr combined ISA allowance
- **Stocks & Shares ISA** — Tax-free growth and withdrawals, £20k/yr combined
- **Lifetime ISA** — £4k/yr (within £20k overall), 25% government bonus, age 60+ or first home
- **Junior ISA** — £9k/yr, locked until age 18
- **SIPP** — Self-Invested Personal Pension, marginal-rate tax relief, 25% tax-free lump sum from 55
- **Workplace Pension** — Employer-sponsored, auto-enrolment, similar tax treatment to SIPP
- **Premium Bonds** — NS&I, tax-free prizes, ~4% effective average

### Tax treatment

| Category            | Treatment            | Notes                                    |
|---------------------|----------------------|------------------------------------------|
| Cash ISA            | tax-free             |                                          |
| Stocks & Shares ISA | tax-free             |                                          |
| LISA                | tax-free             | early-withdrawal penalty 25% before 60   |
| JISA                | tax-free             | locked until 18                          |
| Premium Bonds       | tax-free             |                                          |
| SIPP                | uk-pension           | 75% × marginal rate (25% lump sum free)  |
| Workplace Pension   | uk-pension           | same as SIPP                             |

`uk-pension` is a new `TaxTreatment` value alongside the existing `tax-free | tax-deferred | taxable | super-accumulation | super-fhss`. UK pension withdrawal tax = 75% × marginal-rate-tax (the 25% lump sum is tax-free).

### Default ROI

| Category       | ROI |
|----------------|-----|
| Cash ISA       | 4%  |
| Premium Bonds  | 4%  |
| S&S ISA        | 7%  |
| LISA           | 7%  |
| JISA           | 5%  |
| SIPP           | 7%  |
| Workplace Pension | 7% |

### Reinvest defaults

All UK retirement vehicles (SIPP, Workplace Pension, LISA) and all ISAs reinvest by default.

### Income-tax ROI categories (interest income, taxed at marginal rate when not sheltered)

Cash ISA, Premium Bonds — but both are tax-free anyway, so the toggle is hidden.

### Employer-match eligible

Workplace Pension only. Auto-enrolment minimum: 3% employer + 5% employee.

### Early-withdrawal penalties

| Category          | Rule |
|-------------------|------|
| SIPP, Workplace Pension | Cannot be accessed before age 55 (rising to 57 in 2028) |
| LISA              | 25% penalty before age 60 (unless first home / terminal illness) |
| JISA              | Locked until age 18 |

### State Pension

`GovernmentRetirementIncome` extended with `statePensionWeekly?: number`.

Presets:

- `none` — 0
- `full-new` — £230.25/wk (full New State Pension, 2025/26 — verify HMRC at implementation time)
- `custom` — user-provided

`computeMonthly()` for UK: `weekly × 52 / 12`.

State Pension age constant: `UK_STATE_PENSION_AGE = 66` (rising to 67 between 2026–28; comment with year).

### Tax credits / deductions for UK (initial set, mostly info-only)

- Marriage Allowance — info-only (handled directly in tax engine)
- Gift Aid — deduction
- Pension contributions — info-only (handled via account contribution flow)
- Personal Savings Allowance — info-only (£1,000 basic / £500 higher / £0 additional)
- Dividend Allowance — info-only (£500)
- Capital Gains annual exempt amount — info-only
- Pension annual allowance — info-only

### UK sample profiles (three quick-starts)

- **Early career** — Cash ISA + Workplace Pension auto-enrolment
- **Mid career** — S&S ISA + SIPP + LISA
- **Pre-retirement** — Large SIPP + ISA + State Pension

## Migration sequencing

The refactor must not change CA/US/AU behavior.

### Phase A — Build registry, refactor existing 3 countries

No new UK, no behavior change for existing users.

1. Create `src/lib/countries/types.ts` with all interfaces.
2. Create `src/lib/countries/canada/`, refactor existing CA code into plugin files. Public free-functions in `tax-engine.ts`, `withdrawal-tax.ts`, etc. become thin shims that delegate to `getCountry("CA").taxEngine.*`. All tests still green.
3. Repeat for `usa/` and `australia/`.
4. Migrate component callsites file-by-file from free-functions to `getCountry(code).…`. Tests green at each step.
5. Apply the cross-cutting items in flight:
   - Tax year semantics in the interfaces.
   - `TaxResult.breakdown` array — refactor CA/US to populate it, AU's Medicare Levy moves from hidden to a breakdown line.
   - Locale threading from CountryProfile into CurrencyFormatter.
   - `Record<CountryCode, CountryProfile>` exhaustive registry from the start.
   - Plugin contract tests written before Phase B so UK gets covered automatically.
   - `tax-tables.ts` 1128-line file split per country; `bracket-math.ts` retained as shared helper.
   - AssetEntry component decoupled from country-specific category lists (reads from `getCountry(code).vehicles`).
6. Delete shims once all consumers migrated.
7. Insights: extract per-country `InsightProvider` for CA/US/AU.

### Phase B — Add UK as a peer

1. Create `src/lib/countries/uk/` with all plugin files. UK bracket data (rUK + Scotland), NI, taper, Marriage Allowance, ISAs, SIPP/WP, State Pension, sample profiles, insights.
2. Add `"GBP"` to `SupportedCurrency`. FX rates GBP↔USD/CAD/AUD added to `FALLBACK_RATES`.
3. `CountryJurisdictionSelector.tsx` — UK button + ENG/WAL/NIR/SCT jurisdiction options.
4. URL-state validation drops unknown country codes silently (defensive against future codes in older builds).
5. `INITIAL_STATE` unchanged — UK is opt-in via the country selector.

### Phase C — UK-specific tests + E2E

1. Plugin contract tests run against UK automatically (Phase A's harness covers it).
2. UK-specific unit tests cover the items below in the Testing section.
3. E2E Playwright test for the UK happy path.

Each phase ships independently. CA/US/AU users see no change after Phase A. UK works after Phase B. Full coverage after Phase C.

## Testing

### Plugin contract tests

`src/lib/countries/__tests__/contract.test.ts` runs against every `CountryProfile` in `COUNTRIES`:

- Zero income → zero `totalTax`.
- `breakdown` items sum to `totalTax`.
- `marginalRate >= 0` and `<= 1`.
- `effectiveRate <= marginalRate` (within rounding).
- `locale` parseable by `Intl.NumberFormat`.
- `vehicles.categories` non-empty.
- `homeCurrency` is in `SupportedCurrency` union.
- `defaultJurisdiction` appears in `jurisdictions`.
- `defaultFilingStatus` appears in `filingStatuses`.
- `taxYearLabel(2025)` returns a non-empty string.

Catches structural drift in any country's plugin.

### Snapshot regression tests for Phase A

Capture `computeTax(income, type, country, jurisdiction, year)` outputs at sample income points (10k, 50k, 100k, 200k, 500k) for every CA/US/AU jurisdiction × type × year combination *before* the refactor. Assert byte-identical *after*. Pure refactor safety net.

### UK-specific unit tests

- rUK bracket boundaries: £12,570 / £50,270 / £125,140.
- Scotland bracket boundaries: £15,397 / £27,491 / £43,662 / £75,000 / £125,140.
- NI thresholds: £12,570 (PT) / £50,270 (UEL).
- Personal Allowance taper: £100k (no taper) / £110k (half taper) / £125,140 (fully phased) / £150k (no PA).
- Marriage Allowance eligibility: recipient basic-rate / recipient higher-rate (ineligible) / donor under PA.
- SIPP withdrawal applies 25% tax-free lump sum.
- LISA penalty before 60.
- ISA classified tax-free.
- State Pension monthly conversion: £230.25/wk → £997.75/mo.

### E2E

`tests/e2e/uk-flow.spec.ts`:

1. Load app, switch country to UK.
2. Verify £ currency renders.
3. Switch jurisdiction to SCT, enter £80k salary, verify tax breakdown shows separate Income Tax and NI lines, with Scotland-specific bracket totals.
4. Switch back to ENG, verify rUK tax recomputes.
5. Load a UK sample profile (Mid career), verify ISA + SIPP appear in asset list.
6. Open asset add-row and verify suggestion dropdown includes ISA / LISA / SIPP / Workplace Pension.

## Out of scope (deferred / not implemented)

- **Multi-foreign-currency holdings** — UK user holding both USD and CAD as foreign assets. Single-foreign assumption stays.
- **Welsh-specific bands** — Wales has had income-tax-setting power since 2019 but currently mirrors rUK rates. Mapped to rUK in code with a TODO marker for the day they diverge.
- **Self-employment NI** (Class 2 + Class 4) — initial UK support is employee NI (Class 1) only.
- **Capital gains residential vs non-residential rate split** — uses non-residential rate uniformly.
- **Pension lifetime allowance** — abolished April 2024, N/A.
- **Pension annual-allowance tapering** for high earners — info-only display, not deducted from tax.
- **Personal Savings Allowance / Dividend Allowance arithmetic** — surfaced as info-only insights, not deducted from computed tax. (Properly modelling these requires separating savings, dividend, and earned income, which the data model doesn't capture today.)
- **Channel Islands, Isle of Man, Gibraltar** — not UK proper for tax purposes.
- **Council Tax** — band-specific local property tax, not modeled (no equivalent for CA property tax / US state tax either).

## Success criteria

- Existing CA/US/AU functionality unchanged after Phase A. Snapshot regression tests confirm byte-identical tax outputs.
- UK user can select country=UK, see £ currency, switch between ENG/WAL/NIR/SCT jurisdictions, enter salary, and see tax broken down into Income Tax + NI lines.
- UK user can select ISA / LISA / JISA / SIPP / Workplace Pension as asset categories, with per-category tax treatment, default ROI, reinvest defaults, and early-withdrawal penalties applied correctly.
- UK State Pension preset (`full-new`) populates the retirement income field.
- UK sample profiles load successfully and produce non-empty insights.
- Plugin contract tests pass for all four countries.
- UK E2E test passes on Playwright.
