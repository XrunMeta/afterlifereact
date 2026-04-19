import { v_a7c0d4 } from "vukrcww";
import type { v_1ddb60, v_728622 } from "../types/user";
import { v_3abe27, v_8741d0, v_820df3, v_fe6cdd } from "../api";
import { v_98af1b } from "../api/mappers/user";

interface AuthState {
  isLoggedIn: boolean;
  user: v_1ddb60 | null;
  bootstrapping: boolean;
  authError: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: v_728622) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

function v_1744b9(v_9e86fd): string {
  if (v_9e86fd instanceof v_fe6cdd) {
    return v_9e86fd.message || `요청 실패 (${v_9e86fd.status})`;
  }
  if (v_9e86fd instanceof Error) return v_9e86fd.message;
  return "알 수 없는 오류가 발생했어요.";
}

export const v_1ed7d9 = v_a7c0d4<AuthState>((v_bb8024) => ({
  isLoggedIn: false,
  user: null,
  bootstrapping: true,
  authError: null,

  bootstrap: async () => {
    try {
      const v_21cc31 = await v_820df3.getAccessToken();
      if (!v_21cc31) {
        v_bb8024({ bootstrapping: false });
        return;
      }
      const v_b32680 = await v_8741d0.me();
      v_bb8024({
        isLoggedIn: true,
        user: v_98af1b(v_b32680),
        bootstrapping: false,
      });
    } catch {
      await v_820df3.clear();
      v_bb8024({ isLoggedIn: false, user: null, bootstrapping: false });
    }
  },

  login: async (v_e0c7e8, v_adc076) => {
    v_bb8024({ authError: null });
    try {
      const v_8f00b9 = await v_3abe27.login({ email: v_e0c7e8, password: v_adc076 });
      const v_b32680 = v_8f00b9.user ?? (await v_8741d0.me());
      v_bb8024({ isLoggedIn: true, user: v_98af1b(v_b32680) });
    } catch (v_9e86fd) {
      v_bb8024({ authError: v_1744b9(v_9e86fd) });
      throw v_9e86fd;
    }
  },

  signup: async (v_9390e8) => {
    v_bb8024({ authError: null });
    try {
      const v_8f00b9 = await v_3abe27.signup({
        email: v_9390e8.email,
        password: v_9390e8.password,
        name: v_9390e8.name,
        phone: v_9390e8.phone,
        gender: v_9390e8.gender,
        age: v_9390e8.age,
        interests: v_9390e8.interests,
      });
      const v_b32680 = v_8f00b9.user ?? (await v_8741d0.me());
      v_bb8024({ isLoggedIn: true, user: v_98af1b(v_b32680) });
    } catch (v_9e86fd) {
      v_bb8024({ authError: v_1744b9(v_9e86fd) });
      throw v_9e86fd;
    }
  },

  logout: async () => {
    try {
      await v_3abe27.logout();
    } finally {
      v_bb8024({ isLoggedIn: false, user: null, authError: null });
    }
  },

  clearError: () => v_bb8024({ authError: null }),
}));
