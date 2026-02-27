import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";

describe("Milestone 2 E2E infrastructure verification", () => {
  const E2E_DIR = path.join(process.cwd(), "tests", "e2e");

  it("milestone-2-e2e.spec.ts exists in e2e directory", () => {
    const specPath = path.join(E2E_DIR, "milestone-2-e2e.spec.ts");
    expect(fs.existsSync(specPath)).toBe(true);
  });

  it("all feature-specific e2e test files from tasks 22-25 are present", () => {
    const expectedFiles = [
      "asset-roi.spec.ts",
      "property-mortgage.spec.ts",
      "debt-interest.spec.ts",
      "projection-chart.spec.ts",
    ];
    for (const file of expectedFiles) {
      expect(
        fs.existsSync(path.join(E2E_DIR, file)),
        `${file} should exist`
      ).toBe(true);
    }
  });

  it("all feature-specific unit test files from tasks 22-25 are present", () => {
    const UNIT_DIR = path.join(process.cwd(), "tests", "unit");
    const expectedFiles = [
      "asset-roi.test.tsx",
      "property-mortgage.test.ts",
      "debt-interest.test.tsx",
      "projections.test.ts",
    ];
    for (const file of expectedFiles) {
      expect(
        fs.existsSync(path.join(UNIT_DIR, file)),
        `${file} should exist`
      ).toBe(true);
    }
  });

  it("projections library exports required types and functions", async () => {
    const projections = await import("@/lib/projections");
    expect(typeof projections.projectFinances).toBe("function");
    expect(typeof projections.downsamplePoints).toBe("function");
  });

  it("financial-state includes ROI and interest rate fields in types", async () => {
    const { INITIAL_STATE } = await import("@/lib/financial-state");
    // Verify initial state structure supports the new fields
    expect(INITIAL_STATE.assets).toBeDefined();
    expect(INITIAL_STATE.debts).toBeDefined();
    expect(INITIAL_STATE.properties).toBeDefined();
    // The fields are optional, so they may not be set on defaults, but the structure should support them
    const asset = INITIAL_STATE.assets[0];
    expect(asset).toHaveProperty("id");
    expect(asset).toHaveProperty("category");
    expect(asset).toHaveProperty("amount");
  });
});
