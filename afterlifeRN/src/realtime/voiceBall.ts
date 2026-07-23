

import type { HandsFreePhase } from './handsFree';

export const BALL_COLORS = {
  idle: '#9ca3af', 
  listening: '#2fbf6b', 
  sending: '#3b82f6', 
  speaking: '#3b82f6', 
  greeting: '#3b82f6', 
  confirming: '#2fbf6b', 
  paused: '#9ca3af', 
} as const;

export const BALL_SIZE = {
  min: 28, 
  base: 48, 
  max: 88, 
  idleScale: 0.5, 
} as const;

export const BALL_ORBIT = {
  dotRadius: 4, 
  trackRadius: 40, 
  periodMs: 1400, 
  color: '#ffffff',
  opacity: 0.3, 
} as const;

export const BALL_LABEL_COLOR = '#ffffff';

export const BALL_THINK = {
  scaleBase: 0.65,
  ampScale: 0.06,
  periodMs: 700,
} as const;

export const BALL_LEVEL_EPSILON = 0.02;

export function shouldUpdateLevel(prev: number, next: number): boolean {
  if (Math.abs(next - prev) >= BALL_LEVEL_EPSILON) return true;
  return (prev === 0) !== (next === 0);
}

export const BALL_TUNING = {
  micRawMin: -2, 
  micRawMax: 10, 
  smoothMs: 90, 
} as const;

export type BallSize = typeof BALL_SIZE;

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.min(1, Math.max(0, v));
}

export function normalizeMicLevel(raw: number): number {

  const micRawMin: number = BALL_TUNING.micRawMin;
  const micRawMax: number = BALL_TUNING.micRawMax;
  if (micRawMax === micRawMin) return 0;
  return clamp01((raw - micRawMin) / (micRawMax - micRawMin));
}

export interface BallVisual {
  color: string;
  pulseSource: 'mic' | 'clone' | 'think' | 'none';
  orbit: boolean;
  label: string | null;
}

export function ballVisualForPhase(phase: HandsFreePhase): BallVisual {
  switch (phase) {
    case 'idle':
      return { color: BALL_COLORS.idle, pulseSource: 'none', orbit: false, label: null };
    case 'listening':
      return { color: BALL_COLORS.listening, pulseSource: 'mic', orbit: true, label: '입력중' };
    case 'confirming':
      return { color: BALL_COLORS.confirming, pulseSource: 'mic', orbit: true, label: '입력중' };
    case 'sending':
      return { color: BALL_COLORS.sending, pulseSource: 'think', orbit: false, label: null };
    case 'greeting':
      return { color: BALL_COLORS.greeting, pulseSource: 'clone', orbit: false, label: '발화중' };
    case 'speaking':
      return { color: BALL_COLORS.speaking, pulseSource: 'clone', orbit: false, label: '발화중' };
    case 'paused':
      return { color: BALL_COLORS.paused, pulseSource: 'none', orbit: false, label: null };
    default:

      return { color: BALL_COLORS.idle, pulseSource: 'none', orbit: false, label: null };
  }
}

export function radiusForLevel(level: number, size: BallSize, idle: boolean = false): number {
  if (idle) return size.base * size.idleScale;
  const l = clamp01(level);
  return size.min + (size.max - size.min) * l;
}
