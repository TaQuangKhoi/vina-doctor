import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateModel } from "@/features/settings/api/settings-api";
import type { TaskKey } from "@/features/settings/model-preference/types";
import type { UpdateModelRequest } from "@/features/settings/types";

export interface UseModelPreferenceOptions {
  task: TaskKey;
  remoteValue: string | undefined;
  onSuccess: () => void;
  onError: (error: unknown) => void;
}

export function useModelPreference({
  task,
  remoteValue,
  onSuccess,
  onError,
}: UseModelPreferenceOptions) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (payload: UpdateModelRequest) => updateModel(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-config"] });
      onSuccess();
    },
    onError,
  });

  const save = useCallback(
    (modelId: string) => {
      if (!modelId.trim()) return;
      mutation.mutate({ task, model_id: modelId.trim() });
    },
    [mutation, task],
  );

  return {
    save,
    isPending: mutation.isPending,
    effectiveValue: remoteValue,
  };
}
