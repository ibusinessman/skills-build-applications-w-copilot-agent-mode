# Skill: promote-winners (Meta Ads)

Runs nightly after analytics. Reads today's winners, checks them against the
promotion rules, and launches a Meta campaign for each qualifying post that
isn't already running an ad.

## Reads
- `analytics/winners.md` — today's top posts with metrics
- `meta-ads/rules.md` — eligibility thresholds and content rules
- `meta-ads/ad-account.md` — Ad Account ID, Pixel ID, audience strategy
- `company/icp.md` — audience targeting parameters
- `company/offers.md` — the landing page URL the ad drives to
- `meta-ads/campaigns/` — existing campaigns (to avoid duplicating)

## Steps

### 1. Find qualifying posts
Read `analytics/winners.md` and filter to posts that:
- Meet all thresholds in `meta-ads/rules.md` (reach, engagement rate, save rate, age)
- Pass all content rules (no superlatives, has a live CTA URL, voice check)
- Do NOT already have an entry in `meta-ads/campaigns/`

If no posts qualify, log "no winners to promote today" and exit cleanly.

### 2. For each qualifying post, call the Meta Ads API

Use `FB_PAGE_ACCESS_TOKEN` from `.env` and the Ad Account ID from `meta-ads/ad-account.md`.

**Create the campaign** (`POST /act_{AD_ACCOUNT_ID}/campaigns`):
```json
{
  "name": "CMO-auto-{post_id}-{YYYY-MM-DD}",
  "objective": "POST_ENGAGEMENT",
  "status": "ACTIVE",
  "special_ad_categories": []
}
```

**Create the ad set** (`POST /act_{AD_ACCOUNT_ID}/adsets`):
```json
{
  "name": "auto-{post_id}",
  "campaign_id": "{campaign_id}",
  "billing_event": "IMPRESSIONS",
  "optimization_goal": "POST_ENGAGEMENT",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
  "daily_budget": 2000,
  "targeting": {
    "geo_locations": {"countries": ["US"]},
    "age_min": 22,
    "age_max": 55
  },
  "status": "ACTIVE"
}
```
Adjust `geo_locations`, `age_min`, `age_max` using `company/icp.md`.
`daily_budget` is in cents ($20.00 = 2000).

**Create the ad creative** (`POST /act_{AD_ACCOUNT_ID}/adcreatives`):
```json
{
  "name": "auto-creative-{post_id}",
  "object_story_id": "{PAGE_ID}_{post_id}"
}
```
`object_story_id` promotes the existing organic post directly.

**Create the ad** (`POST /act_{AD_ACCOUNT_ID}/ads`):
```json
{
  "name": "auto-ad-{post_id}",
  "adset_id": "{adset_id}",
  "creative": {"creative_id": "{creative_id}"},
  "status": "ACTIVE"
}
```

### 3. Record the campaign

After a successful launch, write `meta-ads/campaigns/{post_id}.md`:
```markdown
# Campaign: {post_id}

- launched: {ISO-datetime}
- platform_post_id: {post_id}
- campaign_id: {campaign_id}
- adset_id: {adset_id}
- ad_id: {ad_id}
- daily_budget: $20
- status: ACTIVE
- organic_reach: {reach}
- organic_engagement_rate: {eng_rate}%
```

### 4. Pause underperforming campaigns

For each campaign file in `meta-ads/campaigns/` with `status: ACTIVE`:
- If it was launched > 48 hours ago, fetch its spend and CPC from the Insights API:
  `GET /act_{AD_ACCOUNT_ID}/insights?fields=spend,cpc&date_preset=last_3d&filtering=[{"field":"ad.id","operator":"IN","value":["{ad_id}"]}]`
- If CPC > $5 and spend > $20: pause the ad set and update the campaign file to `status: PAUSED — CPC too high`.

## Error handling
- If any API call returns a non-2xx status, log the full response to
  `automation/logs/meta-ads-{YYYY-MM-DD}.log` and continue to the next winner.
- Never abort the full run because one campaign fails.
