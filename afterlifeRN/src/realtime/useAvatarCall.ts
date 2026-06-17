

import { v_c6d1f4, type v_6c5d04 } from '../config/callRoute';
import { v_b38a7e } from './useLiveAvatar';
import { v_3d8d48 } from './usePrethirdAvatar';
import type { v_2c1649 } from './avatarCall';

const ROUTES: Record<v_6c5d04, v_2c1649> = {
  second: v_b38a7e as unknown as v_2c1649,
  prethird: v_3d8d48 as unknown as v_2c1649,

};

export const useAvatarCall: v_2c1649 = v_ce4741[v_c6d1f4];
