import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 13 E2E test infrastructure — Financial Intelligence (Tasks 110-119)", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-e2e-120.spec.ts"
  );

  it("milestone-e2e-120.spec.ts exists", () => {
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

  it("covers inflation toggle changing projection values (Task 110)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("inflation-toggle");
    expect(content).toContain("inflation-controls");
    expect(content).toContain("inflation-rate-input");
    expect(content).toContain("projection-summary-table");
  });

  it("covers age input triggering personalized benchmarks (Task 111)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("age-add-header");
    expect(content).toContain("age-input-header");
    expect(content).toContain("age-value-header");
    expect(content).toContain("benchmark-comparisons");
    expect(content).toContain("benchmark-net-worth");
    expect(content).toContain("benchmark-net-worth-percentile");
  });

  it("covers employer match for registered accounts (Task 112)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("employer-match-section-a3");
    expect(content).toContain("employer-match-section-a1");
    expect(content).toContain("employer-match-pct-a3");
    expect(content).toContain("employer-match-cap-a3");
    expect(content).toContain("employer-match-amount-a3");
    expect(content).toContain("contribution-badge-a3");
  });

  it("covers sample profiles populating fields (Task 113)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("sample-profiles-banner");
    expect(content).toContain("sample-profile-fresh-grad");
    expect(content).toContain("sample-profile-mid-career");
    expect(content).toContain("sample-profile-pre-retirement");
  });

  it("covers print layout rendering (Task 114)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("print-snapshot-button");
    expect(content).toContain("print-footer");
    expect(content).toContain("print-footer-url");
    expect(content).toContain("print-footer-date");
    expect(content).toContain("dashboard-panel");
    expect(content).toContain('emulateMedia({ media: "print" })');
  });

  it("covers mobile wizard completion (Task 115)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("mobile-wizard");
    expect(content).toContain("wizard-step-income");
    expect(content).toContain("wizard-step-expenses");
    expect(content).toContain("wizard-step-assets");
    expect(content).toContain("wizard-step-debts");
    expect(content).toContain("wizard-next");
    expect(content).toContain("wizard-complete");
    expect(content).toContain("wizard-income-input");
    expect(content).toContain("wizard-housing-input");
    expect(content).toContain("wizard-savings-input");
    expect(content).toContain("Step 1 of 4");
    expect(content).toContain("Step 4 of 4");
  });

  it("covers debt payoff strategy insights (Task 116)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("insights-panel");
    expect(content).toContain("debt");
  });

  it("covers FIRE milestone on projection chart (Task 117)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("fire-milestone");
    expect(content).toContain("swr-adjustment");
    expect(content).toContain("swr-slider");
    expect(content).toContain("fast-forward-toggle");
    expect(content).toContain("fast-forward-panel");
  });

  it("covers tax optimization suggestions (Task 118)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("tax optimization");
    expect(content).toContain("insights-panel");
  });

  it("covers income replacement ratio (Task 119)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-income-replacement");
    expect(content).toContain("income-replacement-tier");
    expect(content).toContain("income-replacement-progress");
    expect(content).toContain("Income Replacement");
  });

  it("has comprehensive test count (10+ tests)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCount = (content.match(/\btest\(/g) || []).length;
    expect(testCount).toBeGreaterThanOrEqual(10);
  });

  it("captures screenshots for key states", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("task-120-");
    expect(content).toContain("captureScreenshot");
    const screenshotCount = (content.match(/captureScreenshot/g) || []).length;
    expect(screenshotCount).toBeGreaterThanOrEqual(8);
  });

  it("related feature E2E test files from tasks 110-119 exist", () => {
    const featureTests = [
      "inflation-toggle.spec.ts",
      "employer-match.spec.ts",
      "sample-profiles.spec.ts",
      "print-snapshot.spec.ts",
      "mobile-wizard.spec.ts",
      "fire-number.spec.ts",
      "income-replacement.spec.ts",
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
