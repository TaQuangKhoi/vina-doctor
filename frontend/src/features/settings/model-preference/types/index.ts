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
    id: "qwen3-max",
    label: "Qwen3 Max (Flagship)",
    description: "Next-gen flagship with reasoning & tool integration. Best for complex multi-step clinical reasoning.",
    icon: "👑",
  },
  {
    id: "qwen3-max-preview",
    label: "Qwen3 Max Preview",
    description: "Preview version with thinking mode support. Latest improvements.",
    icon: "🔮",
  },
  {
    id: "qwen3-max-2026-01-23",
    label: "Qwen3 Max (2026-01-23)",
    description: "Dated snapshot of Qwen3 Max. Stable for production.",
    icon: "📅",
  },
  {
    id: "qwen3.5-plus",
    label: "Qwen3.5 Plus (Recommended)",
    description: "Balances performance, speed, and cost. Recommended for most clinical analysis scenarios.",
    icon: "⚖️",
  },
  {
    id: "qwen3.5-plus-2026-02-15",
    label: "Qwen3.5 Plus (2026-02-15)",
    description: "Latest snapshot of Qwen3.5 Plus. Stable with newest improvements.",
    icon: "📅",
  },
  {
    id: "qwen-plus",
    label: "Qwen Plus",
    description: "Strong reasoning and language understanding. Good balance of speed and quality.",
    icon: "🔬",
  },
  {
    id: "qwen-plus-latest",
    label: "Qwen Plus Latest",
    description: "Latest version of Qwen Plus model.",
    icon: "🔄",
  },
  {
    id: "qwen3.5-flash",
    label: "Qwen3.5 Flash (Fast)",
    description: "Fast inference with strong reasoning. Cost-effective for routine cases.",
    icon: "⚡",
  },
  {
    id: "qwen3.5-flash-2026-02-23",
    label: "Qwen3.5 Flash (2026-02-23)",
    description: "Latest snapshot of Qwen3.5 Flash. Stable and optimized.",
    icon: "📅",
  },
  {
    id: "qwen-flash",
    label: "Qwen Flash",
    description: "Fast inference. Best for high-volume, straightforward analysis.",
    icon: "🚀",
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
  clinical: "qwen3.5-plus",
} as const;
