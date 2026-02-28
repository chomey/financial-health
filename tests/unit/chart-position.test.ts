import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("ProjectionChart position in dashboard", () => {
  const pagePath = path.join(process.cwd(), "src", "app", "page.tsx");
  const pageSource = fs.readFileSync(pagePath, "utf-8");

  it("ProjectionChart renders inside the dashboard section, not as a separate full-width section", () => {
    // Should NOT have a separate section with aria-label "Financial projection"
    expect(pageSource).not.toMatch(
      /<section[^>]*aria-label="Financial projection"/
    );
    // ProjectionChart should appear within the dashboard section (lg:col-span-5)
    const dashboardSectionMatch = pageSource.match(
      /aria-label="Financial dashboard"[\s\S]*?<\/section>/
    );
    expect(dashboardSectionMatch).not.toBeNull();
    expect(dashboardSectionMatch![0]).toContain("ProjectionChart");
  });

  it("ProjectionChart renders before SnapshotDashboard in the dashboard column", () => {
    const dashboardSectionMatch = pageSource.match(
      /aria-label="Financial dashboard"[\s\S]*?<\/section>/
    );
    expect(dashboardSectionMatch).not.toBeNull();
    const section = dashboardSectionMatch![0];
    const chartIndex = section.indexOf("ProjectionChart");
    const dashboardIndex = section.indexOf("SnapshotDashboard");
    expect(chartIndex).toBeGreaterThan(-1);
    expect(dashboardIndex).toBeGreaterThan(-1);
    expect(chartIndex).toBeLessThan(dashboardIndex);
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
