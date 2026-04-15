export type TaskKey = "scribe" | "clinical";

export interface ModelOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface ModelPreferenceConfig {
  scribe: string;
  clinical: string;
}

export const SCRIBE_PRESET_MODELS: readonly ModelOption[] = [
  {
    id: "qwen3-asr-flash",
    label: "ASR Flash (Stable)",
    description: "Realtime + async transcription, audio ≤5 min. Fast and accurate.",
    icon: "⚡",
  },
  {
    id: "qwen3-asr-flash-2026-02-10",
    label: "ASR Flash (Latest Snapshot)",
    description: "Latest snapshot of qwen3-asr-flash with newest improvements.",
    icon: "⚡",
  },
  {
    id: "qwen3-asr-flash-2025-09-08",
    label: "ASR Flash (2025-09-08)",
    description: "Stable snapshot of qwen3-asr-flash from September 2025.",
    icon: "⚡",
  },
  {
    id: "qwen3-asr-flash-realtime",
    label: "ASR Flash Realtime",
    description: "VAD-based streaming transcription. Best for live conversations.",
    icon: "🎙️",
  },
  {
    id: "qwen3-asr-flash-filetrans",
    label: "ASR Flash FileTrans",
    description: "Async long-audio transcription. Supports files up to 12 hours.",
    icon: "📄",
  },
] as const;

export const CLINICAL_PRESET_MODELS: readonly ModelOption[] = [
  {
    id: "qwen3.5-omni-flash",
    label: "Maximum Accuracy",
    description: "Deep clinical reasoning. Best for complex cases.",
    icon: "🎯",
  },
] as const;

export const TASK_LABELS: Record<TaskKey, string> = {
  scribe: "Transcription Model",
  clinical: "Clinical Analysis Model",
} as const;

export const TASK_DESCRIPTIONS: Record<TaskKey, string> = {
  scribe: "Step 3 — audio → transcript",
  clinical: "Step 5 — transcript → medical report",
} as const;

export const DEFAULT_MODELS: Record<TaskKey, string> = {
  scribe: "qwen3-asr-flash",
  clinical: "qwen3.5-omni-flash",
} as const;
