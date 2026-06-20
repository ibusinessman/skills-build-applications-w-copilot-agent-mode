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
          company/brand.md company/product.md company/icp.md company/offers.md \
          analytics/sources.md analytics/winners.md \
          analytics/skills/self-study/SKILL.md \
          meta-ads/rules.md meta-ads/ad-account.md; do
  [ -f "$REPO_ROOT/$f" ] && ok "$f" || fail "missing: $f"
done

for area in organic-short-form organic-text; do
  sched="$REPO_ROOT/$area/schedule.md"
  [ -f "$sched" ] && ok "$area/schedule.md" || fail "missing: $area/schedule.md"
  # Check each skill referenced in the schedule exists
  while IFS= read -r line; do
    stripped=$(printf '%s' "$line" | sed 's/^[[:space:]]*//')
    case "$stripped" in \|*) ;; *) continue ;; esac
    cols=$(printf '%s' "$stripped" | sed 's/^|//;s/|$//' | tr '|' '\n')
    skill=$(printf '%s' "$cols" | sed -n '3p' | tr -d ' ')
    [ -z "$skill" ] || [ "$skill" = "skill" ] && continue
    d="$REPO_ROOT/$area/skills/$skill"
    [ -d "$d" ] && ok "$area/skills/$skill/" || fail "missing skill dir: $area/skills/$skill/"
  done < "$sched"
done

# --- .env ---
echo ""
echo "Credentials (.env)"
ENV_FILE="$REPO_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
  fail ".env not found — copy .env.example to .env and fill in your keys"
else
  ok ".env exists"
  # Load it
  while IFS= read -r line; do
    case "$line" in "#"*|"") continue ;; esac
    key=$(printf '%s' "$line" | cut -d= -f1)
    val=$(printf '%s' "$line" | cut -d= -f2-)
    val=$(printf '%s' "$val" | sed "s/^['\"]//;s/['\"]$//")
    [ -n "$val" ] && export "$key=$val" 2>/dev/null || true
  done < "$ENV_FILE"

  for v in X_API_KEY X_API_SECRET X_ACCESS_TOKEN X_ACCESS_TOKEN_SECRET; do
    [ -n "${X_API_KEY:-}" ] && break
    warn "X (Twitter) keys not set — x.py will fail"
    break
  done
  [ -n "${X_API_KEY:-}" ] && [ -n "${X_API_SECRET:-}" ] && [ -n "${X_ACCESS_TOKEN:-}" ] && [ -n "${X_ACCESS_TOKEN_SECRET:-}" ] \
    && ok "X keys present" || warn "X: one or more keys missing"
  [ -n "${IG_USER_ID:-}" ] && [ -n "${IG_ACCESS_TOKEN:-}" ] \
    && ok "Instagram keys present" || warn "Instagram: IG_USER_ID or IG_ACCESS_TOKEN missing"
  [ -n "${FB_PAGE_ID:-}" ] && [ -n "${FB_PAGE_ACCESS_TOKEN:-}" ] \
    && ok "Facebook keys present" || warn "Facebook: FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN missing"
  [ -n "${THREADS_USER_ID:-}" ] && [ -n "${THREADS_ACCESS_TOKEN:-}" ] \
    && ok "Threads keys present" || warn "Threads: THREADS_USER_ID or THREADS_ACCESS_TOKEN missing"
  [ -n "${LINKEDIN_ACCESS_TOKEN:-}" ] && [ -n "${LINKEDIN_AUTHOR_URN:-}" ] \
    && ok "LinkedIn keys present" || warn "LinkedIn: LINKEDIN_ACCESS_TOKEN or LINKEDIN_AUTHOR_URN missing"
  [ -n "${YOUTUBE_CLIENT_ID:-}" ] && [ -n "${YOUTUBE_CLIENT_SECRET:-}" ] && [ -n "${YOUTUBE_REFRESH_TOKEN:-}" ] \
    && ok "YouTube keys present" || warn "YouTube: one or more OAuth keys missing"
  [ -n "${TIKTOK_ACCESS_TOKEN:-}" ] \
    && ok "TikTok key present" || warn "TikTok: TIKTOK_ACCESS_TOKEN missing"
fi

# --- company/ brain filled in ---
echo ""
echo "Company brain (placeholder check)"
for f in company/brand.md company/product.md company/icp.md company/offers.md; do
  placeholders=$(grep -c '<' "$REPO_ROOT/$f" 2>/dev/null || echo 0)
  if [ "$placeholders" -gt 0 ]; then
    warn "$f still has $placeholders unfilled placeholder(s)"
  else
    ok "$f looks filled in"
  fi
done

# --- dry-run each poster ---
echo ""
echo "Platform dry-run"
for platform in x instagram facebook threads linkedin youtube tiktok; do
  script="$REPO_ROOT/automation/post/${platform}.py"
  if [ -f "$script" ]; then
    out=$(python3 "$script" --dry-run 2>&1)
    if printf '%s' "$out" | python3 -c "import sys,json; d=json.load(sys.stdin); sys.exit(0 if d.get('ok') else 1)" 2>/dev/null; then
      ok "${platform}.py --dry-run passed"
    else
      fail "${platform}.py --dry-run failed: $out"
    fi
  else
    warn "no poster for $platform"
  fi
done

# --- loop config ---
echo ""
echo "Loop config"
LOOP=$(grep -E '^loop:' "$REPO_ROOT/automation/config.md" 2>/dev/null | head -1 | sed 's/^loop:[[:space:]]*//' | tr -d '[:space:]')
if [ "${LOOP:-off}" = "on" ]; then
  ok "loop is ON"
else
  warn "loop is OFF — set 'loop: on' in automation/config.md when ready"
fi

# --- claude binary ---
CLAUDE=$(command -v claude 2>/dev/null || true)
[ -z "${CLAUDE:-}" ] && [ -x "$HOME/.local/bin/claude" ] && CLAUDE="$HOME/.local/bin/claude"
[ -n "${CLAUDE:-}" ] && ok "claude binary found: $CLAUDE" || fail "claude not found in PATH"

# --- summary ---
echo ""
echo "----------------------------------"
printf "  %s passed  %s warnings  %s failed\n" "$PASS" "$WARN" "$FAIL"
echo ""
[ $FAIL -eq 0 ] && echo "Ready to run." || echo "Fix the failures above before turning the loop on."
echo ""
exit $FAIL
