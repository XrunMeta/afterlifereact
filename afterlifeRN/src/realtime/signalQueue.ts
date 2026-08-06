

import type { SpeechSignal } from './avatarCall';

export const SIGNAL_QUEUE_MAX = 256;

const EMPTY: readonly SpeechSignal[] = [];

export function appendSignal(
  prev: readonly SpeechSignal[],
  sig: SpeechSignal,
): SpeechSignal[] {
  const next = prev.concat([sig]);
  return next.length > SIGNAL_QUEUE_MAX ? next.slice(next.length - SIGNAL_QUEUE_MAX) : next;
}

export function takeNewSignals(
  queue: readonly SpeechSignal[] | null | undefined,
  cursorId: number,
): readonly SpeechSignal[] {
  if (!queue || queue.length === 0) return EMPTY;
  let i = queue.length;
  while (i > 0 && queue[i - 1].id > cursorId) i -= 1;
  if (i === queue.length) return EMPTY;
  return i === 0 ? queue : queue.slice(i);
}

export function nextCursor(taken: readonly SpeechSignal[], cursorId: number): number {
  return taken.length > 0 ? taken[taken.length - 1].id : cursorId;
}
