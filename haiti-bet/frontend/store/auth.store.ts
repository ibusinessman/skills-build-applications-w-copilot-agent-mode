import { create } from 'zustand';

interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  balance: number;
  isAdmin: boolean;
  status: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateBalance: (balance: number) => void;
  setLoading: (v: boolean) => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: (token, user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('haitibet_token', token);
      localStorage.setItem('haitibet_user', JSON.stringify(user));
    }
    set({ token, user, isLoading: false });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('haitibet_token');
      localStorage.removeItem('haitibet_user');
    }
    set({ token: null, user: null });
  },

  updateBalance: (balance) => {
    set((state) => ({
      user: state.user ? { ...state.user, balance } : null,
    }));
  },

  setLoading: (v) => set({ isLoading: v }),

  loadFromStorage: () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('haitibet_token');
    const userStr = localStorage.getItem('haitibet_user');
    if (token && userStr) {
      try {
        set({ token, user: JSON.parse(userStr), isLoading: false });
      } catch {
        set({ isLoading: false });
      }
    } else {
      set({ isLoading: false });
    }
  },
}));
