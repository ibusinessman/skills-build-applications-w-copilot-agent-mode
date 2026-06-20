#!/usr/bin/env python3
"""Post a video to TikTok (Content Posting API, direct post).

Usage:
  python3 automation/post/tiktok.py --text "caption" --media https://cdn.you/clip.mp4
  python3 automation/post/tiktok.py --text "caption" --media ./clip.mp4
  python3 automation/post/tiktok.py --dry-run

Env (.env): TIKTOK_ACCESS_TOKEN   (+ optional TIKTOK_PRIVACY_LEVEL, default SELF_ONLY)
NOTE: until your TikTok app passes audit, posts are forced to SELF_ONLY (private).
PULL_FROM_URL needs the host domain verified in your TikTok app. Docs:
https://developers.tiktok.com/doc/content-posting-api-reference-direct-post
"""
import os
import sys
import json
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

HOST = "https://open.tiktokapis.com"
CREDS = ["TIKTOK_ACCESS_TOKEN"]


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="tiktok", text=a["text"], media=a["media"], creds_present=L.present(CREDS))

    if not a["media"]:
        L.fail("TikTok needs --media (a public video URL or a local file)")
    token = L.env("TIKTOK_ACCESS_TOKEN")
    H = {"Authorization": "Bearer %s" % token, "Content-Type": "application/json; charset=UTF-8"}
    post_info = {"title": a["text"] or "",
                 "privacy_level": os.environ.get("TIKTOK_PRIVACY_LEVEL", "SELF_ONLY"),
                 "disable_duet": False, "disable_comment": False, "disable_stitch": False}

    init_url = HOST + "/v2/post/publish/video/init/"
    if L.is_url(a["media"]):
        body = {"post_info": post_info, "source_info": {"source": "PULL_FROM_URL", "video_url": a["media"]}}
        st, _, j = L.http("POST", init_url, H, json.dumps(body).encode())
        if st >= 300:
            L.fail("TikTok init (pull) failed", status=st, response=j)
    else:
        data = Path(a["media"]).read_bytes()
        size = len(data)
        body = {"post_info": post_info,
                "source_info": {"source": "FILE_UPLOAD", "video_size": size,
                                "chunk_size": size, "total_chunk_count": 1}}
        st, _, j = L.http("POST", init_url, H, json.dumps(body).encode())
        if st >= 300:
            L.fail("TikTok init (upload) failed", status=st, response=j)
        up = (j.get("data") or {}).get("upload_url")
        if not up:
            L.fail("TikTok returned no upload_url", response=j)
        st, _, _ = L.put_bytes(up, data,
                               {"Content-Type": "video/mp4", "Content-Length": str(size),
                                "Content-Range": "bytes 0-%d/%d" % (size - 1, size)})
        if st >= 300:
            L.fail("TikTok chunk upload failed", status=st)

    pub = (j.get("data") or {}).get("publish_id")
    if not pub:
        L.fail("TikTok returned no publish_id", response=j)

    for _ in range(20):
        st, _, s = L.http("POST", HOST + "/v2/post/publish/status/fetch/", H,
                          json.dumps({"publish_id": pub}).encode())
        status = (s.get("data") or {}).get("status")
        if status == "PUBLISH_COMPLETE":
            L.ok(platform="tiktok", publish_id=pub, status=status)
        if status == "FAILED":
            L.fail("TikTok publish failed", response=s)
        time.sleep(5)
    L.ok(platform="tiktok", publish_id=pub, status="PENDING")


if __name__ == "__main__":
    main()
