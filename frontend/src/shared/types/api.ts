/* ── Backend API response shapes ──────────────────────────────────────────── */
/* Mirrors: backend/api/v1/schemas/ + backend/domain/value_objects.py        */

export type ConsultationStatus = "pending" | "processing" | "done" | "failed";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface ConsultationResponse {
  id: string;
  doctor_id: string;
  status: ConsultationStatus;
  created_at: string;
  updated_at: string;
}

export interface ConsultationListResponse {
  items: ConsultationResponse[];
  total: number;
}

export interface MultilingualText {
  vn: string;
  en: string;
  fr: string;
  ar: string;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface TranscriptTurn {
  speaker: string;
  timestamp: string | null;
  text: string;
}

export interface SOAPReport {
  subjective: MultilingualText;
  objective: MultilingualText;
  assessment: MultilingualText;
  plan: MultilingualText;
  icd10_codes: string[];
  medications: Medication[];
  severity: string;
}

export interface ReportResponse {
  id: string;
  consultation_id: string;
  soap: SOAPReport;
  transcript: TranscriptTurn[];
  created_at: string;
}

export interface ApiError {
  detail: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  specialty: string;
  license_number: string;
  phone: string;
  created_at: string;
}

export interface UserProfileUpdateRequest {
  full_name?: string;
  specialty?: string;
  license_number?: string;
  phone?: string;
}
