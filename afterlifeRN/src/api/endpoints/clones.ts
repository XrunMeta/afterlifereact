import { apiClient } from "../client";
import type {
  ApiCloneDetail,
  ApiCloneSummary,
  Paginated,
  UpdateCloneRequest,
} from "../../types/api";

export type SearchClonesQuery = {
  q?: string;
  cloneType?: string;
  cursor?: string;
  limit?: number;
  ownerId?: number;
};

export const clonesApi = {
  search: (query: SearchClonesQuery = {}) =>
    apiClient.get<Paginated<ApiCloneSummary>>("/oth-path", { query }),
  get: (id: number) => apiClient.get<ApiCloneDetail>(`/oth-path${id}`),
  update: (id: number, body: UpdateCloneRequest) =>
    apiClient.patch<ApiCloneDetail>(`/oth-path${id}`, body),
  softDelete: (id: number) => apiClient.delete<void>(`/oth-path${id}`),
  restore: (id: number) =>
    apiClient.post<void>(`/oth-path${id}/restore`),
  follow: (id: number) =>
    apiClient.post<void>(`/oth-path${id}/follow`),
  unfollow: (id: number) =>
    apiClient.delete<void>(`/oth-path${id}/follow`),
};
