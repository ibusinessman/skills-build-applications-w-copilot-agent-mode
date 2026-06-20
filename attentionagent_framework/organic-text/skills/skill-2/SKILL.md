# Skill: story-lesson (text post)

A short narrative post: a real situation → what happened → the lesson.
Personal or observed. Drives comments and follows because it's specific and human.

## Produces
One story-format text post per run with per-platform adaptations.

## Reads
- `company/brand.md` — voice (especially tone; stories can be more personal than usual)
- `company/product.md` — the world the story lives in
- `company/icp.md` — the protagonist should be recognisable to the ICP
- `company/memory/content-performance.md` — which story formats got comments before

## Format

```
<Scene — one sentence. Time, place, or situation. Specific details only.>

<What happened — 2–4 lines. Show, don't explain. Present tense preferred.>

<The turn — the thing that changed or the realisation.>

<The lesson — one line, stated plainly. Not a question.>

<Optional: connect to a bigger idea in 1 line>
```

## Per-platform adjustments
| Platform | Tone | Max length | Notes |
|---|---|---|---|
| X | punchy | 280 or thread | Cut to the turn faster |
| LinkedIn | reflective | 1 300 chars | Can keep more context |
| Threads | conversational | 500 chars | End with a question to drive comments |
| Facebook | warm | 400 chars | Plain, no hashtags |

## Steps
1. Read `company/README.md` then load the company files in order.
2. Scan `output/` for the last 7 days of story-lesson files. Note scenarios used —
   do NOT reuse the same situation or lesson angle within 7 days.
3. Choose a real or archetypal situation the ICP will recognise from their own work.
   It does NOT have to be about the product — it should be about their world.
4. Write the story following the format. Keep it specific; avoid generic lessons.
5. Save to `output/story-lesson-<YYYY-MM-DD>.md` with platform sections marked.
6. For each account file in `accounts/`, skip any with `disabled: true`. For the rest:
   `python3 automation/post/<platform>.py --text "<adapted text>"`
7. On success, append to `published.log`: `<ISO-datetime> <platform> <post-id>`

## Quality checks
- The scene has at least ONE concrete detail (name, number, tool, moment)
- The lesson is a statement, not a question or a "food for thought"
- Post does not mention the product unless it's genuinely part of the story
- Threads version ends with an engaging question
