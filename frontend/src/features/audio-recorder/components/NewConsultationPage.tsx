"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/shared/components";
import { AudioUploadZone } from "./AudioUploadZone";
import { useAudioUpload } from "../hooks/useAudioUpload";
import {
  useAdminConfig,
  SCRIBE_PRESET_MODELS,
  CLINICAL_PRESET_MODELS,
  DEFAULT_MODELS,
} from "@/features/settings";

function resolveModelLabel(
  modelId: string | undefined,
  presets: readonly { id: string; label: string }[],
  fallbackId: string,
): { id: string; label: string } {
  const id = modelId ?? fallbackId;
  const preset = presets.find((m) => m.id === id);
  return { id, label: preset?.label ?? id };
}

export function NewConsultationPage() {
  const router = useRouter();
  const upload = useAudioUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { data: config, isLoading: isConfigLoading } = useAdminConfig();

  const scribe = resolveModelLabel(
    config?.models?.scribe,
    SCRIBE_PRESET_MODELS,
    DEFAULT_MODELS.scribe,
  );
  const clinical = resolveModelLabel(
    config?.models?.clinical,
    CLINICAL_PRESET_MODELS,
    DEFAULT_MODELS.clinical,
  );

  async function handleSubmit() {
    if (!selectedFile) return;
    const result = await upload.mutateAsync({ file: selectedFile });
    router.push(`/consultations/${result.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl">
      <div>
        <h1 className="font-display text-xl font-bold text-on-surface sm:text-2xl lg:text-3xl">
          New Consultation
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Upload an audio recording to generate AI-powered clinical notes.
        </p>
      </div>

      {/* Upload Zone */}
      <AudioUploadZone
        onFileSelected={setSelectedFile}
        disabled={upload.isPending}
      />

      {selectedFile && (
        <Card className="flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-container/15">
            <svg
              className="h-5 w-5 text-primary-container"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-on-surface">
              {selectedFile.name}
            </p>
            <p className="text-xs text-on-surface-variant">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-on-surface-variant hover:text-error"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </Card>
      )}

      {/* AI Models Info */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          AI Models
        </h2>
        <Card className="flex flex-col gap-3 sm:flex-row sm:gap-0 sm:divide-x sm:divide-outline-variant">
          {isConfigLoading ? (
            <div className="flex flex-1 items-center gap-3 px-4 py-3">
              <div className="h-8 w-8 animate-pulse rounded-lg bg-surface-low" />
              <div className="flex flex-col gap-1.5">
                <div className="h-3 w-24 animate-pulse rounded bg-surface-low" />
                <div className="h-2.5 w-32 animate-pulse rounded bg-surface-low" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-1 items-start gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-base">
                  ⚡
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-on-surface-variant">Transcription</p>
                  <p className="truncate text-sm font-semibold text-on-surface">{scribe.label}</p>
                  <p className="truncate font-mono text-xs text-on-surface-variant/60">{scribe.id}</p>
                </div>
              </div>
              <div className="flex flex-1 items-start gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-container/10 text-base">
                  🩺
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-on-surface-variant">Clinical Analysis</p>
                  <p className="truncate text-sm font-semibold text-on-surface">{clinical.label}</p>
                  <p className="truncate font-mono text-xs text-on-surface-variant/60">{clinical.id}</p>
                </div>
              </div>
            </>
          )}
        </Card>
        <p className="mt-2 text-xs text-on-surface-variant/60">
          Configured in{" "}
          <a href="/settings" className="underline hover:text-on-surface-variant">
            Settings
          </a>
        </p>
      </div>

      {/* Submit */}
      {upload.isError && (
        <p className="rounded-lg bg-error-container px-4 py-3 text-sm text-on-error-container">
          Upload failed: {upload.error.message}
        </p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!selectedFile || upload.isPending}
        className="w-full"
      >
        {upload.isPending ? "Processing…" : "Upload & Generate Notes"}
      </Button>
    </div>
  );
}
