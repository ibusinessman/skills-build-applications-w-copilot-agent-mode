#!/usr/bin/env python3
"""Post to LinkedIn (Posts API) — text, image, or video (uploads local files).

Usage:
  python3 automation/post/linkedin.py --text "hello"
  python3 automation/post/linkedin.py --text "watch" --media ./clip.mp4 --title "My clip"
  python3 automation/post/linkedin.py --dry-run

Env (.env): LINKEDIN_ACCESS_TOKEN  LINKEDIN_AUTHOR_URN   (+ optional LINKEDIN_VERSION)
LINKEDIN_AUTHOR_URN = urn:li:person:XXXX  or  urn:li:organization:NNN
Docs: https://learn.microsoft.com/en-us/linkedin/marketing/community-management/shares/posts-api
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

REST = "https://api.linkedin.com/rest"
VERSION = os.environ.get("LINKEDIN_VERSION", "202606")
CREDS = ["LINKEDIN_ACCESS_TOKEN", "LINKEDIN_AUTHOR_URN"]


def _h(token, extra=None):
    h = {"Authorization": "Bearer %s" % token,
         "LinkedIn-Version": VERSION,
         "X-Restli-Protocol-Version": "2.0.0"}
    if extra:
        h.update(extra)
    return h


def _upload_image(token, owner, path):
    st, _, j = L.post_json(REST + "/images?action=initializeUpload",
                           {"initializeUploadRequest": {"owner": owner}}, _h(token))
    if st >= 300:
        L.fail("LinkedIn image init failed", status=st, response=j)
    v = j.get("value") or {}
    st, _, _ = L.put_bytes(v.get("uploadUrl"), Path(path).read_bytes(),
                           {"Authorization": "Bearer %s" % token, "Content-Type": "application/octet-stream"})
    if st >= 300:
        L.fail("LinkedIn image upload failed", status=st)
    return v.get("image")


def _upload_video(token, owner, path):
    data = Path(path).read_bytes()
    st, _, j = L.post_json(REST + "/videos?action=initializeUpload",
                           {"initializeUploadRequest": {"owner": owner, "fileSizeBytes": len(data),
                                                        "uploadCaptions": False, "uploadThumbnail": False}}, _h(token))
    if st >= 300:
        L.fail("LinkedIn video init failed", status=st, response=j)
    v = j.get("value") or {}
    etags = []
    for ins in (v.get("uploadInstructions") or []):
        chunk = data[int(ins["firstByte"]):int(ins["lastByte"]) + 1]
        st, hdrs, _ = L.put_bytes(ins["uploadUrl"], chunk,
                                  {"Authorization": "Bearer %s" % token, "Content-Type": "application/octet-stream"})
        if st >= 300:
            L.fail("LinkedIn video chunk upload failed", status=st)
        etag = hdrs.get("ETag") or hdrs.get("etag")
        if etag:
            etags.append(etag)
    st, _, j = L.post_json(REST + "/videos?action=finalizeUpload",
                           {"finalizeUploadRequest": {"video": v.get("video"),
                                                      "uploadToken": v.get("uploadToken", ""),
                                                      "uploadedPartIds": etags}}, _h(token))
    if st >= 300:
        L.fail("LinkedIn video finalize failed", status=st, response=j)
    return v.get("video")


def main():
    L.load_env()
    a = L.parse_args(sys.argv[1:])
    if a["dry_run"]:
        L.ok(dry_run=True, platform="linkedin", text=a["text"], media=a["media"], creds_present=L.present(CREDS))

    token = L.env("LINKEDIN_ACCESS_TOKEN")
    author = L.env("LINKEDIN_AUTHOR_URN")
    post = {"author": author, "commentary": a["text"] or "", "visibility": "PUBLIC",
            "distribution": {"feedDistribution": "MAIN_FEED", "targetEntities": [], "thirdPartyDistributionChannels": []},
            "lifecycleState": "PUBLISHED", "isReshareDisabledByAuthor": False}

    if a["media"]:
        if L.is_url(a["media"]):
            L.fail("LinkedIn poster uploads a local file — pass a path, not a URL")
        if a["media"].lower().endswith((".mp4", ".mov")):
            urn = _upload_video(token, author, a["media"])
            post["content"] = {"media": {"title": a.get("title") or "video", "id": urn}}
        else:
            urn = _upload_image(token, author, a["media"])
            post["content"] = {"media": {"altText": a.get("title") or "image", "id": urn}}

    st, hdrs, j = L.post_json(REST + "/posts", post, _h(token))
    if st >= 300:
        L.fail("LinkedIn post failed", status=st, response=j)
    L.ok(platform="linkedin", id=hdrs.get("x-restli-id"))


if __name__ == "__main__":
    main()
