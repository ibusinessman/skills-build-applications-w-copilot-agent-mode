#!/bin/sh
# Verify platform credentials and framework structure without posting anything.
# Run this before turning loop: on.
#   sh automation/check.sh
set -u

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)
cd "$REPO_ROOT" || exit 1

PASS=0; FAIL=0; WARN=0
ok()   { printf '  \033[32m✓\033[0m  %s\n' "$*"; PASS=$((PASS+1)); }
fail() { printf '  \033[31m✗\033[0m  %s\n' "$*"; FAIL=$((FAIL+1)); }
warn() { printf '  \033[33m!\033[0m  %s\n' "$*"; WARN=$((WARN+1)); }

echo ""
echo "AttentionAgent — pre-flight check"
echo "=================================="

# --- framework structure ---
echo ""
echo "Structure"
for f in agent.json automation/config.md automation/run.sh automation/install.sh \
          automation/check.sh automation/notify/slack.py \
          automation/post/cdn_upload.py \
          company/brand.md company/product.md company/icp.md company/offers.md \
          analytics/sources.md analytics/winners.md \
          analytics/skills/self-study/SKILL.md \
          analytics/skills/weekly-report/SKILL.md \
          meta-ads/rules.md meta-ads/ad-account.md \
          meta-ads/skills/promote-winners/SKILL.md; do
  [ -f "$REPO_ROOT/$f" ] && ok "$f" || fail "missing: $f"
done

_check_schedule_skills() {
  # $1=area (e.g. organic-short-form), $2=skills_subdir (e.g. skills)
  area="$1"; skills_subdir="$2"
  sched="$REPO_ROOT/$area/schedule.md"
  [ -f "$sched" ] && ok "$area/schedule.md" || { fail "missing: $area/schedule.md"; return; }
  while IFS= read -r line; do
    stripped=$(printf '%s' "$line" | sed 's/^[[:space:]]*//')
    case "$stripped" in \|*) ;; *) continue ;; esac
    case "$stripped" in *-*-*) continue ;; esac
    skill=$(printf '%s' "$stripped" | awk -F'|' '{gsub(/ /,"",$4); print $4}')
    [ -z "$skill" ] || [ "$skill" = "skill" ] || [ "$skill" = "-" ] && continue
    d="$REPO_ROOT/$area/$skills_subdir/$skill"
    [ -d "$d" ] && ok "$area/$skills_subdir/$skill/" || fail "missing skill dir: $area/$skills_subdir/$skill/"
  done < "$sched"
}

for area in organic-short-form organic-text; do
  _check_schedule_skills "$area" "skills"
done
_check_schedule_skills "analytics" "skills"

# --- .env ---
echo ""
echo "Credentials (.env)"
ENV_FILE="$REPO_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  fail ".env not found — copy .env.example to .env and fill in your keys"
else
  ok ".env exists"
  # Load .env into the current shell environment so the checks below work.
  # Uses python3 to avoid shell quoting issues with special characters in values.
  eval "$(python3 - "$ENV_FILE" <<'PY'
import sys, os
path = sys.argv[1]
for raw in open(path).read().splitlines():
    line = raw.strip()
    if not line or line.startswith('#') or '=' not in line:
        continue
    k, _, v = line.partition('=')
    k = k.strip()
    v = v.strip().strip('"').strip("'")
    if k and v:
        # Only export if not already set
        if k not in os.environ:
            # Escape single quotes in v for the eval'd shell assignment
            safe = v.replace("'", "'\\''")
            print("export %s='%s'" % (k, safe))
PY
  )"

  # Check each platform's required vars
  _check() {
    label="$1"; shift
    all_set=1
    for v in "$@"; do
      val=$(eval "printf '%s' \"\${${v}:-}\"")
      [ -z "$val" ] && all_set=0 && break
    done
    [ "$all_set" -eq 1 ] \
      && ok "$label keys present" \
      || warn "$label: one or more keys missing ($*)"
  }

  _check "X (Twitter)"  X_API_KEY X_API_SECRET X_ACCESS_TOKEN X_ACCESS_TOKEN_SECRET
  _check "Instagram"    IG_USER_ID IG_ACCESS_TOKEN
  _check "Facebook"     FB_PAGE_ID FB_PAGE_ACCESS_TOKEN
  _check "Threads"      THREADS_USER_ID THREADS_ACCESS_TOKEN
  _check "LinkedIn"     LINKEDIN_ACCESS_TOKEN LINKEDIN_AUTHOR_URN
  _check "YouTube"      YOUTUBE_CLIENT_ID YOUTUBE_CLIENT_SECRET YOUTUBE_REFRESH_TOKEN
  _check "TikTok"       TIKTOK_ACCESS_TOKEN
  _check "Meta Ads"     META_ACCESS_TOKEN META_AD_ACCOUNT_ID
  _check "CDN / S3"     S3_BUCKET S3_REGION S3_ACCESS_KEY S3_SECRET_KEY S3_PUBLIC_BASE_URL
  # Slack is optional — warn only if the key name is present but empty
  slack_url=$(eval "printf '%s' \"\${SLACK_WEBHOOK_URL:-}\"")
  if [ -n "$slack_url" ]; then
    ok "Slack webhook configured"
  else
    warn "Slack: SLACK_WEBHOOK_URL not set (optional — notifications disabled)"
  fi
