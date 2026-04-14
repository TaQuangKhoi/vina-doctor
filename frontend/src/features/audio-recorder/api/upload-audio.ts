import { createConsultation } from "@/features/consultation/api/consultation-api";
import type { ConsultationResponse } from "@/shared/types/api";

export async function uploadAudio(
  file: File,
  model?: string,
): Promise<ConsultationResponse> {
  return createConsultation(file, model);
}
