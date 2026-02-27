# Product Requirements Document

## Project Name
Financial Health Snapshot

## Overview
A point-in-time financial health snapshot app that lets users ballpark their financial holdings, debts, and monthly expenses to get encouraging, actionable insights about their financial position. Supports both Canadian and American financial vehicles (TFSA, RRSP, 401k, IRA, etc.). All state is stored in URL query params — no database, no accounts, fully shareable and reloadable.

## Goals
- [ ] Let users quickly enter a ballpark of their financial picture (assets, debts, income, expenses)
- [ ] Provide positive, encouraging financial insights (e.g., "You have roughly 18 months of runway if income stopped")
- [ ] Support both Canadian and US financial vehicles and terminology
- [ ] Store all state in URL query params so snapshots are bookmarkable and shareable

## Target Users
Individuals in Canada or the US who want a quick, no-commitment overview of their financial health without signing up for a service or connecting bank accounts. People who want to answer "how am I doing financially?" without the overhead of full budgeting tools.

## Tech Stack
- Language: TypeScript
- Framework: Next.js (App Router)
- Database: None — all state lives in URL query params
- Other: Tailwind CSS, no external APIs

## Features

### Core Features (MVP)
1. **Asset Entry**: Add financial assets with ballpark values — checking/savings accounts, 401k, IRA, RRSP, TFSA, brokerage accounts, home equity, vehicles, other
2. **Debt Entry**: Add debts — mortgage, car loans, student loans, credit cards, lines of credit, other
3. **Income & Expense Entry**: Add monthly income sources and recurring expenses (rent, childcare, groceries, subscriptions, custom categories). Users can be as granular or broad as they want (e.g., just "monthly expenses" as one line item)
4. **Financial Snapshot Dashboard**: Display net worth, debt-to-asset ratio, monthly surplus/deficit, and runway (months of solvency) in a clear, encouraging visual layout
5. **Positive Insights Engine**: Generate encouraging, human-readable insights based on the numbers (e.g., "Your emergency runway covers about 18 months — that's excellent peace of mind")
6. **URL State Persistence**: Encode all entered data into URL query params so the snapshot is bookmarkable, shareable, and reloadable without any backend
7. **Goals**: Add financial goals (saving for a car, vacation fund, emergency fund target) and see progress toward them based on current surplus

### Nice-to-Have Features
1. **Export/Share**: Copy a shareable link or export snapshot as an image
2. **Scenario Modeling**: "What if I paid off my car loan?" — toggle debts/expenses on/off to see how the snapshot changes

## UX Principles
- **Everything is interactable**: Every element on the page should feel alive. Hover states, transitions, highlights, subtle animations on focus/click. Numbers should be editable inline. Cards should lift on hover. Buttons should have press states. The app should feel tactile and responsive to every interaction.
- **Micro-interactions everywhere**: Tooltips on financial terms, smooth transitions when adding/removing items, progress bars that animate, numbers that count up, subtle color shifts on state changes.
- **Encouraging tone**: Use warm colors, friendly language, and celebratory moments (e.g., a glow effect when runway exceeds 12 months).

## Layout & Navigation
- **Single-page app** with a two-column layout: left panel for data entry, right panel for dashboard/insights
- On mobile, columns stack vertically (entry above dashboard)
- **No separate pages or routing** — everything lives on one screen that updates in real-time
- Header with app name, tagline, region toggle (CA/US/Both), and "Copy Link" button

## Data Entry UX
- **Card-based sections**: Assets, Debts, Monthly Income, Monthly Expenses, Goals
- Each card has an "Add" button that smoothly expands a new inline row
- **Click-to-edit**: Tap any value to edit it inline (no modals, no forms)
- **Hover-reveal delete**: Remove button appears on row hover
- **Category suggestions**: Pre-populated dropdowns filtered by region (CA/US/Both)
- Users can type custom categories — suggestions are just helpers
- Monthly totals at the bottom of Income and Expenses cards, animated on change

## URL State Design
- All state encoded as base85 JSON in a single `s=` query param
- URL updates via `replaceState` on every change (no history pollution)
- Page load reads `s=` param and restores full state
- "Copy Link" button in header copies current URL to clipboard

## Constraints
- No database or server-side state — everything in URL query params
- No authentication or user accounts
- No connection to real bank/financial APIs
- Must work well on mobile (responsive)
- All financial calculations are simple arithmetic (no complex financial modeling)

## Success Criteria
- [ ] User can enter assets, debts, income, and expenses in under 2 minutes
- [ ] Dashboard shows net worth, runway, and at least 3 positive insights
- [ ] Full state round-trips through URL query params (reload preserves everything)
- [ ] Works on both desktop and mobile browsers

## Out of Scope
- Bank account linking or transaction importing
- Historical tracking over time (this is a snapshot, not a tracker)
- Tax calculations or tax planning
- Investment advice or portfolio optimization
- Multi-currency support (USD and CAD are separate entries, no conversion)

## References
- Inspiration: The simplicity of "back of the napkin" financial planning
- Canadian vehicles: TFSA, RRSP, RESP, FHSA, LIRA
- US vehicles: 401k, IRA, Roth IRA, 529, HSA
