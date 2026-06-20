#!/bin/sh
# Turns every content area's schedule.md into real OS alarms — one alarm per row.
# Reads: organic-short-form, organic-text, meta-ads, analytics schedule.md files.
# Optional 4th column in schedule tables: days (crontab day-of-week: * 0-6 or Sun Mon …)
#   sh automation/install.sh           install all alarms from the schedules
#   sh automation/install.sh --remove  remove them all
# macOS  -> launchd (~/Library/LaunchAgents)
# Linux  -> crontab if available, else systemd user timers (~/.config/systemd/user/)
set -u

PREFIX="com.aicmo"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd -P)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd -P)
RUN="$REPO_ROOT/automation/run.sh"
LOGS="$REPO_ROOT/automation/logs"
OS=$(uname -s)
LA="$HOME/Library/LaunchAgents"
SD="$HOME/.config/systemd/user"

# Detect Linux scheduler: prefer crontab, fall back to systemd user timers
LINUX_SCHED="none"
if [ "$OS" = "Linux" ]; then
  command -v crontab >/dev/null 2>&1 && LINUX_SCHED="crontab"
  [ "$LINUX_SCHED" = "none" ] && command -v systemctl >/dev/null 2>&1 && LINUX_SCHED="systemd"
fi

remove_all() {
  case "$OS" in
    Darwin)
      for f in "$LA/$PREFIX."*.plist; do
        [ -e "$f" ] || continue
        launchctl unload "$f" 2>/dev/null || true
        rm -f "$f"
      done ;;
    Linux)
      case "$LINUX_SCHED" in
        crontab)
          crontab -l 2>/dev/null | grep -v "# $PREFIX" | crontab - 2>/dev/null || true ;;
        systemd)
          for f in "$SD/$PREFIX-"*.timer "$SD/$PREFIX-"*.service; do
            [ -e "$f" ] || continue
            unit=$(basename "$f")
            systemctl --user stop "$unit" 2>/dev/null || true
            systemctl --user disable "$unit" 2>/dev/null || true
            rm -f "$f"
          done
          systemctl --user daemon-reload 2>/dev/null || true ;;
      esac ;;
  esac
}

if [ "${1:-}" = "--remove" ] || [ "${1:-}" = "-r" ]; then
  remove_all
  echo "Removed all $PREFIX jobs."
  exit 0
fi
remove_all
mkdir -p "$LOGS"; chmod +x "$RUN" 2>/dev/null || true

# Parse all schedule.md files → TSV: area TAB set TAB skill TAB hh TAB mm TAB days
# areas: organic-short-form, organic-text, meta-ads, analytics
# days column (optional, default *): crontab day-of-week 0-6 or name (Sun Mon …) or *
TMP=$(mktemp)
python3 - "$REPO_ROOT" > "$TMP" <<'PY'
import sys, re, pathlib

DAY_MAP = {"sun": "0", "mon": "1", "tue": "2", "wed": "3",
           "thu": "4", "fri": "5", "sat": "6",
           "sunday": "0", "monday": "1", "tuesday": "2", "wednesday": "3",
           "thursday": "4", "friday": "5", "saturday": "6"}

root = pathlib.Path(sys.argv[1])
for area in ["organic-short-form", "organic-text", "meta-ads", "analytics"]:
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
        if not skill:
            continue
        # Optional 4th column: day-of-week
        raw_days = cols[3].strip() if len(cols) >= 4 else "*"
        days = DAY_MAP.get(raw_days.lower(), raw_days) if raw_days else "*"
        if not days:
            days = "*"
        print("%s\t%s\t%s\t%d\t%d\t%s" % (
            area, setname, skill,
            int(m.group(1)), int(m.group(2)), days))
PY

install_systemd_timer() {
  # $1=label $2=hh $3=mm $4=days $5+ = command args
  label="$1"; hh="$2"; mm="$3"; days="$4"; shift 4
  mkdir -p "$SD"
  # Translate crontab day number to systemd day abbreviation
  _dow=""
  case "$days" in
    0) _dow="Sun " ;; 1) _dow="Mon " ;; 2) _dow="Tue " ;;
    3) _dow="Wed " ;; 4) _dow="Thu " ;; 5) _dow="Fri " ;;
    6) _dow="Sat " ;; *) _dow="" ;;
  esac
  cat > "$SD/${label}.service" <<EOF
