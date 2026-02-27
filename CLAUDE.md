# CLAUDE.md - Project Instructions

## Project Overview
This project is **Financial Health Snapshot**: A point-in-time financial health snapshot app that lets users ballpark their financial holdings, debts, and expenses to get encouraging, actionable insights. Supports Canadian and US financial vehicles. All state is stored in URL query params — no database, no accounts.

See `PRD.md` for full product requirements.

## Tech Stack
- Language: TypeScript (strict mode)
- Framework: Next.js 15 (App Router)
- Package Manager: npm
- Styling: Tailwind CSS v4
- Testing: Vitest (unit/logic) + Playwright (browser/E2E)
- State: URL query params — base85-encoded JSON in `s=` param (no database)
- Deployment target: Vercel (static export also viable since no server-side features)

## Project Structure
```
├── CLAUDE.md              # This file - project instructions for Claude
├── PRD.md                 # Product requirements document
├── PROMPT.md              # Ralph Loop iteration prompt (implementation)
├── TASKS.md               # Discrete tasks to complete
├── PROGRESS.md            # Per-task progress log
├── ralph.zsh              # Ralph Loop driver script
├── agents/                # All agent prompts (planning, implementation, review)
│   ├── PRODUCT-DESIGNER.md    # Planning: product vision, UX, feature design
│   ├── SOFTWARE-ARCHITECT.md  # Planning: infrastructure, security, tech architecture
│   ├── FRONTEND-ENGINEER.md   # Implementation: UI, styling, accessibility
│   ├── BACKEND-ENGINEER.md    # Implementation: APIs, business logic, middleware
│   ├── DATABASE-ENGINEER.md   # Implementation: schema, migrations, queries
│   ├── DEVOPS-ENGINEER.md     # Implementation: CI/CD, Docker, deployment
│   ├── QA-ENGINEER.md         # Implementation: test infrastructure, E2E, screenshots
│   ├── SECURITY-ENGINEER.md   # Implementation: auth, validation, OWASP
│   ├── FULLSTACK-ENGINEER.md  # Implementation: cross-cutting frontend + backend
│   └── CODE-REVIEWER.md      # Review: post-implementation audit
├── src/app/               # Next.js App Router pages and layouts
├── src/components/        # Reusable React components
├── src/lib/               # Utility functions (state encoding, calculations, insights)
├── tests/e2e/             # Playwright browser tests
├── tests/unit/            # Vitest unit tests
└── screenshots/           # Automated screenshots (Git LFS)
```

## Workflow: Plan Then Build
This project enforces a strict separation between **planning** and **implementation**.

### Phase 1: Planning (no code written)
Two planning agents generate tasks. They NEVER write code:

- **Product Designer** (`agents/PRODUCT-DESIGNER.md`) — Owns product vision, UX, and feature design. Writes PRD.md and generates user-facing tasks. Makes design decisions autonomously, asks the user only for genuinely ambiguous tradeoffs. Tags infrastructure tasks with `[ARCH]` for the Software Architect.

- **Software Architect** (`agents/SOFTWARE-ARCHITECT.md`) — Owns infrastructure, security, and technical architecture. Configures CLAUDE.md (tech stack, commands, dependencies). Generates `[ARCH]` technical tasks and reviews `[ARCH]`-tagged tasks from the Product Designer.

Invoke them in a Claude session:
```
"Read agents/PRODUCT-DESIGNER.md and follow its instructions"
"Read agents/SOFTWARE-ARCHITECT.md and follow its instructions"
```

### Post-Implementation Review
After completing tasks, invoke the Code Reviewer to audit changes:
```
"Read agents/CODE-REVIEWER.md and review the recent changes"
```

### Phase 2: Implementation (Ralph Loop with specialized agents)
Once tasks exist in TASKS.md, **only the Ralph Loop executes them** — via `ralph.zsh` or an interactive Claude session with `"Read PROMPT.md and follow its instructions"`. No agent should implement features inline during a planning conversation.

Each task is tagged with a specialized implementation agent (e.g., `[@frontend]`, `[@backend]`). Ralph loads the corresponding agent file from `agents/` for domain-specific guidance. If no tag is present, `[@fullstack]` is the default.

