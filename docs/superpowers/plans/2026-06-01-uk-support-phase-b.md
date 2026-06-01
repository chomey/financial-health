# UK Support — Phase B + C Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the UK as a fourth supported country alongside CA/US/AU, with full tax, retirement-vehicle, government-pension, sample-profile, and insight coverage.

**Architecture:** Build a new `src/lib/countries/uk/` plugin directory implementing the existing `CountryProfile` interfaces (defined in `src/lib/countries/types.ts`). Tasks 235–244 author each plugin file as a standalone export (dead code, no import path). Task 245 is the atomic wire-up: extends the `CountryCode` / `SupportedCurrency` / `Locale` / `TaxTreatment` unions, adds `marriageAllowance?` to `FinancialState`, wires withdrawal-tax for `uk-pension`, assembles `uk/index.ts`, and registers UK in `COUNTRIES`. After task 245 lands, UK appears in every UI surface (country selector, asset suggestions, currency formatter) automatically because Phase A migrated those consumers to read from `getRegisteredCountries()`.

**Tech Stack:** TypeScript (strict), Vitest, Playwright, Next.js 15 (App Router).

**Reference:** Spec at `docs/superpowers/specs/2026-05-09-uk-support-design.md`. Phase A plan at `docs/superpowers/plans/2026-05-09-country-plugin-architecture.md`. Closest implementation analogue: `src/lib/countries/australia/` (most recently authored country plugin, full set of files).

**Prerequisite:** Ralph tasks 231–234 (Phase A finishers) must be complete and the snapshot regression tests at `tests/unit/tax-engine-snapshot.test.ts` and `tests/unit/withdrawal-tax-snapshot.test.ts` must stay green after every task in this plan.

**Test file convention:** vitest only includes `tests/unit/**/*.test.{ts,tsx}`. Place UK tests at `tests/unit/countries/uk/<file>.test.ts` mirroring source paths.

**Commit convention:** Commit messages follow the Ralph format `ralph: complete task <N> - <short title>`.

---

## File Structure

Files created by this plan (all under `src/lib/countries/uk/` unless noted):

```text
src/lib/countries/uk/
  tax-tables.ts             — Task 235: rUK + Scotland bands, NI, PA, CGT constants
  vehicles.ts               — Task 236: ISA / LISA / JISA / SIPP / Workplace Pension / Premium Bonds
  government-retirement.ts  — Task 237: State Pension
  tax-credits.ts            — Task 238: Marriage Allowance + info-only items
  sample-profiles.ts        — Task 239: 3 quick-starts (early / mid / pre-retirement)
  insights.ts               — Task 240: UK InsightProvider
  rmd.ts                    — Task 241: N/A stub
  benchmarks.ts             — Task 241: UK age-group + national averages
  flowchart-steps.ts        — Task 241: UK flowchart builder
  tax-engine.ts             — Tasks 242–244: TaxEngine (income tax, PA taper, NI, MA, withdrawal, CGT, segments)
  index.ts                  — Task 245: assembles UK_COUNTRY: CountryProfile

tests/unit/countries/uk/    — per-task T1 tests, plus Task 246 cross-cutting suite
tests/e2e/uk-flow.spec.ts   — Task 247

Modified by Task 245 only:
  src/lib/countries/types.ts          — CountryCode adds "UK"
  src/lib/currency.ts                 — SupportedCurrency adds "GBP", FALLBACK_RATES adds GBP pairs
  src/lib/withdrawal-tax.ts           — TaxTreatment adds "uk-pension", classifyTaxTreatment + tax shim arm
  src/lib/financial-types.ts          — FinancialState adds marriageAllowance, country union adds "UK"
  src/lib/countries/index.ts          — COUNTRIES adds UK getter
  src/lib/flowchart-steps.ts          — buildUKSteps export (referenced by Task 241)
```

---

## Task 235: uk/tax-tables.ts — bracket data, NI, PA, CGT constants

**Files:**
- Create: `src/lib/countries/uk/tax-tables.ts`
- Create: `tests/unit/countries/uk/tax-tables.test.ts`

**Context:** UK tax computation cannot reuse `BracketTable` directly because the Personal Allowance is income-dependent (tapered above £100k). This file defines UK-specific data structures: income-tax bands stated as taxable amounts **above the Personal Allowance**, plus separate NI bands stated as absolute income.

- [ ] **Step 1: Write the bracket-data tests (test-first)**

Create `tests/unit/countries/uk/tax-tables.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  UK_PERSONAL_ALLOWANCE_2025,
  UK_PA_TAPER_THRESHOLD,
  UK_MARRIAGE_ALLOWANCE_TRANSFER,
  UK_RUK_BANDS_2025,
  UK_SCOTLAND_BANDS_2025,
  UK_NI_BANDS_2025,
  UK_CGT_2025,
  getUKIncomeTaxBands,
  getUKNIBands,
  getUKCGT,
} from "@/lib/countries/uk/tax-tables";

describe("UK tax-tables", () => {
  it("rUK bands sum widths correctly", () => {
    // Bands are stated above PA: 0–37,700 @20%, 37,700–112,570 @40%, top @45%.
    expect(UK_RUK_BANDS_2025).toEqual([
      { upToAbovePA: 37_700, rate: 0.20 },
      { upToAbovePA: 112_570, rate: 0.40 },
      { upToAbovePA: Infinity, rate: 0.45 },
    ]);
  });

  it("Scotland has 6 bands", () => {
    expect(UK_SCOTLAND_BANDS_2025).toHaveLength(6);
    expect(UK_SCOTLAND_BANDS_2025[0]).toEqual({ upToAbovePA: 2_827, rate: 0.19 });
    expect(UK_SCOTLAND_BANDS_2025[5]).toEqual({ upToAbovePA: Infinity, rate: 0.48 });
  });

  it("NI bands use absolute thresholds (£12,570 PT and £50,270 UEL)", () => {
    expect(UK_NI_BANDS_2025).toEqual([
      { upTo: 12_570, rate: 0 },
      { upTo: 50_270, rate: 0.08 },
      { upTo: Infinity, rate: 0.02 },
    ]);
  });

  it("PA taper threshold is £100k", () => {
    expect(UK_PA_TAPER_THRESHOLD).toBe(100_000);
  });

  it("Marriage Allowance transfer is £1,260", () => {
    expect(UK_MARRIAGE_ALLOWANCE_TRANSFER).toBe(1_260);
  });

  it("CGT annual exempt amount is £3,000", () => {
    expect(UK_CGT_2025.annualExemptAmount).toBe(3_000);
  });

  it("getUKIncomeTaxBands returns Scotland bands for SCT", () => {
    expect(getUKIncomeTaxBands("SCT", 2025)).toBe(UK_SCOTLAND_BANDS_2025);
  });

  it("getUKIncomeTaxBands returns rUK bands for ENG/WAL/NIR", () => {
    expect(getUKIncomeTaxBands("ENG", 2025)).toBe(UK_RUK_BANDS_2025);
    expect(getUKIncomeTaxBands("WAL", 2025)).toBe(UK_RUK_BANDS_2025);
    expect(getUKIncomeTaxBands("NIR", 2025)).toBe(UK_RUK_BANDS_2025);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run tests/unit/countries/uk/tax-tables.test.ts`
Expected: Module-not-found error or every assertion failing.

- [ ] **Step 3: Write the source file**

Create `src/lib/countries/uk/tax-tables.ts`:

```typescript
/**
 * UK income-tax bands (rUK + Scotland), National Insurance bands, Personal
 * Allowance, and Capital Gains Tax constants for 2025/26.
 *
 * Source: HMRC published rates for tax year 2025/26 (6 April 2025 – 5 April 2026).
 *
 * Note: income-tax bands are stated as *taxable amounts above the Personal
 * Allowance*, following HMRC convention. The tax engine subtracts the
 * effective PA from gross income before walking the bands. NI bands use
 * absolute income thresholds.
 */

/** UK Personal Allowance for 2025/26 (set by Parliament, applies UK-wide). */
export const UK_PERSONAL_ALLOWANCE_2025 = 12_570;

/** Income above which the Personal Allowance tapers (£1 lost per £2 over). */
export const UK_PA_TAPER_THRESHOLD = 100_000;

/** Marriage Allowance transfer amount: recipient PA + £1,260; donor PA − £1,260. */
export const UK_MARRIAGE_ALLOWANCE_TRANSFER = 1_260;

/** State Pension age in 2025/26 (rising to 67 between 2026–28). */
export const UK_STATE_PENSION_AGE = 66;

/** Minimum access age for SIPP / Workplace Pension (rising to 57 in 2028). */
export const UK_PENSION_ACCESS_AGE = 55;

/** LISA minimum access age without 25% penalty (or first-home purchase). */
export const UK_LISA_ACCESS_AGE = 60;

/** A single income-tax band, expressed as taxable income *above* the PA. */
export interface UKIncomeTaxBand {
  /** Upper bound of this band, measured as £ above the effective PA. */
  upToAbovePA: number;
  /** Marginal rate within this band. */
  rate: number;
}

/** A single NI band, expressed as absolute employment income. */
export interface UKNIBand {
  /** Upper bound of this band in absolute income. */
  upTo: number;
  rate: number;
}

/**
 * 2025/26 rUK (England, Wales, Northern Ireland) income-tax bands.
 * Basic 20% on £0–37,700 above PA; higher 40% to £125,140 above PA
 * (i.e. £112,570 of band width); additional 45% above £125,140.
 */
export const UK_RUK_BANDS_2025: UKIncomeTaxBand[] = [
  { upToAbovePA: 37_700, rate: 0.20 },
  { upToAbovePA: 112_570, rate: 0.40 },
  { upToAbovePA: Infinity, rate: 0.45 },
];

/**
 * 2025/26 Scotland income-tax bands.
 * Starter 19% / Basic 20% / Intermediate 21% / Higher 42% / Advanced 45% / Top 48%.
 * Boundaries from spec: above PA £2,827 / £14,921 / £31,092 / £62,430 / £125,140 absolute.
 */
export const UK_SCOTLAND_BANDS_2025: UKIncomeTaxBand[] = [
  { upToAbovePA: 2_827, rate: 0.19 },
  { upToAbovePA: 14_921, rate: 0.20 },
  { upToAbovePA: 31_092, rate: 0.21 },
  { upToAbovePA: 62_430, rate: 0.42 },
  { upToAbovePA: 112_570, rate: 0.45 },
  { upToAbovePA: Infinity, rate: 0.48 },
];

/**
 * Class 1 Employee NI bands for 2025/26.
 * PT (Primary Threshold) £12,570; UEL (Upper Earnings Limit) £50,270.
 * Note: NI applies to employment income only — not capital gains, dividends,
 * or other passive income.
 */
export const UK_NI_BANDS_2025: UKNIBand[] = [
  { upTo: 12_570, rate: 0 },
  { upTo: 50_270, rate: 0.08 },
  { upTo: Infinity, rate: 0.02 },
];

/** Capital Gains Tax constants for 2025/26 (non-residential rates). */
export const UK_CGT_2025 = {
  annualExemptAmount: 3_000,
  basicRate: 0.18,
  higherRate: 0.24,
};

const RUK_JURISDICTIONS = new Set(["ENG", "WAL", "NIR"]);

/** Returns income-tax bands for a UK jurisdiction. Scotland diverges; rUK shared. */
export function getUKIncomeTaxBands(jurisdiction: string, _year: number): UKIncomeTaxBand[] {
  if (jurisdiction === "SCT") return UK_SCOTLAND_BANDS_2025;
  if (RUK_JURISDICTIONS.has(jurisdiction)) return UK_RUK_BANDS_2025;
  // Default to rUK for any unrecognised jurisdiction (defensive).
  return UK_RUK_BANDS_2025;
}

/** Returns NI bands for a year. Currently uniform across UK jurisdictions. */
export function getUKNIBands(_year: number): UKNIBand[] {
  return UK_NI_BANDS_2025;
}

/** Returns CGT constants for a year. */
export function getUKCGT(_year: number): typeof UK_CGT_2025 {
  return UK_CGT_2025;
}
```

- [ ] **Step 4: Run tests, build, lint**

Run: `npx vitest run tests/unit/countries/uk/tax-tables.test.ts && npx tsc --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/uk/tax-tables.ts tests/unit/countries/uk/tax-tables.test.ts
git commit -m "ralph: complete task 235 - UK tax tables (rUK + Scotland bands, NI, PA, CGT)"
```

---

## Task 236: uk/vehicles.ts — VehicleCatalog (ISA, LISA, JISA, SIPP, Workplace Pension, Premium Bonds)

**Files:**
- Create: `src/lib/countries/uk/vehicles.ts`
- Create: `tests/unit/countries/uk/vehicles.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/countries/uk/vehicles.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukVehicles } from "@/lib/countries/uk/vehicles";

describe("UK vehicles catalog", () => {
  it("lists ISA family + pensions in suggestions", () => {
    expect(ukVehicles.categories).toEqual([
      "Cash ISA",
      "Stocks & Shares ISA",
      "Lifetime ISA",
      "Junior ISA",
      "SIPP",
      "Workplace Pension",
      "Premium Bonds",
    ]);
  });

  it("flagEmoji is GB flag", () => {
    expect(ukVehicles.flagEmoji).toBe("🇬🇧");
  });

  it("ISA family is tax-sheltered (tax-free withdrawals)", () => {
    expect(ukVehicles.isTaxSheltered("Cash ISA")).toBe(true);
    expect(ukVehicles.isTaxSheltered("Stocks & Shares ISA")).toBe(true);
    expect(ukVehicles.isTaxSheltered("Lifetime ISA")).toBe(true);
    expect(ukVehicles.isTaxSheltered("Junior ISA")).toBe(true);
    expect(ukVehicles.isTaxSheltered("Premium Bonds")).toBe(true);
  });

  it("Pensions are tax-deferred (taxed on withdrawal)", () => {
    expect(ukVehicles.isTaxDeferred("SIPP")).toBe(true);
    expect(ukVehicles.isTaxDeferred("Workplace Pension")).toBe(true);
    expect(ukVehicles.isTaxDeferred("Cash ISA")).toBe(false);
  });

  it("Cash ISA and Premium Bonds are interest-income (but hidden by tax-shelter)", () => {
    expect(ukVehicles.isIncomeTaxRoi("Cash ISA")).toBe(true);
    expect(ukVehicles.isIncomeTaxRoi("Premium Bonds")).toBe(true);
    expect(ukVehicles.isIncomeTaxRoi("Stocks & Shares ISA")).toBe(false);
  });

  it("All UK retirement + ISA vehicles reinvest by default", () => {
    for (const cat of ["Cash ISA", "Stocks & Shares ISA", "Lifetime ISA",
                       "Junior ISA", "SIPP", "Workplace Pension", "Premium Bonds"]) {
      expect(ukVehicles.isReinvestDefault(cat)).toBe(true);
    }
  });

  it("Only Workplace Pension is employer-match eligible", () => {
    expect(ukVehicles.isEmployerMatchEligible("Workplace Pension")).toBe(true);
    expect(ukVehicles.isEmployerMatchEligible("SIPP")).toBe(false);
    expect(ukVehicles.isEmployerMatchEligible("Cash ISA")).toBe(false);
  });

  it("Default ROI: cash 4%, equity-backed 7%, JISA 5%", () => {
    expect(ukVehicles.getDefaultRoi("Cash ISA")).toBe(4);
    expect(ukVehicles.getDefaultRoi("Premium Bonds")).toBe(4);
    expect(ukVehicles.getDefaultRoi("Stocks & Shares ISA")).toBe(7);
    expect(ukVehicles.getDefaultRoi("Lifetime ISA")).toBe(7);
    expect(ukVehicles.getDefaultRoi("SIPP")).toBe(7);
    expect(ukVehicles.getDefaultRoi("Workplace Pension")).toBe(7);
    expect(ukVehicles.getDefaultRoi("Junior ISA")).toBe(5);
  });
});
```

