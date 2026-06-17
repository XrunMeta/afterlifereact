

import { CALL_ROUTE, type CallRoute } from '../config/callRoute';
import { useLiveAvatar } from './useLiveAvatar';
import { usePrethirdAvatar } from './usePrethirdAvatar';
import type { UseAvatarCall } from './avatarCall';

const ROUTES: Record<CallRoute, UseAvatarCall> = {
  second: useLiveAvatar as unknown as UseAvatarCall,
  prethird: usePrethirdAvatar as unknown as UseAvatarCall,

};

export const useAvatarCall: UseAvatarCall = ROUTES[CALL_ROUTE];
