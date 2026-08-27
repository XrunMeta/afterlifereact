

import { CALL_ROUTE, type CallRoute } from '../config/callRoute';
import { useLiveAvatar } from './useLiveAvatar';
import { usePrethirdAvatar } from './usePrethirdAvatar';
import { useVisemeAvatar } from './useVisemeAvatar';
import { useCallConfigStore } from '../stores/callConfigStore';
import type { UseAvatarCall } from './avatarCall';

const ROUTES: Record<CallRoute, UseAvatarCall> = {
  second: useLiveAvatar as unknown as UseAvatarCall,
  prethird: usePrethirdAvatar as unknown as UseAvatarCall,
  viseme_playback: useVisemeAvatar as unknown as UseAvatarCall,

};

const VALID: readonly CallRoute[] = ['prethird', 'second', 'viseme_playback'];

export function resolveSessionRoute(pipeline?: string | null): CallRoute {
  if (pipeline === 'viseme_playback') return 'viseme_playback';
  const r = useCallConfigStore.getState().callRoute;
  return (VALID as readonly string[]).includes(r) ? r : CALL_ROUTE;
}

let _sessionRoute: CallRoute | undefined;

export function __resetSessionRoute(): void {
  _sessionRoute = undefined;
}

function getSessionRoute(pipeline?: string | null): CallRoute {
  return (_sessionRoute ??= resolveSessionRoute(pipeline));
}

export const useAvatarCall: UseAvatarCall = ((opts) =>
  ROUTES[getSessionRoute(opts.pipeline)](opts)) as UseAvatarCall;
