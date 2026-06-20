#!/usr/bin/env python3
"""Post to X (Twitter) — text and/or video. OAuth 1.0a user context.

Usage:
  python3 automation/post/x.py --text "hello"
  python3 automation/post/x.py --text "watch" --media ./clip.mp4
  python3 automation/post/x.py --dry-run

Env (.env): X_API_KEY  X_API_SECRET  X_ACCESS_TOKEN  X_ACCESS_TOKEN_SECRET
App must have Read+Write; regenerate the access token AFTER enabling write.
Docs: https://docs.x.com/x-api/posts/create-post
      https://developer.x.com/en/docs/twitter-api/v1/media/upload-media/api-reference/post-media-upload
"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

TWEETS = "https://api.x.com/2/tweets"
# Media upload still uses the v1.1 endpoint — the v1.1 protocol (INIT/APPEND/FINALIZE
# via form-encoded params + OAuth 1.0a) is stable and widely supported.
# The v2 /media/upload endpoint uses JSON and a different auth model; v1.1 is safer here.
UPLOAD = "https://upload.twitter.com/1.1/media/upload.json"
CHUNK = 5 * 1024 * 1024  # 5 MB per APPEND segment
CREDS = ["X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"]


def _auth(method, url, sign_params):
    base = L.oauth1_base_params(L.env("X_API_KEY"), L.env("X_ACCESS_TOKEN"))
    return L.oauth1_header(method, url, base, sign_params,
                           L.env("X_API_SECRET"), L.env("X_ACCESS_TOKEN_SECRET"))


def upload_video(path):
    data = Path(path).read_bytes()
    total = len(data)

    # INIT
    init = {"command": "INIT", "total_bytes": str(total),
            "media_type": "video/mp4", "media_category": "tweet_video"}
    st, _, j = L.post_form(UPLOAD, init, {"Authorization": _auth("POST", UPLOAD, init)})
    if st >= 300:
        L.fail("X media INIT failed", status=st, response=j)
    mid = j.get("media_id_string") or str(j.get("media_id", ""))
    if not mid:
        L.fail("X media INIT returned no media_id", response=j)

    # APPEND (chunked)
    seg = 0
    for off in range(0, total, CHUNK):
        ct, body = L.multipart_body(
            {"command": "APPEND", "media_id": mid, "segment_index": str(seg)},
            [("media", "blob", data[off:off + CHUNK])])
        st, _, _ = L.http("POST", UPLOAD,
                          {"Authorization": _auth("POST", UPLOAD, {}), "Content-Type": ct}, body)
        if st not in (200, 204):
            L.fail("X media APPEND failed", segment=seg, status=st)
        seg += 1

    # FINALIZE
    fin = {"command": "FINALIZE", "media_id": mid}
    st, _, j = L.post_form(UPLOAD, fin, {"Authorization": _auth("POST", UPLOAD, fin)})
    if st >= 300:
        L.fail("X media FINALIZE failed", status=st, response=j)

    # Poll until processing is complete
    info = j.get("processing_info")
    while info and info.get("state") in ("pending", "in_progress"):
        time.sleep(int(info.get("check_after_secs", 5)))
        q = {"command": "STATUS", "media_id": mid}
        st, _, j = L.http("GET", UPLOAD + "?" + L.urlencode(q),
                          {"Authorization": _auth("GET", UPLOAD, q)})
        info = j.get("processing_info")
        if info and info.get("state") == "failed":
            L.fail("X media processing failed", response=j)
    return mid


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="x", text=a["text"], media=a["media"],
             creds_present=L.present(CREDS))
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
