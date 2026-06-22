#!/usr/bin/env python3
"""PostToolUse / Bash hook — appends structured JSON when a posting script runs."""
import json
import os
import re
import sys
from datetime import datetime, timezone

POSTER_RE = re.compile(r"automation/post/(\w+)\.py")

def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    command = (payload.get("tool_input") or {}).get("command", "")
    m = POSTER_RE.search(command)
    if not m:
        sys.exit(0)

    platform = m.group(1)
    output = (payload.get("tool_response") or {}).get("output", "")

    result = None
    for line in (output or "").splitlines():
        line = line.strip()
        if line.startswith("{"):
            try:
                result = json.loads(line)
                break
            except Exception:
                pass

    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    log_dir = os.path.join(repo_root, "automation", "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "posts.jsonl")

    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "platform": platform,
        "command": command,
        "result": result,
    }
    with open(log_file, "a") as f:
        f.write(json.dumps(entry) + "\n")

if __name__ == "__main__":
    main()
