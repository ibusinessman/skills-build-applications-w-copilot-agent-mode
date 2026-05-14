# KoneksAI — Section F: Risk Register & Compliance Framework

---

## Risk Register

---

## Risk: Payment Failure

**Severity:** High

**Early Warning Signal:** More than 2 MonCash transaction rejections in a single week; a client verbally confirms payment but MonCash confirmation message does not arrive within 30 minutes; a client's account shows "insufficient funds" error on attempted charge attempt.

**Mitigation:**
1. Always require confirmation of payment BEFORE beginning any setup work. The rule is: no deposit confirmed, no work started. Confirmation means: you have received the MonCash success SMS on your registered number, or cash is in your hand, or bank transfer reference number is provided and verified with your bank.
2. Maintain a multi-payment-method policy from Day 1. Accept MonCash (primary), cash in person (secondary), and bank transfer to a BNC or Sogebank account (tertiary). Never rely on a single payment channel. Brief every client on all three options during the sales call so there is no friction at payment time.
3. For monthly retainers, send a WhatsApp reminder 5 days before due date, 2 days before, and on due date. Automate this reminder using your own WhatsApp system (dogfood your product). If payment is not received within 3 days past due date, pause the client's automation service (not delete — pause) and send a final 48-hour notice before suspension.

**Rollback Plan:**
- Step 1: If MonCash payment fails at the point of sale, ask the client to try again with a different MonCash account (a family member's or business partner's)
- Step 2: If second attempt fails, offer immediate cash payment option — state your office location or agree to meet at a neutral point (a local business or café)
- Step 3: If client cannot pay today, issue a formal payment agreement by WhatsApp message stating: service begins on [date], first payment due [date], method [agreed method]. Screenshot and save this agreement.
- Step 4: If a monthly payment lapses beyond 7 days with no communication, pause automation service and send formal notice: "Sèvis ou an ka suspann nan 48 èdtan si nou pa resevwa pèman. Tanpri kontakte nou."
- Step 5: If payment is unrecoverable after 14 days, document the loss, do not pursue aggressively, and update your client screening process to identify payment risk signals earlier (e.g., clients who negotiate extensively on price before signing tend to be higher payment-risk).

**Legal/Compliance Note (Haiti-specific):** Haiti has no formal small claims court that is reliably accessible for amounts under $500 USD. Contractual disputes are difficult to enforce. Protect yourself by: (a) keeping all payment agreements in writing via WhatsApp (WhatsApp messages are timestamped and can serve as evidence), (b) never extending credit for more than 30 days, (c) building your contract so that access to the automation system is withheld until payment is confirmed — this is your primary leverage. Consider having a lawyer draft a simple 1-page service agreement in French that clients sign (physically or via WhatsApp photo) before work begins.

---

## Risk: Delivery Delays

**Severity:** Medium

**Early Warning Signal:** A client setup that was estimated at 72 hours is still incomplete at 96 hours; you have more than 3 simultaneous clients in active setup at once; an automation platform (ManyChat, Respond.io, WhatsApp Cloud API) is experiencing downtime confirmed on their status page; you are personally ill or unable to work for more than 24 hours.

**Mitigation:**
1. Set realistic expectations from the first conversation. Communicate setup time as "3–5 business days" not "72 hours" so you have buffer built in. Document this timeline in your onboarding message sent to every new client via WhatsApp.
2. Build a setup checklist for every client that lists every step with an estimated time. Share this checklist with the client so they can see progress. This reduces "when will it be done?" messages and increases trust even when timelines slip.
3. Limit simultaneous setups to 3 clients at a time until you have a trained assistant or virtual assistant helping. If a 4th client wants to start, place them on a "next available slot" list and give them a specific date. This is a quality control measure, not a rejection.

