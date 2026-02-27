# Progress Log

<!--
  This file is automatically updated by Ralph after each task iteration.
  It serves as a running log of what was done and provides context for
  future iterations to pick up where the last one left off.

  Do not manually edit entries below unless correcting errors.
-->

## Summary
- **Total Tasks**: 15
- **Completed**: 12
- **Remaining**: 3
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

## Task 8: Build snapshot dashboard with mock calculations
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/components/SnapshotDashboard.tsx`: Created new component replacing inline DashboardCard elements. Displays four metric cards (Net Worth, Monthly Surplus, Financial Runway, Debt-to-Asset Ratio) with hardcoded mock values calculated from entry component mock data. Features: count-up animation on load using requestAnimationFrame with ease-out cubic easing, emoji icons per metric (💰 📈 🛡️ ⚖️), hover tooltips explaining each metric, encouraging color coding (green for positive metrics, rose for negative values, neutral stone for non-negative ratios), hover lift effects with shadow transitions. Exports `formatMetricValue` utility and `MOCK_METRICS` data for testing.
  - `src/app/page.tsx`: Replaced four inline DashboardCard components with SnapshotDashboard component. Removed unused DashboardCard function. Added SnapshotDashboard import.
  - `tests/unit/snapshot-dashboard.test.tsx`: 17 T1 unit tests covering metric card rendering, icon rendering, accessible labels with final values, tooltip show/hide on hover, green color for positive metrics, rose color for negative values, test id, group roles, formatMetricValue for currency/months/ratio formats, and MOCK_METRICS data structure.
  - `tests/unit/setup.test.tsx`: Updated "shows placeholder values" test to "shows metric values" using group role queries instead of dash placeholders.
  - `tests/e2e/snapshot-dashboard.spec.ts`: 7 T2 browser tests — metric cards with animated values, icons scoped to dashboard, tooltip on hover for Net Worth, tooltip for Monthly Surplus, tooltip hide on mouse leave, hover lift effect, encouraging color coding verification.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/snapshot-dashboard.test.tsx`: 17 passed, 0 failed
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed
  - `tests/unit/asset-entry.test.tsx`: 13 passed, 0 failed (pre-existing)
  - `tests/unit/debt-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/income-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/expense-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/goal-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/snapshot-dashboard.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/asset-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/debt-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/income-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/expense-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/goal-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed (pre-existing)
  - Total: 143 passed, 0 failed
- **Screenshots**:
  ![Dashboard metrics](screenshots/task-8-dashboard-metrics.png)
  ![Dashboard tooltip](screenshots/task-8-dashboard-tooltip.png)
  ![Dashboard card hover](screenshots/task-8-dashboard-card-hover.png)
  ![Dashboard colors](screenshots/task-8-dashboard-colors.png)
- **Notes**: SnapshotDashboard uses hardcoded mock values calculated from existing entry component mock data (Assets $65,500, Debts $295,000, Income $6,300, Expenses $2,950). Net Worth is negative (-$229,500) due to mortgage — this is realistic and the tooltip reassures users. The count-up animation uses requestAnimationFrame with ease-out cubic easing for a smooth feel. aria-labels on value elements contain the final formatted value (not the animated intermediate) for accessibility. Task 10 will wire real state to replace mock values.

## Task 9: Build positive insights engine
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/lib/insights.ts`: Created pure insights generation engine. Takes structured financial data (assets, debts, income, expenses, goals) and produces 3-5 encouraging, human-readable insights. Insight types: runway (shield icon), surplus (chart icon), savings-rate (star icon), goal progress (target icon), net-worth (money icon). Logic adapts messages based on thresholds (e.g., strong vs solid vs building runway).
  - `src/components/InsightsPanel.tsx`: Created InsightsPanel component rendering insight cards with warm gradient styling, staggered entrance animations (opacity + translate-y with 150ms delays), hover lift effects, icons per insight type, and article roles for accessibility. Accepts optional `data` prop for custom financial data (defaults to mock data matching entry components).
  - `src/components/SnapshotDashboard.tsx`: Added InsightsPanel below the four metric cards. Imported InsightsPanel component.
  - `tests/unit/insights.test.ts`: 18 T1 unit tests for the insights engine — covers all insight types, threshold variations, edge cases (empty data, zero values), unique IDs, and message content.
  - `tests/unit/insights-panel.test.tsx`: 7 T1 unit tests for the InsightsPanel component — rendering, icons, article roles, test ID, null when empty, custom data prop.
  - `tests/unit/snapshot-dashboard.test.tsx`: Updated "renders icons" test to use `getAllByText` since icons now appear in both metric cards and insights panel.
  - `tests/e2e/insights-panel.spec.ts`: 7 T2 browser tests — insights section visibility, card count, runway/surplus/goal content, entrance animations, hover effects.
  - `tests/e2e/snapshot-dashboard.spec.ts`: Updated selectors to use aria-labels and scoped locators to avoid ambiguity with insights text.
  - `tests/e2e/app-shell.spec.ts`: Updated metric card assertions to use scoped locators.
  - `tests/e2e/goal-entry.spec.ts`: Scoped goal text assertions to goals list to avoid matching insight text; fixed "Safety Net" assertion to use button role.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/insights.test.ts`: 18 passed, 0 failed
  - `tests/unit/insights-panel.test.tsx`: 7 passed, 0 failed
  - `tests/unit/snapshot-dashboard.test.tsx`: 17 passed, 0 failed
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed (pre-existing)
  - `tests/unit/asset-entry.test.tsx`: 13 passed, 0 failed (pre-existing)
  - `tests/unit/debt-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/income-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/expense-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/goal-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/insights-panel.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/snapshot-dashboard.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed
  - `tests/e2e/goal-entry.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/asset-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/debt-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/income-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/expense-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed (pre-existing)
  - Total: 175 passed, 0 failed
- **Screenshots**:
  ![Insights panel](screenshots/task-9-insights-panel.png)
  ![Insights animated](screenshots/task-9-insights-animated.png)
  ![Insight card hover](screenshots/task-9-insight-hover.png)
- **Notes**: The insights engine is a pure function in `src/lib/insights.ts` that accepts structured `FinancialData` and returns insight objects. Currently uses mock data matching entry components. Task 10 will wire shared state so insights update live as users edit values. The InsightsPanel component accepts an optional `data` prop, making it ready for real state integration. Several pre-existing E2E tests needed selector updates because insight messages contain phrases like "Net Worth", "$3,350", "Vacation", and "safety net" that caused ambiguous text matches — fixed by scoping to specific elements (aria-labels, roles, lists).

## Task 10: Wire all entry sections to shared state
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/lib/financial-state.ts`: Created shared state module with `FinancialState` type, `INITIAL_STATE` mock data, `computeTotals()`, `computeMetrics()`, and `toFinancialData()` functions. Centralizes all financial calculations so dashboard metrics recompute live from entry data.
  - `src/components/AssetEntry.tsx`: Added `items` and `onChange` props. Component uses controlled state when props are provided, falls back to internal mock data when standalone. Parent state changes propagate via `onChange` callback.
  - `src/components/DebtEntry.tsx`: Same pattern — added `items`/`onChange` props with controlled/uncontrolled support.
  - `src/components/IncomeEntry.tsx`: Same pattern — added `items`/`onChange` props with controlled/uncontrolled support.
  - `src/components/ExpenseEntry.tsx`: Same pattern — added `items`/`onChange` props with controlled/uncontrolled support.
  - `src/components/GoalEntry.tsx`: Same pattern — added `items`/`onChange` props with controlled/uncontrolled support.
  - `src/components/SnapshotDashboard.tsx`: Added `metrics` and `financialData` props. Uses provided metrics instead of hardcoded `MOCK_METRICS` when available. Passes `financialData` to `InsightsPanel`.
  - `src/app/page.tsx`: Lifted all state to the page component using `useState` for each section (assets, debts, income, expenses, goals). Computes metrics and financial data from state on every render. Passes items + onChange to entry components, metrics + financialData to dashboard.
