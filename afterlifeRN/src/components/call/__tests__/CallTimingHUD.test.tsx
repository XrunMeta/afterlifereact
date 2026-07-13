import React from 'react';
import { render, act } from '@testing-library/react-native';
import { CallTimingHUD } from '../CallTimingHUD';
import { emitTimingEvent, clearTimingEvents, __setTimingClock } from '../../../realtime/timingEvents';
import { useTimingConfigStore, TIMING_DEFAULTS } from '../../../realtime/timingConfig';

describe('CallTimingHUD', () => {
  beforeEach(() => {
    __setTimingClock(() => 0);
    clearTimingEvents();
    useTimingConfigStore.setState({ ...TIMING_DEFAULTS });
  });

  it('renders DEV ONLY badge and latest events', () => {
    const { getByText, queryByText } = render(<CallTimingHUD />);
    expect(getByText('DEV ONLY')).toBeTruthy();
    act(() => { emitTimingEvent('speech_end'); });
    expect(queryByText(/speech_end/)).toBeTruthy();
  });

  it('renders the current 4 timing values as an always-visible summary line', () => {
    const { getByText } = render(<CallTimingHUD />);
    expect(getByText('stt:1500 echo:3500 res:600 tail:1000')).toBeTruthy();
  });

  it('summary line updates when the store changes', () => {
    const { getByText } = render(<CallTimingHUD />);
    act(() => { useTimingConfigStore.getState().setField('sttEndpointMs', 800); });
    expect(getByText('stt:800 echo:3500 res:600 tail:1000')).toBeTruthy();
  });
});
