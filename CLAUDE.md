# CLAUDE.md - Project Instructions

## Project Overview
<!-- Fill this in with your project details -->
This project is {{PROJECT_NAME}}: {{PROJECT_DESCRIPTION}}.

See `PRD.md` for full product requirements.

## Tech Stack
- Language: {{LANGUAGE}}
- Framework: {{FRAMEWORK}}
- Package Manager: {{PACKAGE_MANAGER}}

## Project Structure
```
├── CLAUDE.md              # This file - project instructions for Claude
├── PRD.md                 # Product requirements document
├── PRODUCT-DESIGNER.md    # Product Designer agent prompt (planning only)
├── SOFTWARE-ARCHITECT.md  # Software Architect agent prompt (planning only)
├── PROMPT.md              # Ralph Loop iteration prompt (implementation)
├── TASKS.md               # Discrete tasks to complete
├── PROGRESS.md            # Per-task progress log
├── ralph.zsh               # Ralph Loop driver script
└── src/                   # Source code (adjust to your project)
```

## Workflow: Plan Then Build
This project enforces a strict separation between **planning** and **implementation**.

### Phase 1: Planning (no code written)
Two planning agents generate tasks. They NEVER write code:

- **Product Designer** (`PRODUCT-DESIGNER.md`) — Owns product vision, UX, and feature design. Writes PRD.md and generates user-facing tasks. Makes design decisions autonomously, asks the user only for genuinely ambiguous tradeoffs. Tags infrastructure tasks with `[ARCH]` for the Software Architect.

- **Software Architect** (`SOFTWARE-ARCHITECT.md`) — Owns infrastructure, security, and technical architecture. Configures CLAUDE.md (tech stack, commands, dependencies). Generates `[ARCH]` technical tasks and reviews `[ARCH]`-tagged tasks from the Product Designer.

Invoke them in a Claude session:
```
"Read PRODUCT-DESIGNER.md and follow its instructions"
"Read SOFTWARE-ARCHITECT.md and follow its instructions"
```

### Phase 2: Implementation (Ralph Loop only)
Once tasks exist in TASKS.md, **only the Ralph Loop executes them** — via `ralph.zsh` or an interactive Claude session with `"Read PROMPT.md and follow its instructions"`. No agent should implement features inline during a planning conversation.

### The Rule
**Prefer tasks for all meaningful work.** New features, multi-file changes, and anything that needs integration tests should be a task in TASKS.md and implemented by Ralph. Small bug fixes, config tweaks, and quick adjustments can be done inline when the user drives an interactive session.

## Key Commands
<!-- Fill in your project's commands -->
- Build: `{{BUILD_COMMAND}}`
- Test: `{{TEST_COMMAND}}`
- Lint: `{{LINT_COMMAND}}`
- Run: `{{RUN_COMMAND}}`

## Coding Conventions
<!-- Add your project's conventions -->
- {{CONVENTION_1}}
- {{CONVENTION_2}}
- {{CONVENTION_3}}

## Ralph Loop Instructions
When operating in Ralph Loop mode (invoked via `ralph.zsh`), follow these rules:

1. **Read TASKS.md** to find the next unchecked task (`- [ ]`)
2. **Read PROGRESS.md** to understand what has been done so far
3. **Complete exactly ONE task** per iteration
4. **Write integration tests** — Every task MUST include automated integration tests that verify the feature works end-to-end. Do not mark a task complete without passing integration tests.
5. **Capture screenshots** — If the project has a visual UI, automate screenshots (e.g. using Playwright, Puppeteer, or equivalent) after each task. Save screenshots to `screenshots/` and embed them in PROGRESS.md using `![description](screenshots/filename.png)`.
6. **Mark the task as done** in TASKS.md (`- [x]`)
7. **Log your work** in PROGRESS.md with a timestamped entry, including integration test results and any screenshots
8. **Run tests/build** after each change to verify nothing is broken (integration tests MUST pass)
9. **Commit your changes** with a descriptive message referencing the task
10. Do NOT skip ahead or do multiple tasks at once
11. **NEVER modify completed (`- [x]`) or in-progress tasks in TASKS.md.** Only unchecked/unstarted tasks (`- [ ]`) may be edited, reordered, or removed. Completed and in-progress tasks are immutable records.
12. If a task is blocked, note it in PROGRESS.md and move to the next unblocked task

## Task Ordering: UI-First
When generating or ordering tasks in TASKS.md, **prioritize getting a visible, working UI as early as possible** so that progress is verifiable by human eyes. Follow this order:

1. **Project scaffolding & dev server** — The app should be runnable immediately
2. **Basic UI shell & layout** — Navigation, page structure, visible skeleton
3. **Core UI screens/pages** — Render with hardcoded/mock data if backend isn't ready
4. **Screenshot & test infrastructure** — Playwright or equivalent set up early
5. **Data models & backend logic** — Wire real data into already-visible UI
6. **Feature refinement & edge cases** — Polish once the UI is demonstrably working

The goal: a human reviewing PROGRESS.md should be able to see screenshots proving real UI progress within the first few tasks, not just backend plumbing.

## External Dependencies & Forbidden Commands
Ralph MUST NOT directly run certain commands. These require the user to execute them manually outside of Claude.

### Forbidden commands
- `docker`, `docker-compose`, `docker compose` (and all subcommands)
- Any other commands listed in `## External Dependencies` below

### External Dependencies
<!-- Define services/dependencies that must be running before Ralph can proceed.
     Each entry has:
       - name: human-readable label
       - check: command Ralph CAN run to verify the dependency is available
       - start: command the USER must run manually (Ralph prints this)

     Example entries (uncomment/edit for your project):
-->
<!--
- name: PostgreSQL (via Docker)
  check: pg_isready -h localhost -p 5432
  start: docker compose up -d db

- name: Redis (via Docker)
  check: redis-cli -h localhost ping
  start: docker compose up -d redis

- name: API server
  check: curl -sf http://localhost:3000/health
  start: cd api && npm start
-->

### How Ralph handles missing dependencies
Before starting implementation on any task, Ralph MUST:

1. **Check each external dependency** by running its `check` command
2. If ALL checks pass, proceed with the task normally
3. If ANY check fails, **do NOT attempt the task**. Instead:
   a. Print a clear `ACTION REQUIRED` block listing every failing dependency and the exact command to start it:
      ```
      ══════════════════════════════════════════════════
      ACTION REQUIRED — External dependencies not running
      ══════════════════════════════════════════════════

      The following dependencies are needed for this task but are not available:

      ✗ PostgreSQL (via Docker)
        → Run: docker compose up -d db

      ✗ Redis (via Docker)
        → Run: docker compose up -d redis

      After starting them, re-run Ralph to continue.
      ══════════════════════════════════════════════════
      ```
   b. Log the blocker in PROGRESS.md under the current task
   c. **Stop the current iteration immediately** — do NOT proceed, do NOT skip to another task

## Important Notes
- {{NOTE_1}}
- {{NOTE_2}}
