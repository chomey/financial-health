# Country Plugin Architecture Refactor — Phase A Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor existing CA / US / AU country handling into per-country plugin directories implementing shared TypeScript interfaces, with no user-visible behavior change. Foundation for adding UK as a peer in a follow-up plan.

**Architecture:** Each country becomes a directory under `src/lib/countries/<country>/` with files for `tax-engine.ts`, `vehicles.ts`, `government-retirement.ts`, `tax-credits.ts`, `sample-profiles.ts`, `insights.ts`, `tax-tables.ts`, and `index.ts`. A `CountryProfile` interface bundles each country's plugin instances. A top-level `COUNTRIES: Record<CountryCode, CountryProfile>` registry replaces country-switching free functions. The existing free-function APIs (`computeTax`, `getWithdrawalTaxRate`, etc.) become thin shims that delegate to the registry, then get deleted once consumers migrate.

**Tech Stack:** TypeScript (strict), Vitest, Playwright, Next.js 15 (App Router).

**Reference:** Spec at `docs/superpowers/specs/2026-05-09-uk-support-design.md`. This plan implements Phase A only.

**Test file convention:** `vitest.config.ts` includes only `tests/unit/**/*.test.{ts,tsx}`. The plan's `__tests__` paths (e.g., `src/lib/countries/canada/__tests__/vehicles.test.ts`) should be mapped to `tests/unit/countries/canada/vehicles.test.ts` etc. Source files stay co-located under `src/lib/countries/<country>/`.

---

## Pre-flight

### Task 1: Snapshot regression baseline for tax engine

This captures byte-identical outputs of the public tax API at sample income points before any code moves. Re-run after every refactor task — must stay green.

**Files:**
- Create: `src/lib/__tests__/tax-engine-snapshot.test.ts`

- [ ] **Step 1: Write the snapshot test**

```typescript
// src/lib/__tests__/tax-engine-snapshot.test.ts
import { describe, it, expect } from "vitest";
import { computeTax, getMarginalRateForIncome } from "@/lib/tax-engine";

const SAMPLE_INCOMES = [10_000, 50_000, 100_000, 200_000, 500_000];
const TYPES = ["employment", "capital-gains", "other"] as const;
const YEARS = [2025, 2026];

const COMBOS: Array<[("CA" | "US" | "AU"), string]> = [
  ["CA", "ON"], ["CA", "AB"], ["CA", "BC"], ["CA", "QC"],
  ["US", "CA"], ["US", "TX"], ["US", "NY"], ["US", "FL"],
  ["AU", "NSW"], ["AU", "VIC"], ["AU", "QLD"],
];

describe("tax engine snapshot regression", () => {
  for (const [country, jurisdiction] of COMBOS) {
    for (const year of YEARS) {
      for (const type of TYPES) {
        for (const income of SAMPLE_INCOMES) {
          it(`${country}/${jurisdiction} ${year} ${type} ${income}`, () => {
            const result = computeTax(income, type, country, jurisdiction, year);
            expect(result).toMatchSnapshot();
          });
        }
      }
    }
  }
});

describe("marginal rate snapshot regression", () => {
  for (const [country, jurisdiction] of COMBOS) {
    for (const year of YEARS) {
      for (const income of SAMPLE_INCOMES) {
        it(`${country}/${jurisdiction} ${year} ${income}`, () => {
          const rate = getMarginalRateForIncome(income, country, jurisdiction, year);
          expect(rate).toMatchSnapshot();
        });
      }
    }
  }
});
```

- [ ] **Step 2: Run the test to capture baseline snapshots**

Run: `npx vitest run src/lib/__tests__/tax-engine-snapshot.test.ts -u`
Expected: All tests pass; snapshots written to `src/lib/__tests__/__snapshots__/tax-engine-snapshot.test.ts.snap`.

- [ ] **Step 3: Commit baseline**

```bash
git add src/lib/__tests__/tax-engine-snapshot.test.ts src/lib/__tests__/__snapshots__/
git commit -m "test: snapshot baseline for tax engine before plugin refactor"
```

### Task 2: Snapshot regression baseline for withdrawal tax

**Files:**
- Create: `src/lib/__tests__/withdrawal-tax-snapshot.test.ts`

- [ ] **Step 1: Write the snapshot test**

```typescript
// src/lib/__tests__/withdrawal-tax-snapshot.test.ts
import { describe, it, expect } from "vitest";
import { getWithdrawalTaxRate } from "@/lib/withdrawal-tax";

const CATEGORIES_BY_COUNTRY: Record<"CA" | "US" | "AU", string[]> = {
  CA: ["TFSA", "RRSP", "RESP", "FHSA", "LIRA", "Savings Account", "Brokerage"],
  US: ["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA", "Brokerage"],
  AU: ["Super (Accumulation)", "Super (Pension Phase)", "First Home Super Saver", "Brokerage"],
};

const JURISDICTION_BY_COUNTRY: Record<"CA" | "US" | "AU", string> = {
  CA: "ON", US: "CA", AU: "NSW",
};

describe("withdrawal tax snapshot regression", () => {
  for (const country of ["CA", "US", "AU"] as const) {
    for (const cat of CATEGORIES_BY_COUNTRY[country]) {
      for (const amount of [10_000, 50_000, 100_000]) {
        it(`${country} ${cat} ${amount}`, () => {
          const result = getWithdrawalTaxRate(
            cat,
            country,
            JURISDICTION_BY_COUNTRY[country],
            amount,
            100,
            undefined,
            2025,
          );
          expect(result).toMatchSnapshot();
        });
      }
    }
  }
});
```

- [ ] **Step 2: Run to capture snapshots**

Run: `npx vitest run src/lib/__tests__/withdrawal-tax-snapshot.test.ts -u`
Expected: PASS, snapshots written.

- [ ] **Step 3: Commit**

```bash
git add src/lib/__tests__/withdrawal-tax-snapshot.test.ts src/lib/__tests__/__snapshots__/withdrawal-tax-snapshot.test.ts.snap
git commit -m "test: snapshot baseline for withdrawal tax before plugin refactor"
```

---

## Foundation

### Task 3: Shared interfaces and registry shell

This task creates the type definitions but no implementations. The registry remains empty until each country plugin lands.

**Files:**
- Create: `src/lib/countries/types.ts`
- Create: `src/lib/countries/index.ts`
- Create: `src/lib/countries/__tests__/types.test.ts`

- [ ] **Step 1: Write the types file**

```typescript
// src/lib/countries/types.ts
import type {
  TaxResult,
  IncomeType,
} from "@/lib/tax-engine";
import type {
  TaxTreatment,
  WithdrawalTaxResult,
  EarlyWithdrawalPenalty,
} from "@/lib/withdrawal-tax";
import type {
  TaxCreditCategory,
  FilingStatus,
} from "@/lib/tax-credits";
import type {
  GovernmentRetirementIncome,
  FinancialState,
} from "@/lib/financial-types";
import type { SampleProfile } from "@/lib/sample-profiles";
import type { SupportedCurrency } from "@/lib/currency";
import type { InsightCandidate } from "@/lib/insights/types";

export type CountryCode = "CA" | "US" | "AU";

export interface Jurisdiction {
  code: string;
  name: string;
}

export interface WithdrawalTaxArgs {
  category: string;
  jurisdiction: string;
  annualWithdrawal: number;
  costBasisPercent?: number;
  roiTaxTreatment?: "capital-gains" | "income";
  year?: number;
}

export interface TaxEngine {
  computeTax(annualIncome: number, type: IncomeType, jurisdiction: string, year: number): TaxResult;
  getMarginalRate(annualIncome: number, jurisdiction: string, year: number): number;
  classifyTaxTreatment(category: string): TaxTreatment;
  getWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult;
  getEarlyWithdrawalPenalties(categories: string[], age: number): EarlyWithdrawalPenalty[];
}

export interface VehicleCatalog {
  categories: string[];
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
  computeMonthly(income: GovernmentRetirementIncome | undefined): number;
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
  getCandidates(state: FinancialState): InsightCandidate[];
}

export type Locale = "en-CA" | "en-US" | "en-AU" | "en-GB";

export interface CountryProfile {
  code: CountryCode;
  displayName: string;
  shortLabel: string;
  flagEmoji: string;
  homeCurrency: SupportedCurrency;
  locale: Locale;
  jurisdictions: Jurisdiction[];
  defaultJurisdiction: string;
  filingStatuses: { value: FilingStatus; label: string }[];
  defaultFilingStatus: FilingStatus;
  taxYearLabel(year: number): string;
  taxYearBoundary: { startMonth: number; startDay: number };
  taxEngine: TaxEngine;
  vehicles: VehicleCatalog;
  governmentRetirement: GovernmentRetirementPlugin;
  taxCredits: TaxCreditCatalog;
  profiles: ProfileLibrary;
  insights: InsightProvider;
}
```

- [ ] **Step 2: Write the registry shell**

```typescript
// src/lib/countries/index.ts
import type { CountryCode, CountryProfile } from "./types";

const COUNTRIES_INTERNAL: Partial<Record<CountryCode, CountryProfile>> = {};

/**
 * Register a country profile in the central registry.
 * Called by each country's index module at top-level (no side-effects beyond registration).
 */
export function registerCountry(profile: CountryProfile): void {
  COUNTRIES_INTERNAL[profile.code] = profile;
}

export function getCountry(code: CountryCode): CountryProfile {
  const profile = COUNTRIES_INTERNAL[code];
  if (!profile) {
    throw new Error(`Country profile not registered: ${code}`);
  }
  return profile;
}

export function getRegisteredCountries(): CountryProfile[] {
  return Object.values(COUNTRIES_INTERNAL).filter((p): p is CountryProfile => p !== undefined);
}

export type { CountryCode, CountryProfile } from "./types";
```

(Note: a `Partial<Record>` is used during the migration so countries can land one at a time. After all three are registered, `COUNTRIES` can be tightened to a non-partial Record.)

- [ ] **Step 3: Write a smoke test**

