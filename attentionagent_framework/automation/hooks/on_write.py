#!/usr/bin/env python3
"""PostToolUse / Write hook — fires Slack when a line is appended to published.log."""
import json
import os
import sys
import urllib.request

def main():
    try:
        payload = json.load(sys.stdin)
    except Exception:
        sys.exit(0)

    file_path = (payload.get("tool_input") or {}).get("file_path", "")
    if not file_path.endswith("published.log"):
        sys.exit(0)

    content = (payload.get("tool_input") or {}).get("content", "")
    last_line = content.strip().splitlines()[-1] if content.strip() else ""
    if not last_line:
        sys.exit(0)

    webhook = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not webhook:
        sys.exit(0)

    # Resolve the repo root from this script's location (automation/hooks/)
    repo_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    env_file = os.path.join(repo_root, ".env")
    if os.path.isfile(env_file):
        for raw in open(env_file).read().splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            k = k.strip(); v = v.strip().strip('"').strip("'")
            if k and v and k not in os.environ:
                os.environ[k] = v
        webhook = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not webhook:
        sys.exit(0)

    msg = {"text": ":rocket: *Published* `%s`" % last_line}
    data = json.dumps(msg).encode()
    req = urllib.request.Request(webhook, data=data,
                                  headers={"Content-Type": "application/json"})
    try:
        urllib.request.urlopen(req, timeout=10)
    except Exception:
        pass

if __name__ == "__main__":
    main()
