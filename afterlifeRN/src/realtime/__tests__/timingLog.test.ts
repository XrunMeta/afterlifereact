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

  it('does NOT log the pre-existing buffer on subscribe (Critical regression)', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    emitTimingEvent('speech_start');
    emitTimingEvent('speech_end');
    const stop = startTimingLog(); 
    const loggedOnSubscribe = spy.mock.calls.filter((c) => c[0] === '[Call][timing]');
    expect(loggedOnSubscribe.length).toBe(0); 

    emitTimingEvent('stt_open'); 
    const logged = spy.mock.calls.filter((c) => c[0] === '[Call][timing]');
    expect(logged.length).toBe(1);
    expect(logged[0]).toContain('stt_open');

    stop();
    spy.mockRestore();
  });

  it('keeps logging past the 40-event ring-buffer cap (no permanent stop)', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    let t = 0;
    __setTimingClock(() => t);
    const stop = startTimingLog();

    for (let i = 0; i < 45; i++) {
      t = i;
      emitTimingEvent('vad_endpoint');
    }

    const logged = spy.mock.calls.filter((c) => c[0] === '[Call][timing]');
    expect(logged.length).toBe(45); 
    const last = logged[logged.length - 1];
    expect(last[3]).toBe(44); 

    stop();
    spy.mockRestore();
  });

  it('is a no-op when __DEV__ is false (no subscription created, no logs)', () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const originalDev = (global as any).__DEV__;
    (global as any).__DEV__ = false;
    const stop = startTimingLog();
    (global as any).__DEV__ = originalDev; 

    emitTimingEvent('stt_open');
    const logged = spy.mock.calls.filter((c) => c[0] === '[Call][timing]');
    expect(logged.length).toBe(0); 

    stop(); 
    spy.mockRestore();
  });
});
