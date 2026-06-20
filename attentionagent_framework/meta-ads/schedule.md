# Meta Ads — schedule

OFF by default. Rows here are checked nightly after analytics runs.
Uncomment a row (remove the `<!-- -->`) to enable a check time.

| time  | action            |
|-------|-------------------|
| 00:15 | promote-winners   |

<!--
promote-winners: reads analytics/winners.md, checks meta-ads/rules.md,
and launches a campaign for each qualifying post that isn't already running.
-->
