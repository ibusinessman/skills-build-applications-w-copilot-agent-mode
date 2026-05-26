import { create } from 'zustand';
import { storage } from '@/lib/api';

interface User {
  id: string;
  name: string;
  phone: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (token: string, user: User) => {
    // Persist to MMKV
    storage.set('auth_token', token);
    storage.set('auth_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    storage.delete('auth_token');
    storage.delete('auth_user');
    set({ token: null, user: null, isAuthenticated: false });
  },

  hydrate: () => {
    const token = storage.getString('auth_token');
    const userRaw = storage.getString('auth_user');
    if (token && userRaw) {
      try {
        const user: User = JSON.parse(userRaw);
        set({ token, user, isAuthenticated: true });
      } catch {
        // Corrupted data — clear it
        storage.delete('auth_token');
        storage.delete('auth_user');
      }
    }
  },
}));

// Hydrate on module load so state is ready before first render
useAuthStore.getState().hydrate();
