
import type { v_3f42e4 } from './handsFree';

export const v_dd26b1 = {
  listening: '#2fbf6b', 
  sending: '#3b82f6',   
  speaking: '#e5484d',  
  stalled: '#ffffff',   
} as const;

export function v_972fad(
  phase: v_3f42e4,
  v_b3ae82 = true,
  v_e43075 = false,
): string | null {
  switch (v_ab4803) {
    case 'listening':
    case 'confirming':

      if (v_e43075) return v_dd26b1.speaking;
      return v_b3ae82 ? v_dd26b1.listening : v_dd26b1.stalled;
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
