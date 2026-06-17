
import type { HandsFreePhase } from './handsFree';

export const GLOW_COLORS = {
  listening: '#2fbf6b', 
  sending: '#3b82f6',   
  speaking: '#e5484d',  
} as const;

export function glowColorForPhase(phase: HandsFreePhase): string | null {
  switch (phase) {
    case 'listening':
    case 'confirming':
      return GLOW_COLORS.listening;
    case 'sending':
      return GLOW_COLORS.sending;
    case 'speaking':
      return GLOW_COLORS.speaking;
    case 'idle':
    case 'paused':
    default:
      return null;
  }
}
