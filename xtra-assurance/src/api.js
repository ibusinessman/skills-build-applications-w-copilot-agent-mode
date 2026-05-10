const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('xtra_token');
}

function setToken(token) {
  localStorage.setItem('xtra_token', token);
}

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

export const api = {
  // ── AUTH ──────────────────────────────────────────────────
  async register(payload) {
    const data = await request('/auth/register/', { method: 'POST', body: payload, auth: false });
    setToken(data.token);
    return data;
  },

  async login(username, password) {
    const data = await request('/auth/login/', { method: 'POST', body: { username, password }, auth: false });
    setToken(data.token);
    return data;
  },

  logout() {
    clearToken();
  },

  isLoggedIn() {
    return Boolean(getToken());
  },

  async me() {
    return request('/auth/me/');
  },

  // ── DASHBOARD ─────────────────────────────────────────────
  async dashboard() {
    return request('/dashboard/');
  },

  // ── WALLET ────────────────────────────────────────────────
  async wallet() {
    return request('/wallet/');
  },

  // ── POLICIES ──────────────────────────────────────────────
  async policies() {
    return request('/policies/');
  },

  async createPolicy(plan = 'RC_PRO') {
    return request('/policies/', { method: 'POST', body: { plan } });
  },

  async payPolicy(id, moncash_phone) {
    return request(`/policies/${id}/pay/`, { method: 'POST', body: { moncash_phone } });
  },

  // ── CLAIMS ────────────────────────────────────────────────
  async claims() {
    return request('/claims/');
  },

  async submitClaim(payload) {
    return request('/claims/', { method: 'POST', body: payload });
  },

  // ── RISK ZONES ────────────────────────────────────────────
  async riskZones() {
    return request('/risk-zones/');
  },

  // ── REFERRALS ─────────────────────────────────────────────
  async referrals() {
    return request('/referrals/');
  },

  async sendReferral(referee_phone) {
    return request('/referrals/', { method: 'POST', body: { referee_phone } });
  },

  // ── NOTIFICATIONS ─────────────────────────────────────────
  async notifications() {
    return request('/notifications/');
  },

  async markAllRead() {
    return request('/notifications/read_all/', { method: 'PATCH' });
  },
};
