import {
  useTimingConfigStore,
  TIMING_DEFAULTS,
  TIMING_BOUNDS,
  FALLBACK_TIMING_DEFAULTS,
  resolveTimingDefaults,
  formatTimingEnv,
} from '../timingConfig';

const reset = () => useTimingConfigStore.setState({ ...TIMING_DEFAULTS });

describe('timingConfig store', () => {
  beforeEach(reset);

  it('defaults match current hardcoded values', () => {
    const s = useTimingConfigStore.getState();
    expect(s.sttEndpointMs).toBe(1500);
    expect(s.echoGateMs).toBe(3500);
    expect(s.cloneResumeMs).toBe(600);
    expect(s.cloneTailGraceMs).toBe(1000);
    expect(s.responseDoneTimeoutMs).toBe(45000);
  });

  it('setField updates one field', () => {
    useTimingConfigStore.getState().setField('sttEndpointMs', 800);
    expect(useTimingConfigStore.getState().sttEndpointMs).toBe(800);
  });

  it('setField clamps to bounds', () => {
    const { max } = TIMING_BOUNDS.echoGateMs;
    useTimingConfigStore.getState().setField('echoGateMs', max + 9999);
    expect(useTimingConfigStore.getState().echoGateMs).toBe(max);
    useTimingConfigStore.getState().setField('echoGateMs', -50);
    expect(useTimingConfigStore.getState().echoGateMs).toBe(TIMING_BOUNDS.echoGateMs.min);
  });

  it('setField ignores non-finite values', () => {
    useTimingConfigStore.getState().setField('cloneResumeMs', Number.NaN);
    expect(useTimingConfigStore.getState().cloneResumeMs).toBe(600);
  });

  it('reset restores defaults', () => {
    useTimingConfigStore.getState().setField('sttEndpointMs', 800);
    useTimingConfigStore.getState().reset();
    expect(useTimingConfigStore.getState().sttEndpointMs).toBe(1500);
  });
});

