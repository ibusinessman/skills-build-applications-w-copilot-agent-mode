# Router — how to operate this framework

Read this first if you are an AI agent working in this repo.

## What this is
An AI CMO for ONE company, run from files. Two organic content types + ads + analytics,
driven by per-area schedules and an automation engine. ADD — don't rebuild.

## Sections

1. `company/` — shared brain. Read `company/README.md` for the required reading order.
   Files: `brand.md`, `product.md`, `icp.md`, `offers.md`, `memory/content-performance.md`.

2. `organic-short-form/` — short-form VIDEO: `schedule.md` + `skills/` + `sets/`.
   Skills: `hook-value-cta` (retention), `trending-angle` (discovery).

3. `organic-text/` — text posts (X, LinkedIn, Threads, Facebook): same shape.
   Skills: `insight-thread` (saves), `story-lesson` (comments).
   Note: Instagram is disabled in this area — IG requires media on every post.

4. `meta-ads/` — ads on winners: `rules.md`, `ad-account.md`,
   `skills/promote-winners/SKILL.md`, `campaigns/`, and `schedule.md` (off by default).

5. `analytics/` — `sources.md` (API endpoints + correct field names), `winners.md`
   (daily top posts), `reports/` (daily summaries), `skills/self-study/SKILL.md`.

6. `automation/` — the engine:
   - `install.sh` — turns schedule rows into OS alarms (macOS launchd / Linux cron)
   - `run.sh` — executes one scheduled slot; retries on failure; respects loop switch
   - `check.sh` — pre-flight: validates structure, credentials, and script syntax
   - `config.md` — `loop: on / off` switch
   - `post/<platform>.py` — posting scripts (stdlib only, no pip)
   - `logs/` — one file per day

## Schedules = cron jobs
Each area's `schedule.md` rows are `| time | set | skill |`. `install.sh` turns
each row into a real OS alarm → `run.sh <area> <set> <skill>` → the skill produces
content → `post/<platform>.py` posts it to each enabled account.

## Key conventions
- **set** = one account per platform, lives under `<area>/sets/<set-name>/accounts/`
- **skill** = a content style, lives under `<area>/skills/<skill-name>/SKILL.md`
- **account file** = `<platform>.md`; add `- disabled: true` to skip without deleting
- **published.log** = `<area>/sets/<set-name>/published.log`; one line per post:
  `<ISO-datetime> <platform> <post-id>` — written by the skill after each successful post

## On / off
- `automation/config.md`: `loop: on` runs it, `loop: off` pauses without removing alarms
- `install.sh --remove` deletes all OS alarms
- `sh automation/check.sh` — validates the full setup before going live

## Setup order
1. Fill in `company/` (see `company/README.md`)
2. Fill in account handles in each set's `accounts/` folder
3. Add credentials to `.env` (copy from `.env.example`)
4. Run `sh automation/check.sh` — fix any failures or warnings
5. Run `sh automation/install.sh`
6. Set `loop: on` in `automation/config.md`
