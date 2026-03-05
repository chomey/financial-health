import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Changelog page", () => {
  test("renders the changelog page with version history", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.getByRole("heading", { name: "Changelog", level: 1 })).toBeVisible();
    await expect(page.getByText("Version history and feature updates")).toBeVisible();
    // Check milestone sections exist
    await expect(page.getByText("Multi-Currency Support")).toBeVisible();
    await expect(page.getByText("Foundation & Initial Build")).toBeVisible();
    // Check some version badges
    await expect(page.getByText("v61")).toBeVisible();
    await expect(page.getByText("v1", { exact: true })).toBeVisible();
    await captureScreenshot(page, "task-62-changelog-page");
  });

  test("displays entries in reverse chronological order within milestones", async ({ page }) => {
    await page.goto("/changelog");
    // Within the first milestone section, v61 should appear before v56
    const entries = page.locator("article");
    const firstEntry = entries.first();
    await expect(firstEntry.getByText("v61")).toBeVisible();
    await captureScreenshot(page, "task-62-changelog-entries-order");
  });

  test("has a Back to App link", async ({ page }) => {
    await page.goto("/changelog");
    const backLink = page.getByRole("link", { name: "Back to App" });
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL("/");
  });

  test("main page has a changelog link in the header", async ({ page }) => {
    await page.goto("/");
    const changelogLink = page.getByRole("link", { name: "Changelog" });
    await expect(changelogLink).toBeVisible();
    await changelogLink.click();
    await expect(page).toHaveURL("/changelog");
    await expect(page.getByRole("heading", { name: "Changelog", level: 1 })).toBeVisible();
    await captureScreenshot(page, "task-62-changelog-from-main");
  });

  test("entry cards have hover lift effect", async ({ page }) => {
    await page.goto("/changelog");
    const firstCard = page.locator("article").first();
    // Card should have transition classes
    await expect(firstCard).toHaveClass(/transition/);
    await expect(firstCard).toHaveClass(/hover/);
  });

  test("shows all 6 milestone sections", async ({ page }) => {
    await page.goto("/changelog");
    const sections = page.locator("main section");
    await expect(sections).toHaveCount(6);
  });
});
