import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserProfile } from "@/features/settings/api/settings-api";
import type { UserProfileUpdateRequest } from "@/shared/types/api";

export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserProfileUpdateRequest) => updateUserProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    },
  });
}