- [ ] **Step 2: Write the source**

Create `src/lib/countries/uk/vehicles.ts`:

```typescript
import type { VehicleCatalog } from "@/lib/countries/types";

const CATEGORIES = [
  "Cash ISA",
  "Stocks & Shares ISA",
  "Lifetime ISA",
  "Junior ISA",
  "SIPP",
  "Workplace Pension",
  "Premium Bonds",
];

const DESCRIPTIONS: Record<string, string> = {
  "Cash ISA": "Tax-free interest, £20k/yr combined ISA allowance",
  "Stocks & Shares ISA": "Tax-free growth and withdrawals, £20k/yr combined",
  "Lifetime ISA": "£4k/yr (within £20k), 25% government bonus, age 60+ or first home",
  "Junior ISA": "£9k/yr, locked until age 18",
  "SIPP": "Self-Invested Personal Pension, marginal-rate tax relief, 25% tax-free lump sum from 55",
  "Workplace Pension": "Employer-sponsored, auto-enrolment, similar tax treatment to SIPP",
  "Premium Bonds": "NS&I, tax-free prizes, ~4% effective average",
};

const DEFAULT_ROI: Record<string, number> = {
  "Cash ISA": 4,
  "Stocks & Shares ISA": 7,
  "Lifetime ISA": 7,
  "Junior ISA": 5,
  "SIPP": 7,
  "Workplace Pension": 7,
  "Premium Bonds": 4,
};

// All UK shelter wrappers produce tax-free withdrawals (ISA family + Premium Bonds).
// SIPP/Workplace Pension are tax-deferred (marginal-rate tax on 75%, 25% lump-sum free).
const TAX_SHELTERED = new Set([
  "Cash ISA",
  "Stocks & Shares ISA",
  "Lifetime ISA",
  "Junior ISA",
  "Premium Bonds",
]);

const TAX_DEFERRED = new Set(["SIPP", "Workplace Pension"]);

// Categories where the ROI is interest income (would be taxed at marginal rate
// if not sheltered). UI hides the toggle when the category is tax-sheltered.
const INCOME_TAX_ROI = new Set([
  "Cash ISA",
  "Premium Bonds",
  "Savings", "Savings Account", "Checking", "GIC", "HISA",
]);

const REINVEST_DEFAULT = new Set([
  "Cash ISA",
  "Stocks & Shares ISA",
  "Lifetime ISA",
  "Junior ISA",
  "SIPP",
  "Workplace Pension",
  "Premium Bonds",
  "Brokerage",
]);

const EMPLOYER_MATCH = new Set(["Workplace Pension"]);

export const ukVehicles: VehicleCatalog = {
  categories: CATEGORIES,
  flagEmoji: "🇬🇧",
  getDescription: (category) => DESCRIPTIONS[category],
  getDefaultRoi: (category) => DEFAULT_ROI[category],
  isTaxSheltered: (category) => TAX_SHELTERED.has(category),
  isTaxDeferred: (category) => TAX_DEFERRED.has(category),
  isIncomeTaxRoi: (category) => INCOME_TAX_ROI.has(category),
  isReinvestDefault: (category) => REINVEST_DEFAULT.has(category),
  isEmployerMatchEligible: (category) => EMPLOYER_MATCH.has(category),
};
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/vehicles.test.ts && npx tsc --noEmit`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/uk/vehicles.ts tests/unit/countries/uk/vehicles.test.ts
git commit -m "ralph: complete task 236 - UK vehicles catalog (ISA, LISA, JISA, SIPP, WP, Premium Bonds)"
```

---

## Task 237: uk/government-retirement.ts — State Pension

**Files:**
- Create: `src/lib/countries/uk/government-retirement.ts`
- Create: `tests/unit/countries/uk/government-retirement.test.ts`

**Context:** UK State Pension is paid weekly; `computeMonthly` converts via `weekly × 52 / 12`. Adds a new optional field `statePensionWeekly` to `GovernmentRetirementIncome` — the extension is wired in Task 245.

- [ ] **Step 1: Write the test**

Create `tests/unit/countries/uk/government-retirement.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  ukGovernmentRetirement,
  UK_STATE_PENSION_FULL_NEW_WEEKLY,
  weeklyToMonthly,
} from "@/lib/countries/uk/government-retirement";

describe("UK government retirement", () => {
  it("programLabel is 'State Pension'", () => {
    expect(ukGovernmentRetirement.programLabel).toBe("State Pension");
  });

  it("computeMonthly returns 0 when no income supplied", () => {
    expect(ukGovernmentRetirement.computeMonthly(undefined)).toBe(0);
    expect(ukGovernmentRetirement.computeMonthly({})).toBe(0);
  });

  it("computeMonthly converts weekly to monthly via × 52 / 12", () => {
    const result = ukGovernmentRetirement.computeMonthly({ statePensionWeekly: 100 });
    expect(result).toBeCloseTo(100 * 52 / 12, 4);
  });

  it("Full new State Pension preset is £230.25/wk", () => {
    expect(UK_STATE_PENSION_FULL_NEW_WEEKLY).toBe(230.25);
  });

  it("Full new preset → ~£997.75/mo", () => {
    expect(weeklyToMonthly(UK_STATE_PENSION_FULL_NEW_WEEKLY)).toBeCloseTo(997.75, 1);
  });

  it("presetsFor('statePension') returns none / full-new / custom", () => {
    const presets = ukGovernmentRetirement.presetsFor("statePension");
    expect(presets.map((p) => p.value)).toEqual(["none", "full-new", "custom"]);
    expect(presets[1].amount).toBe(UK_STATE_PENSION_FULL_NEW_WEEKLY);
  });

  it("presetsFor returns empty array for unknown field", () => {
    expect(ukGovernmentRetirement.presetsFor("agePension")).toEqual([]);
  });
});
```

- [ ] **Step 2: Write the source**

Create `src/lib/countries/uk/government-retirement.ts`:

```typescript
/**
 * UK State Pension plugin.
 *
 * The full new State Pension rate is published annually by the DWP (uprated
 * each April under the triple-lock). 2025/26 value: £230.25/week.
 *
 * Pension is paid weekly; computeMonthly converts via × 52 / 12 (≈ 4.333).
 */
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

/** Full new State Pension weekly rate for 2025/26. Source: gov.uk/state-pension. */
export const UK_STATE_PENSION_FULL_NEW_WEEKLY = 230.25;

export type UkStatePensionPreset = "none" | "full-new" | "custom";

export function getUkStatePensionPresetAmount(
  preset: UkStatePensionPreset,
  customAmount?: number,
): number {
  switch (preset) {
    case "none": return 0;
    case "full-new": return UK_STATE_PENSION_FULL_NEW_WEEKLY;
    case "custom": return customAmount ?? 0;
  }
}

/** Convert weekly amount to monthly: weekly × 52 / 12. */
export function weeklyToMonthly(weekly: number): number {
  return weekly * 52 / 12;
}

