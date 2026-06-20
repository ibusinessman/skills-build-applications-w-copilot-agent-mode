# Skill: poll-question

**Goal:** Drive comments and algorithmic reach by asking a question that forces a choice.
The algorithm on every platform amplifies posts that generate comment velocity in the first 30 minutes.
Format: controversial premise → forced choice → your position → invite disagreement.

---

## Pre-run checks

1. Read `company/brand.md`, `company/icp.md`, `company/memory/content-performance.md`.
2. Scan `output/` for the last 14 days — do NOT repeat a question you've asked before.
3. Pick ONE topic that your ICP has a strong opinion about — not general, not safe.

---

## Content formula

```
[PREMISE — 1 line, mildly polarising]
"Most [target audience] believe [common belief]. I think they're wrong."
OR
"Two types of [target audience]: [Type A] and [Type B]. One wins. One doesn't."

[THE FORCED CHOICE]
"If you had to pick ONE:
A) [option A]
B) [option B]
Which are you?"

[YOUR TAKE — 2-3 lines]
State which you'd pick and ONE reason why.
This is what triggers disagreement (= comments).

[CALL TO COMMENT]
"Drop A or B below. I read every reply."
```

---

## Per-platform specs

| Platform | Max length | Format note |
|---|---|---|
| X / Twitter | 280 chars | Premise + forced choice in one tweet; reply with your take |
| LinkedIn | 800 chars | Full formula; end with "Comment A or B — I'll reply to everyone today" |
| Threads | 500 chars | Premise + forced choice + one-line take |
| Facebook | 300 chars | Simple A/B question with your take |

Native poll UI (X polls, LinkedIn polls): if the platform supports it, use a native poll widget — higher engagement. The Python poster currently uses text only; use the native poll only if you extend the poster to support it.

---

## Steps

1. Draft the question and your take using the formula above.
2. Adapt text for each platform per the specs.
3. For each enabled account in `sets/set-1/accounts/` (skip any with `disabled: true`):
   a. Run `python3 automation/post/<platform>.py --text "<post_text>"`.
   b. Parse JSON; on success extract `id`.
   c. Append to `sets/set-1/published.log`: `<ISO-8601-datetime> <platform> <post-id>`.
4. Log failures to `automation/logs/skill-errors.log`; continue to next platform.