**Rollback Plan:**
- Step 1: Immediately notify the client of the delay via WhatsApp with a specific new completion date ("Nou pral fini konfigirasyon ou an jedi maten, pa madi kòm nou te planifye. Eskiz nou pou delay sa a.")
- Step 2: Offer a compensation gesture for delays beyond 48 hours past the agreed date: one extra week of free service (costs you nothing but goodwill is significant)
- Step 3: If the delay is caused by a third-party platform (WhatsApp Business API approval taking longer than expected), document this with a screenshot of the platform's timeline and share it with the client to demonstrate it is not your fault
- Step 4: If the delay is systemic (you are overloaded), create a queue system and be transparent with all clients about their position in the queue
- Step 5: If a client demands a refund due to delay beyond 7 days past the agreed start date, honor the refund of their setup deposit. Do not fight over it — it is better to refund $75 than to generate negative word-of-mouth in Port-au-Prince's tight business community.

**Legal/Compliance Note (Haiti-specific):** Haitian consumer protection law (Law of September 2, 1979 and subsequent regulations) provides basic consumer rights, though enforcement is weak. However, your professional reputation in Port-au-Prince is your most important asset. The city's business community is small and interconnected. One publicly unhappy client who posts in a local Facebook group can cost you 5 future clients. Always over-communicate, under-promise, and over-deliver.

---

## Risk: Low Demand

**Severity:** High

**Early Warning Signal:** Fewer than 3 qualified leads generated in the first 14 days of outreach; fewer than 1 trial started in the first 21 days; consistent feedback from prospects that they do not see the value or cannot afford the price; more than 5 consecutive no-responses from cold outreach messages.

**Mitigation:**
1. Implement the three Week-1 Validation Experiments (pre-sale, paid ad, cold DM) before investing more than $200 of your seed capital. These experiments are designed to test demand with minimal spend. If all three experiments fail simultaneously, the problem is either the product-market fit or the message — not the market.
2. Adjust your ideal customer profile if initial outreach is not converting. Start with businesses that have a demonstrably higher need: restaurants open past 8pm, pharmacies that receive after-hours calls, salons that manage appointments by phone. These businesses have the most immediate pain and the strongest ROI case.
3. Create a free entry point to reduce demand friction. Offer a "Free WhatsApp Automation Audit" — you spend 30 minutes analyzing their current WhatsApp setup and show them what they are missing. This is a sales call dressed as a service. The audit has zero cost to them and creates a warm pipeline for paid conversion.

**Rollback Plan:**
- Step 1: If no clients in 30 days, stop paid ads immediately to conserve capital
- Step 2: Shift 100% of effort to free channels: WhatsApp cold DM, Facebook group posts, in-person visits to target businesses
- Step 3: Reduce setup fee to $40 or offer first client completely free in exchange for a documented video testimonial and 3 referrals
- Step 4: Reframe the offer: instead of "WhatsApp automation," pitch "I will set up your WhatsApp Business properly so customers get instant replies" — simpler language, more concrete benefit
- Step 5: If still no traction at day 45, conduct 10 in-depth customer discovery interviews with business owners (not sales calls — genuine learning conversations). Ask: "What is your biggest communication problem right now?" The answers will reposition your offer around real demand.

**Legal/Compliance Note (Haiti-specific):** Low demand in the first 60 days does not justify dissolving the business. In Haiti, many businesses operate on informal networks and word-of-mouth that take 2–3 months to activate. Persistence through the first validation period is critical. Do not confuse slow initial traction with a fundamentally broken business model.

---

## Risk: Ad Rejection (Meta Ads Policy Violation)

**Severity:** Medium

**Early Warning Signal:** An ad is flagged as "In Review" for more than 24 hours without approval; you receive a policy violation notification in Meta Ads Manager; your ad account is flagged with a warning about "misleading claims," "before/after claims," or "personal attributes."

