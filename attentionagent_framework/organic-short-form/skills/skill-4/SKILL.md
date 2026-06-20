# Skill: myth-bust

**Goal:** Debunk one widely-held belief in your niche. Optimised for reshares and new followers.
Reshares happen when people want to show the clip to someone who holds the wrong belief.
Format: state the myth → agitate (why it's wrong) → truth → paradigm shift.

---

## Pre-run checks

1. Read `company/brand.md`, `company/product.md`, `company/icp.md`, `company/memory/content-performance.md`.
2. Scan `organic-short-form/sets/set-1/output/` for the last 14 days — do NOT repeat a debunked myth.
3. Pick ONE belief that your ICP holds that actively holds them back. Must be specific, not obvious.

---

## Video structure (20–40 seconds)

| Segment | Timing | Purpose |
|---|---|---|
| MYTH STATEMENT | 0–3s | State the myth as fact — the way believers say it. Use their words, not yours. |
| PATTERN BREAK | 3–6s | "Actually, that's not how it works." Confident, not dismissive. |
| THE REAL MECHANIC | 6–25s | Show or explain why the myth exists AND why it fails. Use one concrete example. |
| THE TRUTH | 25–35s | State the correct belief in one sentence. Make it quotable. |
| RESHARE HOOK | 35–40s | "Send this to someone who still believes [myth]." |

---

## Script template

```
[0s] "Everyone says [myth]. They're wrong — here's why."
[3s] "The reason people believe this: [origin of the myth]. It made sense once."
[6s] "But here's what actually happens: [real mechanic with example]."
[25s] "The truth: [single quotable sentence]."
[35s] "Tag someone who needed to hear this."
OR
"Send this to the person who told you [myth]."
```

---

## Important constraints

- Do NOT debunk beliefs that require you to make medical, legal, or financial claims.
- Keep the tone curious and confident — not condescending. "Most people don't know this" not "most people are dumb".
- The myth must be something a real person would say, not a strawman.

---

## Production note

Write out:
1. Full spoken script (word for word).
2. Shot list: what's on screen each segment (text overlay, demo, talking head).
3. On-screen text: display the myth in quotes at 0s; display the truth statement at 25s.
4. Caption: state the myth as a question + hint at the answer. No spoilers in the caption.

Save script to `organic-short-form/sets/set-1/output/skill-4-<YYYY-MM-DD>.md`.

---

## Posting steps

For each enabled account in `sets/set-1/accounts/` (skip any with `disabled: true`):
- **Instagram / Facebook / Threads**: upload video to CDN first → pass public URL.
  `python3 automation/post/<platform>.py --text "<caption>" --media <url>`
- **X / TikTok / YouTube / LinkedIn**: local file.
  `python3 automation/post/<platform>.py --text "<caption>" --media <local_path>`
- On success, append to `sets/set-1/published.log`: `<ISO-8601-datetime> <platform> <post-id>`.
- On failure, log to `automation/logs/skill-errors.log` and continue.
