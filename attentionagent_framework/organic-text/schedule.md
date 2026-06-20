# Text posts — cron jobs

Each row is one cron job: at `time`, run `skill` and post it to `set`'s accounts.
Add or remove rows freely, then re-run `sh automation/install.sh` to update the alarms.

| time  | set   | skill   |
|-------|-------|---------|
| 10:00 | set-1 | skill-1 |
| 16:00 | set-1 | skill-2 |
