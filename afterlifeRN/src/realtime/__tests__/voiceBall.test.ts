

import {
  v_d08429,
  v_d45de2,
  v_d6dc8c,
  v_3032b0,
  v_5c8991,
  v_80c227,
  v_a1197d,
  v_e744f2,
} from '../voiceBall';
import type { v_3f42e4 } from '../handsFree';

describe('normalizeMicLevel', () => {
  it('하한(-2)은 0', () => {
    expect(v_d08429(-2)).toBe(0);
  });
  it('0은 하한(-2)~상한(10) 사이 비율로 정규화된다', () => {

    expect(v_d08429(0)).toBeCloseTo(2 / 12, 5);
  });
  it('상한(10)은 1', () => {
    expect(v_d08429(10)).toBe(1);
  });
  it('상한 초과(12)는 1로 clamp', () => {
    expect(v_d08429(12)).toBe(1);
  });
  it('하한 미만은 0으로 clamp', () => {
    expect(v_d08429(-10)).toBe(0);
  });
});

describe('ballVisualForPhase', () => {
  it('idle — 회색, pulse 없음, orbit 정지, 라벨 없음', () => {
    const v_81e2ef = v_d45de2('idle');
    expect(v_81e2ef).toEqual({ color: v_5c8991.idle, pulseSource: 'none', orbit: false, label: null });
  });
  it('listening — 녹색, mic pulse, orbit 회전, "입력중"', () => {
    const v_81e2ef = v_d45de2('listening');
    expect(v_81e2ef).toEqual({ color: v_5c8991.listening, pulseSource: 'mic', orbit: true, label: '입력중' });
  });
  it('confirming — 녹색, mic pulse, orbit 회전, "입력중"', () => {
    const v_81e2ef = v_d45de2('confirming');
    expect(v_81e2ef).toEqual({ color: v_5c8991.confirming, pulseSource: 'mic', orbit: true, label: '입력중' });
  });
  it('sending — 파랑, pulse 없음, orbit 정지, 라벨 없음', () => {
    const v_81e2ef = v_d45de2('sending');
    expect(v_81e2ef).toEqual({ color: v_5c8991.sending, pulseSource: 'none', orbit: false, label: null });
  });
  it('greeting — 파랑, clone pulse, orbit 정지, "발화중"', () => {
    const v_81e2ef = v_d45de2('greeting');
    expect(v_81e2ef).toEqual({ color: v_5c8991.greeting, pulseSource: 'clone', orbit: false, label: '발화중' });
  });
  it('speaking — 파랑, clone pulse, orbit 정지, "발화중"', () => {
    const v_81e2ef = v_d45de2('speaking');
    expect(v_81e2ef).toEqual({ color: v_5c8991.speaking, pulseSource: 'clone', orbit: false, label: '발화중' });
  });
  it('paused — 회색, pulse 없음, orbit 정지(멈춤), 라벨 없음', () => {
    const v_81e2ef = v_d45de2('paused');
    expect(v_81e2ef).toEqual({ color: v_5c8991.paused, pulseSource: 'none', orbit: false, label: null });
  });

  it('모든 HandsFreePhase 값을 커버한다', () => {
    const phases: v_3f42e4[] = [
      'idle', 'greeting', 'listening', 'confirming', 'sending', 'speaking', 'paused',
    ];
    for (const v_e2a85c of v_1d3ddb) {
      expect(() => v_d45de2(v_e2a85c)).not.toThrow();
    }
  });
});

describe('radiusForLevel (반환값=지름 px)', () => {
  const v_05b441 = v_80c227;
  it('level=0 → min(지름 28px)', () => {
    expect(v_d6dc8c(0, v_05b441)).toBeCloseTo(v_05b441.min, 5);
    expect(v_d6dc8c(0, v_05b441)).toBe(28);
  });
  it('level=1 → max(지름 88px)', () => {
    expect(v_d6dc8c(1, v_05b441)).toBeCloseTo(v_05b441.max, 5);
    expect(v_d6dc8c(1, v_05b441)).toBe(88);
  });
  it('level=0.5 → min과 max 사이 보간', () => {
    const v_cb35cb = v_d6dc8c(0.5, v_05b441);
    expect(v_cb35cb).toBeGreaterThan(v_05b441.min);
    expect(v_cb35cb).toBeLessThan(v_05b441.max);
    expect(v_cb35cb).toBeCloseTo((v_05b441.min + v_05b441.max) / 2, 5);
  });
  it('idle=true — base×idleScale (level 무시) — 지름 24px', () => {
    expect(v_d6dc8c(0, v_05b441, true)).toBeCloseTo(v_05b441.base * v_05b441.idleScale, 5);
    expect(v_d6dc8c(1, v_05b441, true)).toBeCloseTo(v_05b441.base * v_05b441.idleScale, 5);
    expect(v_d6dc8c(0, v_05b441, true)).toBe(24);
  });
  it('level이 1 초과해도 max로 clamp', () => {
    expect(v_d6dc8c(1.5, v_05b441)).toBeCloseTo(v_05b441.max, 5);
  });
  it('level이 음수여도 min 이하로 내려가지 않음(0으로 clamp)', () => {
    expect(v_d6dc8c(-0.5, v_05b441)).toBeCloseTo(v_05b441.min, 5);
  });
});

describe('shouldUpdateLevel (BLOCKER2 — setState 폭주 방지 gate)', () => {
  it('epsilon 미만 변화는 false(무시)', () => {
    expect(v_3032b0(0.5, 0.5 + v_e744f2 / 2)).toBe(false);
  });
  it('epsilon 이상 변화는 true', () => {
    expect(v_3032b0(0.5, 0.5 + v_e744f2)).toBe(true);
  });
  it('0→양수(미세값이라도) 전환은 true — 발화 시작을 놓치지 않음', () => {
    expect(v_3032b0(0, 0.001)).toBe(true);
  });
  it('양수→0 전환도 true — 발화 종료를 놓치지 않음', () => {
    expect(v_3032b0(0.3, 0)).toBe(true);
  });
  it('동일값(0→0)은 false', () => {
    expect(v_3032b0(0, 0)).toBe(false);
  });
});

describe('2026-07-23 인디케이터 UX 명확화', () => {
  it('마이크 닫힘 상태(sending/speaking/greeting)는 파란색', () => {
    expect(v_5c8991.sending).toBe('#3b82f6');
    expect(v_5c8991.speaking).toBe('#3b82f6');
    expect(v_5c8991.greeting).toBe('#3b82f6');
  });
  it('orbit은 마이크 열림(listening/confirming)에서만 true', () => {
    expect(v_d45de2('listening').orbit).toBe(true);
    expect(v_d45de2('confirming').orbit).toBe(true);
    for (const v_e2a85c of ['sending', 'speaking', 'greeting', 'idle', 'paused'] as const) {
      expect(v_d45de2(v_e2a85c).orbit).toBe(false);
    }
  });
  it('orbit 궤도 반경은 볼 최대원 내접(트랙+dot ≤ 최대반지름), 불투명도 0.3 이하', () => {
    expect(v_a1197d.trackRadius + v_a1197d.dotRadius).toBeLessThanOrEqual(v_80c227.max / 2);
    expect(v_a1197d.opacity).toBeLessThanOrEqual(0.3);
  });
});
