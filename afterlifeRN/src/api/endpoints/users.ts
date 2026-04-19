import { v_9a8286 } from "../client";
import type { v_b35f02, v_94fc5f } from "../../types/api";

type MeResponse = {
  user: Omit<v_b35f02, "interests">;
  interests: string[];
};

function v_b0fa99(v_8f00b9): v_b35f02 {
  return { ...v_8f00b9.user, interests: v_8f00b9.interests } as v_b35f02;
}

export const v_8741d0 = {
  me: async (): Promise<v_b35f02> => {
    const v_8f00b9 = await v_9a8286.get<MeResponse>("/oth-path");
    return v_b0fa99(v_8f00b9);
  },
  updateMe: async (body: v_94fc5f): Promise<v_b35f02> => {
    const v_8f00b9 = await v_9a8286.patch<MeResponse>("/oth-path", v_4d33b2);
    return v_b0fa99(v_8f00b9);
  },
  setInterests: async (v_774c91): Promise<v_b35f02> => {
    const v_8f00b9 = await v_9a8286.post<MeResponse>(
      "/oth-path",
      { interests: v_774c91 },
    );
    return v_b0fa99(v_8f00b9);
  },
  softDelete: () => v_9a8286.post<void>("/oth-path"),
  restore: () => v_9a8286.post<void>("/oth-path"),
};
