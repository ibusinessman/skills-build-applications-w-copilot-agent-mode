# Section D: KoneksAI Automation Architecture
## WhatsApp Business Automation Agency — Port-au-Prince, Haiti
### Stack: Claude + n8n + Google Apps Script + Google Sheets + WhatsApp Business API + MonCash + Meta Ads

---

## D.1 Connector Map

Each automation category is defined with Trigger → Action → Output, the specific connector used, and a fallback strategy when that connector fails.

---

### 1. lead_capture

**Purpose:** Capture leads from web forms, Instagram/Facebook DMs, and WhatsApp direct messages, normalize the data, route by language, and store to Sheets.

| Step | Trigger | Action | Output | Connector |
|------|---------|--------|--------|-----------|
| 1 | Form submit / DM webhook / WhatsApp message | Receive raw payload | Normalized JSON | n8n Webhook node (POST /haiti-lead-capture) |
| 2 | Normalized JSON | Extract name, phone, lang, source, timestamp | Clean lead object | n8n Code node (JavaScript) |
| 3 | Clean lead object | Append row to Leads tab | Row ID + timestamp | n8n Google Sheets node (Append Row) |
| 4 | Row written | Branch on `lang` field | FR branch / HT branch / EN branch | n8n Switch node |
| 5a | FR branch | Send WhatsApp reply in French | Delivery receipt | n8n HTTP Request → WhatsApp Cloud API |
| 5b | HT branch | Send WhatsApp reply in Haitian Creole | Delivery receipt | n8n HTTP Request → WhatsApp Cloud API |
| 5c | EN branch | Send WhatsApp reply in English | Delivery receipt | n8n HTTP Request → WhatsApp Cloud API |

**Fallback Strategy:**
- If WhatsApp API call fails (4xx/5xx): n8n Error Trigger → log to ErrorLog sheet via Google Apps Script → retry once after 5 minutes via n8n Wait node → if second attempt fails, send SMS fallback via Twilio HTTP request
- If Google Sheets append fails: n8n stores payload in a local JSON file on the n8n server, sends alert email via Gmail node to founder, retries on next execution cycle
- If Webhook is unreachable: Meta Ads / Form platform retries up to 3x; n8n webhook is idempotent (deduplication by phone + timestamp window of 60s)

---

### 2. lead_nurture

**Purpose:** Auto-reply within 1 minute, assign sequence tags, send follow-up reminders at Day 1, Day 3, and Day 7.

| Step | Trigger | Action | Output | Connector |
|------|---------|--------|--------|-----------|
| 1 | lead_capture complete event | Tag lead as `sequence:new` in Sheets | Updated row | n8n Google Sheets node (Update Row) |
| 2 | Tag applied | Immediately send initial reply (<1 min SLA) | WhatsApp message delivered | n8n HTTP Request → WhatsApp Cloud API |
| 3 | 24h Wait | Day 1 follow-up: send value message | WhatsApp message | n8n Wait node → HTTP Request |
| 4 | Check reply status | If replied: tag `qualified`; if not: continue sequence | Branch | n8n Google Sheets Read → Switch node |
| 5 | 48h more Wait (Day 3) | Send objection-handling message | WhatsApp message | n8n Wait node → HTTP Request |
| 6 | 96h more Wait (Day 7) | Send final soft-close message | WhatsApp message | n8n Wait node → HTTP Request |
| 7 | After Day 7 message | If still no response: tag `cold`, update Sheets | Updated status | n8n Google Sheets node (Update Row) |

**Fallback Strategy:**
- If WhatsApp delivery fails: log failed message to ErrorLog sheet; retry after 15 minutes (max 3 retries); after 3 failures, escalate via email to founder
- If Wait node drops (n8n restart): n8n persists execution state to SQLite/PostgreSQL; on restart, resumes from last checkpoint
- If lead already replied and was converted before Day 7: Google Apps Script `updateLeadStatus()` call from CRM cancels the pending n8n execution via n8n REST API DELETE /executions/{id}

