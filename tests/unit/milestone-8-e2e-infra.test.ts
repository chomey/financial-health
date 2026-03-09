import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 8 E2E test infrastructure — Data-Flow Visualization", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-8-e2e.spec.ts"
  );

  it("milestone-8-e2e.spec.ts exists", () => {
    expect(fs.existsSync(e2eTestPath)).toBe(true);
  });

  it("imports test and expect from playwright", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('from "@playwright/test"');
    expect(content).toContain("import { test, expect }");
  });

  it("imports captureScreenshot helper", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain(
      'import { captureScreenshot } from "./helpers"'
    );
  });

  it("covers Net Worth card with source references", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-net-worth");
    expect(content).toContain("section-assets");
    expect(content).toContain("section-debts");
  });

  it("covers Monthly Cash Flow card with source references", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-monthly-cash-flow");
    expect(content).toContain("section-income");
    expect(content).toContain("section-expenses");
  });

  it("covers Estimated Tax, Financial Runway, and Debt-to-Asset Ratio cards", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-estimated-tax");
    expect(content).toContain("metric-card-financial-runway");
    expect(content).toContain("metric-card-debt-to-asset-ratio");
  });

  it("covers insight card interactions", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("data-insight-type");
    expect(content).toContain("insights-panel");
  });

  it("has correct number of test cases", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCount = (content.match(/\btest\(/g) || []).length;
    expect(testCount).toBeGreaterThanOrEqual(9);
  });

  it("includes screenshot capture calls", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const screenshotCount = (
      content.match(/captureScreenshot/g) || []
    ).length;
    expect(screenshotCount).toBeGreaterThanOrEqual(8);
  });

  it("all data-flow feature test files exist", () => {
    const featureTests = [
      "data-flow-arrows.spec.ts",
      // data-flow-sources.spec.ts removed — section-level sources removed from UI
      "net-worth-data-flow.spec.ts",
      "monthly-surplus-data-flow.spec.ts",
      "remaining-metric-data-flow.spec.ts",
      "insight-data-flow.spec.ts",
      "arrow-polish.spec.ts",
    ];
    const e2eDir = path.join(__dirname, "..", "e2e");
    for (const file of featureTests) {
      expect(
        fs.existsSync(path.join(e2eDir, file)),
        `${file} should exist`
      ).toBe(true);
    }
  });

  it("DataFlowArrows module exports required functions", async () => {
    const mod = await import("@/components/DataFlowArrows");
    expect(mod.DataFlowProvider).toBeDefined();
    expect(mod.ExplainerModal).toBeDefined();
    expect(mod.handDrawnOval).toBeDefined();
    expect(mod.handDrawnLine).toBeDefined();
    expect(mod.prioritizeConnections).toBeDefined();
  });
});
