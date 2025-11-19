'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createApiClient, loginRequest } from '@/lib/api-client';
import { ApiClient } from '@/lib/api-client';
import { LoginRequest, LoginResponse, User } from '@/lib/types';
import { useServer } from '@/context/server-context';

type PersistMode = 'local' | 'session';

interface AuthContextValue {
  token: string | null;
  user: User | null;
  loading: boolean;
  api: ApiClient | null;
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

interface StoredAuthPayload {
  token: string;
  user: User | null;
  persist: PersistMode;
}

const STORAGE_KEY = 'inventory-manager-auth';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredAuth(): StoredAuthPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const localValue = window.localStorage.getItem(STORAGE_KEY);
  if (localValue) {
    try {
      return JSON.parse(localValue) as StoredAuthPayload;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  const sessionValue = window.sessionStorage.getItem(STORAGE_KEY);
  if (sessionValue) {
    try {
      return JSON.parse(sessionValue) as StoredAuthPayload;
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  return null;
}

function writeStoredAuth(payload: StoredAuthPayload | null, mode: PersistMode) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!payload) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  const target = mode === 'local' ? window.localStorage : window.sessionStorage;
  const other = mode === 'local' ? window.sessionStorage : window.localStorage;

  target.setItem(STORAGE_KEY, JSON.stringify(payload));
  other.removeItem(STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { selectedServer } = useServer();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [persistMode, setPersistMode] = useState<PersistMode>('local');
  const [initialised, setInitialised] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored?.token) {
      setToken(stored.token);
      setUser(stored.user);
      setPersistMode(stored.persist);
    }
    setInitialised(true);
  }, []);

  const api = useMemo(() => (token ? createApiClient(token, selectedServer.url) : null), [token, selectedServer.url]);

  useEffect(() => {
    if (!token || !api || !initialised) {
      setProfileLoading(false);
      return;
    }

    let cancelled = false;
    setProfileLoading(true);
    api
      .getProfile()
      .then((profile) => {
        if (cancelled) return;
        setUser(profile);
        writeStoredAuth({ token, user: profile, persist: persistMode }, persistMode);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Failed to load profile', error);
        setToken(null);
        setUser(null);
        writeStoredAuth(null, persistMode);
      })
      .finally(() => {
        if (!cancelled) {
          setProfileLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api, token, persistMode, initialised]);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const response = await loginRequest(credentials, selectedServer.url);
      const remember = credentials.rememberMe ?? false;
      const mode: PersistMode = remember ? 'local' : 'session';
      setPersistMode(mode);
      setToken(response.token);
      setUser(response.user);
      writeStoredAuth({ token: response.token, user: response.user, persist: mode }, mode);
      return response;
    },
    [selectedServer.url],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    writeStoredAuth(null, persistMode);
  }, [persistMode]);

  const refreshProfile = useCallback(async () => {
    if (!api || !token) {
      return;
    }
    const profile = await api.getProfile();
    setUser(profile);
    writeStoredAuth({ token, user: profile, persist: persistMode }, persistMode);
  }, [api, persistMode, token]);

  const loading = !initialised || profileLoading;

  const value: AuthContextValue = {
    token,
    user,
    loading,
    api,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

