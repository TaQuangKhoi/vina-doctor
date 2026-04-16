"use client";

import { useState, useCallback } from "react";
import {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxContent,
  ComboboxInput,
  ComboboxEmpty,
  ComboboxList,
  ComboboxItem,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { useModelPreference } from "@/features/settings/model-preference/hooks/useModelPreference";
import {
  SCRIBE_PRESET_MODELS,
  CLINICAL_PRESET_MODELS,
  TASK_LABELS,
  TASK_DESCRIPTIONS,
  type TaskKey,
  type ModelOption,
} from "@/features/settings/model-preference/types";

export interface ModelPreferenceCardProps {
  task: TaskKey;
  remoteValue: string | undefined;
  isConfigLoading: boolean;
}

type ComboboxModelItem =
  | { type: "preset"; model: ModelOption }
  | { type: "custom" };

function buildItems(task: TaskKey): ComboboxModelItem[] {
  const presets =
    task === "scribe" ? SCRIBE_PRESET_MODELS : CLINICAL_PRESET_MODELS;
  return [
    ...presets.map((model): ComboboxModelItem => ({ type: "preset", model })),
    { type: "custom" },
  ];
}

function itemToStringValue(item: ComboboxModelItem): string {
  if (item.type === "preset") return item.model.label;
  return "Custom Model…";
}



function findDefaultItem(
  items: ComboboxModelItem[],
  remoteValue: string | undefined,
): ComboboxModelItem | null {
  if (!remoteValue) return null;
  return (
    items.find(
      (item) => item.type === "preset" && item.model.id === remoteValue,
    ) ?? null
  );
}

export function ModelPreferenceCard({
  task,
  remoteValue,
  isConfigLoading,
}: ModelPreferenceCardProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customId, setCustomId] = useState("");

  const items = buildItems(task);
  const defaultItem = findDefaultItem(items, remoteValue);

  const { save, isPending } = useModelPreference({
    task,
    remoteValue,
    onSuccess: () => {
      setCustomId("");
      setShowCustomInput(false);
    },
    onError: () => {},
  });

  const handleValueChange = useCallback(
    (item: ComboboxModelItem | null) => {
      if (!item) return;
      if (item.type === "preset") {
        save(item.model.id);
      } else {
        setShowCustomInput(true);
      }
    },
    [save],
  );

  const handleCustomSave = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      save(trimmed);
    },
    [save],
  );

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="text-sm font-semibold text-on-surface">
          {TASK_LABELS[task]}
        </h3>
        <p className="text-xs text-on-surface-variant">
          {isConfigLoading
            ? "Loading current model from server…"
            : TASK_DESCRIPTIONS[task]}
        </p>
      </div>

      <Combobox<ComboboxModelItem>
        items={items}
        defaultValue={defaultItem}
        itemToStringValue={itemToStringValue}
        onValueChange={handleValueChange}
        disabled={isPending || isConfigLoading}
      >
        <ComboboxTrigger
          render={
            <button
              type="button"
              disabled={isPending || isConfigLoading}
              className="flex w-full items-center justify-between rounded-xl border border-outline-variant bg-surface-lowest px-4 py-2.5 text-sm text-on-surface focus:border-primary-container focus:outline-none disabled:opacity-50"
            />
          }
        >
          <ComboboxValue />
        </ComboboxTrigger>
        <ComboboxContent>
          <ComboboxInput showTrigger={false} placeholder="Search models…" />
          <ComboboxEmpty>No model found.</ComboboxEmpty>
          <ComboboxList>
            {(item) => (
              <ComboboxItem key={itemToStringValue(item)} value={item}>
                {item.type === "preset" ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-on-surface">
                      {item.model.label}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {item.model.description}
                    </span>
                    <span className="text-xs font-mono text-on-surface-variant/60">
                      {item.model.id}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-on-surface-variant">Custom Model…</span>
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      {showCustomInput && (
        <div className="flex flex-col gap-1.5">
          <Input
            placeholder="e.g. qwen3-asr-turbo"
            value={customId}
            onChange={(e) => setCustomId(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCustomSave(customId);
              }
            }}
            onBlur={() => {
              if (customId.trim()) handleCustomSave(customId);
            }}
            disabled={isPending}
          />
          {customId.trim() && !defaultItem && (
            <p className="text-xs text-on-surface-variant">
              Active: <span className="font-mono">{customId.trim()}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}