# Text posts — cron jobs

Each row is one cron job: at `time`, run `skill` and post it to `set`'s accounts.
Add or remove rows freely, then re-run `sh automation/install.sh` to update the alarms.

| time  | set   | skill   |
|-------|-------|---------|
| 07:30 | set-1 | skill-2 |
| 10:00 | set-1 | skill-1 |
| 12:30 | set-1 | skill-4 |
| 16:00 | set-1 | skill-3 |
| 19:30 | set-1 | skill-2 |
