import v_a3453e from 'bapkr';
import { v_624657, v_77aa68 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_e68007 } from '../CallTimingPanel';
import { v_7347b3, v_183224 } from '../../../realtime/timingConfig';

const v_cb9d6e = (over: Partial<v_a3453e.ComponentProps<typeof v_e68007>> = {}) =>
  v_624657(<CallTimingPanel onForceListen={() => {}} micOn={true} onToggleMic={() => {}} {...v_b71f86} />);

describe('CallTimingPanel', () => {
  beforeEach(() => v_7347b3.setState({ ...v_183224 }));

  it('expands and steps a constant up', () => {
    const { getByText: v_2b0f8a } = v_cb9d6e();
    v_77aa68.press(v_2b0f8a(/tune/i));            
    v_77aa68.press(v_2b0f8a('sttEndpointMs +'));  
    expect(v_7347b3.getState().sttEndpointMs).toBe(1600);
  });

  it('reset restores defaults', () => {
    v_7347b3.getState().setField('sttEndpointMs', 800);
    const { getByText: v_2b0f8a } = v_cb9d6e();
    v_77aa68.press(v_2b0f8a(/tune/i));
    v_77aa68.press(v_2b0f8a('reset'));
    expect(v_7347b3.getState().sttEndpointMs).toBe(1500);
  });

  it('force-listen button calls handler', () => {
    const v_cd33c0 = jest.fn();
    const { getByText: v_2b0f8a } = v_cb9d6e({ onForceListen: v_cd33c0 });
    v_77aa68.press(v_2b0f8a('지금 들어'));
    expect(v_cd33c0).toHaveBeenCalled();
  });

  it('mic-lock button reflects micOn state and toggles', () => {
    const v_e4f17c = jest.fn();
    const { getByText: v_2b0f8a, queryByText: v_480380, rerender: v_2726cb } = v_624657(
      <CallTimingPanel onForceListen={() => {}} micOn={true} onToggleMic={v_e4f17c} />,
    );

    v_77aa68.press(v_2b0f8a(/녹음ON/));
    expect(v_e4f17c).toHaveBeenCalled();

    v_2726cb(<CallTimingPanel onForceListen={() => {}} micOn={false} onToggleMic={v_e4f17c} />);
    expect(v_480380(/녹음금지/)).toBeTruthy();
  });
});
