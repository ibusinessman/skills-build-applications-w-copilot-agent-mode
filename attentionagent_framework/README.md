# AI CMO — content + ads engine for one company

An AI Chief Marketing Officer that runs one company's marketing from files. It posts two
kinds of organic content on a schedule, promotes the winners with ads, and studies its own
results — unattended.

## Sections
- `company/` — the brain: brand, product, ICP, offers, memory. Everything reads this first.
- `organic-short-form/` — short-form VIDEO. Has its own `schedule.md` (cron jobs), `skills/`
  (content styles), and `sets/` (account groups).
- `organic-text/` — TEXT posts. Same shape, its own schedule.
- `meta-ads/` — paid ads on winning content. Has a `schedule.md` that's OFF by default.
- `analytics/` — measures every account, finds winners, runs the nightly self-study.
- `automation/` — the engine: turns the schedules into real OS alarms and does the posting.

## How a schedule works
Each content area's `schedule.md` is a table of cron jobs:

| time  | set   | skill   |
|-------|-------|---------|
| 09:00 | set-1 | skill-1 |

= at 9am, run `skill-1` (a content style), make the content once, and post it to every
account in `set-1`. A **set = one account per platform** (one IG, one TikTok, …). A
**skill = a content style** (clipping, trending-news, …), reusable across sets.

## Run it
1. Fill in `company/`, your `skills/`, and your `sets/` accounts.
2. Put your API keys in `.env`.
3. `sh automation/install.sh` — turns every `schedule.md` into real daily alarms.
4. Set `loop: on` in `automation/config.md`.

Turn off anytime: `loop: off`, or `sh automation/install.sh --remove`.

## Scale by adding files
- New account group → add a folder under an area's `sets/`.
- New content style → add a folder under an area's `skills/`.
- New posting time → add a row to that area's `schedule.md`, then re-run install.

Keep real keys in `.env` (one file — never commit it).
