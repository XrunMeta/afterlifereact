import { create } from "zustand";
import type { User, SignupData } from "../types/user";
import { authApi, usersApi, tokenStorage, ApiError } from "../api";
import { apiUserToUser } from "../api/mappers/user";

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  bootstrapping: boolean;
  authError: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    return e.message || `요청 실패 (${e.status})`;
  }
  if (e instanceof Error) return e.message;
  return "알 수 없는 오류가 발생했어요.";
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,
  bootstrapping: true,
  authError: null,

  bootstrap: async () => {
    try {
      const token = await tokenStorage.getAccessToken();
      if (!token) {
        set({ bootstrapping: false });
        return;
      }
      const me = await usersApi.me();
      set({
        isLoggedIn: true,
        user: apiUserToUser(me),
        bootstrapping: false,
      });
    } catch {
      await tokenStorage.clear();
      set({ isLoggedIn: false, user: null, bootstrapping: false });
    }
  },

  login: async (email, password) => {
    set({ authError: null });
    try {
      const res = await authApi.login({ email, password });
      const me = res.user ?? (await usersApi.me());
      set({ isLoggedIn: true, user: apiUserToUser(me) });
    } catch (e) {
      set({ authError: errorMessage(e) });
      throw e;
    }
  },

  signup: async (data) => {
    set({ authError: null });
    try {
      const res = await authApi.signup({
        email: data.email,
        password: data.password,
        name: data.name,
        phone: data.phone,
        gender: data.gender,
        age: data.age,
        interests: data.interests,
      });
      const me = res.user ?? (await usersApi.me());
      set({ isLoggedIn: true, user: apiUserToUser(me) });
    } catch (e) {
      set({ authError: errorMessage(e) });
      throw e;
    }
  },

  logout: async () => {
    try {
      await authApi.logout();
    } finally {
      set({ isLoggedIn: false, user: null, authError: null });
    }
  },

  clearError: () => set({ authError: null }),
}));
