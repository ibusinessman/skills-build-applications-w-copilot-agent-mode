# Skill: insight-thread (text post)

A standalone text post that delivers one sharp insight or counterintuitive take.
Long enough to be worth reading; short enough to read in 30 seconds.
Optimised for saves and shares (durable signals), not likes.

## Produces
One text post per run, with per-platform length and formatting adjustments.

## Reads
- `company/brand.md` — voice, tone, what NOT to say
- `company/product.md` — the domain of expertise to draw from
- `company/icp.md` — who is reading; what they believe vs. what's actually true
- `company/memory/content-performance.md` — past insights that resonated (or didn't)

## Format

```
<Opening line — the insight or counterintuitive claim. No preamble.>

<2–4 lines expanding: why the conventional view is wrong, or why this insight matters>

<1–2 lines of concrete proof or example>

<Closing line — the "so what" or the reframe>

<Optional CTA — only if it flows naturally>
```

## Per-platform adjustments
| Platform | Max length | Formatting | Hashtags |
|---|---|---|---|
| X | 280 chars (or thread) | plain text | 1–2 max |
| LinkedIn | 1 300 chars | line breaks every 2–3 lines | 3–5 at the end |
| Threads | 500 chars | plain text | 0–3 |
| Facebook | 400 chars | plain text | 0 |

If the insight needs more than 280 chars for X, write it as a 2–3 tweet thread
(number them 1/ 2/ 3/).

## Steps
1. Read `company/README.md` then load the company files in order.
2. Scan `output/` for the last 7 days of insight-thread files. Note the topics — do NOT
   repeat the same insight or contrarian angle within 7 days.
3. Choose ONE insight that hasn't been covered recently.
4. Write the post following the format. Check per-platform limits.
5. Save to `output/insight-thread-<YYYY-MM-DD>.md` with platform sections clearly marked.
6. For each account file in `accounts/`, skip any with `disabled: true`. For the rest:
   `python3 automation/post/<platform>.py --text "<adapted text>"`
7. On success, append to `published.log`: `<ISO-datetime> <platform> <post-id>`

## Quality checks
- Opening line works as a standalone pull-quote
- No "I think", "In my opinion", "Just my thoughts" — state it as fact
- Every claim is accurate; no exaggeration
- CTA only appears if it's earned by the content
