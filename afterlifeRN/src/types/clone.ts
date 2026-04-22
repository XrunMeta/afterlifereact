import type { v_d79d7f, v_b0b271 } from "./domain";

export type {
  DomainClone as v_affcc0,
  v_d79d7f,
  CloneStatus,
  v_b0b271,
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
  cloneType?: v_d79d7f;
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
  visibility?: v_b0b271;
  coownerInvites?: string[];
}
