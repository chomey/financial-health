import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 5 E2E test infrastructure", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-5-e2e.spec.ts"
  );

  it("milestone-5-e2e.spec.ts exists", () => {
    expect(fs.existsSync(e2eTestPath)).toBe(true);
  });

  it("milestone-5-e2e.spec.ts imports test and expect from playwright", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('from "@playwright/test"');
    expect(content).toContain("import { test, expect }");
  });

  it("milestone-5-e2e.spec.ts imports captureScreenshot helper", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('import { captureScreenshot } from "./helpers"');
  });

  it("milestone-5-e2e.spec.ts covers all 7 visualization features", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    // Task 48: Asset allocation chart
    expect(content).toContain("allocation-chart");
    // Task 49: Expense breakdown
    expect(content).toContain("expense-breakdown-chart");
    // Task 50: Waterfall chart
    expect(content).toContain("waterfall-chart");
    // Task 51: Fast forward panel
    expect(content).toContain("fast-forward-panel");
    // Task 52: Benchmark comparisons
    expect(content).toContain("benchmark-comparisons");
    // Task 53: Sankey diagram
    expect(content).toContain("sankey-chart");
    // Task 54: Stock ROI
    expect(content).toContain("portfolio-summary");
  });

  it("milestone-5-e2e.spec.ts captures screenshots at key steps", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const screenshotCalls = content.match(/captureScreenshot\(/g);
    expect(screenshotCalls).not.toBeNull();
    // Should have at least 10 screenshot capture points
    expect(screenshotCalls!.length).toBeGreaterThanOrEqual(10);
  });

  it("milestone-5-e2e.spec.ts has multiple focused tests plus a full journey", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCalls = content.match(/\btest\(/g);
    expect(testCalls).not.toBeNull();
    // Full journey + 6 focused tests = at least 7
    expect(testCalls!.length).toBeGreaterThanOrEqual(7);
  });

  it("milestone-5-e2e.spec.ts has adequate timeout for complex E2E", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("test.setTimeout(120000)");
  });

  it("screenshots directory exists", () => {
    const screenshotsDir = path.join(__dirname, "..", "..", "screenshots");
    expect(fs.existsSync(screenshotsDir)).toBe(true);
  });
});