describe('resolveTimingDefaults', () => {
  const ENV_ALL = {
    EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '900',
    EXPO_PUBLIC_TIMING_ECHO_GATE_MS: '4000',
    EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '700',
    EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS: '1200',
    EXPO_PUBLIC_TIMING_RESPONSE_DONE_TIMEOUT_MS: '60000',
  };

  it('falls back to hardcoded defaults when env unset', () => {
    expect(resolveTimingDefaults({})).toEqual(FALLBACK_TIMING_DEFAULTS);
  });

  it('overrides all fields when env fully set', () => {
    expect(resolveTimingDefaults(ENV_ALL)).toEqual({
      sttEndpointMs: 900,
      echoGateMs: 4000,
      cloneResumeMs: 700,
      cloneTailGraceMs: 1200,
      responseDoneTimeoutMs: 60000,
    });
  });

  it('overrides only the set fields, falls back the rest', () => {
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '900' });
    expect(result.sttEndpointMs).toBe(900);
    expect(result.echoGateMs).toBe(FALLBACK_TIMING_DEFAULTS.echoGateMs);
    expect(result.cloneResumeMs).toBe(FALLBACK_TIMING_DEFAULTS.cloneResumeMs);
    expect(result.cloneTailGraceMs).toBe(FALLBACK_TIMING_DEFAULTS.cloneTailGraceMs);
    expect(result.responseDoneTimeoutMs).toBe(FALLBACK_TIMING_DEFAULTS.responseDoneTimeoutMs);
  });

  it('falls back on NaN and empty-string env values', () => {
    const result = resolveTimingDefaults({
      EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: 'not-a-number',
      EXPO_PUBLIC_TIMING_ECHO_GATE_MS: '',
    });
    expect(result.sttEndpointMs).toBe(FALLBACK_TIMING_DEFAULTS.sttEndpointMs);
    expect(result.echoGateMs).toBe(FALLBACK_TIMING_DEFAULTS.echoGateMs);
  });

  it('clamps out-of-range env values to TIMING_BOUNDS', () => {
    const { max } = TIMING_BOUNDS.echoGateMs;
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_ECHO_GATE_MS: String(max + 9999) });
    expect(result.echoGateMs).toBe(max);

    const { min } = TIMING_BOUNDS.cloneResumeMs;
    const result2 = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: String(Math.max(0, min - 50)) });
    expect(result2.cloneResumeMs).toBe(min);
  });

  it('falls back (not clamps) on a negative-number env string, since it is not a pure integer', () => {
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '-50' });
    expect(result.cloneResumeMs).toBe(FALLBACK_TIMING_DEFAULTS.cloneResumeMs);
  });

  it('resolves each field independently', () => {
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '700' });
    expect(result.cloneResumeMs).toBe(700);
    expect(result.sttEndpointMs).toBe(FALLBACK_TIMING_DEFAULTS.sttEndpointMs);
    expect(result.echoGateMs).toBe(FALLBACK_TIMING_DEFAULTS.echoGateMs);
    expect(result.cloneTailGraceMs).toBe(FALLBACK_TIMING_DEFAULTS.cloneTailGraceMs);
    expect(result.responseDoneTimeoutMs).toBe(FALLBACK_TIMING_DEFAULTS.responseDoneTimeoutMs);
  });

  it('responseDoneTimeoutMs 기본 45000, ENV 오버라이드·clamp', () => {
    expect(FALLBACK_TIMING_DEFAULTS.responseDoneTimeoutMs).toBe(45000);
    expect(
      resolveTimingDefaults({ EXPO_PUBLIC_TIMING_RESPONSE_DONE_TIMEOUT_MS: '20000' }).responseDoneTimeoutMs,
    ).toBe(20000);
    expect(resolveTimingDefaults({ EXPO_PUBLIC_TIMING_RESPONSE_DONE_TIMEOUT_MS: '1' }).responseDoneTimeoutMs).toBe(
      5000,
    ); 
    expect(resolveTimingDefaults({}).responseDoneTimeoutMs).toBe(45000);
  });

  it('falls back on partial-numeric strings that parseInt would silently truncate', () => {
    const r1 = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '1.9e3' });
    expect(r1.sttEndpointMs).toBe(FALLBACK_TIMING_DEFAULTS.sttEndpointMs);
    const r2 = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '1500abc' });
    expect(r2.sttEndpointMs).toBe(FALLBACK_TIMING_DEFAULTS.sttEndpointMs);
    const r3 = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_ECHO_GATE_MS: '2200px' });
    expect(r3.echoGateMs).toBe(FALLBACK_TIMING_DEFAULTS.echoGateMs);
  });

  it('accepts a pure integer string with surrounding whitespace (trimmed)', () => {
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_ECHO_GATE_MS: ' 2200 ' });
    expect(result.echoGateMs).toBe(2200);
  });

  it('accepts "0" and clamps it up to the field minimum', () => {
    const { min } = TIMING_BOUNDS.cloneResumeMs;
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '0' });
    expect(result.cloneResumeMs).toBe(min);
  });

  it('does not hard-correct an invariant-violating env combination, but warns', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const result = resolveTimingDefaults({
      EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '3000', 
      EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS: '200', 
    });
    expect(result.cloneResumeMs).toBe(3000);
    expect(result.cloneTailGraceMs).toBe(200);
    expect(result.cloneResumeMs).toBeGreaterThanOrEqual(result.cloneTailGraceMs);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('cloneResumeMs >= cloneTailGraceMs'),
      expect.objectContaining({ cloneResumeMs: 3000, cloneTailGraceMs: 200 }),
    );
    warnSpy.mockRestore();
  });

  it('does not warn when the invariant holds', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    resolveTimingDefaults({});
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

describe('formatTimingEnv', () => {
  it('formats exactly 5 EXPO_PUBLIC_TIMING_* lines', () => {
    const str = formatTimingEnv({
      sttEndpointMs: 1500,
      echoGateMs: 3500,
      cloneResumeMs: 600,
      cloneTailGraceMs: 1000,
      responseDoneTimeoutMs: 45000,
    });
    expect(str).toBe(
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
