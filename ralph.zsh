#!/usr/bin/env zsh
set -euo pipefail

# Ralph Loop - Automated Claude iteration driver
# Usage: ./ralph.zsh [number_of_tasks]
#
# Examples:
#   ./ralph.zsh 20    # Run next 20 uncompleted tasks
#   ./ralph.zsh 5     # Run next 5 uncompleted tasks
#   ./ralph.zsh       # Run next 10 uncompleted tasks (default)

TASK_COUNT="${1:-10}"

SCRIPT_DIR="$(cd "$(dirname "${0}")" && pwd)"
TASKS_FILE="$SCRIPT_DIR/TASKS.md"
PROGRESS_FILE="$SCRIPT_DIR/PROGRESS.md"
PROMPT_FILE="$SCRIPT_DIR/PROMPT.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print "${BLUE}╔══════════════════════════════════════╗${NC}"
print "${BLUE}║       🚌 Ralph Loop v1.0 🚌          ║${NC}"
print "${BLUE}║  \"I'm helping!\" - Ralph Wiggum       ║${NC}"
print "${BLUE}╚══════════════════════════════════════╝${NC}"
print ""

# Validate required files exist
for f in "$TASKS_FILE" "$PROMPT_FILE" "$PROGRESS_FILE"; do
  if [[ ! -f "$f" ]]; then
    print "${RED}Error: Missing required file: $f${NC}"
    exit 1
  fi
done

# Count total tasks and completed tasks
total_tasks=$(grep -c '^\- \[' "$TASKS_FILE" 2>/dev/null || true)
total_tasks=${total_tasks:-0}
completed_tasks=$(grep -c '^\- \[x\]' "$TASKS_FILE" 2>/dev/null || true)
completed_tasks=${completed_tasks:-0}
remaining_tasks=$((total_tasks - completed_tasks))

print "${YELLOW}Total tasks:     ${total_tasks}${NC}"
print "${GREEN}Completed:       ${completed_tasks}${NC}"
print "${BLUE}Remaining:       ${remaining_tasks}${NC}"
print ""

if [[ "$remaining_tasks" -eq 0 ]]; then
  print "${GREEN}All tasks are complete! Ralph did it!${NC}"
  exit 0
fi

# Cap task count to remaining
if [[ "$TASK_COUNT" -gt "$remaining_tasks" ]]; then
  TASK_COUNT="$remaining_tasks"
fi

print "${YELLOW}Tasks to run:    ${TASK_COUNT}${NC}"
print ""

# Show the next N uncompleted tasks for confirmation
print "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print "${YELLOW}  Next ${TASK_COUNT} task(s) to execute:${NC}"
print "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print ""

# Extract next N uncompleted tasks
grep '^\- \[ \]' "$TASKS_FILE" | head -n "$TASK_COUNT" | while IFS= read -r task; do
  print "  ${YELLOW}${task}${NC}"
done

print ""
print "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
print ""

# Prompt user for confirmation
print -n "Proceed with these ${TASK_COUNT} task(s)? [y/N] "
read -r confirm
case "$confirm" in
  [yY]|[yY][eE][sS])
    print ""
    print "${GREEN}Starting Ralph Loop...${NC}"
    ;;
  *)
    print "${YELLOW}Aborted by user.${NC}"
    exit 0
    ;;
esac

# Run Claude for each task
for ((i = 1; i <= TASK_COUNT; i++)); do
  print ""
  print "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  print "${YELLOW}  Ralph Loop iteration ${i}/${TASK_COUNT}${NC}"
  print "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  print ""

  # Build the prompt from PROMPT.md
  prompt=$(cat "$PROMPT_FILE")

  # Run Claude with the prompt, passing project context via CLAUDE.md
  claude --print --dangerously-skip-permissions "$prompt"

  # Check exit code
  if [[ $? -ne 0 ]]; then
    print "${RED}Claude exited with error on iteration ${i}. Stopping.${NC}"
    exit 1
  fi

  # Re-check progress after each iteration
  completed_now=$(grep -c '^\- \[x\]' "$TASKS_FILE" 2>/dev/null || true)
  completed_now=${completed_now:-0}
  print "${GREEN}Progress: ${completed_now}/${total_tasks} tasks complete${NC}"

  # Brief pause between iterations to avoid rate limiting
  if [[ "$i" -lt "$TASK_COUNT" ]]; then
    sleep 2
  fi
done

print ""
print "${GREEN}╔══════════════════════════════════════╗${NC}"
print "${GREEN}║  Ralph Loop complete!                ║${NC}"
print "${GREEN}║  \"Me fail English? That's unpossible!\"║${NC}"
print "${GREEN}╚══════════════════════════════════════╝${NC}"

# Final summary
completed_final=$(grep -c '^\- \[x\]' "$TASKS_FILE" 2>/dev/null || true)
completed_final=${completed_final:-0}
print "${YELLOW}Final progress: ${completed_final}/${total_tasks} tasks complete${NC}"
