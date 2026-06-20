#!/usr/bin/env python3
"""Post to Instagram (Graph API content publishing). Media MUST be a public https URL.

Usage:
  python3 automation/post/instagram.py --text "caption" --media https://cdn.you/reel.mp4
  python3 automation/post/instagram.py --dry-run

Env (.env): IG_USER_ID  IG_ACCESS_TOKEN   (+ optional GRAPH_VERSION, default v25.0)
Requires an Instagram BUSINESS account + long-lived token. Image/Reel must be hosted
at a public URL (Meta fetches it server-side). Docs:
https://developers.facebook.com/docs/instagram-platform/content-publishing/
"""
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

VER = os.environ.get("GRAPH_VERSION", "v25.0")
HOST = "https://graph.instagram.com"
CREDS = ["IG_USER_ID", "IG_ACCESS_TOKEN"]


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="instagram", text=a["text"], media=a["media"], creds_present=L.present(CREDS))

    uid = L.env("IG_USER_ID")
    token = L.env("IG_ACCESS_TOKEN")
    if not a["media"] or not L.is_url(a["media"]):
        L.fail("Instagram requires --media as a PUBLIC https URL (image or video)")

    is_video = a["media"].lower().split("?")[0].endswith((".mp4", ".mov"))
    params = {"access_token": token, "caption": a["text"] or ""}
    if is_video:
        params["media_type"] = "REELS"
        params["video_url"] = a["media"]
    else:
        params["image_url"] = a["media"]

    st, _, j = L.post_form("%s/%s/%s/media" % (HOST, VER, uid), params)
    if st >= 300:
        L.fail("IG create container failed", status=st, response=j)
    cid = j.get("id")
    if not cid:
        L.fail("IG returned no creation id", response=j)

    # Poll until the container finishes processing (videos need transcoding time).
    for _ in range(30):
        st, _, s = L.get("%s/%s/%s" % (HOST, VER, cid), {"fields": "status_code", "access_token": token})
        code = s.get("status_code")
        if code == "FINISHED":
            break
        if code in ("ERROR", "EXPIRED"):
            L.fail("IG media processing failed", response=s)
        time.sleep(5)

    st, _, j = L.post_form("%s/%s/%s/media_publish" % (HOST, VER, uid),
                           {"creation_id": cid, "access_token": token})
    if st >= 300:
        L.fail("IG publish failed", status=st, response=j)
    L.ok(platform="instagram", id=j.get("id"))


if __name__ == "__main__":
    main()
