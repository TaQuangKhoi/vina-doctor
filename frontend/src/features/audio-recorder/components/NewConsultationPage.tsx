"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/shared/components";
import { AudioUploadZone } from "./AudioUploadZone";
import { useAudioUpload } from "../hooks/useAudioUpload";

const MODELS = [
  {
    id: "qwen3-asr-flash",
    label: "Optimized Speed",
    description: "Real-time transcription for busy walk-ins. Low latency response.",
    icon: "⚡",
  },
  {
    id: "qwen3.5-omni-flash",
    label: "Maximum Accuracy",
    description: "Deep clinical reasoning. Best for complex diagnostic recordings.",
    icon: "🎯",
  },
];

const PREFERRED_MODEL_KEY = "preferred_model";
const DEFAULT_MODEL = "qwen3-asr-flash";

function getInitialModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL;
  return localStorage.getItem(PREFERRED_MODEL_KEY) ?? DEFAULT_MODEL;
}

export function NewConsultationPage() {
  const router = useRouter();
  const upload = useAudioUpload();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [model, setModel] = useState<string>(getInitialModel);

  async function handleSubmit() {
    if (!selectedFile) return;
    const result = await upload.mutateAsync({ file: selectedFile, model });
    router.push(`/consultations/${result.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-on-surface sm:text-3xl">
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

      {/* Model Selection */}
      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          AI Model Preference
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setModel(m.id)}
              className={`flex flex-col gap-2 rounded-2xl p-5 text-left transition-all ${
                model === m.id
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
