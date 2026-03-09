# Tasks

<!-- Older tasks archived to TASKS-ARCHIVE.md -->

<!-- Completed tasks archived to TASKS-ARCHIVE.md. Last completed: Task 157. -->
<!-- Ralph picks up the first unchecked task and works on exactly one per iteration. -->

## Australia Country Support

## Wizard Reorder & Contextual Help

## Simple vs Advanced Mode

- [ ] Task 180: Simplify DebtEntry and fold into Expenses in simple mode — In simple mode, the Debts wizard step is hidden. Instead, add a "Debt Payments" subsection at the bottom of ExpenseEntry that shows a single input: "Monthly debt payments (credit cards, loans, etc.)". This single number maps to a single debt item in state with category "Debt Payments". When switching to advanced mode, the user can break this into individual debts with interest rates. In advanced mode, DebtEntry works as-is with all fields (interest rate, monthly payment, category). [@fullstack]

- [ ] Task 184: Simple/advanced mode E2E tests — Test mode toggle persists in URL, test simple mode hides correct wizard steps and fields, test advanced mode shows all fields, test switching modes preserves data (enter data in advanced → switch to simple → switch back → data still there), test simple mode dashboard shows correct subset of sections. Test both new quick-start profiles load correctly. [@qa] [E2E]

## Expense Frequency Support

- [x] Task 175: Support yearly/one-time expenses — Add a frequency field to expenses (Monthly default, Yearly, One-time). Yearly expenses (e.g., vacation, insurance premiums, annual subscriptions) are divided by 12 for monthly calculations. One-time expenses are amortized over 12 months for cash flow but shown separately in the expense breakdown. Update ExpenseEntry UI with a frequency dropdown, update expense types in financial-types.ts, update computeTotals to handle frequency conversion, update runway/projection calculations, and update the budget detail text in flowchart-steps.ts. Show the annual amount alongside the monthly equivalent (e.g., "$3,600/yr → $300/mo"). [@fullstack]

## Australia Country Support (continued)

- [x] Task 172: AU unit tests and validation — Add comprehensive unit tests for AU tax brackets (verify marginal rates at key thresholds), Medicare Levy calculations, super contribution limits, AU tax offsets (LITO phase-out), franking credit gross-up, and AU-specific Money Steps inference. Validate all AU sample profiles produce reasonable dashboard metrics. Test country switching CA→AU→US preserves/resets state correctly. [@qa]
- [x] Task 173: AU E2E tests and regression — Full Playwright E2E test suite for AU flow: select AU country, pick AU sample profile, verify dashboard shows AUD values, verify Money Steps show AU-specific steps, verify tax summary uses AU brackets, verify super accounts appear in assets. Run full regression to ensure CA/US flows are unaffected by AU additions. [@qa] [E2E] [MILESTONE]
