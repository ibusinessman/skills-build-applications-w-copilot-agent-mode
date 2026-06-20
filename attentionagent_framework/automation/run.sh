#!/bin/sh
# Runs ONE scheduled action, then exits. Called by each cron/launchd alarm.
#   run.sh <area> <set> <skill>   make that skill's content, post to that set's accounts
#   run.sh --study                measure + self-study + write the daily summary
# Respects the on/off switch in automation/config.md.
set -u

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)
cd "$REPO_ROOT" || exit 1
CONFIG="$REPO_ROOT/automation/config.md"
LOG_DIR="$REPO_ROOT/automation/logs"; mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/run-$(date +%Y-%m-%d).log"
stamp() { date '+%Y-%m-%d %H:%M:%S'; }

LOOP=$(grep -E '^loop:' "$CONFIG" 2>/dev/null | head -1 | sed 's/^loop:[[:space:]]*//' | tr -d '[:space:]')
if [ "${LOOP:-off}" != "on" ]; then echo "$(stamp) loop off — skip ($*)" >> "$LOG"; exit 0; fi

CLAUDE=$(command -v claude 2>/dev/null || true)
[ -z "${CLAUDE:-}" ] && [ -x "$HOME/.local/bin/claude" ] && CLAUDE="$HOME/.local/bin/claude"
if [ -z "${CLAUDE:-}" ]; then echo "$(stamp) ERROR: claude not found" >> "$LOG"; exit 1; fi

if [ "${1:-}" = "--study" ]; then
  TAG="study"
  PROMPT="End-of-day study: pull metrics for every account, update analytics/winners.md, run analytics/skills/self-study, append lessons to company/memory/content-performance.md, and write today's summary to analytics/reports/."
else
  AREA="${1:-}"; SET="${2:-}"; SKILL="${3:-}"
  if [ -z "$AREA" ] || [ -z "$SET" ] || [ -z "$SKILL" ]; then
    echo "$(stamp) ERROR usage: run.sh <area> <set> <skill> | --study" >> "$LOG"; exit 1
  fi
  TAG="$AREA/$SET/$SKILL"
  PROMPT="Run skill '$SKILL' from $AREA/skills/$SKILL/SKILL.md now: make ONE piece of content (you already loaded company/ as your standing context), then post it to EVERY account in $AREA/sets/$SET/accounts/ by running 'python3 automation/post/<platform>.py' for each account (the file name IS the platform), using the keys in .env. No drafts, no approval — make it and post it."
fi

echo "$(stamp) running: $TAG" >> "$LOG"
"$CLAUDE" -p "$PROMPT" --permission-mode bypassPermissions --add-dir "$REPO_ROOT" >> "$LOG" 2>&1
echo "$(stamp) done: $TAG (exit $?)" >> "$LOG"
