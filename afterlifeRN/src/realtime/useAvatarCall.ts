

import { CALL_ROUTE, type CallRoute } from '../config/callRoute';
import { useLiveAvatar } from './useLiveAvatar';
import { usePrethirdAvatar } from './usePrethirdAvatar';
import { useCallConfigStore } from '../stores/callConfigStore';
import type { UseAvatarCall } from './avatarCall';

const ROUTES: Record<CallRoute, UseAvatarCall> = {
  second: useLiveAvatar as unknown as UseAvatarCall,
  prethird: usePrethirdAvatar as unknown as UseAvatarCall,

};

const VALID: readonly CallRoute[] = ['prethird', 'second'];

export function resolveSessionRoute(): CallRoute {
  const r = useCallConfigStore.getState().callRoute;
  return (VALID as readonly string[]).includes(r) ? r : CALL_ROUTE;
}

let _sessionRoute: CallRoute | undefined;

export function __resetSessionRoute(): void {
  _sessionRoute = undefined;
}

function getSessionRoute(): CallRoute {
  return (_sessionRoute ??= resolveSessionRoute());
}

export const useAvatarCall: UseAvatarCall = ((opts) =>
  ROUTES[getSessionRoute()](opts)) as UseAvatarCall;
