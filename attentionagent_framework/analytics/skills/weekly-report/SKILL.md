# Skill: weekly-report

**Goal:** Produce a weekly performance summary every Sunday at 21:00 and post it to Slack.
Covers: what worked, what didn't, the top 3 posts, and next-week recommendations.

---

## Trigger

Scheduled via `automation/install.sh` — add to `meta-ads/schedule.md`... actually this skill
is triggered differently: add a row to a dedicated analytics schedule.
See `analytics/schedule.md` (create it if absent).

---

## Steps

1. **Collect this week's posts**
   - Read `organic-short-form/sets/*/published.log` and `organic-text/sets/*/published.log`.
   - Filter for lines where the ISO-8601 date falls within the last 7 days (Mon–Sun).
   - Build a list: `[{area, platform, post_id, datetime}]`.

2. **Pull metrics for each post**
   - Follow the instructions in `analytics/sources.md` for each platform.
   - For each post, collect: `reach`, `likes`, `comments`, `saves`, `shares`.
   - Compute: `engagement_rate = (likes + comments + saves + shares) / reach`.

3. **Rank posts**
   - Sort by `engagement_rate DESC`, break ties by `reach DESC`.
   - Tag top 3 as "winners", bottom 3 as "needs improvement".

4. **Identify patterns**
   - Compare skill types: did tutorial-quick (skill-3) outperform hook-value-cta (skill-1)?
   - Compare times: which posting hour had the highest average reach?
   - Compare platforms: which platform delivered best engagement rate this week?

5. **Read current memory**
   - Read `company/memory/content-performance.md`.
   - Check whether the patterns this week confirm or contradict prior lessons.

6. **Write the weekly report**
   Save to `analytics/reports/weekly-<YYYY-WW>.md` with this structure:

   ```markdown
   # Weekly Report — Week <WW>, <YYYY>

   ## Top 3 posts
   | Rank | Platform | Post ID | Reach | Eng Rate | Skill |
   ...

   ## Bottom posts
   ...

   ## Patterns
   - Best skill this week: ...
   - Best posting hour: ...
   - Best platform: ...

   ## Wins vs prior week
   ...

   ## Next-week recommendations
   1. ...
   2. ...
   3. ...
   ```

7. **Update memory**
   Append a summary block to `company/memory/content-performance.md`:
   ```
   ## Week <WW>-<YYYY>
   - Top skill: <name>
   - Best hour: <HH:00>
   - Best platform: <name>
   - Key lesson: <one sentence>
   ```

8. **Post to Slack**
   Run:
   ```
   python3 automation/notify/slack.py --tag "weekly-report" --status ok --detail "Week <WW>: <top post summary>"
   ```
   If `SLACK_WEBHOOK_URL` is not set, skip silently.
