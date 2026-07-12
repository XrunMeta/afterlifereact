import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CallTimingPanel } from '../CallTimingPanel';
import { useTimingConfigStore, TIMING_DEFAULTS } from '../../../realtime/timingConfig';

const renderPanel = (over: Partial<React.ComponentProps<typeof CallTimingPanel>> = {}) =>
  render(<CallTimingPanel onForceListen={() => {}} micOn={true} onToggleMic={() => {}} {...over} />);

describe('CallTimingPanel', () => {
  beforeEach(() => useTimingConfigStore.setState({ ...TIMING_DEFAULTS }));

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
});
