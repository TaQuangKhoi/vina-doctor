import { useMutation } from "@tanstack/react-query";
import { updateDashscopeUrl } from "@/features/settings/api/settings-api";
import type { UpdateDashscopeUrlRequest } from "@/features/settings/types";

export function useUpdateDashscopeUrl() {
  return useMutation({
    mutationFn: (payload: UpdateDashscopeUrlRequest) =>
      updateDashscopeUrl(payload),
  });
}
