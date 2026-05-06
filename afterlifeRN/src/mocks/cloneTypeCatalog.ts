import type { CloneType, MemlowRelation } from '../types/clone';

export interface CloneTypeMeta {
  id: CloneType;
  iconName: string;
  label: string;
  desc: string;
  defaultVisibility: 'public' | 'private' | 'followers';
  visibilityLocked: boolean;
}

export const CLONE_TYPES: readonly CloneTypeMeta[] = [
  { id: 'memlow', iconName: 'heart', label: 'create.type.memlowLabel',
    desc: 'create.type.memlowShortDesc', defaultVisibility: 'private', visibilityLocked: true },
  { id: 'friend', iconName: 'users', label: 'create.type.defaultLabel',
    desc: 'create.type.defaultShortDesc', defaultVisibility: 'public', visibilityLocked: false },
] as const;

export function getCloneTypeMeta(id: CloneType): CloneTypeMeta {
  const m = CLONE_TYPES.find(t => t.id === id);
  if (!m) throw new Error(`Unknown cloneType: ${id}`);
  return m;
}

export interface MemlowRelationOption { id: MemlowRelation; label: string; }

export const MEMLOW_RELATIONS: readonly MemlowRelationOption[] = [
  { id: 'mother', label: 'create.relations.mother' },
  { id: 'father', label: 'create.relations.father' },
  { id: 'spouse', label: 'create.relations.spouse' },
  { id: 'child', label: 'create.relations.child' },
  { id: 'sibling', label: 'create.relations.sibling' },
  { id: 'friend', label: 'create.relations.friend' },
  { id: 'pet', label: 'create.relations.pet' },
  { id: 'other', label: 'create.relations.other' },
] as const;

export interface MemlowVoiceScript { id: string; title: string; text: string; }
export const MEMLOW_VOICE_SCRIPTS: readonly MemlowVoiceScript[] = [
  { id: 's1', title: '편지 1 — 일상',
    text: '오늘 하루는 어땠어. 네가 좋아하던 국을 끓였어. 예전에 우리가 함께 앉아 이야기하던 그 저녁이 자꾸 떠올라.' },
  { id: 's2', title: '편지 2 — 위로',
    text: '혹시 지금 힘든 일이 있다면, 너무 혼자 짊어지지 마. 내가 곁에 없어도, 네 안에 내가 남긴 따뜻한 말이 있을 거야.' },
  { id: 's3', title: '편지 3 — 추억',
    text: '우리가 같이 걸었던 그 길 기억나. 바람이 좋았고, 네 웃음이 더 좋았지. 그 순간을 꺼내 보며 편지를 남겨.' },
] as const;
