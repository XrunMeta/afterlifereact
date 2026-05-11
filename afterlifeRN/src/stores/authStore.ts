import { v_a7c0d4 } from "vukrcww";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_694b7f } from "../api/source";
import type { v_b89f99 } from "../types/domain";
import { v_182fdb as v_ac9e58, v_7ef860, type v_7289ef, type v_a93c97 } from "../api/auth";

const v_b6c376 = "@afterlifeRN/auth/currentUserId";
const v_1278db = "@afterlifeRN/auth/accessToken";
const v_b9d568 = 1;

interface AuthState {

  isLoggedIn: boolean;
  user: v_b89f99 | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  switchUser: (userId: number) => Promise<void>;
  logout: () => Promise<void>;

  accessToken: string | null;
  apiUser: v_7289ef | null;
  loginWithApi: (payload: v_a93c97, opts?: { persist?: boolean }) => Promise<v_7289ef>;
  setApiAuth: (token: string, user: v_7289ef, opts?: { persist?: boolean }) => Promise<void>;
  apiLogout: () => Promise<void>;
  refreshApiUser: () => Promise<v_7289ef | null>;
  patchApiUser: (patch: Partial<v_7289ef>) => void;
}

export const v_1ed7d9 = v_a7c0d4<AuthState>((v_bb8024, v_38715b) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,
  accessToken: null,
  apiUser: null,

  hydrate: async () => {

    const v_21cc31 = await v_e84827.getItem(v_1278db);
    let apiUser: v_7289ef | null = null;
    if (v_21cc31) {
      try {
        const v_8f00b9 = await v_7ef860(v_21cc31);
        v_b113dd = v_8f00b9.user;
      } catch {

        await v_e84827.removeItem(v_1278db);
      }
    }

    const v_5885b8 = await v_e84827.getItem(v_b6c376);
    const v_389afb = v_5885b8 !== null ? Number(v_5885b8) : v_b9d568;
    const v_ceb55a =
      v_694b7f.users().find((v_62c214) => v_62c214.id === v_389afb) ??
      v_694b7f.users().find((v_62c214) => v_62c214.id === v_b9d568) ??
      null;

    v_bb8024({
      accessToken: v_b113dd ? v_21cc31 : null,
      apiUser: v_b113dd,
      isLoggedIn: !!v_b113dd, 
      user: v_ceb55a,
      hydrated: true,
    });
  },

  switchUser: async (v_43e90c) => {
    const v_ceb55a = v_694b7f.users().find((v_62c214) => v_62c214.id === v_43e90c);
    if (!v_ceb55a) throw new Error(`switchUser: unknown userId ${v_43e90c}`);
    await v_e84827.setItem(v_b6c376, String(v_43e90c));
    v_bb8024({ user: v_ceb55a, isLoggedIn: true });
  },

  logout: async () => {
    await v_e84827.removeItem(v_b6c376);
    await v_e84827.removeItem(v_1278db);
    v_bb8024({ isLoggedIn: false, user: null, accessToken: null, apiUser: null });

    try {
      const { useFeedStore: v_37977a } = await import("./feedStore");
      const { useFollowStore: v_b4902e } = await import("./followStore");
      v_37977a.getState().resetForLogout();
      await v_b4902e.getState().resetForLogout();
    } catch (v_49263d) {
      console.warn("[authStore] reset on logout failed:", v_49263d);
    }
  },

  loginWithApi: async (v_931bf0, v_328259) => {
    const v_3c038e = v_328259?.persist !== false;
    const { accessToken: v_2ca7e0 } = await v_ac9e58(v_931bf0);
    const { user: v_625c74 } = await v_7ef860(v_2ca7e0);
    if (v_3c038e) {
      await v_e84827.setItem(v_1278db, v_2ca7e0);
    } else {

      await v_e84827.removeItem(v_1278db);
    }
    v_bb8024({ accessToken: v_2ca7e0, apiUser: v_625c74, isLoggedIn: true });
    return v_625c74;
  },

  setApiAuth: async (v_21cc31, v_625c74, v_328259) => {
    const v_3c038e = v_328259?.persist !== false;
    if (v_3c038e) {
      await v_e84827.setItem(v_1278db, v_21cc31);
    } else {
      await v_e84827.removeItem(v_1278db);
    }
    v_bb8024({ accessToken: v_21cc31, apiUser: v_625c74, isLoggedIn: true });
  },

  apiLogout: async () => {
    await v_e84827.removeItem(v_1278db);
    v_bb8024({ accessToken: null, apiUser: null, isLoggedIn: false });
    try {
      const { useFeedStore: v_37977a } = await import("./feedStore");
      const { useFollowStore: v_b4902e } = await import("./followStore");
      v_37977a.getState().resetForLogout();
      await v_b4902e.getState().resetForLogout();
    } catch (v_49263d) {
      console.warn("[authStore] reset on apiLogout failed:", v_49263d);
    }
  },

  refreshApiUser: async () => {
    const v_21cc31 = v_38715b().accessToken;
    if (!v_21cc31) return null;
    try {
      const { user: v_625c74 } = await v_7ef860(v_21cc31);
      v_bb8024({ apiUser: v_625c74 });
      return v_625c74;
    } catch {
      return null;
    }
  },

  patchApiUser: (v_17dc8a) => {
    const v_c3bc75 = v_38715b().apiUser;
    if (!v_c3bc75) return;
    v_bb8024({ apiUser: { ...v_c3bc75, ...v_17dc8a } });
  },
}));