export const ukGovernmentRetirement: GovernmentRetirementPlugin = {
  programLabel: "State Pension",
  computeMonthly(income) {
    if (!income) return 0;
    return weeklyToMonthly(income.statePensionWeekly ?? 0);
  },
  presetsFor(field) {
    if (field === "statePension") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "full-new", label: `Full new (£${UK_STATE_PENSION_FULL_NEW_WEEKLY.toFixed(2)}/wk)`, amount: UK_STATE_PENSION_FULL_NEW_WEEKLY },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
```

**Note:** the `statePensionWeekly` field on `GovernmentRetirementIncome` is added in Task 245. Until then, the TypeScript compiler will flag `income.statePensionWeekly` — use `// @ts-expect-error -- statePensionWeekly added in Task 245` on the line if the test fails to compile against the existing interface. Remove the comment in Task 245 once the field is added.

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/government-retirement.test.ts && npx tsc --noEmit`
Expected: green (test file uses inline `{ statePensionWeekly: ... }` literals, which TS narrows without needing the interface extension).

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/uk/government-retirement.ts tests/unit/countries/uk/government-retirement.test.ts
git commit -m "ralph: complete task 237 - UK State Pension plugin"
```

---

## Task 238: uk/tax-credits.ts — Marriage Allowance + info-only items

**Files:**
- Create: `src/lib/countries/uk/tax-credits.ts`
- Create: `tests/unit/countries/uk/tax-credits.test.ts`

**Context:** UK tax credits are mostly *info-only* in this app — the Marriage Allowance arithmetic is handled directly in the tax engine (via the `marriageAllowance` field on `FinancialState`). The catalog lists items so the credit picker UI displays them as educational reminders.

- [ ] **Step 1: Write the test**

Create `tests/unit/countries/uk/tax-credits.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukTaxCredits } from "@/lib/countries/uk/tax-credits";

describe("UK tax credits catalog", () => {
  it("returns at least 5 UK-specific categories", () => {
    const cats = ukTaxCredits.getCategories(2025);
    expect(cats.length).toBeGreaterThanOrEqual(5);
    expect(cats.every((c) => c.jurisdiction === "UK")).toBe(true);
  });

  it("includes Marriage Allowance, Gift Aid, Personal Savings Allowance", () => {
    const names = ukTaxCredits.getCategories(2025).map((c) => c.name);
    expect(names).toContain("Marriage Allowance");
    expect(names).toContain("Gift Aid");
    expect(names).toContain("Personal Savings Allowance");
  });

  it("findCategory locates entry by name", () => {
    const cat = ukTaxCredits.findCategory("Gift Aid", 2025);
    expect(cat).toBeDefined();
    expect(cat?.jurisdiction).toBe("UK");
  });

  it("getCategoriesForFilingStatus filters by filing status if specified", () => {
    const singleCats = ukTaxCredits.getCategoriesForFilingStatus("single", 2025);
    expect(singleCats.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Write the source**

Create `src/lib/countries/uk/tax-credits.ts`:

```typescript
import type { TaxCreditCatalog } from "@/lib/countries/types";
import type { TaxCreditCategory, FilingStatus } from "@/lib/tax-credits";
import { resolveCategoryForYear } from "@/lib/tax-credit-resolve";

const UK_CATEGORIES: TaxCreditCategory[] = [
  {
    name: "Marriage Allowance",
    type: "non-refundable",
    jurisdiction: "UK",
    description:
      "Transfer £1,260 of unused Personal Allowance to a basic-rate spouse / civil partner. Recipient must earn between £12,570 and £50,270 (rUK) for full benefit. Saves the couple up to £252/yr.",
    incomeLimits: {
      "married-civil-partnership": { phaseOutStart: 12_570, phaseOutEnd: 50_270 },
    },
    maxAmount: 252,
    fixedAmount: true,
  },
  {
    name: "Gift Aid",
    type: "non-refundable",
    jurisdiction: "UK",
    description:
      "Charitable donations attract 25p of basic-rate tax relief per £1 donated (paid to the charity). Higher/additional-rate taxpayers can reclaim the difference between basic rate and their marginal rate via Self Assessment.",
  },
  {
    name: "Pension Contributions",
    type: "non-refundable",
    jurisdiction: "UK",
    description:
      "Contributions to a SIPP or Workplace Pension receive tax relief at your marginal rate (subject to the annual allowance, typically £60,000). Basic-rate relief is added automatically; higher/additional-rate taxpayers reclaim via Self Assessment.",
  },
  {
    name: "Personal Savings Allowance",
    type: "non-refundable",
    jurisdiction: "UK",
    description:
      "Tax-free savings interest of £1,000 (basic-rate), £500 (higher-rate), or £0 (additional-rate). Applies automatically — no claim needed.",
  },
  {
    name: "Dividend Allowance",
    type: "non-refundable",
    jurisdiction: "UK",
    description:
      "First £500 of dividend income is tax-free in 2025/26. Above the allowance, dividends are taxed at 8.75% (basic), 33.75% (higher), or 39.35% (additional).",
  },
  {
    name: "Capital Gains Annual Exempt Amount",
    type: "non-refundable",
    jurisdiction: "UK",
    description:
      "First £3,000 of capital gains is tax-free in 2025/26. Above the allowance, non-residential gains are taxed at 18% (basic) or 24% (higher).",
  },
  {
    name: "Pension Annual Allowance",
    type: "non-refundable",
    jurisdiction: "UK",
    description:
      "Maximum pension contribution receiving tax relief in 2025/26: £60,000 (or 100% of earnings, whichever is lower). Tapered for adjusted income over £260,000 — minimum £10,000.",
  },
];

export const ukTaxCredits: TaxCreditCatalog = {
  getCategories(year) {
    return UK_CATEGORIES.map((c) => resolveCategoryForYear(c, year));
  },
  getCategoriesForFilingStatus(filingStatus: FilingStatus, year) {
    return UK_CATEGORIES
      .filter((c) => !c.incomeLimits || (c.incomeLimits as Record<string, unknown>)[filingStatus] !== undefined || Object.keys(c.incomeLimits).length === 0)
      .map((c) => resolveCategoryForYear(c, year));
  },
  findCategory(name, year) {
    const found = UK_CATEGORIES.find((c) => c.name === name);
    return found ? resolveCategoryForYear(found, year) : undefined;
  },
};
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/tax-credits.test.ts && npx tsc --noEmit`
Expected: green.

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/uk/tax-credits.ts tests/unit/countries/uk/tax-credits.test.ts
git commit -m "ralph: complete task 238 - UK tax credits catalog (Marriage Allowance + info-only items)"
```

---

## Task 239: uk/sample-profiles.ts — three quick-starts

**Files:**
- Create: `src/lib/countries/uk/sample-profiles.ts`
- Create: `tests/unit/countries/uk/sample-profiles.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/countries/uk/sample-profiles.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukProfiles } from "@/lib/countries/uk/sample-profiles";

describe("UK sample profiles", () => {
  it("exposes 3 quick-start profiles", () => {
    expect(ukProfiles.quickStarts).toHaveLength(3);
  });

  it("each profile has country='UK' and a valid jurisdiction", () => {
    for (const p of ukProfiles.quickStarts) {
      expect(p.state.country).toBe("UK");
      expect(["ENG", "WAL", "NIR", "SCT"]).toContain(p.state.jurisdiction);
    }
  });

  it("profile IDs are unique and prefixed for UK", () => {
    const ids = ukProfiles.quickStarts.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => id.endsWith("-uk"))).toBe(true);
  });

  it("each profile has an ISA or pension in assets", () => {
    for (const p of ukProfiles.quickStarts) {
      const cats = p.state.assets?.map((a) => a.category) ?? [];
      const hasUKVehicle = cats.some((c) =>
        /ISA|SIPP|Workplace Pension|Premium Bonds/.test(c)
      );
      expect(hasUKVehicle).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Write the source**

Create `src/lib/countries/uk/sample-profiles.ts`:

```typescript
import type { SampleProfile } from "@/lib/sample-profiles";
import type { ProfileLibrary } from "@/lib/countries/types";

export const UK_SAMPLE_PROFILES: SampleProfile[] = [
  {
    id: "early-career-uk",
    name: "Early career, age 26",
    emoji: "🌱",
    description: "Renting in Manchester, building Cash ISA + Workplace Pension auto-enrolment",
    highlights: ["£32k salary", "Cash ISA + Workplace Pension", "Student loan plan 2"],
    state: {
      country: "UK",
      jurisdiction: "ENG",
      age: 26,
      income: [
        { id: "i1", category: "Salary", amount: 2667, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 950 },
        { id: "e2", category: "Groceries", amount: 220 },
        { id: "e3", category: "Council Tax", amount: 130 },
        { id: "e4", category: "Transportation", amount: 120 },
        { id: "e5", category: "Utilities", amount: 110 },
        { id: "e6", category: "Phone", amount: 25 },
        { id: "e7", category: "Subscriptions", amount: 35 },
      ],
      assets: [
        { id: "a1", category: "Cash ISA", amount: 3_500, roi: 4, monthlyContribution: 150, surplusTarget: true },
        { id: "a2", category: "Workplace Pension", amount: 4_200, roi: 7, monthlyContribution: 0, employerMatchPct: 3 },
      ],
      debts: [
        { id: "d1", category: "Student Loan", amount: 28_000, interestRate: 7.8, monthlyPayment: 70 },
      ],
      properties: [],
      stocks: [],
    },
  },
  {
    id: "mid-career-uk",
    name: "Mid career, age 38",
    emoji: "📈",
    description: "Owns a home with mortgage, contributing to SIPP + S&S ISA + LISA",
    highlights: ["£65k salary", "S&S ISA + SIPP + LISA", "Mortgage on London flat"],
    state: {
      country: "UK",
      jurisdiction: "ENG",
      age: 38,
      income: [
        { id: "i1", category: "Salary", amount: 5_417, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 1_700 },
        { id: "e2", category: "Groceries", amount: 400 },
        { id: "e3", category: "Council Tax", amount: 180 },
        { id: "e4", category: "Transportation", amount: 150 },
        { id: "e5", category: "Utilities", amount: 180 },
        { id: "e6", category: "Phone", amount: 35 },
        { id: "e7", category: "Subscriptions", amount: 80 },
      ],
      assets: [
        { id: "a1", category: "Stocks & Shares ISA", amount: 32_000, roi: 7, monthlyContribution: 400 },
        { id: "a2", category: "SIPP", amount: 28_000, roi: 7, monthlyContribution: 300 },
        { id: "a3", category: "Lifetime ISA", amount: 12_000, roi: 7, monthlyContribution: 250 },
        { id: "a4", category: "Cash ISA", amount: 6_000, roi: 4, surplusTarget: true },
      ],
      debts: [],
      properties: [
        { id: "p1", name: "Home", value: 380_000, mortgageBalance: 210_000, monthlyPayment: 1_700, interestRate: 4.5 },
      ],
      stocks: [],
    },
  },
  {
    id: "pre-retirement-uk",
    name: "Pre-retirement, age 58",
    emoji: "🌿",
    description: "Large SIPP, S&S ISA, mortgage nearly paid, State Pension on the horizon",
    highlights: ["£82k salary", "Large SIPP + ISA", "Full new State Pension at 66"],
    state: {
      country: "UK",
      jurisdiction: "ENG",
      age: 58,
      retirementAge: 66,
      income: [
        { id: "i1", category: "Salary", amount: 6_833, frequency: "monthly", incomeType: "employment" },
      ],
      expenses: [
        { id: "e1", category: "Rent/Mortgage Payment", amount: 900 },
        { id: "e2", category: "Groceries", amount: 450 },
        { id: "e3", category: "Council Tax", amount: 200 },
        { id: "e4", category: "Transportation", amount: 200 },
        { id: "e5", category: "Utilities", amount: 220 },
        { id: "e6", category: "Phone", amount: 40 },
        { id: "e7", category: "Subscriptions", amount: 60 },
      ],
      assets: [
        { id: "a1", category: "SIPP", amount: 320_000, roi: 6, monthlyContribution: 600 },
        { id: "a2", category: "Stocks & Shares ISA", amount: 95_000, roi: 6, monthlyContribution: 400 },
        { id: "a3", category: "Workplace Pension", amount: 140_000, roi: 6, monthlyContribution: 0, employerMatchPct: 5 },
        { id: "a4", category: "Cash ISA", amount: 18_000, roi: 4, surplusTarget: true },
      ],
      debts: [],
      properties: [
        { id: "p1", name: "Home", value: 425_000, mortgageBalance: 35_000, monthlyPayment: 900, interestRate: 3.9 },
      ],
      stocks: [],
      governmentRetirementIncome: {
        statePensionWeekly: 230.25,
      },
    },
  },
];

export const ukProfiles: ProfileLibrary = {
  samples: UK_SAMPLE_PROFILES,
  quickStarts: UK_SAMPLE_PROFILES,
};
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/sample-profiles.test.ts && npx tsc --noEmit`
Expected: green. (`statePensionWeekly` is added to `GovernmentRetirementIncome` in Task 245 — if TS complains, the sample-profiles can be checked-in with `// @ts-expect-error` on the offending line, removed in Task 245.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/uk/sample-profiles.ts tests/unit/countries/uk/sample-profiles.test.ts
git commit -m "ralph: complete task 239 - UK sample profiles (early/mid/pre-retirement quick-starts)"
```

---

## Task 240: uk/insights.ts — UK InsightProvider

**Files:**
- Create: `src/lib/countries/uk/insights.ts`
- Create: `tests/unit/countries/uk/insights.test.ts`

- [ ] **Step 1: Write the test**

Create `tests/unit/countries/uk/insights.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukInsights } from "@/lib/countries/uk/insights";
import { INITIAL_STATE } from "@/lib/financial-types";

describe("UK insights", () => {
  it("returns [] when country !== UK", () => {
    expect(ukInsights.getCandidates({ ...INITIAL_STATE, country: "CA" })).toEqual([]);
  });

  it("suggests an ISA when UK user has no ISA and has employment income", () => {
    const state = {
      ...INITIAL_STATE,
      country: "UK" as const,
      jurisdiction: "ENG",
      assets: [],
      income: [{ id: "i1", category: "Salary", amount: 3_000 }],
    };
    const insights = ukInsights.getCandidates(state);
    expect(insights.some((i) => i.id === "uk-no-isa")).toBe(true);
  });

  it("suggests a Workplace Pension when UK user has employment income but no pension", () => {
    const state = {
      ...INITIAL_STATE,
      country: "UK" as const,
      jurisdiction: "ENG",
      assets: [{ id: "a1", category: "Cash ISA", amount: 5_000 }],
      income: [{ id: "i1", category: "Salary", amount: 3_000 }],
    };
    const insights = ukInsights.getCandidates(state);
    expect(insights.some((i) => i.id === "uk-no-pension")).toBe(true);
  });

  it("warns about PA taper when income is in £100k–£125,140 band", () => {
    const state = {
      ...INITIAL_STATE,
      country: "UK" as const,
      jurisdiction: "ENG",
      assets: [{ id: "a1", category: "SIPP", amount: 30_000 }],
      income: [{ id: "i1", category: "Salary", amount: 9_500 }],  // £114k annual
    };
    const insights = ukInsights.getCandidates(state);
    expect(insights.some((i) => i.id === "uk-pa-taper")).toBe(true);
  });
});
```

- [ ] **Step 2: Write the source**

Create `src/lib/countries/uk/insights.ts`:

```typescript
import type { InsightProvider } from "@/lib/countries/types";
import type { Insight } from "@/lib/insights/types";

export const ukInsights: InsightProvider = {
  getCandidates(state) {
    if (state.country !== "UK") return [];

    const candidates: Insight[] = [];

    const assetCats = state.assets.map((a) => a.category.toLowerCase());
    const hasISA = assetCats.some((c) => c.includes("isa"));
    const hasPension = assetCats.some(
      (c) => c.includes("sipp") || c.includes("workplace pension")
    );

    const hasEmploymentIncome = state.income.some((i) => {
      const cat = i.category.toLowerCase();
      return cat.includes("salary") || cat.includes("employment") || cat.includes("wages");
    });

    // Annualised employment income (monthly × 12 — matches how other plugins read this).
    const annualEmployment = state.income
      .filter((i) => /salary|employment|wages/i.test(i.category))
      .reduce((sum, i) => sum + i.amount * 12, 0);

    if (!hasISA && hasEmploymentIncome) {
      candidates.push({
        id: "uk-no-isa",
        type: "uk-isa",
        message:
          "Every UK adult has a £20,000 annual ISA allowance. A Stocks & Shares ISA shelters investment growth and withdrawals from tax — one of the most powerful tax wrappers available. A Cash ISA serves the same role for emergency savings.",
        icon: "💷",
      });
    }

    if (!hasPension && hasEmploymentIncome) {
      candidates.push({
        id: "uk-no-pension",
        type: "uk-pension",
        message:
          "If you're employed in the UK, auto-enrolment requires your employer to contribute to a Workplace Pension. Your contributions get marginal-rate tax relief, and 25% of the pot is tax-free at age 55. Check that you're enrolled.",
        icon: "🏦",
      });
    }

    if (annualEmployment > 100_000 && annualEmployment <= 125_140) {
      candidates.push({
        id: "uk-pa-taper",
        type: "uk-pa-taper",
        message:
          "Your income sits in the Personal Allowance taper zone (£100k–£125,140), where every extra £2 of earnings loses £1 of Personal Allowance. The effective marginal rate is 60% (or 63% in Scotland). Pension contributions can pull you back below £100k and recover the allowance.",
        icon: "⚠️",
      });
    }

    return candidates;
  },
};
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/insights.test.ts && npx tsc --noEmit`
Expected: green. (Note: `country: "UK"` literal in tests — TS may complain until Task 245. If so, cast: `as const` plus `as unknown as FinancialState`.)

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/uk/insights.ts tests/unit/countries/uk/insights.test.ts
git commit -m "ralph: complete task 240 - UK insights provider (ISA, pension, PA taper)"
```

---

## Task 241: uk/rmd.ts + uk/benchmarks.ts + uk/flowchart-steps.ts (bundled tinies)

**Files:**
- Create: `src/lib/countries/uk/rmd.ts`
- Create: `src/lib/countries/uk/benchmarks.ts`
- Create: `src/lib/countries/uk/flowchart-steps.ts`
- Modify: `src/lib/flowchart-steps.ts` (add `buildUKSteps` export)
- Create: `tests/unit/countries/uk/rmd.test.ts`
- Create: `tests/unit/countries/uk/benchmarks.test.ts`
- Create: `tests/unit/countries/uk/flowchart-steps.test.ts`

**Context:** These three plugin files are small data/wrapper files. RMD: UK has no RRIF-style forced withdrawal, plugin returns 0. Benchmarks: ONS Wealth & Assets Survey (Wave 8, Apr 2018 – Mar 2020) age-group medians. Flowchart-steps: wraps a `buildUKSteps` helper added to `src/lib/flowchart-steps.ts` (alongside the existing CA/US/AU builders).

- [ ] **Step 1: Write rmd.ts + test**

Create `src/lib/countries/uk/rmd.ts`:

```typescript
/**
 * UK has no forced-withdrawal mechanism equivalent to US RMD or CA RRIF.
 * SIPP / Workplace Pension drawdown is at the holder's discretion (subject
 * to the 25% tax-free lump-sum rule, handled separately by the tax engine).
 */
import type { RmdRule } from "@/lib/countries/types";

export const ukRmd: RmdRule = {
  ruleName: "RMD",
  computeRmd() {
    return 0;
  },
};
```

Create `tests/unit/countries/uk/rmd.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukRmd } from "@/lib/countries/uk/rmd";

describe("UK RMD plugin", () => {
  it("computeRmd always returns 0 (no UK forced-withdrawal rule)", () => {
    expect(ukRmd.computeRmd(100_000, 75, "SIPP")).toBe(0);
    expect(ukRmd.computeRmd(50_000, 80, "Workplace Pension")).toBe(0);
  });
});
```

- [ ] **Step 2: Write benchmarks.ts + test**

Create `src/lib/countries/uk/benchmarks.ts`:

```typescript
/**
 * UK benchmark data — ONS Wealth and Assets Survey, Wave 8 (Apr 2018 – Mar 2020),
 * published 2022. Median household net wealth (excluding pensions where noted).
 * Values in GBP.
 *
 * Source: ONS WAS — total wealth by age of head of household.
 */
import type { BenchmarkData } from "@/lib/countries/types";

export const ukBenchmarks: BenchmarkData = {
  ageGroups: [
    { ageMin: 18, ageMax: 24, label: "18–24", medianNetWorth: 11_000,  medianSavingsRate: 0.06, medianDebtToIncomeRatio: 0.4, recommendedEmergencyMonths: 3, medianIncome: 22_000 },
    { ageMin: 25, ageMax: 34, label: "25–34", medianNetWorth: 67_000,  medianSavingsRate: 0.10, medianDebtToIncomeRatio: 2.2, recommendedEmergencyMonths: 3, medianIncome: 31_000 },
    { ageMin: 35, ageMax: 44, label: "35–44", medianNetWorth: 198_000, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 2.8, recommendedEmergencyMonths: 4, medianIncome: 38_000 },
    { ageMin: 45, ageMax: 54, label: "45–54", medianNetWorth: 397_000, medianSavingsRate: 0.14, medianDebtToIncomeRatio: 1.9, recommendedEmergencyMonths: 5, medianIncome: 41_000 },
    { ageMin: 55, ageMax: 64, label: "55–64", medianNetWorth: 553_000, medianSavingsRate: 0.16, medianDebtToIncomeRatio: 0.8, recommendedEmergencyMonths: 6, medianIncome: 36_000 },
    { ageMin: 65, ageMax: 120, label: "65+", medianNetWorth: 489_000, medianSavingsRate: 0.12, medianDebtToIncomeRatio: 0.2, recommendedEmergencyMonths: 6, medianIncome: 24_000 },
  ],
  national: {
    netWorth: 302_500,
    savingsRate: 0.12,
    debtToIncomeRatio: 1.7,
    emergencyMonths: 4,
    income: 33_000,
  },
  dataSource: "ONS Wealth and Assets Survey, Wave 8 (Apr 2018 – Mar 2020)",
};
```

