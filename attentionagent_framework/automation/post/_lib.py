"""Shared helpers for the per-platform posters. Python 3 stdlib ONLY — no pip installs.

Each poster reads credentials from environment variables (loaded from a .env file at the
repo root if present), takes --text and/or --media, and prints a one-line JSON result:
  {"ok": true, ...}   on success
  {"ok": false, "error": "..."}   on failure (exit code 1)
"""
import sys
import os
import json
import time
import hmac
import hashlib
import base64
import secrets
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

urlencode = urllib.parse.urlencode


def repo_root():
    # automation/post/_lib.py -> parents[2] is the repo root
    return Path(__file__).resolve().parents[2]


def load_env():
    """Load KEY=VALUE lines from <repo_root>/.env into os.environ (does not override
    anything already set in the real environment)."""
    env_path = repo_root() / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def env(name, required=True, default=None):
    val = os.environ.get(name, default)
    if required and (val is None or val == ""):
        fail("missing required env var: %s (add it to .env — see automation/post/SETUP.md)" % name)
    return val


def present(names):
    """Map of which env vars are set — for --dry-run."""
    return {n: bool(os.environ.get(n)) for n in names}


def fail(msg, **extra):
    out = {"ok": False, "error": msg}
    out.update(extra)
    print(json.dumps(out))
    sys.exit(1)


def ok(**kw):
    out = {"ok": True}
    out.update(kw)
    print(json.dumps(out))
    sys.exit(0)


_TIMEOUT = 60  # seconds per request

def _do(req, _retries=3):
    """Send a request. Retries up to _retries times on 429 (respects Retry-After)."""
    for attempt in range(_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=_TIMEOUT) as r:
                return getattr(r, "status", r.getcode()), r.headers, r.read()
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < _retries:
                wait = int(e.headers.get("Retry-After", 60))
                time.sleep(min(wait, 300))  # cap at 5 min
                continue
            return e.code, e.headers, e.read()
        except urllib.error.URLError as e:
            if attempt < _retries:
                time.sleep(2 ** attempt)
                continue
            fail("network error: %s" % e)


def _parse(body):
    if not body:
        return {}
    try:
        return json.loads(body.decode("utf-8"))
    except Exception:
        return {"_raw": body.decode("utf-8", "replace")}


def http(method, url, headers=None, data=None):
    """Generic request. `data` is bytes or None. Returns (status, headers, parsed_json)."""
    req = urllib.request.Request(url, data=data, headers=headers or {}, method=method)
    status, hdrs, body = _do(req)
    return status, hdrs, _parse(body)


def post_json(url, obj, headers=None):
    h = {"Content-Type": "application/json"}
    if headers:
        h.update(headers)
    return http("POST", url, h, json.dumps(obj).encode("utf-8"))


def post_form(url, params, headers=None):
    h = {"Content-Type": "application/x-www-form-urlencoded"}
    if headers:
        h.update(headers)
    return http("POST", url, h, urlencode(params).encode("utf-8"))


def get(url, params=None, headers=None):
    if params:
        url = url + ("&" if "?" in url else "?") + urlencode(params)
    return http("GET", url, headers or {})


def put_bytes(url, data, headers=None):
    return http("PUT", url, headers or {}, data)


def parse_args(argv):
    """Tiny parser: --text / --media / --title / --description / --dry-run."""
    args = {"text": None, "media": None, "title": None, "description": None, "dry_run": False}
    i = 0
    while i < len(argv):
        a = argv[i]
        if a == "--dry-run":
            args["dry_run"] = True
        elif a.startswith("--") and i + 1 < len(argv):
            args[a[2:].replace("-", "_")] = argv[i + 1]
            i += 1
        i += 1
    return args


def is_url(s):
    return bool(s) and (s.startswith("http://") or s.startswith("https://"))


_VIDEO_EXTS = (".mp4", ".mov", ".webm", ".avi", ".mkv", ".m4v")

def is_video(path_or_url):
    """True if the path or URL looks like a video file by extension."""
    base = (path_or_url or "").lower().split("?")[0]
    return any(base.endswith(ext) for ext in _VIDEO_EXTS)


# ---------- OAuth 1.0a (used by X) ----------
def _q(s):
    return urllib.parse.quote(str(s), safe="~")


def oauth1_base_params(consumer_key, token):
    return {
        "oauth_consumer_key": consumer_key,
        "oauth_nonce": secrets.token_hex(16),
        "oauth_signature_method": "HMAC-SHA1",
        "oauth_timestamp": str(int(time.time())),
        "oauth_token": token,
        "oauth_version": "1.0",
    }


def oauth1_header(method, url, oauth_params, sign_params, consumer_secret, token_secret):
    """Build an `Authorization: OAuth ...` header.
    `sign_params` are extra query/form params to fold into the signature base string;
    pass {} for multipart/binary bodies (their body is NOT signed)."""
    allp = {}
    allp.update(oauth_params)
    allp.update(sign_params or {})
    base_pairs = "&".join("%s=%s" % (_q(k), _q(allp[k])) for k in sorted(allp))
    base = "&".join([method.upper(), _q(url), _q(base_pairs)])
    key = "%s&%s" % (_q(consumer_secret), _q(token_secret))
    sig = base64.b64encode(hmac.new(key.encode(), base.encode(), hashlib.sha1).digest()).decode()
    hp = dict(oauth_params)
    hp["oauth_signature"] = sig
    return "OAuth " + ", ".join('%s="%s"' % (_q(k), _q(hp[k])) for k in sorted(hp))


def multipart_body(fields, files):
    """Build a multipart/form-data body.
    fields: {name: value}.  files: [(name, filename, bytes)].
    Returns (content_type, body_bytes)."""
    boundary = "----cmo" + secrets.token_hex(16)
    crlf = b"\r\n"
    buf = bytearray()
    b = boundary.encode()
    for k, v in fields.items():
        buf += b"--" + b + crlf
        buf += ('Content-Disposition: form-data; name="%s"' % k).encode() + crlf + crlf
        buf += str(v).encode() + crlf
    for name, filename, content in files:
        buf += b"--" + b + crlf
        buf += ('Content-Disposition: form-data; name="%s"; filename="%s"' % (name, filename)).encode() + crlf
        buf += b"Content-Type: application/octet-stream" + crlf + crlf
        buf += content + crlf
    buf += b"--" + b + b"--" + crlf
    return "multipart/form-data; boundary=" + boundary, bytes(buf)
