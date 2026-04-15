"use client";

import { useState } from "react";
import { Card, Button, Input } from "@/shared/components";
import { useToast } from "@/shared/components/ToastContext";
import {
  useUpdateApiKey,
  useUpdateDashscopeUrl,
  useUpdateModel,
  useAdminConfig,
  useUserProfile,
  useUpdateUserProfile,
} from "@/features/settings";

const PREFERRED_MODEL_KEY = "preferred_model";
const DEFAULT_MODEL = "qwen3-asr-flash";
const DEFAULT_DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";

const PRESET_MODELS = [
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

  const { mutate: updateKey, isPending: isKeyPending } = useUpdateApiKey();
  const { mutate: updateUrl, isPending: isUrlPending } = useUpdateDashscopeUrl();
  const { mutate: updateModel, isPending: isModelPending } = useUpdateModel();
  const { data: remoteConfig, isLoading: isConfigLoading } = useAdminConfig();

  // ── Doctor Profile ──────────────────────────────────────────────────────────
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { mutate: updateProfile, isPending: isProfilePending } = useUpdateUserProfile();

  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");

  // Sync local state with fetched profile once loaded
  if (profile && fullName === "" && specialty === "" && licenseNumber === "" && phone === "") {
    setFullName(profile.full_name);
    setSpecialty(profile.specialty);
    setLicenseNumber(profile.license_number);
    setPhone(profile.phone);
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateProfile(
      { full_name: fullName, specialty, license_number: licenseNumber, phone },
      {
        onSuccess: () => showSuccess("Doctor profile saved."),
        onError: (err) =>
          showError(err instanceof Error ? err.message : "Failed to save profile."),
      },
    );
  }

  // ── API Key ──────────────────────────────────────────────────────────────
  const [apiKey, setApiKey] = useState("");

  // ── DashScope base URL ───────────────────────────────────────────────────
  // Null means "no local edit yet" — the effective value falls back to remote.
  const [baseUrlDraft, setBaseUrlDraft] = useState<string | null>(null);
  const effectiveBaseUrl =
    baseUrlDraft ?? remoteConfig?.dashscope_base_url ?? DEFAULT_DASHSCOPE_URL;

  // ── Model (scribe task) ──────────────────────────────────────────────────
  // Same pattern: null = no local edit, fall back to remote config then localStorage.
  const [preferredModelDraft, setPreferredModelDraft] = useState<string | null>(null);
  const remoteScribeModel = remoteConfig?.models?.scribe;
  const effectiveModel =
    preferredModelDraft ?? remoteScribeModel ?? getStoredModel();

  const [customModelId, setCustomModelId] = useState("");

  // ── Handlers ─────────────────────────────────────────────────────────────

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

  function handleBaseUrlSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = effectiveBaseUrl.trim();
    if (!url) return;
    updateUrl(
      { base_url: url },
      {
        onSuccess: () => showSuccess("DashScope base URL updated successfully."),
        onError: (err) => {
          showError(
            err instanceof Error ? err.message : "Failed to update base URL.",
          );
        },
      },
    );
  }

  function handlePresetModelClick(modelId: string) {
    setPreferredModelDraft(modelId);
    setCustomModelId("");
  }

  function handleCustomModelChange(value: string) {
    setCustomModelId(value);
    if (value.trim()) {
      setPreferredModelDraft(value.trim());
    }
  }

  function handleSaveModel() {
    const modelId = effectiveModel.trim();
    if (!modelId) return;

    // Persist to localStorage immediately (used by NewConsultationPage)
    localStorage.setItem(PREFERRED_MODEL_KEY, modelId);

    // Persist both scribe and asr tasks (they share the same user-selected model)
    const tasks = ["scribe", "asr"];
    let completed = 0;

    function onDone() {
      completed += 1;
      if (completed === tasks.length) {
        showSuccess("Model preference saved.");
      }
    }

    tasks.forEach((task) => {
      updateModel(
        { task, model_id: modelId },
        {
          onSuccess: onDone,
          onError: (err) => {
            showError(
              err instanceof Error
                ? err.message
                : `Failed to update model for ${task}.`,
            );
          },
        },
      );
    });
  }

  const isPresetSelected = PRESET_MODELS.some((m) => m.id === effectiveModel);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Manage your profile and preferences.
        </p>
      </div>

      {/* Doctor Profile */}
      <Card>
        <h2 className="mb-4 font-display text-lg font-semibold text-on-surface">
          Doctor Profile
        </h2>
        {isProfileLoading ? (
          <p className="text-sm text-on-surface-variant">Loading profile…</p>
        ) : (
          <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              placeholder="Dr. Nguyen Van A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <Input
              label="Specialty"
              placeholder="General Practice"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
            <Input
              label="License Number"
              placeholder="GP-12345"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
            />
            <Input
              label="Phone"
              placeholder="+84 90 123 4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isProfilePending}>
                {isProfilePending ? "Saving…" : "Save Profile"}
              </Button>
            </div>
          </form>
        )}
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
        <h2 className="mb-1 font-display text-lg font-semibold text-on-surface">
          AI Model Preference
        </h2>
        <p className="mb-4 text-sm text-on-surface-variant">
          {isConfigLoading
            ? "Loading current model from server…"
            : "Select a preset or enter a custom DashScope model ID. Saved to the engine immediately."}
        </p>

        {/* Preset cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRESET_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => handlePresetModelClick(m.id)}
              className={`flex flex-col gap-2 rounded-2xl p-5 text-left transition-all ${
                effectiveModel === m.id
                  ? "bg-surface-lowest ring-2 ring-primary-container shadow-[var(--shadow-ambient)]"
                  : "bg-surface-low hover:bg-surface-lowest"
              }`}
            >
              <span className="text-2xl">{m.icon}</span>
              <p className="text-sm font-semibold text-on-surface">{m.label}</p>
              <p className="text-xs text-on-surface-variant">{m.description}</p>
              <p className="mt-1 font-mono text-xs text-on-surface-variant opacity-70">
                {m.id}
              </p>
            </button>
          ))}
        </div>

        {/* Custom model ID */}
        <div className="mt-4">
          <Input
            label="Custom Model ID (optional)"
            placeholder="e.g. qwen3-asr-turbo"
            value={customModelId}
            onChange={(e) => handleCustomModelChange(e.target.value)}
          />
          {!isPresetSelected && effectiveModel && (
            <p className="mt-1 text-xs text-on-surface-variant">
              Active: <span className="font-mono">{effectiveModel}</span>
            </p>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSaveModel}
            disabled={isModelPending || !effectiveModel.trim()}
          >
            {isModelPending ? "Saving…" : "Save Model"}
          </Button>
        </div>
      </Card>

      {/* AI Engine Configuration */}
      <Card>
        <h2 className="mb-1 font-display text-lg font-semibold text-on-surface">
          AI Engine Configuration
        </h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          Runtime settings for the AI engine. Changes take effect immediately —
          no restart required.
        </p>

        {/* DashScope base URL */}
        <form onSubmit={handleBaseUrlSubmit} className="mb-6 flex flex-col gap-4">
          <Input
            label="DashScope Base URL"
            placeholder={DEFAULT_DASHSCOPE_URL}
            value={effectiveBaseUrl}
            onChange={(e) => setBaseUrlDraft(e.target.value)}
          />
          <p className="text-xs text-on-surface-variant">
            International:{" "}
            <span className="font-mono">
              https://dashscope-intl.aliyuncs.com/api/v1
            </span>
            {"  |  "}
            CN:{" "}
            <span className="font-mono">
              https://dashscope.aliyuncs.com/api/v1
            </span>
          </p>
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isUrlPending || !effectiveBaseUrl.trim()}
            >
              {isUrlPending ? "Saving…" : "Save URL"}
            </Button>
          </div>
        </form>

        <hr className="border-outline-variant" />

        {/* DashScope API key */}
        <form onSubmit={handleApiKeySubmit} className="mt-6 flex flex-col gap-4">
          <Input
            label="DashScope API Key"
            type="password"
            placeholder="sk-••••••••••••••••"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={isKeyPending || !apiKey.trim()}>
              {isKeyPending ? "Saving…" : "Save API Key"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
