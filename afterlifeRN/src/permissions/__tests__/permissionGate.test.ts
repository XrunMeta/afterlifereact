import {
  v_000b82,
  v_c1dff7,
  v_b5b955,
  type v_0bf4a6,
} from '../permissionGate';

describe('normalizeCameraStatus', () => {
  it('granted → granted', () => {
    expect(v_c1dff7('granted')).toBe('granted');
  });
  it('not-determined → undetermined', () => {
    expect(v_c1dff7('not-determined')).toBe('undetermined');
  });
  it('denied → denied (이력 휴리스틱 없음 — 항상 재요청 가능으로 취급)', () => {
    expect(v_c1dff7('denied')).toBe('denied');
  });
  it('restricted → blocked (명시적 케이스만, 표시용)', () => {
    expect(v_c1dff7('restricted')).toBe('blocked');
  });
});

describe('normalizeMicStatus', () => {
  it('granted → granted (canAskAgain 무관)', () => {
    expect(v_b5b955({ status: 'granted', canAskAgain: false })).toBe('granted');
  });
  it('undetermined → undetermined', () => {
    expect(v_b5b955({ status: 'undetermined', canAskAgain: true })).toBe('undetermined');
  });
  it('denied + canAskAgain=true → denied', () => {
    expect(v_b5b955({ status: 'denied', canAskAgain: true })).toBe('denied');
  });
  it('denied + canAskAgain=false(명시적 신호) → blocked', () => {
    expect(v_b5b955({ status: 'denied', canAskAgain: false })).toBe('blocked');
  });
  it('denied + canAskAgain 미제공(애매함) → blocked 강제 안 함, denied로만', () => {
    expect(v_b5b955({ status: 'denied' })).toBe('denied');
  });
});

describe('gateDecision', () => {
  it('camera+mic 모두 granted → pass, canRequest/showSettingsHint 모두 false', () => {
    const state: v_0bf4a6 = { camera: 'granted', mic: 'granted' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: true, canRequest: false, showSettingsHint: false });
  });

  it('camera undetermined, mic granted → !pass, canRequest+showSettingsHint 둘 다 true', () => {
    const state: v_0bf4a6 = { camera: 'undetermined', mic: 'granted' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, showSettingsHint: true });
  });

  it('camera granted, mic denied → !pass, canRequest+showSettingsHint 둘 다 true', () => {
    const state: v_0bf4a6 = { camera: 'granted', mic: 'denied' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, showSettingsHint: true });
  });

  it('camera blocked, mic granted → !pass 여도 canRequest 는 여전히 true(mustOpenSettings 강제 없음, false positive 방지)', () => {
    const state: v_0bf4a6 = { camera: 'blocked', mic: 'granted' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, showSettingsHint: true });
  });

  it('camera granted, mic blocked → 동일하게 canRequest+showSettingsHint 둘 다 true', () => {
    const state: v_0bf4a6 = { camera: 'granted', mic: 'blocked' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, showSettingsHint: true });
  });

  it('camera denied, mic blocked → canRequest+showSettingsHint 유지(탈출 경로 보장)', () => {
    const state: v_0bf4a6 = { camera: 'denied', mic: 'blocked' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, showSettingsHint: true });
  });

  it('camera blocked, mic blocked → 그래도 canRequest 는 true', () => {
    const state: v_0bf4a6 = { camera: 'blocked', mic: 'blocked' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, showSettingsHint: true });
  });

  it('camera undetermined, mic undetermined → canRequest+showSettingsHint 둘 다 true', () => {
    const state: v_0bf4a6 = { camera: 'undetermined', mic: 'undetermined' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, showSettingsHint: true });
  });
});
