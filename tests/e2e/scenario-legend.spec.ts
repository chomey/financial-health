import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Scenario legend in projection chart", () => {
  test("scenario buttons have tooltip descriptions on hover", async ({
    page,
  }) => {
    await page.goto("/");

    const conservativeBtn = page.getByTestId("scenario-conservative");
    const moderateBtn = page.getByTestId("scenario-moderate");
    const optimisticBtn = page.getByTestId("scenario-optimistic");

    await expect(conservativeBtn).toBeVisible();
    await expect(moderateBtn).toBeVisible();
    await expect(optimisticBtn).toBeVisible();

    // Verify title attributes exist with meaningful descriptions
    await expect(conservativeBtn).toHaveAttribute("title", /30%.*below/);
    await expect(moderateBtn).toHaveAttribute("title", /entered.*ROI/);
    await expect(optimisticBtn).toHaveAttribute("title", /30%.*above/);
  });

  test("scenario legend toggle is visible and starts collapsed", async ({
    page,
  }) => {
    await page.goto("/");

    const legend = page.getByTestId("scenario-legend");
    const toggle = page.getByTestId("scenario-legend-toggle");

    await expect(legend).toBeVisible();
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText("What do the scenarios mean?");

    // Legend content should not be visible initially
    const content = page.getByTestId("scenario-legend-content");
    await expect(content).not.toBeVisible();

    // aria-expanded should be false
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking legend toggle expands and shows scenario descriptions", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByTestId("scenario-legend-toggle");
    await toggle.click();

    const content = page.getByTestId("scenario-legend-content");
    await expect(content).toBeVisible();

    // Should show all three scenario descriptions
    await expect(content).toContainText("Conservative");
    await expect(content).toContainText("Moderate");
    await expect(content).toContainText("Optimistic");

    // Should explain the assumptions
    await expect(content).toContainText("30% below");
    await expect(content).toContainText("entered ROI values");
    await expect(content).toContainText("30% above");

    // aria-expanded should be true
    await expect(toggle).toHaveAttribute("aria-expanded", "true");

    await captureScreenshot(page, "task-28-scenario-legend-expanded");
  });

  test("clicking legend toggle again collapses the content", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByTestId("scenario-legend-toggle");

    // Open
    await toggle.click();
    await expect(page.getByTestId("scenario-legend-content")).toBeVisible();

    // Close
    await toggle.click();
    await expect(
      page.getByTestId("scenario-legend-content")
    ).not.toBeVisible();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("legend has colored dots matching scenario colors", async ({
    page,
  }) => {
    await page.goto("/");

    const toggle = page.getByTestId("scenario-legend-toggle");
    await toggle.click();

    const content = page.getByTestId("scenario-legend-content");
    await expect(content).toBeVisible();

    // Should have 3 colored dots (one per scenario)
    const dots = content.locator("span.rounded-full");
    await expect(dots).toHaveCount(3);

    await captureScreenshot(page, "task-28-scenario-legend-colors");
  });
});
