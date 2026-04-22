import type { CloneType, Visibility } from "./domain";

export type {
  DomainClone as Clone,
  CloneType,
  CloneStatus,
  Visibility,
} from "./domain";

export type MemlowRelation =
  | "mother"
  | "father"
  | "spouse"
  | "child"
  | "sibling"
  | "friend"
  | "pet"
  | "other";

export interface CloneCreationDraft {
  cloneType?: CloneType;
  name?: string;
  username?: string;
  description?: string;
  relation?: MemlowRelation;
  category?: string;
  interests?: string[];
  imageFile?: string;
  rightsAcknowledged?: boolean;
  voiceSampleId?: string;
  voiceFile?: string;
  voiceScriptId?: string;
  recordDuration?: number;
  visibility?: Visibility;
  coownerInvites?: string[];
}
