import type { CloneType, Visibility } from "./domain";

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

export const PERSONA_AGE_OPTIONS = ['10대', '20대', '30대', '40대', '50대', '60대 이상'] as const;
export const PERSONA_GENDER_OPTIONS = ['남성', '여성', '기타'] as const;
export const PERSONA_TYPE_OPTIONS = [
  { id: 'extrovert', label: '외향적인' },
  { id: 'introvert', label: '내향적인' },
  { id: 'logical', label: '논리적인' },
  { id: 'emotional', label: '감정적인' },
  { id: 'free', label: '자유로운' },
  { id: 'organized', label: '체계적인' },
  { id: 'passionate', label: '열정적인' },
  { id: 'calm', label: '평온한' },
] as const;
export const PERSONA_MBTI_OPTIONS = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
  '모름',
] as const;
export type PersonaAge = typeof PERSONA_AGE_OPTIONS[number];
export type PersonaGender = typeof PERSONA_GENDER_OPTIONS[number];
export type PersonaTypeId = typeof PERSONA_TYPE_OPTIONS[number]['id'];
export type PersonaMbti = typeof PERSONA_MBTI_OPTIONS[number];

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

  personaAge?: PersonaAge;
  personaGender?: PersonaGender;
  personaTypes?: PersonaTypeId[];
  personaMbti?: PersonaMbti;
  personaNotes?: string;

  pin?: string;

  personaAnswers?: Record<string, string>;
}
