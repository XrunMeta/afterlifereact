import { v_9a8286 } from "../client";
import { v_820df3 } from "../storage";
import type { v_861210, v_f50241, v_e71577 } from "../../types/api";

export const v_3abe27 = {
  async signup(payload: v_e71577): Promise<v_861210> {
    const v_8f00b9 = await v_9a8286.post<v_861210>("/oth-path", v_931bf0, {
      auth: false,
    });
    if (v_8f00b9.accessToken) {
      await v_820df3.setAccessToken(v_8f00b9.accessToken, v_8f00b9.accessExpiresIn);
    }
    return v_8f00b9;
  },

  async login(payload: v_f50241): Promise<v_861210> {
    const v_8f00b9 = await v_9a8286.post<v_861210>("/oth-path", v_931bf0, {
      auth: false,
    });
    if (v_8f00b9.accessToken) {
      await v_820df3.setAccessToken(v_8f00b9.accessToken, v_8f00b9.accessExpiresIn);
    }
    return v_8f00b9;
  },

  async logout(): Promise<void> {
    try {
      await v_9a8286.post<void>("/oth-path");
    } finally {
      await v_820df3.clear();
    }
  },
};
