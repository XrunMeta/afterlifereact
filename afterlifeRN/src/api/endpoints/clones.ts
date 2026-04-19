import { v_9a8286 } from "../client";
import type {
  v_2357cc,
  v_ef6220,
  v_6673c4,
  v_479fc6,
} from "../../types/api";

export type SearchClonesQuery = {
  q?: string;
  cloneType?: string;
  cursor?: string;
  limit?: number;
  ownerId?: number;
};

export const v_2d6fda = {
  search: (v_7c5791 = {}) =>
    v_9a8286.get<v_6673c4<v_ef6220>>("/oth-path", { query: v_7c5791 }),
  get: (v_389afb) => v_9a8286.get<v_2357cc>(`/oth-path${v_389afb}`),
  update: (v_389afb, body: v_479fc6) =>
    v_9a8286.patch<v_2357cc>(`/oth-path${v_389afb}`, v_4d33b2),
  softDelete: (v_389afb) => v_9a8286.delete<void>(`/oth-path${v_389afb}`),
  restore: (v_389afb) =>
    v_9a8286.post<void>(`/oth-path${v_389afb}/restore`),
  follow: (v_389afb) =>
    v_9a8286.post<void>(`/oth-path${v_389afb}/follow`),
  unfollow: (v_389afb) =>
    v_9a8286.delete<void>(`/oth-path${v_389afb}/follow`),
};
