import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("ProjectionChart position — full-width above two-column layout", () => {
  const pagePath = path.join(process.cwd(), "src", "app", "page.tsx");
  const pageSource = fs.readFileSync(pagePath, "utf-8");

  it("ProjectionChart renders in its own full-width section above the two-column grid", () => {
    // Should have a separate section with aria-label "Financial projections"
    expect(pageSource).toMatch(
      /<section[^>]*aria-label="Financial projections"/
    );
    // The projections section should contain ProjectionChart
    const projectionsSectionMatch = pageSource.match(
      /<section[^>]*aria-label="Financial projections"[\s\S]*?<\/section>/
    );
    expect(projectionsSectionMatch).not.toBeNull();
    expect(projectionsSectionMatch![0]).toContain("ProjectionChart");
  });

  it("ProjectionChart is NOT inside the dashboard section", () => {
    const dashboardSectionMatch = pageSource.match(
      /aria-label="Financial dashboard"[\s\S]*?<\/section>/
    );
    expect(dashboardSectionMatch).not.toBeNull();
    expect(dashboardSectionMatch![0]).not.toContain("ProjectionChart");
  });

  it("ProjectionChart section appears before the two-column grid", () => {
    const projectionsIndex = pageSource.indexOf('aria-label="Financial projections"');
    const entryIndex = pageSource.indexOf('aria-label="Financial data entry"');
    const dashboardIndex = pageSource.indexOf('aria-label="Financial dashboard"');
    expect(projectionsIndex).toBeGreaterThan(-1);
    expect(projectionsIndex).toBeLessThan(entryIndex);
    expect(projectionsIndex).toBeLessThan(dashboardIndex);
  });

  it("ProjectionChart component has aria-label for accessibility", () => {
    const chartPath = path.join(
      process.cwd(),
      "src",
      "components",
      "ProjectionChart.tsx"
    );
    const chartSource = fs.readFileSync(chartPath, "utf-8");
    expect(chartSource).toContain('aria-label="Financial projection"');
  });
});
