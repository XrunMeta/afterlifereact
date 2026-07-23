

import {
  normalizeMicLevel,
  ballVisualForPhase,
  radiusForLevel,
  shouldUpdateLevel,
  BALL_COLORS,
  BALL_SIZE,
  BALL_ORBIT,
  BALL_LEVEL_EPSILON,
  BALL_THINK,
} from '../voiceBall';
import type { HandsFreePhase } from '../handsFree';

describe('normalizeMicLevel', () => {
  it('하한(-2)은 0', () => {
    expect(normalizeMicLevel(-2)).toBe(0);
  });
  it('0은 하한(-2)~상한(10) 사이 비율로 정규화된다', () => {

    expect(normalizeMicLevel(0)).toBeCloseTo(2 / 12, 5);
  });
  it('상한(10)은 1', () => {
    expect(normalizeMicLevel(10)).toBe(1);
  });
  it('상한 초과(12)는 1로 clamp', () => {
    expect(normalizeMicLevel(12)).toBe(1);
  });
  it('하한 미만은 0으로 clamp', () => {
    expect(normalizeMicLevel(-10)).toBe(0);
  });
});

describe('ballVisualForPhase', () => {
  it('idle — 회색, pulse 없음, orbit 정지, 라벨 없음', () => {
    const v = ballVisualForPhase('idle');
    expect(v).toEqual({ color: BALL_COLORS.idle, pulseSource: 'none', orbit: false, label: null });
  });
  it('listening — 녹색, mic pulse, orbit 회전, "입력중"', () => {
    const v = ballVisualForPhase('listening');
    expect(v).toEqual({ color: BALL_COLORS.listening, pulseSource: 'mic', orbit: true, label: '입력중' });
  });
  it('confirming — 녹색, mic pulse, orbit 회전, "입력중"', () => {
    const v = ballVisualForPhase('confirming');
    expect(v).toEqual({ color: BALL_COLORS.confirming, pulseSource: 'mic', orbit: true, label: '입력중' });
  });
  it('sending — 파랑, think pulse(생각 중 축소+맥동), orbit 정지, 라벨 없음', () => {
    const v = ballVisualForPhase('sending');
    expect(v).toEqual({ color: BALL_COLORS.sending, pulseSource: 'think', orbit: false, label: null });
  });
  it('greeting — 파랑, clone pulse, orbit 정지, "발화중"', () => {
    const v = ballVisualForPhase('greeting');
    expect(v).toEqual({ color: BALL_COLORS.greeting, pulseSource: 'clone', orbit: false, label: '발화중' });
  });
  it('speaking — 파랑, clone pulse, orbit 정지, "발화중"', () => {
    const v = ballVisualForPhase('speaking');
    expect(v).toEqual({ color: BALL_COLORS.speaking, pulseSource: 'clone', orbit: false, label: '발화중' });
  });
  it('paused — 회색, pulse 없음, orbit 정지(멈춤), 라벨 없음', () => {
    const v = ballVisualForPhase('paused');
    expect(v).toEqual({ color: BALL_COLORS.paused, pulseSource: 'none', orbit: false, label: null });
  });

  it('모든 HandsFreePhase 값을 커버한다', () => {
    const phases: HandsFreePhase[] = [
      'idle', 'greeting', 'listening', 'confirming', 'sending', 'speaking', 'paused',
    ];
    for (const p of phases) {
      expect(() => ballVisualForPhase(p)).not.toThrow();
    }
  });
});

