import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SEED } from "../mocks/seedIndex";
import type { DomainUser } from "../types/domain";

const STORAGE_KEY = "@afterlifeRN/auth/currentUserId";
const DEFAULT_USER_ID = "user-001";

interface AuthState {
  isLoggedIn: boolean;
  user: DomainUser | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,

  hydrate: async () => {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const id = stored ?? DEFAULT_USER_ID;
    const u =
      SEED.users.find((x) => x.id === id) ??
      SEED.users.find((x) => x.id === DEFAULT_USER_ID) ??
      null;
    set({ isLoggedIn: !!u, user: u, hydrated: true });
  },

  switchUser: async (userId) => {
    const u = SEED.users.find((x) => x.id === userId);
    if (!u) throw new Error(`switchUser: unknown userId ${userId}`);
    await AsyncStorage.setItem(STORAGE_KEY, userId);
    set({ user: u, isLoggedIn: true });
  },

  logout: async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    set({ isLoggedIn: false, user: null });
  },
}));
