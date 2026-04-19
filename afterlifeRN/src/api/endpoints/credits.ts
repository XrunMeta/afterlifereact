import { v_9a8286 } from "../client";
import type {
  v_6b92b2,
  v_cb642e,
  v_6673c4,
} from "../../types/api";

export const v_32afd5 = {
  me: () => v_9a8286.get<v_6b92b2>("/oth-path"),
  ledgers: (v_75cbf4, v_02be30 = 30) =>
    v_9a8286.get<v_6673c4<v_cb642e>>("/oth-path", {
      query: { cursor: v_75cbf4, limit: v_02be30 },
    }),
};
