import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { seedSource } from "../api/source";
import type { DomainUser } from "../types/domain";
import { login as apiLogin, getMe, type AuthUser, type LoginPayload } from "../api/auth";

const STORAGE_KEY = "@afterlifeRN/auth/currentUserId";
const TOKEN_KEY = "@afterlifeRN/auth/accessToken";
const DEFAULT_USER_ID = 1;

interface AuthState {

  isLoggedIn: boolean;
  user: DomainUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  switchUser: (userId: number) => Promise<void>;
  logout: () => Promise<void>;

  accessToken: string | null;
  apiUser: AuthUser | null;
  loginWithApi: (payload: LoginPayload) => Promise<AuthUser>;
  setApiAuth: (token: string, user: AuthUser) => Promise<void>;
  apiLogout: () => Promise<void>;
  refreshApiUser: () => Promise<AuthUser | null>;
  patchApiUser: (patch: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,
  accessToken: null,
  apiUser: null,

  hydrate: async () => {

    const token = await AsyncStorage.getItem(TOKEN_KEY);
    let apiUser: AuthUser | null = null;
    if (token) {
      try {
        const res = await getMe(token);
        apiUser = res.user;
      } catch {

        await AsyncStorage.removeItem(TOKEN_KEY);
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
      apiUser,
      isLoggedIn: !!u,
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
    set({ isLoggedIn: false, user: null, accessToken: null, apiUser: null });

    try {
      const { useFeedStore } = await import("./feedStore");
      const { useFollowStore } = await import("./followStore");
      useFeedStore.getState().resetForLogout();
      await useFollowStore.getState().resetForLogout();
    } catch (err) {
      console.warn("[authStore] reset on logout failed:", err);
    }
  },

  loginWithApi: async (payload) => {
    const { accessToken } = await apiLogin(payload);
    const { user } = await getMe(accessToken);
    await AsyncStorage.setItem(TOKEN_KEY, accessToken);
    set({ accessToken, apiUser: user });
    return user;
  },

  setApiAuth: async (token, user) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    set({ accessToken: token, apiUser: user });
  },

  apiLogout: async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    set({ accessToken: null, apiUser: null });
    try {
      const { useFeedStore } = await import("./feedStore");
      const { useFollowStore } = await import("./followStore");
      useFeedStore.getState().resetForLogout();
      await useFollowStore.getState().resetForLogout();
    } catch (err) {
      console.warn("[authStore] reset on apiLogout failed:", err);
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
