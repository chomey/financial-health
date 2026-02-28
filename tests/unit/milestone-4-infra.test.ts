import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";

describe("Milestone 4 E2E infrastructure verification", () => {
  const E2E_DIR = path.join(process.cwd(), "tests", "e2e");
  const UNIT_DIR = path.join(process.cwd(), "tests", "unit");

  it("milestone-4-e2e.spec.ts exists in e2e directory", () => {
    const specPath = path.join(E2E_DIR, "milestone-4-e2e.spec.ts");
    expect(fs.existsSync(specPath)).toBe(true);
  });

  it("all feature-specific e2e test files from tasks 37-45 are present", () => {
    const expectedFiles = [
      "country-jurisdiction.spec.ts",
      "income-type.spec.ts",
      "tax-metrics.spec.ts",
      "tax-summary.spec.ts",
    ];
    for (const file of expectedFiles) {
      expect(
        fs.existsSync(path.join(E2E_DIR, file)),
        `${file} should exist`
      ).toBe(true);
    }
  });

  it("all feature-specific unit test files from tasks 37-45 are present", () => {
    const expectedFiles = [
      "tax-tables.test.ts",
      "tax-engine.test.ts",
      "tax-summary.test.ts",
      "country-jurisdiction-selector.test.tsx",
    ];
    for (const file of expectedFiles) {
      expect(
        fs.existsSync(path.join(UNIT_DIR, file)),
        `${file} should exist`
      ).toBe(true);
    }
  });

  it("tax-engine exports computeTax and TaxResult", async () => {
    const taxEngine = await import("@/lib/tax-engine");
    expect(typeof taxEngine.computeTax).toBe("function");
  });

  it("tax-tables exports getCanadianBrackets and getUSBrackets", async () => {
    const taxTables = await import("@/lib/tax-tables");
    expect(typeof taxTables.getCanadianBrackets).toBe("function");
    expect(typeof taxTables.getUSBrackets).toBe("function");
  });

  it("financial-state includes country and jurisdiction in INITIAL_STATE", async () => {
    const { INITIAL_STATE } = await import("@/lib/financial-state");
    expect(INITIAL_STATE.country).toBe("CA");
    expect(INITIAL_STATE.jurisdiction).toBe("ON");
  });

  it("computeTotals returns after-tax fields", async () => {
    const { INITIAL_STATE, computeTotals } = await import(
      "@/lib/financial-state"
    );
    const totals = computeTotals(INITIAL_STATE);
    expect(totals).toHaveProperty("monthlyAfterTaxIncome");
    expect(totals).toHaveProperty("totalTaxEstimate");
    expect(totals).toHaveProperty("effectiveTaxRate");
  });

  it("url-state encodes country and jurisdiction", async () => {
    const { toCompact, fromCompact } = await import("@/lib/url-state");
    const { INITIAL_STATE } = await import("@/lib/financial-state");
    const state = { ...INITIAL_STATE, country: "US" as const, jurisdiction: "NY" };
    const compact = toCompact(state);
    expect(compact.co).toBe("US");
    expect(compact.ju).toBe("NY");
    const restored = fromCompact(compact);
    expect(restored.country).toBe("US");
    expect(restored.jurisdiction).toBe("NY");
  });
});
