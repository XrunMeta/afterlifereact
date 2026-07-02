

import { v_c6d1f4, type v_6c5d04 } from '../config/callRoute';
import { v_b38a7e } from './useLiveAvatar';
import { v_3d8d48 } from './usePrethirdAvatar';
import { v_5b540b } from '../stores/callConfigStore';
import type { v_2c1649 } from './avatarCall';

const ROUTES: Record<v_6c5d04, v_2c1649> = {
  second: v_b38a7e as unknown as v_2c1649,
  prethird: v_3d8d48 as unknown as v_2c1649,

};

const VALID: readonly v_6c5d04[] = ['prethird', 'second'];

export function v_dc8a4c(): v_6c5d04 {
  const v_cb35cb = v_5b540b.getState().callRoute;
  return (v_da0605 as readonly string[]).includes(v_cb35cb) ? v_cb35cb : v_c6d1f4;
}

let _sessionRoute: v_6c5d04 | undefined;

export function v_99b4fa(): void {
  v_0f1b19 = undefined;
}

function v_98fc88(): v_6c5d04 {
  return (v_0f1b19 ??= v_dc8a4c());
}

export const useAvatarCall: v_2c1649 = ((v_328259) =>
  v_ce4741[v_98fc88()](v_328259)) as v_2c1649;