Create `tests/unit/countries/uk/benchmarks.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukBenchmarks } from "@/lib/countries/uk/benchmarks";

describe("UK benchmarks", () => {
  it("covers 6 age groups from 18 to 65+", () => {
    expect(ukBenchmarks.ageGroups).toHaveLength(6);
    expect(ukBenchmarks.ageGroups[0].ageMin).toBe(18);
    expect(ukBenchmarks.ageGroups[5].ageMax).toBe(120);
  });

  it("attributes data source to ONS", () => {
    expect(ukBenchmarks.dataSource).toMatch(/ONS/);
  });

  it("national median income is positive", () => {
    expect(ukBenchmarks.national.income).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Write flowchart-steps.ts + test, add buildUKSteps to library**

Modify `src/lib/flowchart-steps.ts` — add a `buildUKSteps(d: InferredData): RawStep[]` function alongside `buildCASteps` / `buildUSSteps` / `buildAUSteps`. Steps mirror the UK personal-finance "flowchart" wiki (r/UKPersonalFinance):

Add the following to the bottom of `src/lib/flowchart-steps.ts`, after `buildAUSteps`:

```typescript
export function buildUKSteps(d: InferredData): RawStep[] {
  return [
    {
      id: "uk-budget",
      title: "Track your monthly budget",
      description: "Know what you earn after tax + NI, and where it goes.",
      completionHint: "Once you have a clear monthly budget.",
      detailText: "Use a spreadsheet, app, or this tool — the goal is awareness of inflow vs outflow.",
      progress: d.hasIncomeAndExpenses ? 100 : 0,
      isComplete: d.hasIncomeAndExpenses,
      userAcknowledgeable: true,
      acknowledgeLabel: "I have a working budget",
    },
    {
      id: "uk-high-interest-debt",
      title: "Pay off high-interest debt",
      description: "Anything > ~8% APR: credit cards, payday loans, overdrafts.",
      completionHint: "Once high-rate balances are cleared.",
      detailText: "Compound interest on debt outruns any reasonable investment return.",
      progress: d.hasHighInterestDebt ? 0 : 100,
      isComplete: !d.hasHighInterestDebt,
      skippable: true,
      skipLabel: "No high-interest debt",
    },
    {
      id: "uk-emergency-fund",
      title: "Build a 3–6 month emergency fund",
      description: "Easy-access Cash ISA or savings account.",
      completionHint: "Once you can cover 3–6 months of essentials.",
      detailText: "Aim for 3 months minimum if your job is stable; 6+ if income is variable.",
      progress: Math.min(100, d.emergencyMonthsCovered / 3 * 100),
      isComplete: d.emergencyMonthsCovered >= 3,
    },
    {
      id: "uk-workplace-pension",
      title: "Maximise employer pension match",
      description: "Free money via auto-enrolment + employer top-up.",
      completionHint: "Contributing at least the full match.",
      detailText: "Most UK employers match contributions up to a percentage — capture all of it.",
      progress: d.contributingToEmployerMatch ? 100 : 0,
      isComplete: d.contributingToEmployerMatch,
      userAcknowledgeable: true,
      acknowledgeLabel: "I'm capturing the full employer match",
    },
    {
      id: "uk-isa",
      title: "Fill your ISA allowance",
      description: "£20,000/yr tax-free — Stocks & Shares ISA for long-term growth.",
      completionHint: "Once you're contributing meaningfully toward the £20k allowance.",
      detailText: "Combined Cash + S&S + LISA + JISA allowance is £20k/yr. LISA also gets a 25% government bonus on the first £4k.",
      progress: d.hasISA ? 100 : 0,
      isComplete: d.hasISA,
      userAcknowledgeable: true,
      acknowledgeLabel: "I have an ISA",
    },
    {
      id: "uk-pension-pot",
      title: "Build your pension pot",
      description: "SIPP or additional Workplace contributions, marginal-rate tax relief.",
      completionHint: "Pension contributions on track for retirement.",
      detailText: "Higher/additional-rate taxpayers benefit most. Watch the £60k annual allowance.",
      progress: d.hasPension ? 100 : 0,
      isComplete: d.hasPension,
      userAcknowledgeable: true,
      acknowledgeLabel: "My pension is on track",
    },
  ];
}
```

The `InferredData` fields `hasIncomeAndExpenses`, `hasHighInterestDebt`, `emergencyMonthsCovered`, `contributingToEmployerMatch`, `hasISA`, `hasPension` already exist in `inferData`'s implementation (CA/US/AU re-use them). If `hasISA` or `hasPension` are not yet computed, add them to `inferData`:

```typescript
// In inferData(state, isRetired), after existing flags:
const hasISA = state.assets.some((a) => /isa/i.test(a.category));
const hasPension = state.assets.some((a) =>
  /sipp|workplace pension/i.test(a.category)
);
// ...
return { ..., hasISA, hasPension };
```

Update the `InferredData` interface in the same file to add `hasISA: boolean; hasPension: boolean;` if not already present.

Create `src/lib/countries/uk/flowchart-steps.ts`:

```typescript
import type { FlowchartStepsBuilder } from "@/lib/countries/types";
import { buildUKSteps, inferData } from "@/lib/flowchart-steps";

export const ukFlowchartSteps: FlowchartStepsBuilder = {
  build(state, isRetired) {
    return buildUKSteps(inferData(state, isRetired));
  },
};
```

Create `tests/unit/countries/uk/flowchart-steps.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukFlowchartSteps } from "@/lib/countries/uk/flowchart-steps";
import { INITIAL_STATE } from "@/lib/financial-types";

describe("UK flowchart steps", () => {
  it("builds at least 5 steps for a UK user", () => {
    const steps = ukFlowchartSteps.build(
      { ...INITIAL_STATE, country: "UK" as const, jurisdiction: "ENG" },
      false,
    );
    expect(steps.length).toBeGreaterThanOrEqual(5);
  });

  it("includes ISA and pension steps", () => {
    const steps = ukFlowchartSteps.build(
      { ...INITIAL_STATE, country: "UK" as const, jurisdiction: "ENG" },
      false,
    );
    expect(steps.find((s) => s.id === "uk-isa")).toBeDefined();
    expect(steps.find((s) => s.id === "uk-pension-pot")).toBeDefined();
  });
});
```

- [ ] **Step 4: Run tests + build**

Run: `npx vitest run tests/unit/countries/uk/ && npx tsc --noEmit`
Expected: green across rmd / benchmarks / flowchart-steps.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/uk/rmd.ts \
        src/lib/countries/uk/benchmarks.ts \
        src/lib/countries/uk/flowchart-steps.ts \
        src/lib/flowchart-steps.ts \
        tests/unit/countries/uk/rmd.test.ts \
        tests/unit/countries/uk/benchmarks.test.ts \
        tests/unit/countries/uk/flowchart-steps.test.ts
git commit -m "ralph: complete task 241 - UK rmd + benchmarks + flowchart-steps"
```

---

## Task 242: uk/tax-engine.ts — base income tax (rUK + Scotland bands + PA)

**Files:**
- Create: `src/lib/countries/uk/tax-engine.ts`
- Create: `tests/unit/countries/uk/tax-engine.base.test.ts`

**Context:** Task 242 lays down the file with a partial `TaxEngine` implementation: base income-tax computation, marginal-rate lookup, and category classification. PA taper, NI, Marriage Allowance, withdrawal tax, and bracket-segments come in Tasks 243–244. This task asserts the base bands are right for rUK and Scotland with **no taper, no NI, no Marriage Allowance** (zero adjustments).

- [ ] **Step 1: Write the base tests**

Create `tests/unit/countries/uk/tax-engine.base.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukTaxEngine } from "@/lib/countries/uk/tax-engine";

const ENG = "ENG";
const SCT = "SCT";

describe("UK tax engine — base income tax (no taper, no NI, no MA)", () => {
  it("returns zero for non-positive income", () => {
    const r = ukTaxEngine.computeTax(0, "employment", ENG, 2025);
    expect(r.totalTax).toBe(0);
    expect(r.effectiveRate).toBe(0);
  });

  it("rUK: £12,570 exactly is fully covered by PA → £0 tax", () => {
    const r = ukTaxEngine.computeTax(12_570, "employment", ENG, 2025);
    expect(r.totalTax).toBe(0);
  });

  it("rUK: £20,000 → 20% × (20,000 − 12,570) = £1,486", () => {
    const r = ukTaxEngine.computeTax(20_000, "employment", ENG, 2025);
    expect(r.totalTax).toBeCloseTo(1_486, 0);
  });

  it("rUK: £50,270 (top of basic) → 20% × 37,700 = £7,540", () => {
    const r = ukTaxEngine.computeTax(50_270, "employment", ENG, 2025);
    expect(r.totalTax).toBeCloseTo(7_540, 0);
  });

  it("rUK: £80,000 → 7,540 + 40% × (80,000 − 50,270) = £19,432", () => {
    const r = ukTaxEngine.computeTax(80_000, "employment", ENG, 2025);
    expect(r.totalTax).toBeCloseTo(19_432, 0);
  });

  it("Scotland: £15,397 (top of starter, above PA £2,827) → 19% × 2,827 = £537.13", () => {
    const r = ukTaxEngine.computeTax(15_397, "employment", SCT, 2025);
    expect(r.totalTax).toBeCloseTo(537.13, 1);
  });

  it("Scotland: marginal rate at £60,000 is 42% (Higher band)", () => {
    const rate = ukTaxEngine.getMarginalRate(60_000, SCT, 2025);
    expect(rate).toBeCloseTo(0.42, 4);
  });

  it("classifyTaxTreatment: SIPP and Workplace Pension are uk-pension (or tax-deferred fallback)", () => {
    // Task 242 uses 'tax-deferred'; Task 245 will change to 'uk-pension'.
    const t = ukTaxEngine.classifyTaxTreatment("SIPP");
    expect(["tax-deferred", "uk-pension"]).toContain(t);
  });

  it("classifyTaxTreatment: ISA family is tax-free", () => {
    expect(ukTaxEngine.classifyTaxTreatment("Cash ISA")).toBe("tax-free");
    expect(ukTaxEngine.classifyTaxTreatment("Stocks & Shares ISA")).toBe("tax-free");
    expect(ukTaxEngine.classifyTaxTreatment("Lifetime ISA")).toBe("tax-free");
    expect(ukTaxEngine.classifyTaxTreatment("Junior ISA")).toBe("tax-free");
    expect(ukTaxEngine.classifyTaxTreatment("Premium Bonds")).toBe("tax-free");
  });

  it("breakdown sums to totalTax", () => {
    const r = ukTaxEngine.computeTax(80_000, "employment", ENG, 2025);
    const sum = r.breakdown.reduce((acc, b) => acc + b.amount, 0);
    expect(sum).toBeCloseTo(r.totalTax, 1);
  });
});
```

- [ ] **Step 2: Write the source (partial TaxEngine)**

Create `src/lib/countries/uk/tax-engine.ts`:

```typescript
/**
 * UK TaxEngine implementation.
 *
 * Built up across Ralph tasks 242, 243, 244:
 *   242: base income-tax computation (rUK + Scotland bands), marginal rate,
 *        classifyTaxTreatment. No PA taper, no NI, no Marriage Allowance,
 *        no withdrawal-tax, no bracket segments.
 *   243: Personal Allowance taper (£100k–£125,140), Class 1 NI on employment
 *        income, Marriage Allowance integration via state.marriageAllowance.
 *   244: withdrawal-tax (SIPP 25% tax-free lump sum), CGT (annual exempt
 *        amount + 18/24% bands), early-withdrawal penalties (LISA, age-55
 *        pension lock), bracket-segments for the explainer.
 *
 * The legacy `src/lib/tax-engine.ts` shim delegates here via
 * `getCountry("UK").taxEngine.*` once Task 245 registers UK in the registry.
 */

import type {
  BracketSegmentArgs,
  BracketSegmentResult,
  TaxEngine,
  WithdrawalTaxArgs,
} from "@/lib/countries/types";
import type { IncomeType, TaxResult } from "@/lib/tax-engine";
import type {
  EarlyWithdrawalPenalty,
  TaxTreatment,
  WithdrawalTaxResult,
} from "@/lib/withdrawal-tax";
import {
  UK_PERSONAL_ALLOWANCE_2025,
  getUKIncomeTaxBands,
} from "./tax-tables";

function classifyUKTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  // ISA family + Premium Bonds: tax-free in and out.
  if (
    lower.includes("isa") ||
    lower === "lisa" ||
    lower === "jisa" ||
    lower.includes("premium bonds")
  ) {
    return "tax-free";
  }
  // SIPP / Workplace Pension: tax-deferred today (becomes "uk-pension" in Task 245).
  if (lower.includes("sipp") || lower.includes("workplace pension")) {
    return "tax-deferred";
  }
  return "taxable";
}

/**
 * Walk above-PA bands and return tax owed on `taxableAbovePA`.
 * Bands are stated as upper bound expressed in £ above the PA.
 */
function bandTax(taxableAbovePA: number, bands: ReturnType<typeof getUKIncomeTaxBands>): number {
  let tax = 0;
  let prevUpper = 0;
  for (const band of bands) {
    if (taxableAbovePA <= prevUpper) break;
    const inBand = Math.min(taxableAbovePA, band.upToAbovePA) - prevUpper;
    tax += inBand * band.rate;
    prevUpper = band.upToAbovePA;
    if (taxableAbovePA <= band.upToAbovePA) break;
  }
  return tax;
}

function marginalAbovePA(taxableAbovePA: number, bands: ReturnType<typeof getUKIncomeTaxBands>): number {
  for (const band of bands) {
    if (taxableAbovePA <= band.upToAbovePA) return band.rate;
  }
  return bands[bands.length - 1].rate;
}

function computeUKTax(
  annualIncome: number,
  type: IncomeType,
  jurisdiction: string,
  year: number,
): TaxResult {
  if (annualIncome <= 0) {
    return {
      totalTax: 0,
      effectiveRate: 0,
      afterTaxIncome: 0,
      marginalRate: 0,
      breakdown: [],
    };
  }

  // Capital gains have their own tax track (CGT) — handled in Task 244.
  // For now, treat CGT as 0 here so the base test passes for "employment".
  const bands = getUKIncomeTaxBands(jurisdiction, year);
  const effectivePA = UK_PERSONAL_ALLOWANCE_2025;  // Task 243 introduces taper + MA.
  const taxableAbovePA = Math.max(0, annualIncome - effectivePA);
  const incomeTax = bandTax(taxableAbovePA, bands);
  const marginalRate = marginalAbovePA(taxableAbovePA, bands);

  const totalTax = incomeTax;
  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    afterTaxIncome: annualIncome - totalTax,
    marginalRate,
    breakdown: [
      { label: "Income Tax", amount: incomeTax, kind: "income-tax" },
    ],
  };
}

function getUKMarginalRate(annualIncome: number, jurisdiction: string, year: number): number {
  if (annualIncome <= 0) return 0;
  return computeUKTax(annualIncome, "employment", jurisdiction, year).marginalRate;
}

// Stub — full implementation in Task 244.
function getUKWithdrawalTaxRate(_args: WithdrawalTaxArgs): WithdrawalTaxResult {
  return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 };
}

// Stub — full implementation in Task 244.
function getUKEarlyWithdrawalPenalties(_categories: string[], _age: number): EarlyWithdrawalPenalty[] {
  return [];
}

// Stub — full implementation in Task 244.
function computeUKBracketSegments(_args: BracketSegmentArgs): BracketSegmentResult {
  return {
    federalBrackets: [],
    regionalBrackets: [],
    federalBPA: UK_PERSONAL_ALLOWANCE_2025,
    regionalBPA: 0,
  };
}

export const ukTaxEngine: TaxEngine = {
  computeTax: computeUKTax,
  getMarginalRate: getUKMarginalRate,
  classifyTaxTreatment: classifyUKTaxTreatment,
  getWithdrawalTaxRate: getUKWithdrawalTaxRate,
  getEarlyWithdrawalPenalties: getUKEarlyWithdrawalPenalties,
  computeBracketSegments: computeUKBracketSegments,
};
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/tax-engine.base.test.ts && npx tsc --noEmit`
Expected: all green.

