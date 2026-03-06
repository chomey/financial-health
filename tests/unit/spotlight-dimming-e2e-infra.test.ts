import { describe, test, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Explainer Modal E2E test infrastructure (replaces spotlight dimming)", () => {
  const e2eDir = path.resolve(__dirname, "../e2e");
  const specFile = path.join(e2eDir, "spotlight-dimming-e2e.spec.ts");

  test("spotlight-dimming-e2e.spec.ts exists", () => {
    expect(fs.existsSync(specFile)).toBe(true);
  });

  test("spec file imports Playwright test and expect", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain('from "@playwright/test"');
  });

  test("spec file covers metric cards", () => {
    const content = fs.readFileSync(specFile, "utf-8");
    expect(content).toContain("metric-card-net-worth");
  });

  test("ExplainerModal and hand-drawn utilities are exported from DataFlowArrows", async () => {
    const mod = await import("@/components/DataFlowArrows");
    expect(mod.ExplainerModal).toBeDefined();
    expect(mod.handDrawnOval).toBeDefined();
    expect(mod.handDrawnLine).toBeDefined();
    expect(mod.prioritizeConnections).toBeDefined();
  });

  test("existing E2E test files exist", () => {
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
});
