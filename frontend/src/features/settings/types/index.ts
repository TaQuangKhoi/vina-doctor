export interface UpdateApiKeyRequest {
  api_key: string;
}

export interface UpdateDashscopeUrlRequest {
  base_url: string;
}

export interface UpdateModelRequest {
  task: string;
  model_id: string;
}

export interface AdminConfigResponse {
  dashscope_base_url: string;
  models: Record<string, string>;
}

