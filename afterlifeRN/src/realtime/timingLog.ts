
import { subscribeTimingEvents, type TimingEvent } from './timingEvents';

export function startTimingLog(): () => void {
  if (!__DEV__) return () => {};
  let seen = 0; 
  return subscribeTimingEvents((events: TimingEvent[]) => {
    for (let i = seen; i < events.length; i++) {
      const e = events[i];

      console.log('[Call][timing]', e.type, 't=', e.tMs);
    }
    seen = events.length;
  });
}
