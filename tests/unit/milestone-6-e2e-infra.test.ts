import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { getTaxTreatment, getWithdrawalTaxRate } from "@/lib/withdrawal-tax";

describe("Milestone 6 E2E test infrastructure", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-6-e2e.spec.ts"
  );

  it("milestone-6-e2e.spec.ts exists", () => {
    expect(fs.existsSync(e2eTestPath)).toBe(true);
  });

  it("milestone-6-e2e.spec.ts imports test and expect from playwright", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('from "@playwright/test"');
    expect(content).toContain("import { test, expect }");
  });

  it("milestone-6-e2e.spec.ts imports captureScreenshot helper", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('import { captureScreenshot } from "./helpers"');
  });

  it("covers account tax treatment classification", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax-free");
    expect(content).toContain("tax-deferred");
    expect(content).toContain("taxable");
  });

  it("covers withdrawal tax summary component", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("withdrawal-tax-summary");
  });

  it("covers cost basis percent for brokerage accounts", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("cost-basis");
  });

  it("covers runway with vs without withdrawal tax", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("burndown-tax-drag");
  });

  it("covers both CA and US jurisdictions", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toMatch(/country.*US|US.*country/i);
    expect(content).toContain("jurisdiction");
  });

  it("captures screenshots at key steps", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const screenshotCalls = content.match(/captureScreenshot\(/g);
    expect(screenshotCalls).not.toBeNull();
    expect(screenshotCalls!.length).toBeGreaterThanOrEqual(8);
  });

  it("has multiple focused tests", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCalls = content.match(/\btest\(/g);
    expect(testCalls).not.toBeNull();
    expect(testCalls!.length).toBeGreaterThanOrEqual(4);
  });

  it("has adequate timeout for complex E2E", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toMatch(/test\.setTimeout\(\d{5,}\)/);
  });

  it("withdrawal-tax feature test files exist", () => {
    const testsDir = path.join(__dirname, "..", "e2e");
    expect(fs.existsSync(path.join(testsDir, "withdrawal-tax-summary.spec.ts"))).toBe(true);
    expect(fs.existsSync(path.join(testsDir, "withdrawal-tax-runway.spec.ts"))).toBe(true);
    expect(fs.existsSync(path.join(testsDir, "cost-basis.spec.ts"))).toBe(true);
    expect(fs.existsSync(path.join(testsDir, "projection-drawdown-tax.spec.ts"))).toBe(true);
  });

  it("withdrawal-tax module exports exist", () => {
    expect(typeof getTaxTreatment).toBe("function");
    expect(typeof getWithdrawalTaxRate).toBe("function");
  });
});