**Mitigation:**
1. Review Meta's Advertising Policies before writing any ad copy. Specifically avoid: (a) "you" statements that imply knowledge of personal characteristics ("you are struggling," "you are losing money" — rephrase as "many businesses in Port-au-Prince are losing money"), (b) before/after claims without substantiation, (c) any claim that implies guaranteed results. Replace "Get 3x more customers" with "Businesses like yours are seeing 3x more responses" — the shift from direct promise to social proof passes policy review.
2. Create a backup ad creative for every campaign. Before launching Variant 1, have a compliance-tested Variant 2 ready. If Variant 1 gets rejected, Variant 2 goes live immediately with no downtime in your campaign.
3. Avoid running ads that make income or revenue claims without clear disclaimers. If you mention revenue increases, add: "Results vary by business. Individual outcomes depend on business type, existing customer base, and engagement with the automation system."

**Rollback Plan:**
- Step 1: When an ad is rejected, read the specific rejection reason in Meta Ads Manager (under the "Ads" tab, hover over the ad status)
- Step 2: Edit only the element that was cited in the rejection — do not rebuild the entire ad. In most cases, changing one headline word or one sentence in the primary text resolves the issue
- Step 3: Resubmit the edited ad immediately — Meta typically reviews resubmissions within 12–24 hours
- Step 4: If the ad is rejected a second time for the same issue, submit a support request via Meta Business Help Center explaining your ad's intent and asking for specific guidance
- Step 5: If your ad account is restricted or disabled, do NOT create a new personal account to bypass the restriction — this permanently bans you. Instead, file a formal appeal via the Meta Business Help Center or Account Quality dashboard. Provide your business registration documents and a clear explanation of your business model.

**Legal/Compliance Note (Haiti-specific):** Meta enforces its global advertising policies uniformly regardless of country. However, Haiti-specific considerations include: (a) Meta may flag ads that reference MonCash, mobile money, or financial transactions due to fraud prevention policies — rephrase payment references to "easy local payment options" rather than naming specific providers, (b) ads in Haitian Creole may receive slower review times due to limited language moderation capacity — account for extra 24–48 hours, (c) targeting Haiti specifically may trigger additional review for financial or business service ads.

---

## Risk: Security Issues (Data Breach, Account Compromise)

**Severity:** High

**Early Warning Signal:** A client reports receiving unauthorized messages from their WhatsApp Business account; your Meta Ads Manager account shows unfamiliar login activity or unauthorized ad spend; a client's customer contact list is shared with an unauthorized party; you receive a WhatsApp message claiming to be Meta or WhatsApp asking for your business verification code.

**Mitigation:**
1. Enable two-factor authentication (2FA) on every account: your WhatsApp Business account, Meta Business Suite, your email account, your hosting provider, and any automation platform (ManyChat, Respond.io). Use an authenticator app (Google Authenticator or Authy), not SMS-based 2FA, for your most critical accounts. Never share your 2FA codes with anyone — Meta and WhatsApp will never ask for them.
2. Implement strict data minimization from Day 1. Only collect customer data that is essential for the automation to function: name, WhatsApp number, and business inquiry type. Do not store sensitive personal data (ID numbers, payment card details, addresses) in your automation platform. Keep client customer data separated — each client's data should only be accessible to that client and to you as the system administrator.
3. Create a written data handling policy (even a simple 1-page document) that you share with every client. This states: what data their customers' messages generate, where it is stored (name the specific platform), who can access it, and how long it is retained. Clients in Port-au-Prince will increasingly ask these questions as digital literacy grows.

