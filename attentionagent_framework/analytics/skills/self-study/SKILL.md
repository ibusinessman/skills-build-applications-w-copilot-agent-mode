# Skill: self-study (nightly)

Runs at 23:30 every night. Pulls metrics, identifies winners, extracts lessons,
and writes a daily report. This is how the AI CMO learns what works.

## Steps

1. **Collect today's post IDs** by reading every `published.log` in every set across
   `organic-short-form/sets/` and `organic-text/sets/`. Filter to entries from the last
   48 hours. Each line is `<ISO-datetime> <platform> <post-id>`.

2. **Pull metrics** for those specific post IDs from each platform.
   Use the API endpoints and auth env vars in `analytics/sources.md`. Use credentials from `.env`.

3. **Score each post** using these signals (in order of importance):
   - save rate  (saves / reach)
   - share rate (shares / reach)
   - comment rate (comments / reach)
   - like rate (likes / reach)

4. **Update `analytics/winners.md`** — append today's top posts (reach ≥ 200,
   engagement rate ≥ 5%) in the table format defined in that file.

5. **Extract lessons** — for each winner, write one sentence: WHY it worked
   (hook style, topic, format, time posted). For the bottom performers, do the same.

6. **Append to `company/memory/content-performance.md`** in this format:
   ```
   ## <YYYY-MM-DD>
   **Winner pattern:** <one sentence>
   **Loser pattern:** <one sentence>
   **Rule going forward:** <one actionable rule for the content skills>
   ```

7. **Write daily report** to `analytics/reports/report-<YYYY-MM-DD>.md` using the
   template below.

## Report template
```markdown
# Daily report — <YYYY-MM-DD>

## Summary
- Posts published: <n>
- Total reach: <n>
- Top platform: <platform>
- Best post: <url> (<reach> reach, <eng_rate>% engagement)

## Winners (qualify for ads)
<table from winners.md for today>

## Lessons
<bullet list of lessons from step 4>

## Rules applied next run
<rules from step 5>
```