describe('radiusForLevel (반환값=지름 px)', () => {
  const size = BALL_SIZE;
  it('level=0 → min(지름 28px)', () => {
    expect(radiusForLevel(0, size)).toBeCloseTo(size.min, 5);
    expect(radiusForLevel(0, size)).toBe(28);
  });
  it('level=1 → max(지름 88px)', () => {
    expect(radiusForLevel(1, size)).toBeCloseTo(size.max, 5);
    expect(radiusForLevel(1, size)).toBe(88);
  });
  it('level=0.5 → min과 max 사이 보간', () => {
    const r = radiusForLevel(0.5, size);
    expect(r).toBeGreaterThan(size.min);
    expect(r).toBeLessThan(size.max);
    expect(r).toBeCloseTo((size.min + size.max) / 2, 5);
  });
  it('idle=true — base×idleScale (level 무시) — 지름 24px', () => {
    expect(radiusForLevel(0, size, true)).toBeCloseTo(size.base * size.idleScale, 5);
    expect(radiusForLevel(1, size, true)).toBeCloseTo(size.base * size.idleScale, 5);
    expect(radiusForLevel(0, size, true)).toBe(24);
  });
  it('level이 1 초과해도 max로 clamp', () => {
    expect(radiusForLevel(1.5, size)).toBeCloseTo(size.max, 5);
  });
  it('level이 음수여도 min 이하로 내려가지 않음(0으로 clamp)', () => {
    expect(radiusForLevel(-0.5, size)).toBeCloseTo(size.min, 5);
  });
});

describe('shouldUpdateLevel (BLOCKER2 — setState 폭주 방지 gate)', () => {
  it('epsilon 미만 변화는 false(무시)', () => {
    expect(shouldUpdateLevel(0.5, 0.5 + BALL_LEVEL_EPSILON / 2)).toBe(false);
  });
  it('epsilon 이상 변화는 true', () => {
    expect(shouldUpdateLevel(0.5, 0.5 + BALL_LEVEL_EPSILON)).toBe(true);
  });
  it('0→양수(미세값이라도) 전환은 true — 발화 시작을 놓치지 않음', () => {
    expect(shouldUpdateLevel(0, 0.001)).toBe(true);
  });
  it('양수→0 전환도 true — 발화 종료를 놓치지 않음', () => {
    expect(shouldUpdateLevel(0.3, 0)).toBe(true);
  });
  it('동일값(0→0)은 false', () => {
    expect(shouldUpdateLevel(0, 0)).toBe(false);
  });
});

describe('2026-07-23 인디케이터 UX 명확화', () => {
  it('마이크 닫힘 상태(sending/speaking/greeting)는 파란색', () => {
    expect(BALL_COLORS.sending).toBe('#3b82f6');
    expect(BALL_COLORS.speaking).toBe('#3b82f6');
    expect(BALL_COLORS.greeting).toBe('#3b82f6');
  });
  it('orbit은 마이크 열림(listening/confirming)에서만 true', () => {
    expect(ballVisualForPhase('listening').orbit).toBe(true);
    expect(ballVisualForPhase('confirming').orbit).toBe(true);
    for (const p of ['sending', 'speaking', 'greeting', 'idle', 'paused'] as const) {
      expect(ballVisualForPhase(p).orbit).toBe(false);
    }
  });
  it('orbit 궤도 반경은 볼 최대원 내접(트랙+dot ≤ 최대반지름), 불투명도 0.3 이하', () => {
    expect(BALL_ORBIT.trackRadius + BALL_ORBIT.dotRadius).toBeLessThanOrEqual(BALL_SIZE.max / 2);
    expect(BALL_ORBIT.opacity).toBeLessThanOrEqual(0.3);
  });
});

describe('T-151 Task12 — 생각 중(sending) 축소+맥동', () => {
  it('sending phase는 pulseSource=think', () => {
    expect(ballVisualForPhase('sending').pulseSource).toBe('think');
  });
  it('BALL_THINK — base 지름 48×0.65≈31px, ±6% 맥동, 0.7s 주기', () => {
    expect(BALL_THINK.scaleBase).toBe(0.65);
    expect(BALL_SIZE.base * BALL_THINK.scaleBase).toBeCloseTo(31.2, 5);
    expect(BALL_THINK.ampScale).toBe(0.06);
    expect(BALL_THINK.periodMs).toBe(700);
  });
  it('sending 축소 지름은 base(정적 기준)보다 작다', () => {
    expect(BALL_SIZE.base * BALL_THINK.scaleBase).toBeLessThan(BALL_SIZE.base);
  });
});
