# KoneksAI — WhatsApp Automation Agency for Port-au-Prince, Haiti

> **"Nou konfigire WhatsApp ou pou kliyan ou yo pa janm tann — epi ou pa janm pèdi yon vant."**
>
> *"We set up your WhatsApp so customers never wait — and you never miss a sale."*

Built with the `/godmode` autonomous business builder. Seed capital: $1,000 USD. Target market: Port-au-Prince, Haiti SMEs.

---

## What Is KoneksAI?

KoneksAI is a done-for-you WhatsApp Business automation service for small businesses in Port-au-Prince. We set up auto-replies, product catalogs, MonCash payment links, and appointment booking — so Haitian SMEs never miss a customer message again.

**Pricing:** $75 setup (one-time) + $50/month Basic or $100/month Premium  
**Payment:** MonCash | Cash | Bank Transfer  
**Target:** 20 paying clients by Day 90 → $2,000–$3,500 MRR

---

## Business System Files

### Strategy
| File | Description |
|------|-------------|
| `section-a-executive-plan.md` | One-page executive plan: market, pricing, unit economics, KPIs, risks, next actions, alternative businesses ranked |
| `section-b-90day-playbook.md` | 13-week daily action plan with automation vs manual task breakdown |
| `section-h-french-summary.md` | Résumé exécutif complet en français |
| `section-i-creole-summary.md` | Rezime egzekitif konplè an Kreyòl Ayisyen |

### Brand & Marketing
| File | Description |
|------|-------------|
| `section-c-branding-content.md` | Brand identity, sales scripts (EN/FR/HT), landing page copy, 4 weeks of content |
| `section-e-ads-workflows.md` | Meta Ads copy (3 variants × 3 languages), retargeting, Week-1 validation experiments, moat strategy |

### Automation & Tech
| File | Description |
|------|-------------|
| `section-d-automation-architecture.md` | Full connector map, webhook schemas, Google Sheets structure |
| `code/n8n-lead-to-sale-workflow.json` | n8n workflow: lead capture → qualify → auto-reply → follow-up → close |
| `code/n8n-fulfillment-workflow.json` | n8n workflow: payment confirmed → onboarding → check-in → testimonial |
| `code/n8n-kpi-analytics-workflow.json` | n8n workflow: daily KPI calculation → alert → email report |
| `code/moncash-ipn-handler.gs` | Google Apps Script: MonCash IPN receiver, payment logging, fulfillment trigger |
| `code/kpi-sync.gs` | Google Apps Script: daily KPI sync, report email, campaign flagging |
| `code/lead-crm.gs` | Google Apps Script: CRM engine, lead routing, deduplication, message templates |
| `code/claude-routines.json` | Claude connector routine definitions for all 6 automation categories |
| `code/webhook-schemas.json` | Complete JSON schemas for all webhooks |

### Risk & Analytics
| File | Description |
|------|-------------|
| `section-f-risk-compliance.md` | Risk register with early warnings, mitigations, rollback plans |
| `section-g-kpi-dashboard.csv` | 13-week projected KPI data + tracking template |

---

## Tech Stack

```
Claude (claude-sonnet-4-6 / claude-haiku-4-5-20251001)
  └── Lead qualification, content generation, objection handling, KPI analysis

n8n (self-hosted or cloud)
  ├── Lead capture webhook
  ├── WhatsApp auto-reply sequences
  ├── Fulfillment automation
  └── Daily KPI sync

Google Apps Script
  ├── MonCash IPN handler (Web App)
  ├── CRM engine (Google Sheets)
  └── Daily report emailer

Google Sheets
  └── Leads | Payments | Clients | Analytics | Content_Calendar

WhatsApp Business API (Meta)
  └── Auto-replies, offer cards, onboarding, testimonial requests

MonCash API
  └── Payment link generation + IPN callbacks

Meta Ads
  └── Cold audience acquisition + retargeting
```

---

## Quick Start (Day 1)

1. **Copy Google Sheets template** → Set `KONEKSAI_SHEET_ID` in all scripts
2. **Deploy `moncash-ipn-handler.gs`** as Google Apps Script Web App
3. **Import `n8n-lead-to-sale-workflow.json`** into n8n
4. **Set environment variables:**
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   WA_PHONE_NUMBER_ID=...
   WA_TOKEN=...
   KONEKSAI_SHEET_ID=...
   MONCASH_SECRET=...
   N8N_FULFILLMENT_WEBHOOK_URL=https://your-n8n/webhook/trigger-fulfillment
   FOUNDER_EMAIL=founder@example.com
   ```
5. **Run Week-1 Experiment 3** (WhatsApp cold outreach to 50 local businesses)
6. **Launch Meta Ad** with Variant 1 (pain-based hook), $5/day budget

---

## Unit Economics

| Metric | Value |
|--------|-------|
| Setup fee (one-time) | $75 USD |
| Monthly retainer (Basic) | $50 USD |
| Monthly retainer (Premium) | $100 USD |
| CAC target | < $20 USD |
| LTV (Basic, 12-month) | $75 + ($50 × 12) = $675 |
| LTV:CAC ratio | 33.75x |
| Gross margin | ~90% |
| Breakeven | 3 clients on monthly retainer |
| Time to breakeven | Week 3–4 |

---

## 90-Day Revenue Projection

| Period | Clients | MRR | Cumulative Revenue |
|--------|---------|-----|-------------------|
| Day 30 | 4 | $200 | $500 |
| Day 60 | 11 | $650 | $2,100 |
| Day 90 | 20 | $1,200 | $5,800 |

---

## Languages

All customer-facing copy exists in three versions:
- 🇺🇸 **English** (EN)
- 🇫🇷 **French** (FR) — official Haitian government/business language
- 🇭🇹 **Haitian Creole** (HT) — primary spoken language, highest trust

---

## Decision: Why KoneksAI Won

| Criteria | Score (1–10) | Reason |
|----------|-------------|--------|
| Fastest path to revenue | 9 | Cold WhatsApp outreach → first client in 48h |
| Lowest startup cost | 9 | $0 software cost (GAS + n8n free tier + existing tools) |
| Highest defensibility | 8 | Client data + local relationships + automation templates |
| Haiti market fit | 10 | WhatsApp is #1 business tool; MonCash is mainstream |
| Automation potential | 9 | 80% of workflow automatable with this stack |
| **Overall confidence** | **9.0/10** | |

**Alternatives ranked:**
1. Digital Skills Training (online courses) — 7.5/10
2. Diaspora Admin Services — 7.0/10
3. Online Tutoring — 6.5/10

---

*Built autonomously by KoneksAI founder using Claude Code + Claude Connectors | Port-au-Prince, Haiti 2026*
