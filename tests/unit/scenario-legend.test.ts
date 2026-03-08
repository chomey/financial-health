import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Scenario legend in ProjectionChart", () => {
  const chartPath = path.join(
    process.cwd(),
    "src",
    "components",
    "ProjectionChart.tsx"
  );
  const chartSource = fs.readFileSync(chartPath, "utf-8");

  // Also read the extracted utils file where the constants now live
  const utilsPath = path.join(
    process.cwd(),
    "src",
    "components",
    "projection",
    "ProjectionUtils.ts"
  );
  const utilsSource = fs.readFileSync(utilsPath, "utf-8");

  // Combined source for tests that check for content that may be in either file
  const combinedSource = chartSource + "\n" + utilsSource;

  it("defines SCENARIO_DESCRIPTIONS for all three scenarios", () => {
    expect(combinedSource).toContain("SCENARIO_DESCRIPTIONS");
    expect(combinedSource).toContain("conservative:");
    expect(combinedSource).toContain("moderate:");
    expect(combinedSource).toContain("optimistic:");
  });

  it("scenario buttons have title attributes for tooltips", () => {
    expect(chartSource).toContain("title={SCENARIO_DESCRIPTIONS[s]}");
  });

  it("has a collapsible scenario legend section", () => {
    expect(chartSource).toContain('data-testid="scenario-legend"');
    expect(chartSource).toContain('data-testid="scenario-legend-toggle"');
    expect(chartSource).toContain('data-testid="scenario-legend-content"');
  });

  it("legend toggle has aria-expanded for accessibility", () => {
    expect(chartSource).toContain("aria-expanded={legendOpen}");
  });

  it("scenario descriptions explain the multiplier assumptions", () => {
    // Conservative = 30% below
    expect(combinedSource).toMatch(/conservative.*30%.*below/i);
    // Moderate = entered ROI values
    expect(combinedSource).toMatch(/moderate.*entered.*ROI/i);
    // Optimistic = 30% above
    expect(combinedSource).toMatch(/optimistic.*30%.*above/i);
  });

  it("legend shows colored dots matching scenario colors", () => {
    expect(chartSource).toContain("SCENARIO_COLORS[s]");
    // The legend content uses colored dots for each scenario
    expect(chartSource).toContain("rounded-full");
  });
});
