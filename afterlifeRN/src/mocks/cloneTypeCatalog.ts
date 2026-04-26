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
  { id: 'memlow', iconName: 'heart', label: '떠난 소중한 이',
    desc: '함께한 시간을 대화로 이어갑니다', defaultVisibility: 'private', visibilityLocked: true },
  { id: 'friend', iconName: 'users', label: '일반',
    desc: '친구·멘토·유명인 등 자유 페르소나', defaultVisibility: 'public', visibilityLocked: false },
] as const;

export function getCloneTypeMeta(id: CloneType): CloneTypeMeta {
  const m = CLONE_TYPES.find(t => t.id === id);
  if (!m) throw new Error(`Unknown cloneType: ${id}`);
  return m;
}

export interface MemlowRelationOption { id: MemlowRelation; label: string; }
export const MEMLOW_RELATIONS: readonly MemlowRelationOption[] = [
  { id: 'mother', label: '어머니' },
  { id: 'father', label: '아버지' },
  { id: 'spouse', label: '배우자' },
  { id: 'child', label: '자녀' },
  { id: 'sibling', label: '형제자매' },
  { id: 'friend', label: '친구' },
  { id: 'pet', label: '반려동물' },
  { id: 'other', label: '기타' },
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
