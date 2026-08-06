

import { shouldSkipUnknownFaceEntry, computeFaceKey } from '../../src/realtime/faceInterruptRouting';
import type { SpeakerHandoffEvent } from '../../src/realtime/speakerHandoff';

const UNKNOWN_FACE: SpeakerHandoffEvent = { type: 'UNKNOWN_FACE' };
const CONFIRMED = (personId: number): SpeakerHandoffEvent =>
  ({ type: 'SPEAKER_CONFIRMED', personId, name: '히즈키' });
const NAMING_TIMEOUT: SpeakerHandoffEvent = { type: 'NAMING_TIMEOUT' };

describe('shouldSkipUnknownFaceEntry (Important 1: 마이크 OFF 중 naming 시작 방지)', () => {
  it('마이크 OFF + naming 미시작 상태의 UNKNOWN_FACE 는 스킵한다', () => {
    expect(shouldSkipUnknownFaceEntry(UNKNOWN_FACE, false, false)).toBe(true);
  });

  it('마이크 ON 이면 UNKNOWN_FACE 를 스킵하지 않는다', () => {
    expect(shouldSkipUnknownFaceEntry(UNKNOWN_FACE, false, true)).toBe(false);
  });

  it('이미 naming 중이면 마이크 OFF 여도 스킵하지 않는다(리듀서 자체 중복무시에 맡김)', () => {
    expect(shouldSkipUnknownFaceEntry(UNKNOWN_FACE, true, false)).toBe(false);
  });

  it('UNKNOWN_FACE 가 아닌 이벤트는 마이크 OFF 여도 절대 스킵하지 않는다', () => {
    expect(shouldSkipUnknownFaceEntry(CONFIRMED(1), false, false)).toBe(false);
    expect(shouldSkipUnknownFaceEntry(NAMING_TIMEOUT, false, false)).toBe(false);
  });
});

describe('computeFaceKey (Important 2: unknown 세션 충돌 방지)', () => {
  it('SPEAKER_CONFIRMED 는 personId 기반 안정 키를 쓰고 세션번호를 건드리지 않는다', () => {
    const r = computeFaceKey(CONFIRMED(42), false, false, 3);
    expect(r).toEqual({ faceKey: 'p42', nextSessionId: 3 });
  });

  it('같은 사람이 연속 확정되면 매번 동일한 키가 나온다(중복 무시 전제 조건)', () => {
    const r1 = computeFaceKey(CONFIRMED(7), false, false, 0);
    const r2 = computeFaceKey(CONFIRMED(7), false, false, r1.nextSessionId);
    expect(r1.faceKey).toBe(r2.faceKey);
  });

  it('naming 이 새로 시작될 때(false→true)만 세션번호가 올라간다', () => {
    const r = computeFaceKey(UNKNOWN_FACE, false, true, 0);
    expect(r).toEqual({ faceKey: 'unknown-1', nextSessionId: 1 });
  });

  it('이미 naming 중(true→true, reducer 중복무시 경로)이면 세션번호를 유지한다', () => {
    const r = computeFaceKey(UNKNOWN_FACE, true, true, 1);
    expect(r).toEqual({ faceKey: 'unknown-1', nextSessionId: 1 });
  });

  it('naming 종료(true→false, 예: NAMING_TIMEOUT)는 세션번호를 유지한다', () => {
    const r = computeFaceKey(NAMING_TIMEOUT, true, false, 1);
    expect(r).toEqual({ faceKey: 'unknown-1', nextSessionId: 1 });
  });

  it('회귀 재현: 세션1 타임아웃 후 시작된 세션2 는 세션1과 다른 키를 받는다', () => {

    const session1 = computeFaceKey(UNKNOWN_FACE, false, true, 0);
    expect(session1.faceKey).toBe('unknown-1');

    const afterTimeout = computeFaceKey(NAMING_TIMEOUT, true, false, session1.nextSessionId);
    expect(afterTimeout.nextSessionId).toBe(session1.nextSessionId);

    const session2 = computeFaceKey(UNKNOWN_FACE, false, true, afterTimeout.nextSessionId);
    expect(session2.faceKey).toBe('unknown-2');
    expect(session2.faceKey).not.toBe(session1.faceKey); 
  });
});
