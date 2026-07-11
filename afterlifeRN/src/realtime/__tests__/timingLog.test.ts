import { startTimingLog } from '../timingLog';
import { emitTimingEvent, clearTimingEvents, __setTimingClock } from '../timingEvents';

describe('timingLog', () => {
  beforeEach(() => { __setTimingClock(() => 0); clearTimingEvents(); });

  it('logs only newly emitted events with [Call][timing] prefix', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const stop = startTimingLog();      
    emitTimingEvent('stt_open');
    const logged = spy.mock.calls.filter((c) => c[0] === '[Call][timing]');
    expect(logged.length).toBe(1);
    expect(logged[0]).toContain('stt_open');
    stop();
    emitTimingEvent('stt_close');
    const after = spy.mock.calls.filter((c) => c[0] === '[Call][timing]');
    expect(after.length).toBe(1);       
    spy.mockRestore();
  });
});
