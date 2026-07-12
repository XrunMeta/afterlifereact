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
    });
  });

  it('overrides only the set fields, falls back the rest', () => {
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '900' });
    expect(result.sttEndpointMs).toBe(900);
    expect(result.echoGateMs).toBe(FALLBACK_TIMING_DEFAULTS.echoGateMs);
    expect(result.cloneResumeMs).toBe(FALLBACK_TIMING_DEFAULTS.cloneResumeMs);
    expect(result.cloneTailGraceMs).toBe(FALLBACK_TIMING_DEFAULTS.cloneTailGraceMs);
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
    const result2 = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: String(min - 9999) });
    expect(result2.cloneResumeMs).toBe(min);
  });

  it('resolves each field independently', () => {
    const result = resolveTimingDefaults({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '700' });
    expect(result.cloneResumeMs).toBe(700);
    expect(result.sttEndpointMs).toBe(FALLBACK_TIMING_DEFAULTS.sttEndpointMs);
    expect(result.echoGateMs).toBe(FALLBACK_TIMING_DEFAULTS.echoGateMs);
    expect(result.cloneTailGraceMs).toBe(FALLBACK_TIMING_DEFAULTS.cloneTailGraceMs);
  });
});

describe('formatTimingEnv', () => {
  it('formats exactly 4 EXPO_PUBLIC_TIMING_* lines', () => {
    const str = formatTimingEnv({
      sttEndpointMs: 1500,
      echoGateMs: 3500,
      cloneResumeMs: 600,
      cloneTailGraceMs: 1000,
    });
    expect(str).toBe(
      [
        'EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS=1500',
        'EXPO_PUBLIC_TIMING_ECHO_GATE_MS=3500',
        'EXPO_PUBLIC_TIMING_CLONE_RESUME_MS=600',
        'EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS=1000',
      ].join('\n'),
    );
  });
});
