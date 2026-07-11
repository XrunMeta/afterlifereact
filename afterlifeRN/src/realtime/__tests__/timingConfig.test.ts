import { useTimingConfigStore, TIMING_DEFAULTS, TIMING_BOUNDS } from '../timingConfig';

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
