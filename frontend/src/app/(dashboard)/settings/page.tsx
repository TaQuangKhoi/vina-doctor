"use client";

import { useState } from "react";
import { Card, Button, Input } from "@/shared/components";
import { useToast } from "@/shared/components/ToastContext";
import { useUpdateApiKey } from "@/features/settings";

const PREFERRED_MODEL_KEY = "preferred_model";
const DEFAULT_MODEL = "qwen3-asr-flash";

const AI_MODELS = [
  {
    id: "qwen3-asr-flash",
    label: "Optimized Speed",
    description: "Real-time transcription for busy walk-ins.",
    icon: "⚡",
  },
  {
    id: "qwen3.5-omni-flash",
    label: "Maximum Accuracy",
    description: "Deep clinical reasoning. Best for complex cases.",
    icon: "🎯",
  },
];

function getStoredModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(PREFERRED_MODEL_KEY) ?? DEFAULT_MODEL;
}

export default function SettingsPage() {
  const { showSuccess, showError } = useToast();
  const { mutate: updateKey, isPending } = useUpdateApiKey();

  const [apiKey, setApiKey] = useState("");
  const [preferredModel, setPreferredModel] = useState<string>(getStoredModel);

  function handleApiKeySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!apiKey.trim()) return;
    updateKey(
      { api_key: apiKey.trim() },
      {
        onSuccess: () => {
          showSuccess("DashScope API key updated successfully.");
          setApiKey("");
        },
        onError: (err) => {
          showError(
            err instanceof Error ? err.message : "Failed to update API key.",
          );
        },
      },
    );
  }

  function handleSavePreferences() {
    localStorage.setItem(PREFERRED_MODEL_KEY, preferredModel);
    showSuccess("Preferences saved.");
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Manage your profile and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">
          Doctor Profile
        </h2>
        <div className="flex flex-col gap-4">
          <Input label="Full Name" placeholder="Dr. Nguyen Van A" />
          <Input label="Specialty" placeholder="General Practice" />
          <Input label="License Number" placeholder="GP-12345" />
        </div>
      </Card>

      {/* Language */}
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">
          Language Defaults
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Primary Dictation Language
            </label>
            <select className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary-container focus:outline-none">
              <option>Vietnamese</option>
              <option>English</option>
              <option>French</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Report Output Language
            </label>
            <select className="w-full rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary-container focus:outline-none">
              <option>Vietnamese</option>
              <option>English</option>
              <option>French</option>
            </select>
          </div>
        </div>
      </Card>

      {/* AI Model Preference */}
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">
          AI Model Preference
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {AI_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPreferredModel(m.id)}
              className={`flex flex-col gap-2 rounded-2xl p-5 text-left transition-all ${
                preferredModel === m.id
                  ? "bg-surface-lowest ring-2 ring-primary-container shadow-[var(--shadow-ambient)]"
                  : "bg-surface-low hover:bg-surface-lowest"
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <p className="text-sm font-semibold text-on-surface">{m.label}</p>
              <p className="text-xs text-on-surface-variant">{m.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* AI Engine API Key */}
      <Card>
        <h2 className="mb-1 font-display text-lg font-semibold text-on-surface">
          AI Engine API Key
        </h2>
        <p className="mb-4 text-sm text-on-surface-variant">
          Update the DashScope API key used by the AI engine. The new key
          takes effect immediately — no restart required.
        </p>
        <form onSubmit={handleApiKeySubmit} className="flex flex-col gap-4">
          <Input
            label="DashScope API Key"
            type="password"
            placeholder="sk-••••••••••••••••"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isPending || !apiKey.trim()}>
              {isPending ? "Saving…" : "Save API Key"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => setPreferredModel(getStoredModel())}>Discard</Button>
        <Button onClick={handleSavePreferences}>Save Changes</Button>
      </div>
    </div>
  );
}
