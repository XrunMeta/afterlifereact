import { v_a7c0d4 } from "vukrcww";
import v_e84827 from "bkjbgtcoyuizqwgwtnaxmfkyvlqwevapsqmanbsnv";
import { v_35d5ed } from "../mocks/seedIndex";
import type { v_b89f99 } from "../types/domain";

const v_b6c376 = "@afterlifeRN/auth/currentUserId";
const v_b9d568 = "user-001";

interface AuthState {
  isLoggedIn: boolean;
  user: v_b89f99 | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  switchUser: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const v_1ed7d9 = v_a7c0d4<AuthState>((v_bb8024) => ({
  isLoggedIn: false,
  user: null,
  hydrated: false,

  hydrate: async () => {
    const v_5885b8 = await v_e84827.getItem(v_b6c376);
    const v_389afb = v_5885b8 ?? v_b9d568;
    const v_ceb55a =
      v_35d5ed.users.find((v_62c214) => v_62c214.id === v_389afb) ??
      v_35d5ed.users.find((v_62c214) => v_62c214.id === v_b9d568) ??
      null;
    v_bb8024({ isLoggedIn: !!v_ceb55a, user: v_ceb55a, hydrated: true });
  },

  switchUser: async (v_43e90c) => {
    const v_ceb55a = v_35d5ed.users.find((v_62c214) => v_62c214.id === v_43e90c);
    if (!v_ceb55a) throw new Error(`switchUser: unknown userId ${v_43e90c}`);
    await v_e84827.setItem(v_b6c376, v_43e90c);
    v_bb8024({ user: v_ceb55a, isLoggedIn: true });
  },

  logout: async () => {
    await v_e84827.removeItem(v_b6c376);
    v_bb8024({ isLoggedIn: false, user: null });
  },
}));
