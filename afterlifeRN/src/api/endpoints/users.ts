import { apiClient } from "../client";
import type { ApiUser, UpdateMeRequest } from "../../types/api";

type MeResponse = {
  user: Omit<ApiUser, "interests">;
  interests: string[];
};

function flattenMe(res: MeResponse): ApiUser {
  return { ...res.user, interests: res.interests } as ApiUser;
}

export const usersApi = {
  me: async (): Promise<ApiUser> => {
    const res = await apiClient.get<MeResponse>("/oth-path");
    return flattenMe(res);
  },
  updateMe: async (body: UpdateMeRequest): Promise<ApiUser> => {
    const res = await apiClient.patch<MeResponse>("/oth-path", body);
    return flattenMe(res);
  },
  setInterests: async (interests: string[]): Promise<ApiUser> => {
    const res = await apiClient.post<MeResponse>(
      "/oth-path",
      { interests },
    );
    return flattenMe(res);
  },
  softDelete: () => apiClient.post<void>("/oth-path"),
  restore: () => apiClient.post<void>("/oth-path"),
};
