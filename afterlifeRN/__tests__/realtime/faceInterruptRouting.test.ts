

import { v_e500aa, v_bb26d8 } from '../../src/realtime/faceInterruptRouting';
import type { v_cdfa61 } from '../../src/realtime/speakerHandoff';

const UNKNOWN_FACE: v_cdfa61 = { type: 'UNKNOWN_FACE' };
const v_4e89c5 = (v_ca1ec5): v_cdfa61 =>
  ({ type: 'SPEAKER_CONFIRMED', personId: v_ca1ec5, name: '히즈키' });
const NAMING_TIMEOUT: v_cdfa61 = { type: 'NAMING_TIMEOUT' };

describe('shouldSkipUnknownFaceEntry (Important 1: 마이크 OFF 중 naming 시작 방지)', () => {
  it('마이크 OFF + naming 미시작 상태의 UNKNOWN_FACE 는 스킵한다', () => {
    expect(v_e500aa(v_5d3f7d, false, false)).toBe(true);
  });

  it('마이크 ON 이면 UNKNOWN_FACE 를 스킵하지 않는다', () => {
    expect(v_e500aa(v_5d3f7d, false, true)).toBe(false);
  });

  it('이미 naming 중이면 마이크 OFF 여도 스킵하지 않는다(리듀서 자체 중복무시에 맡김)', () => {
    expect(v_e500aa(v_5d3f7d, true, false)).toBe(false);
  });

  it('UNKNOWN_FACE 가 아닌 이벤트는 마이크 OFF 여도 절대 스킵하지 않는다', () => {
    expect(v_e500aa(v_4e89c5(1), false, false)).toBe(false);
    expect(v_e500aa(v_7a1eeb, false, false)).toBe(false);
  });
});

describe('computeFaceKey (Important 2: unknown 세션 충돌 방지)', () => {
  it('SPEAKER_CONFIRMED 는 personId 기반 안정 키를 쓰고 세션번호를 건드리지 않는다', () => {
    const v_cb35cb = v_bb26d8(v_4e89c5(42), false, false, 3);
    expect(v_cb35cb).toEqual({ faceKey: 'p42', nextSessionId: 3 });
  });

  it('같은 사람이 연속 확정되면 매번 동일한 키가 나온다(중복 무시 전제 조건)', () => {
    const v_2d1eeb = v_bb26d8(v_4e89c5(7), false, false, 0);
    const v_b96973 = v_bb26d8(v_4e89c5(7), false, false, v_2d1eeb.nextSessionId);
    expect(v_2d1eeb.faceKey).toBe(v_b96973.faceKey);
  });

  it('naming 이 새로 시작될 때(false→true)만 세션번호가 올라간다', () => {
    const v_cb35cb = v_bb26d8(v_5d3f7d, false, true, 0);
    expect(v_cb35cb).toEqual({ faceKey: 'unknown-1', nextSessionId: 1 });
  });

  it('이미 naming 중(true→true, reducer 중복무시 경로)이면 세션번호를 유지한다', () => {
    const v_cb35cb = v_bb26d8(v_5d3f7d, true, true, 1);
    expect(v_cb35cb).toEqual({ faceKey: 'unknown-1', nextSessionId: 1 });
  });

  it('naming 종료(true→false, 예: NAMING_TIMEOUT)는 세션번호를 유지한다', () => {
    const v_cb35cb = v_bb26d8(v_7a1eeb, true, false, 1);
    expect(v_cb35cb).toEqual({ faceKey: 'unknown-1', nextSessionId: 1 });
  });

  it('회귀 재현: 세션1 타임아웃 후 시작된 세션2 는 세션1과 다른 키를 받는다', () => {

    const v_dd2218 = v_bb26d8(v_5d3f7d, false, true, 0);
    expect(v_dd2218.faceKey).toBe('unknown-1');

    const v_4b10bb = v_bb26d8(v_7a1eeb, true, false, v_dd2218.nextSessionId);
    expect(v_4b10bb.nextSessionId).toBe(v_dd2218.nextSessionId);

    const v_bbda81 = v_bb26d8(v_5d3f7d, false, true, v_4b10bb.nextSessionId);
    expect(v_bbda81.faceKey).toBe('unknown-2');
    expect(v_bbda81.faceKey).not.toBe(v_dd2218.faceKey); 
  });
});
