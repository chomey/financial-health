import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 12 E2E test infrastructure — UI Polish & Formula Validation", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-e2e-109.spec.ts"
  );

  it("milestone-e2e-109.spec.ts exists", () => {
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

  it("covers tax bracket tiered fill bars with proportional fills", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax-federal-brackets-table");
    expect(content).toContain("tax-federal-brackets-fill-");
    expect(content).toContain("tax-provincial-brackets-table");
    expect(content).toContain("tax-provincial-brackets-fill-");
    expect(content).toContain("tax-provincial-brackets-subtotal");
  });

  it("covers explainer modals with full currency format (no k abbreviation)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("explainer-value");
    expect(content).toContain("explainer-sources");
    expect(content).toContain("explainer-result-value");
    // Verifies no "k" abbreviation
    expect(content).toContain("not.toMatch");
    expect(content).toContain("/\\d+k/i");
  });

  it("covers net worth donut chart with segments and legend", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("donut-chart");
    expect(content).toContain("donut-center-label");
    expect(content).toContain("donut-legend");
    expect(content).toContain("svg");
  });

  it("covers cash flow Sankey with investment interest income nodes", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("cash-flow-toggle");
    expect(content).toContain("sankey-chart");
    expect(content).toContain("sankey-legend-investment-income");
    expect(content).toContain("sankey-node-after-tax");
  });

  it("covers Fast Forward panel with new scenario options", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("fast-forward-toggle");
    expect(content).toContain("fast-forward-panel");
    expect(content).toContain("scenario-presets");
    expect(content).toContain("preset-conservative");
    expect(content).toContain("preset-aggressive-saver");
    expect(content).toContain("preset-early-retirement");
    expect(content).toContain("retire-today");
    expect(content).toContain("retire-today-checkbox");
    expect(content).toContain("max-tax-sheltered");
    expect(content).toContain("roi-adjustment");
    expect(content).toContain("roi-adjustment-slider");
    expect(content).toContain("runway-estimate");
  });

  it("covers metric card values matching explainer breakdowns", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-net-worth");
    expect(content).toContain("metric-card-estimated-tax");
    expect(content).toContain("metric-card-financial-runway");
    expect(content).toContain("metric-card-monthly-surplus");
    expect(content).toContain("metric-card-debt-to-asset-ratio");
    expect(content).toContain("explainer-result-section");
    expect(content).toContain("explainer-summary");
    expect(content).toContain("tax-federal-amount");
    expect(content).toContain("tax-provincial-amount");
    expect(content).toContain("tax-effective-rate");
    expect(content).toContain("tax-marginal-rate");
  });

  it("has comprehensive test count (10+ tests)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCount = (content.match(/\btest\(/g) || []).length;
    expect(testCount).toBeGreaterThanOrEqual(10);
  });

  it("captures screenshots for key states", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("task-109-");
    expect(content).toContain("captureScreenshot");
    const screenshotCount = (content.match(/captureScreenshot/g) || []).length;
    expect(screenshotCount).toBeGreaterThanOrEqual(5);
  });

  it("related feature E2E test files from recent tasks exist", () => {
    const featureTests = [
      "donut-chart.spec.ts",
      "sankey-investment-returns.spec.ts",
      "fast-forward-enhanced.spec.ts",
      "formula-validation.spec.ts",
    ];
    const e2eDir = path.join(__dirname, "..", "e2e");
    for (const file of featureTests) {
      expect(
        fs.existsSync(path.join(e2eDir, file)),
        `${file} should exist`
      ).toBe(true);
    }
  });
});
