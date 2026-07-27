import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { seedSource } from "../api/source";
import type { DomainUser } from "../types/domain";
import { login as apiLogin, getMe, type AuthUser, type LoginPayload } from "../api/auth";

const STORAGE_KEY = "@afterlifeRN/auth/currentUserId";
const TOKEN_KEY = "@afterlifeRN/auth/accessToken";
const REFRESH_TOKEN_KEY = "@afterlifeRN/auth/refreshToken";
const DEFAULT_USER_ID = 1;

interface AuthState {

  isLoggedIn: boolean;
  user: DomainUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  switchUser: (userId: number) => Promise<void>;
  logout: () => Promise<void>;

  accessToken: string | null;
  refreshToken: string | null;
  apiUser: AuthUser | null;
  loginWithApi: (payload: LoginPayload, opts?: { persist?: boolean }) => Promise<AuthUser>;
  setApiAuth: (token: string, user: AuthUser, opts?: { persist?: boolean }) => Promise<void>;

  setApiTokens: (accessToken: string, refreshToken: string | null, opts?: { persist?: boolean }) => Promise<void>;
  apiLogout: () => Promise<void>;
  refreshApiUser: () => Promise<AuthUser | null>;
  patchApiUser: (patch: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,
  accessToken: null,
  refreshToken: null,
  apiUser: null,

  hydrate: async () => {

    const current = get();
    let apiUser: AuthUser | null = current.apiUser;
    let token: string | null = current.accessToken;

    let storedRefreshToken: string | null = null;
    if (!apiUser) {
      token = await AsyncStorage.getItem(TOKEN_KEY);
      storedRefreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
      if (token) {

        set({ accessToken: token, refreshToken: storedRefreshToken });
        try {
          const res = await getMe(token);
          apiUser = res.user;

          const s = get();
          token = s.accessToken ?? token;
          storedRefreshToken = s.refreshToken ?? storedRefreshToken;
        } catch {

          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
          token = null;
          storedRefreshToken = null;
        }
      }
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const id = stored !== null ? Number(stored) : DEFAULT_USER_ID;
    const u =
      seedSource.users().find((x) => x.id === id) ??
      seedSource.users().find((x) => x.id === DEFAULT_USER_ID) ??
      null;

    set({
      accessToken: apiUser ? token : null,
      refreshToken: apiUser ? (current.refreshToken ?? storedRefreshToken) : null,
      apiUser,
      isLoggedIn: !!apiUser, 
      user: u,
      hydrated: true,
    });
  },

  switchUser: async (userId) => {
    const u = seedSource.users().find((x) => x.id === userId);
    if (!u) throw new Error(`switchUser: unknown userId ${userId}`);
    await AsyncStorage.setItem(STORAGE_KEY, String(userId));
    set({ user: u, isLoggedIn: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ isLoggedIn: false, user: null, accessToken: null, refreshToken: null, apiUser: null });

    try {
      const { useFeedStore } = await import("./feedStore");
      const { useFollowStore } = await import("./followStore");
      useFeedStore.getState().resetForLogout();
      await useFollowStore.getState().resetForLogout();
    } catch (err) {
      console.warn("[authStore] reset on logout failed:", err);
    }
  },

  loginWithApi: async (payload, opts) => {
    const persist = opts?.persist !== false;

    const loginRes = await apiLogin(payload);
    const { accessToken } = loginRes;
    const refreshToken = (loginRes as { refreshToken?: string }).refreshToken ?? null;
    const { user } = await getMe(accessToken);
    if (persist) {
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    } else {

      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    set({ accessToken, refreshToken, apiUser: user, isLoggedIn: true });
    return user;
  },

  setApiAuth: async (token, user, opts) => {
    const persist = opts?.persist !== false;
    if (persist) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    }
    set({ accessToken: token, apiUser: user, isLoggedIn: true });
  },

  setApiTokens: async (accessToken, refreshToken, opts) => {
    const persist = opts?.persist !== false;
    if (persist) {
      await AsyncStorage.setItem(TOKEN_KEY, accessToken);
      if (refreshToken) {
        await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
    set((s) => ({
      accessToken,
      refreshToken: refreshToken ?? s.refreshToken,
    }));
  },

  apiLogout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
    set({ accessToken: null, refreshToken: null, apiUser: null, isLoggedIn: false });
    try {
      const { useFeedStore } = await import("./feedStore");
      const { useFollowStore } = await import("./followStore");
      const { useUserFollowStore } = await import("./userFollowStore");
      useFeedStore.getState().resetForLogout();
      await useFollowStore.getState().resetForLogout();
      useUserFollowStore.getState().resetForLogout();
    } catch (err) {
      console.warn("[authStore] reset on apiLogout failed:", err);
    }

    try {
      const { navigationRef } = await import("../navigation/navigationRef");
      if (navigationRef.isReady()) {
        navigationRef.reset({ index: 0, routes: [{ name: "Auth" as never }] });
      }
    } catch (err) {
      console.warn("[authStore] navigation reset failed:", err);
    }
  },

  refreshApiUser: async () => {
    const token = get().accessToken;
    if (!token) return null;
    try {
      const { user } = await getMe(token);
      set({ apiUser: user });
      return user;
    } catch {
      return null;
    }
  },

  patchApiUser: (patch) => {
    const cur = get().apiUser;
    if (!cur) return;
    set({ apiUser: { ...cur, ...patch } });
  },
}));