- [ ] **Step 4: Run full unit suite to confirm no regression**

Run: `npm test`
Expected: all green. Snapshot regression tests at `tests/unit/tax-engine-snapshot.test.ts` must still pass byte-identical (UK isn't in COUNTRIES yet, so the snapshot suite doesn't include it).

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/uk/tax-engine.ts tests/unit/countries/uk/tax-engine.base.test.ts
git commit -m "ralph: complete task 242 - UK tax engine base income tax (rUK + Scotland bands)"
```

---

## Task 243: uk/tax-engine.ts — PA taper + NI + Marriage Allowance

**Files:**
- Modify: `src/lib/countries/uk/tax-engine.ts`
- Create: `tests/unit/countries/uk/tax-engine.taper-ni-ma.test.ts`

**Context:** Extends `computeUKTax` to apply Personal Allowance taper (above £100k income), compute Class 1 employee NI on employment income, and incorporate a `marriageAllowance` adjustment. NI is surfaced as `kind: "social"` in the breakdown.

The `marriageAllowance` field is read from `FinancialState` — but `computeTax` only receives `(income, type, jurisdiction, year)`. We thread the optional `marriageAllowance` via a module-level setter that the upstream tax shim populates from the current `FinancialState` before calling. Alternative: add a 5th positional argument to `computeTax`. **We use the positional argument approach to avoid hidden mutable state** — see "Engine signature" note below.

**Engine signature note:** `TaxEngine.computeTax` interface signature is `(annualIncome, type, jurisdiction, year)`. We will not change the interface here (that would touch every country plugin). Instead, the Marriage Allowance arithmetic is exposed as a *separate exported helper* `applyMarriageAllowance(state, baseTax)` that callers can use after `computeTax` returns. The base PA taper still applies inside `computeTax` because it depends only on income.

For tests, we test the taper inside `computeTax`, NI via a new exported `computeUKNI(income, year)` helper, and Marriage Allowance via the exported `applyMarriageAllowance` helper.

- [ ] **Step 1: Write the tests**

Create `tests/unit/countries/uk/tax-engine.taper-ni-ma.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  ukTaxEngine,
  computeUKNI,
  applyMarriageAllowance,
} from "@/lib/countries/uk/tax-engine";

const ENG = "ENG";

describe("UK tax engine — PA taper", () => {
  it("no taper at £100,000 exactly", () => {
    const r = ukTaxEngine.computeTax(100_000, "employment", ENG, 2025);
    // £100k − £12,570 PA = £87,430 taxable: 20% × 37,700 + 40% × (87,430 − 37,700)
    // = 7,540 + 40% × 49,730 = 7,540 + 19,892 = £27,432
    expect(r.totalTax).toBeCloseTo(27_432, 0);
  });

  it("half taper at £110,000 → effective PA = £12,570 − £5,000 = £7,570", () => {
    const r = ukTaxEngine.computeTax(110_000, "employment", ENG, 2025);
    // taxable above PA = 110,000 − 7,570 = 102,430
    // 20% × 37,700 + 40% × (102,430 − 37,700) = 7,540 + 40% × 64,730 = 7,540 + 25,892 = £33,432
    expect(r.totalTax).toBeCloseTo(33_432, 0);
  });

  it("full taper at £125,140 → effective PA = £0", () => {
    const r = ukTaxEngine.computeTax(125_140, "employment", ENG, 2025);
    // taxable = full 125,140
    // 20% × 37,700 + 40% × (125,140 − 37,700) = 7,540 + 40% × 87,440 = 7,540 + 34,976 = £42,516
    expect(r.totalTax).toBeCloseTo(42_516, 0);
  });

  it("PA stays at zero above £125,140", () => {
    const r = ukTaxEngine.computeTax(150_000, "employment", ENG, 2025);
    // taxable = full 150,000. Bands: 20% × 37,700 = 7,540; 40% × (125,140 − 37,700) = 34,976;
    // 45% × (150,000 − 125,140) = 11,187. Total = 53,703.
    expect(r.totalTax).toBeCloseTo(53_703, 0);
  });
});

describe("UK tax engine — National Insurance (Class 1 employee)", () => {
  it("£12,570 exactly → £0 NI (Primary Threshold)", () => {
    expect(computeUKNI(12_570, 2025)).toBe(0);
  });

  it("£30,000 → 8% × (30,000 − 12,570) = £1,394.40", () => {
    expect(computeUKNI(30_000, 2025)).toBeCloseTo(1_394.40, 2);
  });

  it("£50,270 (UEL exactly) → 8% × (50,270 − 12,570) = £3,016", () => {
    expect(computeUKNI(50_270, 2025)).toBeCloseTo(3_016, 1);
  });

  it("£80,000 → 3,016 + 2% × (80,000 − 50,270) = £3,610.60", () => {
    expect(computeUKNI(80_000, 2025)).toBeCloseTo(3_610.60, 2);
  });
});

describe("UK tax engine — Marriage Allowance", () => {
  it("'claiming' raises PA by £1,260", () => {
    const baseline = ukTaxEngine.computeTax(20_000, "employment", ENG, 2025);
    const adjusted = applyMarriageAllowance(baseline, 20_000, "claiming", ENG, 2025);
    expect(adjusted.totalTax).toBeLessThan(baseline.totalTax);
    // £1,260 × 20% = £252 saving
    expect(baseline.totalTax - adjusted.totalTax).toBeCloseTo(252, 1);
  });

  it("'transferring' lowers PA by £1,260", () => {
    const baseline = ukTaxEngine.computeTax(20_000, "employment", ENG, 2025);
    const adjusted = applyMarriageAllowance(baseline, 20_000, "transferring", ENG, 2025);
    expect(adjusted.totalTax).toBeGreaterThan(baseline.totalTax);
    expect(adjusted.totalTax - baseline.totalTax).toBeCloseTo(252, 1);
  });

  it("'none' is a no-op", () => {
    const baseline = ukTaxEngine.computeTax(20_000, "employment", ENG, 2025);
    const adjusted = applyMarriageAllowance(baseline, 20_000, "none", ENG, 2025);
    expect(adjusted.totalTax).toBeCloseTo(baseline.totalTax, 2);
  });
});
```

- [ ] **Step 2: Update the source**

Replace `computeUKTax` and add `effectivePersonalAllowance`, `computeUKNI`, `applyMarriageAllowance` in `src/lib/countries/uk/tax-engine.ts`. The full file after Task 243:

```typescript
import type {
  BracketSegmentArgs,
  BracketSegmentResult,
  TaxEngine,
  WithdrawalTaxArgs,
} from "@/lib/countries/types";
import type { IncomeType, TaxResult } from "@/lib/tax-engine";
import type {
  EarlyWithdrawalPenalty,
  TaxTreatment,
  WithdrawalTaxResult,
} from "@/lib/withdrawal-tax";
import {
  UK_PA_TAPER_THRESHOLD,
  UK_PERSONAL_ALLOWANCE_2025,
  UK_MARRIAGE_ALLOWANCE_TRANSFER,
  getUKIncomeTaxBands,
  getUKNIBands,
} from "./tax-tables";

export type UKMarriageAllowance = "claiming" | "transferring" | "none";

function classifyUKTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  if (
    lower.includes("isa") ||
    lower === "lisa" ||
    lower === "jisa" ||
    lower.includes("premium bonds")
  ) {
    return "tax-free";
  }
  if (lower.includes("sipp") || lower.includes("workplace pension")) {
    return "tax-deferred";
  }
  return "taxable";
}

/**
 * Compute the effective Personal Allowance for a given gross income, applying
 * the £100k taper (£1 of PA lost per £2 over the threshold; fully phased out
 * at £100k + 2 × baseAllowance = £125,140 for the standard PA).
 */
export function effectivePersonalAllowance(grossIncome: number, baseAllowance: number = UK_PERSONAL_ALLOWANCE_2025): number {
  if (grossIncome <= UK_PA_TAPER_THRESHOLD) return baseAllowance;
  const reduction = Math.min(baseAllowance, (grossIncome - UK_PA_TAPER_THRESHOLD) / 2);
  return baseAllowance - reduction;
}

/** Class 1 employee National Insurance for `employmentIncome` and the given year. */
export function computeUKNI(employmentIncome: number, year: number): number {
  if (employmentIncome <= 0) return 0;
  const bands = getUKNIBands(year);
  let ni = 0;
  let prevUpper = 0;
  for (const band of bands) {
    if (employmentIncome <= prevUpper) break;
    const inBand = Math.min(employmentIncome, band.upTo) - prevUpper;
    ni += inBand * band.rate;
    prevUpper = band.upTo;
    if (employmentIncome <= band.upTo) break;
  }
  return ni;
}

function bandTax(taxableAbovePA: number, bands: ReturnType<typeof getUKIncomeTaxBands>): number {
  let tax = 0;
  let prevUpper = 0;
  for (const band of bands) {
    if (taxableAbovePA <= prevUpper) break;
    const inBand = Math.min(taxableAbovePA, band.upToAbovePA) - prevUpper;
    tax += inBand * band.rate;
    prevUpper = band.upToAbovePA;
    if (taxableAbovePA <= band.upToAbovePA) break;
  }
  return tax;
}

function marginalAbovePA(taxableAbovePA: number, bands: ReturnType<typeof getUKIncomeTaxBands>): number {
  for (const band of bands) {
    if (taxableAbovePA <= band.upToAbovePA) return band.rate;
  }
  return bands[bands.length - 1].rate;
}

function computeUKTax(
  annualIncome: number,
  type: IncomeType,
  jurisdiction: string,
  year: number,
): TaxResult {
  if (annualIncome <= 0) {
    return {
      totalTax: 0,
      effectiveRate: 0,
      afterTaxIncome: 0,
      marginalRate: 0,
      breakdown: [],
    };
  }

  const bands = getUKIncomeTaxBands(jurisdiction, year);
  const effPA = effectivePersonalAllowance(annualIncome);
  const taxableAbovePA = Math.max(0, annualIncome - effPA);

  const incomeTax = bandTax(taxableAbovePA, bands);

  // NI applies only to employment income; capital-gains / other types skip it.
  const ni = type === "employment" ? computeUKNI(annualIncome, year) : 0;

  const totalTax = incomeTax + ni;
  const marginalRate = marginalAbovePA(taxableAbovePA, bands)
    + (type === "employment" && annualIncome > 50_270 ? 0.02
       : type === "employment" && annualIncome > 12_570 ? 0.08 : 0);

  const breakdown = [
    { label: "Income Tax", amount: incomeTax, kind: "income-tax" as const },
  ];
  if (ni > 0) {
    breakdown.push({ label: "National Insurance", amount: ni, kind: "social" as const });
  }

  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    afterTaxIncome: annualIncome - totalTax,
    marginalRate,
    breakdown,
  };
}

/**
 * Adjust a baseline `TaxResult` for a Marriage Allowance election.
 * 'claiming' raises PA by £1,260; 'transferring' lowers PA by £1,260; 'none' is a no-op.
 * Recomputes income tax under the adjusted PA; NI is unaffected.
 */
export function applyMarriageAllowance(
  baseline: TaxResult,
  grossIncome: number,
  election: UKMarriageAllowance,
  jurisdiction: string,
  year: number,
): TaxResult {
  if (election === "none" || grossIncome <= 0) return baseline;

  const baseAllowance = election === "claiming"
    ? UK_PERSONAL_ALLOWANCE_2025 + UK_MARRIAGE_ALLOWANCE_TRANSFER
    : UK_PERSONAL_ALLOWANCE_2025 - UK_MARRIAGE_ALLOWANCE_TRANSFER;

  const effPA = effectivePersonalAllowance(grossIncome, baseAllowance);
  const bands = getUKIncomeTaxBands(jurisdiction, year);
  const taxableAbovePA = Math.max(0, grossIncome - effPA);
  const adjustedIncomeTax = bandTax(taxableAbovePA, bands);

  // Reconstruct breakdown: keep NI line (if any) untouched, replace Income Tax.
  const ni = baseline.breakdown.find((b) => b.kind === "social")?.amount ?? 0;
  const adjustedTotal = adjustedIncomeTax + ni;
  const newBreakdown = [
    { label: "Income Tax", amount: adjustedIncomeTax, kind: "income-tax" as const },
  ];
  if (ni > 0) {
    newBreakdown.push({ label: "National Insurance", amount: ni, kind: "social" as const });
  }

  return {
    totalTax: adjustedTotal,
    effectiveRate: grossIncome > 0 ? adjustedTotal / grossIncome : 0,
    afterTaxIncome: grossIncome - adjustedTotal,
    marginalRate: baseline.marginalRate,
    breakdown: newBreakdown,
  };
}