fi

# --- company/ brain filled in ---
echo ""
echo "Company brain (placeholder check)"
# Detect lines that still contain angle-bracket placeholders like <your company name>
# Pattern: a < followed by a word char (avoids matching HTML tags in comments)
for f in company/brand.md company/product.md company/icp.md company/offers.md; do
  placeholders=$(grep -cE '<[a-zA-Z]' "$REPO_ROOT/$f" 2>/dev/null || echo 0)
  if [ "$placeholders" -gt 0 ]; then
    warn "$f: $placeholders line(s) still have unfilled <placeholders>"
  else
    ok "$f looks filled in"
  fi
done

# --- dry-run each poster (syntax + import check) ---
echo ""
echo "Platform scripts"
for platform in x instagram facebook threads linkedin youtube tiktok; do
  script="$REPO_ROOT/automation/post/${platform}.py"
  if [ -f "$script" ]; then
    # Check it parses cleanly first
    if ! python3 -m py_compile "$script" 2>/dev/null; then
      fail "${platform}.py has a syntax error"
      continue
    fi
    # Dry-run: always returns ok=true but confirms the script is importable
    out=$(python3 "$script" --dry-run 2>&1)
    if printf '%s' "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('ok') else 1)" 2>/dev/null; then
      # Check if the platform's creds were present in the dry-run report
      missing=$(printf '%s' "$out" | python3 -c "
import sys,json
d=json.load(sys.stdin)
creds=d.get('creds_present',{})
missing=[k for k,v in creds.items() if not v]
print(','.join(missing))
" 2>/dev/null)
      if [ -n "$missing" ]; then
        warn "${platform}.py: missing credentials: $missing"
      else
        ok "${platform}.py: script ok, creds present"
      fi
    else
      fail "${platform}.py --dry-run failed: $out"
    fi
  else
    warn "no poster script for: $platform"
  fi
done

# CDN upload script
cdn_script="$REPO_ROOT/automation/post/cdn_upload.py"
if python3 -m py_compile "$cdn_script" 2>/dev/null; then
  out=$(python3 "$cdn_script" --dry-run 2>&1)
  if printf '%s' "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('ok') else 1)" 2>/dev/null; then
    missing=$(printf '%s' "$out" | python3 -c "
import sys,json
d=json.load(sys.stdin)
creds=d.get('creds_present',{})
missing=[k for k,v in creds.items() if not v]
print(','.join(missing))
" 2>/dev/null)
    [ -n "$missing" ] \
      && warn "cdn_upload.py: missing S3 credentials: $missing" \
      || ok "cdn_upload.py: script ok, S3 creds present"
  else
    fail "cdn_upload.py --dry-run failed"
  fi
else
  fail "cdn_upload.py has a syntax error"
fi

# Slack notify script
notify_script="$REPO_ROOT/automation/notify/slack.py"
python3 -m py_compile "$notify_script" 2>/dev/null \
  && ok "notify/slack.py syntax ok" \
  || fail "notify/slack.py has a syntax error"

# --- loop config ---
echo ""
echo "Loop config"
LOOP=$(grep -E '^loop:' "$REPO_ROOT/automation/config.md" 2>/dev/null | head -1 \
       | sed 's/^loop:[[:space:]]*//' | tr -d '[:space:]')
if [ "${LOOP:-off}" = "on" ]; then
  ok "loop is ON"
else
  warn "loop is OFF — set 'loop: on' in automation/config.md when ready"
fi

# --- claude binary ---
CLAUDE=$(command -v claude 2>/dev/null || true)
[ -z "${CLAUDE:-}" ] && [ -x "$HOME/.local/bin/claude" ] && CLAUDE="$HOME/.local/bin/claude"
[ -n "${CLAUDE:-}" ] && ok "claude found: $CLAUDE" || fail "claude not found in PATH or ~/.local/bin"

# --- python3 ---
command -v python3 >/dev/null 2>&1 && ok "python3 found" || fail "python3 not found in PATH"

# --- summary ---
echo ""
echo "----------------------------------"
printf "  %s passed  %s warnings  %s failed\n" "$PASS" "$WARN" "$FAIL"
echo ""
if [ $FAIL -gt 0 ]; then
  echo "Fix the failures above before turning the loop on."
elif [ $WARN -gt 0 ]; then
  echo "Warnings: fill in the remaining items, then turn the loop on."
else
  echo "All checks passed. Ready to run."
fi
echo ""
exit $FAIL