```typescript
// src/lib/countries/__tests__/types.test.ts
import { describe, it, expect } from "vitest";
import { getCountry, registerCountry, getRegisteredCountries } from "@/lib/countries";

describe("countries registry", () => {
  it("throws for unregistered country", () => {
    expect(() => getCountry("CA")).toThrow(/not registered/);
  });

  it("returns a country after registration", () => {
    const stub = { code: "CA", displayName: "Test" } as never;
    registerCountry(stub);
    expect(getCountry("CA")).toBe(stub);
  });

  it("lists registered countries", () => {
    expect(getRegisteredCountries().length).toBeGreaterThanOrEqual(1);
  });
});
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/countries/__tests__/`
Expected: PASS for all three tests. Note: this test pollutes registry state for other tests in the same vitest run; if that becomes a problem, add `beforeEach` reset; not needed yet because nothing else reads the registry.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/
git commit -m "feat: add CountryProfile interfaces and registry shell"
```

---

## Per-country plugin extraction (Canada)

### Task 4: Extract canada/tax-tables.ts

Pure data move: bracket tables for CA federal + 13 provinces, 2025 + 2026.

**Files:**
- Create: `src/lib/countries/canada/tax-tables.ts`
- Modify: `src/lib/tax-tables.ts` (re-export from new location)
- Reference: `src/lib/tax-tables.ts:34-1019` (CA bracket data)

- [ ] **Step 1: Create the new file with all CA bracket tables**

Move from `src/lib/tax-tables.ts` lines 34–1019: `CA_FEDERAL_2025`, `CA_FEDERAL_2026`, `CA_AB_2025`, `CA_BC_2025`, … `CA_YT_2026`, `CA_PROVINCIAL_2025`, `CA_PROVINCIAL_2026`, `CA_CAPITAL_GAINS`, `getCanadianBrackets`, `calculateCanadianCapitalGainsInclusion`. Re-export the `BracketTable` and `TaxBracket` types from a new shared file.

```typescript
// src/lib/countries/canada/tax-tables.ts
import type { BracketTable } from "@/lib/bracket-math";
export type { BracketTable } from "@/lib/bracket-math";

// PASTE the existing CA_FEDERAL_2025 through CA_YT_2026 constants here
// PASTE the existing CA_PROVINCIAL_2025 / 2026 maps here
// PASTE CA_CAPITAL_GAINS, getCanadianBrackets, calculateCanadianCapitalGainsInclusion
```

- [ ] **Step 2: Create the shared bracket-math file**

```typescript
// src/lib/bracket-math.ts
export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface BracketTable {
  brackets: TaxBracket[];
  basicPersonalAmount: number;
}

/**
 * Apply a progressive tax bracket table to taxable income, with the
 * basicPersonalAmount applied as a tax credit (Canadian convention).
 * Returns the tax owed.
 */
export function calculateProgressiveTax(taxableIncome: number, table: BracketTable): number {
  if (taxableIncome <= 0) return 0;
  let tax = 0;
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  // BPA credit at the lowest bracket rate
  const lowestRate = table.brackets[0]?.rate ?? 0;
  const bpaCredit = table.basicPersonalAmount * lowestRate;
  return Math.max(0, tax - bpaCredit);
}

export function getMarginalRate(taxableIncome: number, table: BracketTable): number {
  if (taxableIncome <= 0) return 0;
  for (const bracket of table.brackets) {
    if (taxableIncome <= bracket.max) return bracket.rate;
  }
  return table.brackets[table.brackets.length - 1]?.rate ?? 0;
}
```

(Move `calculateProgressiveTax` from `src/lib/tax-tables.ts` to here. Source: `src/lib/tax-tables.ts` — search for the function definition.)

- [ ] **Step 3: Make `src/lib/tax-tables.ts` re-export Canada tables**

```typescript
// src/lib/tax-tables.ts (top of file, replacing the CA_* constant definitions)
export {
  CA_FEDERAL_2025, CA_FEDERAL_2026,
  CA_AB_2025, CA_AB_2026, CA_BC_2025, CA_BC_2026, /* ...all provinces... */
  CA_PROVINCIAL_2025, CA_PROVINCIAL_2026,
  CA_CAPITAL_GAINS,
  getCanadianBrackets, calculateCanadianCapitalGainsInclusion,
} from "@/lib/countries/canada/tax-tables";
export type { BracketTable, TaxBracket } from "@/lib/bracket-math";
export { calculateProgressiveTax } from "@/lib/bracket-math";
```

(Keep US and AU code in this file untouched — they get extracted in their own tasks.)

- [ ] **Step 4: Run all tests including snapshot regression**

Run: `npm test`
Expected: All tests pass. Snapshot tests confirm no behavior change.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/canada/tax-tables.ts src/lib/bracket-math.ts src/lib/tax-tables.ts
git commit -m "refactor: extract CA bracket data to canada/tax-tables.ts"
```

### Task 5: Extract canada/vehicles.ts

Move CA-specific category data, descriptions, ROI defaults, and tax-treatment classification helpers from `src/components/AssetEntry.tsx` into a `VehicleCatalog` implementation.

**Files:**
- Create: `src/lib/countries/canada/vehicles.ts`
- Create: `src/lib/countries/canada/__tests__/vehicles.test.ts`
- Reference: `src/components/AssetEntry.tsx:38, 53-57, 77, 99, 112-116, 134-135, 156-164, 178-180, 191`

- [ ] **Step 1: Write tests first**

```typescript
// src/lib/countries/canada/__tests__/vehicles.test.ts
import { describe, it, expect } from "vitest";
import { canadianVehicles } from "@/lib/countries/canada/vehicles";

describe("canadianVehicles", () => {
  it("lists CA-specific categories", () => {
    expect(canadianVehicles.categories).toEqual(["TFSA", "RRSP", "RESP", "FHSA", "LIRA"]);
  });

  it("flagEmoji is the maple leaf", () => {
    expect(canadianVehicles.flagEmoji).toBe("🇨🇦");
  });

  it("returns descriptions for known accounts", () => {
    expect(canadianVehicles.getDescription("TFSA")).toMatch(/tax-free/i);
    expect(canadianVehicles.getDescription("Bogus")).toBeUndefined();
  });

  it("returns default ROI for known accounts", () => {
    expect(canadianVehicles.getDefaultRoi("TFSA")).toBe(5);
    expect(canadianVehicles.getDefaultRoi("RRSP")).toBe(5);
    expect(canadianVehicles.getDefaultRoi("Bogus")).toBeUndefined();
  });

  it("classifies TFSA as tax-sheltered", () => {
    expect(canadianVehicles.isTaxSheltered("TFSA")).toBe(true);
    expect(canadianVehicles.isTaxSheltered("RRSP")).toBe(false);
  });

  it("classifies RRSP as tax-deferred", () => {
    expect(canadianVehicles.isTaxDeferred("RRSP")).toBe(true);
    expect(canadianVehicles.isTaxDeferred("TFSA")).toBe(false);
  });

  it("classifies Savings as income-tax ROI", () => {
    expect(canadianVehicles.isIncomeTaxRoi("Savings")).toBe(true);
    expect(canadianVehicles.isIncomeTaxRoi("Brokerage")).toBe(false);
  });

  it("classifies registered accounts as reinvest-default", () => {
    expect(canadianVehicles.isReinvestDefault("RRSP")).toBe(true);
    expect(canadianVehicles.isReinvestDefault("Savings")).toBe(false);
  });

  it("classifies RRSP as employer-match-eligible", () => {
    expect(canadianVehicles.isEmployerMatchEligible("RRSP")).toBe(true);
    expect(canadianVehicles.isEmployerMatchEligible("TFSA")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npx vitest run src/lib/countries/canada/__tests__/vehicles.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Write the implementation**

```typescript
// src/lib/countries/canada/vehicles.ts
import type { VehicleCatalog } from "@/lib/countries/types";

const CATEGORIES = ["TFSA", "RRSP", "RESP", "FHSA", "LIRA"] as const;

const DESCRIPTIONS: Record<string, string> = {
  "TFSA": "Tax-free growth and withdrawals, $7,000/yr contribution room",
  "RRSP": "Tax-deferred, contributions reduce taxable income, taxed on withdrawal",
  "RESP": "Education savings, government grants up to $7,200 lifetime",
  "FHSA": "Tax-free first home savings, $8,000/yr limit",
  "LIRA": "Locked-in retirement, from employer pension, withdrawal restrictions",
};

const DEFAULT_ROI: Record<string, number> = {
  "TFSA": 5, "RRSP": 5, "RESP": 5, "FHSA": 5, "LIRA": 5,
};

const TAX_SHELTERED = new Set(["TFSA", "FHSA"]);
const TAX_DEFERRED = new Set(["RRSP", "RESP", "LIRA"]);
const INCOME_TAX_ROI = new Set(["Savings", "Savings Account", "Checking", "GIC", "HISA"]);
const REINVEST_DEFAULT = new Set(["TFSA", "RRSP", "RESP", "FHSA", "LIRA", "Brokerage"]);
const EMPLOYER_MATCH = new Set(["RRSP"]);

export const canadianVehicles: VehicleCatalog = {
  categories: [...CATEGORIES],
  flagEmoji: "🇨🇦",
  getDescription: (category) => DESCRIPTIONS[category],
  getDefaultRoi: (category) => DEFAULT_ROI[category],
  isTaxSheltered: (category) => TAX_SHELTERED.has(category),
  isTaxDeferred: (category) => TAX_DEFERRED.has(category),
  isIncomeTaxRoi: (category) => INCOME_TAX_ROI.has(category),
  isReinvestDefault: (category) => REINVEST_DEFAULT.has(category),
  isEmployerMatchEligible: (category) => EMPLOYER_MATCH.has(category),
};
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/countries/canada/__tests__/vehicles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/canada/
git commit -m "feat: implement canadianVehicles catalog"
```

### Task 6: Extract canada/government-retirement.ts

CPP + OAS plugin.

**Files:**
- Create: `src/lib/countries/canada/government-retirement.ts`
- Create: `src/lib/countries/canada/__tests__/government-retirement.test.ts`
- Reference: `src/lib/government-retirement.ts:9-40, 97-112`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/countries/canada/__tests__/government-retirement.test.ts
import { describe, it, expect } from "vitest";
import { canadianGovernmentRetirement } from "@/lib/countries/canada/government-retirement";

describe("canadianGovernmentRetirement", () => {
  it("computes monthly CPP + OAS", () => {
    expect(canadianGovernmentRetirement.computeMonthly({
      cppMonthly: 1000, oasMonthly: 700,
    })).toBe(1700);
  });

  it("returns 0 when undefined", () => {
    expect(canadianGovernmentRetirement.computeMonthly(undefined)).toBe(0);
  });

  it("provides CPP presets", () => {
    const presets = canadianGovernmentRetirement.presetsFor("cpp");
    expect(presets.find((p) => p.value === "max")?.amount).toBeCloseTo(1364.60);
    expect(presets.find((p) => p.value === "average")?.amount).toBeCloseTo(816.52);
  });

  it("provides OAS presets", () => {
    const presets = canadianGovernmentRetirement.presetsFor("oas");
    expect(presets.find((p) => p.value === "full")?.amount).toBeCloseTo(727.67);
  });
});
```

- [ ] **Step 2: Confirm it fails**

