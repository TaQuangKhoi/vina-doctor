"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { useAuth } from "../hooks/useAuth";

export function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) router.replace("/");
  }, [isAuthenticated, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-low px-4">
      <div className="w-full max-w-md rounded-3xl bg-surface-lowest p-10 shadow-[var(--shadow-ambient)]">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-container">
            <svg
              className="h-5 w-5 text-on-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
              />
            </svg>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-on-surface">
              Vina Doctor
            </h2>
            <p className="text-xs text-on-surface-variant">
              Medical Portal
            </p>
          </div>
        </div>

        {mode === "login" ? (
          <LoginForm onSwitch={() => setMode("register")} />
        ) : (
          <RegisterForm onSwitch={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}