- **Test tiers run**: T1, T2, T3
- **Tests**:
  - `tests/unit/financial-state.test.ts`: 17 T1 tests — INITIAL_STATE structure, computeTotals for all sections, computeMetrics (net worth, surplus, runway, ratio, positive/negative cases, edge cases), toFinancialData conversion, recalculation on state change (17 passed, 0 failed)
  - `tests/e2e/shared-state.spec.ts`: 7 T2 tests — dashboard initial values, adding asset updates net worth, deleting debt updates net worth, editing income updates surplus, adding expense updates surplus, insights update when data changes, multiple edits across sections reflect consistently (7 passed, 0 failed)
  - `tests/e2e/full-e2e.spec.ts`: 1 T3 test — complete user journey: verify initial state, add asset, delete debt, add income, add expense, edit existing amount, verify goals, verify insights, verify all dashboard metrics, verify tooltips (1 passed, 0 failed)
  - All pre-existing tests: 141 T1 passed, 51 T2 passed, 0 failed
  - Total: 200 passed, 0 failed
- **Screenshots**:
  ![Dashboard initial state](screenshots/task-10-dashboard-initial.png)
  ![Asset updates dashboard](screenshots/task-10-asset-updates-dashboard.png)
  ![Debt delete updates dashboard](screenshots/task-10-debt-delete-updates-dashboard.png)
  ![Income edit updates surplus](screenshots/task-10-income-edit-updates-surplus.png)
  ![Expense updates dashboard](screenshots/task-10-expense-updates-dashboard.png)
  ![Insights update on data change](screenshots/task-10-insights-update.png)
  ![Multiple edits reflected in dashboard](screenshots/task-10-multi-edit-dashboard.png)
  ![E2E after all edits](screenshots/task-10-e2e-after-edits.png)
  ![E2E tooltip verification](screenshots/task-10-e2e-tooltip.png)
