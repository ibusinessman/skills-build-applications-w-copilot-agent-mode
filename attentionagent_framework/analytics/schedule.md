# Analytics — schedule

Runs independently of the organic posting areas.
The `area` for these rows is `analytics` and `run.sh` treats it like any other area
(reads `analytics/skills/<skill>/SKILL.md`, no set directory needed — set is `-`).

Add rows here, then re-run `sh automation/install.sh`.

| time  | set | skill         |
|-------|-----|---------------|
| 23:30 | -   | self-study    |
| 21:00 | -   | weekly-report |

<!--
self-study  : runs every night, pulls today's metrics, updates winners.md and memory.
weekly-report : runs every Sunday; install.sh will need day-of-week support to restrict
                this to Sundays only. Until then it runs nightly and overwrites the same file.
                A future improvement: add a day-of-week column to the schedule format.
-->
