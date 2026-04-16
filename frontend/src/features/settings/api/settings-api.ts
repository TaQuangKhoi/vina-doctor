import { api } from "@/shared/lib/api-client";
import type { UserProfile, UserProfileUpdateRequest } from "@/shared/types/api";
import type {
  AdminConfigResponse,
  UpdateApiKeyRequest,
  UpdateDashscopeUrlRequest,
  UpdateIcd10EnrichRequest,
  UpdateModelRequest,
} from "@/features/settings/types";

/**
 * GET /api/v1/users/me
 * Fetches the current doctor's profile.
 */
export async function getUserProfile(): Promise<UserProfile> {
  return api.get<UserProfile>("/users/me");
}

/**
 * PATCH /api/v1/users/me
 * Updates the current doctor's profile fields.
 */
export async function updateUserProfile(
  payload: UserProfileUpdateRequest,
): Promise<UserProfile> {
  return api.patch<UserProfile>("/users/me", payload);
}

/**
 * POST /api/v1/admin/config/dashscope-api-key
 * Proxies the new key to ai_engine; returns void on success (204).
 */
export async function updateDashscopeApiKey(
  payload: UpdateApiKeyRequest,
): Promise<void> {
  return api.post<void>("/admin/config/dashscope-api-key", payload);
}

/**
 * PATCH /api/v1/admin/config/dashscope-url
 * Updates the DashScope base HTTP API URL in ai_engine at runtime.
 */
export async function updateDashscopeUrl(
  payload: UpdateDashscopeUrlRequest,
): Promise<void> {
  return api.patch<void>("/admin/config/dashscope-url", payload);
}

/**
 * PATCH /v1/admin/config/model
 * Overrides the model ID for a given pipeline task (scribe/clinical/etc.).
 */
export async function updateModel(
  payload: UpdateModelRequest,
): Promise<void> {
  return api.patch<void>("/admin/config/model", payload);
}

/**
 * PATCH /api/v1/admin/config/icd10-enrich
 * Toggles ICD-10 context injection into the Clinical Agent pipeline at runtime.
 */
export async function updateIcd10Enrich(
  payload: UpdateIcd10EnrichRequest,
): Promise<void> {
  return api.patch<void>("/admin/config/icd10-enrich", payload);
}

/**
 * GET /api/v1/admin/config
 * Fetches the current runtime configuration (base URL + model overrides).
 */
export async function getAdminConfig(): Promise<AdminConfigResponse> {
  return api.get<AdminConfigResponse>("/admin/config");
}