---

### 3. sales_and_conversion

**Purpose:** Send offer card, handle objections via Claude AI, generate MonCash checkout link, log confirmed sale.

| Step | Trigger | Action | Output | Connector |
|------|---------|--------|--------|-----------|
| 1 | Lead tagged `qualified` | Pull segment from Sheets (restaurant/pharmacy/etc.) | Segment string | n8n Google Sheets node (Read Row) |
| 2 | Segment known | Send localized offer card (WhatsApp template message) | Template message delivered | n8n HTTP Request → WhatsApp Business API |
| 3 | Incoming reply detected | Classify reply intent (buy/object/question) | Intent label | n8n HTTP Request → Claude API (claude-sonnet-4-6) |
| 4a | Intent = object/question | Generate objection-handling reply via Claude | Personalized response text | n8n HTTP Request → Claude API |
| 4b | Intent = buy | Generate MonCash payment link (amount, description, ref) | Payment URL | n8n HTTP Request → MonCash API |
| 5 | Payment link ready | Send link via WhatsApp | WhatsApp message with URL | n8n HTTP Request → WhatsApp Cloud API |
| 6 | MonCash IPN received | Log sale: client name, amount, date, package | New row in Payments sheet | Google Apps Script doPost() → Sheets |
| 7 | Sale logged | Update lead status to `sold` | Updated Leads row | Google Apps Script updateLeadStatus() |

**Fallback Strategy:**
- If Claude API call fails or times out: fall back to static objection-handler template from Sheets lookup by objection keyword
- If MonCash API fails to generate link: send manual payment instructions via WhatsApp (bank transfer details)
- If IPN is not received within 30 minutes of link send: n8n polls MonCash transaction status endpoint every 10 minutes for 2 hours

---

### 4. fulfillment

**Purpose:** Onboard new client via WhatsApp, deliver setup guide PDF, log completion, request testimonial.

| Step | Trigger | Action | Output | Connector |
|------|---------|--------|--------|-----------|
| 1 | MonCash IPN with status=success | Validate payment fields | Validated payment object | Google Apps Script doPost() |
| 2 | Validation passed | Append to Payments sheet | Payment row with ID | Google Apps Script → Sheets |
| 3 | Payment logged | Trigger n8n fulfillment workflow via webhook | HTTP 200 to n8n | Google Apps Script UrlFetchApp → n8n POST /payment-confirmed |
| 4 | n8n receives trigger | Send onboarding WhatsApp message (with Google Drive PDF link) | WhatsApp media message | n8n HTTP Request → WhatsApp Cloud API |
| 5 | Message sent | Append client to Clients sheet | Client row | n8n Google Sheets node |
| 6 | Wait 7 days | Send check-in WhatsApp message | WhatsApp message | n8n Wait node → HTTP Request |
| 7 | Wait 23 more days (Day 30) | Send testimonial request message | WhatsApp message | n8n Wait node → HTTP Request |
| 8 | Testimonial sent | Update Clients sheet status to `active_30d` | Updated Clients row | n8n Google Sheets node |

**Fallback Strategy:**
- If onboarding WhatsApp fails: retry 3 times at 5-minute intervals; if all fail, send onboarding email via Gmail node
- If Google Drive PDF link is broken: Apps Script checks file permissions on PDF before sending link; regenerates shareable link if needed
- If n8n is down when GAS sends trigger: GAS implements exponential backoff (1min, 2min, 4min retries); logs final failure to ErrorLog sheet

---

### 5. retention_and_referrals

**Purpose:** Re-engage clients at Day 30, request reviews, trigger referral flow, upsell at Day 60.

