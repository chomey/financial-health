import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";

describe("Milestone E2E infrastructure verification", () => {
  const E2E_DIR = path.join(process.cwd(), "tests", "e2e");
  const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

  it("e2e test directory exists", () => {
    expect(fs.existsSync(E2E_DIR)).toBe(true);
  });

  it("screenshots directory exists", () => {
    expect(fs.existsSync(SCREENSHOTS_DIR)).toBe(true);
  });

  it("helpers.ts exists in e2e directory", () => {
    const helperPath = path.join(E2E_DIR, "helpers.ts");
    expect(fs.existsSync(helperPath)).toBe(true);
  });

  it("milestone-e2e.spec.ts exists in e2e directory", () => {
    const specPath = path.join(E2E_DIR, "milestone-e2e.spec.ts");
    expect(fs.existsSync(specPath)).toBe(true);
  });

  it("playwright.config.ts exists in project root", () => {
    const configPath = path.join(process.cwd(), "playwright.config.ts");
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it("all expected e2e test files are present", () => {
    const expectedFiles = [
      "smoke.spec.ts",
      "app-shell.spec.ts",
      "asset-entry.spec.ts",
      "debt-entry.spec.ts",
      "income-entry.spec.ts",
      "expense-entry.spec.ts",
      "goal-entry.spec.ts",
      "snapshot-dashboard.spec.ts",
      "insights-panel.spec.ts",
      "shared-state.spec.ts",
      "full-e2e.spec.ts",
      "url-state.spec.ts",

      "micro-interactions.spec.ts",
      "mobile-responsive.spec.ts",
      "milestone-e2e.spec.ts",
    ];
    for (const file of expectedFiles) {
      expect(
        fs.existsSync(path.join(E2E_DIR, file)),
        `${file} should exist`
      ).toBe(true);
    }
  });

  it(".gitattributes tracks image files via Git LFS", () => {
    const gitattributesPath = path.join(process.cwd(), ".gitattributes");
    expect(fs.existsSync(gitattributesPath)).toBe(true);
    const content = fs.readFileSync(gitattributesPath, "utf-8");
    expect(content).toContain("*.png");
    expect(content).toContain("filter=lfs");
  });
});