**Rollback Plan:**
- Step 1: If you suspect an account compromise, immediately change passwords on all linked accounts — start with email (which controls password recovery for everything else)
- Step 2: Log out all active sessions on Meta Business Suite (Settings → Security → Where You're Logged In → Log Out All Sessions)
- Step 3: Revoke all third-party app access on your WhatsApp Business API account and re-authorize only the automation platform you currently use
- Step 4: Notify the affected client within 24 hours by phone and WhatsApp. Be transparent: "Nou te wè yon pwoblèm sekirite potansyèl. Nou pran aksyon imedyatman epi nou pral ba ou yon rapò konplè nan 48 èdtan."
- Step 5: Document the incident: what happened, when, what data may have been affected, what actions you took. If client customer data was exposed, you have an ethical (and potentially legal) obligation to inform those customers as well.

**Legal/Compliance Note (Haiti-specific):** Haiti does not currently have a comprehensive data protection law equivalent to GDPR or CCPA. However, as a business serving clients who serve consumers, you should operate as if a data protection framework is coming — because regional and international pressure will bring it within 3–5 years. Additionally, if you serve any clients with international customers (diaspora-facing businesses, clients with customers in the Dominican Republic), GDPR or similar laws may technically apply to those transactions.

---

## Risk: Regulatory Risk

**Severity:** Low (currently) to Medium (emerging)

**Early Warning Signal:** A news article about Haitian government regulation of digital services or mobile money; a request from the Ministère du Commerce et de l'Industrie for business registration; a WhatsApp Business API provider notifying of new country-specific compliance requirements for Haiti.

**Mitigation:**
1. Register your business formally with the Ministère du Commerce et de l'Industrie (MCI) as early as feasible — ideally within the first 60 days of operation. Even as a sole proprietor (entreprise individuelle), having a registration number (NIF — Numéro d'Identification Fiscale) provides legitimacy with clients and protects you if regulatory scrutiny increases.
2. Stay informed about Meta's WhatsApp Business API policies specific to Haiti. WhatsApp periodically updates its Business Policy for specific markets. Subscribe to WhatsApp Business API provider newsletters (360dialog, Twilio, Meta directly) for policy updates that affect your service delivery capability.
3. Monitor Haitian government digital economy initiatives. The Ministère des Affaires Étrangères and CONATEL (Conseil National des Télécommunications) have authority over digital communications services. Build a relationship with a local lawyer or business advisor who tracks regulatory changes in this space.

**Rollback Plan:**
- Step 1: If a regulatory requirement is introduced (e.g., mandatory business registration for digital service providers), comply immediately rather than operating in a gray area — the risk of non-compliance vastly outweighs the cost of compliance
- Step 2: If your WhatsApp Business API access is affected by a policy change, evaluate alternative delivery channels (SMS automation, Facebook Messenger automation) as backup
- Step 3: If a client receives a regulatory inquiry about their WhatsApp automation system, provide them with complete documentation of how the system works and confirm it operates within WhatsApp's published Business Policy
- Step 4: Maintain a regulatory compliance file: copies of your business registration, tax ID, any service agreements with platform providers, and a record of which WhatsApp Business policies apply to your service
- Step 5: If Haiti introduces a data localization requirement (requiring customer data to be stored on servers in Haiti), evaluate local hosting options or platform providers with Haitian data residency capability

**Legal/Compliance Note (Haiti-specific):** CONATEL is the primary telecommunications regulator. WhatsApp operates as an OTT (over-the-top) service and is not currently regulated as a telecommunications service in Haiti. However, regulatory frameworks for OTT services are evolving across the Caribbean. For business continuity, ensure you are not building a business model that is 100% dependent on a single platform (WhatsApp) that could face regulatory restrictions.

---

## Risk: Cash Flow Strain

**Severity:** High (especially months 1–3)

**Early Warning Signal:** Available cash drops below $200 USD (your minimum operating reserve); a client delays payment beyond 14 days; you have more than 2 clients simultaneously delinquent on monthly payments; an unexpected expense (platform subscription increase, equipment failure, emergency) exceeds $100 USD; your monthly expenses exceed your MRR for two consecutive months.

**Mitigation:**
1. Operate on a strict cash-first principle for the first 6 months. Do not purchase any tool, platform, or service until you have paying clients covering the cost. Use free tiers of all platforms (ManyChat free, WhatsApp Cloud API free tier up to 1,000 conversations/month, Google Workspace free tier) until revenue justifies upgrades. Your target is to break even (cover all expenses) by month 3 with 4–5 paying clients.
2. Build a 30-day cash reserve target of $300 USD. This is your minimum safety net. Until you reach this reserve, allocate 20% of every payment received to a separate savings (your MonCash savings or a dedicated bank account). Do not touch this reserve except for genuine business-stopping emergencies.
3. Collect payments in advance, not arrears. Monthly retainers should be due at the beginning of each month (or on the anniversary of signup), not at the end. This means you always have cash in hand before the service period, not after. For clients who resist prepayment, offer a small discount (5%) for 3-month prepayment.

