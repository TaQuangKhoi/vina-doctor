import { api } from "@/shared/lib/api-client";
import type { TokenResponse } from "@/shared/types/api";
import type { LoginCredentials, RegisterCredentials } from "../types";

export async function loginApi(
  credentials: LoginCredentials,
): Promise<TokenResponse> {
  return api.post<TokenResponse>("/auth/login", credentials);
}

export async function registerApi(
  credentials: RegisterCredentials,
): Promise<TokenResponse> {
  return api.post<TokenResponse>("/auth/register", credentials);
}
