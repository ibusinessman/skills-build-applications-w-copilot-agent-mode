# Skill: tutorial-quick

**Goal:** Teach ONE specific micro-skill in under 45 seconds. Optimised for saves.
People save tutorials to rewatch later — saves are the #1 signal for algorithmic reach on IG/TikTok.
Format: promise → steps (show-don't-tell) → result → save hook.

---

## Pre-run checks

1. Read `company/brand.md`, `company/product.md`, `company/icp.md`, `company/memory/content-performance.md`.
2. Scan `organic-short-form/sets/set-1/output/` for the last 7 days — do NOT repeat the same topic.
3. Pick ONE micro-skill your ICP does repeatedly and often gets wrong.

---

## Video structure (30–45 seconds)

| Segment | Timing | What to say/show |
|---|---|---|
| PROMISE | 0–2s | "How to [specific outcome] in [X] steps" — text on screen, spoken aloud |
| STEP 1 | 2–12s | Show the action, not just describe it. Screen recording / demo / POV. |
| STEP 2 | 12–22s | Second action. Show the exact click / move / decision. |
| STEP 3 | 22–35s | Third action (if needed) OR the moment it works. |
| RESULT | 35–40s | Show the before/after or final outcome clearly on screen. |
| SAVE HOOK | 40–45s | "Save this so you remember next time you [trigger situation]." |

---

## Script template

```
[0s] "Here's how to [outcome] — [number] steps."
[2s] "Step one: [action]. [Show it.]"
[12s] "Step two: [action]. Most people skip this — don't."
[22s] "Step three: [action]. This is what makes the difference."
[35s] "And here's the result: [show outcome]."
[40s] "Save this — you'll need it next time you [situation]."
```

---

## Production note

This skill produces a **script and shot list**. Write out:
1. The full spoken script (word for word).
2. A shot list: what's on screen for each segment.
3. Any on-screen text overlays (match what's spoken for accessibility).
4. Caption for the platform post (pull from the promise line + save hook).

Save the script to `organic-short-form/sets/set-1/output/skill-3-<YYYY-MM-DD>.md`.

---

## Posting steps

For each enabled account in `sets/set-1/accounts/` (skip any with `disabled: true`):
- **Instagram / Facebook / Threads**: media must be a public HTTPS URL.
  Upload the video to your CDN first (see `automation/post/SETUP.md` → CDN section),
  then pass the URL: `python3 automation/post/<platform>.py --text "<caption>" --media <url>`.
- **X / TikTok / YouTube / LinkedIn**: local file accepted.
  `python3 automation/post/<platform>.py --text "<caption>" --media <local_path>`.
- On success, append: `<ISO-8601-datetime> <platform> <post-id>` to `sets/set-1/published.log`.
- On failure, log to `automation/logs/skill-errors.log` and continue.
