'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getEnv } from '@/lib/env';
import type { Role, User } from '@/lib/types';

type AuthState = {
  user: User | null;
  accessToken: string | null;
  loading: boolean;
};

type ApiErrorPayload = { error?: { message?: string } };

type ApiFetch = <T>(
  path: string,
  init?: RequestInit,
  opts?: { retryOnUnauthorized?: boolean }
) => Promise<T>;

type AuthContextValue = AuthState & {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  apiFetch: ApiFetch;
  hasRole: (...roles: Role[]) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ACCESS_TOKEN_KEY = 'accessToken';

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as ApiErrorPayload;
    return data?.error?.message || res.statusText;
  } catch {
    return res.statusText;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { apiUrl } = getEnv();

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshingRef = useRef<Promise<string | null> | null>(null);

  const persistAccessToken = useCallback((token: string | null) => {
    setAccessToken(token);
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
      else localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    if (refreshingRef.current) return refreshingRef.current;

    refreshingRef.current = (async () => {
      const res = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) return null;
      const data = (await res.json()) as { accessToken: string };
      persistAccessToken(data.accessToken);
      return data.accessToken;
    })().finally(() => {
      refreshingRef.current = null;
    });

    return refreshingRef.current;
  }, [apiUrl, persistAccessToken]);

  const apiFetch = useCallback<ApiFetch>(
    async (path, init, opts) => {
      const url = path.startsWith('http') ? path : `${apiUrl}${path}`;
      const retryOnUnauthorized = opts?.retryOnUnauthorized ?? true;

      const doFetch = async (token: string | null) => {
        const headers = new Headers(init?.headers || {});
        if (token) headers.set('Authorization', `Bearer ${token}`);
        if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json');

        const res = await fetch(url, {
          ...init,
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const ct = res.headers.get('content-type') || '';
          if (ct.includes('application/json')) return (await res.json()) as any;
          return (await res.text()) as any;
        }

        if (res.status === 401 && retryOnUnauthorized) {
          const newToken = await refresh();
          if (newToken) return doFetch(newToken);
        }

        const message = await readErrorMessage(res);
        throw new Error(message);
      };

      return doFetch(accessToken);
    },
    [accessToken, apiUrl, refresh]
  );

  const fetchMe = useCallback(
    async (token: string) => {
      const res = await fetch(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data = (await res.json()) as { user: User };
      setUser(data.user);
    },
    [apiUrl]
  );

  useEffect(() => {
    const init = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
        if (stored) {
          persistAccessToken(stored);
          try {
            await fetchMe(stored);
          } catch {
            const newToken = await refresh();
            if (newToken) await fetchMe(newToken);
            else {
              persistAccessToken(null);
              setUser(null);
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [fetchMe, persistAccessToken, refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data = (await res.json()) as { user: User; accessToken: string };
      persistAccessToken(data.accessToken);
      setUser(data.user);
    },
    [apiUrl, persistAccessToken]
  );

  const signup = useCallback(
    async (email: string, name: string, password: string) => {
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
        credentials: 'include',
      });

      if (!res.ok) throw new Error(await readErrorMessage(res));
      const data = (await res.json()) as { user: User; accessToken: string };
      persistAccessToken(data.accessToken);
      setUser(data.user);
    },
    [apiUrl, persistAccessToken]
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      persistAccessToken(null);
      setUser(null);
    }
  }, [apiUrl, persistAccessToken]);

  const hasRole = useCallback(
    (...roles: Role[]) => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      login,
      signup,
      logout,
      apiFetch,
      hasRole,
    }),
    [user, accessToken, loading, login, signup, logout, apiFetch, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
