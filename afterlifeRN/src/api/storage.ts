import { Platform } from "react-native";

type StorageBackend = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();

const memoryBackend: StorageBackend = {
  getItem: async (k) => memoryStore.get(k) ?? null,
  setItem: async (k, v) => void memoryStore.set(k, v),
  removeItem: async (k) => void memoryStore.delete(k),
};

const webBackend: StorageBackend = {
  getItem: async (k) => {
    try {
      return globalThis.localStorage?.getItem(k) ?? null;
    } catch {
      return memoryBackend.getItem(k);
    }
  },
  setItem: async (k, v) => {
    try {
      globalThis.localStorage?.setItem(k, v);
    } catch {
      await memoryBackend.setItem(k, v);
    }
  },
  removeItem: async (k) => {
    try {
      globalThis.localStorage?.removeItem(k);
    } catch {
      await memoryBackend.removeItem(k);
    }
  },
};

const backend: StorageBackend =
  Platform.OS === "web" ? webBackend : memoryBackend;

const KEY_ACCESS = "afterlife.auth.accessToken";
const KEY_ACCESS_EXP = "afterlife.auth.accessExpiresAt";

export const tokenStorage = {
  async getAccessToken() {
    return backend.getItem(KEY_ACCESS);
  },
  async getAccessExpiresAt() {
    const v = await backend.getItem(KEY_ACCESS_EXP);
    return v ? Number(v) : null;
  },
  async setAccessToken(token: string, expiresInSec: number) {
    const expAt = Date.now() + expiresInSec * 1000;
    await backend.setItem(KEY_ACCESS, token);
    await backend.setItem(KEY_ACCESS_EXP, String(expAt));
  },
  async clear() {
    await backend.removeItem(KEY_ACCESS);
    await backend.removeItem(KEY_ACCESS_EXP);
  },
};
