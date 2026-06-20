# Meta Ads — schedule

OFF by default. Enable by setting `loop: on` in `automation/config.md` AND ensuring
`analytics/winners.md` is being populated by the nightly self-study.

The `set` column is `-` (not applicable — promote-winners operates on all winners globally).
`run.sh` detects `area=meta-ads` and uses a different prompt with no set/accounts.

| time  | set | skill            |
|-------|-----|------------------|
| 00:15 | -   | promote-winners  |

<!--
promote-winners: reads analytics/winners.md, checks meta-ads/rules.md,
and launches a Meta campaign for each qualifying post not already running.
See meta-ads/skills/promote-winners/SKILL.md for the full step-by-step.
-->
