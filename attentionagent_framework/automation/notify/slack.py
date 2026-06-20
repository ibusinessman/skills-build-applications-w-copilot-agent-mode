#!/usr/bin/env python3
"""Post a notification to a Slack channel via incoming webhook.

Usage (called automatically by run.sh after a successful publish run):
  python3 automation/notify/slack.py --tag "organic-short-form/set-1/skill-1" --status ok
  python3 automation/notify/slack.py --tag "organic-short-form/set-1/skill-1" --status failed --detail "IG 400"

Env (.env): SLACK_WEBHOOK_URL
If SLACK_WEBHOOK_URL is not set, this script exits 0 silently — notifications are optional.
"""
import sys
import json
import os
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "post"))
import _lib as L


def main():
    L.load_env()
    webhook = os.environ.get("SLACK_WEBHOOK_URL", "")
    if not webhook:
        sys.exit(0)

    args = {"tag": None, "status": "ok", "detail": None}
    i = 0
    argv = sys.argv[1:]
    while i < len(argv):
        if argv[i].startswith("--") and i + 1 < len(argv):
            args[argv[i][2:]] = argv[i + 1]
            i += 2
        else:
            i += 1

    tag = args["tag"] or "unknown"
    status = args["status"] or "ok"
    detail = args["detail"] or ""

    if status == "ok":
        icon = ":white_check_mark:"
        text = "%s *%s* posted successfully." % (icon, tag)
    else:
        icon = ":x:"
        text = "%s *%s* FAILED. %s" % (icon, tag, detail)

    payload = json.dumps({"text": text}).encode()
    req = Request(webhook, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urlopen(req, timeout=10) as r:
            r.read()
    except URLError:
        pass
    sys.exit(0)


if __name__ == "__main__":
    main()
