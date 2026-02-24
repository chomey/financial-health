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
4. **Mark the task as done** in TASKS.md (`- [x]`)
5. **Log your work** in PROGRESS.md with a timestamped entry
6. **Run tests/build** after each change to verify nothing is broken
7. **Commit your changes** with a descriptive message referencing the task
8. Do NOT skip ahead or do multiple tasks at once
9. If a task is blocked, note it in PROGRESS.md and move to the next unblocked task

## Important Notes
- {{NOTE_1}}
- {{NOTE_2}}
