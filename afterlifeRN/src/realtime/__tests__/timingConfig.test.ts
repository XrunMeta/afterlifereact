import {
  v_7347b3,
  v_183224,
  v_2e0251,
  v_5c20ea,
  v_1dd45a,
  v_d14be3,
} from '../timingConfig';

const v_487a25 = () => v_7347b3.setState({ ...v_183224 });

describe('timingConfig store', () => {
  beforeEach(v_487a25);

  it('defaults match current hardcoded values', () => {
    const v_fd5f43 = v_7347b3.getState();
    expect(v_fd5f43.sttEndpointMs).toBe(2500);
    expect(v_fd5f43.echoGateMs).toBe(3500);
    expect(v_fd5f43.cloneResumeMs).toBe(300);
    expect(v_fd5f43.cloneTailGraceMs).toBe(1000);
    expect(v_fd5f43.responseDoneTimeoutMs).toBe(45000);
  });

  it('setField updates one field', () => {
    v_7347b3.getState().setField('sttEndpointMs', 800);
    expect(v_7347b3.getState().sttEndpointMs).toBe(800);
  });

  it('setField clamps to bounds', () => {
    const { max: v_d2c6bf } = v_2e0251.echoGateMs;
    v_7347b3.getState().setField('echoGateMs', v_d2c6bf + 9999);
    expect(v_7347b3.getState().echoGateMs).toBe(v_d2c6bf);
    v_7347b3.getState().setField('echoGateMs', -50);
    expect(v_7347b3.getState().echoGateMs).toBe(v_2e0251.echoGateMs.min);
  });

  it('setField ignores non-finite values', () => {
    v_7347b3.getState().setField('cloneResumeMs', Number.NaN);
    expect(v_7347b3.getState().cloneResumeMs).toBe(300);
  });

  it('reset restores defaults', () => {
    v_7347b3.getState().setField('sttEndpointMs', 800);
    v_7347b3.getState().reset();
    expect(v_7347b3.getState().sttEndpointMs).toBe(2500);
  });
});

