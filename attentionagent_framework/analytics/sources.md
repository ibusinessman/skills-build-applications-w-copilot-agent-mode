# Analytics sources

Where to pull metrics for each platform. The self-study job reads this.

| Platform | Metric API | Auth env var | What to pull |
|---|---|---|---|
| instagram | Graph API `/me/media?fields=id,timestamp,like_count,comments_count,reach,saved` | `IG_ACCESS_TOKEN` | Per-post reach, saves, comments |
| x | X API v2 `/2/tweets/:id` with `public_metrics` | `X_ACCESS_TOKEN` | Impressions, likes, retweets, replies |
| facebook | Graph API `/<PAGE_ID>/posts?fields=message,created_time,likes.summary(true),shares` | `FB_PAGE_ACCESS_TOKEN` | Likes, shares, reach |
| threads | Threads API `/me/threads?fields=id,timestamp,like_count,replies_count` | `THREADS_ACCESS_TOKEN` | Likes, replies |
| linkedin | LinkedIn API `/ugcPosts/<id>/socialMetadata` | `LINKEDIN_ACCESS_TOKEN` | Reactions, comments, shares |
| youtube | YouTube Data API `/videos?part=statistics` | `YOUTUBE_REFRESH_TOKEN` | Views, likes, comments, subscribers gained |
| tiktok | TikTok Display API `/video/list/` | `TIKTOK_ACCESS_TOKEN` | Views, likes, comments, shares |

## Metric definitions used in winners.md
- **reach**: unique accounts that saw the post
- **engagement rate**: (likes + comments + shares + saves) / reach × 100
- **save rate**: saves / reach × 100  ← strongest signal of value
- **share rate**: shares / reach × 100 ← strongest signal of virality
