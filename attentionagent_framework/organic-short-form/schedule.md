# Short-form video — cron jobs

Each row is one cron job: at `time`, run `skill` and post it to `set`'s accounts.
Add or remove rows freely, then re-run `sh automation/install.sh` to update the alarms.

| time  | set   | skill   |
|-------|-------|---------|
| 09:00 | set-1 | skill-1 |
| 13:00 | set-1 | skill-2 |
| 18:00 | set-1 | skill-1 |
