# Tasks

<!-- Older tasks archived to TASKS-ARCHIVE.md -->

<!-- Completed tasks archived to TASKS-ARCHIVE.md. Last completed: Task 157. -->
<!-- Ralph picks up the first unchecked task and works on exactly one per iteration. -->

## Australia Country Support

## Wizard Reorder & Contextual Help

- [x] Task 171: Move auto-computed displays to contextually appropriate locations — Moved all auto-computed displays (investment returns, taxes, contributions, mortgage, surplus) out of wizard input steps into the final Tax Summary step (renamed "Financial Summary"). [@fullstack]

- [x] Task 174: Add descriptions for asset account types — Similar to how tax credits have descriptions, add short explanations for each account type in AssetEntry. CA: TFSA ("Tax-free growth and withdrawals, $7,000/yr contribution room"), RRSP ("Tax-deferred, contributions reduce taxable income, taxed on withdrawal"), RESP ("Education savings, government grants up to $7,200 lifetime"), FHSA ("Tax-free first home savings, $8,000/yr limit"), LIRA ("Locked-in retirement, from employer pension, withdrawal restrictions"). US: 401k ("Employer-sponsored, pre-tax contributions, taxed on withdrawal"), Roth 401k ("After-tax contributions, tax-free growth and withdrawals"), IRA ("Individual retirement, pre-tax, $7,000/yr limit"), Roth IRA ("After-tax, tax-free growth, $7,000/yr limit, income limits apply"), 529 ("Education savings, tax-free for qualified expenses"), HSA ("Triple tax advantage for medical expenses, $4,300/yr single"). AU: Super Accumulation ("Employer contributions + salary sacrifice, 15% tax on earnings, preserved until age 60"), Super Pension Phase ("Tax-free earnings and withdrawals after 60"), FHSS ("Withdraw up to $50,000 of voluntary super contributions for first home"). Generic: Savings, Checking, GIC, Brokerage, etc. Show description below category dropdown when selected, same style as tax credit descriptions. [@frontend]

## Simple vs Advanced Mode

- [x] Task 176: Add mode toggle and persist in URL state — Add a `mode` field to FinancialState and CompactState (`"simple"` | `"advanced"`, default `"simple"`). Add a toggle switch to the ProfileStep (and the AppHeader for easy access from dashboard). Persist in the `s=` URL blob. Create a React context `useModeContext()` that any component can read. When mode changes, no data is lost — advanced fields are just hidden, their values remain in state. New users start in simple mode. [@fullstack]

