import type { v_d79d7f, v_b0b271 } from "./domain";

export type PersonaQuestionType = 'gemma_choice' | 'fixed_choice' | 'text';

export interface PersonaQuestion {
  key: string;
  type: PersonaQuestionType;
  label: string;
  targetField?: string;
  options?: string[];
  options_include?: string[];
  showWhen?: Record<string, string>;
  optional?: boolean;
}

export type {
  DomainClone as v_affcc0,
  v_d79d7f,
  CloneStatus,
  v_b0b271,
} from "./domain";

export type MemlowRelation =
  | "self"
  | "mother"
  | "father"
  | "spouse"
  | "child"
  | "sibling"
  | "friend"
  | "pet"
  | "other";

export const v_b95daf = ['10대', '20대', '30대', '40대', '50대', '60대 이상'] as const;
export const v_f17565 = ['남성', '여성'] as const;
export const v_2934e9 = [
  { id: 'extrovert', label: '외향적인' },
  { id: 'introvert', label: '내향적인' },
  { id: 'logical', label: '논리적인' },
  { id: 'emotional', label: '감정적인' },
  { id: 'free', label: '자유로운' },
  { id: 'organized', label: '체계적인' },
  { id: 'passionate', label: '열정적인' },
  { id: 'calm', label: '평온한' },
] as const;
export const v_336485 = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;
export type PersonaAge = typeof v_b95daf[number];
export type PersonaGender = typeof v_f17565[number];
export type PersonaTypeId = typeof v_2934e9[number]['id'];
export type PersonaMbti = typeof v_336485[number];

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

  personaAge?: PersonaAge;
  personaGender?: PersonaGender;
  personaTypes?: PersonaTypeId[];
  personaMbti?: PersonaMbti;
  personaNotes?: string;

  pin?: string;

  personaAnswers?: Record<string, string>;

  voiceMode?: "upload" | "record" | "preset";

  voicePresetId?: number;

  idleVideoJobId?: string;
  voiceCloneJobId?: string;

  avatarFileId?: number;
  avatarUrl?: string;
}
