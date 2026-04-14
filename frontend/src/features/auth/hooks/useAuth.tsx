"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { setAuthToken } from "@/shared/lib/api-client";
import type { LoginCredentials, RegisterCredentials } from "../types";
import { loginApi, registerApi } from "../api/auth-api";

interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "vd_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(TOKEN_KEY);
  });

  useEffect(() => {
    setAuthToken(token);
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }, [token]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const res = await loginApi(credentials);
    setToken(res.access_token);
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const res = await registerApi(credentials);
    setToken(res.access_token);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
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