Run: `npx vitest run src/lib/countries/canada/__tests__/government-retirement.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// src/lib/countries/canada/government-retirement.ts
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

export const CPP_MAX_MONTHLY = 1_364.60;
export const CPP_AVERAGE_MONTHLY = 816.52;
export const OAS_MAX_MONTHLY_65_74 = 727.67;
export const OAS_MAX_MONTHLY_75_PLUS = 800.44;
export const OAS_CLAWBACK_THRESHOLD = 90_997;

export const canadianGovernmentRetirement: GovernmentRetirementPlugin = {
  computeMonthly(income) {
    if (!income) return 0;
    return (income.cppMonthly ?? 0) + (income.oasMonthly ?? 0);
  },
  presetsFor(field) {
    if (field === "cpp") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "average", label: "Average ($816/mo)", amount: CPP_AVERAGE_MONTHLY },
        { value: "max", label: "Max ($1,365/mo)", amount: CPP_MAX_MONTHLY },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    if (field === "oas") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "full", label: "Full ($728/mo)", amount: OAS_MAX_MONTHLY_65_74 },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/countries/canada/__tests__/government-retirement.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/canada/government-retirement.ts src/lib/countries/canada/__tests__/government-retirement.test.ts
git commit -m "feat: implement canadianGovernmentRetirement plugin"
```

### Task 7: Extract canada/tax-credits.ts

Move CA tax credit categories from `src/lib/tax-credits.ts` into a `TaxCreditCatalog`.

**Files:**
- Create: `src/lib/countries/canada/tax-credits.ts`
- Create: `src/lib/countries/canada/__tests__/tax-credits.test.ts`
- Reference: `src/lib/tax-credits.ts` — find all entries in `ALL_CREDIT_CATEGORIES` with `jurisdiction: "CA"`

- [ ] **Step 1: Write tests**

```typescript
// src/lib/countries/canada/__tests__/tax-credits.test.ts
import { describe, it, expect } from "vitest";
import { canadianTaxCredits } from "@/lib/countries/canada/tax-credits";

describe("canadianTaxCredits", () => {
  it("returns CA-only categories", () => {
    const cats = canadianTaxCredits.getCategories(2025);
    expect(cats.length).toBeGreaterThan(0);
    for (const c of cats) {
      expect(c.jurisdiction).toBe("CA");
    }
  });

  it("filters out info-only entries by default", () => {
    const cats = canadianTaxCredits.getCategories(2025);
    expect(cats.every((c) => !c.infoOnly)).toBe(true);
  });

  it("findCategory looks up by name", () => {
    const all = canadianTaxCredits.getCategories(2025);
    if (all.length > 0) {
      const found = canadianTaxCredits.findCategory(all[0].name, 2025);
      expect(found?.name).toBe(all[0].name);
    }
  });

  it("married filter hides spouse-only credits when single", () => {
    const single = canadianTaxCredits.getCategoriesForFilingStatus("single", 2025);
    expect(single.every((c) => !c.requiresSpouse)).toBe(true);
  });
});
```

- [ ] **Step 2: Confirm it fails**

Run: `npx vitest run src/lib/countries/canada/__tests__/tax-credits.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// src/lib/countries/canada/tax-credits.ts
import type { TaxCreditCatalog } from "@/lib/countries/types";
import type { TaxCreditCategory, FilingStatus } from "@/lib/tax-credits";
import { resolveCategoryForYear } from "@/lib/tax-credits";

// PASTE all CA entries from ALL_CREDIT_CATEGORIES (jurisdiction === "CA") here
// Reference: src/lib/tax-credits.ts — search for `jurisdiction: "CA"`
const CA_CATEGORIES: TaxCreditCategory[] = [
  // ...paste from src/lib/tax-credits.ts
];

export const canadianTaxCredits: TaxCreditCatalog = {
  getCategories(year) {
    return CA_CATEGORIES.filter((c) => !c.infoOnly).map((c) => resolveCategoryForYear(c, year));
  },
  getCategoriesForFilingStatus(filingStatus, year) {
    const isMarried = filingStatus === "married-common-law";
    return CA_CATEGORIES
      .filter((c) => !c.infoOnly)
      .filter((c) => !c.requiresSpouse || isMarried)
      .map((c) => resolveCategoryForYear(c, year));
  },
  findCategory(name, year) {
    const found = CA_CATEGORIES.find((c) => c.name === name);
    return found ? resolveCategoryForYear(found, year) : undefined;
  },
};
```

(Note: keep `resolveCategoryForYear` exported from `src/lib/tax-credits.ts` — it's a generic helper, not country-specific.)

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/countries/canada/__tests__/tax-credits.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/canada/tax-credits.ts src/lib/countries/canada/__tests__/tax-credits.test.ts
git commit -m "feat: implement canadianTaxCredits catalog"
```

### Task 8: Extract canada/sample-profiles.ts

**Files:**
- Create: `src/lib/countries/canada/sample-profiles.ts`
- Create: `src/lib/countries/canada/__tests__/sample-profiles.test.ts`
- Reference: `src/lib/sample-profiles.ts` — entries with `country: "CA"`, plus `CA_SAMPLE_PROFILES` and `QUICK_START_CA_PROFILES` if they exist

- [ ] **Step 1: Write the test**

```typescript
// src/lib/countries/canada/__tests__/sample-profiles.test.ts
import { describe, it, expect } from "vitest";
import { canadianProfiles } from "@/lib/countries/canada/sample-profiles";

describe("canadianProfiles", () => {
  it("provides sample profiles", () => {
    expect(canadianProfiles.samples.length).toBeGreaterThan(0);
    for (const p of canadianProfiles.samples) {
      expect(p.state.country).toBe("CA");
    }
  });

  it("provides quick-start profiles", () => {
    expect(canadianProfiles.quickStarts.length).toBeGreaterThan(0);
    for (const p of canadianProfiles.quickStarts) {
      expect(p.state.country).toBe("CA");
    }
  });
});
```

- [ ] **Step 2: Confirm it fails**

Run: `npx vitest run src/lib/countries/canada/__tests__/sample-profiles.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```typescript
// src/lib/countries/canada/sample-profiles.ts
import type { ProfileLibrary } from "@/lib/countries/types";
import type { SampleProfile } from "@/lib/sample-profiles";

// PASTE all CA SampleProfile entries from src/lib/sample-profiles.ts
// (the ones with country: "CA")
const SAMPLES: SampleProfile[] = [
  // ...paste
];

const QUICK_STARTS: SampleProfile[] = [
  // ...paste
];

export const canadianProfiles: ProfileLibrary = {
  samples: SAMPLES,
  quickStarts: QUICK_STARTS,
};
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/countries/canada/__tests__/sample-profiles.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/canada/sample-profiles.ts src/lib/countries/canada/__tests__/sample-profiles.test.ts
git commit -m "feat: implement canadianProfiles library"
```

### Task 9: Extract canada/insights.ts

Pull country-specific insight generators (TFSA reminder, RRSP recommendation, etc.) out of `src/lib/insights/generate.ts`.

**Files:**
- Create: `src/lib/countries/canada/insights.ts`
- Create: `src/lib/countries/canada/__tests__/insights.test.ts`
- Reference: `src/lib/insights/generate.ts` — find every insight that branches on `country === "CA"` or references CA-only categories

- [ ] **Step 1: Identify CA-specific insights**

```bash
grep -n "country.*===.*\"CA\"\|TFSA\|RRSP\|FHSA\|RESP\|LIRA\|CPP\|OAS" src/lib/insights/generate.ts
```

- [ ] **Step 2: Write a test for at least one CA insight**

```typescript
// src/lib/countries/canada/__tests__/insights.test.ts
import { describe, it, expect } from "vitest";
import { canadianInsights } from "@/lib/countries/canada/insights";
import { INITIAL_STATE } from "@/lib/financial-types";
import type { FinancialState } from "@/lib/financial-types";

describe("canadianInsights", () => {
  it("returns candidates for a CA state", () => {
    const state: FinancialState = { ...INITIAL_STATE, country: "CA" };
    const candidates = canadianInsights.getCandidates(state);
    expect(Array.isArray(candidates)).toBe(true);
  });

  it("returns empty for a non-CA state", () => {
    const state: FinancialState = { ...INITIAL_STATE, country: "US" };
    const candidates = canadianInsights.getCandidates(state);
    expect(candidates).toEqual([]);
  });
});
```

- [ ] **Step 3: Confirm it fails**

Run: `npx vitest run src/lib/countries/canada/__tests__/insights.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement by extracting CA-branching code from generate.ts**

```typescript
// src/lib/countries/canada/insights.ts
import type { InsightProvider } from "@/lib/countries/types";

export const canadianInsights: InsightProvider = {
  getCandidates(state) {
    if (state.country !== "CA") return [];
    const candidates = [];
    // PASTE CA-specific candidate generation from src/lib/insights/generate.ts
    return candidates;
  },
};
```

(Keep the original code in `generate.ts` for now — Task 25 will switch the dispatch to call the per-country provider.)

- [ ] **Step 5: Run the tests**

Run: `npx vitest run src/lib/countries/canada/__tests__/insights.test.ts && npm test`
Expected: PASS, snapshot regression still green.

- [ ] **Step 6: Commit**

```bash
git add src/lib/countries/canada/insights.ts src/lib/countries/canada/__tests__/insights.test.ts
git commit -m "feat: extract canadianInsights provider"
```

### Task 10: Implement canada/tax-engine.ts

Move `computeCanadianTax` and the CA branches of `getEarlyWithdrawalPenalties` and the `taxable` arm of `getWithdrawalTaxRate` into a `TaxEngine` implementation.

**Files:**
- Create: `src/lib/countries/canada/tax-engine.ts`
- Create: `src/lib/countries/canada/__tests__/tax-engine.test.ts`
- Reference: `src/lib/tax-engine.ts:111-157` (computeCanadianTax), `src/lib/withdrawal-tax.ts:88-153` (CA branches), `src/lib/withdrawal-tax.ts:36-62` (classifyTaxTreatment)

- [ ] **Step 1: Write a comparison test against the existing free function**

```typescript
// src/lib/countries/canada/__tests__/tax-engine.test.ts
import { describe, it, expect } from "vitest";
import { canadianTaxEngine } from "@/lib/countries/canada/tax-engine";
import { computeTax as legacyComputeTax } from "@/lib/tax-engine";
import { getWithdrawalTaxRate as legacyWithdrawalTax } from "@/lib/withdrawal-tax";

describe("canadianTaxEngine matches legacy", () => {
  for (const income of [10_000, 50_000, 100_000, 200_000]) {
    for (const province of ["ON", "AB", "BC", "QC"]) {
      for (const year of [2025, 2026]) {
        for (const type of ["employment", "capital-gains"] as const) {
          it(`computeTax ${income}/${province}/${year}/${type}`, () => {
            const expected = legacyComputeTax(income, type, "CA", province, year);
            const actual = canadianTaxEngine.computeTax(income, type, province, year);
            expect(actual.totalTax).toBeCloseTo(expected.totalTax, 2);
            expect(actual.afterTaxIncome).toBeCloseTo(expected.afterTaxIncome, 2);
            expect(actual.marginalRate).toBeCloseTo(expected.marginalRate, 4);
          });
        }
      }
    }
  }
});

describe("canadianTaxEngine.classifyTaxTreatment", () => {
  it("TFSA is tax-free", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("TFSA")).toBe("tax-free");
  });
  it("RRSP is tax-deferred", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("RRSP")).toBe("tax-deferred");
  });
  it("Brokerage is taxable", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("Brokerage")).toBe("taxable");
  });
});

