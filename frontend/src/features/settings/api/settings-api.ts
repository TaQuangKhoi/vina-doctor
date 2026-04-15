import { api } from "@/shared/lib/api-client";
import type {
  AdminConfigResponse,
  UpdateApiKeyRequest,
  UpdateDashscopeUrlRequest,
  UpdateModelRequest,
} from "@/features/settings/types";

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
 * PATCH /api/v1/admin/config/model
 * Overrides the model ID for a given pipeline task (scribe/clinical/etc.).
 */
export async function updateModel(
  payload: UpdateModelRequest,
): Promise<void> {
  return api.patch<void>("/admin/config/model", payload);
}

/**
 * GET /api/v1/admin/config
 * Fetches the current runtime configuration (base URL + model overrides).
 */
export async function getAdminConfig(): Promise<AdminConfigResponse> {
  return api.get<AdminConfigResponse>("/admin/config");
}

