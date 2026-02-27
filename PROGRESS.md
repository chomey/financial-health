# Progress Log

<!--
  This file is automatically updated by Ralph after each task iteration.
  It serves as a running log of what was done and provides context for
  future iterations to pick up where the last one left off.

  Do not manually edit entries below unless correcting errors.
-->

## Summary
- **Total Tasks**: 15
- **Completed**: 4
- **Remaining**: 11
- **Last Updated**: 2026-02-27

---

## Task 1: [ARCH] Initialize Next.js project with Tailwind CSS and Vitest
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `package.json`: Created with Next.js 16.1.6, React 19, Tailwind CSS v4, Vitest, @testing-library/react, @testing-library/jest-dom, @vitejs/plugin-react, jsdom
  - `vitest.config.ts`: Created with jsdom environment, React plugin, @/ path alias, tests/unit/ include path
  - `tests/setup.ts`: Created with jest-dom/vitest matchers and cleanup after each test
  - `tests/unit/setup.test.tsx`: T1 unit test verifying page renders title, tagline, and welcome message
  - `src/app/globals.css`: Custom Tailwind color palette — warm greens (emerald), teal, warm neutrals (stone), soft blues, celebratory gold/amber, soft rose
  - `src/app/layout.tsx`: Updated metadata title and description for Financial Health Snapshot
  - `src/app/page.tsx`: Replaced default Next.js page with styled app shell using custom palette
  - `eslint.config.mjs`: Created flat ESLint config using eslint-config-next
  - `tsconfig.json`, `postcss.config.mjs`, `next.config.ts`, `.gitignore`: Scaffolded by create-next-app
- **Test tiers run**: T1
- **Tests**:
  - `tests/unit/setup.test.tsx`: Verifies home page renders title, tagline, and welcome message (3 passed, 0 failed)
- **Notes**: Used Next.js 16.1.6 (latest available via create-next-app). eslint-config-next v16 exports flat config natively — no FlatCompat needed. Tailwind v4 uses CSS-based `@theme inline` for custom colors instead of tailwind.config.js.

## Task 2: Set up Playwright screenshot & test infrastructure
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `package.json`: Added @playwright/test dev dependency
  - `playwright.config.ts`: Created with chromium project, baseURL localhost:3000, webServer running `npm run dev`, tests in tests/e2e/
  - `tests/e2e/helpers.ts`: Screenshot helper utility — `captureScreenshot(page, name)` saves full-page PNG to screenshots/
  - `tests/e2e/smoke.spec.ts`: Smoke test verifying homepage loads with title, tagline, and welcome message; captures screenshot
  - `tests/unit/screenshot-helpers.test.ts`: T1 unit tests for screenshot path construction logic
  - `.gitattributes`: Created to track *.png, *.jpg, *.jpeg, *.gif, *.webp, *.svg via Git LFS
  - `screenshots/`: Created directory for automated screenshots
- **Test tiers run**: T1, T2, T3
- **Tests**:
  - `tests/unit/screenshot-helpers.test.ts`: Verifies screenshot path construction, absolute paths, and name handling (3 passed, 0 failed)
  - `tests/unit/setup.test.tsx`: Pre-existing tests still passing (3 passed, 0 failed)
  - `tests/e2e/smoke.spec.ts`: Homepage loads with title, tagline, welcome message; screenshot captured (1 passed, 0 failed)
  - Total: 7 passed, 0 failed
- **Screenshots**:
  ![Homepage loaded](screenshots/task-2-home-loaded.png)
- **Notes**: Installed only chromium browser to keep setup lightweight. Playwright webServer config auto-starts `npm run dev` for E2E tests. Screenshot helper is simple and reusable for future tasks.