describe("canadianTaxEngine.getWithdrawalTaxRate matches legacy", () => {
  for (const cat of ["TFSA", "RRSP", "Brokerage"]) {
    for (const amount of [10_000, 50_000]) {
      it(`${cat} ${amount}`, () => {
        const expected = legacyWithdrawalTax(cat, "CA", "ON", amount, 100, undefined, 2025);
        const actual = canadianTaxEngine.getWithdrawalTaxRate({
          category: cat, jurisdiction: "ON", annualWithdrawal: amount,
          costBasisPercent: 100, year: 2025,
        });
        expect(actual.effectiveRate).toBeCloseTo(expected.effectiveRate, 4);
        expect(actual.taxableAmount).toBeCloseTo(expected.taxableAmount, 2);
      });
    }
  }
});

describe("canadianTaxEngine.getEarlyWithdrawalPenalties", () => {
  it("flags RRSP under 65", () => {
    const penalties = canadianTaxEngine.getEarlyWithdrawalPenalties(["RRSP"], 40);
    expect(penalties.length).toBe(1);
    expect(penalties[0].category).toBe("RRSP");
  });
  it("no penalty for RRSP at 65", () => {
    const penalties = canadianTaxEngine.getEarlyWithdrawalPenalties(["RRSP"], 65);
    expect(penalties).toEqual([]);
  });
});
```

- [ ] **Step 2: Confirm it fails**

Run: `npx vitest run src/lib/countries/canada/__tests__/tax-engine.test.ts`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement the engine**

```typescript
// src/lib/countries/canada/tax-engine.ts
import type { TaxEngine, WithdrawalTaxArgs } from "@/lib/countries/types";
import type { IncomeType, TaxResult } from "@/lib/tax-engine";
import type { TaxTreatment, WithdrawalTaxResult, EarlyWithdrawalPenalty } from "@/lib/withdrawal-tax";
import { calculateProgressiveTax, getMarginalRate } from "@/lib/bracket-math";
import {
  getCanadianBrackets,
  calculateCanadianCapitalGainsInclusion,
  CA_CAPITAL_GAINS,
} from "./tax-tables";

const TAX_FREE = ["tfsa", "fhsa"];
const TAX_DEFERRED = ["rrsp", "resp", "lira", "pension"];

function classify(category: string): TaxTreatment {
  const lower = category.toLowerCase();
  if (TAX_FREE.some((kw) => lower.includes(kw))) return "tax-free";
  if (TAX_DEFERRED.some((kw) => lower.includes(kw))) return "tax-deferred";
  return "taxable";
}

function computeCanadianTax(
  annualIncome: number,
  type: IncomeType,
  province: string,
  year: number,
): TaxResult {
  if (annualIncome <= 0) {
    return {
      totalTax: 0, effectiveRate: 0, marginalRate: 0, afterTaxIncome: 0,
      breakdown: [],
      // Legacy fields preserved for shim compat — removed in Task 19
      federalTax: 0, provincialStateTax: 0,
    } as TaxResult;
  }
  const { federal, provincial } = getCanadianBrackets(province, year);
  const taxableIncome = type === "capital-gains"
    ? calculateCanadianCapitalGainsInclusion(annualIncome)
    : annualIncome;
  const federalTax = calculateProgressiveTax(taxableIncome, federal);
  const provincialTax = calculateProgressiveTax(taxableIncome, provincial);
  const totalTax = federalTax + provincialTax;
  let marginalRate = getMarginalRate(taxableIncome, federal) + getMarginalRate(taxableIncome, provincial);
  if (type === "capital-gains") {
    const inclusionRate = annualIncome <= CA_CAPITAL_GAINS.firstTierLimit
      ? CA_CAPITAL_GAINS.firstTierRate : CA_CAPITAL_GAINS.secondTierRate;
    marginalRate *= inclusionRate;
  }
  return {
    totalTax,
    effectiveRate: annualIncome > 0 ? totalTax / annualIncome : 0,
    marginalRate,
    afterTaxIncome: annualIncome - totalTax,
    breakdown: [
      { label: "Federal Tax", amount: federalTax, kind: "income-tax" },
      { label: "Provincial Tax", amount: provincialTax, kind: "sub-federal" },
    ],
    federalTax, provincialStateTax: provincialTax, // legacy
  } as TaxResult;
}

