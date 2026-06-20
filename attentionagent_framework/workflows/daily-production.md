# Workflow: daily run

What the AI CMO runs each day for the one company, across all five sections.

```
read company/   (shared brain)

# 1. organic content
for each organic section in [organic-short-form, organic-text]:
  for each set in section/sets/ (skip _TEMPLATE):
    for each slot in schedule.md:
      produce a post once (company voice + set angle + skill format)
      adapt into every platform's output/ in the set
  → publish to every account → published/

# 2. analytics
pull metrics for every account in every section
update analytics/winners.md   (top short-form videos)
append lessons to company/memory/content-performance.md
write a report to analytics/reports/

# 3. meta-ads
for each winner in analytics/winners.md that passes meta-ads/rules.md:
  draft a campaign in meta-ads/campaigns/
  → campaign goes live
analytics then measures live campaigns too
```

Same company everywhere. Organic creates, analytics measures, meta-ads amplifies the winners.
