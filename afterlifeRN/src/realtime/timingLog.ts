

import { subscribeTimingEvents, type TimingEvent } from './timingEvents';

export function startTimingLog(): () => void {
  if (!__DEV__) return () => {};
  let first = true; 
  return subscribeTimingEvents((events: TimingEvent[]) => {
    if (first) {
      first = false;
      return;
    }
    const e = events[events.length - 1];
    if (!e) return; 

    console.log('[Call][timing]', e.type, 't=', e.tMs);
  });
}
