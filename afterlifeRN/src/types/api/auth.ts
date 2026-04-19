import type { ApiUser } from "./user";

export type SignupRequest = {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  age?: number;
  interests?: string[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  accessToken: string;
  accessExpiresIn: number;
  user?: ApiUser;
};
