# Tasks

<!-- Older tasks archived to TASKS-ARCHIVE.md -->

<!-- Completed tasks archived to TASKS-ARCHIVE.md. Last completed: Task 187. -->
<!-- Ralph picks up the first unchecked task and works on exactly one per iteration. -->

## Retirement Planning

- [ ] Task 188: Government retirement income estimator (US) — Add Social Security ballpark estimator. User enters expected monthly benefit (or "average"/"max" preset based on claiming age 62/67/70). Show benefit in retirement income and factor into FIRE number calculation. Add to US flowchart steps. [@fullstack] [MATH]

- [ ] Task 189: Government retirement income estimator (AU) — Add Age Pension ballpark estimator. User enters single/couple status and whether they expect full/part/no pension (or enters fortnightly amount). Factor Super pension phase income + Age Pension into FIRE number calculation. Account for Super preservation age (60) vs Age Pension age (67). Add to AU flowchart steps. [@fullstack] [MATH]

- [ ] Task 190: Retirement income waterfall chart — New visualization showing stacked income sources in retirement: government benefits (CPP/OAS, Social Security, or Age Pension), pension/annuity income, portfolio withdrawals (4% rule), and any remaining income. Show as horizontal stacked bar vs monthly expenses target. Display in SnapshotDashboard when retirement metrics are visible. [@frontend]

- [ ] Task 191: Early withdrawal penalty warnings — When runway simulation withdraws from tax-sheltered accounts (RRSP before 71, 401k/IRA before 59.5, AU Super before preservation age 60), show warning badges in WithdrawalTaxSummary. Add penalty percentage to withdrawal tax calculation for applicable accounts based on user's current age. [@fullstack] [MATH]

- [ ] Task 192: RRIF/RMD required minimum distributions — Model forced withdrawals: RRSP→RRIF conversion at 71 (CA) and RMD from 401k/IRA at 73 (US). Add minimum withdrawal percentages by age. Show in projections when user's age + projection year crosses threshold. Add insight when RMDs would push user into a higher tax bracket. [@fullstack] [MATH]

- [ ] Task 193: Retirement readiness score — Compute a 0-100 retirement readiness score combining: income replacement ratio, emergency runway, government benefit eligibility, debt-free-by-retirement likelihood, and tax diversification (mix of tax-free/deferred/taxable accounts). Show as a prominent metric in the dashboard with tier labels (Getting Started / Building / On Track / Strong / Retirement Ready). [@fullstack]

- [ ] Task 194: Retirement income gap analysis — Calculate the monthly gap between projected retirement income (government benefits + portfolio 4% rule + any pension) and projected retirement expenses. Show as an insight: "Your retirement income covers X% of projected expenses" with actionable suggestions (increase savings, delay retirement, reduce expenses). [@fullstack]

- [ ] Task 195: Retirement planning E2E tests — Comprehensive E2E tests for the retirement planning features (tasks 186-194). Test retirement age persistence in URL, government income estimators for CA, US, and AU, waterfall chart rendering, penalty warnings, RMD/RRIF triggers, readiness score tiers, and income gap calculations. [@qa] [E2E]
