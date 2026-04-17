import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { fetchCurrentUser, loginWithApi, registerWithApi } from '../../lib/auth-api';
import { patchProfile } from '../../lib/instagram-api';
import type { User } from '../../types';

const STORAGE_KEY = 'ig_clone_demo_auth';

type AuthState = {
  user: User;
  token: string;
};

type AuthContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, username: string, password: string, fullName: string) => Promise<User>;
  logout: () => void;
  /** 최신 프로필을 가져와 저장합니다. 실패 시 null, 비로그인 시 null */
  refreshUser: () => Promise<User | null>;
  updateProfile: (patch: Partial<Pick<User, 'fullName' | 'bio' | 'avatarUrl' | 'website' | 'email'>>) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): AuthState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthState;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState | null>(() => loadStored());

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginWithApi(email, password);
    const user = await fetchCurrentUser(data.access_token);
    const next: AuthState = { user, token: data.access_token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setState(next);
    return user;
  }, []);

  const register = useCallback(
    async (email: string, username: string, password: string, fullName: string) => {
      const data = await registerWithApi(email, username, password, fullName);
      const user = await fetchCurrentUser(data.access_token);
      const next: AuthState = { user, token: data.access_token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setState(next);
      return user;
    },
    [],
  );

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(null);
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!state?.token) return null;
    try {
      const user = await fetchCurrentUser(state.token);
      setState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, user };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
      return user;
    } catch {
      return null;
    }
  }, [state?.token]);

  const updateProfile = useCallback(
    async (patch: Partial<Pick<User, 'fullName' | 'bio' | 'avatarUrl' | 'website' | 'email'>>) => {
      if (!state?.token) return;
      const body: {
        full_name?: string | null;
        bio?: string | null;
        avatar_url?: string | null;
        website?: string | null;
        email?: string | null;
      } = {};
      if (patch.fullName !== undefined) body.full_name = patch.fullName;
      if (patch.bio !== undefined) body.bio = patch.bio ?? null;
      if (patch.avatarUrl !== undefined) body.avatar_url = patch.avatarUrl ?? null;
      if (patch.website !== undefined) body.website = patch.website?.trim() || null;
      if (patch.email !== undefined) body.email = patch.email?.trim() || null;
      const user = await patchProfile(state.token, body);
      setState((prev) => {
        if (!prev) return prev;
        const next = { ...prev, user };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    [state?.token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: state?.user ?? null,
      token: state?.token ?? null,
      isAuthenticated: Boolean(state?.token),
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
    }),
    [state, login, register, logout, refreshUser, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.');
  return ctx;
}
