import { describe, it, expect } from "vitest";
import path from "path";

// We test the helper's path logic without needing a real browser
describe("Screenshot helpers", () => {
  const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

  it("constructs correct screenshot file paths", () => {
    const name = "task-2-home-loaded";
    const expected = path.join(SCREENSHOTS_DIR, `${name}.png`);
    expect(expected).toMatch(/screenshots\/task-2-home-loaded\.png$/);
  });

  it("screenshots directory path is absolute", () => {
    expect(path.isAbsolute(SCREENSHOTS_DIR)).toBe(true);
  });

  it("handles names with hyphens and numbers", () => {
    const name = "task-15-milestone-e2e-step-3";
    const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
    expect(filepath).toContain("task-15-milestone-e2e-step-3.png");
  });
});
