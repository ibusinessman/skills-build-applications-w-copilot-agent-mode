#!/usr/bin/env python3
"""Upload a local file to S3 and return a public HTTPS URL.

Instagram, Facebook, and Threads require a PUBLIC URL for media — they fetch it server-side.
This script handles that: upload locally, get a URL, then pass that URL to the platform poster.

Usage:
  python3 automation/post/cdn_upload.py --file ./clip.mp4
  # prints JSON: {"ok": true, "url": "https://..."}

  python3 automation/post/cdn_upload.py --dry-run
  # prints {"ok": true, "dry_run": true, "creds_present": {...}}

Env (.env):
  CDN_PROVIDER      = "s3" (only provider supported; default "s3")
  S3_BUCKET         = your-bucket-name
  S3_REGION         = us-east-1
  S3_ACCESS_KEY     = AKIA...
  S3_SECRET_KEY     = ...
  S3_PUBLIC_BASE_URL = https://your-bucket.s3.us-east-1.amazonaws.com
                      (or your CloudFront URL if you have one)

The uploaded file is given a random name to prevent collisions and placed under
a "media/" prefix: media/<uuid>.<ext>

Alternatives if you don't have S3:
  - Any public CDN that accepts PUT uploads works — adjust the upload logic below.
  - For quick testing, upload the file manually and hardcode the URL in the skill.
"""
import sys
import os
import json
import hmac
import hashlib
import datetime
import uuid
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError
from urllib.parse import quote

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _lib as L

CREDS = ["S3_BUCKET", "S3_REGION", "S3_ACCESS_KEY", "S3_SECRET_KEY", "S3_PUBLIC_BASE_URL"]


def _sign(key, msg):
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


def _aws_sig_headers(method, bucket, key, region, access_key, secret_key,
                     content_type, payload_hash):
    now = datetime.datetime.utcnow()
    datestamp = now.strftime("%Y%m%d")
    amzdate = now.strftime("%Y%m%dT%H%M%SZ")
    host = "%s.s3.%s.amazonaws.com" % (bucket, region)
    canonical_uri = "/" + quote(key, safe="/")
    canonical_headers = "content-type:%s\nhost:%s\nx-amz-content-sha256:%s\nx-amz-date:%s\n" % (
        content_type, host, payload_hash, amzdate)
    signed_headers = "content-type;host;x-amz-content-sha256;x-amz-date"
    canonical_request = "\n".join([method, canonical_uri, "", canonical_headers,
                                   signed_headers, payload_hash])
    credential_scope = "/".join([datestamp, region, "s3", "aws4_request"])
    string_to_sign = "\n".join(["AWS4-HMAC-SHA256", amzdate, credential_scope,
                                 hashlib.sha256(canonical_request.encode()).hexdigest()])
    k_date = _sign(("AWS4" + secret_key).encode(), datestamp)
    k_region = _sign(k_date, region)
    k_service = _sign(k_region, "s3")
    k_signing = _sign(k_service, "aws4_request")
    signature = hmac.new(k_signing, string_to_sign.encode(), hashlib.sha256).hexdigest()
    authorization = ("AWS4-HMAC-SHA256 Credential=%s/%s,SignedHeaders=%s,Signature=%s" %
                     (access_key, credential_scope, signed_headers, signature))
    return {
        "Authorization": authorization,
        "x-amz-date": amzdate,
        "x-amz-content-sha256": payload_hash,
        "Content-Type": content_type,
        "Host": host,
    }


def upload(file_path):
    bucket = L.env("S3_BUCKET")
    region = L.env("S3_REGION")
    access_key = L.env("S3_ACCESS_KEY")
    secret_key = L.env("S3_SECRET_KEY")
    base_url = L.env("S3_PUBLIC_BASE_URL").rstrip("/")

    data = Path(file_path).read_bytes()
    ext = Path(file_path).suffix.lower() or ".bin"
    remote_key = "media/%s%s" % (uuid.uuid4().hex, ext)

    mime_map = {".mp4": "video/mp4", ".mov": "video/quicktime",
                ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".png": "image/png", ".gif": "image/gif",
                ".webm": "video/webm"}
    content_type = mime_map.get(ext, "application/octet-stream")
    payload_hash = hashlib.sha256(data).hexdigest()

    hdrs = _aws_sig_headers("PUT", bucket, remote_key, region,
                             access_key, secret_key, content_type, payload_hash)
    url = "https://%s.s3.%s.amazonaws.com/%s" % (bucket, region, remote_key)
    req = Request(url, data=data, headers=hdrs, method="PUT")
    try:
        with urlopen(req, timeout=120) as r:
            r.read()
    except URLError as e:
        L.fail("S3 upload failed", error=str(e))

    public_url = "%s/%s" % (base_url, remote_key)
    return public_url


def main():
    L.load_env()
    args = {"file": None, "dry_run": False}
    i = 0
    argv = sys.argv[1:]
    while i < len(argv):
        if argv[i] == "--dry-run":
            args["dry_run"] = True
        elif argv[i] == "--file" and i + 1 < len(argv):
            args["file"] = argv[i + 1]
            i += 1
        i += 1

    if args["dry_run"]:
        L.ok(dry_run=True, creds_present=L.present(CREDS))

    if not args["file"]:
        L.fail("pass --file <path>")

    url = upload(args["file"])
    L.ok(url=url)


if __name__ == "__main__":
    main()
