"use client";

import { useState, useCallback } from "react";
import { Button, Input } from "@/shared/components";
import { useToast } from "@/shared/components/ToastContext";
import {
  SCRIBE_PRESET_MODELS,
  CLINICAL_PRESET_MODELS,
  TASK_LABELS,
  TASK_DESCRIPTIONS,
  DEFAULT_MODELS,
  type TaskKey,
} from "@/features/settings/model-preference/types";
import { useModelPreference } from "@/features/settings/model-preference/hooks/useModelPreference";

export interface ModelPreferenceCardProps {
  task: TaskKey;
  remoteValue: string | undefined;
  isConfigLoading: boolean;
}

export function ModelPreferenceCard({
  task,
  remoteValue,
  isConfigLoading,
}: ModelPreferenceCardProps) {
  const { showSuccess, showError } = useToast();

  const [draft, setDraft] = useState<string | null>(null);
  const [customId, setCustomId] = useState("");

  const effectiveValue = draft ?? remoteValue ?? DEFAULT_MODELS[task];

  const handlePresetClick = useCallback((modelId: string) => {
    setDraft(modelId);
    setCustomId("");
  }, []);

  const handleCustomChange = useCallback((value: string) => {
    setCustomId(value);
    if (value.trim()) {
      setDraft(value.trim());
    }
  }, []);

  const { save, isPending } = useModelPreference({
    task,
    remoteValue,
    onSuccess: () => {
      showSuccess(`${TASK_LABELS[task]} saved.`);
      setDraft(null);
    },
    onError: (err) => {
      showError(
        err instanceof Error ? err.message : `Failed to update ${TASK_LABELS[task]}.`,
      );
    },
  });

  const handleSave = useCallback(() => {
    const modelId = effectiveValue.trim();
    if (!modelId) return;
    save(modelId);
  }, [effectiveValue, save]);

  const presets = task === "scribe" ? SCRIBE_PRESET_MODELS : CLINICAL_PRESET_MODELS;
  const isPresetSelected = presets.some((m) => m.id === effectiveValue);

  const taskLabel = TASK_LABELS[task];
  const taskDescription = TASK_DESCRIPTIONS[task];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-on-surface">{taskLabel}</h3>
        <p className="text-xs text-on-surface-variant">
          {isConfigLoading
            ? "Loading current model from server…"
            : taskDescription}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {presets.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => handlePresetClick(m.id)}
            className={`flex flex-col gap-1.5 rounded-xl p-4 text-left transition-all ${
              effectiveValue === m.id
                ? "bg-surface-lowest ring-2 ring-primary-container shadow-[var(--shadow-ambient)]"
                : "bg-surface-low hover:bg-surface-lowest"
            }`}
          >
            <span className="text-xl">{m.icon}</span>
            <p className="text-sm font-semibold text-on-surface">{m.label}</p>
            <p className="text-xs text-on-surface-variant">{m.description}</p>
            <p className="mt-0.5 font-mono text-xs text-on-surface-variant opacity-70">
              {m.id}
            </p>
          </button>
        ))}
      </div>

      <div>
        <Input
          label="Custom Model ID (optional)"
          placeholder="e.g. qwen3-asr-turbo"
          value={customId}
          onChange={(e) => handleCustomChange(e.target.value)}
        />
        {!isPresetSelected && effectiveValue && (
          <p className="mt-1 text-xs text-on-surface-variant">
            Active: <span className="font-mono">{effectiveValue}</span>
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isPending || !effectiveValue.trim()}
        >
          {isPending ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