**Rollback Plan:**
- Step 1: If cash drops below $200 USD, immediately pause all discretionary spending — stop paid ads, defer any non-essential subscriptions
- Step 2: Conduct an emergency sales push: contact your top 5 warm prospects and offer a 1-week-only discount (15% off setup) in exchange for payment this week
- Step 3: Invoice all clients with outstanding balances immediately — do not wait for the normal billing cycle
- Step 4: If you need bridge capital, explore MonCash merchant loans, Fonkoze microfinance (specifically designed for Haitian small businesses), or a personal loan from family/friends at zero interest before approaching commercial lenders
- Step 5: If cash flow crisis persists beyond 60 days with no resolution in sight, consider a "pivot to consulting" approach: sell your WhatsApp expertise as a consultant to a larger company (a bank, telecom, or NGO) for a fixed-fee project while rebuilding your client base. This generates lump-sum income that stabilizes cash flow while you rebuild MRR.

**Legal/Compliance Note (Haiti-specific):** Haiti's financial inclusion ecosystem is led by MonCash (Digicel) and Lajan Kach. Fonkoze is Haiti's leading microfinance institution and offers SME loans from as low as 25,000 HTG (~$250 USD). USAID and IDB Lab have active programs supporting Haitian digital businesses — research grant and loan opportunities at least quarterly. Digicel's business services team also offers merchant financing options for verified MonCash business accounts.

---

## MonCash Payment Failure Recovery Procedure

When a MonCash transaction fails or cannot be confirmed, execute the following steps in order:

**Step 1 — Identify the failure type.** Was it: (a) Client attempted transfer and got an error, (b) Client says they sent but you received nothing, (c) MonCash service is down, or (d) Client's MonCash account has insufficient balance?

**Step 2 — Check your MonCash merchant account.** Log into your MonCash merchant app. Under "Transactions," check if any pending transfer from the client's number exists. Sometimes transfers are delayed 5–15 minutes during peak hours.

**Step 3 — Ask the client for their MonCash transaction reference number.** Every MonCash transaction generates a reference number in the confirmation SMS sent to the sender. If the client cannot provide this reference, the transfer either did not complete or was sent to the wrong number.

**Step 4 — Verify the receiving number.** Confirm with the client the exact MonCash number they sent to. A single digit error sends the money to the wrong account and is very difficult to recover. If the number was wrong, the client must contact Digicel MonCash customer service at 1-888 (from a Digicel phone) to attempt a reversal.

**Step 5 — If MonCash is experiencing downtime.** Check the Digicel Haiti social media pages (Facebook: @DigicelHaiti) for service alerts. If there is a confirmed outage, inform the client and schedule a specific retry time: "MonCash gen yon pwoblèm sèvis kounye a. Nou pral eseye ankò a 3pm. Mwen pral voye ou yon mesaj pou konfime."

**Step 6 — If the client has insufficient funds.** Offer the cash payment alternative: "Pa gen pwoblèm — ou ka peye an kach. Nou ka rankontre nan [location] oswa mwen ka pase nan [their location] nan [time range]."

**Step 7 — Document every failed transaction attempt.** Record in your client management spreadsheet: date, amount, failure type, resolution step taken, final outcome. This protects you if a dispute arises later.

**Step 8 — If the transaction fails three times and no alternative payment is possible.** Do not start setup work. Clearly communicate: "Malèrezman, nou pa ka kòmanse travay la jiskaske pèman an konfime. Tanpri kontakte nou lè pwoblèm pèman an rezoud."

