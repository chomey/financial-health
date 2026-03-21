# CLAUDE.md - Project Instructions

## Project Overview
**Financial Health Snapshot**: Point-in-time financial health snapshot app. Users ballpark holdings, debts, and expenses to get encouraging, actionable insights. Supports Canadian and US financial vehicles. All state in URL query params — no database, no accounts.

See `PRD.md` for full product requirements.

## Tech Stack
- TypeScript (strict), Next.js 15 (App Router), npm, Tailwind CSS v4
- Vitest (unit) + Playwright (E2E), URL state via base85-encoded JSON in `s=` param
- No database, no backend services, no Docker — pure client-side app

## Key Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Dev: `npm run dev`

## Coding Conventions
- Next.js App Router conventions (app/, page.tsx, layout.tsx)
- `"use client"` only when needed (interactivity, URL state)
- Tailwind CSS for all styling — no CSS modules or styled-components
- Small, focused components; colocate related files
- Every interactive element: visible hover, focus, active states
- Tailwind transitions (transition-all, duration-200) on interactive elements
- Inline editing over modals where possible

## Workflow: Plan Then Build
Strict separation: **planning agents** generate tasks, **Ralph Loop** implements them.

### Planning Agents (no code)
- **Product Designer** (`agents/PRODUCT-DESIGNER.md`) — Product vision, UX, feature design. Writes PRD.md and tasks.
- **Software Architect** (`agents/SOFTWARE-ARCHITECT.md`) — Infrastructure, security, tech architecture. Configures CLAUDE.md.
- **Code Reviewer** (`agents/CODE-REVIEWER.md`) — Post-implementation audit.

### Implementation (Ralph Loop)

**To start:** In a Claude Code session, say `"start ralph loop"` or `"run N tasks"`. Claude reads `.claude/skills/ralph-loop.md` and orchestrates parallel subagents — no shell script needed.

Each task is tagged with an agent role: `[@frontend]`, `[@backend]`, `[@database]`, `[@devops]`, `[@qa]`, `[@security]`, `[@fullstack]` (default). Each subagent reads the corresponding file from `agents/`.

### Task Format
```
- [ ] Task N: Short title — Description [@agent-tag]
```

### Model Tags
Sonnet by default. Add tags to the task line to change:
- `[OPUS]` — Deep cross-file reasoning, architectural audits — uses claude-opus
- `[MATH]` — Financial formulas, compound interest, tax calculations — uses claude-opus
- `[MILESTONE]` / `[E2E]` — Informational only, does NOT change model

### The Rule
**Prefer tasks for all meaningful work.** Small bug fixes and config tweaks can be done inline in interactive sessions.

## Ralph Loop Instructions
Each subagent follows `PROMPT.md`. Summary:
1. Read TASKS.md → assigned task number (passed in prompt)
2. Read PROGRESS.md for recent context
3. Complete exactly ONE task
4. **Write tests** — T1 (unit) always required. T2 (Playwright) for `[@frontend]`, `[@fullstack]`, `[@qa]`. T3 (full E2E) for `[@qa]`, `[E2E]`/`[MILESTONE]` tags, and every 5th task.
5. **Verify** — MANDATORY: run build + tests. Must see clean output before proceeding. Fix all errors first.
6. Mark task done (`- [x]`) in TASKS.md
7. Log in PROGRESS.md (one entry: task number, date, files, test results, screenshots)
8. Update `src/lib/changelog.ts`
9. Commit with descriptive message
10. Never modify completed tasks. Never skip ahead.

## External Dependencies
Ralph MUST NOT run forbidden commands (e.g., `docker`, `docker-compose`). If a dependency is missing, print an `ACTION REQUIRED` block with the exact command the user must run, log the blocker in PROGRESS.md, and stop.

<!-- Define dependencies that must be running before Ralph can proceed.
     Format: name, check command, start command, required_by task numbers.
     Example:
- name: PostgreSQL
  check: pg_isready -h localhost -p 5432
  start: docker compose up -d db
  required_by: [6, 7, 8]
-->

## Screenshots & Git LFS
- `.gitattributes` must track `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp`, `*.svg` via Git LFS
- Screenshots committed with each task. `CAPTURE_TASK=<N>` scopes writes to current task only.
- T3/regression tasks: report "all tests pass", don't duplicate screenshots.

## Important Notes
- No database — all state in URL query params
- Support CA (TFSA, RRSP, RESP, FHSA, LIRA) and US (401k, IRA, Roth IRA, 529, HSA) vehicles
- Tone: positive and encouraging, never alarming or judgmental