## Task 3: Build app shell & responsive layout
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/app/page.tsx`: Replaced single-card layout with two-panel design — left entry panel (7 cols) with 4 entry cards (Assets, Debts, Monthly Income, Monthly Expenses) and right dashboard panel (5 cols) with 4 metric cards (Net Worth, Monthly Surplus, Financial Runway, Debt-to-Asset Ratio). Added "use client" directive. Entry cards have icons, titles, and encouraging empty-state messages. Dashboard cards show placeholder "—" values with descriptions. All cards have hover lift effects (shadow + translate) with smooth transitions. Responsive: side-by-side on lg+, stacked on mobile. Dashboard panel is sticky on desktop.
  - `tests/unit/setup.test.tsx`: Updated from 3 to 8 unit tests — verifies app title, tagline, entry panel aria region, dashboard panel aria region, all 4 entry card titles, all 4 dashboard metric titles, placeholder dash values, and encouraging empty state messages.
  - `tests/e2e/smoke.spec.ts`: Updated to check for two panels instead of old welcome message.
  - `tests/e2e/app-shell.spec.ts`: New E2E test file — 3 tests: full layout verification (header, entry cards, dashboard cards, empty states), hover lift effect on entry cards, and mobile viewport responsiveness at 375px.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed
  - Total: 15 passed, 0 failed
- **Screenshots**:
  ![App shell desktop layout](screenshots/task-3-app-shell-desktop.png)
  ![Card hover effect](screenshots/task-3-card-hover.png)
  ![Mobile layout at 375px](screenshots/task-3-mobile-layout.png)
- **Notes**: Used `"use client"` since future tasks will add interactivity (state, click-to-edit). Entry and Dashboard cards are defined as local components in page.tsx for now — they'll be extracted to separate files when they gain complexity in later tasks. The dashboard panel uses `lg:sticky lg:top-8` so it stays visible while scrolling the entry panel on desktop.

## Task 4: Build asset entry section with mock data
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/components/AssetEntry.tsx`: Created new component with full asset entry functionality — mock data (Savings Account $12,000, TFSA $35,000, Brokerage $18,500), click-to-edit category names and amounts, delete on hover, "Add Asset" button with inline form, category suggestions for CA (TFSA, RRSP, RESP, FHSA, LIRA), US (401k, IRA, Roth IRA, 529, HSA), and universal (Savings, Checking, Brokerage, Home Equity, Vehicle, Other). Formatted currency display, running total, smooth focus transitions, empty state message.
  - `src/app/page.tsx`: Replaced static Assets EntryCard with the new AssetEntry component. Added import.
  - `tests/unit/asset-entry.test.tsx`: 13 T1 unit tests covering rendering, mock data display, formatted amounts, total calculation, add/delete interactions, click-to-edit, empty state, category suggestions.
  - `tests/unit/setup.test.tsx`: Updated to account for Assets section no longer showing empty-state text (now shows mock data).
  - `tests/e2e/asset-entry.spec.ts`: 7 T2 browser tests — mock data rendering, add form, adding new asset, deleting asset, click-to-edit category, click-to-edit amount, category suggestions with selection.
  - `tests/e2e/app-shell.spec.ts`: Updated to verify Assets shows mock data instead of empty-state text.
  - `package.json`: Added @testing-library/user-event dev dependency.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/asset-entry.test.tsx`: 13 passed, 0 failed
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/asset-entry.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed
  - Total: 35 passed, 0 failed
- **Screenshots**:
  ![Assets with mock data](screenshots/task-4-assets-with-mock-data.png)
  ![Add asset form](screenshots/task-4-add-asset-form.png)
  ![Asset added](screenshots/task-4-asset-added.png)
  ![Asset deleted](screenshots/task-4-asset-deleted.png)
  ![Edit category](screenshots/task-4-edit-category.png)
  ![Amount edited](screenshots/task-4-amount-edited.png)
  ![Category suggestions](screenshots/task-4-category-suggestions.png)
- **Notes**: AssetEntry is now a standalone component in `src/components/`. It manages its own state with useState for now — Task 10 will wire it to shared state. Category suggestions include all CA, US, and universal options (region filtering comes in Task 12). The `@testing-library/user-event` package was added to support more realistic interaction testing in unit tests.
