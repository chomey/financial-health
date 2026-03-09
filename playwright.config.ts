import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  maxFailures: 1, // stop after first failure (-x)
  timeout: 10_000, // 10s per test
  globalTimeout: 10 * 60_000, // 10 minutes max for the entire suite
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    actionTimeout: 10_000, // 10s per action (click, fill, etc.)
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Pre-set localStorage so tests bypass the first-visit wizard
        storageState: {
          cookies: [],
          origins: [
            {
              origin: "http://localhost:3000",
              localStorage: [
                { name: "fhs-visited", value: "1" },
                { name: "fhs-wizard-done", value: "1" },
                { name: "fhs-default-mode", value: "advanced" },
              ],
            },
          ],
        },
      },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