| Step | Trigger | Action | Output | Connector |
|------|---------|--------|--------|-----------|
| 1 | Schedule: daily 8AM | Read Clients sheet, filter `signup_date` = 30 days ago | List of due clients | n8n Schedule Trigger → Google Sheets node |
| 2 | Due client found | Send re-engagement WhatsApp (check-in + value tip) | WhatsApp message | n8n HTTP Request → WhatsApp Cloud API |
| 3 | Re-engagement sent | Send Google Reviews / testimonial request link | WhatsApp message | n8n HTTP Request → WhatsApp Cloud API |
| 4 | 2 days after review request | If client replied positively: trigger referral message | WhatsApp referral message | n8n Switch → HTTP Request |
| 5 | Referral message sent | Log referral event in Clients sheet | Updated row | n8n Google Sheets node |
| 6 | Schedule: daily 8AM | Filter clients where signup_date = 60 days ago | List of upsell candidates | n8n Schedule Trigger → Google Sheets node |
| 7 | Upsell candidate found | Send upsell offer (premium package or add-on) via WhatsApp | WhatsApp template message | n8n HTTP Request → WhatsApp Cloud API |
| 8 | Upsell interest detected | Create new lead entry with `source=upsell` | New Leads row | n8n Google Sheets node → sales_and_conversion flow |

**Fallback Strategy:**
- If client WhatsApp is unreachable (delivery failure): log as `unreachable` in Clients sheet; retry after 48h; after 2nd failure, mark `churned_uncontactable`
- If Google Reviews link is unavailable: substitute with a manual testimonial request form (Google Form link)
- If Schedule Trigger misses execution (n8n downtime): Google Apps Script time-driven trigger runs the same query as a backup at 8:30AM and calls n8n via REST API to queue missed executions

---

### 6. analytics

**Purpose:** Daily KPI snapshot, CAC/LTV/churn calculation, weekly report email, campaign spend alerts.

| Step | Trigger | Action | Output | Connector |
|------|---------|--------|--------|-----------|
| 1 | Schedule: 7AM daily | Execute dailyKpiSync() | KPI data object | Google Apps Script time-driven trigger |
| 2 | KPI calculated | Read Leads, Payments, Clients sheets | Raw row counts and revenue data | Google Apps Script Sheets API |
| 3 | Data read | Calculate CAC = total_ad_spend / new_clients | CAC value | Google Apps Script arithmetic |
| 4 | Calculate | LTV = avg_monthly_revenue * 12 | LTV value | Google Apps Script arithmetic |
| 5 | Calculate | churn_rate = churned_clients / total_clients_start_of_month | Churn % | Google Apps Script arithmetic |
| 6 | All KPIs ready | Append row to Analytics sheet with timestamp | Analytics row | Google Apps Script Sheets API |
| 7 | CAC check | If CAC > $20: send alert WhatsApp to founder | WhatsApp message | n8n HTTP Request (triggered by GAS webhook call) |
| 8 | Schedule: 7AM Monday | sendDailyReport() → format HTML email | HTML email string | Google Apps Script GmailApp |
| 9 | Email formatted | Send to founder email address | Email delivered | Google Apps Script GmailApp.sendEmail() |
| 10 | Meta Ads spend check | flagUnderperformingCampaigns(): compare CPC, CAC vs threshold | Alert rows in Alerts sheet | Google Apps Script Sheets API |

**Fallback Strategy:**
- If Sheets read fails (quota exceeded): retry after 1 minute up to 3 times; log to ErrorLog if all fail; send raw error alert email
- If Gmail send fails: log to ErrorLog sheet; backup via n8n Gmail node triggered by GAS webhook
- If Meta Ads API data is unavailable: use last known spend from Analytics sheet for calculation; flag data as `estimated` in that row

---

## D.2 Webhook Schema

All webhooks use JSON body, Content-Type: application/json. Authentication via HMAC-SHA256 signature in X-Signature header.

---

### lead_incoming Webhook

