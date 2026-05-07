import { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface OrgData {
  id: string;
  name: string;
  slug: string;
  plan: string;
  ai_calls_limit: number;
  gemini_api_key?: string;
  created_at: string;
  usage?: number;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  org_id?: string;
}

interface AuthState {
  user: UserData | null;
  org: OrgData | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, orgName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string; currentPassword?: string; newPassword?: string }) => Promise<void>;
  refreshOrg: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, org: null, loading: true });

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const { user, org } = await res.json();
        setState({ user, org, loading: false });
      } else {
        setState({ user: null, org: null, loading: false });
      }
    } catch {
      setState({ user: null, org: null, loading: false });
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Login failed');
    }
    const { user, org } = await res.json();
    setState({ user, org, loading: false });
  };

  const register = async (name: string, email: string, password: string, orgName: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, email, password, orgName }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Registration failed');
    }
    const { user, org } = await res.json();
    setState({ user, org, loading: false });
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setState({ user: null, org: null, loading: false });
  };

  const updateProfile = async (data: Record<string, string>) => {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Update failed');
    }
    const updated = await res.json();
    setState(prev => ({ ...prev, user: { ...prev.user!, ...updated } }));
  };

  const refreshOrg = async () => {
    const res = await fetch('/api/orgs/current', { credentials: 'include' });
    if (res.ok) {
      const org = await res.json();
      setState(prev => ({ ...prev, org }));
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile, refreshOrg }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
