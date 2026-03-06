import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 10 E2E test infrastructure — Explainer & Tax Treatment Enhancements", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-10-e2e.spec.ts"
  );

  it("milestone-10-e2e.spec.ts exists", () => {
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

  it("covers withdrawal tax auto-expanded details", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("withdrawal-tax-summary");
    expect(content).toContain("withdrawal-tax-details");
    expect(content).toContain("Suggested withdrawal order");
    expect(content).toContain("withdrawal-order-disclaimer");
  });

  it("covers $0 income tax explainer", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax-zero-income-message");
    expect(content).toContain("tax-federal-brackets-table");
    expect(content).toContain("CA$0");
    expect(content).toContain("No income entered");
  });

  it("covers runway burndown chart on main page", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("runway-burndown-main");
    expect(content).toContain("burndown-summary");
    expect(content).toContain("burndown-legend");
    expect(content).toContain("burndown-starting-balances");
    expect(content).toContain("burndown-withdrawal-order");
    expect(content).toContain("runway-chart-note");
  });

  it("covers tax bracket visualization with income", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax-explainer");
    expect(content).toContain("tax-bracket-bar");
    expect(content).toContain("tax-bracket-segment-");
    expect(content).toContain("tax-breakdown");
    expect(content).toContain("tax-federal-amount");
    expect(content).toContain("tax-provincial-amount");
    expect(content).toContain("tax-effective-rate");
    expect(content).toContain("tax-marginal-rate");
    expect(content).toContain("tax-after-tax-flow");
  });

  it("covers ROI tax treatment toggle", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("roi-tax-treatment-");
    expect(content).toContain("Interest income");
    expect(content).toContain("Capital gains");
    expect(content).toContain("Savings Account");
    expect(content).toContain("TFSA");
  });

  it("covers scrollable source summary cards with sticky total", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("source-summary-items-section-assets");
    expect(content).toContain("source-summary-total-row-section-assets");
    expect(content).toContain("overflowY");
    expect(content).toContain("sticky");
    expect(content).toContain("max-w-xl");
  });

  it("covers all three modal close mechanisms", () => {
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
    expect(content).toContain("task-96-");
    expect(content).toContain("captureScreenshot");
    const screenshotCount = (content.match(/captureScreenshot/g) || []).length;
    expect(screenshotCount).toBeGreaterThanOrEqual(5);
  });

  it("related feature E2E test files exist", () => {
    const featureTests = [
      "withdrawal-tax-summary.spec.ts",
      "tax-explainer.spec.ts",
      "runway-burndown-main.spec.ts",
      "roi-tax-treatment.spec.ts",
      "source-summary-cards.spec.ts",
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