**Endpoint:** POST /haiti-lead-capture
**Direction:** Meta Ads / WhatsApp / Form → n8n

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "lead_incoming",
  "type": "object",
  "required": ["lead_id", "name", "phone", "lang", "source", "timestamp"],
  "properties": {
    "lead_id": {
      "type": "string",
      "description": "Unique identifier for this lead event. Use UUID v4.",
      "example": "550e8400-e29b-41d4-a716-446655440000"
    },
    "name": {
      "type": "string",
      "description": "Full name as submitted. May be first name only from WhatsApp.",
      "minLength": 1,
      "maxLength": 120,
      "example": "Marie Joseph"
    },
    "phone": {
      "type": "string",
      "description": "Phone number in E.164 format. Haiti country code is +509.",
      "pattern": "^\\+[1-9]\\d{7,14}$",
      "example": "+50941234567"
    },
    "lang": {
      "type": "string",
      "description": "Detected or self-reported language.",
      "enum": ["FR", "HT", "EN"],
      "example": "HT"
    },
    "source": {
      "type": "string",
      "description": "Traffic source that generated this lead.",
      "enum": ["facebook_ad", "instagram_ad", "whatsapp_dm", "google_form", "referral", "organic_whatsapp", "website"],
      "example": "facebook_ad"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp in UTC when the lead was captured.",
      "example": "2025-05-14T14:30:00Z"
    },
    "segment": {
      "type": "string",
      "description": "Business segment if known at capture time.",
      "enum": ["restaurant", "pharmacy", "boutique", "salon", "other"],
      "example": "restaurant"
    },
    "ad_campaign_id": {
      "type": "string",
      "description": "Meta Ads campaign ID if source is facebook_ad or instagram_ad.",
      "example": "120208796543210"
    },
    "ad_set_id": {
      "type": "string",
      "description": "Meta Ads ad set ID.",
      "example": "120208796543211"
    },
    "ad_id": {
      "type": "string",
      "description": "Meta Ads individual ad ID.",
      "example": "120208796543212"
    },
    "message_text": {
      "type": "string",
      "description": "First message text if lead came from WhatsApp DM.",
      "maxLength": 1000,
      "example": "Bonjou, m vle konnen plis sou sèvis ou yo"
    },
    "form_fields": {
      "type": "object",
      "description": "Raw key-value pairs from Google Form if source is google_form.",
      "additionalProperties": {
        "type": "string"
      }
    }
  },
  "additionalProperties": false
}
```

**Example Payload:**
```json
{
  "lead_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Marie Joseph",
  "phone": "+50941234567",
  "lang": "HT",
  "source": "facebook_ad",
  "timestamp": "2025-05-14T14:30:00Z",
  "segment": "restaurant",
  "ad_campaign_id": "120208796543210",
  "ad_set_id": "120208796543211",
  "ad_id": "120208796543212",
  "message_text": "Bonjou, m vle konnen plis sou sèvis ou yo"
}
```

---

### payment_confirmed Webhook (MonCash IPN)

**Endpoint:** POST /payment-confirmed (Google Apps Script Web App URL)
**Direction:** MonCash → Google Apps Script

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "payment_confirmed",
  "type": "object",
  "required": ["transaction_id", "order_id", "amount", "currency", "status", "customer_phone", "timestamp"],
  "properties": {
    "transaction_id": {
      "type": "string",
      "description": "MonCash unique transaction identifier.",
      "example": "MC20250514143022ABC"
    },
    "order_id": {
      "type": "string",
      "description": "Merchant-assigned order reference (maps to lead_id from KoneksAI).",
      "example": "KONEKS-2025-0042"
    },
    "amount": {
      "type": "number",
      "description": "Transaction amount in HTG (Haitian Gourde).",
      "minimum": 0,
      "example": 15000
    },
    "amount_usd": {
      "type": "number",
      "description": "Approximate USD equivalent at time of transaction.",
      "minimum": 0,
      "example": 97.50
    },
    "currency": {
      "type": "string",
      "enum": ["HTG"],
      "description": "Currency code. MonCash only processes HTG.",
      "example": "HTG"
    },
    "status": {
      "type": "string",
      "enum": ["success", "failed", "pending", "cancelled", "refunded"],
      "description": "Final transaction status.",
      "example": "success"
    },
    "customer_phone": {
      "type": "string",
      "description": "Customer MonCash-registered phone in E.164 format.",
      "pattern": "^\\+[1-9]\\d{7,14}$",
      "example": "+50941234567"
    },
    "customer_name": {
      "type": "string",
      "description": "Customer name as registered with MonCash.",
      "example": "Marie Joseph"
    },
    "package": {
      "type": "string",
      "description": "Service package purchased. Passed as metadata in payment initiation.",
      "enum": ["starter", "growth", "pro", "custom"],
      "example": "growth"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp in UTC of the transaction.",
      "example": "2025-05-14T14:45:00Z"
    },
    "moncash_reference": {
      "type": "string",
      "description": "MonCash internal reference number for dispute resolution.",
      "example": "REF509202505140001"
    },
    "signature": {
      "type": "string",
      "description": "HMAC-SHA256 signature of the payload. Computed using shared secret.",
      "example": "sha256=3d6b8f2c4e1a0d9f7b2e5c8a1d4f7b0e3c6a9d2f5b8e1c4a7d0f3b6e9c2a5d8"
    }
  },
  "additionalProperties": true
}
```

