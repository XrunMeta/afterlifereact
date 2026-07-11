import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CallTimingPanel } from '../CallTimingPanel';
import { useTimingConfigStore, TIMING_DEFAULTS } from '../../../realtime/timingConfig';

describe('CallTimingPanel', () => {
  beforeEach(() => useTimingConfigStore.setState({ ...TIMING_DEFAULTS }));

  it('expands and steps a constant up', () => {
    const { getByText } = render(<CallTimingPanel onForceListen={() => {}} />);
    fireEvent.press(getByText(/tune/i));            
    fireEvent.press(getByText('sttEndpointMs +'));  
    expect(useTimingConfigStore.getState().sttEndpointMs).toBe(1600);
  });

  it('reset restores defaults', () => {
    useTimingConfigStore.getState().setField('sttEndpointMs', 800);
    const { getByText } = render(<CallTimingPanel onForceListen={() => {}} />);
    fireEvent.press(getByText(/tune/i));
    fireEvent.press(getByText('reset'));
    expect(useTimingConfigStore.getState().sttEndpointMs).toBe(1500);
  });

  it('force-listen button calls handler', () => {
    const onForceListen = jest.fn();
    const { getByText } = render(<CallTimingPanel onForceListen={onForceListen} />);
    fireEvent.press(getByText('지금 들어'));
    expect(onForceListen).toHaveBeenCalled();
  });
});