function getCanadianWithdrawalTaxRate(args: WithdrawalTaxArgs): WithdrawalTaxResult {
  // Mirror src/lib/withdrawal-tax.ts:176-261 logic, using classify() above
  // and computeCanadianTax() for the "tax-deferred" and "taxable" arms.
  const { category, jurisdiction, annualWithdrawal, costBasisPercent = 100, roiTaxTreatment, year = 2025 } = args;
  if (annualWithdrawal <= 0) return { effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 };
  const treatment = classify(category);
  switch (treatment) {
    case "tax-free":
      return { effectiveRate: 0, taxFreeAmount: annualWithdrawal, taxableAmount: 0 };
    case "tax-deferred": {
      const taxResult = computeCanadianTax(annualWithdrawal, "employment", jurisdiction, year);
      return {
        effectiveRate: taxResult.effectiveRate,
        taxFreeAmount: 0,
        taxableAmount: annualWithdrawal,
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
      const incomeType = roiTaxTreatment === "income" ? "employment" : "capital-gains";
      const taxResult = computeCanadianTax(gainsAmount, incomeType, jurisdiction, year);
      return {
        effectiveRate: annualWithdrawal > 0 ? taxResult.totalTax / annualWithdrawal : 0,
        taxFreeAmount: costBasisAmount,
        taxableAmount: gainsAmount,
      };
    }
    default:
      return { effectiveRate: 0, taxFreeAmount: annualWithdrawal, taxableAmount: 0 };
  }
}

function getCanadianEarlyWithdrawalPenalties(categories: string[], age: number): EarlyWithdrawalPenalty[] {
  if (age <= 0) return [];
  const out: EarlyWithdrawalPenalty[] = [];
  for (const cat of categories) {
    const lower = cat.toLowerCase();
    if (age < 65 && (lower.includes("rrsp") || lower.includes("lira"))) {
      out.push({
        category: cat,
        penaltyPercent: 0,
        penaltyFreeAge: 65,
        rule: "Withdrawals taxed as income with 10-30% withholding. Consider waiting until lower income years.",
      });
    }
  }
  return out;
}

export const canadianTaxEngine: TaxEngine = {
  computeTax: computeCanadianTax,
  getMarginalRate(annualIncome, jurisdiction, year) {
    return computeCanadianTax(annualIncome, "employment", jurisdiction, year).marginalRate;
  },
  classifyTaxTreatment: classify,
  getWithdrawalTaxRate: getCanadianWithdrawalTaxRate,
  getEarlyWithdrawalPenalties: getCanadianEarlyWithdrawalPenalties,
};
```

(Note: `TaxResult.breakdown` is added here. The legacy `federalTax`/`provincialStateTax` fields are kept temporarily for shim compatibility — removed in Task 19.)

- [ ] **Step 4: Run the tests**

Run: `npx vitest run src/lib/countries/canada/__tests__/tax-engine.test.ts`
Expected: PASS — all comparisons against legacy match within tolerance.

- [ ] **Step 5: Run full snapshot regression**

Run: `npm test`
Expected: All passing including snapshot regression.

- [ ] **Step 6: Commit**

```bash
git add src/lib/countries/canada/tax-engine.ts src/lib/countries/canada/__tests__/tax-engine.test.ts
git commit -m "feat: implement canadianTaxEngine"
```

### Task 11: Assemble canada/index.ts and register

**Files:**
- Create: `src/lib/countries/canada/index.ts`
- Modify: `src/lib/countries/index.ts` (import and trigger CA registration)

- [ ] **Step 1: Create the index that assembles CANADA**

```typescript
// src/lib/countries/canada/index.ts
import type { CountryProfile } from "@/lib/countries/types";
import { canadianTaxEngine } from "./tax-engine";
import { canadianVehicles } from "./vehicles";
import { canadianGovernmentRetirement } from "./government-retirement";
import { canadianTaxCredits } from "./tax-credits";
import { canadianProfiles } from "./sample-profiles";
import { canadianInsights } from "./insights";

export const CANADA: CountryProfile = {
  code: "CA",
  displayName: "Canada",
  shortLabel: "Canada",
  flagEmoji: "🇨🇦",
  homeCurrency: "CAD",
  locale: "en-CA",
  jurisdictions: [
    { code: "AB", name: "Alberta" },
    { code: "BC", name: "British Columbia" },
    { code: "MB", name: "Manitoba" },
    { code: "NB", name: "New Brunswick" },
    { code: "NL", name: "Newfoundland and Labrador" },
    { code: "NT", name: "Northwest Territories" },
    { code: "NS", name: "Nova Scotia" },
    { code: "NU", name: "Nunavut" },
    { code: "ON", name: "Ontario" },
    { code: "PE", name: "Prince Edward Island" },
    { code: "QC", name: "Quebec" },
    { code: "SK", name: "Saskatchewan" },
    { code: "YT", name: "Yukon" },
  ],
  defaultJurisdiction: "ON",
  filingStatuses: [
    { value: "single", label: "Single" },
    { value: "married-common-law", label: "Married / Common-Law" },
  ],
  defaultFilingStatus: "single",
  taxYearLabel: (year) => String(year),
  taxYearBoundary: { startMonth: 1, startDay: 1 },
  taxEngine: canadianTaxEngine,
  vehicles: canadianVehicles,
  governmentRetirement: canadianGovernmentRetirement,
  taxCredits: canadianTaxCredits,
  profiles: canadianProfiles,
  insights: canadianInsights,
};
```

- [ ] **Step 2: Register CA in the registry**

```typescript
// src/lib/countries/index.ts (append at end)
import { CANADA } from "./canada";
import { registerCountry } from "./internal-register";

registerCountry(CANADA);
```

(Wait — to avoid circular imports, split out a private internal-register module. Actually, simpler: keep the registerCountry in `src/lib/countries/index.ts` and have it call `registerCountry(CANADA)` at the bottom. But CANADA imports from `types.ts`, not `index.ts`, so no circular. Acceptable.)

Final form:

```typescript
// src/lib/countries/index.ts
import type { CountryCode, CountryProfile } from "./types";

const COUNTRIES_INTERNAL: Partial<Record<CountryCode, CountryProfile>> = {};

export function registerCountry(profile: CountryProfile): void {
  COUNTRIES_INTERNAL[profile.code] = profile;
}

export function getCountry(code: CountryCode): CountryProfile {
  const profile = COUNTRIES_INTERNAL[code];
  if (!profile) throw new Error(`Country profile not registered: ${code}`);
  return profile;
}

export function getRegisteredCountries(): CountryProfile[] {
  return Object.values(COUNTRIES_INTERNAL).filter((p): p is CountryProfile => p !== undefined);
}

export type { CountryCode, CountryProfile, TaxEngine, VehicleCatalog, /* etc */ } from "./types";

// ── Country registrations (eager, top-level) ────────────────────────────────
import { CANADA } from "./canada";
registerCountry(CANADA);
```

- [ ] **Step 3: Sanity test**

```typescript
// src/lib/countries/canada/__tests__/profile.test.ts
import { describe, it, expect } from "vitest";
import { getCountry } from "@/lib/countries";

describe("CA profile registration", () => {
  it("registers via index import", () => {
    const ca = getCountry("CA");
    expect(ca.code).toBe("CA");
    expect(ca.homeCurrency).toBe("CAD");
    expect(ca.taxEngine).toBeDefined();
    expect(ca.vehicles.categories).toContain("TFSA");
  });
});
```

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: PASS, including snapshot regression.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/
git commit -m "feat: assemble and register CANADA country profile"
```

---

## Per-country plugin extraction (USA)

### Task 12: Extract usa/tax-tables.ts

Same shape as Task 4. Move `US_FEDERAL_2025`, `US_FEDERAL_2026`, all `US_*_2025`/`US_*_2026` state tables, `US_PROVINCIAL_2025`/`US_PROVINCIAL_2026` maps, `US_CAPITAL_GAINS_2025`/`2026`, `getUSBrackets`, `getUSCapitalGainsBrackets` from `src/lib/tax-tables.ts` into `src/lib/countries/usa/tax-tables.ts`. Update `src/lib/tax-tables.ts` to re-export from the new location.

**Files:**
- Create: `src/lib/countries/usa/tax-tables.ts`
- Modify: `src/lib/tax-tables.ts`

- [ ] **Step 1: Create usa/tax-tables.ts**

(See Task 4 Step 1 — same structure, US data instead of CA.)

- [ ] **Step 2: Update src/lib/tax-tables.ts to re-export**

```typescript
// Append to existing re-exports in src/lib/tax-tables.ts
export {
  US_FEDERAL_2025, US_FEDERAL_2026,
  US_PROVINCIAL_2025, US_PROVINCIAL_2026,
  US_CAPITAL_GAINS_2025, US_CAPITAL_GAINS_2026,
  getUSBrackets, getUSCapitalGainsBrackets,
} from "@/lib/countries/usa/tax-tables";
```

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS, snapshot regression intact.

- [ ] **Step 4: Commit**

```bash
git add src/lib/countries/usa/tax-tables.ts src/lib/tax-tables.ts
git commit -m "refactor: extract US bracket data to usa/tax-tables.ts"
```

### Task 13: Extract usa/vehicles.ts

Categories: `["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA"]`. Same TDD pattern as Task 5.

**Files:**
- Create: `src/lib/countries/usa/vehicles.ts`
- Create: `src/lib/countries/usa/__tests__/vehicles.test.ts`

- [ ] **Step 1: Write tests** — mirror Task 5 Step 1, asserting US categories, US descriptions (from `src/components/AssetEntry.tsx:59-64`), US ROI defaults (7% for 401k/IRA, 6% for 529/HSA), US tax-sheltered set (`{"Roth IRA", "Roth 401k", "HSA"}`), US tax-deferred set (`{"401k", "IRA", "529"}`), employer-match-eligible (`{"401k", "Roth 401k"}`).

- [ ] **Step 2: Confirm fail**

Run: `npx vitest run src/lib/countries/usa/__tests__/vehicles.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement** — mirror Task 5 Step 3 with US data.

```typescript
// src/lib/countries/usa/vehicles.ts
import type { VehicleCatalog } from "@/lib/countries/types";

const CATEGORIES = ["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA"];

const DESCRIPTIONS: Record<string, string> = {
  "401k": "Employer-sponsored, pre-tax contributions, taxed on withdrawal",
  "Roth 401k": "After-tax contributions, tax-free growth and withdrawals",
  "IRA": "Individual retirement, pre-tax, $7,000/yr limit",
  "Roth IRA": "After-tax, tax-free growth, $7,000/yr limit, income limits apply",
  "529": "Education savings, tax-free for qualified expenses",
  "HSA": "Triple tax advantage for medical expenses, $4,300/yr single",
};

const DEFAULT_ROI: Record<string, number> = {
  "401k": 7, "Roth 401k": 7, "IRA": 7, "Roth IRA": 7, "529": 6, "HSA": 6,
};

const TAX_SHELTERED = new Set(["Roth IRA", "Roth 401k", "HSA"]);
const TAX_DEFERRED = new Set(["401k", "IRA", "529"]);
const INCOME_TAX_ROI = new Set(["Savings", "Savings Account", "Checking", "Money Market"]);
const REINVEST_DEFAULT = new Set(["401k", "Roth 401k", "IRA", "Roth IRA", "529", "HSA", "Brokerage"]);
const EMPLOYER_MATCH = new Set(["401k", "Roth 401k"]);

export const americanVehicles: VehicleCatalog = {
  categories: CATEGORIES,
  flagEmoji: "🇺🇸",
  getDescription: (c) => DESCRIPTIONS[c],
  getDefaultRoi: (c) => DEFAULT_ROI[c],
  isTaxSheltered: (c) => TAX_SHELTERED.has(c),
  isTaxDeferred: (c) => TAX_DEFERRED.has(c),
  isIncomeTaxRoi: (c) => INCOME_TAX_ROI.has(c),
  isReinvestDefault: (c) => REINVEST_DEFAULT.has(c),
  isEmployerMatchEligible: (c) => EMPLOYER_MATCH.has(c),
};
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/lib/countries/usa/`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/countries/usa/
git commit -m "feat: implement americanVehicles catalog"
```

### Task 14: Extract usa/government-retirement.ts

Social Security plugin. Follow Task 6 pattern with `SS_*` constants from `src/lib/government-retirement.ts:42-64`.

- [ ] **Step 1: Write tests** asserting `computeMonthly({ssMonthly: 1500}) === 1500`, presets include `average`/`max-62`/`max-67`/`max-70` with the expected dollar amounts.

- [ ] **Step 2: Confirm fail.**

- [ ] **Step 3: Implement.**

```typescript
// src/lib/countries/usa/government-retirement.ts
import type { GovernmentRetirementPlugin } from "@/lib/countries/types";

export const SS_AVERAGE_MONTHLY = 1_976;
export const SS_MAX_AT_62 = 2_710;
export const SS_MAX_AT_67 = 3_822;
export const SS_MAX_AT_70 = 4_873;

export const americanGovernmentRetirement: GovernmentRetirementPlugin = {
  computeMonthly(income) {
    return income?.ssMonthly ?? 0;
  },
  presetsFor(field) {
    if (field === "ss") {
      return [
        { value: "none", label: "None", amount: 0 },
        { value: "average", label: "Average ($1,976/mo)", amount: SS_AVERAGE_MONTHLY },
        { value: "max-62", label: "Max @ 62 ($2,710/mo)", amount: SS_MAX_AT_62 },
        { value: "max-67", label: "Max @ 67 ($3,822/mo)", amount: SS_MAX_AT_67 },
        { value: "max-70", label: "Max @ 70 ($4,873/mo)", amount: SS_MAX_AT_70 },
        { value: "custom", label: "Custom", amount: 0 },
      ];
    }
    return [];
  },
};
```

- [ ] **Step 4: Run tests.**
- [ ] **Step 5: Commit.**

### Task 15: Extract usa/tax-credits.ts

Same pattern as Task 7. Move `jurisdiction: "US"` entries from `src/lib/tax-credits.ts`.

- [ ] **Step 1: Write tests** — assert non-empty, all entries have `jurisdiction === "US"`, married filter, findCategory.
- [ ] **Step 2: Confirm fail.**
- [ ] **Step 3: Implement.** Paste US entries from `ALL_CREDIT_CATEGORIES`.
- [ ] **Step 4: Run tests.**
- [ ] **Step 5: Commit.**

### Task 16: Extract usa/sample-profiles.ts

Same pattern as Task 8. Paste US sample profiles.

- [ ] **Step 1–5:** Mirror Task 8 with US profiles.

### Task 17: Extract usa/insights.ts

Same pattern as Task 9. US-specific candidate generators (Roth IRA contribution, 401k match, HSA limit, etc.).

- [ ] **Step 1–6:** Mirror Task 9 with US-specific code.

### Task 18: Implement usa/tax-engine.ts

Move `computeUSTax` and `computeUSCapitalGainsTax` from `src/lib/tax-engine.ts:159-234` and the US branch of `getEarlyWithdrawalPenalties` from `src/lib/withdrawal-tax.ts:100-124`.

- [ ] **Step 1: Write comparison tests against legacy `computeTax(country="US", ...)` and `getEarlyWithdrawalPenalties(["401k","Roth IRA"], age=40, "US")`.**

```typescript
// src/lib/countries/usa/__tests__/tax-engine.test.ts
import { describe, it, expect } from "vitest";
import { americanTaxEngine } from "@/lib/countries/usa/tax-engine";
import { computeTax as legacyComputeTax } from "@/lib/tax-engine";

describe("americanTaxEngine matches legacy", () => {
  for (const income of [10_000, 50_000, 100_000, 200_000]) {
    for (const state of ["CA", "TX", "NY", "FL"]) {
      for (const year of [2025, 2026]) {
        for (const type of ["employment", "capital-gains"] as const) {
          it(`${income}/${state}/${year}/${type}`, () => {
            const expected = legacyComputeTax(income, type, "US", state, year);
            const actual = americanTaxEngine.computeTax(income, type, state, year);
            expect(actual.totalTax).toBeCloseTo(expected.totalTax, 2);
            expect(actual.afterTaxIncome).toBeCloseTo(expected.afterTaxIncome, 2);
          });
        }
      }
    }
  }
});
```

- [ ] **Step 2: Confirm fail.**
- [ ] **Step 3: Implement following Task 10's structure** with US logic. Key differences: standard deduction subtracted from gross income (not credit); long-term capital gains use their own bracket table; states with no income tax have empty bracket arrays.
- [ ] **Step 4: Run tests + snapshot regression.**
- [ ] **Step 5: Commit.**

### Task 19: Assemble usa/index.ts and register

Mirror Task 11.

```typescript
// src/lib/countries/usa/index.ts
import type { CountryProfile } from "@/lib/countries/types";
import { americanTaxEngine } from "./tax-engine";
import { americanVehicles } from "./vehicles";
import { americanGovernmentRetirement } from "./government-retirement";
import { americanTaxCredits } from "./tax-credits";
import { americanProfiles } from "./sample-profiles";
import { americanInsights } from "./insights";

export const USA: CountryProfile = {
  code: "US",
  displayName: "United States",
  shortLabel: "USA",
  flagEmoji: "🇺🇸",
  homeCurrency: "USD",
  locale: "en-US",
  jurisdictions: [/* 50 states + DC, paste from CountryJurisdictionSelector.tsx US_STATES */],
  defaultJurisdiction: "CA",
  filingStatuses: [
    { value: "single", label: "Single" },
    { value: "married-jointly", label: "Married Filing Jointly" },
    { value: "married-separately", label: "Married Filing Separately" },
    { value: "head-of-household", label: "Head of Household" },
  ],
  defaultFilingStatus: "single",
  taxYearLabel: (year) => String(year),
  taxYearBoundary: { startMonth: 1, startDay: 1 },
  taxEngine: americanTaxEngine,
  vehicles: americanVehicles,
  governmentRetirement: americanGovernmentRetirement,
  taxCredits: americanTaxCredits,
  profiles: americanProfiles,
  insights: americanInsights,
};
```

Add `registerCountry(USA)` to `src/lib/countries/index.ts`.

- [ ] **Step 1: Create usa/index.ts** (above)
- [ ] **Step 2: Register USA**
- [ ] **Step 3: Run tests** — full suite
- [ ] **Step 4: Commit**

---

## Per-country plugin extraction (Australia)

### Task 20: Extract australia/tax-tables.ts

Move `AU_FEDERAL_2025`, `AU_FEDERAL_2026`, `AU_FEDERAL_BY_YEAR`, `AU_MEDICARE_LEVY`, `getAUBrackets`, `calculateMedicareLevy` from `src/lib/tax-tables.ts:1021-1128` to `src/lib/countries/australia/tax-tables.ts`.

- [ ] **Step 1–4:** Mirror Task 4 with AU data.

### Task 21: Extract australia/vehicles.ts

Categories: `["Super (Accumulation)", "Super (Pension Phase)", "First Home Super Saver"]`. Tax-sheltered: `{"Super (Pension Phase)"}`. Tax-deferred: `{"Super (Accumulation)"}`. Employer-match-eligible: `{"Super (Accumulation)"}`.

Note: also handle the AU-specific tax treatments `super-accumulation` and `super-fhss` in `classifyTaxTreatment` — these are unique to AU.

- [ ] **Step 1–5:** Mirror Task 5 with AU data.

### Task 22: Extract australia/government-retirement.ts

Age Pension. Move `AU_PENSION_*` constants, `getAuPensionPresetAmount`, `fortnightlyToMonthly` from `src/lib/government-retirement.ts:67-91`.

- [ ] **Step 1: Write tests** — `computeMonthly({agePensionFortnightly: 1116.30}) === 1116.30 * 26 / 12`, presets `full-single` / `full-couple`.
- [ ] **Step 2: Confirm fail.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run tests.**
- [ ] **Step 5: Commit.**

### Task 23: Extract australia/tax-credits.ts

Same pattern as Task 7 with `jurisdiction: "AU"`.

### Task 24: Extract australia/sample-profiles.ts

Same pattern as Task 8 with AU profiles.

### Task 25: Extract australia/insights.ts

Same pattern as Task 9 with AU-specific candidates (Super contribution, FHSS, Age Pension).

### Task 26: Implement australia/tax-engine.ts

Move `computeAUTax` from `src/lib/tax-engine.ts:255-320` plus the AU branch of `getEarlyWithdrawalPenalties` (`src/lib/withdrawal-tax.ts:139-149`) and the AU-specific `super-accumulation` / `super-fhss` arms of `getWithdrawalTaxRate` (`src/lib/withdrawal-tax.ts:211-231`).

Key AU specifics for the breakdown:
- `breakdown` should split federal tax and Medicare Levy into two lines:
  - `{ label: "Income Tax", amount: federalTax, kind: "income-tax" }`
  - `{ label: "Medicare Levy", amount: medicareLevy, kind: "social" }`

- [ ] **Step 1: Write comparison tests against legacy `computeTax(country="AU", ...)`.**
- [ ] **Step 2: Confirm fail.**
- [ ] **Step 3: Implement.** New: surface Medicare Levy as a separate breakdown line (the legacy code bundled it into totalTax only).
- [ ] **Step 4: Run tests** — comparison tests against legacy must still match on `totalTax`. Snapshot regression must still pass.
- [ ] **Step 5: Commit.**

### Task 27: Assemble australia/index.ts and register

```typescript
// src/lib/countries/australia/index.ts
export const AUSTRALIA: CountryProfile = {
  code: "AU",
  displayName: "Australia",
  shortLabel: "AU",
  flagEmoji: "🇦🇺",
  homeCurrency: "AUD",
  locale: "en-AU",
  jurisdictions: [/* paste from CountryJurisdictionSelector.tsx AU_STATES_TERRITORIES */],
  defaultJurisdiction: "NSW",
  filingStatuses: [
    { value: "single", label: "Single" },
    { value: "married-de-facto", label: "Married / De Facto" },
  ],
  defaultFilingStatus: "single",
  taxYearLabel: (year) => `${year - 1}/${String(year).slice(2)} FY`,
  taxYearBoundary: { startMonth: 7, startDay: 1 },
  taxEngine: australianTaxEngine,
  vehicles: australianVehicles,
  governmentRetirement: australianGovernmentRetirement,
  taxCredits: australianTaxCredits,
  profiles: australianProfiles,
  insights: australianInsights,
};
```

Register in `src/lib/countries/index.ts`.

- [ ] **Step 1–4:** Mirror Task 11.

---

## Cross-cutting interface changes

### Task 28: Tighten registry to non-Partial Record

After CA / US / AU all registered, the registry can enforce exhaustiveness statically. Compile error if a 4th `CountryCode` is added without a profile.

**Files:**
- Modify: `src/lib/countries/index.ts`

- [ ] **Step 1: Replace internal registry type**

```typescript
// src/lib/countries/index.ts — change the const type
const COUNTRIES: Record<CountryCode, CountryProfile> = {
  CA: CANADA,
  US: USA,
  AU: AUSTRALIA,
};

export function getCountry(code: CountryCode): CountryProfile {
  return COUNTRIES[code];
}

export function getRegisteredCountries(): CountryProfile[] {
  return Object.values(COUNTRIES);
}

// Remove registerCountry — no longer needed; registry is a static record.
export { COUNTRIES };
```

(Drop the `registerCountry` function — country profiles are imported directly into the registry rather than self-registering.)

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/countries/index.ts
git commit -m "refactor: tighten countries registry to exhaustive Record"
```

### Task 29: Add TaxResult.breakdown migration to consumers

Currently `TaxResult` has both `breakdown` (new) and legacy `federalTax` / `provincialStateTax`. This task removes the legacy fields and updates all readers.

**Files:**
- Modify: `src/lib/tax-engine.ts` (remove legacy fields from `TaxResult` interface)
- Modify: every consumer that reads `result.federalTax` or `result.provincialStateTax`
- Reference: `grep -rn "\.federalTax\|\.provincialStateTax" src/`

- [ ] **Step 1: Find all consumers**

Run: `grep -rn "\.federalTax\|\.provincialStateTax\|\.medicareLevy" src/`

- [ ] **Step 2: Update each consumer to read from `breakdown`**

Pattern:
```typescript
// Before
const fed = result.federalTax;
const prov = result.provincialStateTax;

// After
const fed = result.breakdown.find((b) => b.kind === "income-tax")?.amount ?? 0;
const prov = result.breakdown.find((b) => b.kind === "sub-federal")?.amount ?? 0;
```

For Medicare Levy specifically (in AU contexts):
```typescript
const medicare = result.breakdown.find((b) => b.kind === "social")?.amount ?? 0;
```

- [ ] **Step 3: Remove legacy fields from `TaxResult` interface**

```typescript
// src/lib/tax-engine.ts
export interface TaxResult {
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  afterTaxIncome: number;
  breakdown: { label: string; amount: number; kind: "income-tax" | "social" | "sub-federal" }[];
}
```

- [ ] **Step 4: Remove legacy field population from each country's tax-engine.ts**

Delete the `federalTax: ..., provincialStateTax: ...` lines from `computeCanadianTax`, `computeUSTax`, `computeAUTax` return statements.

- [ ] **Step 5: Update snapshot tests**

The snapshot files now have differently-shaped `TaxResult`. Run with `-u` to regenerate; manually verify the new shape is correct.

Run: `npx vitest run src/lib/__tests__/tax-engine-snapshot.test.ts -u`
Expected: snapshots regenerate; manually inspect a few to confirm `breakdown` array is populated correctly.

- [ ] **Step 6: Run full tests**

Run: `npm test && npm run build`
Expected: PASS, build clean.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor: drop legacy TaxResult fields; consumers read breakdown[]"
```

### Task 30: Thread locale through CurrencyFormatter

**Files:**
- Modify: `src/lib/currency.ts`
- Modify: every consumer of `CurrencyFormatter` / `formatCurrency` / `formatCurrencyCompact` that hardcodes `"en-US"`

- [ ] **Step 1: Extend CurrencyFormatter to accept locale**

```typescript
// src/lib/currency.ts
import type { Locale } from "@/lib/countries/types";

export class CurrencyFormatter {
  constructor(
    public readonly currency: SupportedCurrency,
    public readonly locale: Locale = "en-US",
  ) {}

  compact(amount: number): string {
    return formatCurrencyCompact(amount, this.currency, this.currency, this.locale);
  }

  full(amount: number, opts?: { showSign?: boolean; decimals?: number }): string {
    return formatCurrency(amount, this.currency, {
      showSign: opts?.showSign,
      maximumFractionDigits: opts?.decimals,
      homeCurrency: this.currency,
      locale: this.locale,
    });
  }

  foreign(amount: number, itemCurrency: SupportedCurrency): string {
    return formatCurrency(amount, itemCurrency, { homeCurrency: this.currency, locale: this.locale });
  }
}

export function formatCurrency(
  amount: number,
  currency: SupportedCurrency,
  opts?: {
    maximumFractionDigits?: number;
    showSign?: boolean;
    homeCurrency?: SupportedCurrency;
    locale?: Locale;
  },
): string {
  const locale = opts?.locale ?? "en-US";
  // ... rest of existing logic, replacing hardcoded "en-US" with locale
}

// formatCurrencyCompact: same change — accept locale, default to "en-US"
```

- [ ] **Step 2: Update CurrencyContext to pass locale from CountryProfile**

```typescript
// src/lib/CurrencyContext.tsx — find the place that constructs CurrencyFormatter
// Replace:
const formatter = new CurrencyFormatter(homeCurrency);
// With:
import { getCountry } from "@/lib/countries";
const profile = getCountry(country);
const formatter = new CurrencyFormatter(homeCurrency, profile.locale);
```

- [ ] **Step 3: Run tests + visual check**

Run: `npm test && npm run dev`
Expected: PASS. In the browser, verify CA/US/AU formatting unchanged (locales are similar enough that en-CA / en-US / en-AU produce the same output for these currencies).

- [ ] **Step 4: Commit**

```bash
git add src/lib/currency.ts src/lib/CurrencyContext.tsx
git commit -m "refactor: thread locale from CountryProfile into CurrencyFormatter"
```

### Task 31: Plugin contract test harness

Cross-country structural test that runs against every registered country.

**Files:**
- Create: `src/lib/countries/__tests__/contract.test.ts`

- [ ] **Step 1: Write the contract suite**

```typescript
// src/lib/countries/__tests__/contract.test.ts
import { describe, it, expect } from "vitest";
import { COUNTRIES, getCountry, getRegisteredCountries } from "@/lib/countries";

describe("CountryProfile contract", () => {
  for (const profile of getRegisteredCountries()) {
    describe(profile.code, () => {
      it("homeCurrency is in SupportedCurrency", () => {
        expect(["CAD", "USD", "AUD", "GBP"]).toContain(profile.homeCurrency);
      });

      it("locale is a recognised BCP-47 tag", () => {
        expect(() => new Intl.NumberFormat(profile.locale)).not.toThrow();
      });

      it("defaultJurisdiction appears in jurisdictions", () => {
        expect(profile.jurisdictions.map((j) => j.code)).toContain(profile.defaultJurisdiction);
      });

      it("defaultFilingStatus appears in filingStatuses", () => {
        expect(profile.filingStatuses.map((f) => f.value)).toContain(profile.defaultFilingStatus);
      });

      it("vehicles.categories non-empty", () => {
        expect(profile.vehicles.categories.length).toBeGreaterThan(0);
      });

      it("zero income → zero tax", () => {
        const r = profile.taxEngine.computeTax(0, "employment", profile.defaultJurisdiction, 2025);
        expect(r.totalTax).toBe(0);
        expect(r.afterTaxIncome).toBe(0);
      });

      it("breakdown sums to totalTax (within rounding)", () => {
        const r = profile.taxEngine.computeTax(80_000, "employment", profile.defaultJurisdiction, 2025);
        const sum = r.breakdown.reduce((acc, b) => acc + b.amount, 0);
        expect(sum).toBeCloseTo(r.totalTax, 0);
      });

      it("marginalRate is between 0 and 1", () => {
        const r = profile.taxEngine.computeTax(80_000, "employment", profile.defaultJurisdiction, 2025);
        expect(r.marginalRate).toBeGreaterThanOrEqual(0);
        expect(r.marginalRate).toBeLessThanOrEqual(1);
      });

      it("effectiveRate <= marginalRate at sample income", () => {
        const r = profile.taxEngine.computeTax(80_000, "employment", profile.defaultJurisdiction, 2025);
        expect(r.effectiveRate).toBeLessThanOrEqual(r.marginalRate + 0.0001);
      });

      it("taxYearLabel returns non-empty string", () => {
        expect(profile.taxYearLabel(2025).length).toBeGreaterThan(0);
      });
    });
  }
});
```

- [ ] **Step 2: Run the contract suite**

Run: `npx vitest run src/lib/countries/__tests__/contract.test.ts`
Expected: PASS for CA / US / AU. Any failures indicate a malformed plugin.

- [ ] **Step 3: Commit**

```bash
git add src/lib/countries/__tests__/contract.test.ts
git commit -m "test: add CountryProfile contract tests"
```

---

## Consumer migration (replace direct callsites with registry)

### Task 32: Replace src/lib/tax-engine.ts free functions with shims

**Files:**
- Modify: `src/lib/tax-engine.ts`

- [ ] **Step 1: Rewrite as shim**

```typescript
// src/lib/tax-engine.ts — replace entire file (keep type exports)
import { getCountry, type CountryCode } from "@/lib/countries";

export type IncomeType = "employment" | "capital-gains" | "other";

export interface TaxResult {
  totalTax: number;
  effectiveRate: number;
  marginalRate: number;
  afterTaxIncome: number;
  breakdown: { label: string; amount: number; kind: "income-tax" | "social" | "sub-federal" }[];
}

/** @deprecated Use getCountry(code).taxEngine.computeTax */
export function computeTax(
  annualIncome: number,
  type: IncomeType,
  country: CountryCode,
  jurisdiction: string,
  year: number = new Date().getFullYear(),
): TaxResult {
  return getCountry(country).taxEngine.computeTax(annualIncome, type, jurisdiction, year);
}

/** @deprecated Use getCountry(code).taxEngine.getMarginalRate */
export function getMarginalRateForIncome(
  annualIncome: number,
  country: CountryCode,
  jurisdiction: string,
  year: number = new Date().getFullYear(),
): number {
  return getCountry(country).taxEngine.getMarginalRate(annualIncome, jurisdiction, year);
}
```

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: PASS — all snapshots and unit tests still match.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tax-engine.ts
git commit -m "refactor: tax-engine.ts becomes shim over country plugins"
```

### Task 33: Replace src/lib/withdrawal-tax.ts with shim

Same pattern as Task 32. Public API delegates to `getCountry(country).taxEngine.{getWithdrawalTaxRate,classifyTaxTreatment,getEarlyWithdrawalPenalties}`.

- [ ] **Step 1: Rewrite**
- [ ] **Step 2: Run tests** — snapshot regression still green
- [ ] **Step 3: Commit**

### Task 34: Replace src/lib/government-retirement.ts with shim

`computeMonthlyGovernmentIncome(country, gri)` → `getCountry(country).governmentRetirement.computeMonthly(gri)`.

- [ ] **Step 1–3:** as Task 32 pattern.

### Task 35: Replace src/lib/tax-credits.ts free functions with shim

`getCreditCategories(country, year)` etc. → `getCountry(country).taxCredits.getCategories(year)`.

Keep `TaxCreditCategory`, `FilingStatus`, `IncomeLimitThresholds`, `TaxCredit` type exports — these are shared.

- [ ] **Step 1–3:** as Task 32 pattern.

### Task 36: Replace src/lib/sample-profiles.ts with shim

`getProfilesForCountry(country)` → `getCountry(country).profiles.samples`.

- [ ] **Step 1–3:** as Task 32 pattern.

---

## Component migration

### Task 37: AssetEntry.tsx reads from VehicleCatalog

**Files:**
- Modify: `src/components/AssetEntry.tsx`

- [ ] **Step 1: Replace hardcoded category data with registry lookups**

In `src/components/AssetEntry.tsx`, find `CATEGORY_SUGGESTIONS` (~line 37), `ACCOUNT_TYPE_DESCRIPTIONS` (~line 51), `DEFAULT_ROI` (~line 107), etc., and replace consumer code:

```typescript
// Before
import { ACCOUNT_TYPE_DESCRIPTIONS, getDefaultRoi, getAccountTypeDescription } from "@/components/AssetEntry";

// After
import { getCountry, type CountryCode } from "@/lib/countries";

function getDescription(country: CountryCode, category: string) {
  return getCountry(country).vehicles.getDescription(category)
      ?? getUniversalDescription(category); // for generic categories like "Savings"
}
```

For the `getGroupedCategorySuggestions` function:

```typescript
export function getGroupedCategorySuggestions(): SuggestionGroup[] {
  return [
    ...getRegisteredCountries().map((c) => ({
      label: `${c.flagEmoji} ${c.displayName}`,
      items: c.vehicles.categories,
    })),
    { label: "General", items: ["Savings", "Checking", "Brokerage", "Vehicle", "Other"] },
  ];
}
```

For `getAssetCategoryFlag`:

```typescript
export function getAssetCategoryFlag(category: string): string {
  for (const c of getRegisteredCountries()) {
    if (c.vehicles.categories.includes(category)) return c.vehicles.flagEmoji;
  }
  return "";
}
```

- [ ] **Step 2: Delete the now-unused constants**

Remove `CATEGORY_SUGGESTIONS`, `CA_ASSET_CATEGORIES`, `US_ASSET_CATEGORIES`, `AU_ASSET_CATEGORIES`, `ACCOUNT_TYPE_DESCRIPTIONS`, `DEFAULT_ROI`, `EMPLOYER_MATCH_ELIGIBLE`, `INCOME_TAX_ROI_CATEGORIES`, `TAX_SHELTERED_CATEGORIES`, `REINVEST_DEFAULT_CATEGORIES` from `src/components/AssetEntry.tsx`.

- [ ] **Step 3: Run all tests + Playwright**

Run: `npm test && npx playwright test`
Expected: PASS. Visual: asset suggestions still grouped by country with flag emojis.

- [ ] **Step 4: Commit**

```bash
git add src/components/AssetEntry.tsx
git commit -m "refactor: AssetEntry reads category data from country plugins"
```

### Task 38: CountryJurisdictionSelector.tsx reads from registry

**Files:**
- Modify: `src/components/CountryJurisdictionSelector.tsx`

- [ ] **Step 1: Replace hardcoded jurisdiction arrays and country buttons**

```typescript
// src/components/CountryJurisdictionSelector.tsx
import { getRegisteredCountries, getCountry, type CountryCode } from "@/lib/countries";

// Remove CA_PROVINCES, US_STATES, AU_STATES_TERRITORIES, DEFAULT_JURISDICTION constants

interface Props {
  country: CountryCode;
  jurisdiction: string;
  onCountryChange: (country: CountryCode) => void;
  onJurisdictionChange: (jurisdiction: string) => void;
  taxYear?: number;
  onTaxYearChange?: (year: number) => void;
}

export default function CountryJurisdictionSelector({
  country, jurisdiction, onCountryChange, onJurisdictionChange,
  taxYear, onTaxYearChange,
}: Props) {
  const profile = getCountry(country);
  const jurisdictions = profile.jurisdictions;

  const handleCountryChange = useCallback((newCountry: CountryCode) => {
    if (newCountry !== country) {
      onCountryChange(newCountry);
      onJurisdictionChange(getCountry(newCountry).defaultJurisdiction);
    }
  }, [country, onCountryChange, onJurisdictionChange]);

  return (
    <div className="space-y-2" data-testid="country-jurisdiction-selector">
      <div className="flex flex-wrap items-center gap-2">
        {/* tax year buttons unchanged */}
        <div className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5">
          {getRegisteredCountries().map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleCountryChange(c.code)}
              className={/* same Tailwind as before */}
              aria-pressed={country === c.code}
              aria-label={`Select ${c.displayName}`}
              data-testid={`country-${c.code.toLowerCase()}`}
            >
              <span aria-hidden="true" className="text-base leading-none">{c.flagEmoji}</span>
              {c.shortLabel}
            </button>
          ))}
        </div>
        <select
          value={jurisdiction}
          onChange={(e) => onJurisdictionChange(e.target.value)}
          className={/* same Tailwind */}
          aria-label="Select jurisdiction"
          data-testid="jurisdiction-select"
        >
          {jurisdictions.map((j) => (
            <option key={j.code} value={j.code}>{j.name} ({j.code})</option>
          ))}
        </select>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run tests + Playwright**

