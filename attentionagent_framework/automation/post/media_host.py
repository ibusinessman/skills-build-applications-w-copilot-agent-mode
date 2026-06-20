#!/usr/bin/env python3
"""Return a public HTTPS URL for a media file, uploading to CDN if needed.

Instagram, Facebook, and Threads require a PUBLIC URL for media.
This script bridges the gap: if you give it a local path, it uploads to S3
and returns the public URL. If you give it a URL already, it passes it through.

Usage:
  # get a public URL (uploads if local file, passthrough if already a URL)
  python3 automation/post/media_host.py --file ./clip.mp4
  python3 automation/post/media_host.py --file https://already-public.com/clip.mp4

  # then pipe the URL into the platform poster:
  URL=$(python3 automation/post/media_host.py --file ./clip.mp4 | python3 -c "import sys,json; print(json.load(sys.stdin)['url'])")
  python3 automation/post/instagram.py --text "caption" --media "$URL"

  # or use --platform to apply only when the platform actually needs a URL:
  python3 automation/post/media_host.py --file ./clip.mp4 --platform instagram
  # prints {"ok": true, "url": "https://...", "uploaded": true}

  python3 automation/post/media_host.py --file ./clip.mp4 --platform x
  # prints {"ok": true, "url": "./clip.mp4", "uploaded": false}
  # (X accepts local files, so no CDN upload needed)

Env (.env): S3_BUCKET S3_REGION S3_ACCESS_KEY S3_SECRET_KEY S3_PUBLIC_BASE_URL
"""
import sys
import os
import json
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L
import cdn_upload

# Platforms that REQUIRE a public URL (cannot accept local file paths)
URL_ONLY_PLATFORMS = {"instagram", "facebook", "threads"}


def main():
    L.load_env()
    args = {"file": None, "platform": None, "dry_run": False}
    i = 0
    argv = sys.argv[1:]
    while i < len(argv):
        if argv[i] == "--dry-run":
            args["dry_run"] = True
        elif argv[i].startswith("--") and i + 1 < len(argv):
            args[argv[i][2:]] = argv[i + 1]
            i += 1
        i += 1

    if args["dry_run"]:
        L.ok(dry_run=True, url_only_platforms=list(URL_ONLY_PLATFORMS))

    media = args["file"]
    if not media:
        L.fail("pass --file <path-or-url>")

    platform = (args["platform"] or "").lower().strip()
    needs_url = (not platform) or (platform in URL_ONLY_PLATFORMS)

    if L.is_url(media):
        L.ok(url=media, uploaded=False)

    if not needs_url:
        # Platform accepts local files — return path unchanged
        L.ok(url=media, uploaded=False)

    # Local file + URL-only platform (or no platform specified) → upload
    url = cdn_upload.upload(media)
    L.ok(url=url, uploaded=True)


if __name__ == "__main__":
    main()
