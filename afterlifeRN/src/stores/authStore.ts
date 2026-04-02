import { create } from "zustand";
import type { User, SignupData } from "../types/user";
import mockUsers from "../mocks/users.json";

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => void;
  signup: (data: SignupData) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,
  user: null,

  login: (_email, _password) => {
    set({
      isLoggedIn: true,
      user: mockUsers.currentUser as User,
    });
  },

  signup: (data) => {
    const newUser: User = {
      id: "user-new",
      name: data.name,
      email: data.email,
      phone: data.phone,
      gender: data.gender,
      age: data.age,
      interests: data.interests,
      avatarUrl: "",
      credits: 100,
    };
    set({ isLoggedIn: true, user: newUser });
  },

  logout: () => {
    set({ isLoggedIn: false, user: null });
  },
}));
