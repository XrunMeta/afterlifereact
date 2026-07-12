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
    expect(v_fd5f43.sttEndpointMs).toBe(1500);
    expect(v_fd5f43.echoGateMs).toBe(3500);
    expect(v_fd5f43.cloneResumeMs).toBe(600);
    expect(v_fd5f43.cloneTailGraceMs).toBe(1000);
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
    expect(v_7347b3.getState().cloneResumeMs).toBe(600);
  });

  it('reset restores defaults', () => {
    v_7347b3.getState().setField('sttEndpointMs', 800);
    v_7347b3.getState().reset();
    expect(v_7347b3.getState().sttEndpointMs).toBe(1500);
  });
});

describe('resolveTimingDefaults', () => {
  const v_45d364 = {
    EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '900',
    EXPO_PUBLIC_TIMING_ECHO_GATE_MS: '4000',
    EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '700',
    EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS: '1200',
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
    });
  });

  it('overrides only the set fields, falls back the rest', () => {
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS: '900' });
    expect(v_43c42e.sttEndpointMs).toBe(900);
    expect(v_43c42e.echoGateMs).toBe(v_5c20ea.echoGateMs);
    expect(v_43c42e.cloneResumeMs).toBe(v_5c20ea.cloneResumeMs);
    expect(v_43c42e.cloneTailGraceMs).toBe(v_5c20ea.cloneTailGraceMs);
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
    const v_aa8b54 = v_1dd45a({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: String(v_43e24b - 9999) });
    expect(v_aa8b54.cloneResumeMs).toBe(v_43e24b);
  });

  it('resolves each field independently', () => {
    const v_43c42e = v_1dd45a({ EXPO_PUBLIC_TIMING_CLONE_RESUME_MS: '700' });
    expect(v_43c42e.cloneResumeMs).toBe(700);
    expect(v_43c42e.sttEndpointMs).toBe(v_5c20ea.sttEndpointMs);
    expect(v_43c42e.echoGateMs).toBe(v_5c20ea.echoGateMs);
    expect(v_43c42e.cloneTailGraceMs).toBe(v_5c20ea.cloneTailGraceMs);
  });
});

describe('formatTimingEnv', () => {
  it('formats exactly 4 EXPO_PUBLIC_TIMING_* lines', () => {
    const v_fba864 = v_d14be3({
      sttEndpointMs: 1500,
      echoGateMs: 3500,
      cloneResumeMs: 600,
      cloneTailGraceMs: 1000,
    });
    expect(v_fba864).toBe(
      [
        'EXPO_PUBLIC_TIMING_STT_ENDPOINT_MS=1500',
        'EXPO_PUBLIC_TIMING_ECHO_GATE_MS=3500',
        'EXPO_PUBLIC_TIMING_CLONE_RESUME_MS=600',
        'EXPO_PUBLIC_TIMING_CLONE_TAIL_GRACE_MS=1000',
      ].join('\n'),
    );
  });
});
