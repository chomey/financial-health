import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Milestone 9 E2E test infrastructure — Whiteboard Explainer Modal", () => {
  const e2eTestPath = path.join(
    __dirname,
    "..",
    "e2e",
    "milestone-9-e2e.spec.ts"
  );

  it("milestone-9-e2e.spec.ts exists", () => {
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

  it("covers all five metric cards", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("metric-card-net-worth");
    expect(content).toContain("metric-card-monthly-cash-flow");
    expect(content).toContain("metric-card-estimated-tax");
    expect(content).toContain("metric-card-financial-runway");
    expect(content).toContain("metric-card-debt-to-asset-ratio");
  });

  it("verifies source summary cards with items and totals", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("source-summary-section-assets");
    expect(content).toContain("source-summary-section-debts");
    expect(content).toContain("source-summary-section-income");
    expect(content).toContain("source-summary-section-expenses");
    expect(content).toContain("source-summary-total-");
    expect(content).toContain("source-summary-items-");
  });

  it("tests hand-drawn SVG annotations (ovals, connectors, sum bar)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("source-summary-oval-");
    expect(content).toContain("explainer-connector-");
    expect(content).toContain("explainer-sum-bar");
    expect(content).toContain("stroke-linecap");
    expect(content).toContain("stroke-linejoin");
  });

  it("tests arithmetic layout with operators and result", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("explainer-operator-");
    expect(content).toContain("explainer-result-area");
    expect(content).toContain("explainer-result-value");
  });

  it("tests all three close mechanisms (Escape, X button, backdrop)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('press("Escape")');
    expect(content).toContain("explainer-close");
    expect(content).toContain("explainer-backdrop");
  });

  it("tests insight card interaction", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("data-insight-type");
    expect(content).toContain("insights-panel");
  });

  it("tests mobile behavior at 375px", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("375");
    expect(content).toContain("overflowY");
    expect(content).toContain("boundingBox");
  });

  it("tests keyboard navigation (Tab, Enter, Escape)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain('press("Tab")');
    expect(content).toContain('press("Enter")');
  });

  it("tests entrance animations", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("animate-modal-in");
  });

  it("has comprehensive test count (15+ tests)", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    const testCount = (content.match(/\btest\(/g) || []).length;
    expect(testCount).toBeGreaterThanOrEqual(15);
  });

  it("includes screenshot capture calls for each metric", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("task-82-net-worth-explainer");
    expect(content).toContain("task-82-monthly-surplus-explainer");
    expect(content).toContain("task-82-estimated-tax-explainer");
    expect(content).toContain("task-82-financial-runway-explainer");
    expect(content).toContain("task-82-debt-to-asset-explainer");
    expect(content).toContain("task-82-mobile-explainer");
  });

  it("all whiteboard feature test files exist", () => {
    const featureTests = [
      "whiteboard-annotations.spec.ts",
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

  it("DataFlowArrows module exports whiteboard components", async () => {
    const mod = await import("@/components/DataFlowArrows");
    expect(mod.ExplainerModal).toBeDefined();
    expect(mod.handDrawnOval).toBeDefined();
    expect(mod.handDrawnLine).toBeDefined();
    expect(mod.ConnectorLine).toBeDefined();
    expect(mod.CountUpValue).toBeDefined();
  });

  it("includes full multi-step journey test", () => {
    const content = fs.readFileSync(e2eTestPath, "utf-8");
    expect(content).toContain("Full multi-step journey");
    expect(content).toContain("complete flow");
  });
});
