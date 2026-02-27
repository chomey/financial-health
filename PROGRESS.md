# Progress Log

<!--
  This file is automatically updated by Ralph after each task iteration.
  It serves as a running log of what was done and provides context for
  future iterations to pick up where the last one left off.

  Do not manually edit entries below unless correcting errors.
-->

## Summary
- **Total Tasks**: 15
- **Completed**: 7
- **Remaining**: 8
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

## Task 5: Build debt entry section
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/components/DebtEntry.tsx`: Created new component with full debt entry functionality — mock data (Mortgage $280,000, Car Loan $15,000), click-to-edit category names and amounts, delete on hover, "Add Debt" button with inline form, category suggestions (Mortgage, Car Loan, Student Loan, Credit Card, Line of Credit, Personal Loan, Other). Debt amounts displayed in rose/red color to visually distinguish from assets. Formatted currency display, running total, smooth focus transitions, empty state message.
  - `src/app/page.tsx`: Replaced static Debts EntryCard with the new DebtEntry component. Added import.
  - `tests/unit/debt-entry.test.tsx`: 14 T1 unit tests covering rendering, mock data display, formatted amounts, total calculation, add/delete interactions, click-to-edit, empty state, category suggestions, and rose color for debt amounts.
  - `tests/unit/setup.test.tsx`: Updated to account for Debts section no longer showing empty-state text (now shows mock data). Test count changed from 8 to 7.
  - `tests/e2e/debt-entry.spec.ts`: 7 T2 browser tests — mock data rendering, add form, adding new debt, deleting debt, click-to-edit category, click-to-edit amount, category suggestions with selection.
  - `tests/e2e/app-shell.spec.ts`: Updated to verify Debts shows mock data (Mortgage) instead of empty-state text.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/debt-entry.test.tsx`: 14 passed, 0 failed
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed
  - `tests/unit/asset-entry.test.tsx`: 13 passed, 0 failed (pre-existing)
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/debt-entry.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed
  - `tests/e2e/asset-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed (pre-existing)
  - Total: 56 passed, 0 failed
- **Screenshots**:
  ![Debts with mock data](screenshots/task-5-debts-with-mock-data.png)
  ![Add debt form](screenshots/task-5-add-debt-form.png)
  ![Debt added](screenshots/task-5-debt-added.png)
  ![Debt deleted](screenshots/task-5-debt-deleted.png)
  ![Edit debt category](screenshots/task-5-edit-debt-category.png)
  ![Debt amount edited](screenshots/task-5-debt-amount-edited.png)
  ![Debt category suggestions](screenshots/task-5-debt-category-suggestions.png)
- **Notes**: DebtEntry follows the same pattern as AssetEntry but uses rose/red color for amounts to visually distinguish debts from assets. It manages its own state with useState — Task 10 will wire it to shared state. Category suggestions are debt-specific (7 categories vs 16 for assets).

## Task 6: Build income & expense entry sections
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/components/IncomeEntry.tsx`: Created new component with full income entry functionality — mock data (Salary $5,500, Freelance $800), click-to-edit category names and amounts, delete on hover, "Add Income" button with inline form, category suggestions (Salary, Freelance, Investment Income, Side Hustle, Other). Income amounts displayed in green. Monthly total at bottom with animation on change.
  - `src/components/ExpenseEntry.tsx`: Created new component with full expense entry functionality — mock data (Rent/Mortgage Payment $2,200, Groceries $600, Subscriptions $150), click-to-edit category names and amounts, delete on hover, "Add Expense" button with inline form, category suggestions (Rent/Mortgage Payment, Childcare, Groceries, Subscriptions, Transportation, Insurance, Utilities, Monthly Expenses, Other). Expense amounts displayed in amber. Monthly total at bottom with animation on change.
  - `src/app/page.tsx`: Replaced static Monthly Income and Monthly Expenses EntryCards with the new IncomeEntry and ExpenseEntry components.
  - `tests/unit/income-entry.test.tsx`: 15 T1 unit tests covering rendering, mock data display, formatted amounts, monthly total, add/delete interactions, click-to-edit, empty state, green amount color, category suggestions.
  - `tests/unit/expense-entry.test.tsx`: 15 T1 unit tests covering rendering, mock data display, formatted amounts, monthly total, add/delete interactions, click-to-edit, empty state, amber amount color, category suggestions.
  - `tests/unit/setup.test.tsx`: Updated to verify income/expense sections show mock data instead of empty-state text.
  - `tests/e2e/income-entry.spec.ts`: 6 T2 browser tests — mock data rendering, add form, adding income, deleting income, click-to-edit amount, category suggestions.
  - `tests/e2e/expense-entry.spec.ts`: 6 T2 browser tests — mock data rendering, add form, adding expense, deleting expense, click-to-edit amount, category suggestions.
  - `tests/e2e/app-shell.spec.ts`: Updated to verify income/expense sections show mock data; fixed "Mortgage" text matching to use exact match to avoid conflict with "Rent/Mortgage Payment".
  - `tests/e2e/debt-entry.spec.ts`: Fixed "Mortgage" text matching to use exact match.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/income-entry.test.tsx`: 15 passed, 0 failed
  - `tests/unit/expense-entry.test.tsx`: 15 passed, 0 failed
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed
  - `tests/unit/asset-entry.test.tsx`: 13 passed, 0 failed (pre-existing)
  - `tests/unit/debt-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/income-entry.spec.ts`: 6 passed, 0 failed
  - `tests/e2e/expense-entry.spec.ts`: 6 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed
  - `tests/e2e/debt-entry.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/asset-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed (pre-existing)
  - Total: 98 passed, 0 failed