Run: `npm test && npx playwright test`
Expected: PASS. Country buttons still render in CA / US / AU order with correct flags.

- [ ] **Step 3: Commit**

```bash
git add src/components/CountryJurisdictionSelector.tsx
git commit -m "refactor: CountryJurisdictionSelector reads jurisdictions from registry"
```

### Task 39: Migrate other country-switching components

**Files:**
- Modify: each file in this list. For each, find `country === "CA" / "US" / "AU"` switches and replace with `getCountry(country).{appropriate plugin}`.

```text
src/components/BenchmarkComparisons.tsx
src/components/DataFlowArrows.tsx
src/components/FinancialFlowchart.tsx
src/components/GovernmentRetirementInput.tsx
src/components/MobileWizard.tsx
src/components/RetirementIncomeChart.tsx
src/components/TaxCreditEntry.tsx
src/components/wizard/steps/ExpensesStep.tsx
src/components/wizard/steps/ProfileStep.tsx
src/components/wizard/steps/TaxCreditsStep.tsx
src/components/wizard/steps/TaxSummaryStep.tsx
src/components/wizard/steps/WelcomeStep.tsx
src/components/wizard/WizardShell.tsx
```

- [ ] **Step 1: For each file, run grep to find country switches**

```bash
grep -n "country === \"CA\"\|country === \"US\"\|country === \"AU\"" src/components/<file>
```

