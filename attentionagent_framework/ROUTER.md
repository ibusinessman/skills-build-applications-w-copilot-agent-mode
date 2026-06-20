# Router — how to operate this framework

Read this first if you are an AI agent working in this repo.

## What this is
An AI CMO for ONE company, run from files. Two organic content types + ads + analytics,
driven by per-area schedules and an automation engine. ADD — don't rebuild.

## Sections
1. `company/` — shared brain (brand, product, ICP, offers, memory). Read first. No competitors.
2. `organic-short-form/` — short-form video: `schedule.md` + `skills/` + `sets/`.
3. `organic-text/` — text posts: same shape.
4. `meta-ads/` — ads on winners: `rules.md`, `ad-account.md`, `skills/`, `campaigns/`, and
   `schedule.md` (off by default).
5. `analytics/` — `sources.md`, `winners.md`, `reports/`, `skills/` (incl. `self-study`).
6. `automation/` — the engine: `install.sh`, `run.sh`, `config.md`, `post/`, `logs/`.

## Schedules = cron jobs
Each area's `schedule.md` rows are `| time | set | skill |`. `automation/install.sh` turns
each row into a real OS alarm that runs `run.sh <area> <set> <skill>` → make the skill's
content once → post it to that set's accounts via `automation/post/<platform>.py`.

## Terms
- **set** = one account per platform (the group a post goes to). Lives under `<area>/sets/`.
- **skill** = a content style / recipe. Lives under `<area>/skills/`. Reusable across sets.
- **account file** = `<platform>.md` (handle only); the keys live in `.env`.

## On / off
`automation/config.md`: `loop: on` runs it, `loop: off` pauses. `install.sh --remove` deletes the alarms.
