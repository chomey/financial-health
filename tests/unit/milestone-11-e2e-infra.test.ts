import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 11 E2E test infrastructure — Unified Chart & Final Enhancements", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-11-e2e.spec.ts"
  );

  it("milestone-11-e2e.spec.ts exists", () => {
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

  it("covers unified chart with mode tabs", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("chart-mode-tabs");
    expect(content).toContain("mode-keep-earning");
    expect(content).toContain("mode-income-stops");
    expect(content).toContain("projection-summary-table");
  });

  it("covers 50-year chart with 40yr/50yr columns", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("40yr");
    expect(content).toContain("50yr");
    expect(content).toContain("asset-projections-table");
  });

  it("covers dual bracket tables (federal and provincial)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax-federal-brackets-table");
    expect(content).toContain("tax-provincial-brackets-table");
    expect(content).toContain("tax-federal-brackets-subtotal");
    expect(content).toContain("tax-provincial-brackets-subtotal");
  });

  it("covers investment income tax in explainer", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax-investment-income");
    expect(content).toContain("tax-investment-account-0");
  });

  it("covers withdrawal tax merged into runway explainer", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("runway-withdrawal-tax");
    expect(content).toContain("Suggested Withdrawal Order");
    expect(content).toContain("withdrawal-order-disclaimer");
    expect(content).toContain("runway-chart-note");
    expect(content).toContain("Income Stops");
  });

  it("covers $0 income tax explainer", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax-zero-income-message");
    expect(content).toContain("CA$0");
  });

  it("covers ROI tax treatment toggle", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("roi-tax-treatment-");
    expect(content).toContain("Interest income");
    expect(content).toContain("Capital gains");
    expect(content).toContain("Savings Account");
    expect(content).toContain("TFSA");
  });

  it("covers scrollable source summary cards", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("source-summary-items-section-assets");
    expect(content).toContain("source-summary-total-row-section-assets");
    expect(content).toContain("overflowY");
    expect(content).toContain("sticky");
  });

  it("covers modal close mechanisms (Escape, X, backdrop)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('press("Escape")');
    expect(content).toContain("explainer-close");
    expect(content).toContain("explainer-backdrop");
  });

  it("includes full multi-step journey test", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("Full multi-step journey");
    expect(content).toContain("complete flow");
  });

  it("has comprehensive test count (10+ tests)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCount = (content.match(/\btest\(/g) || []).length;
    expect(testCount).toBeGreaterThanOrEqual(10);
  });

  it("captures screenshots for key states", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("task-101-");
    expect(content).toContain("captureScreenshot");
    const screenshotCount = (content.match(/captureScreenshot/g) || []).length;
    expect(screenshotCount).toBeGreaterThanOrEqual(5);
  });

  it("related feature E2E test files exist", () => {
    const featureTests = [
      "unified-50yr-chart.spec.ts",
      "runway-burndown-main.spec.ts",
      "investment-income-tax.spec.ts",
      "tax-explainer.spec.ts",
      "roi-tax-treatment.spec.ts",
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