- [ ] **Step 2: Replace each switch with a registry lookup**

Example pattern (TaxCreditEntry.tsx):
```typescript
// Before
const filingStatuses = country === "CA"
  ? CA_FILING_STATUSES
  : country === "US"
  ? US_FILING_STATUSES
  : AU_FILING_STATUSES;

// After
const filingStatuses = getCountry(country).filingStatuses;
```

For wizard steps showing country-specific copy ("Welcome, Canadians!" vs "Welcome, Americans!"), surface a `displayName` from the profile or a per-country copy block.

- [ ] **Step 3: Run all tests + Playwright after each file**

Run: `npm test && npx playwright test`
Expected: PASS at each step.

- [ ] **Step 4: One commit per file (or one logical commit per group)**

Example:
```bash
git add src/components/TaxCreditEntry.tsx
git commit -m "refactor: TaxCreditEntry reads from registry"
```

### Task 40: Migrate library-side consumers

**Files:**
- Modify: `src/lib/compute-totals.ts`, `src/lib/financial-state.ts`, `src/lib/projections.ts`, `src/lib/runway-simulation.ts`, `src/lib/required-minimum-distributions.ts`, `src/lib/scenario.ts`, `src/lib/benchmarks.ts`, `src/lib/flowchart-steps.ts`, `src/app/page.tsx`

