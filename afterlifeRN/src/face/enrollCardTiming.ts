

import type { HandsFreePhase } from '../realtime/handsFree';

export function canRevealEnrollCard(phase: HandsFreePhase): boolean {
  return phase === 'listening';
}
