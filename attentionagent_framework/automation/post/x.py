#!/usr/bin/env python3
"""Post to X (Twitter) — text and/or video. OAuth 1.0a user context.

Usage:
  python3 automation/post/x.py --text "hello"
  python3 automation/post/x.py --text "watch" --media ./clip.mp4
  python3 automation/post/x.py --dry-run

Env (.env): X_API_KEY  X_API_SECRET  X_ACCESS_TOKEN  X_ACCESS_TOKEN_SECRET
App must have Read+Write; regenerate the access token AFTER enabling write.
Docs: https://docs.x.com/x-api/posts/create-post
"""
import os
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

TWEETS = "https://api.x.com/2/tweets"
UPLOAD = "https://api.x.com/2/media/upload"
CHUNK = 5 * 1024 * 1024  # 5 MB max per APPEND
CREDS = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"]


def _auth(method, url, sign_params):
    base = L.oauth1_base_params(L.env("X_API_KEY"), L.env("X_ACCESS_TOKEN"))
    return L.oauth1_header(method, url, base, sign_params,
                           L.env("X_API_SECRET"), L.env("X_ACCESS_TOKEN_SECRET"))


def upload_video(path):
    data = Path(path).read_bytes()
    total = len(data)
    init = {"command": "INIT", "total_bytes": str(total),
            "media_type": "video/mp4", "media_category": "tweet_video"}
    st, _, j = L.post_form(UPLOAD, init, {"Authorization": _auth("POST", UPLOAD, init)})
    if st >= 300:
        L.fail("X media INIT failed", status=st, response=j)
    mid = (j.get("data") or {}).get("id") or j.get("media_id_string")
    if not mid:
        L.fail("X media INIT returned no media id", response=j)

    seg = 0
    for off in range(0, total, CHUNK):
        ct, body = L.multipart_body(
            {"command": "APPEND", "media_id": str(mid), "segment_index": str(seg)},
            [("media", "blob", data[off:off + CHUNK])])
        st, _, _ = L.http("POST", UPLOAD,
                          {"Authorization": _auth("POST", UPLOAD, {}), "Content-Type": ct}, body)
        if st >= 300:
            L.fail("X media APPEND failed", segment=seg, status=st)
        seg += 1

    fin = {"command": "FINALIZE", "media_id": str(mid)}
    st, _, j = L.post_form(UPLOAD, fin, {"Authorization": _auth("POST", UPLOAD, fin)})
    if st >= 300:
        L.fail("X media FINALIZE failed", status=st, response=j)

    info = (j.get("data") or j).get("processing_info")
    while info and info.get("state") in ("pending", "in_progress"):
        time.sleep(int(info.get("check_after_secs", 5)))
        q = {"command": "STATUS", "media_id": str(mid)}
        st, _, j = L.http("GET", UPLOAD + "?" + L.urlencode(q),
                          {"Authorization": _auth("GET", UPLOAD, q)})
        info = (j.get("data") or j).get("processing_info")
        if info and info.get("state") == "failed":
            L.fail("X media processing failed", response=j)
    return str(mid)


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="x", text=a["text"], media=a["media"], creds_present=L.present(CREDS))
    if not a["text"] and not a["media"]:
        L.fail("nothing to post: pass --text and/or --media")

    body = {"text": a["text"] or ""}
    if a["media"]:
        if L.is_url(a["media"]):
            L.fail("X uploads a local video file — pass a path, not a URL")
        body["media"] = {"media_ids": [upload_video(a["media"])]}

    st, _, j = L.post_json(TWEETS, body, {"Authorization": _auth("POST", TWEETS, {})})
    if st >= 300:
        L.fail("X create post failed", status=st, response=j)
    tid = (j.get("data") or {}).get("id")
    L.ok(platform="x", id=tid, url=("https://x.com/i/web/status/%s" % tid) if tid else None)


if __name__ == "__main__":
    main()
