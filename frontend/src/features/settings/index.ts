export { useUpdateApiKey } from "./hooks/useUpdateApiKey";
export { useUpdateDashscopeUrl } from "./hooks/useUpdateDashscopeUrl";
export { useUpdateModel } from "./hooks/useUpdateModel";
export { useAdminConfig } from "./hooks/useAdminConfig";
export {
  updateDashscopeApiKey,
  updateDashscopeUrl,
  updateModel,
  getAdminConfig,
} from "./api/settings-api";
export type {
  UpdateApiKeyRequest,
  UpdateDashscopeUrlRequest,
  UpdateModelRequest,
  AdminConfigResponse,
} from "./types";

