import { v_7347b3, v_183224, v_2e0251 } from '../timingConfig';

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
