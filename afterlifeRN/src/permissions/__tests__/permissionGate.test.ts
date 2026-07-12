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
  it('denied → denied (재요청 가능으로 취급, blocked 판정은 history 기반 override 몫)', () => {
    expect(v_c1dff7('denied')).toBe('denied');
  });
  it('restricted → blocked', () => {
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
  it('denied + canAskAgain=true → denied(재요청 가능)', () => {
    expect(v_b5b955({ status: 'denied', canAskAgain: true })).toBe('denied');
  });
  it('denied + canAskAgain=false → blocked(영구 거부)', () => {
    expect(v_b5b955({ status: 'denied', canAskAgain: false })).toBe('blocked');
  });
});

describe('gateDecision', () => {
  it('camera+mic 모두 granted → pass', () => {
    const state: v_0bf4a6 = { camera: 'granted', mic: 'granted' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: true, canRequest: false, mustOpenSettings: false });
  });

  it('camera undetermined, mic granted → canRequest', () => {
    const state: v_0bf4a6 = { camera: 'undetermined', mic: 'granted' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, mustOpenSettings: false });
  });

  it('camera granted, mic denied → canRequest', () => {
    const state: v_0bf4a6 = { camera: 'granted', mic: 'denied' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, mustOpenSettings: false });
  });

  it('camera blocked, mic granted → mustOpenSettings', () => {
    const state: v_0bf4a6 = { camera: 'blocked', mic: 'granted' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: false, mustOpenSettings: true });
  });

  it('camera granted, mic blocked → mustOpenSettings', () => {
    const state: v_0bf4a6 = { camera: 'granted', mic: 'blocked' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: false, mustOpenSettings: true });
  });

  it('camera denied, mic blocked → canRequest 와 mustOpenSettings 둘 다 true(혼합 상태)', () => {
    const state: v_0bf4a6 = { camera: 'denied', mic: 'blocked' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, mustOpenSettings: true });
  });

  it('camera undetermined, mic blocked → canRequest 와 mustOpenSettings 둘 다 true', () => {
    const state: v_0bf4a6 = { camera: 'undetermined', mic: 'blocked' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, mustOpenSettings: true });
  });

  it('camera undetermined, mic undetermined → canRequest only', () => {
    const state: v_0bf4a6 = { camera: 'undetermined', mic: 'undetermined' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: true, mustOpenSettings: false });
  });

  it('camera blocked, mic blocked → mustOpenSettings only', () => {
    const state: v_0bf4a6 = { camera: 'blocked', mic: 'blocked' };
    expect(v_000b82(v_b6e533)).toEqual({ pass: false, canRequest: false, mustOpenSettings: true });
  });
});
