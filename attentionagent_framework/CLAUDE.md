# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

An AI CMO (Chief Marketing Officer) framework that autonomously posts organic content, promotes winning posts with Meta Ads, and improves itself via nightly analytics — all driven from markdown files. The automation engine (`automation/`) invokes Claude CLI on a schedule to execute content skills.

## Commands

```sh
# Validate the full setup (structure + credentials + script syntax)
sh automation/check.sh

# Install / reinstall all OS alarms from schedule files
sh automation/install.sh

# Remove all alarms
sh automation/install.sh --remove

# Test a posting script without posting
python3 automation/post/<platform>.py --dry-run

# Dry-run the CDN uploader
python3 automation/post/cdn_upload.py --dry-run

# Run a skill manually (bypasses the loop: on/off switch)
sh automation/run.sh <area> <set> <skill>       # e.g. organic-text set-1 skill-1
sh automation/run.sh analytics - self-study
sh automation/run.sh meta-ads - promote-winners
```

No build step, no test suite, no package manager. Python scripts use stdlib only — never add pip dependencies.

## Architecture

### Execution flow

```
OS alarm (cron / launchd / systemd)
  → automation/run.sh <area> <set> <skill>
    → reads loop: on/off from automation/config.md
    → invokes: claude -p "<PROMPT>" --permission-mode bypassPermissions --add-dir <repo>
      → Claude reads the SKILL.md, reads company/, generates content
      → runs python3 automation/post/<platform>.py --text "..." [--media ...]
      → appends to <area>/sets/<set>/published.log
    → on success: notifies Slack via automation/notify/slack.py
```

### Directory roles

| Path | Role |
|---|---|
| `company/` | Shared brand brain — every skill reads this first (see `company/README.md` for order) |
| `<area>/skills/<name>/SKILL.md` | Prompt instructions for Claude — defines content format, steps, dedup rules |
| `<area>/sets/<name>/accounts/` | One `.md` per platform. Add `- disabled: true` to skip without deleting |
| `<area>/schedule.md` | Cron table: `\| time \| set \| skill \| days \|` — edit then re-run `install.sh` |
| `analytics/winners.md` | Updated nightly by self-study; read by meta-ads promote-winners |
| `company/memory/content-performance.md` | Running lessons — appended by self-study, read by all skills |
| `analytics/reports/` | Daily reports written by self-study skill |
| `meta-ads/campaigns/` | One file per active campaign written by promote-winners |
| `automation/logs/` | One log per day; Slack notified on failure |

### Areas and their shapes

All four areas follow the same pattern but have different set/accounts behaviour:

- **`organic-short-form/`** and **`organic-text/`** — have sets with account files; skill produces content and posts to each enabled account
- **`meta-ads/`** and **`analytics/`** — set is always `-`; no accounts directory; `run.sh` skips set validation

### Schedules

Each `schedule.md` is a markdown table parsed by `install.sh`'s embedded Python. Columns: `time | set | skill | days` where `days` is a crontab day-of-week (`*`, `0`–`6`, or `Sun`–`Sat`). Adding a row and re-running `install.sh` registers a new OS alarm.

### Posting scripts (`automation/post/`)

All extend `_lib.py` (stdlib only). Key details:
- Instagram, Facebook, Threads require a **public HTTPS URL** for media — use `media_host.py` to auto-upload to S3 first
- X, LinkedIn, YouTube, TikTok accept local file paths
- TikTok supports text-only via `/v2/post/publish/text/` (max 300 chars, auto-truncated)
- `_lib.py` handles 429 rate-limits with `Retry-After` sleep and network errors with exponential backoff (3 retries, 60s timeout)
- Every poster prints one JSON line: `{"ok": true, ...}` or `{"ok": false, "error": "..."}`

### Credentials

All API keys live in `.env` at the repo root. Account `.md` files contain only the handle. Never put keys in account files. The `.gitignore` excludes `.env` and large media files.

### Analytics feedback loop

```
published.log → self-study pulls metrics → winners.md → promote-winners creates Meta campaigns
                                         ↓
                              content-performance.md → next skill reads it → better content
```

## Key conventions

- To disable a platform: add `- disabled: true` to the account `.md` file
- To add a new content format: create `<area>/skills/<name>/SKILL.md`, add a row to `schedule.md`, re-run `install.sh`
- To add a new set (new audience/brand): copy an existing set directory, update account handles, add rows to `schedule.md`
- `loop: off` in `automation/config.md` pauses all runs without removing alarms
- Skills should always check `output/` for recent posts to avoid content repetition before generating
- After posting, skills append to `published.log`: `<ISO-8601-datetime> <platform> <post-id>`