function getUKMarginalRate(annualIncome: number, jurisdiction: string, year: number): number {
  if (annualIncome <= 0) return 0;
  return computeUKTax(annualIncome, "employment", jurisdiction, year).marginalRate;
}

// Stub — full implementation in Task 244.
function getUKWithdrawalTaxRate(_args: WithdrawalTaxArgs): WithdrawalTaxResult {
  return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 };
}

function getUKEarlyWithdrawalPenalties(_categories: string[], _age: number): EarlyWithdrawalPenalty[] {
  return [];
}

function computeUKBracketSegments(_args: BracketSegmentArgs): BracketSegmentResult {
  return {
    federalBrackets: [],
    regionalBrackets: [],
    federalBPA: UK_PERSONAL_ALLOWANCE_2025,
    regionalBPA: 0,
  };
}

export const ukTaxEngine: TaxEngine = {
  computeTax: computeUKTax,
  getMarginalRate: getUKMarginalRate,
  classifyTaxTreatment: classifyUKTaxTreatment,
  getWithdrawalTaxRate: getUKWithdrawalTaxRate,
  getEarlyWithdrawalPenalties: getUKEarlyWithdrawalPenalties,
  computeBracketSegments: computeUKBracketSegments,
};
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/ && npx tsc --noEmit && npm run lint`
Expected: all green, including the Task 242 base tests (which now also account for NI on employment income — but the base tests used "employment" income type, so the NI line will appear. **The Task 242 base test for £80,000 expected £19,432 — but after Task 243, NI is added.** Update the Task 242 tests to expect NI in the breakdown.)

**Important amendment:** When Task 243 lands, Task 242's `tests/unit/countries/uk/tax-engine.base.test.ts` will start failing for employment income (£20k, £50.27k, £80k cases) because NI is now in `totalTax`. As part of Task 243 step 3, update those numeric expectations:

```typescript
// £20,000 employment: income tax £1,486 + NI £594.40 = £2,080.40
it("rUK: £20,000 → income tax £1,486 + NI £594 = £2,080", () => {
  const r = ukTaxEngine.computeTax(20_000, "employment", ENG, 2025);
  expect(r.totalTax).toBeCloseTo(2_080.40, 1);
});

// £50,270 employment: income tax £7,540 + NI £3,016 = £10,556
it("rUK: £50,270 → income tax £7,540 + NI £3,016 = £10,556", () => {
  const r = ukTaxEngine.computeTax(50_270, "employment", ENG, 2025);
  expect(r.totalTax).toBeCloseTo(10_556, 1);
});

// £80,000 employment: income tax £19,432 + NI £3,610.60 = £23,042.60
it("rUK: £80,000 → income tax £19,432 + NI £3,610.60 = £23,042.60", () => {
  const r = ukTaxEngine.computeTax(80_000, "employment", ENG, 2025);
  expect(r.totalTax).toBeCloseTo(23_042.60, 1);
});
```

Alternatively, the Task 242 tests can use `type: "other"` (which doesn't trigger NI) so they remain valid after Task 243. **Adopt the "other" approach** to avoid editing prior-task tests:

Update Task 242's test file in this task to switch numeric assertions to `type: "other"` for the pure-income-tax cases. The `"employment"` cases stay only where they're testing NI explicitly.

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/uk/tax-engine.ts tests/unit/countries/uk/tax-engine.base.test.ts tests/unit/countries/uk/tax-engine.taper-ni-ma.test.ts
git commit -m "ralph: complete task 243 - UK tax engine PA taper + NI + Marriage Allowance"
```

---

## Task 244: uk/tax-engine.ts — withdrawal tax + CGT + bracket segments

**Files:**
- Modify: `src/lib/countries/uk/tax-engine.ts`
- Create: `tests/unit/countries/uk/tax-engine.withdrawal-cgt.test.ts`

**Context:** Replaces the three stubs (`getUKWithdrawalTaxRate`, `getUKEarlyWithdrawalPenalties`, `computeUKBracketSegments`) with real implementations.

**Withdrawal tax for SIPP / Workplace Pension:** 25% tax-free lump sum, 75% taxed at marginal rate (the income-tax rate at the withdrawal level, ignoring NI — NI doesn't apply to pension drawdown).

**CGT for capital-gains type:** annual exempt amount of £3,000, 18% on gain within basic-rate band, 24% above. Implemented inside `computeUKTax` when `type === "capital-gains"`.

**Early-withdrawal penalties:** LISA 25% before 60 (unless first-home / terminal illness); SIPP / Workplace Pension locked before age 55.

**Bracket segments:** maps UK math to `BracketSegmentResult`. `federalBrackets` = income-tax bands rendered as absolute ranges using effective PA; `regionalBrackets` = NI bands. `federalBPA` = effective PA; `regionalBPA` = NI Primary Threshold (£12,570).

- [ ] **Step 1: Write the tests**

Create `tests/unit/countries/uk/tax-engine.withdrawal-cgt.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { ukTaxEngine } from "@/lib/countries/uk/tax-engine";

const ENG = "ENG";

describe("UK withdrawal tax (SIPP / Workplace Pension)", () => {
  it("£40,000 SIPP withdrawal: 25% tax-free + 75% at marginal rate", () => {
    const result = ukTaxEngine.getWithdrawalTaxRate({
      category: "SIPP",
      jurisdiction: ENG,
      annualWithdrawal: 40_000,
      year: 2025,
    });
    // 25% lump sum = £10,000 tax-free. Taxable = £30,000.
    // Tax on £30k as standalone income: (30,000 − 12,570) × 20% = £3,486
    // Effective rate over the full £40k = 3,486 / 40,000 ≈ 8.7%
    expect(result.taxFreeAmount).toBeCloseTo(10_000, 0);
    expect(result.taxableAmount).toBeCloseTo(30_000, 0);
    expect(result.effectiveRate).toBeCloseTo(3_486 / 40_000, 3);
  });

  it("ISA withdrawal is tax-free", () => {
    const result = ukTaxEngine.getWithdrawalTaxRate({
      category: "Stocks & Shares ISA",
      jurisdiction: ENG,
      annualWithdrawal: 25_000,
      year: 2025,
    });
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBeCloseTo(25_000, 1);
    expect(result.taxableAmount).toBe(0);
  });

  it("Brokerage uses standard taxable arm (cost basis + gain)", () => {
    const result = ukTaxEngine.getWithdrawalTaxRate({
      category: "Brokerage",
      jurisdiction: ENG,
      annualWithdrawal: 20_000,
      costBasisPercent: 50,
      year: 2025,
    });
    expect(result.taxFreeAmount).toBeCloseTo(10_000, 0);
    expect(result.taxableAmount).toBeCloseTo(10_000, 0);
  });
});

describe("UK CGT", () => {
  it("Capital gains: £5,000 → first £3,000 exempt, £2,000 at 18% = £360", () => {
    const r = ukTaxEngine.computeTax(5_000, "capital-gains", ENG, 2025);
    expect(r.totalTax).toBeCloseTo(360, 0);
  });

  it("Capital gains: £50,000 → all within basic band → (50,000 − 3,000) × 18% = £8,460", () => {
    const r = ukTaxEngine.computeTax(50_000, "capital-gains", ENG, 2025);
    expect(r.totalTax).toBeCloseTo(8_460, 0);
  });
});

describe("UK early-withdrawal penalties", () => {
  it("Age 30 with LISA → 25% penalty before 60", () => {
    const penalties = ukTaxEngine.getEarlyWithdrawalPenalties(["Lifetime ISA"], 30);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].penaltyPercent).toBeCloseTo(0.25, 4);
    expect(penalties[0].penaltyFreeAge).toBe(60);
  });

  it("Age 50 with SIPP → cannot access before 55", () => {
    const penalties = ukTaxEngine.getEarlyWithdrawalPenalties(["SIPP"], 50);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].penaltyFreeAge).toBe(55);
  });

  it("Age 65 with SIPP and LISA → no penalties", () => {
    const penalties = ukTaxEngine.getEarlyWithdrawalPenalties(["SIPP", "Lifetime ISA"], 65);
    expect(penalties).toHaveLength(0);
  });
});

describe("UK bracket segments", () => {
  it("rUK £80,000 → federalBrackets has 3 absolute bands with PA at start", () => {
    const result = ukTaxEngine.computeBracketSegments({
      jurisdiction: ENG, year: 2025, grossAnnualIncome: 80_000, capGainsTotal: 0,
    });
    expect(result.federalBPA).toBe(12_570);
    expect(result.federalBrackets.length).toBeGreaterThanOrEqual(2);
    const sumOfBracketTax = result.federalBrackets.reduce((acc, b) => acc + b.taxInBracket, 0);
    expect(sumOfBracketTax).toBeCloseTo(19_432, 0);
  });
});
```

- [ ] **Step 2: Replace stubs with real implementations**

Update `src/lib/countries/uk/tax-engine.ts`. Add imports for `UK_CGT_2025`, `UK_PENSION_ACCESS_AGE`, `UK_LISA_ACCESS_AGE` from `./tax-tables`. Replace the three stub functions and extend `computeUKTax` to handle `type === "capital-gains"`:

```typescript
// Replace the import block at the top to add the new constants:
import {
  UK_PA_TAPER_THRESHOLD,
  UK_PERSONAL_ALLOWANCE_2025,
  UK_MARRIAGE_ALLOWANCE_TRANSFER,
  UK_CGT_2025,
  UK_PENSION_ACCESS_AGE,
  UK_LISA_ACCESS_AGE,
  getUKIncomeTaxBands,
  getUKNIBands,
} from "./tax-tables";
```

Add a CGT helper:

```typescript
function computeUKCGT(gain: number): number {
  if (gain <= 0) return 0;
  const { annualExemptAmount, basicRate, higherRate } = UK_CGT_2025;
  const taxable = Math.max(0, gain - annualExemptAmount);
  // For simplicity (and matching how AU's CGT pairs with main income), apply
  // basic rate up to the rUK basic-rate band cap (£37,700) and higher above.
  const basicCap = 37_700;
  const inBasic = Math.min(taxable, basicCap);
  const inHigher = Math.max(0, taxable - basicCap);
  return inBasic * basicRate + inHigher * higherRate;
}
```

Modify `computeUKTax` to branch on `type === "capital-gains"`:

```typescript
function computeUKTax(
  annualIncome: number,
  type: IncomeType,
  jurisdiction: string,
  year: number,
): TaxResult {
  if (annualIncome <= 0) {
    return { totalTax: 0, effectiveRate: 0, afterTaxIncome: 0, marginalRate: 0, breakdown: [] };
  }

  if (type === "capital-gains") {
    const cgt = computeUKCGT(annualIncome);
    const marginal = annualIncome > 37_700 + UK_CGT_2025.annualExemptAmount
      ? UK_CGT_2025.higherRate : UK_CGT_2025.basicRate;
    return {
      totalTax: cgt,
      effectiveRate: annualIncome > 0 ? cgt / annualIncome : 0,
      afterTaxIncome: annualIncome - cgt,
      marginalRate: marginal,
      breakdown: [{ label: "Capital Gains Tax", amount: cgt, kind: "income-tax" }],
    };
  }

  // Income-tax path (employment + "other")
  const bands = getUKIncomeTaxBands(jurisdiction, year);
  const effPA = effectivePersonalAllowance(annualIncome);
  const taxableAbovePA = Math.max(0, annualIncome - effPA);
  const incomeTax = bandTax(taxableAbovePA, bands);
  const ni = type === "employment" ? computeUKNI(annualIncome, year) : 0;
  const totalTax = incomeTax + ni;

  const marginalIT = marginalAbovePA(taxableAbovePA, bands);
  const marginalNI = type === "employment" && annualIncome > 50_270 ? 0.02
    : type === "employment" && annualIncome > 12_570 ? 0.08 : 0;

  const breakdown = [{ label: "Income Tax", amount: incomeTax, kind: "income-tax" as const }];
  if (ni > 0) breakdown.push({ label: "National Insurance", amount: ni, kind: "social" as const });

  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    afterTaxIncome: annualIncome - totalTax,
    marginalRate: marginalIT + marginalNI,
    breakdown,
  };
}
```

Replace the withdrawal-tax stub with:

```typescript
function getUKWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult {
  const { category, jurisdiction, annualWithdrawal, costBasisPercent = 100, roiTaxTreatment, year = 2025 } = args;
  if (annualWithdrawal <= 0) {
    return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 };
  }

  const treatment = classifyUKTaxTreatment(category);

  switch (treatment) {
    case "tax-free":
      return { effectiveRate: 0, taxFreeAmount: annualWithdrawal, taxableAmount: 0 };

    case "tax-deferred": {
      // UK pension: 25% tax-free lump sum, 75% taxed as income (no NI on pension drawdown).
      const lumpSum = annualWithdrawal * 0.25;
      const taxablePortion = annualWithdrawal - lumpSum;
      // Tax the taxable portion as standalone "other" income (no NI).
      const taxOnPortion = computeUKTax(taxablePortion, "other", jurisdiction, year).totalTax;
      return {
        effectiveRate: annualWithdrawal > 0 ? taxOnPortion / annualWithdrawal : 0,
        taxFreeAmount: lumpSum,
        taxableAmount: taxablePortion,
      };
    }

    case "taxable": {
      const clampedBasis = Math.max(0, Math.min(100, costBasisPercent));
      const gainsPercent = (100 - clampedBasis) / 100;
      const gainsAmount = annualWithdrawal * gainsPercent;
      const costBasisAmount = annualWithdrawal - gainsAmount;
      if (gainsAmount <= 0) {
        return { effectiveRate: 0, taxFreeAmount: annualWithdrawal, taxableAmount: 0 };
      }
      const incomeType: IncomeType = roiTaxTreatment === "income" ? "other" : "capital-gains";
      const taxResult = computeUKTax(gainsAmount, incomeType, jurisdiction, year);
      return {
        effectiveRate: annualWithdrawal > 0 ? taxResult.totalTax / annualWithdrawal : 0,
        taxFreeAmount: costBasisAmount,
        taxableAmount: gainsAmount,
      };
    }

    default:
      // Defensive — unreachable for current TaxTreatment union, but every value
      // (super-accumulation, super-fhss) returns benign zero result.
      return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: annualWithdrawal };
  }
}
```

Replace the early-withdrawal penalties stub:

```typescript
function getUKEarlyWithdrawalPenalties(categories: string[], age: number): EarlyWithdrawalPenalty[] {
  if (age === undefined || age <= 0) return [];
  const out: EarlyWithdrawalPenalty[] = [];
  for (const cat of categories) {
    const lower = cat.toLowerCase();
    if ((lower.includes("sipp") || lower.includes("workplace pension")) && age < UK_PENSION_ACCESS_AGE) {
      out.push({
        category: cat,
        penaltyPercent: 0,
        penaltyFreeAge: UK_PENSION_ACCESS_AGE,
        rule: `Pension cannot be accessed before age ${UK_PENSION_ACCESS_AGE} (rises to 57 in 2028)`,
      });
    }
    if (lower.includes("lifetime isa") && age < UK_LISA_ACCESS_AGE) {
      out.push({
        category: cat,
        penaltyPercent: 0.25,
        penaltyFreeAge: UK_LISA_ACCESS_AGE,
        rule: "LISA withdrawals before age 60 incur a 25% penalty (unless used for first home purchase)",
      });
    }
  }
  return out;
}
```

Replace the bracket-segments stub:

```typescript
function computeUKBracketSegments(args: BracketSegmentArgs): BracketSegmentResult {
  const { jurisdiction, year, grossAnnualIncome } = args;
  const effPA = effectivePersonalAllowance(grossAnnualIncome);
  const incomeBands = getUKIncomeTaxBands(jurisdiction, year);
  const niBands = getUKNIBands(year);

  // Convert above-PA bands into absolute TaxBracketSegment[] for the explainer.
  const federalBrackets = [];
  let prevAbs = effPA;
  let prevAbovePA = 0;
  const taxableAbovePA = Math.max(0, grossAnnualIncome - effPA);
  for (const band of incomeBands) {
    const upperAbs = band.upToAbovePA === Infinity ? Infinity : effPA + band.upToAbovePA;
    const amountInBracket = Math.max(0, Math.min(taxableAbovePA, band.upToAbovePA) - prevAbovePA);
    federalBrackets.push({
      min: prevAbs,
      max: upperAbs,
      rate: band.rate,
      amountInBracket,
      taxInBracket: amountInBracket * band.rate,
    });
    prevAbs = upperAbs;
    prevAbovePA = band.upToAbovePA;
  }

  // NI bands rendered as absolute ranges; amounts populated against gross income.
  const regionalBrackets = [];
  let prevNIBound = 0;
  for (const band of niBands) {
    const upper = band.upTo;
    const amountInBracket = Math.max(0, Math.min(grossAnnualIncome, upper) - prevNIBound);
    regionalBrackets.push({
      min: prevNIBound,
      max: upper,
      rate: band.rate,
      amountInBracket,
      taxInBracket: amountInBracket * band.rate,
    });
    prevNIBound = upper;
  }

  return {
    federalBrackets,
    regionalBrackets,
    federalBPA: effPA,
    regionalBPA: 12_570,  // NI Primary Threshold
  };
}
```

- [ ] **Step 3: Verify**

Run: `npx vitest run tests/unit/countries/uk/ && npx tsc --noEmit && npm run lint`
Expected: all green.

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/uk/tax-engine.ts tests/unit/countries/uk/tax-engine.withdrawal-cgt.test.ts
git commit -m "ralph: complete task 244 - UK tax engine withdrawal tax + CGT + bracket segments"
```

---

## Task 245: WIRE-UP — extend unions, add uk/index.ts, register in COUNTRIES

**Files:**
- Modify: `src/lib/countries/types.ts`
- Modify: `src/lib/currency.ts`
- Modify: `src/lib/withdrawal-tax.ts`
- Modify: `src/lib/financial-types.ts`
- Modify: `src/lib/countries/index.ts`
- Create: `src/lib/countries/uk/index.ts`
- Modify: `src/lib/countries/uk/tax-engine.ts` (`classifyUKTaxTreatment` returns `"uk-pension"` for SIPP / Workplace Pension)

**Context:** This is the atomic flip. After this task lands, UK is live everywhere because `getRegisteredCountries()` will include it, and the type unions accept `"UK"` / `"GBP"` / `"en-GB"` / `"uk-pension"`.

- [ ] **Step 1: Extend `CountryCode` in `src/lib/countries/types.ts`**

Find line 16:
```typescript
export type CountryCode = "CA" | "US" | "AU";
```

Replace with:
```typescript
export type CountryCode = "CA" | "US" | "AU" | "UK";
```

- [ ] **Step 2: Extend `SupportedCurrency` and `Locale` + FX rates in `src/lib/currency.ts`**

Find line 1:
```typescript
export type SupportedCurrency = "CAD" | "USD" | "AUD";
```

Replace with:
```typescript
export type SupportedCurrency = "CAD" | "USD" | "AUD" | "GBP";
```

Find `getHomeCurrency` (line 10) and extend the country union and switch:

```typescript
export function getHomeCurrency(country: "CA" | "US" | "AU" | "UK"): SupportedCurrency {
  switch (country) {
    case "CA": return "CAD";
    case "US": return "USD";
    case "AU": return "AUD";
    case "UK": return "GBP";
  }
}
```

Find the `symbolMap` (line 95) and add GBP:
```typescript
const symbolMap: Record<SupportedCurrency, string> = { CAD: "CA$", USD: "US$", AUD: "AU$", GBP: "£" };
```

Find `FALLBACK_RATES` (line 30) and add GBP fallback rates. Approximate mid-2025 rates (verify at deploy time):

```typescript
export const FALLBACK_RATES: FxRates = {
  // ... existing CAD/USD/AUD pairs preserved exactly ...
  "GBP/CAD": 1.74,
  "CAD/GBP": 0.575,
  "GBP/USD": 1.27,
  "USD/GBP": 0.787,
  "GBP/AUD": 1.94,
  "AUD/GBP": 0.515,
};
```

(Locale already includes `"en-GB"` — see existing definition at line 2 of currency.ts. No change needed.)

- [ ] **Step 3: Extend `TaxTreatment` and `classifyTaxTreatment` shim in `src/lib/withdrawal-tax.ts`**

Find line 12:
```typescript
export type TaxTreatment = "tax-free" | "tax-deferred" | "taxable" | "super-accumulation" | "super-fhss";
```

Replace with:
```typescript
export type TaxTreatment = "tax-free" | "tax-deferred" | "taxable" | "super-accumulation" | "super-fhss" | "uk-pension";
```

Find `classifyTaxTreatment` (line 39) and add UK pension detection at the top:
```typescript
export function classifyTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  if (lower.includes("sipp") || lower.includes("workplace pension")) return "uk-pension";
  // ... rest of existing function unchanged ...
}
```

Find any `switch (treatment)` on `TaxTreatment` in this file (and in other `src/lib/` consumers that switch on it). Add a `case "uk-pension":` arm that delegates to the UK engine's withdrawal-tax path. If `withdrawal-tax.ts` was already shimmed in Phase A (task 223), the dispatch goes through `getCountry(country).taxEngine.getWithdrawalTaxRate` and no per-treatment switch exists here — verify before editing.

Run: `grep -n 'TaxTreatment\|case "tax-free"\|case "tax-deferred"' src/lib/withdrawal-tax.ts`
Expected: see what arms exist; add `"uk-pension"` only where the file still has a treatment-level switch.

- [ ] **Step 4: Extend `FinancialState` in `src/lib/financial-types.ts`**

Find line 29:
```typescript
  country?: "CA" | "US" | "AU";
