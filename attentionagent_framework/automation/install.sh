#!/bin/sh
# Turns every content area's schedule.md into real OS alarms — one alarm per row.
# Reads: organic-short-form/schedule.md, organic-text/schedule.md, meta-ads/schedule.md
#   sh automation/install.sh           install all alarms from the schedules
#   sh automation/install.sh --remove  remove them all
# macOS -> launchd.  Linux -> crontab.
set -u

PREFIX="com.aicmo"
STUDY_TIME="${CMO_STUDY_TIME:-23:30}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)
RUN="$REPO_ROOT/automation/run.sh"
LOGS="$REPO_ROOT/automation/logs"
OS=$(uname -s)
LA="$HOME/Library/LaunchAgents"

remove_all() {
  case "$OS" in
    Darwin) for f in "$LA/$PREFIX."*.plist; do [ -e "$f" ] || continue; launchctl unload "$f" 2>/dev/null || true; rm -f "$f"; done ;;
    Linux) crontab -l 2>/dev/null | grep -v "# $PREFIX" | crontab - 2>/dev/null || true ;;
  esac
}

if [ "${1:-}" = "--remove" ] || [ "${1:-}" = "-r" ]; then remove_all; echo "Removed all $PREFIX jobs."; exit 0; fi
remove_all
mkdir -p "$LOGS"; chmod +x "$RUN" 2>/dev/null || true

TMP=$(mktemp)
python3 - "$REPO_ROOT" > "$TMP" <<'PY'
import sys, re, pathlib
root = pathlib.Path(sys.argv[1])
for area in ["organic-short-form", "organic-text", "meta-ads"]:
    sched = root / area / "schedule.md"
    if not sched.exists():
        continue
    for line in sched.read_text(encoding="utf-8").splitlines():
        s = line.strip()
        if not s.startswith("|"):
            continue
        cols = [c.strip() for c in s.strip("|").split("|")]
        if len(cols) < 3:
            continue
        m = re.match(r'^(\d{1,2}):(\d{2})$', cols[0])
        if not m:
            continue
        setname, skill = cols[1], cols[2]
        if not setname or not skill:
            continue
        print("%s\t%s\t%s\t%d\t%d" % (area, setname, skill, int(m.group(1)), int(m.group(2))))
PY

CRON_TMP=$(mktemp); TAB=$(printf '\t')
echo "Installing cron jobs from your schedules:"; echo ""
while IFS="$TAB" read -r area setn skill hh mm; do
  [ -n "${area:-}" ] || continue
  label="$PREFIX.$area-$setn-$skill.t$(printf '%02d%02d' "$hh" "$mm")"
  case "$OS" in
    Darwin)
      cat > "$LA/$label.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key><array><string>/bin/sh</string><string>$RUN</string><string>$area</string><string>$setn</string><string>$skill</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$hh</integer><key>Minute</key><integer>$mm</integer></dict>
  <key>StandardOutPath</key><string>$LOGS/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$LOGS/launchd.err.log</string>
</dict></plist>
EOF
      launchctl unload "$LA/$label.plist" 2>/dev/null || true; launchctl load "$LA/$label.plist" ;;
    Linux)
      printf '%d %d * * * /bin/sh "%s" "%s" "%s" "%s" >> "%s/cron.log" 2>&1 # %s\n' "$mm" "$hh" "$RUN" "$area" "$setn" "$skill" "$LOGS" "$PREFIX" >> "$CRON_TMP" ;;
  esac
  printf '  %02d:%02d  %s  set=%s  skill=%s\n' "$hh" "$mm" "$area" "$setn" "$skill"
done < "$TMP"
rm -f "$TMP"

SHH=$(expr "$(printf '%s' "$STUDY_TIME" | cut -d: -f1)" + 0); SMM=$(expr "$(printf '%s' "$STUDY_TIME" | cut -d: -f2)" + 0)
case "$OS" in
  Darwin)
    cat > "$LA/$PREFIX.study.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$PREFIX.study</string>
  <key>ProgramArguments</key><array><string>/bin/sh</string><string>$RUN</string><string>--study</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$SHH</integer><key>Minute</key><integer>$SMM</integer></dict>
  <key>StandardOutPath</key><string>$LOGS/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$LOGS/launchd.err.log</string>
</dict></plist>
EOF
    launchctl unload "$LA/$PREFIX.study.plist" 2>/dev/null || true; launchctl load "$LA/$PREFIX.study.plist" ;;
  Linux) printf '%d %d * * * /bin/sh "%s" --study >> "%s/cron.log" 2>&1 # %s\n' "$SMM" "$SHH" "$RUN" "$LOGS" "$PREFIX" >> "$CRON_TMP" ;;
esac
printf '  %02d:%02d  (nightly self-study)\n' "$SHH" "$SMM"
[ "$OS" = "Linux" ] && ( crontab -l 2>/dev/null; cat "$CRON_TMP" ) | crontab -
rm -f "$CRON_TMP"
echo ""; echo "Done. The loop is OFF by default — set 'loop: on' in automation/config.md to activate."
