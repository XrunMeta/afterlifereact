import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { CallTimingPanel } from '../CallTimingPanel';
import { useTimingConfigStore, TIMING_DEFAULTS, formatTimingEnv } from '../../../realtime/timingConfig';

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));
import * as Clipboard from 'expo-clipboard';

const renderPanel = (over: Partial<React.ComponentProps<typeof CallTimingPanel>> = {}) =>
  render(<CallTimingPanel onForceListen={() => {}} micOn={true} onToggleMic={() => {}} {...over} />);

describe('CallTimingPanel', () => {
  beforeEach(() => {
    useTimingConfigStore.setState({ ...TIMING_DEFAULTS });
    jest.clearAllMocks();
  });

  it('expands and steps a constant up', () => {
    const { getByText } = renderPanel();
    fireEvent.press(getByText(/tune/i));            
    fireEvent.press(getByText('sttEndpointMs +'));  
    expect(useTimingConfigStore.getState().sttEndpointMs).toBe(1600);
  });

  it('reset restores defaults', () => {
    useTimingConfigStore.getState().setField('sttEndpointMs', 800);
    const { getByText } = renderPanel();
    fireEvent.press(getByText(/tune/i));
    fireEvent.press(getByText('reset'));
    expect(useTimingConfigStore.getState().sttEndpointMs).toBe(1500);
  });

  it('force-listen button calls handler', () => {
    const onForceListen = jest.fn();
    const { getByText } = renderPanel({ onForceListen });
    fireEvent.press(getByText('지금 들어'));
    expect(onForceListen).toHaveBeenCalled();
  });

  it('confirm-gate switch toggles store value', () => {
    const { getByText, getByRole } = renderPanel();
    fireEvent.press(getByText(/tune/i));
    expect(useTimingConfigStore.getState().confirmGateEnabled).toBe(false);
    const sw = getByRole('switch');
    fireEvent(sw, 'valueChange', true);
    expect(useTimingConfigStore.getState().confirmGateEnabled).toBe(true);
    fireEvent(sw, 'valueChange', false);
    expect(useTimingConfigStore.getState().confirmGateEnabled).toBe(false);
  });

  it('mic-lock button reflects micOn state and toggles', () => {
    const onToggleMic = jest.fn();
    const { getByText, queryByText, rerender } = render(
      <CallTimingPanel onForceListen={() => {}} micOn={true} onToggleMic={onToggleMic} />,
    );

    fireEvent.press(getByText(/녹음ON/));
    expect(onToggleMic).toHaveBeenCalled();

    rerender(<CallTimingPanel onForceListen={() => {}} micOn={false} onToggleMic={onToggleMic} />);
    expect(queryByText(/녹음금지/)).toBeTruthy();
  });

  it('copy env button copies the current 4 values to clipboard and logs a backup', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const { getByText } = renderPanel();
    fireEvent.press(getByText(/tune/i));
    fireEvent.press(getByText('[copy env]'));
    const expected = formatTimingEnv({
      sttEndpointMs: TIMING_DEFAULTS.sttEndpointMs,
      echoGateMs: TIMING_DEFAULTS.echoGateMs,
      cloneResumeMs: TIMING_DEFAULTS.cloneResumeMs,
      cloneTailGraceMs: TIMING_DEFAULTS.cloneTailGraceMs,
    });
    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(expected);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[timing-env]'));
    logSpy.mockRestore();
  });

  it('copy env button shows and then clears an inline "copied" status (no Alert)', () => {
    jest.useFakeTimers();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const alertSpy = jest.spyOn(require('react-native/Libraries/Alert/Alert'), 'alert');
    const { getByText, queryByText } = renderPanel();
    fireEvent.press(getByText(/tune/i));
    fireEvent.press(getByText('[copy env]'));
    expect(queryByText('copied ✓')).toBeTruthy();
    expect(alertSpy).not.toHaveBeenCalled();
    act(() => { jest.advanceTimersByTime(2100); });
    expect(queryByText('copied ✓')).toBeFalsy();
    jest.useRealTimers();
    (console.log as jest.Mock).mockRestore?.();
  });
});