---

## WhatsApp Business Account Suspension Recovery

If your WhatsApp Business account or a client's account is suspended, execute in this order:

**Step 1 — Identify the reason for suspension.** WhatsApp sends a notification within the app. Common reasons: (a) violation of WhatsApp Business Policy (spam, prohibited content), (b) too many users blocking the number, (c) high rate of message complaints, (d) use of unofficial WhatsApp clients (WhatsApp Plus, GB WhatsApp).

**Step 2 — Do not create a new account on the same phone number.** This escalates the suspension to a permanent ban. Suspend all activity on the affected number.

**Step 3 — Submit an appeal.** Within the WhatsApp app: Settings → Help → Contact Us. Alternatively, go to WhatsApp's business appeal form at: business.whatsapp.com/unsupported. Provide: your phone number, business name, a clear explanation of your business and why you believe the suspension is in error, and any supporting documentation (business registration if available).

**Step 4 — While the appeal is under review.** Temporarily route client inquiries to an alternative phone number (a personal WhatsApp) with a message: "Nou gen yon pwoblèm teknik ak nimewo prensipal nou an. Tanpri kontakte nou sou [alternative number] pou asistans imedyat."

**Step 5 — If suspension is upheld and permanent.** Register a new business phone number (a new SIM card, ideally a Digicel or Natcom business SIM). Apply for a new WhatsApp Business account with this number. Do not reuse any automation flows that may have triggered the original suspension — review all message templates for policy compliance before relaunching.

**Step 6 — Preventive measures post-recovery.** Audit your message send rate (no more than 1,000 messages per day from a single number without API access), ensure all message templates are approved before use (for API accounts), set up regular inbox monitoring to catch and respond to any user complaints before they accumulate.

---

## Meta Ads Account Rejection Recovery

**Step 1 — Read the rejection notice carefully.** Access Meta Ads Manager → Account Quality → Account Issues. The rejection notice contains a specific policy reference. Note the exact policy cited.

**Step 2 — Do NOT create a new ad account to bypass the rejection.** This is a terms of service violation and results in permanent ban of all accounts linked to your identity.

**Step 3 — Request review.** In Account Quality, click "Request Review" if the option is available. Write a clear explanation of your business (WhatsApp automation services for small businesses in Port-au-Prince) and why your ad complies with Meta's policies. Be specific and professional.

**Step 4 — If the review is denied.** Contact Meta Business Support directly via live chat (available through Meta Business Help Center). Have your business documentation ready: business registration (if available), NIF number, a description of your services, and examples of your ad creative with explanations of compliance.

**Step 5 — Adjust your creative for future compliance.** Review the specific policy cited and rewrite your ads accordingly. Common fixes: (a) remove "you" statements about personal characteristics, (b) add "results may vary" disclaimers to performance claims, (c) replace direct promises with social proof phrasing, (d) remove images of money or financial instruments.

**Step 6 — Launch on alternative channels while Meta is being resolved.** Google Ads (search campaigns for "WhatsApp business automation Haiti"), LinkedIn (for more formal business audiences), and organic Facebook group posting can maintain lead flow while your Meta account issue is resolved.

---

## GDPR and Haiti Data Privacy Considerations

**Current Haiti Legal Framework:**
Haiti does not have a standalone data protection law as of 2025. The closest applicable framework is Article 19 of the Haitian Constitution (right to privacy) and general provisions of the Code Civil relating to personal information. However, this is evolving, and Caribbean regional frameworks are influencing local regulatory discussion.

**GDPR Applicability to KoneksAI:**
GDPR applies to any business that processes personal data of EU residents, regardless of where the business is based. If any of your clients serve customers in France, Canada (Quebec), or EU member states — which is possible given the Haitian diaspora — GDPR may technically apply to those data flows. Key GDPR principles to implement proactively:

1. **Lawful basis for processing:** Ensure your clients' customers have given explicit consent to receive automated WhatsApp messages. The opt-in must be clear and documented. A pre-checked box is not valid consent.