- **Notes**: State is now lifted to page.tsx and flows down via props. Each entry component supports both controlled (props provided) and uncontrolled (standalone with mock data) modes, so existing unit tests continue to work unchanged. The `computeMetrics` function in `financial-state.ts` replaces the hardcoded `MOCK_METRICS` — dashboard values now recalculate live as the user edits any entry. InsightsPanel also receives live data. This was the 10th completed task, triggering T3 full E2E testing. All 200 tests pass across all tiers.

## Task 11: Implement URL state persistence
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/lib/url-state.ts`: Created URL state encoding/decoding module with ASCII85 (base85) encoding for compact URLs. Exports `encodeState`, `decodeState`, `getStateFromURL`, `updateURL`. State is compacted before encoding (IDs stripped, keys shortened) to minimize URL length. Includes full ASCII85 encoder/decoder implementation with zero-block shortcut and partial-block handling.
  - `src/app/page.tsx`: Added URL state persistence — state initializes from `s=` URL param (lazy useState initializer), URL updates via `replaceState` on every state change. Added `CopyLinkButton` component in header with clipboard API support, "Copied!" feedback animation (2s), and fallback for browsers without clipboard API. Header layout updated to flex with button on the right.
  - `tests/unit/url-state.test.ts`: 20 T1 unit tests covering ASCII85 encode/decode (empty data, strings, zero-block, arbitrary bytes, JSON roundtrip, invalid characters), compact state conversion, encodeState/decodeState roundtrips (initial state, empty state, special characters, invalid data), getStateFromURL (no param, valid param, corrupted param), updateURL (sets param, reads back, uses replaceState).
  - `tests/e2e/url-state.spec.ts`: 7 T2 browser tests covering Copy Link button visibility, Copied! feedback with revert, URL updates on state change, state persistence across reload, shared URL restoration, dashboard metrics preserved after reload, empty state default behavior.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/url-state.test.ts`: 20 passed, 0 failed
  - `tests/unit/financial-state.test.ts`: 17 passed, 0 failed (pre-existing)
  - `tests/unit/insights.test.ts`: 18 passed, 0 failed (pre-existing)
  - `tests/unit/insights-panel.test.tsx`: 7 passed, 0 failed (pre-existing)
  - `tests/unit/snapshot-dashboard.test.tsx`: 17 passed, 0 failed (pre-existing)
  - `tests/unit/setup.test.tsx`: 8 passed, 0 failed (pre-existing)
  - `tests/unit/asset-entry.test.tsx`: 13 passed, 0 failed (pre-existing)
  - `tests/unit/debt-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/income-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/expense-entry.test.tsx`: 15 passed, 0 failed (pre-existing)
  - `tests/unit/goal-entry.test.tsx`: 14 passed, 0 failed (pre-existing)
  - `tests/unit/screenshot-helpers.test.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/url-state.spec.ts`: 7 passed, 0 failed
  - `tests/e2e/app-shell.spec.ts`: 3 passed, 0 failed (pre-existing)
  - `tests/e2e/asset-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/debt-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/income-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/expense-entry.spec.ts`: 6 passed, 0 failed (pre-existing)
  - `tests/e2e/goal-entry.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/snapshot-dashboard.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/insights-panel.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/shared-state.spec.ts`: 7 passed, 0 failed (pre-existing)
  - `tests/e2e/full-e2e.spec.ts`: 1 passed, 0 failed (pre-existing)
  - `tests/e2e/smoke.spec.ts`: 1 passed, 0 failed (pre-existing)
  - Total: 227 passed, 0 failed
