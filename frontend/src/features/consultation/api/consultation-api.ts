import { api } from "@/shared/lib/api-client";
import type {
  ConsultationListResponse,
  ConsultationResponse,
} from "@/shared/types/api";

export async function listConsultations(
  offset = 0,
  limit = 20,
): Promise<ConsultationListResponse> {
  return api.get<ConsultationListResponse>(
    `/consultations?offset=${offset}&limit=${limit}`,
  );
}

export async function getConsultation(
  id: string,
): Promise<ConsultationResponse> {
  return api.get<ConsultationResponse>(`/consultations/${id}`);
}

export async function createConsultation(
  file: File,
  model = "qwen3-asr-flash",
): Promise<ConsultationResponse> {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<ConsultationResponse>(
    `/consultations?model=${encodeURIComponent(model)}`,
    formData,
  );
}

export async function retryConsultation(id: string): Promise<ConsultationResponse> {
  return api.post<ConsultationResponse>(`/consultations/${id}/retry`);
}
