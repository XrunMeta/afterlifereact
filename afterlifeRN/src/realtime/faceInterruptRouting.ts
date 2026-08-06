

import type { SpeakerHandoffEvent } from './speakerHandoff';

export function shouldSkipUnknownFaceEntry(
  event: SpeakerHandoffEvent,
  prevNaming: boolean,
  micOn: boolean,
): boolean {
  return event.type === 'UNKNOWN_FACE' && !prevNaming && !micOn;
}

export function computeFaceKey(
  event: SpeakerHandoffEvent,
  prevNaming: boolean,
  nextNaming: boolean,
  prevSessionId: number,
): { faceKey: string; nextSessionId: number } {
  if (event.type === 'SPEAKER_CONFIRMED') {
    return { faceKey: `p${event.personId}`, nextSessionId: prevSessionId };
  }
  const nextSessionId = !prevNaming && nextNaming ? prevSessionId + 1 : prevSessionId;
  return { faceKey: `unknown-${nextSessionId}`, nextSessionId };
}