- **Screenshots**:
  ![Income with mock data](screenshots/task-6-income-with-mock-data.png)
  ![Add income form](screenshots/task-6-add-income-form.png)
  ![Income added](screenshots/task-6-income-added.png)
  ![Income deleted](screenshots/task-6-income-deleted.png)
  ![Income amount edited](screenshots/task-6-income-amount-edited.png)
  ![Income category suggestions](screenshots/task-6-income-category-suggestions.png)
  ![Expenses with mock data](screenshots/task-6-expenses-with-mock-data.png)
  ![Add expense form](screenshots/task-6-add-expense-form.png)
  ![Expense added](screenshots/task-6-expense-added.png)
  ![Expense deleted](screenshots/task-6-expense-deleted.png)
  ![Expense amount edited](screenshots/task-6-expense-amount-edited.png)
  ![Expense category suggestions](screenshots/task-6-expense-category-suggestions.png)
- **Notes**: IncomeEntry uses green for amounts (matching assets' positive feel), ExpenseEntry uses amber/orange to distinguish spending. Both have animated monthly totals triggered from event handlers (not useEffect) to satisfy React 19's strict lint rules. Components manage their own state — Task 10 will wire to shared state. The "Rent/Mortgage Payment" expense category created an ambiguity with the "Mortgage" debt category in E2E tests, fixed with exact text matching.

## Task 7: Build financial goals section
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/components/GoalEntry.tsx`: Created new component with full goal entry functionality — mock data (Rainy Day Fund $14,500/$20,000, New Car $13,500/$42,000, Vacation $6,200/$6,500), animated progress bars with color transitions (amber→blue→teal→emerald→green as progress increases), celebratory glow effect + pulse animation when a goal is reached (100%), click-to-edit goal name/saved amount/target amount, delete on hover, "Add Goal" button with inline form (name, target, saved so far), hover tooltip showing percentage complete and remaining amount, empty state message.
  - `src/app/page.tsx`: Added GoalEntry component import and placed it in the entry panel after ExpenseEntry.
  - `tests/unit/goal-entry.test.tsx`: 14 T1 unit tests covering rendering, mock data display, formatted amounts, progress bars with correct percentages, add/delete interactions, click-to-edit for all three fields, empty state, and adding new goals.
  - `tests/e2e/goal-entry.spec.ts`: 7 T2 browser tests — mock data with progress bars, add form, adding new goal, deleting goal, click-to-edit name, click-to-edit saved amount with progress bar update, hover tooltip.
  - `tests/unit/setup.test.tsx`: Updated to verify all five entry sections including Goals.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/goal-entry.test.tsx`: 14 passed, 0 failed
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed
  - `tests/unit/asset-entry.test.tsx`: 13 passed, 0 failed (pre-existing)
  - `tests/unit/debt-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/income-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/expense-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/goal-entry.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/asset-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/debt-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/income-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/expense-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed (pre-existing)
  - Total: 119 passed, 0 failed
- **Screenshots**:
  ![Goals with mock data](screenshots/task-7-goals-with-mock-data.png)
  ![Add goal form](screenshots/task-7-add-goal-form.png)
  ![Goal added](screenshots/task-7-goal-added.png)
  ![Goal deleted](screenshots/task-7-goal-deleted.png)
  ![Edit goal name](screenshots/task-7-edit-goal-name.png)
  ![Saved amount edited](screenshots/task-7-saved-amount-edited.png)
  ![Goal tooltip on hover](screenshots/task-7-goal-tooltip.png)
- **Notes**: GoalEntry follows the same component pattern as AssetEntry/DebtEntry but adds progress bars with dynamic color coding based on completion percentage (amber<25%, blue<50%, teal<75%, emerald<100%, green=100%). Goals at 100% get a celebratory glow effect (amber ring + shadow) and pulse animation. Mock data values were chosen to avoid text collisions with existing components on the page (e.g., avoiding "$12,000" which appears in AssetEntry and "Emergency Fund" which is used in asset E2E tests). Component manages its own state — Task 10 will wire to shared state.
