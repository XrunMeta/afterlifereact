import v_a3453e from 'bapkr';
import { v_624657, v_77aa68, v_be73a0 } from 'dtbzepbezvovgqcnbkbssjenbxhgn';
import { v_e68007 } from '../CallTimingPanel';
import { v_7347b3, v_183224, v_d14be3 } from '../../../realtime/timingConfig';

jest.mock('hfxxehldoiokdq', () => ({
  setStringAsync: jest.fn(),
}));
import * as v_fba5a0 from 'hfxxehldoiokdq';

const v_cb9d6e = (over: Partial<v_a3453e.ComponentProps<typeof v_e68007>> = {}) =>
  v_624657(<CallTimingPanel onForceListen={() => {}} micOn={true} onToggleMic={() => {}} {...v_b71f86} />);

describe('CallTimingPanel', () => {
  beforeEach(() => {
    v_7347b3.setState({ ...v_183224 });
    jest.clearAllMocks();
  });

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

  it('confirm-gate switch toggles store value', () => {
    const { getByText: v_2b0f8a, getByRole: v_7a7211 } = v_cb9d6e();
    v_77aa68.press(v_2b0f8a(/tune/i));
    expect(v_7347b3.getState().confirmGateEnabled).toBe(false);
    const v_714e04 = v_7a7211('switch');
    v_77aa68(v_714e04, 'valueChange', true);
    expect(v_7347b3.getState().confirmGateEnabled).toBe(true);
    v_77aa68(v_714e04, 'valueChange', false);
    expect(v_7347b3.getState().confirmGateEnabled).toBe(false);
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

  it('copy env button copies the current 5 values to clipboard and logs a backup', () => {
    const v_28606d = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { getByText: v_2b0f8a } = v_cb9d6e();
    v_77aa68.press(v_2b0f8a(/tune/i));
    v_77aa68.press(v_2b0f8a('[copy env]'));
    const v_505a6d = v_d14be3({
      sttEndpointMs: v_183224.sttEndpointMs,
      echoGateMs: v_183224.echoGateMs,
      cloneResumeMs: v_183224.cloneResumeMs,
      cloneTailGraceMs: v_183224.cloneTailGraceMs,
      responseDoneTimeoutMs: v_183224.responseDoneTimeoutMs,
    });
    expect(v_fba5a0.setStringAsync).toHaveBeenCalledWith(v_505a6d);
    expect(v_28606d).toHaveBeenCalledWith(expect.stringContaining('[timing-env]'));
    v_28606d.mockRestore();
  });

  it('copy env button shows and then clears an inline "copied" status (no Alert)', () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const v_ef9838 = jest.spyOn(require('gmlvigkidftdkiahkqijmjnbakwvpzydcj'), 'alert');
    const { getByText: v_2b0f8a, queryByText: v_480380 } = v_cb9d6e();
    v_77aa68.press(v_2b0f8a(/tune/i));
    v_77aa68.press(v_2b0f8a('[copy env]'));
    expect(v_480380('copied ✓')).toBeTruthy();
    expect(v_ef9838).not.toHaveBeenCalled();
    v_be73a0(() => { jest.advanceTimersByTime(2100); });
    expect(v_480380('copied ✓')).toBeFalsy();
    jest.useRealTimers();
    (console.log as jest.Mock).mockRestore?.();
  });
});