**Example Payload:**
```json
{
  "transaction_id": "MC20250514143022ABC",
  "order_id": "KONEKS-2025-0042",
  "amount": 15000,
  "amount_usd": 97.50,
  "currency": "HTG",
  "status": "success",
  "customer_phone": "+50941234567",
  "customer_name": "Marie Joseph",
  "package": "growth",
  "timestamp": "2025-05-14T14:45:00Z",
  "moncash_reference": "REF509202505140001",
  "signature": "sha256=3d6b8f2c4e1a0d9f7b2e5c8a1d4f7b0e3c6a9d2f5b8e1c4a7d0f3b6e9c2a5d8"
}
```

---

### fulfillment_trigger Webhook

**Endpoint:** POST /fulfillment-start
**Direction:** Google Apps Script → n8n

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "fulfillment_trigger",
  "type": "object",
  "required": ["fulfillment_id", "client_phone", "client_name", "package", "payment_transaction_id", "triggered_at"],
  "properties": {
    "fulfillment_id": {
      "type": "string",
      "description": "Unique ID for this fulfillment event. UUID v4.",
      "example": "7c9e6679-7425-40de-944b-e07fc1f90ae7"
    },
    "client_phone": {
      "type": "string",
      "description": "Client WhatsApp phone in E.164 format.",
      "pattern": "^\\+[1-9]\\d{7,14}$",
      "example": "+50941234567"
    },
    "client_name": {
      "type": "string",
      "description": "Client display name for personalized messages.",
      "example": "Marie Joseph"
    },
    "lang": {
      "type": "string",
      "description": "Client preferred language for message localization.",
      "enum": ["FR", "HT", "EN"],
      "example": "HT"
    },
    "package": {
      "type": "string",
      "description": "Purchased service package.",
      "enum": ["starter", "growth", "pro", "custom"],
      "example": "growth"
    },
    "segment": {
      "type": "string",
      "description": "Client business segment for customized onboarding.",
      "enum": ["restaurant", "pharmacy", "boutique", "salon", "other"],
      "example": "restaurant"
    },
    "payment_transaction_id": {
      "type": "string",
      "description": "Reference MonCash transaction ID for audit trail.",
      "example": "MC20250514143022ABC"
    },
    "setup_guide_url": {
      "type": "string",
      "format": "uri",
      "description": "Google Drive shareable URL to onboarding PDF guide.",
      "example": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs/view?usp=sharing"
    },
    "triggered_at": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 timestamp when fulfillment was triggered.",
      "example": "2025-05-14T14:46:00Z"
    },
    "sheets_row_index": {
      "type": "integer",
      "description": "Row index in Clients sheet for direct updates.",
      "minimum": 2,
      "example": 42
    }
  },
  "additionalProperties": false
}
```

---

### kpi_sync Webhook

**Endpoint:** POST /kpi-sync
**Direction:** Google Apps Script → n8n (for alert routing)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "kpi_sync",
  "type": "object",
  "required": ["sync_id", "date", "new_leads", "new_clients", "total_revenue_htg", "cac_usd", "ltv_usd", "churn_rate", "conversion_rate"],
  "properties": {
    "sync_id": {
      "type": "string",
      "description": "Unique ID for this sync event.",
      "example": "kpi-2025-05-14"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "Date this KPI snapshot represents (Haiti local date).",
      "example": "2025-05-14"
    },
    "new_leads": {
      "type": "integer",
      "description": "Number of new leads captured today.",
      "minimum": 0,
      "example": 12
    },
    "new_clients": {
      "type": "integer",
      "description": "Number of new paying clients converted today.",
      "minimum": 0,
      "example": 3
    },
    "total_revenue_htg": {
      "type": "number",
      "description": "Total revenue collected today in Haitian Gourde.",
      "minimum": 0,
      "example": 45000
    },
    "total_revenue_usd": {
      "type": "number",
      "description": "Total revenue today in USD equivalent.",
      "minimum": 0,
      "example": 292.50
    },
    "total_ad_spend_usd": {
      "type": "number",
      "description": "Total Meta Ads spend today in USD.",
      "minimum": 0,
      "example": 15.00
    },
    "cac_usd": {
      "type": "number",
      "description": "Customer Acquisition Cost: total_ad_spend / new_clients. Null if new_clients = 0.",
      "minimum": 0,
      "example": 5.00
    },
    "ltv_usd": {
      "type": "number",
      "description": "Lifetime Value estimate: avg_monthly_revenue * 12.",
      "minimum": 0,
      "example": 1170.00
    },
    "churn_rate": {
      "type": "number",
      "description": "Churn rate this month as decimal (0.05 = 5%).",
      "minimum": 0,
      "maximum": 1,
      "example": 0.03
    },
    "conversion_rate": {
      "type": "number",
      "description": "Lead-to-client conversion rate as decimal.",
      "minimum": 0,
      "maximum": 1,
      "example": 0.25
    },
    "active_clients_total": {
      "type": "integer",
      "description": "Total active paying clients as of today.",
      "minimum": 0,
      "example": 47
    },
    "alert_cac_exceeded": {
      "type": "boolean",
      "description": "True if CAC exceeded $20 threshold today.",
      "example": false
    },
    "campaigns_flagged": {
      "type": "array",
      "description": "List of campaign IDs where CAC > $20.",
      "items": {
        "type": "string"
      },
      "example": []
    },
    "synced_at": {
      "type": "string",
      "format": "date-time",
      "description": "ISO 8601 UTC timestamp of when this sync ran.",
      "example": "2025-05-14T12:00:00Z"
    }
  },
  "additionalProperties": false
}
```

