import { api } from "@/shared/lib/api-client";
import type { ReportResponse } from "@/shared/types/api";

export async function getReport(
  consultationId: string,
): Promise<ReportResponse> {
  return api.get<ReportResponse>(`/consultations/${consultationId}/report`);
}
