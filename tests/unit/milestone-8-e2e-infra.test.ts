import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 8 E2E test infrastructure — Data-Flow Arrow Visualization", () => {
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

  it("covers Net Worth card hover with arrows", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-net-worth");
    expect(content).toContain("section-assets");
    expect(content).toContain("section-debts");
  });

  it("covers Monthly Surplus card hover with arrows", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-monthly-surplus");
    expect(content).toContain("section-income");
    expect(content).toContain("section-expenses");
  });

  it("covers Estimated Tax, Financial Runway, and Debt-to-Asset Ratio cards", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-estimated-tax");
    expect(content).toContain("metric-card-financial-runway");
    expect(content).toContain("metric-card-debt-to-asset-ratio");
  });

  it("covers insight card hover with arrows", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("data-insight-type");
    expect(content).toContain("insights-panel");
  });

  it("verifies arrows disappear on mouse leave", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("mouse.move(0, 0)");
    expect(content).toContain('toHaveCSS("opacity", "0"');
    expect(content).toContain("toHaveCount(0");
  });

  it("tests source section highlight values (positive/negative)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('"positive"');
    expect(content).toContain('"negative"');
    expect(content).toContain("data-dataflow-highlighted");
  });

  it("tests collapsed section arrow behavior", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("collapsed");
    expect(content).toContain("aria-expanded");
  });

  it("tests mobile viewport highlight-only mode", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("setViewportSize");
    expect(content).toContain("375");
    expect(content).toContain("mobile");
  });

  it("tests arrows update when financial data changes", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("data change");
    expect(content).toContain("add");
  });

  it("tests keyboard focus activates arrows (accessibility)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain(".focus()");
    expect(content).toContain("dataflow-aria-live");
    expect(content).toContain("keyboard");
  });

  it("has correct number of test cases covering all task 76 requirements", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCount = (content.match(/\btest\(/g) || []).length;
    expect(testCount).toBeGreaterThanOrEqual(9);
  });

  it("includes screenshot capture calls for visual verification", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const screenshotCount = (
      content.match(/captureScreenshot/g) || []
    ).length;
    expect(screenshotCount).toBeGreaterThanOrEqual(8);
  });

  // Verify feature test files from tasks 69-75 exist
  it("all data-flow arrow feature test files exist", () => {
    const featureTests = [
      "data-flow-arrows.spec.ts",
      "data-flow-sources.spec.ts",
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

  // Verify DataFlowArrows module exports
  it("DataFlowArrows module exports required functions", async () => {
    const mod = await import("@/components/DataFlowArrows");
    expect(mod.DataFlowProvider).toBeDefined();
    expect(mod.SpotlightOverlay).toBeDefined();
    expect(mod.FormulaBar).toBeDefined();
    expect(mod.prioritizeConnections).toBeDefined();
  });
});
