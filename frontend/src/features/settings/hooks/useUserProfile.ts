import { useQuery } from "@tanstack/react-query";
import { getUserProfile } from "@/features/settings/api/settings-api";

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: getUserProfile,
    staleTime: 60_000,
  });
}
