# Skill: hook-value-cta (short-form video)

A 30–60 second vertical video. Hook in the first 2 seconds, one clear value point,
one CTA at the end. Works across Reels, TikTok, YouTube Shorts, and LinkedIn video.

## Produces
One short-form vertical video script + caption per run. The script drives the video;
the caption is adapted per platform (length, hashtags, link placement).

## Reads
- `company/brand.md` — voice, tone, what NOT to say
- `company/product.md` — product facts to draw from
- `company/icp.md` — who is watching; write to them
- `company/memory/content-performance.md` — lessons from past posts (what hooked, what flopped)

## Format

### Script structure
```
[0–2 s]  HOOK — a pattern interrupt or contrarian claim. One sentence. No logo.
[2–25 s] VALUE — one specific, useful idea. Show > tell. No more than three points.
[25–55 s] PAYOFF — the "so what". Tie back to the hook.
[55–60 s] CTA — one action. ("Follow for more", "Link in bio", "Comment X if you want Y")
```

### Caption structure
```
<Restate the hook as the first line — viewers read this before tapping>
<2–4 lines expanding on the value>
<CTA from company/offers.md>
<3–5 hashtags — mix niche + broad>
```

## Steps
1. Read the company files listed above (see `company/README.md` for order).
2. Scan `output/` for the last 7 days of hook-value-cta files. Note the topics and
   hooks used — do NOT repeat the same hook angle or topic within 7 days.
3. Pick ONE specific idea from `company/product.md` or `company/icp.md` pain points
   that hasn't been covered recently.
4. Write the script following the structure above (≤ 60 s at ~130 wpm spoken).
5. Write the caption (platform-agnostic first, then note any per-platform adjustments).
6. Save both to `output/hook-value-cta-<YYYY-MM-DD>.md`.
7. For each account file in the set's `accounts/`, skip any file containing `disabled: true`.
   For enabled accounts call:
   `python3 automation/post/<platform>.py --text "<caption>" --media <media_url_or_path>`
   using the credentials in `.env`.
8. On success, append to the set's `published.log`:
   `<ISO-datetime> <platform> <post-id>`

## Quality checks before posting
- Hook does NOT start with "I" or the company name
- No more than one emoji per caption
- CTA matches current primary offer in `company/offers.md`
- Script is ≤ 60 seconds when read aloud at a natural pace