[Unit]
Description=AI CMO: $label

[Service]
Type=oneshot
ExecStart=/bin/sh $RUN $*
StandardOutput=append:$LOGS/systemd.log
StandardError=append:$LOGS/systemd.log
WorkingDirectory=$REPO_ROOT
EOF
  cat > "$SD/${label}.timer" <<EOF
[Unit]
Description=AI CMO timer: $label

[Timer]
OnCalendar=${_dow}*-*-* $(printf '%02d:%02d:00' "$hh" "$mm")
Persistent=true

[Install]
WantedBy=timers.target
EOF
  systemctl --user daemon-reload
  systemctl --user enable --now "${label}.timer" 2>/dev/null || \
    echo "  (systemctl enable failed — run 'systemctl --user start ${label}.timer' manually)"
}

CRON_TMP=$(mktemp); TAB=$(printf '\t')
echo "Installing alarms from schedules ($LINUX_SCHED):"; echo ""
while IFS="$TAB" read -r area setn skill hh mm days; do
  [ -n "${area:-}" ] || continue
  label="$PREFIX.$area-$setn-$skill.t$(printf '%02d%02d' "$hh" "$mm")"
  case "$OS" in
    Darwin)
      # launchd does not support day-of-week natively in StartCalendarInterval weekday form;
      # use Weekday key (0=Sun) when days != *
      if [ "$days" = "*" ]; then
        dow_xml=""
      else
        dow_xml="<key>Weekday</key><integer>$days</integer>"
      fi
      cat > "$LA/$label.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$label</string>
  <key>ProgramArguments</key><array><string>/bin/sh</string><string>$RUN</string><string>$area</string><string>$setn</string><string>$skill</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$hh</integer><key>Minute</key><integer>$mm</integer>$dow_xml</dict>
  <key>StandardOutPath</key><string>$LOGS/launchd.out.log</string>
  <key>StandardErrorPath</key><string>$LOGS/launchd.err.log</string>
</dict></plist>
EOF
      launchctl unload "$LA/$label.plist" 2>/dev/null || true
      launchctl load "$LA/$label.plist" ;;
    Linux)
      case "$LINUX_SCHED" in
        crontab) printf '%d %d * * %s /bin/sh "%s" "%s" "%s" "%s" >> "%s/cron.log" 2>&1 # %s\n' \
                   "$mm" "$hh" "$days" "$RUN" "$area" "$setn" "$skill" "$LOGS" "$PREFIX" >> "$CRON_TMP" ;;
        systemd) install_systemd_timer "$label" "$hh" "$mm" "$days" "$area" "$setn" "$skill" ;;
        *)       echo "  WARNING: no scheduler found — alarm not registered for $label" ;;
      esac ;;
  esac
  if [ "$days" = "*" ]; then
    printf '  %02d:%02d  daily    %s  set=%s  skill=%s\n' "$hh" "$mm" "$area" "$setn" "$skill"
  else
    printf '  %02d:%02d  day=%s    %s  set=%s  skill=%s\n' "$hh" "$mm" "$days" "$area" "$setn" "$skill"
  fi
done < "$TMP"
rm -f "$TMP"

# Commit crontab if using it
[ "$LINUX_SCHED" = "crontab" ] && \
  { ( crontab -l 2>/dev/null; cat "$CRON_TMP" ) | crontab -; }
rm -f "$CRON_TMP"

echo ""
echo "Done. Scheduler: ${LINUX_SCHED:-launchd (macOS)}"
echo "Loop is currently $(grep -E '^loop:' "$REPO_ROOT/automation/config.md" 2>/dev/null | head -1 | sed 's/^loop:[[:space:]]*//' | tr -d '[:space:]' || echo 'unknown'). Edit automation/config.md to activate."