2. **Data minimization:** Only collect what is necessary. Name and WhatsApp number for appointment booking. No collection of health data, financial data, or government ID numbers through automation flows.

3. **Right to erasure:** Any customer who asks to be removed from an automated system must be removed within 72 hours. Build a simple "STOP" keyword response into every automation flow that immediately removes the user from all sequences.

4. **Data retention:** Define and communicate how long customer conversation data is retained. Recommend: 12 months, then archived or deleted.

5. **Data processor agreements:** If you are handling your clients' customer data (which you are, as the administrator of their automation systems), you are technically a "data processor" under GDPR. Your service agreement should include a data processing addendum stating your responsibilities and limitations.

**Practical recommendation for KoneksAI:** Implement GDPR-equivalent practices as your default standard, even though Haiti does not legally require it. This (a) protects diaspora-facing clients, (b) positions you as a premium, trustworthy provider, and (c) prepares you for future regulatory changes without retroactive compliance costs.

---

## Business Structure: Sole Proprietorship vs LLC in Haiti

**Option 1: Entreprise Individuelle (Sole Proprietorship)**

*Legal framework:* Governed by the Code de Commerce d'Haïti.

*How to register:* File with the Ministère du Commerce et de l'Industrie (MCI). Obtain a NIF (Numéro d'Identification Fiscale) from the Direction Générale des Impôts (DGI). Register with the Registre du Commerce (RECo). Total cost: approximately 5,000–15,000 HTG in fees and legal assistance.

*Advantages:*
- Fastest and cheapest to set up (2–4 weeks)
- Minimal ongoing compliance requirements
- Full control — no shareholders or board
- Simpler tax filing (income reported on personal tax return)

*Disadvantages:*
- Personal liability is unlimited — if the business is sued or owes debt, your personal assets are at risk
- Harder to raise investment or bring in partners
- Some larger clients or institutional partners may require an LLC for contracting

*Recommended for:* KoneksAI in the first 12 months, given the low startup capital and solo founder structure.

---

**Option 2: Société à Responsabilité Limitée (SARL — equivalent to LLC)**

*Legal framework:* Governed by Articles 180–244 of the Code de Commerce d'Haïti.

*How to register:* Draft articles of incorporation (statuts constitutifs) with a notary. File with MCI. Register with RECo and DGI. Minimum capital requirement: 500,000 HTG (approximately $5,000 USD) — though this can be contributed in kind (equipment, IP) not just cash. Total legal cost: approximately 30,000–60,000 HTG including notary fees.

*Advantages:*
- Limited liability — personal assets protected from business debts
- More credible to larger clients, banks, and institutional partners
- Can issue shares to future investors or partners
- Better access to formal business loans

*Disadvantages:*
- Higher setup cost and time (4–8 weeks minimum)
- More complex tax and compliance obligations
- Annual reporting requirements to MCI
- Minimum capital requirement may be a barrier early

*Recommended for:* KoneksAI at month 6–12 once revenue is stable and you are seeking institutional clients, investors, or partners.

---

**Practical Recommendation for KoneksAI Founder:**

Start as an Entreprise Individuelle immediately. This gives you legal operating status, a NIF for invoicing, and the ability to open a business bank account. The registration process takes 2–4 weeks and costs approximately 10,000–15,000 HTG total with a local business lawyer or agent facilitating.

At month 6–9, when you have 10+ paying clients and $800–1,000 MRR, begin the SARL conversion process. The limited liability protection and increased institutional credibility will support your growth to 20+ clients and beyond.

**Key contacts for registration:**
- Ministère du Commerce et de l'Industrie: Ave Marie-Jeanne, Port-au-Prince
- Direction Générale des Impôts (DGI): for NIF registration
- RECo (Registre du Commerce): for commercial registration
- CCIH (Chambre de Commerce et d'Industrie d'Haïti): offers support services and guidance for new business registrations at reduced cost for members
