#!/usr/bin/env zsh
set -euo pipefail

# Ralph Loop - Automated Claude iteration driver
# Usage: ./ralph.sh [number_of_tasks]
#
# Examples:
#   ./ralph.sh 20    # Run next 20 uncompleted tasks
#   ./ralph.sh 5     # Run next 5 uncompleted tasks
#   ./ralph.sh       # Run next 10 uncompleted tasks (default)

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
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       🚌 Ralph Loop v1.0 🚌         ║${NC}"
echo -e "${BLUE}║  \"I'm helping!\" - Ralph Wiggum       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

# Validate required files exist
for f in "$TASKS_FILE" "$PROMPT_FILE" "$PROGRESS_FILE"; do
  if [[ ! -f "$f" ]]; then
    echo -e "${RED}Error: Missing required file: $f${NC}"
    exit 1
  fi
done

# Count total tasks and completed tasks
total_tasks=$(grep -c '^\- \[' "$TASKS_FILE" 2>/dev/null || echo "0")
completed_tasks=$(grep -c '^\- \[x\]' "$TASKS_FILE" 2>/dev/null || echo "0")
remaining_tasks=$((total_tasks - completed_tasks))

echo -e "${YELLOW}Total tasks:     ${total_tasks}${NC}"
echo -e "${GREEN}Completed:       ${completed_tasks}${NC}"
echo -e "${BLUE}Remaining:       ${remaining_tasks}${NC}"
echo ""

if [[ "$remaining_tasks" -eq 0 ]]; then
  echo -e "${GREEN}All tasks are complete! Ralph did it!${NC}"
  exit 0
fi

# Cap task count to remaining
if [[ "$TASK_COUNT" -gt "$remaining_tasks" ]]; then
  TASK_COUNT="$remaining_tasks"
fi

echo -e "${YELLOW}Tasks to run:    ${TASK_COUNT}${NC}"
echo ""

# Show the next N uncompleted tasks for confirmation
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  Next ${TASK_COUNT} task(s) to execute:${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Extract next N uncompleted tasks
grep '^\- \[ \]' "$TASKS_FILE" | head -n "$TASK_COUNT" | while IFS= read -r task; do
  echo -e "  ${YELLOW}${task}${NC}"
done

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Prompt user for confirmation
read -r -p "Proceed with these ${TASK_COUNT} task(s)? [y/N] " confirm
case "$confirm" in
  [yY]|[yY][eE][sS])
    echo ""
    echo -e "${GREEN}Starting Ralph Loop...${NC}"
    ;;
  *)
    echo -e "${YELLOW}Aborted by user.${NC}"
    exit 0
    ;;
esac

# Run Claude for each task
for ((i = 1; i <= TASK_COUNT; i++)); do
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}  Ralph Loop iteration ${i}/${TASK_COUNT}${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Build the prompt from PROMPT.md
  prompt=$(cat "$PROMPT_FILE")

  # Run Claude with the prompt, passing project context via CLAUDE.md
  claude --print --dangerously-skip-permissions "$prompt"

  # Check exit code
  if [[ $? -ne 0 ]]; then
    echo -e "${RED}Claude exited with error on iteration ${i}. Stopping.${NC}"
    exit 1
  fi

  # Re-check progress after each iteration
  completed_now=$(grep -c '^\- \[x\]' "$TASKS_FILE" 2>/dev/null || echo "0")
  echo -e "${GREEN}Progress: ${completed_now}/${total_tasks} tasks complete${NC}"

  # Brief pause between iterations to avoid rate limiting
  if [[ "$i" -lt "$TASK_COUNT" ]]; then
    sleep 2
  fi
done

echo ""
echo -e "${GREEN}╔══════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Ralph Loop complete!                ║${NC}"
echo -e "${GREEN}║  \"Me fail English? That's unpossible!\"║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════╝${NC}"

# Final summary
completed_final=$(grep -c '^\- \[x\]' "$TASKS_FILE" 2>/dev/null || echo "0")
echo -e "${YELLOW}Final progress: ${completed_final}/${total_tasks} tasks complete${NC}"