### Agent Reference

| Tag | Agent File | Scope |
|-----|-----------|-------|
| `[@frontend]` | `agents/FRONTEND-ENGINEER.md` | UI components, styling, responsive design, accessibility |
| `[@backend]` | `agents/BACKEND-ENGINEER.md` | API endpoints, business logic, middleware |
| `[@database]` | `agents/DATABASE-ENGINEER.md` | Schema design, migrations, ORM models, queries |
| `[@devops]` | `agents/DEVOPS-ENGINEER.md` | CI/CD pipelines, Docker, deployment, env setup |
| `[@qa]` | `agents/QA-ENGINEER.md` | Test infrastructure, E2E tests, screenshots |
| `[@security]` | `agents/SECURITY-ENGINEER.md` | Auth, validation, CORS/CSRF, encryption |
| `[@fullstack]` | `agents/FULLSTACK-ENGINEER.md` | Cross-cutting frontend + backend (default) |
| `[@reviewer]` | `agents/CODE-REVIEWER.md` | Post-implementation review and audit |

### Task Format
```
- [ ] Task N: Short title — Description [@agent-tag]
- [ ] Task N: [ARCH] Short title — Description [@devops]
```

### The Rule
**Prefer tasks for all meaningful work.** New features, multi-file changes, and anything that needs integration tests should be a task in TASKS.md and implemented by Ralph. Small bug fixes, config tweaks, and quick adjustments can be done inline when the user drives an interactive session.

## Key Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Run: `npm run dev`

## Coding Conventions
- Use Next.js App Router conventions (app/ directory, page.tsx, layout.tsx)
- Prefer server components by default, use "use client" only when needed (interactivity, URL state)
- Use Tailwind CSS for all styling — no CSS modules or styled-components
- Keep components small and focused; colocate related files in the same directory
- Every interactive element must have visible hover, focus, and active states — the UI should feel alive and tactile
- Use Tailwind transitions (transition-all, duration-200, etc.) on all interactive elements
- Inline editing preferred over modals/forms where possible (click a number to edit it)

## Ralph Loop Instructions
When operating in Ralph Loop mode (invoked via `ralph.zsh`), follow these rules:

1. **Read TASKS.md** to find the next unchecked task (`- [ ]`)
2. **Read PROGRESS.md** to understand what has been done so far
3. **Complete exactly ONE task** per iteration
4. **Write tests (tiered by domain)** — Every task MUST include automated tests at the tiers required by its agent tag. **T1 (Unit + API)** is always required. **T2 (Browser integration)** is required for `[@frontend]`, `[@fullstack]`, and `[@qa]` tasks. **T3 (Full E2E)** runs on `[@qa]` tasks, tasks tagged `[E2E]` or `[MILESTONE]`, and automatically every 5 completed tasks. Do not mark a task complete without passing all required-tier tests.
5. **Capture screenshots** — If the project has a visual UI, run Playwright with `CAPTURE_SCREENSHOTS=1 npx playwright test` to capture screenshots. Without this env var, `captureScreenshot()` is a no-op — this prevents test re-runs from overwriting committed task screenshots. Save screenshots to `screenshots/` and embed them in PROGRESS.md using `![description](screenshots/filename.png)`.
6. **Mark the task as done** in TASKS.md (`- [x]`)
7. **Log your work** in PROGRESS.md with a timestamped entry, including integration test results and any screenshots
8. **Run tests/build** after each change to verify nothing is broken. Run all T1 tests plus any new tests you wrote. Run T2 tests only if the agent tag requires it (`[@frontend]`, `[@fullstack]`, `[@qa]`). Run T3 tests only when triggered (every 5 completed tasks, `[E2E]`/`[MILESTONE]` tags, or `[@qa]` tasks). All required-tier tests MUST pass. **If tests you did NOT write are now failing**, `git stash` your changes, fix the pre-existing failure, commit the fix with `ralph: fix pre-existing test failure during task [N]`, then `git stash pop` and continue.
9. **Commit your changes** with a descriptive message referencing the task
10. Do NOT skip ahead or do multiple tasks at once
11. **NEVER modify completed (`- [x]`) or in-progress tasks in TASKS.md.** Only unchecked/unstarted tasks (`- [ ]`) may be edited, reordered, or removed. Completed and in-progress tasks are immutable records.
12. If a task is blocked, note it in PROGRESS.md and move to the next unblocked task

