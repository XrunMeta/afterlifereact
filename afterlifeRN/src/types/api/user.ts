import type { IsoTimestamp } from "./common";

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
  createdAt: IsoTimestamp;
  updatedAt?: IsoTimestamp;
};

export type UpdateMeRequest = Partial<{
  name: string;
  phone: string;
  gender: "male" | "female" | "other";
  age: number;
  avatarUrl: string;
  interests: string[];
}>;
