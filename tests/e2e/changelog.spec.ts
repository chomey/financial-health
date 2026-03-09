import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Changelog page", () => {
  test("renders the changelog page with version history", async ({ page }) => {
    await page.goto("/changelog");
    await expect(page.getByRole("heading", { name: "Changelog", level: 1 })).toBeVisible();
    await expect(page.getByText("Version history and feature updates")).toBeVisible();
    // Check milestone sections exist (latest and oldest)
    await expect(page.getByRole("heading", { name: "Australia Country Support", level: 2 })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Foundation & Initial Build", level: 2 })).toBeVisible();
    // Check some version badges
    await expect(page.getByText("v169")).toBeVisible();
    await expect(page.getByText("v1", { exact: true })).toBeVisible();
    await captureScreenshot(page, "task-62-changelog-page");
  });

  test("displays entries in reverse chronological order within milestones", async ({ page }) => {
    await page.goto("/changelog");
    // Within the first milestone section, latest version should appear first
    const entries = page.locator("article");
    const firstEntry = entries.first();
    await expect(firstEntry.getByText("v169")).toBeVisible();
    await captureScreenshot(page, "task-62-changelog-entries-order");
  });

  test("has a Back to App link", async ({ page }) => {
    await page.goto("/changelog");
    const backLink = page.getByRole("link", { name: "Back to App" });
    await expect(backLink).toBeVisible();
    await backLink.click();
    // Navigates back to main page (may include ?s= state param)
    await expect(page).toHaveURL(/^http:\/\/localhost:3000\/(\?.*)?$/);
  });

  test("main page has a changelog link in the header", async ({ page }) => {
    await page.goto("/");
    const changelogLink = page.getByRole("link", { name: /Changelog/ });
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

  test("shows all milestone sections", async ({ page }) => {
    await page.goto("/changelog");
    const sections = page.locator("main section");
    // Currently 16 milestones — use toHaveCount with at least check
    const count = await sections.count();
    expect(count).toBeGreaterThanOrEqual(16);
  });
});
