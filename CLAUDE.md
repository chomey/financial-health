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
├── CLAUDE.md          # This file - project instructions for Claude
├── PRD.md             # Product requirements document
├── PROMPT.md          # Ralph Loop iteration prompt
├── TASKS.md           # Discrete tasks to complete
├── PROGRESS.md        # Per-task progress log
├── ralph.sh           # Ralph Loop driver script
└── src/               # Source code (adjust to your project)
```

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
When operating in Ralph Loop mode (invoked via `ralph.sh`), follow these rules:

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
11. If a task is blocked, note it in PROGRESS.md and move to the next unblocked task

## Task Ordering: UI-First
When generating or ordering tasks in TASKS.md, **prioritize getting a visible, working UI as early as possible** so that progress is verifiable by human eyes. Follow this order:

1. **Project scaffolding & dev server** — The app should be runnable immediately
2. **Basic UI shell & layout** — Navigation, page structure, visible skeleton
3. **Core UI screens/pages** — Render with hardcoded/mock data if backend isn't ready
4. **Screenshot & test infrastructure** — Playwright or equivalent set up early
5. **Data models & backend logic** — Wire real data into already-visible UI
6. **Feature refinement & edge cases** — Polish once the UI is demonstrably working

The goal: a human reviewing PROGRESS.md should be able to see screenshots proving real UI progress within the first few tasks, not just backend plumbing.

## Forbidden Commands: Docker
**NEVER run `docker`, `docker-compose`, or `docker compose` commands directly.** This includes `docker build`, `docker run`, `docker-compose up`, `docker compose up`, and any other Docker CLI invocations.

If a task requires Docker (e.g. starting a database, running a service):
1. **Write the docker-compose.yml** or Dockerfile as needed
2. **Print the exact command** the user needs to run, e.g.:
   ```
   ACTION REQUIRED: Please run the following command manually:
     docker compose up -d
   Then re-run Ralph to continue.
   ```
3. **Mark the task as blocked** in PROGRESS.md with the manual step required
4. **Stop the current iteration** — do NOT proceed assuming Docker is running

## Important Notes
- {{NOTE_1}}
- {{NOTE_2}}
