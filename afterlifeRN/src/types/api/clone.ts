import type { IsoTimestamp } from "./common";

export type ApiCloneType = "memlow" | "friend" | "mentor" | "celeb";
export type ApiCloneVisibility = "public" | "private" | "followers";
export type ApiCloneTrainingStatus = "pending" | "processing" | "ready";

export type ApiCloneSummary = {
  id: number;
  name: string;
  username: string;
  cloneType: ApiCloneType;
  category: string | null;
  avatarUrl: string | null;
  followersCount: number;
  createdAt: IsoTimestamp;
};

export type ApiCloneDetail = ApiCloneSummary & {
  ownerId: number;
  description: string | null;
  visibility: ApiCloneVisibility;
  coverImageUrl: string | null;
  voiceType: "uploaded" | "preset" | "text_only" | null;
  trainingStatus: ApiCloneTrainingStatus;
  updatedAt: IsoTimestamp;
};

export type UpdateCloneRequest = Partial<{
  name: string;
  description: string;
  category: string;
  visibility: ApiCloneVisibility;
  avatarUrl: string;
  coverImageUrl: string;
}>;
