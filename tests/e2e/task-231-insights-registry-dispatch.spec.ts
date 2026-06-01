import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Task 231: insights registry dispatch", () => {
  test("dashboard renders insights after registry migration", async ({ page }) => {
    await page.goto("/?step=dashboard");
    const panel = page.getByTestId("insights-panel");
    await expect(panel).toBeVisible();
    expect(await panel.getByRole("article").count()).toBeGreaterThan(0);
    await captureScreenshot(page, "task-231-insights-registry-dispatch");
  });
});
