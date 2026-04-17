import { api, getAuthToken } from "@/shared/lib/api-client";
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
  model?: string,
): Promise<ConsultationResponse> {
  const formData = new FormData();
  formData.append("file", file);
  const url = model
    ? `/consultations?model=${encodeURIComponent(model)}`
    : "/consultations";
  return api.post<ConsultationResponse>(url, formData);
}

export async function retryConsultation(id: string): Promise<ConsultationResponse> {
  return api.post<ConsultationResponse>(`/consultations/${id}/retry`);
}

/**
 * Fetch the consultation audio as a blob URL.
 * Returns an object URL that must be revoked by the caller when no longer needed.
 */
export async function fetchConsultationAudioUrl(id: string): Promise<string> {
  const token = getAuthToken();
  const baseUrl =
    typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.host}`
      : (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8001");

  const res = await fetch(`${baseUrl}/api/v1/consultations/${id}/audio`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Failed to load audio: ${res.statusText}`);
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

