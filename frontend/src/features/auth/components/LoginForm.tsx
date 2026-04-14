"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/shared/components";
import { Input } from "@/shared/components";
import { useAuth } from "../hooks/useAuth";
import type { ApiRequestError } from "@/shared/lib/api-client";

export function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      setError((err as ApiRequestError).message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Welcome back
        </h1>
        <p className="text-sm text-on-surface-variant">
          Sign in to your medical portal
        </p>
      </div>

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="doctor@hospital.vn"
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
        autoComplete="current-password"
      />

      {error && (
        <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-on-surface-variant">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-primary-container hover:underline"
        >
          Register
        </button>
      </p>
    </form>
  );
}