- **Screenshots**:
  ![Copy Link button](screenshots/task-11-copy-link-button.png)
  ![Copied feedback](screenshots/task-11-copied-feedback.png)
  ![URL updated after edit](screenshots/task-11-url-updated-after-edit.png)
  ![State preserved after reload](screenshots/task-11-state-after-reload.png)
  ![State restored from shared URL](screenshots/task-11-state-from-shared-url.png)
  ![Metrics preserved after reload](screenshots/task-11-metrics-after-reload.png)
- **Notes**: ASCII85 encoding produces ~20% smaller URLs than base64. State is compacted before encoding by stripping IDs and shortening property names (e.g., `category`→`c`, `amount`→`a`). IDs are regenerated on decode. The lazy useState initializer pattern avoids React's `set-state-in-effect` lint warning by reading the URL during component initialization rather than in a useEffect. The URL is updated using `replaceState` to avoid polluting browser history. Copy Link uses the Clipboard API with a fallback for older browsers.

## Task 12: Add region toggle for CA/US financial vehicles
- **Status**: Complete
- **Date**: 2026-02-27
- **Changes**:
  - `src/lib/financial-state.ts`: Added `Region` type (`"CA" | "US" | "both"`) and `region` field to `FinancialState` interface. INITIAL_STATE defaults to `region: "both"`.
  - `src/lib/url-state.ts`: Added optional `r` field to `CompactState` for region encoding. `toCompact` only writes `r` when region is not "both" (saves space). `fromCompact` reads `r` or defaults to "both".
  - `src/components/RegionToggle.tsx`: New component — three-option radio group (CA/US/Both) with flag icons, accessible `radiogroup` role, smooth transitions, selected state styling.
  - `src/components/AssetEntry.tsx`: Updated `getAllCategorySuggestions()` to accept optional `Region` param. CA shows only CA+universal suggestions, US shows only US+universal, both shows all. Added `region` prop to component.
  - `src/app/page.tsx`: Added `RegionToggle` to header between title and Copy Link button. Added `region` state (defaults to "both" during SSR, syncs from URL after hydration via useEffect). Passes `region` to `AssetEntry`. Region persists in URL state.
  - `tests/unit/region-toggle.test.tsx`: 10 T1 unit tests — RegionToggle rendering, selection, onChange, accessibility, flag icons, styling; getAllCategorySuggestions filtering for CA/US/both/undefined.
  - `tests/e2e/region-toggle.spec.ts`: 7 T2 browser tests — default Both selection, CA filters suggestions (no 401k), US filters suggestions (no TFSA), Both shows all, region persists across reload, smooth transitions, flag icons.
- **Test tiers run**: T1, T2
- **Tests**:
  - `tests/unit/region-toggle.test.tsx`: 10 passed, 0 failed
  - `tests/unit/url-state.test.ts`: 20 passed, 0 failed (pre-existing)
  - `tests/unit/financial-state.test.ts`: 17 passed, 0 failed (pre-existing)
  - All other unit tests: 124 passed, 0 failed (pre-existing)
  - `tests/e2e/region-toggle.spec.ts`: 7 passed, 0 failed
  - All other E2E tests: 66 passed, 0 failed (pre-existing)
  - Total: 244 passed, 0 failed
- **Screenshots**:
  ![Region toggle default (Both)](screenshots/task-12-region-toggle-default.png)
  ![CA suggestions filtered](screenshots/task-12-ca-suggestions.png)
  ![US suggestions filtered](screenshots/task-12-us-suggestions.png)
  ![Both shows all suggestions](screenshots/task-12-both-suggestions.png)
  ![Region persists after reload](screenshots/task-12-region-persists-reload.png)
  ![Region flag icons](screenshots/task-12-region-flags.png)
- **Notes**: Region state required special handling for React 19 hydration. During SSR, region defaults to "both" (matching static HTML). After hydration, a useEffect syncs the region from URL state. This avoids React 19's "attributes won't be patched up" behavior for `aria-checked` during hydration mismatch. The compact URL encoding only stores `r` when non-default ("both"), saving bytes in the common case. Debt category suggestions are universal (not region-specific) so DebtEntry was not modified.
