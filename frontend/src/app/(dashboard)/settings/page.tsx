"use client";

import { useState } from "react";
import { Card, Button, Input } from "@/shared/components";
import { useToast } from "@/shared/components/ToastContext";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  useUpdateApiKey,
  useUpdateDashscopeUrl,
  useAdminConfig,
  useUserProfile,
  useUpdateUserProfile,
  useUpdateIcd10Enrich,
  ModelPreferenceCard,
} from "@/features/settings";

const DEFAULT_DASHSCOPE_URL = "https://dashscope-intl.aliyuncs.com/api/v1";

const LANGUAGES = [
  { value: "vi", label: "Vietnamese" },
  { value: "en", label: "English" },
  { value: "fr", label: "French" },
] as const;

export default function SettingsPage() {
  const { showSuccess, showError } = useToast();

  const { mutate: updateKey, isPending: isKeyPending } = useUpdateApiKey();
  const { mutate: updateUrl, isPending: isUrlPending } = useUpdateDashscopeUrl();
  const { mutate: updateIcd10Enrich, isPending: isIcd10Pending } = useUpdateIcd10Enrich();
  const { data: remoteConfig, isLoading: isConfigLoading } = useAdminConfig();

  // ── Doctor Profile ──────────────────────────────────────────────────────────
  const { data: profile, isLoading: isProfileLoading } = useUserProfile();
  const { mutate: updateProfile, isPending: isProfilePending } = useUpdateUserProfile();

  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");

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
  const [baseUrlDraft, setBaseUrlDraft] = useState<string | null>(null);
  const effectiveBaseUrl =
    baseUrlDraft ?? remoteConfig?.dashscope_base_url ?? DEFAULT_DASHSCOPE_URL;

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
      <div>
        <h1 className="font-display text-xl font-bold text-on-surface sm:text-2xl lg:text-3xl">
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
            <Combobox
              items={LANGUAGES}
              defaultValue={LANGUAGES[0]}
              itemToStringValue={(item) => item.label}
            >
              <ComboboxTrigger
                render={
                  <button className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary-container focus:outline-none" />
                }
              >
                <ComboboxValue />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxInput showTrigger={false} placeholder="Search language…" />
                <ComboboxEmpty>No language found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-on-surface-variant">
              Report Output Language
            </label>
            <Combobox
              items={LANGUAGES}
              defaultValue={LANGUAGES[0]}
              itemToStringValue={(item) => item.label}
            >
              <ComboboxTrigger
                render={
                  <button className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary-container focus:outline-none" />
                }
              >
                <ComboboxValue />
              </ComboboxTrigger>
              <ComboboxContent>
                <ComboboxInput showTrigger={false} placeholder="Search language…" />
                <ComboboxEmpty>No language found.</ComboboxEmpty>
                <ComboboxList>
                  {(item) => (
                    <ComboboxItem key={item.value} value={item}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </div>
      </Card>

      {/* AI Model Preference */}
      <Card>
        <h2 className="mb-6 font-display text-lg font-semibold text-on-surface">
          AI Model Preference
        </h2>
        <div className="flex flex-col gap-8">
          <ModelPreferenceCard
            task="scribe"
            remoteValue={remoteConfig?.models?.scribe}
            isConfigLoading={isConfigLoading}
          />
          <hr className="border-outline-variant" />
          <ModelPreferenceCard
            task="clinical"
            remoteValue={remoteConfig?.models?.clinical}
            isConfigLoading={isConfigLoading}
          />
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

        <hr className="border-outline-variant" />

        {/* ICD-10 enrichment toggle */}
        <div className="mt-6 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-on-surface">
              ICD-10 Context Injection
            </label>
            <p className="text-xs text-on-surface-variant">
              Inject relevant ICD-10 treatment references into the Clinical Agent
              prompt. The agent selects 1–3 codes from a built-in catalogue.
              Changes take effect immediately — no restart required.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={remoteConfig?.icd10_enrich_enabled ?? false}
            onClick={() => {
              const newEnabled = !remoteConfig?.icd10_enrich_enabled;
              updateIcd10Enrich(
                { enabled: newEnabled },
                {
                  onSuccess: () =>
                    showSuccess(
                      `ICD-10 enrichment ${newEnabled ? "enabled" : "disabled"}.`,
                    ),
                  onError: (err) =>
                    showError(
                      err instanceof Error
                        ? err.message
                        : "Failed to update ICD-10 enrichment setting.",
                    ),
                },
              );
            }}
            disabled={isIcd10Pending}
            className={`mt-0.5 relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
              remoteConfig?.icd10_enrich_enabled
                ? "bg-primary-container"
                : "bg-outline-variant"
            } ${isIcd10Pending ? "opacity-50" : ""}`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-on-primary-container transition-transform duration-200 ${
                remoteConfig?.icd10_enrich_enabled
                  ? "left-auto right-1"
                  : "left-1 right-auto"
              }`}
            />
          </button>
        </div>
      </Card>
    </div>
  );
}
