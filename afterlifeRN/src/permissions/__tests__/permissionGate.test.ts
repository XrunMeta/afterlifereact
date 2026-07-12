import {
  gateDecision,
  normalizeCameraStatus,
  normalizeMicStatus,
  type GateState,
} from '../permissionGate';

describe('normalizeCameraStatus', () => {
  it('granted → granted', () => {
    expect(normalizeCameraStatus('granted')).toBe('granted');
  });
  it('not-determined → undetermined', () => {
    expect(normalizeCameraStatus('not-determined')).toBe('undetermined');
  });
  it('denied → denied (재요청 가능으로 취급, blocked 판정은 history 기반 override 몫)', () => {
    expect(normalizeCameraStatus('denied')).toBe('denied');
  });
  it('restricted → blocked', () => {
    expect(normalizeCameraStatus('restricted')).toBe('blocked');
  });
});

describe('normalizeMicStatus', () => {
  it('granted → granted (canAskAgain 무관)', () => {
    expect(normalizeMicStatus({ status: 'granted', canAskAgain: false })).toBe('granted');
  });
  it('undetermined → undetermined', () => {
    expect(normalizeMicStatus({ status: 'undetermined', canAskAgain: true })).toBe('undetermined');
  });
  it('denied + canAskAgain=true → denied(재요청 가능)', () => {
    expect(normalizeMicStatus({ status: 'denied', canAskAgain: true })).toBe('denied');
  });
  it('denied + canAskAgain=false → blocked(영구 거부)', () => {
    expect(normalizeMicStatus({ status: 'denied', canAskAgain: false })).toBe('blocked');
  });
});

describe('gateDecision', () => {
  it('camera+mic 모두 granted → pass', () => {
    const state: GateState = { camera: 'granted', mic: 'granted' };
    expect(gateDecision(state)).toEqual({ pass: true, canRequest: false, mustOpenSettings: false });
  });

  it('camera undetermined, mic granted → canRequest', () => {
    const state: GateState = { camera: 'undetermined', mic: 'granted' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: true, mustOpenSettings: false });
  });

  it('camera granted, mic denied → canRequest', () => {
    const state: GateState = { camera: 'granted', mic: 'denied' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: true, mustOpenSettings: false });
  });

  it('camera blocked, mic granted → mustOpenSettings', () => {
    const state: GateState = { camera: 'blocked', mic: 'granted' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: false, mustOpenSettings: true });
  });

  it('camera granted, mic blocked → mustOpenSettings', () => {
    const state: GateState = { camera: 'granted', mic: 'blocked' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: false, mustOpenSettings: true });
  });

  it('camera denied, mic blocked → canRequest 와 mustOpenSettings 둘 다 true(혼합 상태)', () => {
    const state: GateState = { camera: 'denied', mic: 'blocked' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: true, mustOpenSettings: true });
  });

  it('camera undetermined, mic blocked → canRequest 와 mustOpenSettings 둘 다 true', () => {
    const state: GateState = { camera: 'undetermined', mic: 'blocked' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: true, mustOpenSettings: true });
  });

  it('camera undetermined, mic undetermined → canRequest only', () => {
    const state: GateState = { camera: 'undetermined', mic: 'undetermined' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: true, mustOpenSettings: false });
  });

  it('camera blocked, mic blocked → mustOpenSettings only', () => {
    const state: GateState = { camera: 'blocked', mic: 'blocked' };
    expect(gateDecision(state)).toEqual({ pass: false, canRequest: false, mustOpenSettings: true });
  });
});
