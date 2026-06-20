# AI CMO — content + ads engine for one company

An AI Chief Marketing Officer that runs one company's marketing from files. It posts two
kinds of organic content on a schedule, promotes the winners with ads, and studies its own
results — unattended.

## Sections
- `company/` — the brain: brand, product, ICP, offers, memory. Everything reads this first.
  See `company/README.md` for the exact reading order.
- `organic-short-form/` — short-form VIDEO. Has its own `schedule.md`, `skills/`, and `sets/`.
- `organic-text/` — TEXT posts (X, LinkedIn, Threads, Facebook). Same shape, its own schedule.
- `meta-ads/` — paid ads on winning content. Schedule is OFF by default.
- `analytics/` — pulls metrics, tracks winners, runs the nightly self-study.
- `automation/` — the engine: schedules, posting scripts, logs.

## Quick start

```sh
# 1. Copy the example env and fill in your API keys
cp .env.example .env && $EDITOR .env

# 2. Fill in company/ (brand, product, ICP, offers) — see company/README.md

# 3. Fill in account handles in each set's accounts/ folder

# 4. Verify everything before going live
sh automation/check.sh

# 5. Install the scheduled alarms
sh automation/install.sh

# 6. Activate
#    Edit automation/config.md → set loop: on
```

Turn off anytime: change `loop: off` in `automation/config.md`.
Remove all alarms: `sh automation/install.sh --remove`.

## How schedules work

Each area's `schedule.md` is a cron table:

| time  | set   | skill   |
|-------|-------|---------|
| 09:00 | set-1 | skill-1 |

At 09:00, `skill-1` runs once, produces one piece of content, and posts it to every
enabled account in `set-1`. A **set** = one account per platform. A **skill** = a content
style (hook-value-cta, trending-angle, …). Skills are reusable across sets.

## Disabling individual accounts

Add `- disabled: true` to any account `.md` file. That account is skipped without
removing it from the set. Useful when a token expires or a platform is paused.

## Tracking what was posted

Each set writes `published.log` after every successful post:
```
2026-06-20T09:01:14 instagram 18412345678901234
2026-06-20T09:01:22 x 1803456789012345678
```
The nightly self-study uses this to pull metrics for the right post IDs.

## Scale by adding files
- New account group → add a folder under an area's `sets/`.
- New content style → add a folder under an area's `skills/`.
- New posting time → add a row to the area's `schedule.md`, then re-run `install.sh`.

Keep real credentials in `.env` only — it's in `.gitignore`.
