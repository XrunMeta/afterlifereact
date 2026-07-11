import React from 'react';
import { render, act } from '@testing-library/react-native';
import { CallTimingHUD } from '../CallTimingHUD';
import { emitTimingEvent, clearTimingEvents, __setTimingClock } from '../../../realtime/timingEvents';

describe('CallTimingHUD', () => {
  beforeEach(() => { __setTimingClock(() => 0); clearTimingEvents(); });

  it('renders DEV ONLY badge and latest events', () => {
    const { getByText, queryByText } = render(<CallTimingHUD />);
    expect(getByText('DEV ONLY')).toBeTruthy();
    act(() => { emitTimingEvent('speech_end'); });
    expect(queryByText(/speech_end/)).toBeTruthy();
  });
});
