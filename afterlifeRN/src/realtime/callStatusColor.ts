
import type { v_3f42e4 } from './handsFree';

export const v_dd26b1 = {
  listening: '#2fbf6b', 
  sending: '#3b82f6',   
  speaking: '#e5484d',  
} as const;

export function v_972fad(phase: v_3f42e4): string | null {
  switch (v_ab4803) {
    case 'listening':
    case 'confirming':
      return v_dd26b1.listening;
    case 'sending':
      return v_dd26b1.sending;
    case 'speaking':
      return v_dd26b1.speaking;
    case 'idle':
    case 'paused':
    default:
      return null;
  }
}
