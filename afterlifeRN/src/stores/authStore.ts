import { v_a7c0d4 } from "vukrcww";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_694b7f } from "../api/source";
import type { v_b89f99 } from "../types/domain";
import { v_182fdb as v_ac9e58, v_7ef860, type v_7289ef, type v_a93c97 } from "../api/auth";
import { v_d4ff75 } from "../lib/errorReporting/report";
import { v_9ff0b2 } from "../lib/appsFlyer";

const v_b6c376 = "@afterlifeRN/auth/currentUserId";
const v_1278db = "@afterlifeRN/auth/accessToken";
const v_a19d89 = "@afterlifeRN/auth/refreshToken";

const v_474220 = "@afterlifeRN/auth/sessionExpiresAt";
const v_b9d568 = 1;

interface AuthState {

  isLoggedIn: boolean;
  user: v_b89f99 | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  switchUser: (userId: number) => Promise<void>;
  logout: () => Promise<void>;

  accessToken: string | null;
  refreshToken: string | null;
  apiUser: v_7289ef | null;

  sessionPersisted: boolean;
  loginWithApi: (payload: v_a93c97, opts?: { persist?: boolean }) => Promise<v_7289ef>;
  setApiAuth: (
    token: string,
    user: v_7289ef,
    opts?: { persist?: boolean; refreshToken?: string | null },
  ) => Promise<void>;

  setApiTokens: (accessToken: string, refreshToken: string | null, opts?: { persist?: boolean }) => Promise<void>;
  apiLogout: () => Promise<void>;
  refreshApiUser: () => Promise<v_7289ef | null>;
  patchApiUser: (patch: Partial<v_7289ef>) => void;
}

