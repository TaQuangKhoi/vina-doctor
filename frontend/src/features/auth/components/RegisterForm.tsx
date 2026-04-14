"use client";

import { useState, type FormEvent } from "react";
import { Button, Input } from "@/shared/components";
import { useAuth } from "../hooks/useAuth";
import type { ApiRequestError } from "@/shared/lib/api-client";

export function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register({ email, password, full_name: fullName });
    } catch (err) {
      setError((err as ApiRequestError).message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold text-on-surface">
          Create account
        </h1>
        <p className="text-sm text-on-surface-variant">
          Register to start using AI Scribe
        </p>
      </div>

      <Input
        label="Full Name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Dr. Nguyen Van A"
        required
        autoComplete="name"
      />

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
        minLength={8}
        autoComplete="new-password"
      />

      {error && (
        <p className="rounded-lg bg-error-container px-3 py-2 text-sm text-on-error-container">
          {error}
        </p>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Creating account…" : "Create Account"}
      </Button>

      <p className="text-center text-sm text-on-surface-variant">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          className="font-semibold text-primary-container hover:underline"
        >
          Sign In
        </button>
      </p>
    </form>
  );
}
