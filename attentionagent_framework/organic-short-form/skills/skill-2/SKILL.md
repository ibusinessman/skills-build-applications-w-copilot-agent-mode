# Skill: trending-angle (short-form video)

Takes a trending topic or news item relevant to the ICP and connects it to the
company's product or domain. 15–45 seconds. Designed for discovery (new audiences),
not retention — prioritize reach signals (shares, saves) over comments.

## Produces
One short-form vertical video script built around a current trend or hook format
that's performing well right now. Plus a platform-adapted caption.

## Reads
- `company/brand.md` — voice, tone, off-brand list (trends must still sound like us)
- `company/product.md` — the connection point; don't force it
- `company/icp.md` — what the ICP already cares about; trends must intersect their world
- `company/memory/content-performance.md` — which trending formats worked for us before

## Format

### Script structure
```
[0–2 s]  TREND HOOK — name or visually show the trend/format immediately
[2–20 s] TWIST — our angle on it; the unexpected connection to our domain
[20–40 s] PAYOFF — one concrete takeaway the viewer can use today
[40–45 s] CTA — "Save this", "Share with <role>", or follow CTA
```

### Caption structure
```
<Trend keyword or phrase first line — helps discovery>
<Our angle in 1–2 lines>
<One-line CTA>
<5–7 hashtags — lean toward trending ones today>
```

## Steps
1. Identify one trending topic or viral format from the last 48 hours that the ICP
   would already be talking about. Ground this in the ICP's platforms from `company/icp.md`.
2. Find the genuine connection to the company's product or expertise. If the connection
   feels forced, choose a different trend.
3. Write the script (≤ 45 s at ~130 wpm).
4. Write the caption with trending hashtags.
5. Save to `output/trending-angle-<YYYY-MM-DD>.md`.
6. Post via `python3 automation/post/<platform>.py` for each account in the set.

## Quality checks
- The trend connection is authentic — not "X happened, anyway buy our product"
- No trend that could be seen as exploiting tragedy or controversy
- Hashtag count stays between 5 and 7 — more hurts reach on most platforms
- Caption first line stands alone if the video doesn't play
