import {
  DEMO_TOKEN, DEMO_ME, DEMO_DASHBOARD, DEMO_WALLET,
  DEMO_NOTIFICATIONS, DEMO_REFERRALS,
  isDemoMode, activateDemo, deactivateDemo,
} from './demo.js';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken() { return localStorage.getItem('xtra_token'); }
function setToken(t) { localStorage.setItem('xtra_token', t); }
function clearToken() {
  localStorage.removeItem('xtra_token');
  localStorage.removeItem('xtra_driver');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Token ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || data.detail || 'API error'), { status: res.status, data });
  return data;
}

/* ── Demo claim counter (persisted in session) ── */
let _demoClaimId = 10;

export const api = {
  // ── AUTH ──────────────────────────────────────────────────
  async register(payload) {
    const data = await request('/auth/register/', { method: 'POST', body: payload, auth: false });
    setToken(data.token);
    return data;
  },

  async login(username, password) {
    try {
      const data = await request('/auth/login/', { method: 'POST', body: { username, password }, auth: false });
      setToken(data.token);
      return data;
    } catch (err) {
      /* If network is unreachable AND these are the demo credentials, activate offline demo */
      const isNetworkError = !err.status;
      const isDemoCreds = username === 'jean_moto' && password === 'xtra2026!';
      if (isNetworkError && isDemoCreds) {
        activateDemo();
        return { token: DEMO_TOKEN, user: DEMO_ME };
      }
      throw err;
    }
  },

  logout() {
    deactivateDemo();
    clearToken();
  },

  isLoggedIn() { return Boolean(getToken()); },

  async me() {
    if (isDemoMode()) return DEMO_ME;
    return request('/auth/me/');
  },

  // ── DASHBOARD ─────────────────────────────────────────────
  async dashboard() {
    if (isDemoMode()) return DEMO_DASHBOARD;
    return request('/dashboard/');
  },

  // ── WALLET ────────────────────────────────────────────────
  async wallet() {
    if (isDemoMode()) return DEMO_WALLET;
    return request('/wallet/');
  },

  // ── POLICIES ──────────────────────────────────────────────
  async policies() {
    if (isDemoMode()) return [DEMO_DASHBOARD.active_policy];
    return request('/policies/');
  },

  async createPolicy(plan = 'RC_PRO') {
    if (isDemoMode()) return { ...DEMO_DASHBOARD.active_policy, plan };
    return request('/policies/', { method: 'POST', body: { plan } });
  },

  async payPolicy(id, moncash_phone) {
    if (isDemoMode()) return { ...DEMO_DASHBOARD.active_policy, status: 'active' };
    return request(`/policies/${id}/pay/`, { method: 'POST', body: { moncash_phone } });
  },

  // ── CLAIMS ────────────────────────────────────────────────
  async claims() {
    if (isDemoMode()) return DEMO_DASHBOARD.recent_claims;
    return request('/claims/');
  },

  async submitClaim({ amount_gourdes, description, moncash_phone }) {
    if (isDemoMode()) {
      return {
        id: ++_demoClaimId,
        amount_gourdes,
        description,
        moncash_phone,
        status: 'under_review',
        status_display: 'Anba Revizyon 🔍',
        moncash_ref: null,
        created_at: new Date().toISOString(),
      };
    }
    return request('/claims/', { method: 'POST', body: { amount_gourdes, description, moncash_phone } });
  },

  // ── RISK ZONES ────────────────────────────────────────────
  async riskZones() {
    if (isDemoMode()) return DEMO_DASHBOARD.high_risk_zones;
    return request('/risk-zones/');
  },

  // ── REFERRALS ─────────────────────────────────────────────
  async referrals() {
    if (isDemoMode()) return DEMO_REFERRALS;
    return request('/referrals/');
  },

  async sendReferral(referee_phone) {
    if (isDemoMode()) {
      return { id: Date.now(), referee_phone, status: 'pending', status_display: 'An Atant ⏳', bonus_gourdes: 0, created_at: new Date().toISOString() };
    }
    return request('/referrals/', { method: 'POST', body: { referee_phone } });
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────
  async notifications() {
    if (isDemoMode()) return DEMO_NOTIFICATIONS;
    return request('/notifications/');
  },

  async markAllRead() {
    if (isDemoMode()) return { status: 'ok' };
    return request('/notifications/read_all/', { method: 'PATCH' });
  },
};
