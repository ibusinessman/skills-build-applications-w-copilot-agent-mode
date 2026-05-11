/* ─────────────────────────────────────────────────────────────
   Offline demo mode — realistic mock data, no backend needed.
   Activated automatically when Quick Demo login fails to reach
   the real backend (network error).
───────────────────────────────────────────────────────────── */

export const DEMO_TOKEN = 'xtra-demo-offline-token';

export const DEMO_ME = {
  id: 1,
  username: 'jean_moto',
  full_name: 'Jean Baptiste Moto',
  email: 'jean.moto@xtra-asirans.ht',
  phone: '50947382910',
  moto_count: 2,
  vignette_number: 'VIG-2026-4821',
  referral_code: 'JEAN50XT',
  balance_gourdes: 2002900,
  created_at: '2025-11-01T08:00:00Z',
};

export const DEMO_DASHBOARD = {
  balance_gourdes: 2002900,
  rc_active: true,
  risk_score: 0.78,
  unread_notifications: 3,
  active_policy: {
    id: 1,
    plan: 'RC_PRO',
    status: 'active',
    end_date: '2026-06-10',
    days_remaining: 30,
  },
  high_risk_zones: [
    { id: 1, name: 'Cité Soleil', risk_score: 0.95 },
    { id: 2, name: 'Martissant',  risk_score: 0.88 },
    { id: 3, name: 'Bel Air',     risk_score: 0.82 },
  ],
  recent_claims: [
    { id: 1, amount_gourdes: 3500, description: 'Klinik Sent-Kwa, frè medikal', status: 'paid',         status_display: 'Peye ✅', created_at: '2026-05-08T10:23:00Z' },
    { id: 2, amount_gourdes: 7200, description: 'Reparasyon moto — bò droit',   status: 'under_review', status_display: 'Anba Revizyon 🔍', created_at: '2026-05-05T14:11:00Z' },
    { id: 3, amount_gourdes: 1800, description: 'Frè medikal ijans',             status: 'paid',         status_display: 'Peye ✅', created_at: '2026-04-29T09:05:00Z' },
  ],
  stats: { total_claims: 6, paid_claims: 4, total_referrals: 3 },
};

export const DEMO_WALLET = {
  balance_gourdes: 2002900,
  transactions: [
    { id: 1, amount_gourdes:  3500, tx_type: 'claim_payout',   description: 'Payout Sinis #1',   created_at: '2026-05-08T10:24:00Z' },
    { id: 2, amount_gourdes:  -300, tx_type: 'policy_payment', description: 'RC Pro — Me 2026',  created_at: '2026-05-01T08:00:00Z' },
    { id: 3, amount_gourdes:    50, tx_type: 'referral_bonus', description: 'Bonus Zanmi — Marie', created_at: '2026-04-28T11:30:00Z' },
    { id: 4, amount_gourdes:  1800, tx_type: 'claim_payout',   description: 'Payout Sinis #3',   created_at: '2026-04-29T09:06:00Z' },
    { id: 5, amount_gourdes:  -300, tx_type: 'policy_payment', description: 'RC Pro — Av 2026',  created_at: '2026-04-01T08:00:00Z' },
    { id: 6, amount_gourdes:  2000000, tx_type: 'credit',      description: 'Sòl Inisyal Xtra',  created_at: '2025-11-01T08:00:00Z' },
  ],
};

export const DEMO_NOTIFICATIONS = [
  { id: 1, notif_type: 'risk_alert', title: '🚨 Alèt Risk — Cité Soleil', message: 'Nivo risk wo nan zòn ou a. RC obligatwa pou pwoteksyon ou.', read: false, created_at: '2026-05-11T06:00:00Z' },
  { id: 2, notif_type: 'payment',    title: '⚡ Payout 3 500g Konfime',  message: 'Reklamasyon #1 ou peye sou MonCash 50947382910.', read: false, created_at: '2026-05-08T10:24:00Z' },
  { id: 3, notif_type: 'referral',   title: '🎁 Bonus Parenaj 50g',       message: 'Marie Ride enskri ak kòd ou. 50g ajoute nan bous ou!', read: false, created_at: '2026-04-28T11:30:00Z' },
  { id: 4, notif_type: 'policy',     title: '🛡️ RC Pro Aktive',           message: 'Polis RC Pro ou aktif pou Me 2026. Kouvèti total.', read: true,  created_at: '2026-05-01T08:01:00Z' },
  { id: 5, notif_type: 'promo',      title: '✨ Upgrade RC Premium',       message: 'Jwenn revizyon 1h, jesyon flòt ak alèt AI. Sèlman 500g/mwa.', read: true, created_at: '2026-04-25T09:00:00Z' },
];

export const DEMO_REFERRALS = [
  { id: 1, referee_phone: '50938271640', status: 'bonus_paid', status_display: 'Bonus Peye ✅', bonus_gourdes: 50, created_at: '2026-04-28T11:30:00Z' },
  { id: 2, referee_phone: '50912847362', status: 'registered', status_display: 'Enskri 🟡',     bonus_gourdes: 0,  created_at: '2026-05-03T14:10:00Z' },
  { id: 3, referee_phone: '50927364819', status: 'pending',    status_display: 'An Atant ⏳',   bonus_gourdes: 0,  created_at: '2026-05-09T16:45:00Z' },
];

export function isDemoMode() {
  return localStorage.getItem('xtra_token') === DEMO_TOKEN;
}

export function activateDemo() {
  localStorage.setItem('xtra_token', DEMO_TOKEN);
}

export function deactivateDemo() {
  if (isDemoMode()) localStorage.removeItem('xtra_token');
}
