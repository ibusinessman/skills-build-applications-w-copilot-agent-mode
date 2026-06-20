# Posting — one script per platform

Real code that actually posts. One file per platform, Python 3 **stdlib only** (no `pip`).
The loop calls the poster whose name matches the account file (an `instagram.md` account →
`instagram.py`).

```
python3 automation/post/<platform>.py --text "caption" [--media <file-or-URL>] [--dry-run]
```

- `--dry-run` posts nothing — it just reports which credentials are present. Use it to check setup.
- Each poster prints one line of JSON: `{"ok": true, "id": "..."}` or `{"ok": false, "error": "..."}`.
- Credentials live in the `.env` file at the repo root — fill in your keys there. Account
  `.md` files only need the handle.

## What each platform needs (and the gotchas)

| Platform | Media input | Key requirement / blocker |
|---|---|---|
| **x** | local video file | App must be **Read+Write**; regenerate the access token after enabling write. |
| **instagram** | **public https URL** | **Business** account + long-lived token; media must be hosted at a public URL. |
| **facebook** | public https URL | **Page** access token (not a user token). |
| **threads** | public https URL | `threads_content_publish` permission. |
| **linkedin** | local file | Needs the "Share on LinkedIn" / "Community Management" product + app verification. |
| **youtube** | local file | OAuth refresh token; **unverified apps force uploads to private** until audited. |
| **tiktok** | URL or local file | **Until your app passes audit, posts are private (SELF_ONLY)**; PULL_FROM_URL needs domain verification. |

## Honest status
The code implements each platform's official posting flow, but it **cannot be fully tested
without your real API keys**, and several platforms (Instagram, TikTok, YouTube) require a
business account and/or app review on the platform's side before they will accept public
posts. Those are platform requirements, not code bugs. Run `--dry-run` first, then test one
platform live with real keys before turning the loop on.

Image/video that must be a "public URL" (Instagram, Threads, Facebook) means you host the
file somewhere public first (S3/CDN/etc.) and pass that URL — these APIs fetch the media
server-side and don't accept a local file.