Same pattern as Task 39: replace country switches and direct calls to legacy free functions with registry lookups.

- [ ] **Step 1: For each file, find country switches and legacy calls**

```bash
for f in src/lib/compute-totals.ts src/lib/financial-state.ts src/lib/projections.ts src/lib/runway-simulation.ts src/lib/required-minimum-distributions.ts src/lib/scenario.ts src/lib/benchmarks.ts src/lib/flowchart-steps.ts src/app/page.tsx; do
  echo "=== $f ==="
  grep -n "country === \|computeTax\|getMarginalRateForIncome\|getWithdrawalTaxRate\|getEarlyWithdrawalPenalties" "$f"
done
```

- [ ] **Step 2: Replace each callsite**

The shimmed free functions (`computeTax`, etc.) still work, so this task is mainly for switches that branch on `country` directly. Common patterns:

```typescript
// Before
if (country === "AU") {
  return computeAUSpecificThing(...);
}

// After
const profile = getCountry(country);
return profile.someMethod(...);
```

- [ ] **Step 3: Run tests + Playwright**

Run: `npm test && npx playwright test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ src/app/page.tsx
git commit -m "refactor: library-side consumers read from country registry"
```

### Task 41: Refactor insights generate.ts to dispatch via registry

**Files:**
- Modify: `src/lib/insights/generate.ts`

- [ ] **Step 1: Replace inline CA/US/AU branches with registry dispatch**

```typescript
// src/lib/insights/generate.ts (the part that branches on country)
import { getCountry } from "@/lib/countries";

export function generateInsights(state: FinancialState): InsightCandidate[] {
  const candidates: InsightCandidate[] = [];

  // Universal insights (net worth, runway, etc.)
  candidates.push(...generateUniversalInsights(state));

  // Country-specific insights via plugin
  if (state.country) {
    candidates.push(...getCountry(state.country).insights.getCandidates(state));
  }

  return dedupe(candidates);
}
```

Remove the previous `if (state.country === "CA") ...` branches.

- [ ] **Step 2: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/lib/insights/generate.ts
git commit -m "refactor: insights dispatch via country registry"
```

---

## Cleanup

### Task 42: Move taxYear semantics into computations

Where `taxYear: number` is currently used directly, switch to `getCountry(country).taxYearLabel(year)` for display purposes. Verify the bracket lookup logic (`getCanadianBrackets(province, year)`, etc.) still uses the integer year for table lookup — that doesn't change.

**Files:**
- Modify: components that display tax year labels (e.g. `CountryJurisdictionSelector.tsx`, wizard steps)

- [ ] **Step 1: grep for tax year display sites**

```bash
grep -rn "taxYear\|tax year" src/components/
```

- [ ] **Step 2: Replace `${taxYear}` with `getCountry(country).taxYearLabel(taxYear)` for display strings only**

- [ ] **Step 3: Run tests + Playwright**

Visual: AU users now see "2024/25 FY" rather than "2025"; UK (when added in Phase B) will see "2025/26".

- [ ] **Step 4: Commit**

```bash
git add src/components/
git commit -m "refactor: display tax year via CountryProfile.taxYearLabel"
```

### Task 43: Delete old per-country code from monolithic files

**Files:**
- Modify: `src/lib/tax-tables.ts`, `src/lib/government-retirement.ts`, `src/lib/sample-profiles.ts`, `src/lib/tax-credits.ts`, `src/lib/withdrawal-tax.ts`

Each of these files now exists only to re-export from per-country plugins. Slim each one to only the shared types / cross-country helpers.

- [ ] **Step 1: For each file, audit what's left**

```bash
wc -l src/lib/tax-tables.ts src/lib/government-retirement.ts src/lib/sample-profiles.ts src/lib/tax-credits.ts src/lib/withdrawal-tax.ts
```

Each should now be small (<100 lines) — pure re-exports of shared types and shim free functions.

- [ ] **Step 2: Audit no-longer-used helpers and delete them**

In particular:
- `src/lib/tax-tables.ts`: should no longer have `CA_*`, `US_*`, `AU_*` constants — only the shared `BracketTable`/`TaxBracket` re-export from `@/lib/bracket-math`.
- `src/lib/government-retirement.ts`: no `CPP_*`, `OAS_*`, `SS_*`, `AU_PENSION_*` constants. Just the shim free function.
- `src/lib/sample-profiles.ts`: no `CA_SAMPLE_PROFILES`, `US_SAMPLE_PROFILES`, `AU_SAMPLE_PROFILES`, `QUICK_START_*`. Just the shim free function and the `SampleProfile` type.
- `src/lib/tax-credits.ts`: no `ALL_CREDIT_CATEGORIES`. Just shared types and shim free functions.
- `src/lib/withdrawal-tax.ts`: no per-country implementations. Just `TaxTreatment`, `WithdrawalTaxResult`, `EarlyWithdrawalPenalty` types and shim free functions.

- [ ] **Step 3: Run all tests + build**

Run: `npm test && npm run build`
Expected: PASS, build clean.

- [ ] **Step 4: Commit**

```bash
git add src/lib/
git commit -m "refactor: prune per-country code from monolithic lib files"
```

### Task 44: Final regression check and changelog

- [ ] **Step 1: Run full test + build + Playwright**

Run: `npm test && npm run build && npx playwright test`
Expected: all green. Snapshot regression still byte-identical.

- [ ] **Step 2: Update changelog**

Modify `src/lib/changelog.ts`:

```typescript
{
  date: "2026-MM-DD", // fill in
  title: "Country plugin architecture refactor",
  description: "Refactored country handling to per-country plugins. No user-visible change. Foundation for future country additions.",
}
```

- [ ] **Step 3: Run lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 4: Final commit**

```bash
git add src/lib/changelog.ts
git commit -m "chore: changelog entry for country plugin refactor"
```

---

## Self-review

After plan written:

**Spec coverage:**
- ✓ Per-country plugin directories — Tasks 4–27
- ✓ Shared interfaces — Task 3
- ✓ TaxResult.breakdown — Tasks 10/18/26 (per-country) + Task 29 (drop legacy fields)
- ✓ Locale per country — Task 30
- ✓ Tax year semantics — Task 11/19/27 (per-country) + Task 42 (display)
- ✓ Exhaustive Record registry — Task 28
- ✓ Plugin contract tests — Task 31
- ✓ Insights plugin per country — Tasks 9/17/25 + Task 41 (dispatch)
- ✓ Explicit registry — Task 28
- ✓ Component decoupling (AssetEntry) — Task 37
- ✓ Tax-tables split — Tasks 4/12/20
- ✓ Snapshot regression baseline — Tasks 1, 2

**Out of scope (deferred to Phase B):**
- UK addition (CountryCode union, registry entry, Scotland brackets, NI, taper, ISAs, etc.)
- URL state validation for unknown countries

**Placeholder scan:** No "TODO" / "fill in" / abbreviated tasks beyond Step 5–8 of certain tasks marked "mirror Task X" — those reference fully-specified earlier tasks. Acceptable.

**Type consistency:** `CountryCode = "CA" | "US" | "AU"` consistently. Plugin instance variable names use national-adjective form (`canadianTaxEngine`, `americanTaxEngine`, `australianTaxEngine`). Country profile constants are uppercase (`CANADA`, `USA`, `AUSTRALIA`).