- [x] Task 177: Simplify wizard steps in simple mode — In simple mode, reduce the wizard to 6 steps: Welcome → Profile → Income → Expenses → Assets → Summary. **Hide entirely**: Debts step (fold into a single "Monthly debt payments" field in Expenses), Property step (fold into a single "Home value" and "Mortgage balance" in Assets), Stocks step (most people don't track individual stocks), Tax Credits step (hidden from Expenses). Update WIZARD_STEPS to be dynamic based on mode. The "Summary" step replaces Tax Summary with a friendlier name. Advanced mode keeps all 9 steps. [@fullstack]

- [x] Task 178: Simplify AssetEntry in simple mode — In simple mode, show only: category dropdown, amount. Hide: ROI (use smart defaults silently), tax treatment pill, cost basis %, employer match fields, reinvest returns toggle, monthly contribution, surplus target checkbox, currency override badge. The "AUTO-COMPUTED" section for property equity and stocks is hidden (since those steps don't exist in simple mode). All hidden field values are preserved in state — switching to advanced reveals them. [@frontend]

- [x] Task 179: Simplify IncomeEntry in simple mode — In simple mode, show only: category, amount, frequency dropdown. Hide: income type selector (default to "employment"), currency override badge, HelpTip tooltips. Frequency stays visible because it's critical for accurate monthly calculations. [@frontend]

- [x] Task 180: Simplify DebtEntry and fold into Expenses in simple mode — In simple mode, the Debts wizard step is hidden. Instead, add a "Debt Payments" subsection at the bottom of ExpenseEntry that shows a single input: "Monthly debt payments (credit cards, loans, etc.)". This single number maps to a single debt item in state with category "Debt Payments". When switching to advanced mode, the user can break this into individual debts with interest rates. In advanced mode, DebtEntry works as-is with all fields (interest rate, monthly payment, category). [@fullstack]

- [x] Task 181: Simplify PropertyEntry and fold into Assets in simple mode — In simple mode, the Property wizard step is hidden. Instead, add two optional fields at the top of AssetEntry in simple mode: "Home value" and "Mortgage balance". These map to a single Property item in state. Hide: interest rate, monthly payment, amortization, appreciation, year purchased, currency override. When switching to advanced, the full PropertyEntry appears with all fields. In advanced mode, PropertyEntry works as-is. [@fullstack]

- [x] Task 182: Simplify dashboard in simple mode — In simple mode, show 4 dashboard sections: **Overview** (net worth, monthly cash flow, runway — the 3 most important numbers, large and prominent), **Insights** (encouraging tips, capped at 4 instead of 8), **Money Steps** (flowchart — this is the core value prop), **Projection** (single "moderate" scenario chart). Hide: Cash Flow Sankey, Breakdowns (pie charts), Compare/Benchmarks, What If scenarios, Income Replacement, FIRE Number, Debt-to-Asset ratio. Add a banner at the bottom: "Want more detail? Switch to Advanced mode." In advanced mode, all 8 sections show as-is. [@frontend]

- [x] Task 183: Update sample profiles and welcome step for simple mode — In simple mode, the Welcome step should say "Get a quick snapshot of your financial health in under 2 minutes." Sample profiles should auto-load in simple mode with fewer fields populated (no stocks, no tax credits, no cost basis, no employer match). Add 2 new "quick start" sample profiles per country that only use simple-mode fields: (1) "Renter with salary" — income, rent, basic expenses, savings account. (2) "Homeowner with mortgage" — income, expenses, home value + mortgage, savings + retirement account. Advanced sample profiles remain unchanged. [@frontend]

- [ ] Task 184: Simple/advanced mode E2E tests — Test mode toggle persists in URL, test simple mode hides correct wizard steps and fields, test advanced mode shows all fields, test switching modes preserves data (enter data in advanced → switch to simple → switch back → data still there), test simple mode dashboard shows correct subset of sections. Test both new quick-start profiles load correctly. [@qa] [E2E]

## Expense Frequency Support

- [x] Task 175: Support yearly/one-time expenses — Add a frequency field to expenses (Monthly default, Yearly, One-time). Yearly expenses (e.g., vacation, insurance premiums, annual subscriptions) are divided by 12 for monthly calculations. One-time expenses are amortized over 12 months for cash flow but shown separately in the expense breakdown. Update ExpenseEntry UI with a frequency dropdown, update expense types in financial-types.ts, update computeTotals to handle frequency conversion, update runway/projection calculations, and update the budget detail text in flowchart-steps.ts. Show the annual amount alongside the monthly equivalent (e.g., "$3,600/yr → $300/mo"). [@fullstack]

## Australia Country Support (continued)

- [x] Task 172: AU unit tests and validation — Add comprehensive unit tests for AU tax brackets (verify marginal rates at key thresholds), Medicare Levy calculations, super contribution limits, AU tax offsets (LITO phase-out), franking credit gross-up, and AU-specific Money Steps inference. Validate all AU sample profiles produce reasonable dashboard metrics. Test country switching CA→AU→US preserves/resets state correctly. [@qa]
- [x] Task 173: AU E2E tests and regression — Full Playwright E2E test suite for AU flow: select AU country, pick AU sample profile, verify dashboard shows AUD values, verify Money Steps show AU-specific steps, verify tax summary uses AU brackets, verify super accounts appear in assets. Run full regression to ensure CA/US flows are unaffected by AU additions. [@qa] [E2E] [MILESTONE]
