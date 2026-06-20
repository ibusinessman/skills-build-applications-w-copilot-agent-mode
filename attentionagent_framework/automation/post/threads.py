#!/usr/bin/env python3
"""Post to Threads — text, or media via public https URL.

Usage:
  python3 automation/post/threads.py --text "hello"
  python3 automation/post/threads.py --text "watch" --media https://cdn.you/clip.mp4
  python3 automation/post/threads.py --dry-run

Env (.env): THREADS_USER_ID  THREADS_ACCESS_TOKEN
Docs: https://developers.facebook.com/docs/threads/reference/publishing/
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

HOST = "https://graph.threads.net/v1.0"
CREDS = ["THREADS_USER_ID", "THREADS_ACCESS_TOKEN"]


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="threads", text=a["text"], media=a["media"], creds_present=L.present(CREDS))

    uid = L.env("THREADS_USER_ID")
    token = L.env("THREADS_ACCESS_TOKEN")
    params = {"access_token": token}

    if a["media"]:
        if not L.is_url(a["media"]):
            L.fail("Threads requires --media as a public https URL")
        is_video = a["media"].lower().split("?")[0].endswith((".mp4", ".mov"))
        params["media_type"] = "VIDEO" if is_video else "IMAGE"
        params["video_url" if is_video else "image_url"] = a["media"]
        if a["text"]:
            params["text"] = a["text"]
    else:
        if not a["text"]:
            L.fail("nothing to post")
        params["media_type"] = "TEXT"
        params["text"] = a["text"]

    st, _, j = L.post_form("%s/%s/threads" % (HOST, uid), params)
    if st >= 300:
        L.fail("Threads create failed", status=st, response=j)
    cid = j.get("id")
    if not cid:
        L.fail("Threads returned no creation id", response=j)

    if a["media"]:
        # Poll until the container finishes processing (mirrors Instagram's approach).
        for _ in range(30):
            st, _, s = L.get("%s/%s" % (HOST, cid),
                             {"fields": "status", "access_token": token})
            code = s.get("status")
            if code == "FINISHED":
                break
            if code in ("ERROR", "EXPIRED"):
                L.fail("Threads media processing failed", response=s)
            time.sleep(5)

    st, _, j = L.post_form("%s/%s/threads_publish" % (HOST, uid),
                           {"creation_id": cid, "access_token": token})
    if st >= 300:
        L.fail("Threads publish failed", status=st, response=j)
    L.ok(platform="threads", id=j.get("id"))


if __name__ == "__main__":
    main()
