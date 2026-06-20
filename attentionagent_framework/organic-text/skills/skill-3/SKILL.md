# Skill: social-proof

**Goal:** Turn a real customer outcome into a post that drives saves and DMs.
Saves = proof that your audience bookmarks it to share with someone.
Format: setup → transformation → the specific mechanism → invitation.

---

## Pre-run checks

1. Read `company/brand.md`, `company/product.md`, `company/icp.md`, `company/offers.md` in that order.
2. Read `company/memory/content-performance.md` — note what proof-style posts have performed best.
3. Scan `output/` for posts from the last 14 days — do NOT repeat the same story or outcome type.

---

## Content formula

```
[OUTCOME LINE]
"[Customer type] went from [before] to [after] in [timeframe]."
One sentence. Specific numbers beat vague adjectives.

[THE MECHANISM — 3-5 lines]
Here's exactly what changed:
→ [specific action 1]
→ [specific action 2]
→ [specific action 3]
(The mechanism is the real value — not just "they worked hard")

[RELATABILITY]
One sentence that connects the reader to the customer.
"Most people in [situation] never try this because [common belief]."

[INVITATION]
One question or CTA that generates DMs or comments.
"Is this the gap in your [thing]? Reply with [keyword] and I'll show you."
```

---

## Per-platform specs

| Platform | Max length | Format note |
|---|---|---|
| X / Twitter | 280 chars | Use a thread: outcome on tweet 1, mechanism in 2-3, invitation on last |
| LinkedIn | 1,300 chars | Full narrative; add 3-5 relevant hashtags at the end |
| Threads | 500 chars | Outcome + mechanism only; invite to DM |
| Facebook | 400 chars | Outcome line + 2 mechanism bullets + CTA |

---

## Steps

1. Draft the content in the formula above.
2. Adapt for each enabled account per the platform specs.
3. For each enabled account in `sets/set-1/accounts/` (skip any with `disabled: true`):
   a. Run `python3 automation/post/<platform>.py --text "<post_text>"`.
   b. Parse the JSON response; on success extract the post `id`.
   c. Append to `sets/set-1/published.log`: `<ISO-8601-datetime> <platform> <post-id>`.
4. On any failure, log the error to `automation/logs/skill-errors.log` and continue to next platform.
