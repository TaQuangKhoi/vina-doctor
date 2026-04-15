"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { setAuthToken } from "@/shared/lib/api-client";
import type { LoginCredentials, RegisterCredentials } from "../types";
import { loginApi, registerApi } from "../api/auth-api";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "vd_token";

function setTokenCookie(token: string | null) {
  if (typeof document === "undefined") return;
  if (token) {
    document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax`;
  } else {
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem(TOKEN_KEY);
    if (stored) {
      setTokenCookie(stored);
      setAuthToken(stored);
    }
    return stored;
  });

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<boolean> => {
      const res = await loginApi(credentials);
      const t = res.access_token;
      setToken(t);
      setAuthToken(t);
      setTokenCookie(t);
      sessionStorage.setItem(TOKEN_KEY, t);
      return true;
    },
    [],
  );

  const register = useCallback(
    async (credentials: RegisterCredentials): Promise<boolean> => {
      const res = await registerApi(credentials);
      const t = res.access_token;
      setToken(t);
      setAuthToken(t);
      setTokenCookie(t);
      sessionStorage.setItem(TOKEN_KEY, t);
      return true;
    },
    [],
  );

  const logout = useCallback(() => {
    setToken(null);
    setAuthToken(null);
    setTokenCookie(null);
    sessionStorage.removeItem(TOKEN_KEY);
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ token, isAuthenticated: !!token, login, register, logout }),
    [token, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
