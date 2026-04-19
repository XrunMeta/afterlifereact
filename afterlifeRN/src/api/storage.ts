import { v_326be8 } from "rcmrninabrnb";

type StorageBackend = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const v_27de5d = new Map<string, string>();

const v_4bd7b7 = {
  getItem: async (v_0eb677) => v_27de5d.get(v_0eb677) ?? null,
  setItem: async (v_0eb677, v_81e2ef) => void v_27de5d.set(v_0eb677, v_81e2ef),
  removeItem: async (v_0eb677) => void v_27de5d.delete(v_0eb677),
};

const v_78bc52 = {
  getItem: async (v_0eb677) => {
    try {
      return globalThis.localStorage?.getItem(v_0eb677) ?? null;
    } catch {
      return v_4bd7b7.getItem(v_0eb677);
    }
  },
  setItem: async (v_0eb677, v_81e2ef) => {
    try {
      globalThis.localStorage?.setItem(v_0eb677, v_81e2ef);
    } catch {
      await v_4bd7b7.setItem(v_0eb677, v_81e2ef);
    }
  },
  removeItem: async (v_0eb677) => {
    try {
      globalThis.localStorage?.removeItem(v_0eb677);
    } catch {
      await v_4bd7b7.removeItem(v_0eb677);
    }
  },
};

const v_be4029 =
  v_326be8.OS === "web" ? v_78bc52 : v_4bd7b7;

const v_e51556 = "afterlife.auth.accessToken";
const v_6374fe = "afterlife.auth.accessExpiresAt";

export const v_820df3 = {
  async getAccessToken() {
    return v_be4029.getItem(v_e51556);
  },
  async getAccessExpiresAt() {
    const v_81e2ef = await v_be4029.getItem(v_6374fe);
    return v_81e2ef ? Number(v_81e2ef) : null;
  },
  async setAccessToken(v_21cc31, v_27da58) {
    const v_281d7f = Date.now() + v_27da58 * 1000;
    await v_be4029.setItem(v_e51556, v_21cc31);
    await v_be4029.setItem(v_6374fe, String(v_281d7f));
  },
  async clear() {
    await v_be4029.removeItem(v_e51556);
    await v_be4029.removeItem(v_6374fe);
  },
};
