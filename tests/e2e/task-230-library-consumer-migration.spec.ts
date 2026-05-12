import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Task 230: library-side consumer migration", () => {
  test("dashboard renders with all sections after registry migration", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await expect(page.getByTestId("dashboard-panel")).toBeVisible();
    await expect(page.getByTestId("metric-card-estimated-tax")).toBeVisible();
    await captureScreenshot(page, "task-230-dashboard-default");
  });

  test("flowchart roadmap renders after migrating to getCountry().flowchartSteps.build", async ({ page }) => {
    await page.goto("/?step=dashboard");
    const flowchart = page.getByTestId("financial-flowchart");
    await expect(flowchart).toBeVisible();
    // At least one CA step should be visible — the CA default loads CA steps.
    await expect(flowchart.locator("[data-testid^='flowchart-step-ca-']").first()).toBeVisible();
    await captureScreenshot(page, "task-230-flowchart-after-migration");
  });

  test("tax explainer brackets render after migrating bracket logic", async ({ page }) => {
    await page.goto("/?step=dashboard");
    const taxCard = page.getByTestId("metric-card-estimated-tax");
    await expect(taxCard).toBeVisible();
    await taxCard.click();
    // The explainer modal/section should appear with bracket info.
    await expect(page.getByText(/marginal/i).first()).toBeVisible();
    await captureScreenshot(page, "task-230-tax-explainer-brackets");
  });
});
