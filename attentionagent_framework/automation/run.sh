#!/bin/sh
# Runs ONE scheduled action, then exits. Called by each cron/launchd alarm.
#   run.sh <area> <set> <skill>   make that skill's content, post to that set's accounts
#   run.sh --study                measure + self-study + write the daily summary
# Respects the on/off switch in automation/config.md.
# On transient failure, retries up to MAX_RETRIES times with exponential backoff.
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

# Resolve claude binary
CLAUDE=$(command -v claude 2>/dev/null || true)
[ -z "${CLAUDE:-}" ] && [ -x "$HOME/.local/bin/claude" ] && CLAUDE="$HOME/.local/bin/claude"
if [ -z "${CLAUDE:-}" ]; then echo "$(stamp) ERROR: claude not found in PATH" >> "$LOG"; exit 1; fi

# Read model from agent.json (fallback to claude-opus-4-8)
AGENT_JSON="$REPO_ROOT/agent.json"
MODEL="claude-opus-4-8"
if [ -f "$AGENT_JSON" ]; then
  _m=$(python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print(d.get('model',''))" "$AGENT_JSON" 2>/dev/null)
  [ -n "${_m:-}" ] && MODEL="$_m"
fi

if [ "${1:-}" = "--study" ]; then
  TAG="study"
  PROMPT="End-of-day self-study: (1) pull metrics for every account using analytics/sources.md, (2) score posts and update analytics/winners.md with today's top performers, (3) run the self-study skill at analytics/skills/self-study/SKILL.md, (4) append lessons to company/memory/content-performance.md, (5) write today's report to analytics/reports/report-$(date +%Y-%m-%d).md."
else
  AREA="${1:-}"; SET="${2:-}"; SKILL="${3:-}"
  if [ -z "$AREA" ] || [ -z "$SET" ] || [ -z "$SKILL" ]; then
    echo "$(stamp) ERROR usage: run.sh <area> <set> <skill> | --study" >> "$LOG"; exit 1
  fi
  # Validate that the skill and set directories exist before running
  SKILL_DIR="$REPO_ROOT/$AREA/skills/$SKILL"
  SET_DIR="$REPO_ROOT/$AREA/sets/$SET"
  if [ ! -d "$SKILL_DIR" ]; then
    echo "$(stamp) ERROR: skill directory not found: $SKILL_DIR" >> "$LOG"; exit 1
  fi
  if [ ! -d "$SET_DIR" ]; then
    echo "$(stamp) ERROR: set directory not found: $SET_DIR" >> "$LOG"; exit 1
  fi
  TAG="$AREA/$SET/$SKILL"
  PROMPT="Run skill '$SKILL' from $AREA/skills/$SKILL/SKILL.md now: make ONE piece of content (read company/ as your standing context first), then post it to EVERY account in $AREA/sets/$SET/accounts/ by running 'python3 automation/post/<platform>.py' for each account file (the filename IS the platform), loading API keys from .env. No drafts — make it and post it."
fi

# Retry loop with exponential backoff (1s, 2s, 4s)
MAX_RETRIES=3
attempt=1
delay=1
while [ $attempt -le $MAX_RETRIES ]; do
  echo "$(stamp) running: $TAG (attempt $attempt/$MAX_RETRIES)" >> "$LOG"
  "$CLAUDE" -p "$PROMPT" --model "$MODEL" --permission-mode bypassPermissions --add-dir "$REPO_ROOT" >> "$LOG" 2>&1
  EXIT=$?
  if [ $EXIT -eq 0 ]; then
    echo "$(stamp) done: $TAG" >> "$LOG"
    exit 0
  fi
  echo "$(stamp) FAILED: $TAG (exit $EXIT, attempt $attempt/$MAX_RETRIES)" >> "$LOG"
  if [ $attempt -lt $MAX_RETRIES ]; then
    echo "$(stamp) retrying in ${delay}s…" >> "$LOG"
    sleep $delay
    delay=$((delay * 2))
  fi
  attempt=$((attempt + 1))
done
echo "$(stamp) GIVING UP: $TAG after $MAX_RETRIES attempts" >> "$LOG"
exit 1
