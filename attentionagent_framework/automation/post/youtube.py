#!/usr/bin/env python3
"""Upload a video to YouTube (Data API v3, resumable upload).

Usage:
  python3 automation/post/youtube.py --media ./clip.mp4 --title "Title" --description "..."
  python3 automation/post/youtube.py --dry-run

Env (.env): YOUTUBE_CLIENT_ID  YOUTUBE_CLIENT_SECRET  YOUTUBE_REFRESH_TOKEN
            (+ optional YOUTUBE_PRIVACY, default "private")
Docs: https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol
"""
import os
import sys
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

INIT = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
CREDS = ["YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN"]


def access_token():
    st, _, j = L.post_form("https://oauth2.googleapis.com/token", {
        "client_id": L.env("YOUTUBE_CLIENT_ID"),
        "client_secret": L.env("YOUTUBE_CLIENT_SECRET"),
        "refresh_token": L.env("YOUTUBE_REFRESH_TOKEN"),
        "grant_type": "refresh_token"})
    if st >= 300:
        L.fail("YouTube token refresh failed", status=st, response=j)
    return j["access_token"]


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="youtube", title=a["title"], media=a["media"], creds_present=L.present(CREDS))

    if not a["media"] or L.is_url(a["media"]):
        L.fail("YouTube uploads a local video file — pass a path via --media")

    tok = access_token()
    data = Path(a["media"]).read_bytes()
    meta = {"snippet": {"title": (a["title"] or a["text"] or "Untitled")[:100],
                        "description": a["description"] or a["text"] or "",
                        "categoryId": os.environ.get("YOUTUBE_CATEGORY_ID", "22")},
            "status": {"privacyStatus": os.environ.get("YOUTUBE_PRIVACY", "private"),
                       "selfDeclaredMadeForKids": False}}

    st, hdrs, j = L.http("POST", INIT,
                         {"Authorization": "Bearer %s" % tok,
                          "Content-Type": "application/json; charset=UTF-8",
                          "X-Upload-Content-Type": "video/*",
                          "X-Upload-Content-Length": str(len(data))},
                         json.dumps(meta).encode())
    if st >= 300:
        L.fail("YouTube init failed", status=st, response=j)
    loc = hdrs.get("Location")
    if not loc:
        L.fail("YouTube returned no resumable upload URL")

    st, _, j = L.put_bytes(loc, data,
                           {"Authorization": "Bearer %s" % tok,
                            "Content-Type": "video/*", "Content-Length": str(len(data))})
    if st >= 300:
        L.fail("YouTube upload failed", status=st, response=j)
    vid = j.get("id")
    L.ok(platform="youtube", id=vid, url=("https://youtu.be/%s" % vid) if vid else None)


if __name__ == "__main__":
    main()
