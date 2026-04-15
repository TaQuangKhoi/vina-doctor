import { useMutation } from "@tanstack/react-query";
import { updateModel } from "@/features/settings/api/settings-api";
import type { UpdateModelRequest } from "@/features/settings/types";

export function useUpdateModel() {
  return useMutation({
    mutationFn: (payload: UpdateModelRequest) => updateModel(payload),
  });
}
