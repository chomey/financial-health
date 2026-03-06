import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Spotlight Dimming E2E test infrastructure", () => {
  const e2eDir = path.resolve(__dirname, "../e2e");
  const specFile = path.join(e2eDir, "spotlight-dimming-e2e.spec.ts");

  test("spotlight-dimming-e2e.spec.ts exists", () => {
    expect(fs.existsSync(specFile)).toBe(true);
  });

  test("spec file imports Playwright test and expect", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain('from "@playwright/test"');
    expect(content).toContain("captureScreenshot");
  });

  test("spec file covers all 5 metric cards via formula bar assertions", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("metric-card-net-worth");
    expect(content).toContain("metric-card-monthly-surplus");
    expect(content).toContain("metric-card-estimated-tax");
    expect(content).toContain("metric-card-financial-runway");
    expect(content).toContain("metric-card-debt-to-asset-ratio");
  });

  test("spec file tests formula bar with formula-bar testid", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("formula-bar");
    expect(content).toContain("formula-result");
    expect(content).toContain("formula-term-");
  });

  test("spec file tests color-coded formula terms (green positive, rose negative)", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("bg-green-50");
    expect(content).toContain("text-green-700");
    expect(content).toContain("bg-rose-50");
    expect(content).toContain("text-rose-700");
  });

  test("spec file tests spotlight overlay with data-testid", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain('spotlight-overlay');
    expect(content).toContain('"opacity", "1"');
    expect(content).toContain('"opacity", "0"');
  });

  test("spec file tests mouse leave clears all highlights", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("mouse.move(0, 0)");
    expect(content).toContain("data-dataflow-highlighted");
    expect(content).toContain("toHaveCount(0)");
  });

  test("spec file tests mobile viewport (375px) with fixed formula bar", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("width: 375");
    expect(content).toContain('"fixed"');
    expect(content).toContain('"0px"');
  });

  test("spec file tests keyboard focus activation", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain(".focus()");
    expect(content).toContain("dataflow-aria-live");
    expect(content).toContain("Net Worth is calculated from:");
  });

  test("spec file tests CLS (Cumulative Layout Shift)", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("layout-shift");
    expect(content).toContain("clsEntries");
    expect(content).toContain("toBeLessThan(0.1)");
  });

  test("spec file tests insight card hover with spotlight", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("data-insight-type");
    expect(content).toContain("insight-spotlight");
  });

  test("spec file includes screenshot capture points", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    const screenshotMatches = content.match(/captureScreenshot/g);
    expect(screenshotMatches?.length).toBeGreaterThanOrEqual(7);
  });

  test("spec file tests data-dataflow-active-target attribute", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("data-dataflow-active-target");
  });

  test("SpotlightOverlay and FormulaBar are exported from DataFlowArrows", async () => {
    const mod = await import("@/components/DataFlowArrows");
    expect(mod.SpotlightOverlay).toBeDefined();
    expect(mod.FormulaBar).toBeDefined();
    expect(mod.prioritizeConnections).toBeDefined();
  });

  test("existing spotlight-related E2E test files exist", () => {
    const testFiles = [
      "data-flow-arrows.spec.ts",
      "net-worth-data-flow.spec.ts",
      "monthly-surplus-data-flow.spec.ts",
      "remaining-metric-data-flow.spec.ts",
      "insight-data-flow.spec.ts",
      "arrow-polish.spec.ts",
    ];
    for (const file of testFiles) {
      expect(fs.existsSync(path.join(e2eDir, file))).toBe(true);
    }
  });

  test("existing E2E test files use spotlight-overlay instead of data-flow-overlay", () => {
    const testFiles = [
      "data-flow-arrows.spec.ts",
      "net-worth-data-flow.spec.ts",
      "monthly-surplus-data-flow.spec.ts",
      "remaining-metric-data-flow.spec.ts",
      "insight-data-flow.spec.ts",
      "arrow-polish.spec.ts",
    ];
    for (const file of testFiles) {
      const content = fs.readFileSync(path.join(e2eDir, file), "utf-8");
      expect(content).not.toContain("data-flow-overlay");
      expect(content).toContain("spotlight-overlay");
    }
  });
});
