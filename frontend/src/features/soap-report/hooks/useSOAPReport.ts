"use client";

import { useQuery } from "@tanstack/react-query";
import { getReport } from "../api/report-api";

export function useSOAPReport(consultationId: string, enabled = true) {
  return useQuery({
    queryKey: ["report", consultationId],
    queryFn: () => getReport(consultationId),
    enabled,
  });
}
