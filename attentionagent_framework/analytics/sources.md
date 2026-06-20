# Analytics sources

Where to pull metrics for each platform. The self-study job reads this.

## Endpoints and fields

### Instagram
- **Endpoint**: `GET https://graph.instagram.com/v25.0/{media_id}/insights`
- **Params**: `metric=impressions,reach,saved,comments,likes,shares&access_token={IG_ACCESS_TOKEN}`
- **Auth env var**: `IG_ACCESS_TOKEN`
- **Notes**: Requires `instagram_manage_insights` permission on a Business/Creator account.
  `reach` and `saved` are only available via the Insights endpoint, not the basic `/media` fields.
  Field name for saves is `saved` (not `saved_count`) on the Insights endpoint.
  List your media IDs first: `GET /me/media?fields=id,timestamp&access_token=...`

### X (Twitter)
- **Endpoint**: `GET https://api.x.com/2/tweets/{id}?tweet.fields=public_metrics,organic_metrics`
- **Auth env var**: `X_ACCESS_TOKEN` + OAuth 1.0a (same as posting)
- **Fields**: `public_metrics` → impression_count, like_count, retweet_count, reply_count, bookmark_count
- **Notes**: `organic_metrics` requires OAuth 1.0a user context (not app-only Bearer token).

### Facebook
- **Endpoint**: `GET https://graph.facebook.com/v25.0/{post_id}/insights`
- **Params**: `metric=post_impressions_unique,post_reactions_by_type_total,post_clicks,post_shares&access_token={FB_PAGE_ACCESS_TOKEN}`
- **Auth env var**: `FB_PAGE_ACCESS_TOKEN`
- **Notes**: Use `post_impressions_unique` for reach. Post ID format: `{PAGE_ID}_{POST_ID}`.

### Threads
- **Endpoint**: `GET https://graph.threads.net/v1.0/{media_id}/insights`
- **Params**: `metric=views,likes,replies,reposts,quotes&access_token={THREADS_ACCESS_TOKEN}`
- **Auth env var**: `THREADS_ACCESS_TOKEN`
- **Notes**: Requires `threads_read_replies` and `threads_manage_insights` permissions.

### LinkedIn
- **Endpoint**: `GET https://api.linkedin.com/rest/socialMetadata/{encoded_urn}`
- **Headers**: `Authorization: Bearer {LINKEDIN_ACCESS_TOKEN}`, `LinkedIn-Version: 202606`
- **Auth env var**: `LINKEDIN_ACCESS_TOKEN`
- **Notes**: URN must be URL-encoded. Also use `/rest/posts/{id}?fields=totalShareStatistics`
  for impressions + clicks + likes + comments + shares.

### YouTube
- **Endpoint**: `GET https://www.googleapis.com/youtube/v3/videos?part=statistics&id={video_id}`
- **Auth**: Bearer token from refreshing `YOUTUBE_REFRESH_TOKEN`
- **Fields**: `statistics` → viewCount, likeCount, commentCount, favoriteCount
- **Notes**: `dislikeCount` is no longer public. Subscriber gain requires the Analytics API
  (`youtubeAnalytics.googleapis.com/v2/reports`), which needs separate scope.

### TikTok
- **Endpoint**: `POST https://open.tiktokapis.com/v2/video/query/`
- **Body**: `{"filters": {"video_ids": ["..."]}, "fields": ["id","view_count","like_count","comment_count","share_count","play_url"]}`
- **Headers**: `Authorization: Bearer {TIKTOK_ACCESS_TOKEN}`
- **Auth env var**: `TIKTOK_ACCESS_TOKEN`
- **Notes**: Requires `video.list` scope. The older Display API `/video/list/` is deprecated;
  use the Research API or Content Posting API video query endpoint above.

## Metric definitions used in winners.md
- **reach**: unique accounts that saw the post (use platform-specific "reach" or "impressions_unique")
- **engagement rate**: (likes + comments + shares + saves) / reach × 100
- **save rate**: saves / reach × 100  ← strongest signal of durable value
- **share rate**: shares / reach × 100 ← strongest signal of virality

## Pull order for the self-study job
1. Read `published.log` in every set to get post IDs posted in the last 48 hours.
2. For each post ID, call the platform-specific endpoint above.
3. Store raw metrics in memory; score and rank per `analytics/winners.md` thresholds.
