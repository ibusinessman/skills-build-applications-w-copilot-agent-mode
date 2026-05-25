import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('haitibet_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('haitibet_token');
      localStorage.removeItem('haitibet_user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(err.response?.data ?? err);
  },
);

// Auth
export const authApi = {
  register: (data: { phone: string; name: string; password?: string }) =>
    api.post('/auth/register', data).then((r) => r.data),
  login: (data: { phone: string; password: string }) =>
    api.post('/auth/login', data).then((r) => r.data),
  sendOtp: (phone: string, purpose = 'login') =>
    api.post('/auth/otp/send', { phone, purpose }).then((r) => r.data),
  verifyOtp: (phone: string, code: string, purpose?: string) =>
    api.post('/auth/otp/verify', { phone, code, purpose }).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

// Matches
export const matchesApi = {
  list: (params?: { status?: string; upcoming?: boolean }) =>
    api.get('/matches', { params }).then((r) => r.data),
  getById: (id: string) => api.get(`/matches/${id}`).then((r) => r.data),
  getLive: (id: string) => api.get(`/matches/${id}/live`).then((r) => r.data),
};

// Markets
export const marketsApi = {
  forMatch: (matchId: string, category?: string) =>
    api.get(`/markets/match/${matchId}`, { params: { category } }).then((r) => r.data),
  getById: (id: string) => api.get(`/markets/${id}`).then((r) => r.data),
};

// Bets
export const betsApi = {
  place: (data: { stake: number; selections: { marketId: string; outcomeId: string }[]; idempotencyKey?: string }) =>
    api.post('/bets', data).then((r) => r.data),
  list: (status?: string) => api.get('/bets', { params: { status } }).then((r) => r.data),
  getById: (id: string) => api.get(`/bets/${id}`).then((r) => r.data),
};

// Payments
export const paymentsApi = {
  deposit: (amount: number, idempotencyKey?: string) =>
    api.post('/payments/deposit', { amount, idempotencyKey }).then((r) => r.data),
  confirmDeposit: (transactionId: string, moncashTransactionId?: string) =>
    api.post(`/payments/deposit/${transactionId}/confirm`, { moncashTransactionId }).then((r) => r.data),
  withdraw: (amount: number, phone: string) =>
    api.post('/payments/withdraw', { amount, phone }).then((r) => r.data),
  balance: () => api.get('/payments/balance').then((r) => r.data),
  transactions: () => api.get('/payments/transactions').then((r) => r.data),
};

// Notifications
export const notificationsApi = {
  list: () => api.get('/notifications').then((r) => r.data),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all').then((r) => r.data),
};
