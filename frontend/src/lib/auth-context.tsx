"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  api,
  hydrateAccessToken,
  onUnauthorized,
  refreshSession,
  setAccessToken,
} from "@/lib/api";
import type { TokenResponse, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  status: "loading" | "authenticated" | "anonymous";
  login: (email: string, password: string) => Promise<User>;
  register: (fullName: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Non-sensitive flag: the refresh cookie is httpOnly, so this marker lets the
// app skip a guaranteed-401 refresh call for visitors who never signed in.
const SESSION_MARKER = "trustscan.has_session";

function readSessionMarker(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SESSION_MARKER) === "1";
  } catch {
    return false;
  }
}

function writeSessionMarker(active: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (active) window.localStorage.setItem(SESSION_MARKER, "1");
    else window.localStorage.removeItem(SESSION_MARKER);
  } catch {
    // Storage can be unavailable in private browsing; sessions still work.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const clearSession = useCallback(() => {
    setAccessToken(null);
    writeSessionMarker(false);
    setUser(null);
    setStatus("anonymous");
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      hydrateAccessToken();

      if (!readSessionMarker()) {
        clearSession();
        return;
      }

      const token = await refreshSession();
      if (cancelled) return;

      if (!token) {
        clearSession();
        return;
      }

      try {
        const current = await api.get<User>("/api/v1/auth/me");
        if (cancelled) return;
        setUser(current);
        setStatus("authenticated");
      } catch {
        if (!cancelled) clearSession();
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  useEffect(() => {
    onUnauthorized(() => {
      clearSession();
    });
    return () => onUnauthorized(null);
  }, [clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<TokenResponse>(
      "/api/v1/auth/login",
      { email, password },
      { auth: false },
    );
    setAccessToken(response.access_token);
    writeSessionMarker(true);
    setUser(response.user);
    setStatus("authenticated");
    return response.user;
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      const response = await api.post<TokenResponse>(
        "/api/v1/auth/register",
        { full_name: fullName, email, password },
        { auth: false },
      );
      setAccessToken(response.access_token);
      writeSessionMarker(true);
      setUser(response.user);
      setStatus("authenticated");
      return response.user;
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/api/v1/auth/logout", undefined, { retryOnUnauthorized: false });
    } catch {
      // Local sign-out still proceeds if the API is unreachable.
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const refreshUser = useCallback(async () => {
    const current = await api.get<User>("/api/v1/auth/me");
    setUser(current);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      login,
      register,
      logout,
      updateUser: setUser,
      refreshUser,
    }),
    [user, status, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
