#!/usr/bin/env python3
"""Stop hook — writes a [DONE] timestamp to the daily run log."""
import os
import sys
from datetime import datetime, timezone

def main():
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    log_dir = os.path.join(repo_root, "automation", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "run-%s.log" % datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    with open(log_file, "a") as f:
        f.write("%s [DONE] Claude session ended\n" % ts)

if __name__ == "__main__":
    main()
