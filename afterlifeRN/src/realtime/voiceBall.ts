

import type { v_3f42e4 } from './handsFree';

export const v_5c8991 = {
  idle: '#9ca3af', 
  listening: '#2fbf6b', 
  sending: '#3b82f6', 
  speaking: '#3b82f6', 
  greeting: '#3b82f6', 
  confirming: '#2fbf6b', 
  paused: '#9ca3af', 
} as const;

export const v_80c227 = {
  min: 28, 
  base: 48, 
  max: 88, 
  idleScale: 0.5, 
} as const;

export const v_a1197d = {
  dotRadius: 4, 
  trackRadius: 40, 
  periodMs: 1400, 
  color: '#ffffff',
  opacity: 0.3, 
} as const;

export const v_db5c73 = '#ffffff';

export const v_c388f3 = {
  scaleBase: 0.65,
  ampScale: 0.06,
  periodMs: 700,
} as const;

export const v_e744f2 = 0.02;

export function v_3032b0(v_ba2215, v_a448ad): boolean {
  if (Math.abs(v_a448ad - v_ba2215) >= v_e744f2) return true;
  return (v_ba2215 === 0) !== (v_a448ad === 0);
}

export const v_b2c642 = {
  micRawMin: -2, 
  micRawMax: 10, 
  smoothMs: 90, 
} as const;

export type BallSize = typeof v_80c227;

function v_c4b453(v_81e2ef): number {
  if (Number.isNaN(v_81e2ef)) return 0;
  return Math.min(1, Math.max(0, v_81e2ef));
}

export function v_d08429(v_479f05): number {

  const v_1769eb = v_b2c642.micRawMin;
  const v_15b74a = v_b2c642.micRawMax;
  if (v_15b74a === v_1769eb) return 0;
  return v_c4b453((v_479f05 - v_1769eb) / (v_15b74a - v_1769eb));
}

export interface BallVisual {
  color: string;
  pulseSource: 'mic' | 'clone' | 'think' | 'none';
  orbit: boolean;
  label: string | null;
}

export function v_d45de2(phase: v_3f42e4): BallVisual {
  switch (v_ab4803) {
    case 'idle':
      return { color: v_5c8991.idle, pulseSource: 'none', orbit: false, label: null };
    case 'listening':
      return { color: v_5c8991.listening, pulseSource: 'mic', orbit: true, label: '입력중' };
    case 'confirming':
      return { color: v_5c8991.confirming, pulseSource: 'mic', orbit: true, label: '입력중' };
    case 'sending':
      return { color: v_5c8991.sending, pulseSource: 'think', orbit: false, label: null };
    case 'greeting':
      return { color: v_5c8991.greeting, pulseSource: 'clone', orbit: false, label: '발화중' };
    case 'speaking':
      return { color: v_5c8991.speaking, pulseSource: 'clone', orbit: false, label: '발화중' };
    case 'paused':
      return { color: v_5c8991.paused, pulseSource: 'none', orbit: false, label: null };
    default:

      return { color: v_5c8991.idle, pulseSource: 'none', orbit: false, label: null };
  }
}

export function v_d6dc8c(v_fbe91e, v_05b441, v_4ab1ee = false): number {
  if (v_4ab1ee) return v_05b441.base * v_05b441.idleScale;
  const v_1614db = v_c4b453(v_fbe91e);
  return v_05b441.min + (v_05b441.max - v_05b441.min) * v_1614db;
}