```

Replace with:
```typescript
  country?: "CA" | "US" | "AU" | "UK";
```

Find the `GovernmentRetirementIncome` interface (line 11) and add the UK field:
```typescript
export interface GovernmentRetirementIncome {
  cppMonthly?: number;
  oasMonthly?: number;
  ssMonthly?: number;
  agePensionFortnightly?: number;
  /** UK State Pension weekly amount (£/wk). */
  statePensionWeekly?: number;
}
```

Add the Marriage Allowance field to `FinancialState`. Insert after `taxYear?: number;` (line 39):
```typescript
  /** UK only — Marriage Allowance election. Default: "none". */
  marriageAllowance?: "claiming" | "transferring" | "none";
```

- [ ] **Step 5: Promote SIPP / Workplace Pension classification to "uk-pension" in `src/lib/countries/uk/tax-engine.ts`**

Find `classifyUKTaxTreatment` and update the pension branch:

```typescript
function classifyUKTaxTreatment(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  if (lower.includes("isa") || lower === "lisa" || lower === "jisa" || lower.includes("premium bonds")) {
    return "tax-free";
  }
  if (lower.includes("sipp") || lower.includes("workplace pension")) {
    return "uk-pension";
  }
  return "taxable";
}
```

Also update `getUKWithdrawalTaxRate` so the `switch (treatment)` arm for pensions catches `"uk-pension"` (rename `case "tax-deferred":` to `case "uk-pension":`):

```typescript
switch (treatment) {
  case "tax-free":
    return { effectiveRate: 0, taxFreeAmount: annualWithdrawal, taxableAmount: 0 };

  case "uk-pension": {
    // ... existing 25% lump-sum logic ...
  }

  case "taxable": {
    // ... existing ...
  }

  default:
    return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: annualWithdrawal };
}
```

- [ ] **Step 6: Create `src/lib/countries/uk/index.ts`**

```typescript
import type { CountryProfile } from "@/lib/countries/types";
import { ukTaxEngine } from "./tax-engine";
import { ukVehicles } from "./vehicles";
import { ukGovernmentRetirement } from "./government-retirement";
import { ukTaxCredits } from "./tax-credits";
import { ukProfiles } from "./sample-profiles";
import { ukInsights } from "./insights";
import { ukRmd } from "./rmd";
import { ukBenchmarks } from "./benchmarks";
import { ukFlowchartSteps } from "./flowchart-steps";

export const UK_COUNTRY: CountryProfile = {
  code: "UK",
  displayName: "United Kingdom",
  shortLabel: "UK",
  flagEmoji: "🇬🇧",
  homeCurrency: "GBP",
  locale: "en-GB",
  jurisdictions: [
    { code: "ENG", name: "England" },
    { code: "WAL", name: "Wales" },
    { code: "NIR", name: "Northern Ireland" },
    { code: "SCT", name: "Scotland" },
  ],
  defaultJurisdiction: "ENG",
  filingStatuses: [
    { value: "single", label: "Single" },
    { value: "married-civil-partnership", label: "Married / Civil Partnership" },
  ],
  defaultFilingStatus: "single",
  taxYearLabel: (year) => `${year}/${String(year + 1).slice(2)}`,
  taxYearBoundary: { startMonth: 4, startDay: 6 },
  taxEngine: ukTaxEngine,
  vehicles: ukVehicles,
  governmentRetirement: ukGovernmentRetirement,
  taxCredits: ukTaxCredits,
  profiles: ukProfiles,
  insights: ukInsights,
  rmd: ukRmd,
  benchmarks: ukBenchmarks,
  flowchartSteps: ukFlowchartSteps,
  wizardRegisteredCategories: ["Stocks & Shares ISA", "SIPP"],
  flowchartWiki: {
    tipName: "r/UKPersonalFinance",
    linkText: "r/UKPersonalFinance flowchart",
    linkUrl: "https://ukpersonal.finance/flowchart/",
  },
  regionTaxLabel: "Region",
};
```

**Filing status note:** `"married-civil-partnership"` must exist in the `FilingStatus` union in `src/lib/tax-credits.ts`. If it doesn't, extend it there:

```typescript
export type FilingStatus =
  | "single"
  | "married-jointly"
  | "married-separately"
  | "head-of-household"
  | "married-de-facto"
  | "married-civil-partnership";
```

- [ ] **Step 7: Register UK in `src/lib/countries/index.ts`**

Find lines 1–4:
```typescript
import { CANADA } from "./canada";
import { USA } from "./usa";
import { AUSTRALIA } from "./australia";
```

Add the UK import:
```typescript
import { UK_COUNTRY } from "./uk";
```

Find the `COUNTRIES` record (lines 11–15) and add the UK getter:
```typescript
export const COUNTRIES: Record<CountryCode, CountryProfile> = {
  get CA() { return CANADA; },
  get US() { return USA; },
  get AU() { return AUSTRALIA; },
  get UK() { return UK_COUNTRY; },
} as Record<CountryCode, CountryProfile>;
```

- [ ] **Step 8: Remove any `@ts-expect-error` markers added in Tasks 237/239/240**

`grep -rn '@ts-expect-error -- statePensionWeekly\|@ts-expect-error -- country: "UK"' src/ tests/` and delete each match.

- [ ] **Step 9: Update the Phase A snapshot regression matrix to include UK**

Find `tests/unit/tax-engine-snapshot.test.ts` and add UK combos to the `COMBOS` array:

```typescript
const COMBOS: Array<[("CA" | "US" | "AU" | "UK"), string]> = [
  ["CA", "ON"], ["CA", "AB"], ["CA", "BC"], ["CA", "QC"],
  ["US", "CA"], ["US", "TX"], ["US", "NY"], ["US", "FL"],
  ["AU", "NSW"], ["AU", "VIC"], ["AU", "QLD"],
  ["UK", "ENG"], ["UK", "SCT"], ["UK", "WAL"], ["UK", "NIR"],
];
```

Do the same for `tests/unit/withdrawal-tax-snapshot.test.ts` — add a UK entry to `CATEGORIES_BY_COUNTRY`:

```typescript
const CATEGORIES_BY_COUNTRY: Record<"CA" | "US" | "AU" | "UK", string[]> = {
  CA: ["TFSA", "RRSP", "RESP", "FHSA", "LIRA", "Savings Account", "Brokerage"],
  US: ["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA", "Brokerage"],
  AU: ["Super (Accumulation)", "Super (Pension Phase)", "First Home Super Saver", "Brokerage"],
  UK: ["Cash ISA", "Stocks & Shares ISA", "Lifetime ISA", "Junior ISA", "SIPP", "Workplace Pension", "Brokerage"],
};
```

Run with `-u` to capture UK baselines:

```bash
npx vitest run tests/unit/tax-engine-snapshot.test.ts tests/unit/withdrawal-tax-snapshot.test.ts -u
```

**Important:** verify the CA/US/AU snapshots are unchanged byte-for-byte (the refactor invariant). Only new UK lines should appear. If any pre-existing snapshot lines changed, investigate before committing.

Run `git diff tests/unit/__snapshots__/` and confirm only additions in CA/US/AU sections, with UK additions appended.

- [ ] **Step 10: Full verification**

```bash
npm test
npx tsc --noEmit
npm run lint
```

All three must be green. The plugin contract tests (`tests/unit/countries/contract.test.ts`) now run UK through every assertion automatically.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "ralph: complete task 245 - wire UK into registry (unions, FX, financial-state, index.ts)"
```

---

## Task 246: UK-specific unit tests (cross-cutting suite from the spec)

**Files:**
- Create: `tests/unit/countries/uk/uk-spec-coverage.test.ts`

**Context:** The spec lists a Testing → UK-specific unit tests section. Tasks 235–244 covered the per-file T1 layer; this task adds the spec's named scenarios as one cohesive suite, so the regression surface stays explicit and easy to audit.

- [ ] **Step 1: Write the suite**

