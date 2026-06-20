# Meta Ad Account

- Ad Account ID: <act_XXXXXXXXXX>
- Business Manager ID: <XXXXXXXXXX>
- Pixel ID: <XXXXXXXXXX>
- Default currency: USD
- Default timezone: <e.g. America/New_York>

## Auth
Credentials live in `.env`:
- `FB_PAGE_ACCESS_TOKEN` — must have `ads_management` + `ads_read` permissions
- `FB_PAGE_ID` — the Page being promoted

## Audiences
- Lookalike source: website visitors (Pixel) — build a 1% lookalike on the target country
- Retargeting: Pixel events — PageView last 30 days
- Interest targeting fallback: use ICP job titles + interests from `company/icp.md`
