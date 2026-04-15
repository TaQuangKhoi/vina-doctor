import { useQuery } from "@tanstack/react-query";
import { getAdminConfig } from "@/features/settings/api/settings-api";

export function useAdminConfig() {
  return useQuery({
    queryKey: ["admin-config"],
    queryFn: getAdminConfig,
    staleTime: 30_000,
  });
}
