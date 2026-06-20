#!/bin/sh
# Runs ONE scheduled action, then exits. Called by each cron/launchd/systemd alarm.
#   run.sh <area> <set> <skill>   make content and post it (organic areas)
#   run.sh meta-ads - <skill>     run a meta-ads skill (no set/accounts)
#   run.sh --study                pull metrics, self-study, write daily report
# Respects the loop: on/off switch in automation/config.md.
# Retries up to MAX_RETRIES times with exponential backoff on failure.
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
  PROMPT="End-of-day self-study: (1) collect today's post IDs from every published.log in organic-short-form/sets/ and organic-text/sets/, (2) pull metrics for those IDs using analytics/sources.md, (3) score and update analytics/winners.md with today's top performers, (4) run the self-study skill at analytics/skills/self-study/SKILL.md, (5) append lessons to company/memory/content-performance.md, (6) write today's report to analytics/reports/report-$(date +%Y-%m-%d).md."

elif [ "${1:-}" = "meta-ads" ]; then
  # Meta-ads skills operate globally — no set or accounts directory
  SKILL="${3:-}"
  if [ -z "$SKILL" ] || [ "$SKILL" = "-" ]; then
    echo "$(stamp) ERROR: meta-ads requires a skill name as arg 3" >> "$LOG"; exit 1
  fi
  SKILL_DIR="$REPO_ROOT/meta-ads/skills/$SKILL"
  if [ ! -d "$SKILL_DIR" ]; then
    echo "$(stamp) ERROR: skill directory not found: $SKILL_DIR" >> "$LOG"; exit 1
  fi
  TAG="meta-ads/$SKILL"
  PROMPT="Run the meta-ads skill '$SKILL' from meta-ads/skills/$SKILL/SKILL.md now. Read company/ for brand context. Read analytics/winners.md for today's top posts. Read meta-ads/rules.md for eligibility criteria. Read meta-ads/ad-account.md for the Ad Account ID and audience config. Follow every step in the skill exactly. Load API credentials from .env. Log errors to automation/logs/meta-ads-$(date +%Y-%m-%d).log and continue — never abort the full run for one campaign failure."

else
  AREA="${1:-}"; SET="${2:-}"; SKILL="${3:-}"
  if [ -z "$AREA" ] || [ -z "$SET" ] || [ -z "$SKILL" ]; then
    echo "$(stamp) ERROR usage: run.sh <area> <set> <skill> | meta-ads - <skill> | --study" >> "$LOG"; exit 1
  fi
  SKILL_DIR="$REPO_ROOT/$AREA/skills/$SKILL"
  SET_DIR="$REPO_ROOT/$AREA/sets/$SET"
  if [ ! -d "$SKILL_DIR" ]; then
    echo "$(stamp) ERROR: skill directory not found: $SKILL_DIR" >> "$LOG"; exit 1
  fi
  if [ ! -d "$SET_DIR" ]; then
    echo "$(stamp) ERROR: set directory not found: $SET_DIR" >> "$LOG"; exit 1
  fi
  TAG="$AREA/$SET/$SKILL"
  PROMPT="Run skill '$SKILL' from $AREA/skills/$SKILL/SKILL.md now: (1) read company/ in the order defined in company/README.md, (2) make ONE piece of content, (3) post it to every ENABLED account in $AREA/sets/$SET/accounts/ — skip any account file containing 'disabled: true', (4) for each enabled account run 'python3 automation/post/<platform>.py' where <platform> is the filename without .md, loading API keys from .env, (5) after each successful post append one line to $AREA/sets/$SET/published.log: '<ISO-8601-datetime> <platform> <post-id>'. No drafts, no approval — make it and post it."
fi

# Retry with exponential backoff (1s → 2s → 4s)
MAX_RETRIES=3
attempt=1
delay=1
while [ $attempt -le $MAX_RETRIES ]; do
  echo "$(stamp) running: $TAG (attempt $attempt/$MAX_RETRIES)" >> "$LOG"
  "$CLAUDE" -p "$PROMPT" --model "$MODEL" --permission-mode bypassPermissions --add-dir "$REPO_ROOT" >> "$LOG" 2>&1
  EXIT=$?
  if [ $EXIT -eq 0 ]; then
    echo "$(stamp) done: $TAG" >> "$LOG"
    python3 "$REPO_ROOT/automation/notify/slack.py" --tag "$TAG" --status ok 2>/dev/null || true
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
python3 "$REPO_ROOT/automation/notify/slack.py" --tag "$TAG" --status failed --detail "gave up after $MAX_RETRIES attempts" 2>/dev/null || true
exit 1