Create `tests/unit/countries/uk/uk-spec-coverage.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getCountry } from "@/lib/countries";
import { ukTaxEngine, applyMarriageAllowance, computeUKNI, effectivePersonalAllowance } from "@/lib/countries/uk/tax-engine";
import { weeklyToMonthly, UK_STATE_PENSION_FULL_NEW_WEEKLY } from "@/lib/countries/uk/government-retirement";

describe("UK spec coverage — rUK bracket boundaries", () => {
  it("£12,570 exactly → zero tax (top of PA)", () => {
    expect(ukTaxEngine.computeTax(12_570, "other", "ENG", 2025).totalTax).toBe(0);
  });
  it("£50,270 → top of basic band (above PA: £37,700)", () => {
    expect(ukTaxEngine.computeTax(50_270, "other", "ENG", 2025).totalTax).toBeCloseTo(7_540, 0);
  });
  it("£125,140 → top of higher band (PA fully tapered)", () => {
    expect(ukTaxEngine.computeTax(125_140, "other", "ENG", 2025).totalTax).toBeCloseTo(42_516, 0);
  });
});

describe("UK spec coverage — Scotland bracket boundaries", () => {
  it("£15,397 → top of starter band", () => {
    expect(ukTaxEngine.computeTax(15_397, "other", "SCT", 2025).totalTax).toBeCloseTo(537.13, 1);
  });
  it("£27,491 → top of basic band", () => {
    // (£14,921 − £2,827) × 20% + (£2,827 × 19%) = 2,418.80 + 537.13 = 2,955.93
    expect(ukTaxEngine.computeTax(27_491, "other", "SCT", 2025).totalTax).toBeCloseTo(2_955.93, 1);
  });
  it("£75,000 → top of higher band", () => {
    expect(ukTaxEngine.computeTax(75_000, "other", "SCT", 2025).totalTax).toBeGreaterThan(0);
  });
  it("£125,140 → top of advanced band", () => {
    expect(ukTaxEngine.computeTax(125_140, "other", "SCT", 2025).totalTax).toBeGreaterThan(0);
  });
});

describe("UK spec coverage — NI thresholds", () => {
  it("PT £12,570: NI = 0", () => { expect(computeUKNI(12_570, 2025)).toBe(0); });
  it("UEL £50,270: NI = 8% × 37,700 = £3,016", () => {
    expect(computeUKNI(50_270, 2025)).toBeCloseTo(3_016, 1);
  });
});

describe("UK spec coverage — Personal Allowance taper", () => {
  it("£100,000: PA unchanged (£12,570)", () => {
    expect(effectivePersonalAllowance(100_000)).toBe(12_570);
  });
  it("£110,000: PA half tapered (£12,570 − £5,000 = £7,570)", () => {
    expect(effectivePersonalAllowance(110_000)).toBeCloseTo(7_570, 0);
  });
  it("£125,140: PA fully tapered (£0)", () => {
    expect(effectivePersonalAllowance(125_140)).toBeCloseTo(0, 0);
  });
  it("£150,000: PA stays at 0", () => {
    expect(effectivePersonalAllowance(150_000)).toBe(0);
  });
});

describe("UK spec coverage — Marriage Allowance", () => {
  it("Claiming recipient at basic-rate income saves £252", () => {
    const baseline = ukTaxEngine.computeTax(20_000, "other", "ENG", 2025);
    const adjusted = applyMarriageAllowance(baseline, 20_000, "claiming", "ENG", 2025);
    expect(baseline.totalTax - adjusted.totalTax).toBeCloseTo(252, 1);
  });
  it("Donor at PA reduces their tax by £0 (PA already exceeds income)", () => {
    const baseline = ukTaxEngine.computeTax(10_000, "other", "ENG", 2025);
    const adjusted = applyMarriageAllowance(baseline, 10_000, "transferring", "ENG", 2025);
    // £10k < PA-£1,260 (£11,310), so reduced PA still covers income → no extra tax.
    expect(adjusted.totalTax).toBe(0);
  });
});

describe("UK spec coverage — SIPP withdrawal & ISA classification", () => {
  it("SIPP withdrawal applies 25% tax-free lump sum", () => {
    const r = ukTaxEngine.getWithdrawalTaxRate({
      category: "SIPP", jurisdiction: "ENG", annualWithdrawal: 40_000, year: 2025,
    });
    expect(r.taxFreeAmount).toBeCloseTo(10_000, 0);
  });
  it("ISA classified tax-free", () => {
    expect(ukTaxEngine.classifyTaxTreatment("Stocks & Shares ISA")).toBe("tax-free");
    expect(ukTaxEngine.classifyTaxTreatment("Lifetime ISA")).toBe("tax-free");
    expect(ukTaxEngine.classifyTaxTreatment("Junior ISA")).toBe("tax-free");
    expect(ukTaxEngine.classifyTaxTreatment("Cash ISA")).toBe("tax-free");
  });
});

describe("UK spec coverage — LISA penalty before age 60", () => {
  it("Age 40 with LISA → 25% penalty applies", () => {
    const penalties = ukTaxEngine.getEarlyWithdrawalPenalties(["Lifetime ISA"], 40);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].penaltyPercent).toBeCloseTo(0.25, 4);
  });
});

describe("UK spec coverage — State Pension monthly conversion", () => {
  it("£230.25/wk → £997.75/mo", () => {
    expect(weeklyToMonthly(UK_STATE_PENSION_FULL_NEW_WEEKLY)).toBeCloseTo(997.75, 1);
  });
});

describe("UK spec coverage — registry lookup", () => {
  it("getCountry('UK') returns the UK profile", () => {
    const uk = getCountry("UK");
    expect(uk.code).toBe("UK");
    expect(uk.homeCurrency).toBe("GBP");
    expect(uk.locale).toBe("en-GB");
    expect(uk.jurisdictions.map((j) => j.code)).toEqual(["ENG", "WAL", "NIR", "SCT"]);
  });
});
```

- [ ] **Step 2: Verify**

Run: `npx vitest run tests/unit/countries/uk/uk-spec-coverage.test.ts`
Expected: all green.

- [ ] **Step 3: Commit**

```bash
git add tests/unit/countries/uk/uk-spec-coverage.test.ts
git commit -m "ralph: complete task 246 - UK spec coverage test suite (PA taper, NI, MA, SIPP, LISA, State Pension)"
```

---

## Task 247: UK E2E Playwright spec

**Files:**
- Create: `tests/e2e/uk-flow.spec.ts`

**Context:** End-to-end happy path covering country switch, jurisdiction switch, breakdown lines, sample profile, and asset suggestions.

- [ ] **Step 1: Write the spec**

Create `tests/e2e/uk-flow.spec.ts`:

```typescript
import { test, expect } from "@playwright/test";

test.describe("UK flow", () => {
  test("country switch to UK shows £ and ENG default", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("country-uk").click();
    await expect(page.getByTestId("country-uk")).toHaveAttribute("aria-pressed", "true");
    // Currency symbol should be £
    await expect(page.locator("body")).toContainText("£");
  });

  test("Scotland jurisdiction renders Scotland-specific bracket totals", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("country-uk").click();
    await page.getByLabel(/Select region|Select state/i).selectOption("SCT");
    // Set salary to £80,000 (monthly £6,667)
    await page.getByRole("textbox", { name: /Salary/i }).first().fill("6667");
    // Open tax breakdown explainer (UI affordance — adjust selector if needed)
    await expect(page.locator("body")).toContainText("Income Tax");
    await expect(page.locator("body")).toContainText("National Insurance");
  });

  test("Switching back to England recomputes rUK tax", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("country-uk").click();
    await page.getByLabel(/Select region|Select state/i).selectOption("SCT");
    await page.getByLabel(/Select region|Select state/i).selectOption("ENG");
    await expect(page.locator("[data-testid=country-jurisdiction-selector]")).toBeVisible();
  });

  test("Mid-career UK quick-start loads ISA + SIPP", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("country-uk").click();
    // Click on the Mid career sample
    await page.getByRole("button", { name: /Mid career/i }).click();
    await expect(page.locator("body")).toContainText("Stocks & Shares ISA");
    await expect(page.locator("body")).toContainText("SIPP");
  });

  test("Asset suggestion dropdown includes UK vehicles", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("country-uk").click();
    // Add asset row affordance — adjust selector if needed.
    await page.getByRole("button", { name: /Add asset|Add account/i }).first().click();
    const input = page.getByPlaceholder(/category|account type/i).last();
    await input.click();
    await input.fill("ISA");
    await expect(page.locator("body")).toContainText("Stocks & Shares ISA");
    await expect(page.locator("body")).toContainText("Lifetime ISA");
  });
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npx playwright test tests/e2e/uk-flow.spec.ts`
Expected: all 5 specs green. If selectors don't match the live UI, inspect the page with `npx playwright codegen http://localhost:3000` and adjust the locator strings — keep test intent (assertions) unchanged.

- [ ] **Step 3: Capture screenshots for the regression archive**

The project's screenshot tooling (see `scripts/capture-screenshots.*`) generates UK-flow images. Run with `CAPTURE_TASK=247` to scope the writes:

```bash
CAPTURE_TASK=247 npx playwright test tests/e2e/uk-flow.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/uk-flow.spec.ts screenshots/
git commit -m "ralph: complete task 247 - UK E2E Playwright spec"
```

---

## Task 248: Final regression + changelog + release

**Files:**
- Modify: `src/lib/changelog.ts`

**Context:** Final pass. Runs build / unit / E2E / lint, adds a changelog entry that surfaces the UK launch to users, confirms snapshot regressions still pass byte-identical for CA/US/AU.

- [ ] **Step 1: Run full verification suite**

```bash
npm test
npx tsc --noEmit
npm run lint
npx playwright test
```

All four must be green. If snapshot regression tests for CA/US/AU diff, **stop** — the wire-up in Task 245 should not have altered their outputs.

- [ ] **Step 2: Add a changelog entry**

Open `src/lib/changelog.ts` and prepend a new entry at the top of the entries array (above the existing "removed CA_PROVINCES…" entry):

```typescript
{
  date: "2026-06-XX",  // replace with the actual landing date
  type: "feature",
  title: "UK support",
  description: "Added United Kingdom as a fourth supported country alongside Canada, USA, and Australia. UK users can select country=UK, switch jurisdictions between England, Wales, Northern Ireland, and Scotland (with Scotland-specific income-tax bands), and enter salary or other income. Tax computation handles the Personal Allowance taper (60% effective marginal band between £100k and £125,140), Class 1 employee National Insurance as a separate breakdown line, and an optional Marriage Allowance election. Supported account vehicles: Cash ISA, Stocks & Shares ISA, Lifetime ISA, Junior ISA, SIPP, Workplace Pension, and Premium Bonds — each with correct tax treatment, default ROI, and reinvest behaviour. State Pension is available as a retirement-income preset (£230.25/wk full new rate for 2025/26). Three UK quick-start profiles (early career, mid career, pre-retirement) demonstrate typical setups.",
},
```

- [ ] **Step 3: Capture release screenshots**

```bash
CAPTURE_TASK=248 npx playwright test tests/e2e/uk-flow.spec.ts
```

- [ ] **Step 4: Final commit**

```bash
git add src/lib/changelog.ts screenshots/
git commit -m "ralph: complete task 248 - UK support release (changelog + final regression)"
```

---

## Self-Review

**Spec coverage** — each section from `docs/superpowers/specs/2026-05-09-uk-support-design.md` mapped to a task:

| Spec section | Task(s) |
|---|---|
| Directory layout | 235–245 (file creation), 245 (registry) |
| Shared interfaces | Already in place from Phase A — no changes |
| `CountryCode = "UK"` | 245 |
| `SupportedCurrency = "GBP"` | 245 |
| Locale `"en-GB"` | already in `Locale` union; consumed via UK profile in 245 |
| `TaxResult.breakdown` Income Tax + NI lines | 243 (NI), 245 (registration makes it visible) |
| Locale per country (currency formatter) | already wired in Phase A task 230 |
| Jurisdictions ENG/WAL/NIR/SCT | 245 (UK profile) |
| Tax year `2025/26` label + `April 6` boundary | 245 |
| rUK 2025/26 bracket table | 235 |
| Scotland 2025/26 bracket table | 235 |
| Personal Allowance taper | 243 |
| Class 1 employee NI | 243 |
| Marriage Allowance | 243 (engine), 245 (`FinancialState` field) |
| CGT (£3,000 AEA, 18/24%) | 244 |
| Filing statuses (single / married-civil-partnership) | 245 |
| Asset suggestion list (ISA family + SIPP + WP + PB) | 236 |
| Account-type descriptions | 236 |
| Tax treatment (`uk-pension` for SIPP/WP) | 244 (initial), 245 (union extension + promotion) |
| Default ROI | 236 |
| Reinvest defaults | 236 |
| Income-tax ROI categories | 236 |
| Employer-match eligible | 236 |
| Early-withdrawal penalties (LISA, pension lock) | 244 |
| State Pension | 237, 245 (`statePensionWeekly` field) |
| Tax credits (Marriage Allowance, Gift Aid, etc.) | 238 |
| Three UK sample profiles | 239 |
| Phase A → Phase B migration sequencing | this plan's task ordering |
| `Record<CountryCode, CountryProfile>` exhaustive registration | 245 |
| Plugin contract tests cover UK automatically | 245 (inclusion via registry) |
| UK-specific unit tests (10 scenarios) | 246 |
| E2E flow | 247 |

**Placeholder scan:** no `TBD`, `TODO`, `implement later`, `Add appropriate X`, or "Similar to Task N" left in this document. The two TODO-style comments inside code blocks (Welsh divergence flag in `tax-tables.ts`, pension access age rising to 57 in 2028) are intentional source-code TODOs documenting reality, not plan placeholders.

**Type consistency check:**
- `UK_PERSONAL_ALLOWANCE_2025` named identically everywhere it appears (235, 243, 244).
- `effectivePersonalAllowance` exported from `tax-engine.ts` (243) and consumed in the spec-coverage suite (246).
- `computeUKNI` exported from `tax-engine.ts` (243) and consumed in 246.
- `applyMarriageAllowance` signature `(baseline, grossIncome, election, jurisdiction, year)` defined in 243 and called identically in 246.
- `UKMarriageAllowance` type alias only used inside `tax-engine.ts` — `marriageAllowance` field on `FinancialState` (245) uses the inline `"claiming" | "transferring" | "none"` union, consistent with the engine type.
- `UK_STATE_PENSION_FULL_NEW_WEEKLY` constant referenced in 237 (def), 239 (sample profile), 246 (test).
- `ukTaxEngine` / `ukVehicles` / `ukProfiles` / etc. — naming consistent throughout 235–245.

**Scope check:** the plan delivers UK end-to-end behind a single registry-level switch. No out-of-scope work (Welsh band divergence, Class 2/4 NI, lifetime allowance, etc. — these are explicitly out-of-scope in the spec).
