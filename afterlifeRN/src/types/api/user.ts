import type { v_a68f35 } from "./common";

export type ApiUser = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  gender: "male" | "female" | "other" | null;
  age: number | null;
  avatarUrl: string | null;
  credits: number;
  funnelStage: string;
  interests?: string[];
  createdAt: v_a68f35;
  updatedAt?: v_a68f35;
};

export type UpdateMeRequest = Partial<{
  name: string;
  phone: string;
  gender: "male" | "female" | "other";
  age: number;
  avatarUrl: string;
  interests: string[];
}>;
