#!/usr/bin/env python3
"""Post to a Facebook Page — text/link, or media via public https URL.

Usage:
  python3 automation/post/facebook.py --text "hello"
  python3 automation/post/facebook.py --text "watch" --media https://cdn.you/clip.mp4
  python3 automation/post/facebook.py --dry-run

Env (.env): FB_PAGE_ID  FB_PAGE_ACCESS_TOKEN   (+ optional GRAPH_VERSION, default v25.0)
Token must be a PAGE access token. Docs:
https://developers.facebook.com/docs/graph-api/reference/page/feed/
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

VER = os.environ.get("GRAPH_VERSION", "v25.0")
HOST = "https://graph.facebook.com"
CREDS = ["FB_PAGE_ID", "FB_PAGE_ACCESS_TOKEN"]


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="facebook", text=a["text"], media=a["media"], creds_present=L.present(CREDS))

    pid = L.env("FB_PAGE_ID")
    token = L.env("FB_PAGE_ACCESS_TOKEN")

    if a["media"]:
        if not L.is_url(a["media"]):
            L.fail("Facebook poster needs --media as a public https URL")
        is_video = a["media"].lower().split("?")[0].endswith((".mp4", ".mov"))
        if is_video:
            st, _, j = L.post_form("%s/%s/%s/videos" % (HOST, VER, pid),
                                   {"file_url": a["media"], "description": a["text"] or "", "access_token": token})
        else:
            st, _, j = L.post_form("%s/%s/%s/photos" % (HOST, VER, pid),
                                   {"url": a["media"], "caption": a["text"] or "", "access_token": token})
    else:
        if not a["text"]:
            L.fail("nothing to post")
        st, _, j = L.post_form("%s/%s/%s/feed" % (HOST, VER, pid),
                               {"message": a["text"], "access_token": token})

    if st >= 300:
        L.fail("Facebook post failed", status=st, response=j)
    L.ok(platform="facebook", id=j.get("id") or j.get("post_id"))


if __name__ == "__main__":
    main()