describe('resolveTimingDefaults', () => {
  const v_45d364 = {
    EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '900',
    EXPO_PUBLIC_TIMING_ECHO_GATE_MS: '4000',
    EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '700',
    EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS: '1200',
    EXPO_PUBLIC_TIMING_RESPONSE_DONE_TIMEOUT_MS: '60000',
  };

  it('falls back to hardcoded defaults when env unset', () => {
    expect(v_1dd45a({})).toEqual(v_5c20ea);
  });

  it('overrides all fields when env fully set', () => {
    expect(v_1dd45a(v_45d364)).toEqual({
      sttEndpointMs: 900,
      echoGateMs: 4000,
      cloneResumeMs: 700,
      cloneTailGraceMs: 1200,
      responseDoneTimeoutMs: 60000,
    });
  });

  it('overrides only the set fields, falls back the rest', () => {
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '900' });
    expect(v_43c42e.sttEndpointMs).toBe(900);
    expect(v_43c42e.echoGateMs).toBe(v_5c20ea.echoGateMs);
    expect(v_43c42e.cloneResumeMs).toBe(v_5c20ea.cloneResumeMs);
    expect(v_43c42e.cloneTailGraceMs).toBe(v_5c20ea.cloneTailGraceMs);
    expect(v_43c42e.responseDoneTimeoutMs).toBe(v_5c20ea.responseDoneTimeoutMs);
  });

  it('falls back on NaN and empty-string env values', () => {
    const v_43c42e = v_1dd45a({
      EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: 'not-a-number',
      EXPO_PUBLIC_TIMING_ECHO_GATE_MS: '',
    });
    expect(v_43c42e.sttEndpointMs).toBe(v_5c20ea.sttEndpointMs);
    expect(v_43c42e.echoGateMs).toBe(v_5c20ea.echoGateMs);
  });

  it('clamps out-of-range env values to TIMING_BOUNDS', () => {
    const { max: v_d2c6bf } = v_2e0251.echoGateMs;
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_ECHO_GATE_MS: String(v_d2c6bf + 9999) });
    expect(v_43c42e.echoGateMs).toBe(v_d2c6bf);

    const { min: v_43e24b } = v_2e0251.cloneResumeMs;
    const v_aa8b54 = v_1dd45a({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: String(Math.max(0, v_43e24b - 50)) });
    expect(v_aa8b54.cloneResumeMs).toBe(v_43e24b);
  });

  it('falls back (not clamps) on a negative-number env string, since it is not a pure integer', () => {
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '-50' });
    expect(v_43c42e.cloneResumeMs).toBe(v_5c20ea.cloneResumeMs);
  });

  it('resolves each field independently', () => {
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '700' });
    expect(v_43c42e.cloneResumeMs).toBe(700);
    expect(v_43c42e.sttEndpointMs).toBe(v_5c20ea.sttEndpointMs);
    expect(v_43c42e.echoGateMs).toBe(v_5c20ea.echoGateMs);
    expect(v_43c42e.cloneTailGraceMs).toBe(v_5c20ea.cloneTailGraceMs);
    expect(v_43c42e.responseDoneTimeoutMs).toBe(v_5c20ea.responseDoneTimeoutMs);
  });

  it('responseDoneTimeoutMs 기본 45000, ENV 오버라이드·clamp', () => {
    expect(v_5c20ea.responseDoneTimeoutMs).toBe(45000);
    expect(
      v_1dd45a({ EXPO_PUBLIC_TIMING_RESPONSE_DONE_TIMEOUT_MS: '20000' }).responseDoneTimeoutMs,
    ).toBe(20000);
    expect(v_1dd45a({ EXPO_PUBLIC_TIMING_RESPONSE_DONE_TIMEOUT_MS: '1' }).responseDoneTimeoutMs).toBe(
      5000,
    ); 
    expect(v_1dd45a({}).responseDoneTimeoutMs).toBe(45000);
  });

  it('falls back on partial-numeric strings that parseInt would silently truncate', () => {
    const v_2d1eeb = v_1dd45a({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '1.9e3' });
    expect(v_2d1eeb.sttEndpointMs).toBe(v_5c20ea.sttEndpointMs);
    const v_b96973 = v_1dd45a({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '1500abc' });
    expect(v_b96973.sttEndpointMs).toBe(v_5c20ea.sttEndpointMs);
    const v_9e1cdb = v_1dd45a({ EXPO_PUBLIC_TIMING_ECHO_GATE_MS: '2200px' });
    expect(v_9e1cdb.echoGateMs).toBe(v_5c20ea.echoGateMs);
  });

  it('accepts a pure integer string with surrounding whitespace (trimmed)', () => {
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_ECHO_GATE_MS: ' 2200 ' });
    expect(v_43c42e.echoGateMs).toBe(2200);
  });

  it('accepts "0" and clamps it up to the field minimum', () => {
    const { min: v_43e24b } = v_2e0251.cloneResumeMs;
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '0' });
    expect(v_43c42e.cloneResumeMs).toBe(v_43e24b);
  });

  it('does not hard-correct an invariant-violating env combination, but warns', () => {
    const v_863e30 = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const v_43c42e = v_1dd45a({
      EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '3000', 
      EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS: '200', 
    });
    expect(v_43c42e.cloneResumeMs).toBe(3000);
    expect(v_43c42e.cloneTailGraceMs).toBe(200);
    expect(v_43c42e.cloneResumeMs).toBeGreaterThanOrEqual(v_43c42e.cloneTailGraceMs);
    expect(v_863e30).toHaveBeenCalledTimes(1);
    expect(v_863e30).toHaveBeenCalledWith(
      expect.stringContaining('cloneResumeMs >= cloneTailGraceMs'),
      expect.objectContaining({ cloneResumeMs: 3000, cloneTailGraceMs: 200 }),
    );
    v_863e30.mockRestore();
  });

  it('does not warn when the invariant holds', () => {
    const v_863e30 = jest.spyOn(console, 'warn').mockImplementation(() => {});
    v_1dd45a({});
    expect(v_863e30).not.toHaveBeenCalled();
    v_863e30.mockRestore();
  });
});

describe('formatTimingEnv', () => {
  it('formats exactly 5 EXPO_PUBLIC_TIMING_* lines', () => {
    const v_fba864 = v_d14be3({
      sttEndpointMs: 1500,
      echoGateMs: 3500,
      cloneResumeMs: 600,
      cloneTailGraceMs: 1000,
      responseDoneTimeoutMs: 45000,
    });
    expect(v_fba864).toBe(
      [
        'EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS=1500',
        'EXPO_PUBLIC_TIMING_ECHO_GATE_MS=3500',
        'EXPO_PUBLIC_TIMING_CLONE_RESUME_MS=600',
        'EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS=1000',
        'EXPO_PUBLIC_TIMING_RESPONSE_DONE_TIMEOUT_MS=45000',
      ].join('\n'),
    );
  });
});
