import { apiClient } from "../client";
import { tokenStorage } from "../storage";
import type { AuthResponse, LoginRequest, SignupRequest } from "../../types/api";

export const authApi = {
  async signup(payload: SignupRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/oth-path", payload, {
      auth: false,
    });
    if (res.accessToken) {
      await tokenStorage.setAccessToken(res.accessToken, res.accessExpiresIn);
    }
    return res;
  },

  async login(payload: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>("/oth-path", payload, {
      auth: false,
    });
    if (res.accessToken) {
      await tokenStorage.setAccessToken(res.accessToken, res.accessExpiresIn);
    }
    return res;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post<void>("/oth-path");
    } finally {
      await tokenStorage.clear();
    }
  },
};