export const v_1ed7d9 = v_a7c0d4<AuthState>((v_bb8024, v_38715b) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  apiUser: null,
  sessionPersisted: false,

  hydrate: async () => {

    const v_275ccd = v_38715b();
    let apiUser: v_7289ef | null = v_275ccd.apiUser;
    let v_21cc31 = v_275ccd.accessToken;

    let v_2474a1 = null;
    if (!v_b113dd) {

      const v_d4785a = await v_e84827.getItem(v_474220);
      if (v_d4785a) {
        await v_e84827.removeItem(v_1278db);
        await v_e84827.removeItem(v_a19d89);
        await v_e84827.removeItem(v_474220);
      }
      v_21cc31 = await v_e84827.getItem(v_1278db);
      v_2474a1 = await v_e84827.getItem(v_a19d89);
      if (v_21cc31) {

        v_bb8024({ accessToken: v_21cc31, refreshToken: v_2474a1, sessionPersisted: true });
        try {
          const v_8f00b9 = await v_7ef860(v_21cc31);
          v_b113dd = v_8f00b9.user;

          const v_fd5f43 = v_38715b();
          v_21cc31 = v_fd5f43.accessToken ?? v_21cc31;
          v_2474a1 = v_fd5f43.refreshToken ?? v_2474a1;
        } catch {

          await v_e84827.removeItem(v_1278db);
          await v_e84827.removeItem(v_a19d89);
          v_21cc31 = null;
          v_2474a1 = null;
        }
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
      refreshToken: v_b113dd ? (v_275ccd.refreshToken ?? v_2474a1) : null,
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
    await v_e84827.removeItem(v_a19d89);
    await v_e84827.removeItem(v_474220);
    v_bb8024({ isLoggedIn: false, user: null, accessToken: null, refreshToken: null, apiUser: null });

    try {
      const { useFeedStore: v_37977a } = await import("./feedStore");
      const { useFollowStore: v_b4902e } = await import("./followStore");
      const { useCloneStore: v_194498 } = await import("./cloneStore");
      v_37977a.getState().resetForLogout();
      await v_b4902e.getState().resetForLogout();
      v_194498.getState().resetForLogout();

      const { clearPendingCloneShare: v_f18f70 } = await import("../lib/cloneShareDeferredLink");
      await v_f18f70();
    } catch (v_49263d) {
      console.warn("[authStore] reset on logout failed:", v_49263d);
    }

    v_d4ff75();
  },

  loginWithApi: async (v_931bf0, v_328259) => {
    const v_3c038e = v_328259?.persist !== false;
    const v_445b40 = await v_ac9e58(v_931bf0);

    if (v_445b40.requiresEmailVerification) {
      throw new Error("[authStore.loginWithApi] email verification required — use handleLogin flow");
    }
    const { accessToken: v_2ca7e0 } = v_445b40;
    const v_dfaee3 = v_445b40.refreshToken ?? null;
    const { user: v_625c74 } = await v_7ef860(v_2ca7e0);
    if (v_3c038e) {
      await v_e84827.setItem(v_1278db, v_2ca7e0);
      if (v_dfaee3) {
        await v_e84827.setItem(v_a19d89, v_dfaee3);
      }
      await v_e84827.removeItem(v_474220); 
    } else {

      await v_e84827.removeItem(v_1278db);
      await v_e84827.removeItem(v_a19d89);
      await v_e84827.removeItem(v_474220);
    }
    v_bb8024({ accessToken: v_2ca7e0, refreshToken: v_dfaee3, apiUser: v_625c74, isLoggedIn: true, sessionPersisted: v_3c038e });
    return v_625c74;
  },

  setApiAuth: async (v_21cc31, v_625c74, v_328259) => {
    const v_3c038e = v_328259?.persist !== false;
    const v_dfaee3 = v_328259?.refreshToken ?? null;

    if (v_3c038e) {
      await v_e84827.setItem(v_1278db, v_21cc31);
      if (v_dfaee3) {
        await v_e84827.setItem(v_a19d89, v_dfaee3);
      }
      await v_e84827.removeItem(v_474220); 
    } else {
      await v_e84827.removeItem(v_1278db);
      await v_e84827.removeItem(v_a19d89);
      await v_e84827.removeItem(v_474220);
    }
    v_bb8024((v_fd5f43) => ({
      accessToken: v_21cc31,
      refreshToken: v_dfaee3 ?? v_fd5f43.refreshToken,
      apiUser: v_625c74,
      isLoggedIn: true,
      sessionPersisted: v_3c038e,
    }));

    v_9ff0b2(v_625c74.id);

    void (async () => {
      try {
        const { getXrunProfile: v_2c296e } = await import("../api/auth");
        const v_786737 = await v_2c296e(v_21cc31);
        const v_32d8c3 = v_786737.firstname?.trim();
        if (v_32d8c3 && v_32d8c3 !== v_625c74.name) {
          console.log(`[authStore] xrun name sync "${v_625c74.name}" -> "${v_32d8c3}"`);
          v_bb8024((v_fd5f43) => (v_fd5f43.apiUser ? { apiUser: { ...v_fd5f43.apiUser, name: v_32d8c3 } } : v_fd5f43));
        }
      } catch (v_49263d) {
        console.warn("[authStore] xrun name sync failed:", (v_49263d as Error)?.message);
      }
    })();
  },

  setApiTokens: async (v_2ca7e0, v_dfaee3, v_328259) => {
    const v_3c038e = v_328259?.persist !== false;
    if (v_3c038e) {
      await v_e84827.setItem(v_1278db, v_2ca7e0);
      if (v_dfaee3) {
        await v_e84827.setItem(v_a19d89, v_dfaee3);
      }
    }
    v_bb8024((v_fd5f43) => ({
      accessToken: v_2ca7e0,
      refreshToken: v_dfaee3 ?? v_fd5f43.refreshToken,
    }));
  },

  apiLogout: async () => {
    await v_e84827.removeItem(v_1278db);
    await v_e84827.removeItem(v_a19d89);
    await v_e84827.removeItem(v_474220);
    v_bb8024({ accessToken: null, refreshToken: null, apiUser: null, isLoggedIn: false, sessionPersisted: false });
    try {
      const { useFeedStore: v_37977a } = await import("./feedStore");
      const { useFollowStore: v_b4902e } = await import("./followStore");
      const { useUserFollowStore: v_98d20a } = await import("./userFollowStore");
      v_37977a.getState().resetForLogout();
      await v_b4902e.getState().resetForLogout();
      v_98d20a.getState().resetForLogout();
    } catch (v_49263d) {
      console.warn("[authStore] reset on apiLogout failed:", v_49263d);
    }

    try {
      const { navigationRef: v_94c936 } = await import("../navigation/navigationRef");
      if (v_94c936.isReady()) {
        v_94c936.reset({ index: 0, routes: [{ name: "Auth" as never }] });
      }
    } catch (v_49263d) {
      console.warn("[authStore] navigation reset failed:", v_49263d);
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