---

## D.3 Google Sheets Structure

All tabs use Row 1 as a frozen header row. Column references use A1 notation.

---

### Tab: Leads (A:K)

| Col | Header | Type | Description |
|-----|--------|------|-------------|
| A | lead_id | String | UUID v4 unique identifier |
| B | timestamp | DateTime | ISO 8601 capture timestamp |
| C | name | String | Lead full name |
| D | phone | String | E.164 phone number (primary key) |
| E | lang | String | FR / HT / EN |
| F | source | String | facebook_ad / instagram_ad / whatsapp_dm / google_form / referral / organic_whatsapp / website |
| G | segment | String | restaurant / pharmacy / boutique / salon / other |
| H | stage | String | new / contacted / qualified / sold / lost / cold |
| I | ad_campaign_id | String | Meta Ads campaign ID (nullable) |
| J | last_contact_date | Date | Date of last WhatsApp message sent or received |
| K | notes | String | Free-text notes from Claude or manual entry |

---

### Tab: Payments (A:H)

| Col | Header | Type | Description |
|-----|--------|------|-------------|
| A | transaction_id | String | MonCash transaction ID (primary key) |
| B | timestamp | DateTime | ISO 8601 payment timestamp |
| C | client_phone | String | E.164 phone matching Leads.D |
| D | client_name | String | Client name |
| E | amount_htg | Number | Amount in Haitian Gourde |
| F | amount_usd | Number | USD equivalent at time of payment |
| G | package | String | starter / growth / pro / custom |
| H | status | String | success / failed / pending / refunded |

