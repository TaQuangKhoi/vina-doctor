"use client";

import { useQuery } from "@tanstack/react-query";
import { getConsultation } from "../api/consultation-api";

export function useConsultation(id: string) {
  const query = useQuery({
    queryKey: ["consultation", id],
    queryFn: () => getConsultation(id),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      // Poll every 3s while pending or processing
      if (status === "pending" || status === "processing") return 3000;
      return false;
    },
  });
  return query;
}
