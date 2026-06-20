# Short-form video — cron jobs

Each row is one cron job: at `time`, run `skill` and post it to `set`'s accounts.
Add or remove rows freely, then re-run `sh automation/install.sh` to update the alarms.

| time  | set   | skill   | days |
|-------|-------|---------|------|
| 08:00 | set-1 | skill-1 | *    |
| 11:00 | set-1 | skill-3 | *    |
| 14:00 | set-1 | skill-2 | *    |
| 17:00 | set-1 | skill-4 | *    |
| 20:00 | set-1 | skill-1 | *    |