---

### Tab: Clients (A:L)

| Col | Header | Type | Description |
|-----|--------|------|-------------|
| A | client_id | String | UUID v4 unique identifier |
| B | onboard_date | Date | Date of successful onboarding |
| C | name | String | Client full name |
| D | phone | String | E.164 WhatsApp phone |
| E | lang | String | FR / HT / EN |
| F | segment | String | Business segment |
| G | package | String | Active service package |
| H | monthly_revenue_htg | Number | Monthly recurring amount in HTG |
| I | status | String | onboarding / active / active_30d / active_60d / churned / paused |
| J | referral_code | String | Unique referral code for this client |
| K | referred_by | String | Phone of referring client (nullable) |
| L | notes | String | Account management notes |

---

### Tab: Analytics (A:G)

| Col | Header | Type | Description |
|-----|--------|------|-------------|
| A | date | Date | Haiti local date (YYYY-MM-DD) |
| B | new_leads | Integer | New leads captured that day |
| C | new_clients | Integer | New paying clients converted that day |
| D | total_revenue_usd | Number | Revenue collected that day in USD |
| E | cac_usd | Number | Customer Acquisition Cost in USD (ad_spend / new_clients) |
| F | ltv_usd | Number | Estimated LTV in USD (avg_monthly * 12) |
| G | churn_rate | Number | Monthly churn rate as decimal |

---

### Tab: Content_Calendar (A:F)

| Col | Header | Type | Description |
|-----|--------|------|-------------|
| A | post_date | Date | Scheduled publication date |
| B | platform | String | facebook / instagram / whatsapp_broadcast / both |
| C | content_type | String | image / video / carousel / story / text |
| D | caption_text | String | Full post caption (FR or HT or EN) |
| E | status | String | draft / scheduled / published / paused |
| F | campaign_id | String | Linked Meta Ads campaign ID (nullable) |

---

## D.4 Integration Notes

### WhatsApp Cloud API Authentication
All WhatsApp messages use the Meta Cloud API. Required headers:
```
Authorization: Bearer {WHATSAPP_ACCESS_TOKEN}
Content-Type: application/json
```
Endpoint: `https://graph.facebook.com/v19.0/{PHONE_NUMBER_ID}/messages`

Template messages require pre-approved Meta templates. Use template `koneksai_initial_reply_ht` for Haitian Creole, `koneksai_initial_reply_fr` for French, `koneksai_initial_reply_en` for English.

### MonCash API
MonCash sandbox: `https://sandbox.moncashbutton.digicelgroup.com/Api`
MonCash production: `https://moncashbutton.digicelgroup.com/Api`
Authentication: Basic Auth with client_id:client_secret encoded as Base64.

### Claude API
Model: claude-sonnet-4-6
Used for: intent classification, objection handling, message personalization.
System prompt should specify Haiti business context, supported languages (FR/HT/EN), and response length constraints.

### n8n Configuration
- n8n deployed on VPS (recommended: DigitalOcean Droplet 4GB RAM, Port-au-Prince or Miami region for latency)
- Timezone set to `America/Port-au-Prince` (EST, UTC-5)
- All Schedule Triggers use this timezone
- n8n webhook base URL: `https://n8n.koneksai.ht/webhook`

### Haiti Business Context
- Primary language: Haitian Creole (HT), followed by French (FR)
- Currency: Haitian Gourde (HTG). Exchange rate ~154 HTG = 1 USD (volatile; use live rate API for USD conversions)
- Business hours: Monday–Saturday 7AM–6PM EST
- MonCash is the dominant mobile payment platform (Digicel network)
- WhatsApp penetration is near-universal on smartphones in Port-au-Prince
