

import type { v_d79d7f } from '../types/clone';

export interface CloneTypeMeta {
  id: v_d79d7f;
  iconName: string;
  label: string;
  desc: string;
  defaultVisibility: 'public' | 'private' | 'followers';
  visibilityLocked: boolean;
}

export const v_aad223 = [
  { id: 'friend', iconName: 'users', label: 'create.type.defaultLabel',
    desc: 'create.type.defaultShortDesc', defaultVisibility: 'public', visibilityLocked: false },
] as const;

export function v_c4c43f(id: v_d79d7f): CloneTypeMeta {
  const v_35f85c = v_aad223.find(v_8d41d7 => v_8d41d7.id === v_389afb);
  if (!v_35f85c) throw new Error(`Unknown cloneType: ${v_389afb}`);
  return v_35f85c;
}
