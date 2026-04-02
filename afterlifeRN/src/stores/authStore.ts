import { v_a7c0d4 } from "vukrcww";
import type { v_1ddb60, v_728622 } from "../types/user";
import v_8e8b91 from "../mocks/users.json";

interface AuthState {
  isLoggedIn: boolean;
  user: v_1ddb60 | null;
  login: (email: string, password: string) => void;
  signup: (data: v_728622) => void;
  logout: () => void;
}

export const v_1ed7d9 = v_a7c0d4<AuthState>((v_bb8024) => ({
  isLoggedIn: false,
  user: null,

  login: (v_7e4237, v_7851e7) => {
    v_bb8024({
      isLoggedIn: true,
      user: v_8e8b91.currentUser as v_1ddb60,
    });
  },

  signup: (v_9390e8) => {
    const newUser: v_1ddb60 = {
      id: "user-new",
      name: v_9390e8.name,
      email: v_9390e8.email,
      phone: v_9390e8.phone,
      gender: v_9390e8.gender,
      age: v_9390e8.age,
      interests: v_9390e8.interests,
      avatarUrl: "",
      credits: 100,
    };
    v_bb8024({ isLoggedIn: true, user: v_2848f2 });
  },

  logout: () => {
    v_bb8024({ isLoggedIn: false, user: null });
  },
}));