## Task Ordering: Dependencies First, Then UI-First
When generating or ordering tasks in TASKS.md, **set up external dependencies early** and then **prioritize getting a visible, working UI as soon as possible** so that progress is verifiable by human eyes. Follow this order:

1. **External dependency setup** — `[@devops]` tasks that create `docker-compose.yml`, `Dockerfile`, `.env.example`, and any other config files needed to run external services. These tasks create the files but do NOT run docker — the task description tells the user what commands to run (e.g., `docker compose up -d`). This lets the user have services running before backend tasks begin.
2. **Project scaffolding & dev server** — The app should be runnable immediately
3. **Basic UI shell & layout** — Navigation, page structure, visible skeleton
4. **Core UI screens/pages** — Render with hardcoded/mock data if backend isn't ready
5. **Screenshot & test infrastructure** — Playwright or equivalent set up early
6. **Data models & backend logic** — Wire real data into already-visible UI
7. **Feature refinement & edge cases** — Polish once the UI is demonstrably working

The goal: a human reviewing PROGRESS.md should be able to see screenshots proving real UI progress within the first few tasks, not just backend plumbing. External services should be ready before any task that needs them.

## External Dependencies & Forbidden Commands
Ralph MUST NOT directly run certain commands. These require the user to execute them manually outside of Claude.

### Forbidden commands
- `docker`, `docker-compose`, `docker compose` (and all subcommands)
- Any other commands listed in `## External Dependencies` below

### External Dependencies
None — this is a pure client-side app with no external services.

### How Ralph handles missing dependencies
Before starting implementation on a task, Ralph MUST:

1. **Determine which dependencies apply to the current task.** Each dependency has an optional `required_by` field listing task numbers that need it. If `required_by` is omitted, the dependency applies to ALL tasks. If the current task number is not in any dependency's `required_by` list, skip the check for that dependency.
2. **Check only the applicable dependencies** by running their `check` commands
3. If all applicable checks pass (or none apply), proceed with the task normally
4. If ANY applicable check fails, **do NOT attempt the task**. Instead:
   a. Print a clear `ACTION REQUIRED` block listing every failing dependency and the exact command to start it:
      ```
      ══════════════════════════════════════════════════
      ACTION REQUIRED — External dependencies not running
      ══════════════════════════════════════════════════

      The following dependencies are needed for this task but are not available:

      ✗ PostgreSQL (via Docker)
        → Run: docker compose up -d db

      After starting them, re-run Ralph to continue.
      ══════════════════════════════════════════════════
      ```
   b. Log the blocker in PROGRESS.md under the current task
   c. **Stop the current iteration immediately** — do NOT proceed, do NOT skip to another task

## Screenshots & Git LFS
- **Git LFS is required for all image files.** Ensure `.gitattributes` tracks `*.png`, `*.jpg`, `*.jpeg`, `*.gif`, `*.webp`, and `*.svg` via Git LFS. If `.gitattributes` doesn't exist or doesn't track images, create/update it before committing any screenshots.
- **Screenshots MUST be committed with each task** — include them in the task's commit so progress is visible in the git history.
- **Screenshot capture is opt-in** — `captureScreenshot()` only writes files when `CAPTURE_SCREENSHOTS=1` is set. Use `CAPTURE_SCREENSHOTS=1 npx playwright test` when you need screenshots for a task commit. Normal test runs (`npx playwright test`) skip capture to avoid overwriting previously committed screenshots.
- **T3/regression QA tasks do NOT commit screenshots.** When running full T3 regression tests or QA summary tasks, just report "all tests pass" — do not duplicate screenshots that were already captured in the original task commits.

## Important Notes
- No database — all state is encoded in URL query params for bookmarking and sharing
- Support both Canadian (TFSA, RRSP, RESP, FHSA, LIRA) and US (401k, IRA, Roth IRA, 529, HSA) financial vehicles
- Tone should be positive and encouraging — never alarming or judgmental about financial situations
