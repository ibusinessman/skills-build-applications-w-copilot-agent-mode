import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { MMKV } from 'react-native-mmkv';
import Toast from 'react-native-toast-message';

// Shared MMKV storage instance
export const storage = new MMKV({ id: 'haitibet-storage' });

const BASE_URL = process.env.API_URL ?? 'http://localhost:8000';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach JWT from MMKV
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getString('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 globally
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stored credentials on unauthorized
      storage.delete('auth_token');
      storage.delete('auth_user');
      Toast.show({
        type: 'error',
        text1: 'Sesyon ekspire',
        text2: 'Tanpri konekte ankò.',
      });
    }
    return Promise.reject(error);
  },
);

// ─── API helpers ──────────────────────────────────────────────────────────────

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  startTime: string;
  league: string;
  markets: Market[];
}

export interface Market {
  id: string;
  category: string;
  name: string;
  outcomes: Outcome[];
}

export interface Outcome {
  id: string;
  name: string;
  odds: number;
}

export interface Bet {
  id: string;
  status: 'pending' | 'won' | 'lost' | 'cancelled';
  stake: number;
  potentialWin: number;
  placedAt: string;
  selections: BetSelection[];
}

export interface BetSelection {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  outcomeName: string;
  odds: number;
}

export interface WalletData {
  balance: number;
  currency: string;
  transactions: Transaction[];
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'bet' | 'win';
  amount: number;
  description: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
}

// Auth endpoints
export const authApi = {
  login: (phone: string, password: string) =>
    api.post<AuthResponse>('/api/auth/login', { phone, password }),

  register: (name: string, phone: string, password: string) =>
    api.post<AuthResponse>('/api/auth/register', { name, phone, password }),

  verifyOtp: (phone: string, otp: string) =>
    api.post<AuthResponse>('/api/auth/verify-otp', { phone, otp }),
};

// Match endpoints
export const matchApi = {
  getMatches: (upcoming?: boolean) =>
    api.get<Match[]>('/api/matches', { params: { upcoming } }),

  getMatch: (matchId: string) =>
    api.get<Match>(`/api/matches/${matchId}`),
};

// Bet endpoints
export const betApi = {
  placeBet: (selections: { outcomeId: string; odds: number }[], stake: number) =>
    api.post<Bet>('/api/bets', { selections, stake }),

  getBets: () =>
    api.get<Bet[]>('/api/bets'),
};

// Wallet endpoints
export const walletApi = {
  getWallet: () =>
    api.get<WalletData>('/api/wallet'),

  getMonCashUrl: (amount: number) =>
    api.post<{ url: string }>('/api/wallet/deposit/moncash', { amount }),
};

export default api;
